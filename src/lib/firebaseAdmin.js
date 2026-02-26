// src/lib/firebaseAdmin.js
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
import { genererPacksAutomatiques, normaliserArticleFavori } from './packCalculator';
import { getParametres } from '@/lib/parametresconfig';
import { ROLES } from './roles';

/**
 * Gère les erreurs Firebase de manière centralisée
 */
function handleFirebaseError(error, context) {
  console.error(`Erreur Firebase lors de ${context}:`, error);
  throw new Error(`Erreur lors de ${context}: ${error.message}`);
}

/**
 * Détermine la taille de famille en fonction du nombre de personnes
 */
export function determinerTailleFamille(nbPersonnes) {
  const nb = parseInt(nbPersonnes);
  if (nb <= 2) return 'Petite';
  if (nb <= 5) return 'Moyenne';
  return 'Grande';
}

/**
 * 🔒 NOUVELLE FONCTION : Récupère l'inventaire filtré par mosquée
 */
export async function getInventaire(mosqueeId = null) {
  try {
    let q;
    
    if (mosqueeId && mosqueeId !== 'ALL') {
      q = query(collection(db, 'inventaire'), where('mosqueeId', '==', mosqueeId));
    } else {
      q = collection(db, 'inventaire');
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    handleFirebaseError(error, 'la récupération de l\'inventaire');
  }
}

/**
 * 🔒 Ajoute un article à l'inventaire avec mosqueeId
 */
export async function ajouterArticleInventaire(article, mosqueeId) {
  if (!mosqueeId || mosqueeId === 'ALL') {
    throw new Error('Vous devez spécifier une mosquée pour ajouter un article');
  }

  const docRef = await addDoc(collection(db, 'inventaire'), {
    nom: article.nom,
    quantite: parseFloat(article.quantite),
    unite: article.unite,
    seuil: parseFloat(article.seuil) || 50,
    mosqueeId: mosqueeId,
    createdAt: new Date().toISOString()
  });
  
  console.log(`✅ Article ajouté pour mosquée ${mosqueeId}, régénération automatique des packs...`);
  
  try {
    await genererEtSauvegarderPacks(mosqueeId);
  } catch (error) {
    console.error('❌ Erreur lors de la régénération après ajout:', error);
  }
  
  return docRef.id;
}

/**
 * 🔒 Met à jour un article de l'inventaire
 */
export async function updateArticleInventaire(id, updates, mosqueeId) {
  const docRef = doc(db, 'inventaire', id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
  
  console.log('✅ Article mis à jour, régénération automatique des packs...');
  
  try {
    await genererEtSauvegarderPacks(mosqueeId);
  } catch (error) {
    console.error('❌ Erreur lors de la régénération après modification:', error);
  }
}

/**
 * 🔒 Supprime un article de l'inventaire
 */
export async function supprimerArticleInventaire(id, mosqueeId) {
  await deleteDoc(doc(db, 'inventaire', id));
  
  console.log('✅ Article supprimé, régénération automatique des packs...');
  
  try {
    await genererEtSauvegarderPacks(mosqueeId);
  } catch (error) {
    console.error('❌ Erreur lors de la régénération après suppression:', error);
  }
}

/**
 * 🔒 NOUVELLE FONCTION : Récupère les bénéficiaires filtrés par mosquée
 */
export async function getBeneficiaires(mosqueeId = null) {
  try {
    let q;
    
    if (mosqueeId && mosqueeId !== 'ALL') {
      q = query(collection(db, 'beneficiaires'), where('mosqueeId', '==', mosqueeId));
    } else {
      q = collection(db, 'beneficiaires');
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    handleFirebaseError(error, 'la récupération des bénéficiaires');
  }
}

/**
 * Met à jour le statut d'un bénéficiaire
 */
export async function updateBeneficiaireStatut(id, statut) {
  const docRef = doc(db, 'beneficiaires', id);
  await updateDoc(docRef, {
    statut,
    updatedAt: new Date().toISOString()
  });
}

/**
 * 🔒 NOUVELLE FONCTION : Récupère les packs filtrés par mosquée
 */
/**
 * 🔒 NOUVELLE FONCTION : Récupère les packs filtrés par mosquée
 * 🔥 MODIFIÉ : Retourne { standard: [...], supplements: [...] }
 */
export async function getPacks(mosqueeId = null) {
  try {
    let q;
    
    if (mosqueeId && mosqueeId !== 'ALL') {
      q = query(collection(db, 'packs'), where('mosqueeId', '==', mosqueeId));
    } else {
      q = collection(db, 'packs');
    }
    
    const querySnapshot = await getDocs(q);
    const allPacks = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // 🔥 NOUVEAU : Séparer en standard et supplements
    const standard = allPacks.filter(p => p.type === 'standard');
    const supplements = allPacks.filter(p => p.type === 'supplement' || p.type === 'bonus');
    
    console.log('📦 Packs chargés:', { 
      total: allPacks.length, 
      standard: standard.length, 
      supplements: supplements.length 
    });
    
    return {
      standard,
      supplements
    };
  } catch (error) {
    handleFirebaseError(error, 'la récupération des packs');
  }
}

/**
 * 🔥 FONCTION PRINCIPALE : Génère et sauvegarde automatiquement tous les packs
 * 🔥 MODIFIÉ : Appelle automatiquement l'attribution des packs
 */
export async function genererEtSauvegarderPacks(mosqueeId) {
  try {
    if (!mosqueeId || mosqueeId === 'ALL') {
      throw new Error('Vous devez spécifier une mosquée pour générer les packs');
    }

    console.log(`🔄 Début de la régénération automatique des packs pour mosquée ${mosqueeId}...`);
    
    const parametres = await getParametres();
    console.log('⚙️ Paramètres chargés:', parametres);
    
    const inventaire = await getInventaire(mosqueeId);
    const beneficiaires = await getBeneficiaires(mosqueeId);
    
    console.log(`📦 Génération des packs pour mosquée ${mosqueeId}...`);
    console.log(`   - Inventaire: ${inventaire.length} articles`);
    console.log(`   - Bénéficiaires: ${beneficiaires.length} personnes`);
    console.log(`   - Répartition: ${parametres.repartition.standard}% standard / ${parametres.repartition.supplement}% supplément`);
    
    const { packsStandard, packsSupplements } = await genererPacksAutomatiques(inventaire, beneficiaires, parametres);
    
    const tousLesPacks = [...packsStandard, ...packsSupplements];
    
    console.log(`📦 Packs standard: ${packsStandard.length}`);
    console.log(`🎁 Packs suppléments: ${packsSupplements.length}`);
    console.log(`✅ Total: ${tousLesPacks.length}`);
    
    // 🔥 AJOUTÉ : Réinitialiser les packId des bénéficiaires AVANT de supprimer les packs
    console.log('🔄 Réinitialisation des packs attribués...');
    const benefsAvecPacks = beneficiaires.filter(b => b.packId || b.packSupplementId);
    for (const benef of benefsAvecPacks) {
      await updateDoc(doc(db, 'beneficiaires', benef.id), {
        packId: null,
        packSupplementId: null,
        statut: 'Validé',
        dateAttribution: null
      });
    }
    console.log(`✅ ${benefsAvecPacks.length} bénéficiaires réinitialisés`);
    
    // Supprimer les anciens packs
    const anciensPacks = await getDocs(
      query(collection(db, 'packs'), where('mosqueeId', '==', mosqueeId))
    );
    const batch = writeBatch(db);
    
    anciensPacks.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`🗑️ Anciens packs de la mosquée ${mosqueeId} supprimés`);
    
    // Sauvegarder les nouveaux packs
    const packsIds = [];
    for (const pack of tousLesPacks) {
      const docRef = await addDoc(collection(db, 'packs'), {
        ...pack,
        mosqueeId: mosqueeId,
        createdAt: new Date().toISOString(),
        generationAuto: true
      });
      packsIds.push(docRef.id);
    }
    
    console.log('✅ Nouveaux packs sauvegardés avec succès');
    
    // 🔥 Attribution automatique des packs aux bénéficiaires
    console.log('🎯 Attribution automatique des packs aux bénéficiaires...');
    await attribuerPacksAuxBeneficiaires(mosqueeId);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return {
      success: true,
      message: `${tousLesPacks.length} packs générés avec succès (${packsStandard.length} standard + ${packsSupplements.length} suppléments)`,
      packsGeneres: tousLesPacks.length,
      packsStandard: packsStandard.length,
      packsSupplements: packsSupplements.length
    };
    
  } catch (error) {
    console.error('❌ Erreur génération packs:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * 🔥 CORRIGÉ : Attribue les packs aux bénéficiaires validés d'une mosquée
 */
export async function attribuerPacksAuxBeneficiaires(mosqueeId) {
  try {
    const beneficiaires = await getBeneficiaires(mosqueeId);
    const packsData = await getPacks(mosqueeId);
    
    // 🔥 FIX : getPacks retourne maintenant { standard: [...], supplements: [...] }
    const packs = [...(packsData.standard || []), ...(packsData.supplements || [])];
    
    console.log(`🎯 Attribution des packs aux bénéficiaires de la mosquée ${mosqueeId}...`);
    console.log(`📦 Packs disponibles: ${packs.length} (${packsData.standard?.length || 0} standard + ${packsData.supplements?.length || 0} suppléments)`);
    
    // Filtrer les bénéficiaires validés sans pack
    const beneficiairesAAttribuer = beneficiaires.filter(
      b => b.statut === 'Validé' && !b.packId
    );
    
    console.log(`👥 ${beneficiairesAAttribuer.length} bénéficiaires à traiter`);
    
    let countAttributions = 0;
    
    for (const beneficiaire of beneficiairesAAttribuer) {
      let tailleFamille;
      if (beneficiaire.nbPersonnes) {
        tailleFamille = determinerTailleFamille(beneficiaire.nbPersonnes);
      } else if (beneficiaire.tailleFamille) {
        tailleFamille = beneficiaire.tailleFamille;
      } else {
        console.warn(`⚠️ ${beneficiaire.nom}: Pas de taille définie, défaut = Petite`);
        tailleFamille = 'Petite';
      }
      
      const packStandard = packs.find(
        p => p.type === 'standard' && p.tailleFamille === tailleFamille
      );
      
      if (!packStandard) {
        console.warn(`⚠️ ${beneficiaire.nom}: Aucun pack standard trouvé pour taille ${tailleFamille}`);
        continue;
      }
      
      let packSupplement = null;
      if (beneficiaire.articleFavori) {
        const articleFavoriNormalise = normaliserArticleFavori(beneficiaire.articleFavori);
        
        if (articleFavoriNormalise) {
          packSupplement = packs.find(
            p => p.type === 'supplement' && p.articleFavori === articleFavoriNormalise
          );
          
          if (!packSupplement) {
            console.warn(`⚠️ ${beneficiaire.nom}: Article favori ${articleFavoriNormalise} non trouvé en supplément`);
          }
        }
      }
      
      // 🔥 IMPORTANT : Mettre à jour le statut à "Pack Attribué"
      const updates = {
        packId: packStandard.id,
        packSupplementId: packSupplement?.id || null,
        tailleFamille: tailleFamille,
        statut: 'Pack Attribué', // 🔥 Changement de statut
        dateAttribution: new Date().toISOString()
      };
      
      await updateDoc(doc(db, 'beneficiaires', beneficiaire.id), updates);
      
      console.log(`✅ ${beneficiaire.nom}: Pack ${tailleFamille} attribué${packSupplement ? ' + supplément ' + beneficiaire.articleFavori : ''}`);
      countAttributions++;
    }
    
    console.log(`✅ ${countAttributions} attributions effectuées`);
    
    return {
      success: true,
      message: `${countAttributions} packs attribués`,
      attributions: countAttributions
    };
    
  } catch (error) {
    console.error('Erreur attribution packs:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * 🔒 Supprime tous les packs d'une mosquée
 */
export async function supprimerTousLesPacks(mosqueeId) {
  try {
    if (!mosqueeId || mosqueeId === 'ALL') {
      throw new Error('Vous devez spécifier une mosquée pour supprimer les packs');
    }

    console.log(`🗑️ Suppression de tous les packs de la mosquée ${mosqueeId}...`);
    
    // 🔥 NOUVEAU : Réinitialiser les bénéficiaires AVANT suppression
    const beneficiaires = await getBeneficiaires(mosqueeId);
    const benefsAvecPacks = beneficiaires.filter(b => b.packId || b.packSupplementId);
    
    console.log(`🔄 Réinitialisation de ${benefsAvecPacks.length} bénéficiaires...`);
    for (const benef of benefsAvecPacks) {
      await updateDoc(doc(db, 'beneficiaires', benef.id), {
        packId: null,
        packSupplementId: null,
        statut: 'Validé',
        dateAttribution: null
      });
    }
    console.log(`✅ ${benefsAvecPacks.length} bénéficiaires réinitialisés`);
    
    const querySnapshot = await getDocs(
      query(collection(db, 'packs'), where('mosqueeId', '==', mosqueeId))
    );
    const batch = writeBatch(db);
    
    querySnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    console.log('✅ Tous les packs supprimés');
    
    return {
      success: true,
      message: 'Tous les packs ont été supprimés'
    };
    
  } catch (error) {
    handleFirebaseError(error, 'la suppression des packs');
  }
}

/**
 * Ajoute un bénéficiaire
 */
export async function ajouterBeneficiaire(beneficiaire) {
  try {
    if (!beneficiaire.mosqueeId) {
      throw new Error('Le bénéficiaire doit être lié à une mosquée');
    }

    const docRef = await addDoc(collection(db, 'beneficiaires'), {
      ...beneficiaire,
      createdAt: new Date().toISOString()
    });
    
    if (beneficiaire.statut === 'Validé') {
      console.log('✅ Bénéficiaire validé ajouté, régénération des packs...');
      await genererEtSauvegarderPacks(beneficiaire.mosqueeId);
    }
    
    return docRef.id;
  } catch (error) {
    handleFirebaseError(error, 'l\'ajout du bénéficiaire');
  }
}

/**
 * 🔥 NOUVEAU : Ajoute plusieurs bénéficiaires en une seule transaction batch
 * Optimisé pour les imports massifs - NE génère PAS les packs automatiquement
 * @param {Array} beneficiaires - Tableau de bénéficiaires à ajouter
 * @param {string} mosqueeId - ID de la mosquée
 * @returns {Promise<{success: number, errors: Array}>}
 */
export async function ajouterBeneficiairesBatch(beneficiaires, mosqueeId) {
  try {
    if (!mosqueeId) {
      throw new Error('Une mosquée doit être spécifiée pour l\'import batch');
    }

    if (!Array.isArray(beneficiaires) || beneficiaires.length === 0) {
      throw new Error('Le tableau de bénéficiaires est vide ou invalide');
    }

    console.log(`📦 Import batch de ${beneficiaires.length} bénéficiaires pour mosquée ${mosqueeId}`);

    // Firebase limite à 500 opérations par batch
    const BATCH_SIZE = 500;
    let totalSuccess = 0;
    const errors = [];

    // Découper en chunks de 500
    for (let i = 0; i < beneficiaires.length; i += BATCH_SIZE) {
      const chunk = beneficiaires.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      chunk.forEach((beneficiaire) => {
        try {
          // Créer une nouvelle référence de document
          const newDocRef = doc(collection(db, 'beneficiaires'));
          
          // Ajouter au batch
          batch.set(newDocRef, {
            ...beneficiaire,
            mosqueeId,
            createdAt: new Date().toISOString()
          });
          
          totalSuccess++;
        } catch (error) {
          errors.push({
            beneficiaire: beneficiaire.nom,
            error: error.message
          });
        }
      });

      // Exécuter le batch
      await batch.commit();
      console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} committé (${chunk.length} bénéficiaires)`);
    }

    console.log(`🎉 Import batch terminé: ${totalSuccess} succès, ${errors.length} erreurs`);
    console.log(`⚠️ IMPORTANT: Les packs ne sont PAS générés automatiquement. Utilisez le bouton "Générer les packs" manuellement.`);
    
    return {
      success: totalSuccess,
      errors
    };

  } catch (error) {
    console.error('❌ Erreur import batch:', error);
    throw error;
  }
}

/**
 * 🔥 MODIFIÉ : Met à jour un bénéficiaire complet avec mosqueeId
 */
export async function updateBeneficiaire(id, beneficiaire, mosqueeId) {
  try {
    if (!mosqueeId) {
      throw new Error('mosqueeId est requis pour la modification');
    }

    const docRef = doc(db, 'beneficiaires', id);
    
    const beneficiaireDoc = await getDoc(docRef);
    const beneficiaireData = beneficiaireDoc.exists() ? beneficiaireDoc.data() : null;
    
    const adresseAChange = beneficiaireData && 
                          beneficiaireData.adresse !== beneficiaire.adresse;
    
    const infoCritiquesChangent = beneficiaireData && (
      beneficiaireData.articleFavori !== beneficiaire.articleFavori ||
      beneficiaireData.tailleFamille !== beneficiaire.tailleFamille ||
      beneficiaireData.nbPersonnes !== beneficiaire.nbPersonnes ||
      adresseAChange
    );
    
    const updates = {
      ...beneficiaire,
      mosqueeId: mosqueeId,
      updatedAt: new Date().toISOString()
    };
    
    if (adresseAChange) {
      updates.coords = null;
      updates.dateGeolocalisation = null;
      updates.itineraireId = null;
      updates.dateAssignationItineraire = null;
      console.log(`📍 Adresse modifiée pour ${beneficiaire.nom}, coordonnées et itinéraire réinitialisés`);
    }
    
    if (infoCritiquesChangent && (beneficiaireData?.packId || beneficiaireData?.packSupplementId)) {
      updates.packId = null;
      updates.packSupplementId = null;
      updates.statut = 'Validé';
      console.log(`⚠️ Pack réinitialisé pour ${beneficiaire.nom} (modifications critiques)`);
    }
    
    await updateDoc(docRef, updates);
    
    const shouldRegenerate = 
      beneficiaire.statut === 'Validé' || 
      beneficiaireData?.statut === 'Validé' ||
      infoCritiquesChangent;
    
    if (shouldRegenerate && mosqueeId) {
      console.log('✅ Bénéficiaire modifié, régénération des packs...');
      await genererEtSauvegarderPacks(mosqueeId);
    }
    
    return {
      success: true,
      packReinitialise: infoCritiquesChangent && (beneficiaireData?.packId || beneficiaireData?.packSupplementId),
      coordsReinitialisees: adresseAChange
    };
  } catch (error) {
    handleFirebaseError(error, 'la modification du bénéficiaire');
  }
}

/**
 * 🔥 MODIFIÉ : Supprime un bénéficiaire avec mosqueeId
 */
export async function supprimerBeneficiaire(id, mosqueeId) {
  try {
    if (!mosqueeId) {
      throw new Error('mosqueeId est requis pour la suppression');
    }

    const docRef = doc(db, 'beneficiaires', id);
    const beneficiaireDoc = await getDoc(docRef);
    
    if (!beneficiaireDoc.exists()) {
      throw new Error('Bénéficiaire non trouvé');
    }
    
    const beneficiaire = beneficiaireDoc.data();
    
    if (beneficiaire.mosqueeId !== mosqueeId) {
      throw new Error('Ce bénéficiaire n\'appartient pas à votre mosquée');
    }
    
    await deleteDoc(docRef);
    console.log(`✅ Bénéficiaire ${id} supprimé de la mosquée ${mosqueeId}`);
    
    if (beneficiaire.statut === 'Validé' || beneficiaire.statut === 'Pack Attribué') {
      console.log('✅ Bénéficiaire validé supprimé, régénération des packs...');
      await genererEtSauvegarderPacks(mosqueeId);
    }
    
    return { success: true };
  } catch (error) {
    handleFirebaseError(error, 'la suppression du bénéficiaire');
  }
}

/**
 * Listeners en temps réel
 */
export function ecouterInventaire(callback, mosqueeId = null) {
  console.log(`👂 Installation du listener temps réel sur l'inventaire (mosquée: ${mosqueeId})`);
  
  let q;
  if (mosqueeId && mosqueeId !== 'ALL') {
    q = query(collection(db, 'inventaire'), where('mosqueeId', '==', mosqueeId));
  } else {
    q = collection(db, 'inventaire');
  }
  
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('🔄 Inventaire mis à jour en temps réel:', items.length, 'articles');
      callback(items);
    },
    (error) => {
      console.error('❌ Erreur listener inventaire:', error);
    }
  );
  
  return unsubscribe;
}

export function ecouterPacks(callback, mosqueeId = null) {
  console.log(`👂 Installation du listener temps réel sur les packs (mosquée: ${mosqueeId})`);
  
  let q;
  if (mosqueeId && mosqueeId !== 'ALL') {
    q = query(collection(db, 'packs'), where('mosqueeId', '==', mosqueeId));
  } else {
    q = collection(db, 'packs');
  }
  
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const packs = [];
      snapshot.forEach((doc) => {
        packs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('🔄 Packs mis à jour en temps réel:', packs.length, 'packs');
      callback(packs);
    },
    (error) => {
      console.error('❌ Erreur listener packs:', error);
    }
  );
  
  return unsubscribe;
}

export function ecouterBeneficiaires(callback, mosqueeId = null) {
  console.log(`👂 Installation du listener temps réel sur les bénéficiaires (mosquée: ${mosqueeId})`);
  
  let q;
  if (mosqueeId && mosqueeId !== 'ALL') {
    q = query(collection(db, 'beneficiaires'), where('mosqueeId', '==', mosqueeId));
  } else {
    q = collection(db, 'beneficiaires');
  }
  
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const beneficiaires = [];
      snapshot.forEach((doc) => {
        beneficiaires.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('🔄 Bénéficiaires mis à jour en temps réel:', beneficiaires.length, 'personnes');
      callback(beneficiaires);
    },
    (error) => {
      console.error('❌ Erreur listener bénéficiaires:', error);
    }
  );
  
  return unsubscribe;
}