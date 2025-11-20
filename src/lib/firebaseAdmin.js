import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, writeBatch, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { genererPacksAutomatiques, normaliserArticleFavori } from './packCalculator';
import { getParametres } from '@/lib/parametresconfig';

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
 * Récupère tous les articles de l'inventaire
 */
export async function getInventaire() {
  const querySnapshot = await getDocs(collection(db, 'inventaire'));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Ajoute un article à l'inventaire et régénère automatiquement les packs
 */
export async function ajouterArticleInventaire(article) {
  const docRef = await addDoc(collection(db, 'inventaire'), {
    nom: article.nom,
    quantite: parseFloat(article.quantite),
    unite: article.unite,
    seuil: parseFloat(article.seuil) || 50,
    createdAt: new Date().toISOString()
  });
  
  console.log('✅ Article ajouté, régénération automatique des packs...');
  
  // Régénération automatique des packs après ajout
  try {
    await genererEtSauvegarderPacks();
  } catch (error) {
    console.error('❌ Erreur lors de la régénération après ajout:', error);
  }
  
  return docRef.id;
}

/**
 * Met à jour un article de l'inventaire et régénère automatiquement les packs
 */
export async function updateArticleInventaire(id, updates) {
  const docRef = doc(db, 'inventaire', id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
  
  console.log('✅ Article mis à jour, régénération automatique des packs...');
  
  // Régénération automatique des packs après modification
  try {
    await genererEtSauvegarderPacks();
  } catch (error) {
    console.error('❌ Erreur lors de la régénération après modification:', error);
  }
}

/**
 * Supprime un article de l'inventaire et régénère automatiquement les packs
 */
export async function supprimerArticleInventaire(id) {
  await deleteDoc(doc(db, 'inventaire', id));
  
  console.log('✅ Article supprimé, régénération automatique des packs...');
  
  // Régénération automatique des packs après suppression
  try {
    await genererEtSauvegarderPacks();
  } catch (error) {
    console.error('❌ Erreur lors de la régénération après suppression:', error);
  }
}

/**
 * Récupère tous les bénéficiaires
 */
export async function getBeneficiaires() {
  const querySnapshot = await getDocs(collection(db, 'beneficiaires'));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
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
 * Récupère tous les packs
 */
export async function getPacks() {
  const querySnapshot = await getDocs(collection(db, 'packs'));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * 🔥 FONCTION PRINCIPALE : Génère et sauvegarde automatiquement tous les packs
 * Cette fonction est appelée automatiquement après chaque modification de l'inventaire
 */
export async function genererEtSauvegarderPacks() {
  try {
    console.log('🔄 Début de la régénération automatique des packs...');
    
    // 1. Charger les paramètres de configuration
    const parametres = await getParametres();
    console.log('⚙️ Paramètres chargés:', parametres);
    
    // 2. Récupérer l'inventaire et les bénéficiaires
    const inventaire = await getInventaire();
    const beneficiaires = await getBeneficiaires();
    
    console.log('📦 Génération des packs avec articles favoris...');
    console.log(`   - Inventaire: ${inventaire.length} articles`);
    console.log(`   - Bénéficiaires: ${beneficiaires.length} personnes`);
    console.log(`   - Répartition: ${parametres.repartition.standard}% standard / ${parametres.repartition.supplement}% supplément`);
    console.log(`   - Coefficients: Petite=${parametres.coefficients.Petite}, Moyenne=${parametres.coefficients.Moyenne}, Grande=${parametres.coefficients.Grande}`);
    
    // 3. Générer les packs avec les paramètres configurés
    const { packsStandard, packsSupplements } = genererPacksAutomatiques(inventaire, beneficiaires, parametres);
    
    // 4. Combiner les deux types de packs
    const tousLesPacks = [...packsStandard, ...packsSupplements];
    
    console.log(`📦 Packs standard: ${packsStandard.length}`);
    console.log(`🎁 Packs suppléments: ${packsSupplements.length}`);
    console.log(`✅ Total: ${tousLesPacks.length}`);
    
    // 5. Supprimer les anciens packs (en batch)
    const anciensPacks = await getDocs(collection(db, 'packs'));
    const batch = writeBatch(db);
    
    anciensPacks.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log('🗑️ Anciens packs supprimés');
    
    // 6. Sauvegarder les nouveaux packs
    const packsIds = [];
    for (const pack of tousLesPacks) {
      const docRef = await addDoc(collection(db, 'packs'), {
        ...pack,
        createdAt: new Date().toISOString(),
        generationAuto: true // Marqueur pour indiquer que c'est une génération automatique
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
 * Attribue les packs aux bénéficiaires validés
 */
export async function attribuerPacksAuxBeneficiaires() {
  try {
    const beneficiaires = await getBeneficiaires();
    const packs = await getPacks();
    
    console.log('🎯 Attribution des packs aux bénéficiaires...');
    
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
        tailleFamille: tailleFamille, // Sauvegarder la taille calculée
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
 * Supprime tous les packs
 */
export async function supprimerTousLesPacks() {
  try {
    console.log('🗑️ Suppression de tous les packs...');
    
    const querySnapshot = await getDocs(collection(db, 'packs'));
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
 * Ajoute un bénéficiaire (depuis l'admin)
 */
export async function ajouterBeneficiaire(beneficiaire) {
  try {
    const docRef = await addDoc(collection(db, 'beneficiaires'), {
      ...beneficiaire,
      createdAt: new Date().toISOString()
    });
    
    // Régénérer les packs si le bénéficiaire est validé
    if (beneficiaire.statut === 'Validé') {
      console.log('✅ Bénéficiaire validé ajouté, régénération des packs...');
      await genererEtSauvegarderPacks();
    }
    
    return docRef.id;
  } catch (error) {
    handleFirebaseError(error, 'l\'ajout du bénéficiaire');
  }
}

/**
 * Met à jour un bénéficiaire complet
 */
export async function updateBeneficiaire(id, beneficiaire) {
  try {
    const docRef = doc(db, 'beneficiaires', id);
    
    // Récupérer le bénéficiaire actuel pour vérifier s'il a un pack
    const beneficiaireActuel = await getDocs(collection(db, 'beneficiaires'));
    const beneficiaireData = beneficiaireActuel.docs.find(d => d.id === id)?.data();
    
    // Si le bénéficiaire a déjà un pack attribué et que des infos critiques changent
    // (articleFavori, taille), on réinitialise l'attribution
    const infoCritiquesChangent = beneficiaireData && (
      beneficiaireData.articleFavori !== beneficiaire.articleFavori ||
      beneficiaireData.tailleFamille !== beneficiaire.tailleFamille ||
      beneficiaireData.nbPersonnes !== beneficiaire.nbPersonnes
    );
    
    const updates = {
      ...beneficiaire,
      updatedAt: new Date().toISOString()
    };
    
    // Si les infos critiques changent et qu'un pack était attribué, réinitialiser
    if (infoCritiquesChangent && (beneficiaireData.packId || beneficiaireData.packSupplementId)) {
      updates.packId = null;
      updates.packSupplementId = null;
      updates.statut = 'Validé'; // Repasser en "Validé" au lieu de "Pack Attribué"
      console.log(`⚠️ Pack réinitialisé pour ${beneficiaire.nom} (modifications critiques)`);
    }
    
    await updateDoc(docRef, updates);
    
    // Régénérer les packs si nécessaire (statut validé ou infos critiques changées)
    const shouldRegenerate = 
      beneficiaire.statut === 'Validé' || 
      beneficiaireData?.statut === 'Validé' ||
      infoCritiquesChangent;
    
    if (shouldRegenerate) {
      console.log('✅ Bénéficiaire modifié, régénération des packs...');
      await genererEtSauvegarderPacks();
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
export async function supprimerBeneficiaire(id) {
  try {
    // Récupérer le bénéficiaire avant suppression
    const beneficiaires = await getBeneficiaires();
    const beneficiaire = beneficiaires.find(b => b.id === id);
    
    await deleteDoc(doc(db, 'beneficiaires', id));
    console.log(`✅ Bénéficiaire ${id} supprimé`);
    
    // Régénérer les packs si le bénéficiaire était validé
    if (beneficiaire && (beneficiaire.statut === 'Validé' || beneficiaire.statut === 'Pack Attribué')) {
      console.log('✅ Bénéficiaire validé supprimé, régénération des packs...');
      await genererEtSauvegarderPacks();
    }
    
    return { success: true };
  } catch (error) {
    handleFirebaseError(error, 'la suppression du bénéficiaire');
  }
}

/**
 * 🎯 LISTENER EN TEMPS RÉEL : Écoute les changements de l'inventaire
 * Retourne une fonction unsubscribe pour arrêter l'écoute
 */
export function ecouterInventaire(callback) {
  console.log('👂 Installation du listener temps réel sur l\'inventaire');
  
  const unsubscribe = onSnapshot(
    collection(db, 'inventaire'),
    (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('🔄 Inventaire mis à jour en temps réel:', items.length, 'articles');
      
      // Appeler le callback avec les données mises à jour
      callback(items);
    },
    (error) => {
      console.error('❌ Erreur listener inventaire:', error);
    }
  );
  
  return unsubscribe;
}

/**
 * 🎯 LISTENER EN TEMPS RÉEL : Écoute les changements des packs
 * Retourne une fonction unsubscribe pour arrêter l'écoute
 */
export function ecouterPacks(callback) {
  console.log('👂 Installation du listener temps réel sur les packs');
  
  const unsubscribe = onSnapshot(
    collection(db, 'packs'),
    (snapshot) => {
      const packs = [];
      snapshot.forEach((doc) => {
        packs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('🔄 Packs mis à jour en temps réel:', packs.length, 'packs');
      
      // Appeler le callback avec les données mises à jour
      callback(packs);
    },
    (error) => {
      console.error('❌ Erreur listener packs:', error);
    }
  );
  
  return unsubscribe;
}

/**
 * 🎯 LISTENER EN TEMPS RÉEL : Écoute les changements des bénéficiaires
 * Retourne une fonction unsubscribe pour arrêter l'écoute
 */
export function ecouterBeneficiaires(callback) {
  console.log('👂 Installation du listener temps réel sur les bénéficiaires');
  
  const unsubscribe = onSnapshot(
    collection(db, 'beneficiaires'),
    (snapshot) => {
      const beneficiaires = [];
      snapshot.forEach((doc) => {
        beneficiaires.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('🔄 Bénéficiaires mis à jour en temps réel:', beneficiaires.length, 'personnes');
      
      // Appeler le callback avec les données mises à jour
      callback(beneficiaires);
    },
    (error) => {
      console.error('❌ Erreur listener bénéficiaires:', error);
    }
  );
  
  return unsubscribe;
}