/**
 * Service Firebase pour gérer les itinéraires
 */

import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, writeBatch, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { geocodeMultiple } from './geocoding';
import { creerClusters, optimiserOrdreVisite, calculerStatistiquesItineraire, genererNomItineraire } from './routeOptimizer';

/**
 * Récupère tous les itinéraires
 */
export async function getItineraires() {
  try {
    const querySnapshot = await getDocs(collection(db, 'itineraires'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Erreur récupération itinéraires:', error);
    throw error;
  }
}

/**
 * Listener en temps réel pour les itinéraires
 */
export function ecouterItineraires(callback) {
  console.log('👂 Installation du listener temps réel sur les itinéraires');

  const unsubscribe = onSnapshot(
    collection(db, 'itineraires'),
    (snapshot) => {
      const itineraires = [];
      snapshot.forEach((doc) => {
        itineraires.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log('🔄 Itinéraires mis à jour en temps réel:', itineraires.length);
      callback(itineraires);
    },
    (error) => {
      console.error('❌ Erreur listener itinéraires:', error);
    }
  );

  return unsubscribe;
}

/**
 * Géolocalise tous les bénéficiaires qui n'ont pas encore de coordonnées
 */
export async function geolocaliserBeneficiaires(beneficiaires, onProgress = null) {
  try {
    console.log('🌍 Début géolocalisation des bénéficiaires...');

    // Filtrer les bénéficiaires sans coordonnées et avec statut validé ou pack attribué
    const beneficiairesAGeolocaliser = beneficiaires.filter(b =>
      (b.statut === 'Validé' || b.statut === 'Pack Attribué') &&
      (!b.coords || !b.coords.lat || !b.coords.lng)
    );

    if (beneficiairesAGeolocaliser.length === 0) {
      console.log('✅ Tous les bénéficiaires sont déjà géolocalisés');
      return { success: true, count: 0 };
    }

    console.log(`📍 ${beneficiairesAGeolocaliser.length} bénéficiaires à géolocaliser`);

    // Préparer les données pour la géolocalisation
    const adresses = beneficiairesAGeolocaliser.map(b => ({
      id: b.id,
      adresse: b.adresse
    }));

    // Géolocaliser
    const results = await geocodeMultiple(adresses, onProgress);

    // Mettre à jour Firebase en batch
    const batch = writeBatch(db);
    let updateCount = 0;

    results.forEach(result => {
      if (result.coords) {
        const benefRef = doc(db, 'beneficiaires', result.id);
        batch.update(benefRef, {
          coords: result.coords,
          geolocaliseLe: new Date().toISOString()
        });
        updateCount++;
      }
    });

    await batch.commit();

    console.log(`✅ ${updateCount} bénéficiaires géolocalisés et sauvegardés`);

    return {
      success: true,
      count: updateCount,
      total: beneficiairesAGeolocaliser.length
    };

  } catch (error) {
    console.error('❌ Erreur géolocalisation:', error);
    throw error;
  }
}

/**
 * Génère automatiquement les itinéraires optimisés
 */
export async function genererItinerairesAutomatiques(beneficiaires, options = {}) {
  try {
    const {
      rayonKm = 3,
      pointDepart = null
    } = options;

    console.log('🚀 Génération automatique des itinéraires...');

    // Filtrer les bénéficiaires avec pack attribué et coordonnées valides
    const benefsEligibles = beneficiaires.filter(b =>
      (b.statut === 'Pack Attribué' || b.statut === 'Validé') &&
      b.coords &&
      b.coords.lat &&
      b.coords.lng &&
      !b.itineraireId // Pas déjà dans un itinéraire
    );

    if (benefsEligibles.length === 0) {
      throw new Error('Aucun bénéficiaire éligible pour créer des itinéraires');
    }

    console.log(`📦 ${benefsEligibles.length} bénéficiaires éligibles`);

    // Créer les clusters
    const clusters = creerClusters(benefsEligibles, rayonKm);

    if (clusters.length === 0) {
      throw new Error('Aucun cluster créé');
    }

    console.log(`🎯 ${clusters.length} clusters créés`);

    // Supprimer les anciens itinéraires
    await supprimerTousLesItineraires();

    // Créer les itinéraires
    const itinerairesIds = [];

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];

      // Optimiser l'ordre de visite
      const clusterOptimise = optimiserOrdreVisite(cluster, pointDepart);

      // Calculer les statistiques
      const stats = calculerStatistiquesItineraire(clusterOptimise);

      // Générer un nom
      const nom = genererNomItineraire(clusterOptimise, i);

      // Créer l'itinéraire
      const itineraire = {
        nom,
        beneficiaires: clusterOptimise.map(b => ({
          id: b.id,
          nom: b.nom,
          adresse: b.adresse,
          coords: b.coords,
          telephone: b.telephone,
          nbPersonnes: b.nbPersonnes
        })),
        statistiques: stats,
        statut: 'Non assigné',
        benevole: null,
        dateCreation: new Date().toISOString(),
        dateModification: new Date().toISOString()
      };

      // Sauvegarder dans Firebase
      const docRef = await addDoc(collection(db, 'itineraires'), itineraire);
      itinerairesIds.push(docRef.id);

      console.log(`✅ Itinéraire ${i + 1}/${clusters.length} créé: ${nom}`);
    }

    // Mettre à jour les bénéficiaires avec leur itinéraire
    const batch = writeBatch(db);

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const itineraireId = itinerairesIds[i];

      cluster.forEach(benef => {
        const benefRef = doc(db, 'beneficiaires', benef.id);
        batch.update(benefRef, {
          itineraireId,
          dateAssignationItineraire: new Date().toISOString()
        });
      });
    }

    await batch.commit();

    console.log('✅ Génération terminée avec succès');

    return {
      success: true,
      nombreItineraires: clusters.length,
      nombreBeneficiaires: benefsEligibles.length
    };

  } catch (error) {
    console.error('❌ Erreur génération itinéraires:', error);
    throw error;
  }
}

/**
 * Assigne un itinéraire à un bénévole
 */
export async function assignerItineraireBenevole(itineraireId, benevole) {
  try {
    const itineraireRef = doc(db, 'itineraires', itineraireId);

    await updateDoc(itineraireRef, {
      benevole: {
        nom: benevole.nom,
        telephone: benevole.telephone || null,
        email: benevole.email || null
      },
      statut: 'Assigné',
      dateAssignation: new Date().toISOString(),
      dateModification: new Date().toISOString()
    });

    console.log(`✅ Itinéraire assigné à ${benevole.nom}`);

    return { success: true };
  } catch (error) {
    console.error('❌ Erreur assignation:', error);
    throw error;
  }
}

/**
 * Met à jour le statut d'un itinéraire
 */
export async function updateStatutItineraire(itineraireId, statut) {
  try {
    const itineraireRef = doc(db, 'itineraires', itineraireId);

    await updateDoc(itineraireRef, {
      statut,
      dateModification: new Date().toISOString(),
      ...(statut === 'Terminé' && { dateTermine: new Date().toISOString() })
    });

    console.log(`✅ Statut mis à jour: ${statut}`);

    return { success: true };
  } catch (error) {
    console.error('❌ Erreur mise à jour statut:', error);
    throw error;
  }
}

/**
 * Supprime un itinéraire
 */
export async function supprimerItineraire(itineraireId, beneficiaires) {
  try {
    // Retirer l'itineraireId des bénéficiaires concernés
    const batch = writeBatch(db);

    beneficiaires.forEach(benefId => {
      const benefRef = doc(db, 'beneficiaires', benefId);
      batch.update(benefRef, {
        itineraireId: null,
        dateAssignationItineraire: null
      });
    });

    await batch.commit();

    // Supprimer l'itinéraire
    await deleteDoc(doc(db, 'itineraires', itineraireId));

    console.log(`✅ Itinéraire supprimé`);

    return { success: true };
  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    throw error;
  }
}

/**
 * Supprime tous les itinéraires
 */
export async function supprimerTousLesItineraires() {
  try {
    console.log('🗑️ Suppression de tous les itinéraires...');

    const querySnapshot = await getDocs(collection(db, 'itineraires'));
    const batch = writeBatch(db);

    querySnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    // Retirer itineraireId de tous les bénéficiaires
    const beneficiairesSnapshot = await getDocs(collection(db, 'beneficiaires'));
    const benefBatch = writeBatch(db);

    beneficiairesSnapshot.docs.forEach(doc => {
      if (doc.data().itineraireId) {
        benefBatch.update(doc.ref, {
          itineraireId: null,
          dateAssignationItineraire: null
        });
      }
    });

    await benefBatch.commit();

    console.log('✅ Tous les itinéraires supprimés');

    return { success: true };
  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    throw error;
  }
}
