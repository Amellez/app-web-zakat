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
 * Génère les clusters automatiquement (SANS assignation)
 */
export async function genererClusters(beneficiaires, mosqueeId, options = {}) {
  try {
    if (!mosqueeId) {
      throw new Error('mosqueeId requis pour la génération de clusters');
    }

    const { rayonKm = 1, forceRegeneration = false } = options;

    console.log('🚀 === DÉBUT GÉNÉRATION CLUSTERS ===');
    console.log(`📍 MosqueeId: ${mosqueeId}`);
    console.log(`📏 Rayon clustering: ${rayonKm}km`);
    console.log(`🔄 Force régénération: ${forceRegeneration}`);

    // Si forceRegeneration, supprimer tous les clusters existants
    if (forceRegeneration) {
      console.log('🔄 Suppression des clusters existants...');
      const result = await supprimerTousClusters(mosqueeId);
      console.log('✅ Clusters supprimés:', result);

      // Attendre un peu pour s'assurer que la suppression est propagée
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Récupérer les coordonnées de la mosquée
    console.log('🕌 Récupération des coordonnées de la mosquée...');
    let coordsMosquee = null;

    try {
      const mosqueeDoc = await getDoc(doc(db, 'mosquees', mosqueeId));

      if (mosqueeDoc.exists()) {
        const mosqueeData = mosqueeDoc.data();

        if (mosqueeData.coords && mosqueeData.coords.lat && mosqueeData.coords.lng) {
          coordsMosquee = mosqueeData.coords;
          console.log('✅ Coordonnées mosquée disponibles');
        } else if (mosqueeData.adresse) {
          console.log(`🌍 Géolocalisation de la mosquée: ${mosqueeData.adresse}`);
          const { geocodeAdresseUnique } = await import('./geocoding');
          coordsMosquee = await geocodeAdresseUnique(mosqueeData.adresse);

          if (coordsMosquee) {
            try {
              await updateDoc(doc(db, 'mosquees', mosqueeId), {
                coords: coordsMosquee,
                dateGeolocalisation: new Date().toISOString()
              });
              console.log('✅ Coordonnées mosquée sauvegardées');
            } catch (updateError) {
              console.warn('⚠️ Impossible de sauvegarder les coords de la mosquée');
            }
          }
        }
      }
    } catch (mosqueeError) {
      console.warn('⚠️ Erreur récupération mosquée:', mosqueeError.message);
    }

    // Filtrer les bénéficiaires éligibles
    // ✅ CORRECTION : Exclure aussi ceux qui sont déjà dans des clusters existants
    let benefsEligibles = beneficiaires.filter(b =>
      (b.statut === 'Pack Attribué' || b.statut === 'Validé') &&
      !b.itineraireId && // Pas encore assigné à un itinéraire
      b.mosqueeId === mosqueeId
    );

    // ✅ NOUVEAU : Exclure les bénéficiaires déjà présents dans des clusters
    if (!forceRegeneration) {
      const clustersExistants = await getClusters(mosqueeId);
      const benefsDansCluster = new Set();

      clustersExistants.forEach(cluster => {
        cluster.beneficiaires.forEach(b => {
          benefsDansCluster.add(b.id);
        });
      });

      benefsEligibles = benefsEligibles.filter(b => !benefsDansCluster.has(b.id));

      if (benefsDansCluster.size > 0) {
        console.log(`ℹ️ ${benefsDansCluster.size} bénéficiaires déjà dans des clusters (ignorés)`);
      }
    }

    console.log(`👥 Bénéficiaires éligibles: ${benefsEligibles.length}`);

    if (benefsEligibles.length === 0) {
      throw new Error('Aucun bénéficiaire éligible pour les clusters');
    }

    // Vérifier les coordonnées
    const benefsAvecCoords = benefsEligibles.filter(b =>
      b.coords && b.coords.lat && b.coords.lng
    );

    console.log(`📍 Avec coordonnées GPS: ${benefsAvecCoords.length}`);

    if (benefsAvecCoords.length === 0) {
      throw new Error('Aucun bénéficiaire géolocalisé');
    }

    // Créer les clusters
    console.log('🎯 Clustering...');
    const clustersData = creerClusters(benefsAvecCoords, rayonKm);

    if (!clustersData || clustersData.length === 0) {
      throw new Error('Erreur algorithme de clustering');
    }

    console.log(`✅ ${clustersData.length} clusters créés`);

    // Sauvegarder les clusters dans Firestore
    const clusters = [];

    for (let i = 0; i < clustersData.length; i++) {
      const clusterData = clustersData[i];

      // Optimiser l'ordre
      const clusterOptimise = optimiserOrdreVisite(clusterData, coordsMosquee);

      // Calculer les statistiques
      const stats = calculerStatistiquesItineraire(clusterOptimise, coordsMosquee);

      // Générer le nom
      // Générer le nom
      const nom = genererNomItineraire(clusterOptimise, i);
      console.log(`🏷️ Nom généré pour cluster ${i}:`, nom);

      // Créer l'objet cluster
      const cluster = {
        nom,
        mosqueeId: mosqueeId,
        statut: 'Non assigné', // ⚪ Nouveau : aucun bénéficiaire assigné
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
          estAssigne: false, // ✅ Nouveau : non assigné par défaut
          itineraireId: null // ✅ Nouveau : pas encore dans un itinéraire
        })),
        statistiques: stats,
        dateCreation: new Date().toISOString(),
        dateModification: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'clusters'), cluster);
      clusters.push({ id: docRef.id, ...cluster });
      console.log(`✅ Cluster créé: ${docRef.id}`);
    }

    console.log('✅ === GÉNÉRATION TERMINÉE ===');

    return {
      success: true,
      nombreClusters: clusters.length,
      nombreBeneficiaires: benefsAvecCoords.length
    };

  } catch (error) {
    console.error('❌ Erreur génération clusters:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Récupère les clusters d'une mosquée
 */
export async function getClusters(mosqueeId) {
  try {
    let q;

    if (mosqueeId && mosqueeId !== 'ALL') {
      q = query(collection(db, 'clusters'), where('mosqueeId', '==', mosqueeId));
    } else {
      q = collection(db, 'clusters');
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erreur récupération clusters:', error);
    throw error;
  }
}

/**
 * Met à jour le statut d'un cluster
 * Calcule automatiquement : Non assigné / Partiellement assigné / Totalement assigné
 */
export async function updateStatutCluster(clusterId) {
  try {
    const docRef = doc(db, 'clusters', clusterId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Cluster non trouvé');
    }

    const cluster = docSnap.data();
    const totalBeneficiaires = cluster.beneficiaires.length;
    const benefsAssignes = cluster.beneficiaires.filter(b => b.estAssigne).length;

    let nouveauStatut;
    if (benefsAssignes === 0) {
      nouveauStatut = 'Non assigné';
    } else if (benefsAssignes === totalBeneficiaires) {
      nouveauStatut = 'Totalement assigné';
    } else {
      nouveauStatut = 'Partiellement assigné';
    }

    await updateDoc(docRef, {
      statut: nouveauStatut,
      dateModification: new Date().toISOString()
    });

    console.log(`✅ Statut cluster ${clusterId} mis à jour: ${nouveauStatut}`);
    return { success: true, statut: nouveauStatut };
  } catch (error) {
    console.error('Erreur mise à jour statut cluster:', error);
    throw error;
  }
}

/**
 * Marque des bénéficiaires comme assignés dans un cluster
 */
export async function marquerBeneficiairesAssignes(clusterId, beneficiairesIds, itineraireId) {
  try {
    const docRef = doc(db, 'clusters', clusterId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Cluster non trouvé');
    }

    const cluster = docSnap.data();

    // Mettre à jour les bénéficiaires
    const beneficiairesUpdates = cluster.beneficiaires.map(b => {
      if (beneficiairesIds.includes(b.id)) {
        return {
          ...b,
          estAssigne: true,
          itineraireId: itineraireId,
          dateAssignation: new Date().toISOString()
        };
      }
      return b;
    });

    await updateDoc(docRef, {
      beneficiaires: beneficiairesUpdates,
      dateModification: new Date().toISOString()
    });

    // Mettre à jour le statut du cluster
    await updateStatutCluster(clusterId);

    console.log(`✅ ${beneficiairesIds.length} bénéficiaires marqués comme assignés`);
    return { success: true };
  } catch (error) {
    console.error('Erreur marquage bénéficiaires:', error);
    throw error;
  }
}

/**
 * Supprime un cluster
 */
export async function supprimerCluster(clusterId) {
  try {
    await deleteDoc(doc(db, 'clusters', clusterId));
    console.log(`✅ Cluster ${clusterId} supprimé`);
    return { success: true };
  } catch (error) {
    console.error('Erreur suppression cluster:', error);
    throw error;
  }
}

/**
 * Supprime tous les clusters d'une mosquée
 */
export async function supprimerTousClusters(mosqueeId) {
  try {
    if (!mosqueeId || mosqueeId === 'ALL') {
      throw new Error('Vous devez spécifier une mosquée');
    }

    console.log(`🗑️ Suppression de tous les clusters de ${mosqueeId}...`);

    const clusters = await getClusters(mosqueeId);

    const batch = writeBatch(db);
    clusters.forEach(cluster => {
      const docRef = doc(db, 'clusters', cluster.id);
      batch.delete(docRef);
    });
    await batch.commit();

    console.log(`✅ ${clusters.length} clusters supprimés`);
    return { success: true };
  } catch (error) {
    console.error('Erreur suppression clusters:', error);
    throw error;
  }
}
