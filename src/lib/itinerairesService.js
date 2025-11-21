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
 * 🔥 CORRIGÉ : Géolocalise les bénéficiaires et SAUVEGARDE les coords dans Firestore
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
      return { success: true, count: 0 };
    }

    // Préparer les adresses pour géolocalisation
    const adresses = benefsSansCoords.map(b => ({
      id: b.id,
      adresse: b.adresse
    }));

    console.log(`🌍 Début géolocalisation de ${adresses.length} adresses...`);

    // Géolocaliser avec l'API française
    const results = await geocodeMultiple(adresses, onProgress);

    // ✅ CRUCIAL : Sauvegarder les coordonnées dans Firestore
    let count = 0;
    for (const result of results) {
      if (result.coords && result.coords.lat && result.coords.lng) {
        try {
          const docRef = doc(db, 'beneficiaires', result.id);
          await updateDoc(docRef, {
            coords: result.coords,
            dateGeolocalisation: new Date().toISOString()
          });
          console.log(`✅ Coords sauvegardées pour ${result.id}`);
          count++;
        } catch (error) {
          console.error(`❌ Erreur sauvegarde coords pour ${result.id}:`, error);
        }
      }
    }

    console.log(`✅ ${count}/${benefsSansCoords.length} coordonnées sauvegardées dans Firestore`);

    return { success: true, count };
  } catch (error) {
    console.error('❌ Erreur géolocalisation:', error);
    return { success: false, count: 0, error: error.message };
  }
}

/**
 * 🔥 MODIFIÉ : Génère les itinéraires avec option forceRegeneration
 */
export async function genererItinerairesAutomatiques(beneficiaires, mosqueeId, options = {}) {
  try {
    if (!mosqueeId) {
      throw new Error('mosqueeId requis pour la génération d\'itinéraires');
    }

    const { rayonKm = 3, forceRegeneration = false } = options; // 🔥 Ajout forceRegeneration

    console.log('🚀 === DÉBUT GÉNÉRATION ITINÉRAIRES ===');
    console.log(`📍 MosqueeId: ${mosqueeId}`);
    console.log(`📏 Rayon clustering: ${rayonKm}km`);
    console.log(`🔄 Force régénération: ${forceRegeneration}`);

    // 🔥 MODIFIÉ : Si forceRegeneration, réinitialiser tous les itineraireId d'abord
    if (forceRegeneration) {
      console.log('🔄 Réinitialisation des itinéraires existants...');
      await supprimerTousLesItineraires(mosqueeId);
    }

    // 1. Filtrer les bénéficiaires éligibles
    const benefsEligibles = beneficiaires.filter(b =>
      (b.statut === 'Pack Attribué' || b.statut === 'Validé') &&
      (!b.itineraireId || forceRegeneration) && // 🔥 Inclure même avec itineraireId si force
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

    // 4. Optimiser chaque cluster et créer les itinéraires
    const itineraires = [];
    
    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      
      // Optimiser l'ordre de visite
      const clusterOptimise = optimiserOrdreVisite(cluster);
      
      // Calculer les statistiques
      const stats = calculerStatistiquesItineraire(clusterOptimise);
      
      // Générer le nom
      const nom = genererNomItineraire(clusterOptimise, i);
      
      // Créer l'objet itinéraire
      const itineraire = {
        nom,
        mosqueeId: mosqueeId, // 🔥 Lier à la mosquée
        statut: 'Non assigné',
        beneficiaires: clusterOptimise.map(b => ({
          id: b.id,
          nom: b.nom,
          adresse: b.adresse,
          telephone: b.telephone,
          nbPersonnes: b.nbPersonnes,
          coords: b.coords
        })),
        statistiques: stats,
        benevole: null,
        dateCreation: new Date().toISOString(),
        dateModification: new Date().toISOString()
      };
      
      itineraires.push(itineraire);
    }

    // 5. Sauvegarder les itinéraires dans Firestore
    console.log('💾 Sauvegarde des itinéraires...');
    
    const itinerairesIds = [];
    for (const itineraire of itineraires) {
      const docRef = await addDoc(collection(db, 'itineraires'), itineraire);
      itinerairesIds.push(docRef.id);
      console.log(`✅ Itinéraire créé: ${docRef.id}`);
    }

    // 6. Mettre à jour les bénéficiaires avec leur itineraireId
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
 * Assigne un bénévole à un itinéraire
 */
export async function assignerItineraireBenevole(itineraireId, benevoleData, mosqueeId) {
  try {
    const docRef = doc(db, 'itineraires', itineraireId);
    await updateDoc(docRef, {
      benevole: benevoleData,
      statut: 'Assigné',
      dateAssignation: new Date().toISOString()
    });
    
    console.log(`✅ Bénévole ${benevoleData.nom} assigné à l'itinéraire ${itineraireId}`);
    return { success: true };
  } catch (error) {
    console.error('Erreur assignation bénévole:', error);
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
    // 1. Réinitialiser les bénéficiaires
    for (const benefId of beneficiairesIds) {
      const benefDocRef = doc(db, 'beneficiaires', benefId);
      await updateDoc(benefDocRef, {
        itineraireId: null,
        dateAssignationItineraire: null
      });
    }
    
    // 2. Supprimer l'itinéraire
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
    
    // 1. Récupérer tous les itinéraires de cette mosquée
    const itineraires = await getItineraires(mosqueeId);
    
    // 2. Réinitialiser tous les bénéficiaires
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
    
    // 3. Supprimer tous les itinéraires
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