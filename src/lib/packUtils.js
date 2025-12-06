// src/lib/packUtils.js
import { getDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Récupère les détails complets du pack attribué à un bénéficiaire
 * @param {Object} beneficiaire - L'objet bénéficiaire avec packId et packSupplementId
 * @returns {Promise<Object>} - Objet contenant packStandard, packSupplement et résumé
 */
export async function getPacksAttribues(beneficiaire) {
  const result = {
    packStandard: null,
    packSupplement: null,
    hasPackStandard: false,
    hasPackSupplement: false,
    totalArticles: 0,
    dateAttribution: beneficiaire.dateAttribution || null
  };

  try {
    // Récupérer le pack standard
    if (beneficiaire.packId) {
      const packDoc = await getDoc(doc(db, 'packs', beneficiaire.packId));
      if (packDoc.exists()) {
        result.packStandard = {
          id: packDoc.id,
          ...packDoc.data()
        };
        result.hasPackStandard = true;
        result.totalArticles += packDoc.data().composition?.length || 0;
      }
    }

    // Récupérer le pack supplément
    if (beneficiaire.packSupplementId) {
      const suppDoc = await getDoc(doc(db, 'packs', beneficiaire.packSupplementId));
      if (suppDoc.exists()) {
        result.packSupplement = {
          id: suppDoc.id,
          ...suppDoc.data()
        };
        result.hasPackSupplement = true;
        result.totalArticles += suppDoc.data().composition?.length || 0;
      }
    }

    return result;
  } catch (error) {
    console.error('Erreur lors de la récupération des packs:', error);
    throw error;
  }
}

/**
 * Récupère tous les articles d'un pack attribué (standard + supplément combinés)
 * @param {Object} beneficiaire - L'objet bénéficiaire
 * @returns {Promise<Array>} - Tableau d'articles avec leurs quantités
 */
export async function getArticlesCompletsPack(beneficiaire) {
  const { packStandard, packSupplement } = await getPacksAttribues(beneficiaire);
  
  const articles = [];
  
  // Ajouter les articles du pack standard
  if (packStandard?.composition) {
    packStandard.composition.forEach(item => {
      articles.push({
        ...item,
        source: 'standard',
        tailleFamille: packStandard.tailleFamille
      });
    });
  }
  
  // Ajouter les articles du supplément
  if (packSupplement?.composition) {
    packSupplement.composition.forEach(item => {
      articles.push({
        ...item,
        source: 'supplement',
        articleFavori: packSupplement.articleFavori
      });
    });
  }
  
  return articles;
}

/**
 * Génère un résumé textuel du pack attribué
 * @param {Object} beneficiaire - L'objet bénéficiaire
 * @returns {Promise<string>} - Résumé textuel
 */
export async function getResumePack(beneficiaire) {
  const { packStandard, packSupplement, totalArticles } = await getPacksAttribues(beneficiaire);
  
  let resume = '';
  
  if (packStandard) {
    resume += `Pack ${packStandard.tailleFamille} (${packStandard.composition?.length || 0} articles)`;
  }
  
  if (packSupplement) {
    if (resume) resume += ' + ';
    const emoji = {
      'RIZ': '🍚',
      'PÂTES': '🍝',
      'COUSCOUS': '🥘'
    }[packSupplement.articleFavori] || '';
    resume += `${emoji} Supplément ${packSupplement.articleFavori} (${packSupplement.composition?.length || 0} articles)`;
  }
  
  if (!resume) {
    resume = 'Aucun pack attribué';
  }
  
  return resume;
}

/**
 * Exporte les détails d'un pack en format structuré (pour Excel, PDF, etc.)
 * @param {Object} beneficiaire - L'objet bénéficiaire
 * @returns {Promise<Object>} - Données structurées pour export
 */
export async function exportPackDetails(beneficiaire) {
  const { packStandard, packSupplement } = await getPacksAttribues(beneficiaire);
  
  const exportData = {
    beneficiaire: {
      nom: beneficiaire.nom,
      adresse: beneficiaire.adresse,
      telephone: beneficiaire.telephone,
      nbPersonnes: beneficiaire.nbPersonnes,
      tailleFamille: beneficiaire.tailleFamille,
      articleFavori: beneficiaire.articleFavori
    },
    attribution: {
      date: beneficiaire.dateAttribution,
      hasPackStandard: !!packStandard,
      hasPackSupplement: !!packSupplement
    },
    packStandard: packStandard ? {
      tailleFamille: packStandard.tailleFamille,
      articles: packStandard.composition?.map(item => ({
        produit: item.produit,
        quantite: item.quantiteParFamille || item.quantite,
        unite: item.unite,
        type: item.type
      })) || []
    } : null,
    packSupplement: packSupplement ? {
      articleFavori: packSupplement.articleFavori,
      articles: packSupplement.composition?.map(item => ({
        produit: item.produit,
        quantite: item.quantiteParFamille || item.quantite,
        unite: item.unite,
        type: item.type
      })) || []
    } : null
  };
  
  return exportData;
}

/**
 * Calcule les quantités totales de tous les articles pour un bénéficiaire
 * @param {Object} beneficiaire - L'objet bénéficiaire
 * @returns {Promise<Object>} - Objet avec les totaux par produit
 */
export async function calculerQuantitesTotales(beneficiaire) {
  const articles = await getArticlesCompletsPack(beneficiaire);
  
  const totaux = {};
  
  articles.forEach(item => {
    const qte = item.quantiteParFamille || item.quantite;
    const key = `${item.produit}_${item.unite}`;
    
    if (!totaux[key]) {
      totaux[key] = {
        produit: item.produit,
        quantite: 0,
        unite: item.unite,
        type: item.type,
        sources: []
      };
    }
    
    totaux[key].quantite += parseFloat(qte);
    totaux[key].sources.push(item.source);
  });
  
  return Object.values(totaux);
}