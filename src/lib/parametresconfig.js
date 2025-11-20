import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Paramètres par défaut
export const PARAMETRES_DEFAUT = {
  repartition: {
    standard: 70,
    supplement: 30
  },
  coefficients: {
    'Petite': 1,
    'Moyenne': 2,
    'Grande': 3
  },
  updatedAt: new Date().toISOString(),
  updatedBy: null
};

/**
 * Récupère les paramètres de configuration
 */
export async function getParametres() {
  try {
    const docRef = doc(db, 'parametres', 'configuration');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // Si les paramètres n'existent pas, créer avec les valeurs par défaut
      await setDoc(docRef, PARAMETRES_DEFAUT);
      return PARAMETRES_DEFAUT;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    return PARAMETRES_DEFAUT;
  }
}

/**
 * Met à jour les paramètres de configuration
 */
export async function updateParametres(nouveauxParametres, userEmail) {
  try {
    const docRef = doc(db, 'parametres', 'configuration');
    
    const parametres = {
      ...nouveauxParametres,
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail
    };
    
    await setDoc(docRef, parametres);
    
    console.log('✅ Paramètres mis à jour avec succès');
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error);
    throw new Error('Erreur lors de la mise à jour des paramètres');
  }
}

/**
 * Valide que les paramètres sont corrects
 */
export function validerParametres(parametres) {
  const erreurs = [];
  
  // Vérifier la répartition
  if (parametres.repartition) {
    const { standard, supplement } = parametres.repartition;
    
    if (standard < 0 || standard > 100) {
      erreurs.push('Le pourcentage standard doit être entre 0 et 100');
    }
    
    if (supplement < 0 || supplement > 100) {
      erreurs.push('Le pourcentage supplément doit être entre 0 et 100');
    }
    
    if (Math.abs(standard + supplement - 100) > 0.1) {
      erreurs.push('La somme des pourcentages doit être égale à 100%');
    }
  }
  
  // Vérifier les coefficients
  if (parametres.coefficients) {
    const { Petite, Moyenne, Grande } = parametres.coefficients;
    
    if (!Petite || Petite < 0.1 || Petite > 10) {
      erreurs.push('Le coefficient Petite doit être entre 0.1 et 10');
    }
    
    if (!Moyenne || Moyenne < 0.1 || Moyenne > 10) {
      erreurs.push('Le coefficient Moyenne doit être entre 0.1 et 10');
    }
    
    if (!Grande || Grande < 0.1 || Grande > 10) {
      erreurs.push('Le coefficient Grande doit être entre 0.1 et 10');
    }
  }
  
  return erreurs;
}
