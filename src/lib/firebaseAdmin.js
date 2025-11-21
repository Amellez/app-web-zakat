// src/lib/firebaseAdminMultiMosquee.js
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
      // Filtrer par mosquée spécifique
      q = query(collection(db, 'inventaire'), where('mosqueeId', '==', mosqueeId));
    } else {
      // Super admin : voir tout
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
    mosqueeId: mosqueeId, // 🔥 Lier à la mosquée
    createdAt: new Date().toISOString()
  });
  
  console.log(`✅ Article ajouté pour mosquée ${mosqueeId}, régénération automatique des packs...`);
  
  // Régénération automatique des packs pour cette mosquée
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
  
  // Régénération automatique des packs après modification
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
  
  // Régénération automatique des packs après suppression
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
      // Filtrer par mosquée spécifique
      q = query(collection(db, 'beneficiaires'), where('mosqueeId', '==', mosqueeId));
    } else {
      // Super admin : voir tout
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
export async function getPacks(mosqueeId = null) {
  try {
    let q;
    
    if (mosqueeId && mosqueeId !== 'ALL') {
      // Filtrer par mosquée spécifique
      q = query(collection(db, 'packs'), where('mosqueeId', '==', mosqueeId));
    } else {
      // Super admin : voir tout
      q = collection(db, 'packs');
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    handleFirebaseError(error, 'la récupération des packs');
  }
}

/**
 * 🔥 FONCTION PRINCIPALE : Génère et sauvegarde automatiquement tous les packs
 * MODIFIÉ : Accepte mosqueeId en paramètre pour générer uniquement pour une mosquée
 */
export async function genererEtSauvegarderPacks(mosqueeId) {
  try {
    if (!mosqueeId || mosqueeId === 'ALL') {
      throw new Error('Vous devez spécifier une mosquée pour générer les packs');
    }

    console.log(`🔄 Début de la régénération automatique des packs pour mosquée ${mosqueeId}...`);
    
    // 1. Charger les paramètres de configuration
    const parametres = await getParametres();
    console.log('⚙️ Paramètres chargés:', parametres);
    
    // 2. Récupérer l'inventaire et les bénéficiaires FILTRÉS par mosquée
    const inventaire = await getInventaire(mosqueeId);
    const beneficiaires = await getBeneficiaires(mosqueeId);
    
    console.log(`📦 Génération des packs pour mosquée ${mosqueeId}...`);
    console.log(`   - Inventaire: ${inventaire.length} articles`);
    console.log(`   - Bénéficiaires: ${beneficiaires.length} personnes`);
    console.log(`   - Répartition: ${parametres.repartition.standard}% standard / ${parametres.repartition.supplement}% supplément`);
    
    // 3. Générer les packs avec les paramètres configurés
    const { packsStandard, packsSupplements } = genererPacksAutomatiques(inventaire, beneficiaires, parametres);
    
    // 4. Combiner les deux types de packs
    const tousLesPacks = [...packsStandard, ...packsSupplements];
    
    console.log(`📦 Packs standard: ${packsStandard.length}`);
    console.log(`🎁 Packs suppléments: ${packsSupplements.length}`);
    console.log(`✅ Total: ${tousLesPacks.length}`);
    
    // 5. Supprimer les anciens packs DE CETTE MOSQUÉE UNIQUEMENT
    const anciensPacks = await getDocs(
      query(collection(db, 'packs'), where('mosqueeId', '==', mosqueeId))
    );
    const batch = writeBatch(db);
    
    anciensPacks.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`🗑️ Anciens packs de la mosquée ${mosqueeId} supprimés`);
    
    // 6. Sauvegarder les nouveaux packs avec mosqueeId
    const packsIds = [];
    for (const pack of tousLesPacks) {
      const docRef = await addDoc(collection(db, 'packs'), {
        ...pack,
        mosqueeId: mosqueeId, // 🔥 Lier le pack à la mosquée
        createdAt: new Date().toISOString(),
        generationAuto: true
      });
      packsIds.push(docRef.id);
    }
    
    console.log('✅ Nouveaux packs sauvegardés avec succès');
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
 * 🔒 Attribue les packs aux bénéficiaires validés d'une mosquée
 */
export async function attribuerPacksAuxBeneficiaires(mosqueeId) {
  try {
    const beneficiaires = await getBeneficiaires(mosqueeId);
    const packs = await getPacks(mosqueeId);
    
    console.log(`🎯 Attribution des packs aux bénéficiaires de la mosquée ${mosqueeId}...`);
    
    // Filtrer les bénéficiaires validés sans pack
    const beneficiairesAAttribuer = beneficiaires.filter(
      b => b.statut === 'Validé' && !b.packId
    );
    
    console.log(`👥 ${beneficiairesAAttribuer.length} bénéficiaires à traiter`);
    
    let countAttributions = 0;
    
    for (const beneficiaire of beneficiairesAAttribuer) {
      // Déterminer la taille en fonction du nombre de personnes
      let tailleFamille;
      if (beneficiaire.nbPersonnes) {
        tailleFamille = determinerTailleFamille(beneficiaire.nbPersonnes);
      } else if (beneficiaire.tailleFamille) {
        tailleFamille = beneficiaire.tailleFamille;
      } else {
        console.warn(`⚠️ ${beneficiaire.nom}: Pas de taille définie, défaut = Petite`);
        tailleFamille = 'Petite';
      }
      
      // Trouver le pack STANDARD correspondant à la taille
      const packStandard = packs.find(
        p => p.type === 'standard' && p.tailleFamille === tailleFamille
      );
      
      if (!packStandard) {
        console.warn(`⚠️ ${beneficiaire.nom}: Aucun pack standard trouvé pour taille ${tailleFamille}`);
        continue;
      }
      
      // Trouver le pack SUPPLÉMENT si le bénéficiaire a un article favori
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
      
      // Attribuer le pack au bénéficiaire
      const updates = {
        packId: packStandard.id,
        packSupplementId: packSupplement?.id || null,
        tailleFamille: tailleFamille,
        statut: 'Pack Attribué',
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
 * Ajoute un bénéficiaire (depuis l'admin) - LE BENEF DOIT DÉJÀ AVOIR mosqueeId
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
    
    // Régénérer les packs si le bénéficiaire est validé
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
 * 🔥 MODIFIÉ : Met à jour un bénéficiaire complet avec mosqueeId
 */
export async function updateBeneficiaire(id, beneficiaire, mosqueeId) {
  try {
    if (!mosqueeId) {
      throw new Error('mosqueeId est requis pour la modification');
    }

    const docRef = doc(db, 'beneficiaires', id);
    
    // Récupérer le bénéficiaire actuel pour vérifier s'il a un pack
    const beneficiaireDoc = await getDoc(docRef);
    const beneficiaireData = beneficiaireDoc.exists() ? beneficiaireDoc.data() : null;
    
    // Si le bénéficiaire a déjà un pack attribué et que des infos critiques changent
    const infoCritiquesChangent = beneficiaireData && (
      beneficiaireData.articleFavori !== beneficiaire.articleFavori ||
      beneficiaireData.tailleFamille !== beneficiaire.tailleFamille ||
      beneficiaireData.nbPersonnes !== beneficiaire.nbPersonnes
    );
    
    const updates = {
      ...beneficiaire,
      mosqueeId: mosqueeId, // 🔥 Forcer le mosqueeId
      updatedAt: new Date().toISOString()
    };
    
    // Si les infos critiques changent et qu'un pack était attribué, réinitialiser
    if (infoCritiquesChangent && (beneficiaireData?.packId || beneficiaireData?.packSupplementId)) {
      updates.packId = null;
      updates.packSupplementId = null;
      updates.statut = 'Validé';
      console.log(`⚠️ Pack réinitialisé pour ${beneficiaire.nom} (modifications critiques)`);
    }
    
    await updateDoc(docRef, updates);
    
    // Régénérer les packs si nécessaire
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
      packReinitialise: infoCritiquesChangent && (beneficiaireData?.packId || beneficiaireData?.packSupplementId)
    };
  } catch (error) {
    handleFirebaseError(error, 'la modification du bénéficiaire');
  }
}

/**
 * Supprime un bénéficiaire
 */
/**
 * 🔥 MODIFIÉ : Supprime un bénéficiaire avec mosqueeId
 */
export async function supprimerBeneficiaire(id, mosqueeId) {
  try {
    if (!mosqueeId) {
      throw new Error('mosqueeId est requis pour la suppression');
    }

    // Récupérer le bénéficiaire avant suppression
    const docRef = doc(db, 'beneficiaires', id);
    const beneficiaireDoc = await getDoc(docRef);
    
    if (!beneficiaireDoc.exists()) {
      throw new Error('Bénéficiaire non trouvé');
    }
    
    const beneficiaire = beneficiaireDoc.data();
    
    // Vérifier que le bénéficiaire appartient bien à cette mosquée
    if (beneficiaire.mosqueeId !== mosqueeId) {
      throw new Error('Ce bénéficiaire n\'appartient pas à votre mosquée');
    }
    
    await deleteDoc(docRef);
    console.log(`✅ Bénéficiaire ${id} supprimé de la mosquée ${mosqueeId}`);
    
    // Régénérer les packs si le bénéficiaire était validé
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
 * 🎯 LISTENER EN TEMPS RÉEL : Écoute les changements de l'inventaire (filtré par mosquée)
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

/**
 * 🎯 LISTENER EN TEMPS RÉEL : Écoute les changements des packs (filtré par mosquée)
 */
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

/**
 * 🎯 LISTENER EN TEMPS RÉEL : Écoute les changements des bénéficiaires (filtré par mosquée)
 */
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