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

// Coefficients par défaut (peuvent être surchargés par les paramètres de configuration)
export const COEFFICIENTS_DEFAUT = {
  'Petite': 1,
  'Moyenne': 2,
  'Grande': 3
};

// Articles favoris disponibles
export const ARTICLES_FAVORIS = ['RIZ', 'PÂTES', 'COUSCOUS'];

/**
 * Détermine la taille de famille selon le nombre de personnes
 * @param {number} nbPersonnes - Nombre de personnes dans la famille
 * @returns {string} 'Petite', 'Moyenne' ou 'Grande'
 */
export function determinerTailleFamille(nbPersonnes) {
  if (nbPersonnes <= 2) return 'Petite';
  if (nbPersonnes <= 5) return 'Moyenne';
  return 'Grande';
}

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
 * Calcule la distribution d'un article favori avec des pourcentages configurables
 * @param {number} quantiteTotale - Quantité totale disponible
 * @param {number} pourcentageStandard - Pourcentage pour les packs standard (défaut: 70)
 * @returns {Object} { standard, supplement }
 */
export function calculerDistributionArticleFavori(quantiteTotale, pourcentageStandard = 70) {
  const standard = quantiteTotale * (pourcentageStandard / 100);
  const supplement = quantiteTotale * ((100 - pourcentageStandard) / 100);
  
  return {
    standard,
    supplement
  };
}

/**
 * Répartit une quantité selon les coefficients AVEC redistribution des restes
 * @param {number} quantiteTotale - Quantité totale à répartir
 * @param {Object} nombreFamillesParTaille - Nombre de familles par taille
 * @param {Object} coefficients - Coefficients personnalisés (optionnel)
 * @returns {Object} { distribution: {...}, resteNonDistribue: number }
 */
export function repartirAvecRedistribution(quantiteTotale, nombreFamillesParTaille, coefficients = COEFFICIENTS_DEFAUT) {
  const distribution = {};
  const restesParPack = [];
  
  console.log('📊 repartirAvecRedistribution appelée avec:', {
    quantiteTotale,
    nombreFamillesParTaille,
    coefficients
  });
  
  // Étape 1 : Calculer le total des parts
  let totalParts = 0;
  for (const taille of TAILLES_FAMILLE) {
    const nbFamilles = nombreFamillesParTaille[taille] || 0;
    if (nbFamilles > 0) {
      const coef = coefficients[taille] || COEFFICIENTS_DEFAUT[taille];
      totalParts += nbFamilles * coef;
    }
  }
  
  if (totalParts === 0) {
    return { distribution: {}, resteNonDistribue: quantiteTotale };
  }
  
  const quantiteParPart = quantiteTotale / totalParts;
  console.log(`   Total parts: ${totalParts}, Quantité par part: ${quantiteParPart.toFixed(4)}`);
  
  // Étape 2 : Calculer pour chaque taille avec arrondi inférieur
  let totalDistribue = 0;
  
  for (const taille of TAILLES_FAMILLE) {
    const nbFamilles = nombreFamillesParTaille[taille] || 0;
    if (nbFamilles > 0) {
      const coef = coefficients[taille] || COEFFICIENTS_DEFAUT[taille];
      const quantiteTheoriqueParFamille = quantiteParPart * coef;
      const quantiteArrondie = Math.floor(quantiteTheoriqueParFamille); // Arrondi inférieur
      const resteParFamille = quantiteTheoriqueParFamille - quantiteArrondie;
      const resteTotalPack = resteParFamille * nbFamilles;
      
      distribution[taille] = {
        quantiteParFamille: quantiteArrondie,
        nombreFamilles: nbFamilles,
        quantiteTotale: quantiteArrondie * nbFamilles,
        resteParFamille: resteParFamille,
        resteTotalPack: resteTotalPack
      };
      
      totalDistribue += quantiteArrondie * nbFamilles;
      
      // Garder trace des restes pour redistribution
      restesParPack.push({
        taille: taille,
        resteTotalPack: resteTotalPack,
        nbFamilles: nbFamilles
      });
      
      console.log(`   ${taille}: ${quantiteArrondie}kg/famille (reste: ${resteParFamille.toFixed(4)}kg × ${nbFamilles} = ${resteTotalPack.toFixed(2)}kg)`);
    }
  }
  
  // Étape 3 : Redistribuer les restes
  let resteDisponible = quantiteTotale - totalDistribue;
  console.log(`   💰 Reste disponible pour redistribution: ${resteDisponible.toFixed(2)}kg`);
  
  // Trier les packs par reste décroissant
  restesParPack.sort((a, b) => b.resteTotalPack - a.resteTotalPack);
  
  for (const packInfo of restesParPack) {
    // Peut-on donner +1kg par famille à ce pack ?
    const besoinPourBonus = packInfo.nbFamilles * 1; // 1kg par famille
    
    if (resteDisponible >= besoinPourBonus) {
      console.log(`   🎁 Pack ${packInfo.taille}: +1kg par famille (${besoinPourBonus}kg distribués)`);
      distribution[packInfo.taille].quantiteParFamille += 1;
      distribution[packInfo.taille].quantiteTotale += besoinPourBonus;
      resteDisponible -= besoinPourBonus;
      totalDistribue += besoinPourBonus;
    }
  }
  
  console.log(`   ✅ Distribution finale: ${totalDistribue.toFixed(2)}kg distribués, ${resteDisponible.toFixed(2)}kg restants`);
  
  return {
    distribution: distribution,
    resteNonDistribue: resteDisponible
  };
}

/**
 * Répartit une quantité selon les coefficients (ANCIENNE VERSION - gardée pour compatibilité)
 * @param {number} quantiteTotale - Quantité totale à répartir
 * @param {Object} nombreFamillesParTaille - Nombre de familles par taille
 * @param {Object} coefficients - Coefficients personnalisés (optionnel)
 * @returns {Object} Distribution par taille avec quantité par famille
 */
export function repartirSelonCoefficients(quantiteTotale, nombreFamillesParTaille, coefficients = COEFFICIENTS_DEFAUT) {
  const { distribution } = repartirAvecRedistribution(quantiteTotale, nombreFamillesParTaille, coefficients);
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
 * Génère tous les packs automatiquement avec paramètres configurables
 * @param {Array} inventaire - Liste des articles de l'inventaire
 * @param {Array} beneficiaires - Liste des bénéficiaires
 * @param {Object} parametres - Paramètres de configuration (optionnel)
 * @returns {Object} { packsStandard: [], packsSupplements: [] }
 */
export function genererPacksAutomatiques(inventaire, beneficiaires, parametres = null) {
  console.log('🚀 Début génération packs avec articles favoris');
  console.log('📥 PARAMETRES REÇUS:', parametres);
  
  // Utiliser les paramètres fournis ou les valeurs par défaut
  const pourcentageStandard = parametres?.repartition?.standard || 70;
  const coefficients = parametres?.coefficients || COEFFICIENTS_DEFAUT;
  
  console.log('⚙️ Paramètres utilisés:', {
    pourcentageStandard,
    pourcentageSupplement: 100 - pourcentageStandard,
    coefficients
  });
  console.log('🔍 COEFFICIENTS DETAILS:', {
    Petite: coefficients.Petite,
    Moyenne: coefficients.Moyenne,
    Grande: coefficients.Grande
  });
  
  const packsStandard = [];
  const packsSupplements = [];
  const packBonus = {
    type: 'bonus',
    composition: []
  };
  
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
        // Déterminer quel article favori correspond
        let articleFavoriType = null;
        ARTICLES_FAVORIS.forEach(favori => {
          if (matchArticleFavori(article.nom, favori)) {
            articleFavoriType = favori;
          }
        });
        
        // Vérifier si quelqu'un a choisi cet article favori
        const nbFamillesAvecCetArticle = articleFavoriType ? (famillesParArticleFavori[articleFavoriType] || 0) : 0;
        
        if (nbFamillesAvecCetArticle > 0) {
          // ✅ Des familles ont choisi cet article → Distribution 70/30
          console.log(`   📦 ${article.nom}: ${nbFamillesAvecCetArticle} familles ont choisi → ${pourcentageStandard}% standard`);
          const { standard } = calculerDistributionArticleFavori(article.quantite, pourcentageStandard);
          const { distribution: distStandard, resteNonDistribue } = repartirAvecRedistribution(standard, nombreFamillesParTaille, coefficients);
          
          if (distStandard[taille]) {
            pack.composition.push({
              produit: article.nom,
              quantiteParFamille: distStandard[taille].quantiteParFamille,
              unite: article.unite,
              type: `standard-${pourcentageStandard}%`
            });
          }
          
          // Accumuler le reste dans le pack bonus
          if (resteNonDistribue > 0) {
            const existingBonus = packBonus.composition.find(item => item.produit === article.nom);
            if (existingBonus) {
              existingBonus.quantite += resteNonDistribue;
            } else {
              packBonus.composition.push({
                produit: article.nom,
                quantite: resteNonDistribue,
                unite: article.unite
              });
            }
          }
        } else {
          // ❌ Personne n'a choisi cet article → Distribution 100%
          console.log(`   📦 ${article.nom}: Personne n'a choisi → 100% standard`);
          const { distribution, resteNonDistribue } = repartirAvecRedistribution(article.quantite, nombreFamillesParTaille, coefficients);
          
          if (distribution[taille]) {
            pack.composition.push({
              produit: article.nom,
              quantiteParFamille: distribution[taille].quantiteParFamille,
              unite: article.unite,
              type: 'standard-100% (aucun choix)'
            });
          }
          
          // Accumuler le reste dans le pack bonus
          if (resteNonDistribue > 0) {
            const existingBonus = packBonus.composition.find(item => item.produit === article.nom);
            if (existingBonus) {
              existingBonus.quantite += resteNonDistribue;
            } else {
              packBonus.composition.push({
                produit: article.nom,
                quantite: resteNonDistribue,
                unite: article.unite
              });
            }
          }
        }
      } else {
        // Autres articles : 100% avec coefficient et redistribution
        const { distribution, resteNonDistribue } = repartirAvecRedistribution(article.quantite, nombreFamillesParTaille, coefficients);
        
        if (distribution[taille]) {
          pack.composition.push({
            produit: article.nom,
            quantiteParFamille: distribution[taille].quantiteParFamille,
            unite: article.unite,
            type: 'standard-100%'
          });
        }
        
        // Accumuler le reste dans le pack bonus
        if (resteNonDistribue > 0) {
          const existingBonus = packBonus.composition.find(item => item.produit === article.nom);
          if (existingBonus) {
            existingBonus.quantite += resteNonDistribue;
          } else {
            packBonus.composition.push({
              produit: article.nom,
              quantite: resteNonDistribue,
              unite: article.unite
            });
          }
        }
      }
    });
    
    if (pack.composition.length > 0) {
      packsStandard.push(pack);
    }
  }
  
  // 4. GÉNÉRER LES PACKS SUPPLÉMENTS (par article favori) avec redistribution
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
        const { supplement } = calculerDistributionArticleFavori(article.quantite, pourcentageStandard);
        
        // Distribution équitable avec arrondi et redistribution
        const quantiteParPersonne = supplement / nbFamillesConcernees;
        const quantiteArrondie = Math.floor(quantiteParPersonne);
        const resteParPersonne = quantiteParPersonne - quantiteArrondie;
        let totalDistribue = quantiteArrondie * nbFamillesConcernees;
        let resteDisponible = supplement - totalDistribue;
        
        console.log(`   🎁 Supplément ${article.nom}: ${supplement.toFixed(2)}kg pour ${nbFamillesConcernees} personnes`);
        console.log(`      → ${quantiteArrondie}kg/personne, reste: ${resteDisponible.toFixed(2)}kg`);
        
        // Redistribuer les kilos entiers aux bénéficiaires
        let nbBonus = Math.floor(resteDisponible);
        if (nbBonus > 0) {
          console.log(`      → ${nbBonus} personne(s) reçoivent +1kg`);
          totalDistribue += nbBonus;
          resteDisponible -= nbBonus;
        }
        
        pack.composition.push({
          produit: article.nom,
          quantiteParFamille: quantiteArrondie,
          quantiteTotale: totalDistribue,
          unite: article.unite,
          type: `supplement-${100 - pourcentageStandard}%`,
          noteRedistribution: nbBonus > 0 ? `${nbBonus} bénéficiaire(s) reçoivent +1kg` : null
        });
        
        // Accumuler le reste dans le pack bonus
        if (resteDisponible > 0) {
          console.log(`      → Reste pour bonus: ${resteDisponible.toFixed(2)}kg`);
          const existingBonus = packBonus.composition.find(item => item.produit === article.nom);
          if (existingBonus) {
            existingBonus.quantite += resteDisponible;
          } else {
            packBonus.composition.push({
              produit: article.nom,
              quantite: resteDisponible,
              unite: article.unite
            });
          }
        }
      }
    });
    
    if (pack.composition.length > 0) {
      packsSupplements.push(pack);
    }
  });
  
  // 5. Ajouter le pack bonus s'il contient des articles
  if (packBonus.composition.length > 0) {
    // Arrondir les quantités du pack bonus à 2 décimales
    packBonus.composition.forEach(item => {
      item.quantite = Math.round(item.quantite * 100) / 100;
    });
    
    const totalBonus = packBonus.composition.reduce((sum, item) => sum + item.quantite, 0);
    packBonus.quantiteTotale = Math.round(totalBonus * 100) / 100;
    packBonus.note = 'Restes à distribuer en priorité ou premier arrivé';
    
    console.log(`📦 Pack Bonus créé avec ${packBonus.composition.length} articles (${packBonus.quantiteTotale.toFixed(2)}kg total)`);
    packsSupplements.push(packBonus);
  }
  
  console.log(`✅ Packs standard générés: ${packsStandard.length}`);
  console.log(`✅ Packs suppléments générés: ${packsSupplements.length - (packBonus.composition.length > 0 ? 1 : 0)}`);
  console.log(`✅ Pack bonus: ${packBonus.composition.length > 0 ? 'OUI' : 'NON'}`);
  
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