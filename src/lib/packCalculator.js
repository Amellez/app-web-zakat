/**
 * 🔥 VERSION 4 FINALE : Redistribution complète à 4 phases
 * 
 * Phase 1 : Packs Standard (70%)
 * Phase 2 : Packs Suppléments (30%)
 * Phase 3 : Redistribuer restes suppléments → Packs Standard
 * Phase 4 : Redistribuer Pack Bonus → Packs Standard (NOUVEAU ⭐)
 */

export const TAILLES_FAMILLE = ['Petite', 'Moyenne', 'Grande'];
export const ARTICLES_FAVORIS = ['RIZ', 'PÂTES', 'COUSCOUS'];

export function determinerTailleFamille(nbPersonnes) {
  if (nbPersonnes <= 2) return 'Petite';
  if (nbPersonnes <= 5) return 'Moyenne';
  return 'Grande';
}

export function normaliserArticleFavori(articleFavori) {
  if (!articleFavori) return null;
  const article = articleFavori.toUpperCase();
  const mapping = {
    'RIZ': 'RIZ', 'PATE': 'PÂTES', 'PATES': 'PÂTES', 'PÂTE': 'PÂTES', 'PÂTES': 'PÂTES',
    'COUSCOUS': 'COUSCOUS'
  };
  return mapping[article] || null;
}

export function matchArticleFavori(nomArticleInventaire, articleFavori) {
  const nomNormalise = nomArticleInventaire.toUpperCase();
  const favoriNormalise = articleFavori.toUpperCase();
  const correspondances = {
    'RIZ': ['RIZ'],
    'PÂTES': ['PÂTE', 'PATES', 'PÂTES'],
    'COUSCOUS': ['COUSCOUS']
  };
  const motsClefs = correspondances[favoriNormalise] || [favoriNormalise];
  return motsClefs.some(mot => nomNormalise.includes(mot));
}

export function isArticleFavori(nomArticle) {
  return ARTICLES_FAVORIS.some(favori => matchArticleFavori(nomArticle, favori));
}

export function calculerCoefficientsDynamiques(quantiteTotale, nombreFamillesParTaille) {
  const P = nombreFamillesParTaille['Petite'] || 0;
  const M = nombreFamillesParTaille['Moyenne'] || 0;
  const G = nombreFamillesParTaille['Grande'] || 0;
  
  const totalFamilles = P + M + G;
  
  if (totalFamilles === 0) {
    return { Petite: 1, Moyenne: 2, Grande: 3 };
  }
  
  if (G === 0 && M === 0) {
    return { Petite: quantiteTotale / P, Moyenne: 0, Grande: 0 };
  }
  
  const RATIO_MAX = 3;
  const Z = 1;
  const denominateur = 2 * G + M;
  
  if (denominateur === 0) {
    return { Petite: 1, Moyenne: 2, Grande: 3 };
  }
  
  let Y = (quantiteTotale + Z * (G - P)) / denominateur;
  let X = 2 * Y - Z;
  
  console.log(`📊 Calcul initial avec Z=${Z}:`);
  console.log(`   Y = (${quantiteTotale} + ${Z}×(${G}-${P})) / ${denominateur} = ${Y.toFixed(4)}`);
  console.log(`   X = 2×${Y.toFixed(4)} - ${Z} = ${X.toFixed(4)}`);
  console.log(`   Ratio X/Z = ${(X/Z).toFixed(2)}:1`);
  
  if (X > RATIO_MAX * Z) {
    console.log(`   ⚠️ Ratio trop élevé ! Plafonnement à ${RATIO_MAX}:1`);
    X = RATIO_MAX * Z;
    Y = (Z + X) / 2;
  }
  
  if (Y < Z) Y = Z;
  if (X < Y) X = Y;
  
  const coefficients = {
    Petite: Math.max(1, Z),
    Moyenne: Math.max(1, Y),
    Grande: Math.max(1, X)
  };
  
  console.log(`🔢 Coefficients FINAUX pour ${quantiteTotale.toFixed(2)}kg :`);
  console.log(`   Petite  : ${coefficients.Petite.toFixed(2)}`);
  console.log(`   Moyenne : ${coefficients.Moyenne.toFixed(2)}`);
  console.log(`   Grande  : ${coefficients.Grande.toFixed(2)}`);
  console.log(`   Ratio Grande/Petite : ${(coefficients.Grande / coefficients.Petite).toFixed(2)}:1`);
  
  const totalCalcule = (P * coefficients.Petite) + (M * coefficients.Moyenne) + (G * coefficients.Grande);
  console.log(`   Vérification : ${totalCalcule.toFixed(2)}kg sur ${quantiteTotale.toFixed(2)}kg disponibles`);
  
  return coefficients;
}

export function calculerDistributionArticleFavori(quantiteTotale, pourcentageStandard = 70) {
  const standard = quantiteTotale * (pourcentageStandard / 100);
  const supplement = quantiteTotale * ((100 - pourcentageStandard) / 100);
  return { standard, supplement };
}

export function repartirAvecRedistribution(quantiteTotale, nombreFamillesParTaille, coefficientsFixes = null, unite = 'kg') {
  const coefficients = coefficientsFixes || calculerCoefficientsDynamiques(quantiteTotale, nombreFamillesParTaille);

  let totalParts = 0;
  let totalFamilles = 0;
  
  TAILLES_FAMILLE.forEach(taille => {
    const nbFamilles = nombreFamillesParTaille[taille] || 0;
    const coef = coefficients[taille] || 1;
    if (nbFamilles > 0) {
      totalParts += nbFamilles * coef;
      totalFamilles += nbFamilles;
    }
  });

  if (totalParts === 0) {
    return { distribution: {}, resteNonDistribue: quantiteTotale };
  }

  const quantiteParPart = quantiteTotale / totalParts;
  console.log(`   Total parts: ${totalParts.toFixed(4)}, Quantité par part: ${quantiteParPart.toFixed(4)}`);

  const distribution = {};
  let totalDistribue = 0;

  TAILLES_FAMILLE.forEach(taille => {
    const nbFamilles = nombreFamillesParTaille[taille] || 0;
    const coef = coefficients[taille] || 1;
    
    if (nbFamilles > 0) {
      const quantiteTheorique = quantiteParPart * coef;
      const quantiteArrondie = Math.floor(quantiteTheorique);
      
      distribution[taille] = {
        quantiteParFamille: quantiteArrondie,
        nombreFamilles: nbFamilles,
        reste: quantiteTheorique - quantiteArrondie
      };
      
      totalDistribue += quantiteArrondie * nbFamilles;
      
      console.log(`   ${taille}: ${quantiteArrondie}${unite}/famille (reste: ${distribution[taille].reste.toFixed(4)}${unite} × ${nbFamilles} = ${(distribution[taille].reste * nbFamilles).toFixed(2)}${unite})`);
    }
  });

  let resteDisponible = quantiteTotale - totalDistribue;
  console.log(`   💰 Reste disponible pour redistribution: ${resteDisponible.toFixed(2)}${unite}`);

  const taillesTriees = TAILLES_FAMILLE
    .filter(taille => distribution[taille])
    .sort((a, b) => distribution[b].reste - distribution[a].reste);

  for (const taille of taillesTriees) {
    const nbFamilles = distribution[taille].nombreFamilles;
    const besoinPourBonus = nbFamilles * 1;
    
    if (resteDisponible >= besoinPourBonus) {
      distribution[taille].quantiteParFamille += 1;
      resteDisponible -= besoinPourBonus;
      totalDistribue += besoinPourBonus;
      console.log(`   🎁 Pack ${taille}: +1${unite} par famille (${besoinPourBonus}${unite} distribués)`);
    }
  }

  console.log(`   ✅ Distribution finale: ${totalDistribue.toFixed(2)}${unite} distribués, ${resteDisponible.toFixed(2)}${unite} restants`);

  return {
    distribution: distribution,
    resteNonDistribue: resteDisponible
  };
}

export async function genererPacksAutomatiques(inventaire, beneficiaires, parametres = null) {
  console.log('🚀 Début génération packs avec 4 phases de redistribution');
  console.log('📥 PARAMETRES REÇUS:', parametres);

  const {
    pourcentageStandard = 70,
    pourcentageSupplement = 30
  } = parametres?.repartition || {};

  console.log('⚙️ Paramètres utilisés:', { pourcentageStandard, pourcentageSupplement });

  const beneficiairesValides = beneficiaires.filter(b =>
    b.statut === 'Validé' || b.statut === 'Pack Attribué'
  );

  console.log('✅ Bénéficiaires validés:', beneficiairesValides.length);

  if (beneficiairesValides.length === 0) {
    throw new Error('Aucun bénéficiaire validé pour la génération des packs');
  }

  const nombreFamillesParTaille = { 'Petite': 0, 'Moyenne': 0, 'Grande': 0 };

  beneficiairesValides.forEach(benef => {
    const taille = benef.tailleFamille;
    if (nombreFamillesParTaille[taille] !== undefined) {
      nombreFamillesParTaille[taille]++;
    }
  });

  console.log('📊 Répartition par taille:', nombreFamillesParTaille);

  const famillesParArticleFavori = { 'RIZ': 0, 'PÂTES': 0, 'COUSCOUS': 0 };

  beneficiairesValides.forEach(benef => {
    const articleNormalise = normaliserArticleFavori(benef.articleFavori);
    if (articleNormalise && famillesParArticleFavori[articleNormalise] !== undefined) {
      famillesParArticleFavori[articleNormalise]++;
    }
  });

  console.log('📊 Répartition par article favori:', famillesParArticleFavori);

  const packsStandard = [];
  const packsSupplements = [];
  
  const packBonus = {
    type: 'bonus',
    nom: 'Pack Bonus',
    composition: []
  };

  const restesSupplements = {};

  console.log('\n🎯 PHASE 1 : GÉNÉRATION PACKS STANDARD (70%)');

  // PHASE 1 : PACKS STANDARD
  TAILLES_FAMILLE.forEach(tailleFamille => {
    const nombreFamilles = nombreFamillesParTaille[tailleFamille];
    
    if (nombreFamilles === 0) return;

    const pack = {
      type: 'standard',
      tailleFamille,
      nombreFamilles,
      composition: []
    };

    inventaire.forEach(article => {
      let quantiteDisponible = article.quantite;

      if (isArticleFavori(article.nom)) {
        const { standard } = calculerDistributionArticleFavori(article.quantite, pourcentageStandard);
        quantiteDisponible = standard;
        console.log(`   📦 ${article.nom}: ${pourcentageStandard}% standard = ${quantiteDisponible.toFixed(2)}${article.unite}`);
      }

      const { distribution, resteNonDistribue } = repartirAvecRedistribution(
        quantiteDisponible,
        nombreFamillesParTaille,
        null,
        article.unite
      );

      const quantiteParFamille = distribution[tailleFamille]?.quantiteParFamille || 0;

      if (quantiteParFamille > 0) {
        pack.composition.push({
          produit: article.nom,
          quantiteParFamille: quantiteParFamille,
          unite: article.unite,
          type: isArticleFavori(article.nom) ? `standard-${pourcentageStandard}%` : 'standard-100%'
        });
      }

      if (tailleFamille === 'Grande' && resteNonDistribue > 0) {
        const existingBonus = packBonus.composition.find(item => item.produit === article.nom);
        if (!existingBonus) {
          packBonus.composition.push({
            produit: article.nom,
            quantite: resteNonDistribue,
            unite: article.unite
          });
        }
      }
    });

    if (pack.composition.length > 0) {
      packsStandard.push(pack);
    }
  });

  console.log('\n🎯 PHASE 2 : GÉNÉRATION PACKS SUPPLÉMENTS (30%)');

  // PHASE 2 : PACKS SUPPLÉMENTS
  ARTICLES_FAVORIS.forEach(articleFavori => {
    const nbFamillesConcernees = famillesParArticleFavori[articleFavori];
    
    if (nbFamillesConcernees === 0) return;

    const pack = {
      type: 'supplement',
      articleFavori: articleFavori,
      nombreFamilles: nbFamillesConcernees,
      composition: []
    };

    inventaire.forEach(article => {
      if (!matchArticleFavori(article.nom, articleFavori)) return;

      const { supplement } = calculerDistributionArticleFavori(article.quantite, pourcentageStandard);

      console.log(`   🎁 Supplément ${article.nom}: ${supplement.toFixed(2)}${article.unite} pour ${nbFamillesConcernees} personnes`);

      const quantiteArrondie = Math.floor(supplement / nbFamillesConcernees);
      let totalDistribue = quantiteArrondie * nbFamillesConcernees;
      let resteDisponible = supplement - totalDistribue;

      console.log(`      → ${quantiteArrondie}${article.unite}/personne, reste: ${resteDisponible.toFixed(2)}${article.unite}`);

      restesSupplements[article.nom] = resteDisponible;
      console.log(`      → 🔄 Reste ${resteDisponible.toFixed(2)}${article.unite} sera redistribué dans packs standard (Phase 3)`);

      if (quantiteArrondie > 0) {
        pack.composition.push({
          produit: article.nom,
          quantiteParFamille: quantiteArrondie,
          quantiteTotale: totalDistribue,
          unite: article.unite,
          type: `supplement-${pourcentageSupplement}%`
        });
      }
    });

    if (pack.composition.length > 0) {
      packsSupplements.push(pack);
    }
  });

  console.log('\n🎯 PHASE 3 : REDISTRIBUTION RESTES SUPPLÉMENTS → PACKS STANDARD');

  // PHASE 3 : REDISTRIBUTION DES RESTES SUPPLÉMENTS
  for (const [nomArticle, resteSuppl] of Object.entries(restesSupplements)) {
    if (resteSuppl < 1) {
      console.log(`   ⏭️  ${nomArticle}: reste ${resteSuppl.toFixed(2)}kg trop faible, va au Pack Bonus`);
      
      const existingBonus = packBonus.composition.find(item => item.produit === nomArticle);
      if (existingBonus) {
        existingBonus.quantite += resteSuppl;
      } else {
        const article = inventaire.find(a => a.nom === nomArticle);
        packBonus.composition.push({
          produit: nomArticle,
          quantite: resteSuppl,
          unite: article.unite
        });
      }
      continue;
    }

    let resteActuel = resteSuppl;
    const article = inventaire.find(a => a.nom === nomArticle);
    
    console.log(`   📦 ${nomArticle}: ${resteActuel.toFixed(2)}${article.unite} à redistribuer`);

    const taillesParPriorite = ['Grande', 'Moyenne', 'Petite'];

    for (const tailleFamille of taillesParPriorite) {
      const nbFamilles = nombreFamillesParTaille[tailleFamille];
      
      if (nbFamilles === 0) continue;
      
      const besoin = nbFamilles * 1;
      
      console.log(`      → Taille ${tailleFamille} (${nbFamilles} familles) : besoin ${besoin}${article.unite}`);

      if (resteActuel >= besoin) {
        const packStandard = packsStandard.find(p => p.tailleFamille === tailleFamille);
        
        if (packStandard) {
          const itemExistant = packStandard.composition.find(item => item.produit === nomArticle);
          
          if (itemExistant) {
            itemExistant.quantiteParFamille += 1;
            console.log(`        ✅ +1${article.unite} ajouté à Pack Standard ${tailleFamille} (${itemExistant.quantiteParFamille}${article.unite} total)`);
          }
        }
        
        resteActuel -= besoin;
        console.log(`        💰 Reste après redistribution : ${resteActuel.toFixed(2)}${article.unite}`);
        
      } else {
        console.log(`        ❌ Pas assez (reste: ${resteActuel.toFixed(2)}${article.unite})`);
      }
    }

    if (resteActuel > 0) {
      console.log(`      → 📦 Reste final ${resteActuel.toFixed(2)}${article.unite} → Pack Bonus`);
      
      const existingBonus = packBonus.composition.find(item => item.produit === nomArticle);
      if (existingBonus) {
        existingBonus.quantite += resteActuel;
      } else {
        packBonus.composition.push({
          produit: nomArticle,
          quantite: resteActuel,
          unite: article.unite
        });
      }
    }
  }

  console.log('\n🎯 PHASE 4 : REDISTRIBUTION PACK BONUS → PACKS STANDARD ⭐⭐');
// 🔥 FIX : Arrondir les quantités du Pack Bonus à 2 décimales pour corriger les erreurs de précision
packBonus.composition.forEach(item => {
  item.quantite = Math.round(item.quantite * 100) / 100;
});
  // 🔥 PHASE 4 : REDISTRIBUTION DU PACK BONUS (NOUVEAU)
  const packBonusTemporaire = [...packBonus.composition];
  packBonus.composition = [];  // Vider le Pack Bonus pour reconstruire

  for (const itemBonus of packBonusTemporaire) {
    let resteBonus = itemBonus.quantite;
    
    if (resteBonus < 1) {
      console.log(`   ⏭️  ${itemBonus.produit}: reste ${resteBonus.toFixed(2)}${itemBonus.unite} trop faible`);
      packBonus.composition.push(itemBonus);
      continue;
    }
    
    console.log(`   📦 ${itemBonus.produit}: ${resteBonus.toFixed(2)}${itemBonus.unite} du Pack Bonus à redistribuer`);

    const taillesParPriorite = ['Grande', 'Moyenne', 'Petite'];

    for (const tailleFamille of taillesParPriorite) {
      const nbFamilles = nombreFamillesParTaille[tailleFamille];
      
      if (nbFamilles === 0) continue;
      
      const besoin = nbFamilles * 1;
      
      console.log(`      → Taille ${tailleFamille} (${nbFamilles} familles) : besoin ${besoin}${itemBonus.unite}`);

      if (resteBonus >= besoin) {
        const packStandard = packsStandard.find(p => p.tailleFamille === tailleFamille);
        
        if (packStandard) {
          let itemExistant = packStandard.composition.find(item => item.produit === itemBonus.produit);
          
          if (itemExistant) {
            itemExistant.quantiteParFamille += 1;
            console.log(`        ✅ +1${itemBonus.unite} ajouté à Pack Standard ${tailleFamille} (${itemExistant.quantiteParFamille}${itemBonus.unite} total)`);
          } else {
            // L'article n'existe pas dans ce pack, on l'ajoute
            packStandard.composition.push({
              produit: itemBonus.produit,
              quantiteParFamille: 1,
              unite: itemBonus.unite,
              type: 'bonus-redistribue'
            });
            console.log(`        ✅ +1${itemBonus.unite} ajouté à Pack Standard ${tailleFamille} (nouvel article)`);
          }
        }
        
        resteBonus -= besoin;
        console.log(`        💰 Reste après redistribution : ${resteBonus.toFixed(2)}${itemBonus.unite}`);
        
      } else {
        console.log(`        ❌ Pas assez (reste: ${resteBonus.toFixed(2)}${itemBonus.unite})`);
      }
    }

    // Ce qui reste vraiment va au Pack Bonus final
    if (resteBonus > 0) {
      console.log(`      → 📦 Reste FINAL ${resteBonus.toFixed(2)}${itemBonus.unite} → Pack Bonus`);
      packBonus.composition.push({
        produit: itemBonus.produit,
        quantite: resteBonus,
        unite: itemBonus.unite
      });
    } else {
      console.log(`      → ✅ Tout redistribué ! Rien au Pack Bonus pour ${itemBonus.produit}`);
    }
  }

  // Finaliser le Pack Bonus
  if (packBonus.composition.length > 0) {
    packBonus.composition.forEach(item => {
      item.quantite = Math.round(item.quantite * 100) / 100;
    });
    
    const totalBonus = packBonus.composition.reduce((sum, item) => sum + item.quantite, 0);
    packBonus.quantiteTotale = Math.round(totalBonus * 100) / 100;
    packBonus.note = 'Restes vraiment impossibles à redistribuer - Premier arrivé';
    
    console.log(`\n📦 Pack Bonus FINAL avec ${packBonus.composition.length} articles (${packBonus.quantiteTotale.toFixed(2)}kg total)`);
    packsSupplements.push(packBonus);
  } else {
    console.log(`\n🎉 AUCUN Pack Bonus ! Tout a été redistribué ! 🎉`);
  }

  console.log(`\n✅ GÉNÉRATION TERMINÉE`);
  console.log(`✅ Packs standard générés: ${packsStandard.length}`);
  console.log(`✅ Packs suppléments générés: ${packsSupplements.length - (packBonus.composition.length > 0 ? 1 : 0)}`);
  console.log(`✅ Pack bonus: ${packBonus.composition.length > 0 ? 'OUI (' + packBonus.quantiteTotale.toFixed(2) + 'kg)' : 'NON - Tout redistribué !'}`);

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