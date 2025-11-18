/**
 * Calcule et génère automatiquement les packs en fonction de l'inventaire
 * Version avec articles favoris : RIZ, PÂTES, COUSCOUS
 * 
 * LOGIQUE :
 * - Articles favoris : 70% standard (avec coef) + 30% supplément (équitable)
 * - Autres articles : 100% avec coefficients
 */

// Définition des tailles de famille
export const TAILLES_FAMILLE = ['Petite', 'Moyenne', 'Grande'];

// Coefficients par taille de famille
export const COEFFICIENTS = {
  'Petite': 1,
  'Moyenne': 2,
  'Grande': 3
};

// Articles favoris disponibles
export const ARTICLES_FAVORIS = ['RIZ', 'PÂTES', 'COUSCOUS'];

/**
 * Normalise le nom d'un article favori
 */
export function normaliserArticleFavori(articleFavori) {
  if (!articleFavori) return null;
  
  const article = articleFavori.toUpperCase();
  
  // Mapping pour les variantes
  const mapping = {
    'RIZ': 'RIZ',
    'PATE': 'PÂTES',
    'PATES': 'PÂTES',
    'PÂTE': 'PÂTES',
    'PÂTES': 'PÂTES',
    'COUSCOUS': 'COUSCOUS',
    'SEMOULE': 'COUSCOUS'
  };
  
  return mapping[article] || null;
}

/**
 * Vérifie si un article d'inventaire correspond à un article favori
 */
export function matchArticleFavori(nomArticleInventaire, articleFavori) {
  const nomNormalise = nomArticleInventaire.toUpperCase();
  const favoriNormalise = articleFavori.toUpperCase();
  
  // Correspondances
  const correspondances = {
    'RIZ': ['RIZ'],
    'PÂTES': ['PÂTE', 'PATES', 'PÂTES'],
    'COUSCOUS': ['COUSCOUS', 'SEMOULE']
  };
  
  const motsClefs = correspondances[favoriNormalise] || [favoriNormalise];
  
  return motsClefs.some(mot => nomNormalise.includes(mot));
}

/**
 * Vérifie si un article est un article favori
 */
export function isArticleFavori(nomArticle) {
  return ARTICLES_FAVORIS.some(favori => matchArticleFavori(nomArticle, favori));
}

/**
 * Calcule la distribution d'un article favori (70% + 30%)
 */
export function calculerDistributionArticleFavori(quantiteTotale) {
  return {
    standard: quantiteTotale * 0.7,
    supplement: quantiteTotale * 0.3
  };
}

/**
 * Répartit une quantité selon les coefficients
 * @returns {Object} Distribution par taille avec quantité par famille
 */
export function repartirSelonCoefficients(quantiteTotale, nombreFamillesParTaille) {
  const distribution = {};
  
  // Calculer le total des parts
  let totalParts = 0;
  
  for (const taille of TAILLES_FAMILLE) {
    const nbFamilles = nombreFamillesParTaille[taille] || 0;
    if (nbFamilles > 0) {
      const coef = COEFFICIENTS[taille];
      totalParts += nbFamilles * coef;
    }
  }
  
  if (totalParts === 0) {
    return distribution;
  }
  
  const quantiteParPart = quantiteTotale / totalParts;
  
  // Calculer pour chaque taille
  for (const taille of TAILLES_FAMILLE) {
    const nbFamilles = nombreFamillesParTaille[taille] || 0;
    if (nbFamilles > 0) {
      const coef = COEFFICIENTS[taille];
      const quantiteParFamille = quantiteParPart * coef;
      
      distribution[taille] = {
        quantiteParFamille: Math.round(quantiteParFamille * 100) / 100,
        nombreFamilles: nbFamilles,
        quantiteTotale: Math.round(quantiteParFamille * nbFamilles * 100) / 100
      };
    }
  }
  
  return distribution;
}

/**
 * Répartit équitablement sans coefficient (pour les 30% supplément)
 * @returns {Object} { quantiteParFamille, nombreFamilles, quantiteTotale }
 */
export function repartirEquitablement(quantiteTotale, nombreFamillesTotal) {
  if (nombreFamillesTotal === 0) {
    return {
      quantiteParFamille: 0,
      nombreFamilles: 0,
      quantiteTotale: 0
    };
  }
  
  const quantiteParFamille = quantiteTotale / nombreFamillesTotal;
  
  return {
    quantiteParFamille: Math.round(quantiteParFamille * 100) / 100,
    nombreFamilles: nombreFamillesTotal,
    quantiteTotale: Math.round(quantiteParFamille * nombreFamillesTotal * 100) / 100
  };
}

/**
 * Génère tous les packs automatiquement
 * Retourne : { packsStandard: [], packsSupplements: [] }
 */
export function genererPacksAutomatiques(inventaire, beneficiaires) {
  console.log('🚀 Début génération packs avec articles favoris');
  
  const packsStandard = [];
  const packsSupplements = [];
  
  // 1. Compter les familles par taille
  const nombreFamillesParTaille = {
    'Petite': 0,
    'Moyenne': 0,
    'Grande': 0
  };
  
  // 2. Compter les familles par article favori
  const famillesParArticleFavori = {
    'RIZ': 0,
    'PÂTES': 0,
    'COUSCOUS': 0
  };
  
  // Filtrer les bénéficiaires validés
  const beneficiairesValides = beneficiaires.filter(b => 
    b.statut === 'Validé' || b.statut === 'Pack Attribué'
  );
  
  console.log('✅ Bénéficiaires validés:', beneficiairesValides.length);
  
  beneficiairesValides.forEach(b => {
    const taille = b.tailleFamille;
    
    // Compter par taille
    if (nombreFamillesParTaille[taille] !== undefined) {
      nombreFamillesParTaille[taille]++;
    }
    
    // Compter par article favori
    const articleFavori = normaliserArticleFavori(b.articleFavori);
    if (articleFavori && famillesParArticleFavori[articleFavori] !== undefined) {
      famillesParArticleFavori[articleFavori]++;
    }
  });
  
  console.log('📊 Répartition par taille:', nombreFamillesParTaille);
  console.log('📊 Répartition par article favori:', famillesParArticleFavori);
  
  // 3. GÉNÉRER LES PACKS STANDARD (par taille de famille)
  for (const taille of TAILLES_FAMILLE) {
    const nbFamilles = nombreFamillesParTaille[taille];
    
    if (nbFamilles === 0) continue;
    
    const pack = {
      tailleFamille: taille,
      composition: [],
      type: 'standard',
      nombreFamilles: nbFamilles
    };
    
    // Ajouter les articles au pack standard
    inventaire.forEach(article => {
      const isFavori = isArticleFavori(article.nom);
      
      if (isFavori) {
        // Articles favoris : 70% avec coefficient
        const { standard } = calculerDistributionArticleFavori(article.quantite);
        const distStandard = repartirSelonCoefficients(standard, nombreFamillesParTaille);
        
        if (distStandard[taille]) {
          pack.composition.push({
            produit: article.nom,
            quantiteParFamille: distStandard[taille].quantiteParFamille,
            unite: article.unite,
            type: 'standard-70%'
          });
        }
      } else {
        // Autres articles : 100% avec coefficient
        const distribution = repartirSelonCoefficients(article.quantite, nombreFamillesParTaille);
        
        if (distribution[taille]) {
          pack.composition.push({
            produit: article.nom,
            quantiteParFamille: distribution[taille].quantiteParFamille,
            unite: article.unite,
            type: 'standard-100%'
          });
        }
      }
    });
    
    if (pack.composition.length > 0) {
      packsStandard.push(pack);
    }
  }
  
  // 4. GÉNÉRER LES PACKS SUPPLÉMENTS (par article favori)
  ARTICLES_FAVORIS.forEach(articleFavori => {
    const nbFamillesConcernees = famillesParArticleFavori[articleFavori];
    
    if (nbFamillesConcernees === 0) return;
    
    const pack = {
      articleFavori: articleFavori,
      composition: [],
      type: 'supplement',
      nombreFamilles: nbFamillesConcernees
    };
    
    // Trouver l'article correspondant dans l'inventaire
    inventaire.forEach(article => {
      if (matchArticleFavori(article.nom, articleFavori)) {
        const { supplement } = calculerDistributionArticleFavori(article.quantite);
        
        // Distribution équitable (30%) sans coefficient
        const distSupplement = repartirEquitablement(supplement, nbFamillesConcernees);
        
        pack.composition.push({
          produit: article.nom,
          quantiteParFamille: distSupplement.quantiteParFamille,
          quantiteTotale: distSupplement.quantiteTotale,
          unite: article.unite,
          type: 'supplement-30%'
        });
      }
    });
    
    if (pack.composition.length > 0) {
      packsSupplements.push(pack);
    }
  });
  
  console.log(`✅ Packs standard générés: ${packsStandard.length}`);
  console.log(`✅ Packs suppléments générés: ${packsSupplements.length}`);
  
  return {
    packsStandard,
    packsSupplements,
    statistiques: {
      famillesParTaille: nombreFamillesParTaille,
      famillesParArticleFavori: famillesParArticleFavori,
      totalFamilles: beneficiairesValides.length
    }
  };
}

/**
 * Formatte l'affichage des packs pour l'interface admin
 */
export function formatterAffichagePacks(packsData) {
  const { packsStandard, packsSupplements, statistiques } = packsData;
  
  return {
    // Section 1 : Packs Standard par taille
    packsParTaille: packsStandard.map(pack => ({
      taille: pack.tailleFamille,
      nombrePacks: pack.nombreFamilles,
      contenu: pack.composition.map(item => ({
        produit: item.produit,
        quantiteParPack: item.quantiteParFamille,
        unite: item.unite
      }))
    })),
    
    // Section 2 : Suppléments par article favori
    supplementsParArticle: packsSupplements.map(pack => ({
      articleFavori: pack.articleFavori,
      nombreSupplements: pack.nombreFamilles,
      contenu: pack.composition.map(item => ({
        produit: item.produit,
        quantiteParSupplement: item.quantiteParFamille,
        quantiteTotale: item.quantiteTotale,
        unite: item.unite
      }))
    })),
    
    // Section 3 : Statistiques globales
    resume: {
      totalFamilles: statistiques.totalFamilles,
      repartitionTailles: statistiques.famillesParTaille,
      repartitionArticlesFavoris: statistiques.famillesParArticleFavori
    }
  };
}