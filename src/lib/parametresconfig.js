/**
 * Gestion des paramètres de configuration pour la génération des packs
 * 🔥 VERSION COMPATIBLE : Supporte ancien (global) et nouveau (par mosquée)
 */

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Valeurs par défaut des paramètres
 */
export const PARAMETRES_DEFAUT = {
  repartition: {
    standard: 70,      // 70% pour packs standard
    supplement: 30     // 30% pour suppléments articles favoris
  }
  // 🔥 COEFFICIENTS SUPPRIMÉS : Maintenant calculés dynamiquement
};

/**
 * 🔥 VERSION COMPATIBLE : Récupère les paramètres de configuration
 * 
 * Si mosqueeId fourni → Nouveau système (par mosquée)
 * Si mosqueeId absent → Ancien système (global)
 */
export async function getParametres(mosqueeId = null) {
  try {
    let docRef;
    
    // 🔥 RÉTROCOMPATIBILITÉ
    if (mosqueeId && mosqueeId !== 'ALL') {
      // NOUVEAU SYSTÈME : Par mosquée
      docRef = doc(db, 'mosquees', mosqueeId, 'configuration', 'parametres');
    } else {
      // ANCIEN SYSTÈME : Global
      docRef = doc(db, 'parametres', 'configuration');
    }
    
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Retourner uniquement la répartition (coefficients auto)
      return {
        repartition: data.repartition || PARAMETRES_DEFAUT.repartition
      };
    }
    
    return PARAMETRES_DEFAUT;
  } catch (error) {
    console.error('Erreur récupération paramètres:', error);
    return PARAMETRES_DEFAUT;
  }
}

/**
 * Met à jour les paramètres de configuration
 */
export async function updateParametres(parametres, mosqueeId = null, userId = null) {
  try {
    let docRef;
    
    // 🔥 RÉTROCOMPATIBILITÉ
    if (mosqueeId && mosqueeId !== 'ALL') {
      // NOUVEAU SYSTÈME : Par mosquée
      docRef = doc(db, 'mosquees', mosqueeId, 'configuration', 'parametres');
    } else {
      // ANCIEN SYSTÈME : Global
      docRef = doc(db, 'parametres', 'configuration');
    }
    
    const dataToSave = {
      repartition: parametres.repartition,
      updatedAt: serverTimestamp(),
      updatedBy: userId || 'system'
    };
    
    await setDoc(docRef, dataToSave, { merge: true });
    
    console.log('✅ Paramètres sauvegardés:', dataToSave);
    return true;
  } catch (error) {
    console.error('❌ Erreur sauvegarde paramètres:', error);
    throw error;
  }
}

/**
 * Valide les paramètres avant sauvegarde
 */
export function validerParametres(parametres) {
  const erreurs = [];
  
  // Vérifier la répartition
  if (!parametres.repartition) {
    erreurs.push('La répartition est obligatoire');
  } else {
    const { standard, supplement } = parametres.repartition;
    
    if (typeof standard !== 'number' || typeof supplement !== 'number') {
      erreurs.push('Les pourcentages doivent être des nombres');
    }
    
    if (standard < 0 || standard > 100) {
      erreurs.push('Le pourcentage standard doit être entre 0 et 100');
    }
    
    if (supplement < 0 || supplement > 100) {
      erreurs.push('Le pourcentage supplément doit être entre 0 et 100');
    }
    
    if (Math.abs((standard + supplement) - 100) > 0.01) {
      erreurs.push('La somme des pourcentages doit égaler 100%');
    }
  }
  
  // 🔥 SUPPRIMÉ : Validation des coefficients (auto maintenant)
  
  return erreurs;
}

/**
 * Réinitialise les paramètres aux valeurs par défaut
 */
export async function resetParametres(mosqueeId = null, userId = null) {
  return updateParametres(PARAMETRES_DEFAUT, mosqueeId, userId);
}