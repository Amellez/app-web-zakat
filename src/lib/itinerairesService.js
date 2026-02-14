import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  where,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { geocodeMultiple } from './geocoding';
import {
  creerClusters,
  optimiserOrdreVisite,
  calculerStatistiquesItineraire,
  genererNomItineraire
} from './routeOptimizer';

/**
 * Géolocalise les bénéficiaires et retourne un mapping des coordonnées
 */
export async function geolocaliserBeneficiaires(beneficiaires, mosqueeId, onProgress) {
  try {
    if (!mosqueeId) {
      throw new Error('mosqueeId requis pour la géolocalisation');
    }

    // Filtrer ceux qui n'ont pas encore de coords
    const benefsSansCoords = beneficiaires.filter(b =>
      !b.coords || !b.coords.lat || !b.coords.lng
    );

    console.log(`📍 Total bénéficiaires: ${beneficiaires.length}`);
    console.log(`📍 Sans coordonnées: ${benefsSansCoords.length}`);

    if (benefsSansCoords.length === 0) {
      console.log('✅ Tous les bénéficiaires ont déjà des coordonnées');
      return { success: true, count: 0, coordsMap: {} };
    }

    // Préparer les adresses pour géolocalisation
    const adresses = benefsSansCoords.map(b => ({
      id: b.id,
      adresse: b.adresse
    }));

    console.log(`🌍 Début géolocalisation de ${adresses.length} adresses...`);

    // Géolocaliser
    const results = await geocodeMultiple(adresses, onProgress);

    // Sauvegarder les coordonnées dans Firestore + construire coordsMap
    let count = 0;
    const coordsMap = {};

    for (const result of results) {
      if (result.coords && result.coords.lat && result.coords.lng) {
        try {
          const docRef = doc(db, 'beneficiaires', result.id);
          await updateDoc(docRef, {
            coords: result.coords,
            dateGeolocalisation: new Date().toISOString()
          });

          coordsMap[result.id] = result.coords;
          console.log(`✅ Coords sauvegardées pour ${result.id}`);
          count++;
        } catch (error) {
          console.error(`❌ Erreur sauvegarde coords pour ${result.id}:`, error);
        }
      }
    }

    console.log(`✅ ${count}/${benefsSansCoords.length} coordonnées sauvegardées dans Firestore`);

    return {
      success: true,
      count,
      coordsMap
    };
  } catch (error) {
    console.error('❌ Erreur géolocalisation:', error);
    return { success: false, count: 0, coordsMap: {}, error: error.message };
  }
}

/**
 * Génère les itinéraires automatiquement
 */
export async function genererItinerairesAutomatiques(beneficiaires, mosqueeId, options = {}) {
  try {
    if (!mosqueeId) {
      throw new Error('mosqueeId requis pour la génération d\'itinéraires');
    }

    const { rayonKm = 3, forceRegeneration = false } = options;

    console.log('🚀 === DÉBUT GÉNÉRATION ITINÉRAIRES ===');
    console.log(`📍 MosqueeId: ${mosqueeId}`);
    console.log(`📏 Rayon clustering: ${rayonKm}km`);
    console.log(`🔄 Force régénération: ${forceRegeneration}`);

    // Si forceRegeneration, réinitialiser tous les itinéraires
    if (forceRegeneration) {
      console.log('🔄 Réinitialisation des itinéraires existants...');
      await supprimerTousLesItineraires(mosqueeId);
    }

    // ✅ Récupérer et géolocaliser l'adresse de la mosquée
    console.log('🕌 Récupération des coordonnées de la mosquée...');
    let coordsMosquee = null;

    try {
      const mosqueeDoc = await getDoc(doc(db, 'mosquees', mosqueeId));

      if (mosqueeDoc.exists()) {
        const mosqueeData = mosqueeDoc.data();

        // Vérifier si la mosquée a déjà des coordonnées
        if (mosqueeData.coords && mosqueeData.coords.lat && mosqueeData.coords.lng) {
          coordsMosquee = mosqueeData.coords;
          console.log('✅ Coordonnées mosquée déjà disponibles');
        } else if (mosqueeData.adresse) {
          // Géolocaliser l'adresse de la mosquée
          console.log(`🌍 Géolocalisation de la mosquée: ${mosqueeData.adresse}`);
          const { geocodeAdresseUnique } = await import('./geocoding');
          coordsMosquee = await geocodeAdresseUnique(mosqueeData.adresse);

          if (coordsMosquee) {
            // ✅ CORRECTION : Try-catch pour la sauvegarde des coords mosquée
            try {
              await updateDoc(doc(db, 'mosquees', mosqueeId), {
                coords: coordsMosquee,
                dateGeolocalisation: new Date().toISOString()
              });
              console.log('✅ Coordonnées mosquée sauvegardées');
            } catch (updateError) {
              console.warn('⚠️ Impossible de sauvegarder les coords de la mosquée (permissions insuffisantes)');
              console.log('ℹ️ Les coordonnées seront utilisées pour cette génération uniquement');
            }
          } else {
            console.warn('⚠️ Impossible de géolocaliser la mosquée');
          }
        }
      } else {
        console.warn('⚠️ Document mosquée non trouvé');
      }
    } catch (mosqueeError) {
      console.warn('⚠️ Erreur lors de la récupération de la mosquée:', mosqueeError.message);
      console.log('ℹ️ Génération des itinéraires sans coordonnées de mosquée');
    }

    // 1. Filtrer les bénéficiaires éligibles
    const benefsEligibles = beneficiaires.filter(b =>
      (b.statut === 'Pack Attribué' || b.statut === 'Validé') &&
      (!b.itineraireId || forceRegeneration) &&
      b.mosqueeId === mosqueeId
    );

    console.log(`👥 Bénéficiaires éligibles: ${benefsEligibles.length}`);

    if (benefsEligibles.length === 0) {
      throw new Error('Aucun bénéficiaire éligible pour les itinéraires');
    }

    // 2. Vérifier que tous ont des coordonnées
    const benefsAvecCoords = benefsEligibles.filter(b =>
      b.coords && b.coords.lat && b.coords.lng
    );

    console.log(`📍 Avec coordonnées GPS: ${benefsAvecCoords.length}`);

    if (benefsAvecCoords.length === 0) {
      throw new Error('Aucun bénéficiaire géolocalisé. Vérifiez les coordonnées GPS.');
    }

    // 3. Créer les clusters
    console.log('🎯 Clustering...');
    const clusters = creerClusters(benefsAvecCoords, rayonKm, 1);

    if (!clusters || clusters.length === 0) {
      throw new Error('Erreur algorithme de clustering');
    }

    console.log(`✅ ${clusters.length} clusters créés`);

    // 4. Récupérer les codes existants
    const itinerairesExistants = await getItineraires(mosqueeId);
    const codesExistants = itinerairesExistants.map(it => it.codeUnique).filter(Boolean);

    // 5. Optimiser chaque cluster et créer les itinéraires
    const itineraires = [];
    const { genererCodeUniqueNonUtilise } = await import('./codeGenerator');

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];

      // Optimiser l'ordre en passant les coordonnées de la mosquée
      const clusterOptimise = optimiserOrdreVisite(cluster, coordsMosquee);

      // Calculer les statistiques avec les coordonnées de la mosquée
      const stats = calculerStatistiquesItineraire(clusterOptimise, coordsMosquee);

      // Générer le nom
      const nom = genererNomItineraire(clusterOptimise, i);

      // Générer un code unique
      const codeUnique = genererCodeUniqueNonUtilise([
        ...codesExistants,
        ...itineraires.map(it => it.codeUnique)
      ]);

      // Créer l'objet itinéraire
      const itineraire = {
        nom,
        mosqueeId: mosqueeId,
        codeUnique,
        statut: 'Non assigné',
        beneficiaires: clusterOptimise.map(b => ({
        id: b.id,
        nom: b.nom,
        adresse: b.adresse,
        telephone: b.telephone,
        nbPersonnes: b.nbPersonnes,
        tailleFamille: b.tailleFamille,
        coords: b.coords,
        packId: b.packId,
        packSupplementId: b.packSupplementId,
        statutLivraison: 'En attente',
        raisonEchec: null // ✅ NOUVEAU
        })),
        statistiques: stats, // Contient distanceDepuisMosquee et distanceTotale
        dateCreation: new Date().toISOString(),
        dateModification: new Date().toISOString()
      };

      itineraires.push(itineraire);
    }

    // 6. Sauvegarder les itinéraires dans Firestore
    console.log('💾 Sauvegarde des itinéraires...');

    const itinerairesIds = [];
    for (const itineraire of itineraires) {
      const docRef = await addDoc(collection(db, 'itineraires'), itineraire);
      itinerairesIds.push(docRef.id);
      console.log(`✅ Itinéraire créé: ${docRef.id}`);
    }

    // 7. Mettre à jour les bénéficiaires avec leur itineraireId
    console.log('🔗 Liaison bénéficiaires ↔ itinéraires...');

    let benefsAssignes = 0;
    for (let i = 0; i < itineraires.length; i++) {
      const itineraireId = itinerairesIds[i];
      const beneficiaires = itineraires[i].beneficiaires;

      for (const benef of beneficiaires) {
        try {
          const benefDocRef = doc(db, 'beneficiaires', benef.id);
          await updateDoc(benefDocRef, {
            itineraireId: itineraireId,
            dateAssignationItineraire: new Date().toISOString()
          });
          benefsAssignes++;
        } catch (error) {
          console.error(`❌ Erreur assignation ${benef.id}:`, error);
        }
      }
    }

    console.log(`✅ ${benefsAssignes} bénéficiaires assignés`);
    console.log('✅ === GÉNÉRATION TERMINÉE ===');

    return {
      success: true,
      nombreItineraires: itineraires.length,
      nombreBeneficiaires: benefsAssignes
    };

  } catch (error) {
    console.error('❌ Erreur génération itinéraires:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Récupère les itinéraires filtrés par mosquée
 */
export async function getItineraires(mosqueeId) {
  try {
    let q;

    if (mosqueeId && mosqueeId !== 'ALL') {
      q = query(collection(db, 'itineraires'), where('mosqueeId', '==', mosqueeId));
    } else {
      q = collection(db, 'itineraires');
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erreur récupération itinéraires:', error);
    throw error;
  }
}

/**
 * Écoute les changements en temps réel
 */
export function ecouterItineraires(callback, mosqueeId) {
  let q;

  if (mosqueeId && mosqueeId !== 'ALL') {
    q = query(collection(db, 'itineraires'), where('mosqueeId', '==', mosqueeId));
  } else {
    q = collection(db, 'itineraires');
  }

  return onSnapshot(q, (snapshot) => {
    const itineraires = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(itineraires);
  });
}

/**
 * Récupère un itinéraire par son code unique
 */
export async function getItineraireParCode(codeUnique) {
  try {
    const q = query(
      collection(db, 'itineraires'),
      where('codeUnique', '==', codeUnique)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Erreur récupération itinéraire par code:', error);
    throw error;
  }
}

/**
 * ✅ MODIFIÉ : Met à jour le statut de livraison d'un bénéficiaire avec raison d'échec optionnelle
 */
export async function updateStatutLivraison(itineraireId, beneficiaireId, nouveauStatut, raisonEchec = null) {
  try {
    const docRef = doc(db, 'itineraires', itineraireId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Itinéraire non trouvé');
    }

    const itineraire = docSnap.data();

    // Mettre à jour le statut du bénéficiaire
    const beneficiairesUpdates = itineraire.beneficiaires.map(b => {
      if (b.id === beneficiaireId) {
        return {
          ...b,
          statutLivraison: nouveauStatut,
          dateLivraison: nouveauStatut === 'Livré' ? new Date().toISOString() : null,
          raisonEchec: nouveauStatut === 'Échec' ? raisonEchec : null // ✅ NOUVEAU
        };
      }
      return b;
    });

    // Sauvegarder
    await updateDoc(docRef, {
      beneficiaires: beneficiairesUpdates,
      dateModification: new Date().toISOString()
    });

    // Mettre à jour le bénéficiaire dans sa collection
    if (nouveauStatut === 'Livré') {
      const benefDocRef = doc(db, 'beneficiaires', beneficiaireId);
      await updateDoc(benefDocRef, {
        statut: 'Livré',
        dateLivraison: new Date().toISOString()
      });
    }

    console.log(`✅ Statut livraison mis à jour: ${beneficiaireId} → ${nouveauStatut}`);
    return { success: true };
  } catch (error) {
    console.error('Erreur mise à jour statut livraison:', error);
    throw error;
  }
}

/**
 * Met à jour le statut d'un itinéraire
 */
export async function updateStatutItineraire(itineraireId, statut, mosqueeId) {
  try {
    const docRef = doc(db, 'itineraires', itineraireId);
    await updateDoc(docRef, {
      statut,
      dateModification: new Date().toISOString()
    });

    console.log(`✅ Statut itinéraire ${itineraireId} mis à jour: ${statut}`);
    return { success: true };
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    throw error;
  }
}

/**
 * Supprime un itinéraire
 */
export async function supprimerItineraire(itineraireId, beneficiairesIds, mosqueeId) {
  try {
    // Réinitialiser les bénéficiaires
    for (const benefId of beneficiairesIds) {
      const benefDocRef = doc(db, 'beneficiaires', benefId);
      await updateDoc(benefDocRef, {
        itineraireId: null,
        dateAssignationItineraire: null
      });
    }

    // ✅ NOUVEAU : Mettre à jour les secteurs
    const { getClusters, updateDoc: updateClusterDoc } = await import('./clustersService');
    const clusters = await getClusters(mosqueeId);

    for (const cluster of clusters) {
      let needsUpdate = false;
      const beneficiairesUpdates = cluster.beneficiaires.map(b => {
        if (beneficiairesIds.includes(b.id) && b.itineraireId === itineraireId) {
          needsUpdate = true;
          return {
            ...b,
            estAssigne: false,
            itineraireId: null,
            dateAssignation: null
          };
        }
        return b;
      });

      if (needsUpdate) {
        const clusterDocRef = doc(db, 'clusters', cluster.id);
        await updateDoc(clusterDocRef, {
          beneficiaires: beneficiairesUpdates,
          dateModification: new Date().toISOString()
        });

        // Mettre à jour le statut du cluster
        const { updateStatutCluster } = await import('./clustersService');
        await updateStatutCluster(cluster.id);

        console.log(`✅ Secteur ${cluster.id} mis à jour après suppression itinéraire`);
      }
    }

    // Supprimer l'itinéraire
    await deleteDoc(doc(db, 'itineraires', itineraireId));

    console.log(`✅ Itinéraire ${itineraireId} supprimé`);
    return { success: true };
  } catch (error) {
    console.error('Erreur suppression itinéraire:', error);
    throw error;
  }
}

/**
 * Supprime tous les itinéraires d'une mosquée
 */
export async function supprimerTousLesItineraires(mosqueeId) {
  try {
    if (!mosqueeId || mosqueeId === 'ALL') {
      throw new Error('Vous devez spécifier une mosquée');
    }

    console.log(`🗑️ Suppression de tous les itinéraires de ${mosqueeId}...`);

    // Récupérer tous les itinéraires de cette mosquée
    const itineraires = await getItineraires(mosqueeId);

    // Réinitialiser tous les bénéficiaires
    const allBeneficiairesIds = itineraires.flatMap(it =>
      it.beneficiaires.map(b => b.id)
    );

    for (const benefId of allBeneficiairesIds) {
      try {
        const benefDocRef = doc(db, 'beneficiaires', benefId);
        await updateDoc(benefDocRef, {
          itineraireId: null,
          dateAssignationItineraire: null
        });
      } catch (error) {
        console.error(`Erreur réinitialisation bénéficiaire ${benefId}:`, error);
      }
    }

    // ✅ NOUVEAU : Mettre à jour tous les secteurs
    const { getClusters } = await import('./clustersService');
    const clusters = await getClusters(mosqueeId);

    for (const cluster of clusters) {
      let needsUpdate = false;
      const beneficiairesUpdates = cluster.beneficiaires.map(b => {
        if (allBeneficiairesIds.includes(b.id) && b.estAssigne) {
          needsUpdate = true;
          return {
            ...b,
            estAssigne: false,
            itineraireId: null,
            dateAssignation: null
          };
        }
        return b;
      });

      if (needsUpdate) {
        const clusterDocRef = doc(db, 'clusters', cluster.id);
        await updateDoc(clusterDocRef, {
          beneficiaires: beneficiairesUpdates,
          dateModification: new Date().toISOString()
        });

        // Mettre à jour le statut du cluster
        const { updateStatutCluster } = await import('./clustersService');
        await updateStatutCluster(cluster.id);

        console.log(`✅ Secteur ${cluster.id} mis à jour après suppression itinéraires`);
      }
    }

    // Supprimer tous les itinéraires
    const batch = writeBatch(db);
    itineraires.forEach(it => {
      const docRef = doc(db, 'itineraires', it.id);
      batch.delete(docRef);
    });
    await batch.commit();

    console.log(`✅ ${itineraires.length} itinéraires supprimés`);
    return { success: true };
  } catch (error) {
    console.error('Erreur suppression:', error);
    throw error;
  }
}
