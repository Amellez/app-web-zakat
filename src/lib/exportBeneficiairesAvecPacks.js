// Fonction d'export Excel améliorée avec détails des packs
// À intégrer dans BeneficiairesTab.jsx

import { getPacksAttribues } from '@/lib/packUtils';

export async function exporterBeneficiairesAvecPacks(beneficiaires, filterStatus = 'all') {
  try {
    const ExcelJS = (await import('exceljs')).default;
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Gestion Zakat';
    workbook.created = new Date();
    
    // ===== FEUILLE 1 : LISTE DES BÉNÉFICIAIRES =====
    const worksheetBenef = workbook.addWorksheet('Bénéficiaires', {
      properties: { tabColor: { argb: 'FF10B981' } }
    });

    worksheetBenef.columns = [
      { header: 'N°', key: 'numero', width: 6 },
      { header: 'Nom', key: 'nom', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Téléphone', key: 'telephone', width: 15 },
      { header: 'Adresse', key: 'adresse', width: 50 },
      { header: 'Nb Personnes', key: 'nbPersonnes', width: 12 },
      { header: 'Taille Famille', key: 'tailleFamille', width: 15 },
      { header: 'Article Favori', key: 'articleFavori', width: 15 },
      { header: 'Source', key: 'source', width: 20 },
      { header: 'Statut', key: 'statut', width: 20 },
      { header: 'Pack Standard', key: 'packStandard', width: 14 },
      { header: 'Pack Supplément', key: 'packSupplement', width: 14 },
      { header: 'Date Attribution', key: 'dateAttribution', width: 16 },
    ];

    // Style de l'en-tête
    worksheetBenef.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheetBenef.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' }
    };
    worksheetBenef.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheetBenef.getRow(1).height = 25;

    // Ajouter les données
    beneficiaires.forEach((b, index) => {
      const row = worksheetBenef.addRow({
        numero: index + 1,
        nom: b.nom,
        email: b.email,
        telephone: b.telephone,
        adresse: b.adresse,
        nbPersonnes: b.nbPersonnes,
        tailleFamille: b.tailleFamille,
        articleFavori: b.articleFavori || 'Non spécifié',
        source: b.source || 'Formulaire en ligne',
        statut: b.statut,
        packStandard: b.packId ? 'Oui' : 'Non',
        packSupplement: b.packSupplementId ? 'Oui' : 'Non',
        dateAttribution: b.dateAttribution ? new Date(b.dateAttribution).toLocaleDateString('fr-FR') : '',
      });

      // Alternance de couleurs
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' }
        };
      }

      // Couleur selon statut
      const statutCell = row.getCell('statut');
      if (b.statut === 'Validé') {
        statutCell.font = { color: { argb: 'FF10B981' }, bold: true };
      } else if (b.statut === 'En attente') {
        statutCell.font = { color: { argb: 'FFF59E0B' }, bold: true };
      } else if (b.statut === 'Pack Attribué') {
        statutCell.font = { color: { argb: 'FF3B82F6' }, bold: true };
      } else if (b.statut === 'Rejeté') {
        statutCell.font = { color: { argb: 'FFEF4444' }, bold: true };
      }
    });

    // Bordures
    worksheetBenef.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      });
    });

    // ===== FEUILLE 2 : DÉTAILS DES PACKS =====
    const worksheetPacks = workbook.addWorksheet('Détails Packs', {
      properties: { tabColor: { argb: 'FF3B82F6' } }
    });

    worksheetPacks.columns = [
      { header: 'Bénéficiaire', key: 'nom', width: 25 },
      { header: 'Taille Famille', key: 'tailleFamille', width: 15 },
      { header: 'Article Favori', key: 'articleFavori', width: 15 },
      { header: 'Type Article', key: 'typeArticle', width: 15 },
      { header: 'Produit', key: 'produit', width: 30 },
      { header: 'Type Produit', key: 'typeProduit', width: 15 },
      { header: 'Quantité', key: 'quantite', width: 10 },
      { header: 'Unité', key: 'unite', width: 10 },
      { header: 'Source', key: 'source', width: 15 },
    ];

    // Style de l'en-tête
    worksheetPacks.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheetPacks.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' }
    };
    worksheetPacks.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheetPacks.getRow(1).height = 25;

    // Charger les détails des packs pour chaque bénéficiaire avec pack attribué
    const benefsAvecPacks = beneficiaires.filter(b => b.packId || b.packSupplementId);
    
    let rowIndex = 2;
    for (const benef of benefsAvecPacks) {
      try {
        const { packStandard, packSupplement } = await getPacksAttribues(benef);
        
        // Ajouter les articles du pack standard
        if (packStandard?.composition) {
          packStandard.composition.forEach((item) => {
            const row = worksheetPacks.addRow({
              nom: benef.nom,
              tailleFamille: benef.tailleFamille,
              articleFavori: benef.articleFavori || 'Non spécifié',
              typeArticle: 'Pack Standard',
              produit: item.produit,
              typeProduit: item.type || '',
              quantite: item.quantiteParFamille || item.quantite,
              unite: item.unite,
              source: 'Standard'
            });

            // Couleur bleue pour pack standard
            row.getCell('typeArticle').fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFDBEAFE' }
            };
            row.getCell('typeArticle').font = { bold: true, color: { argb: 'FF3B82F6' } };
            
            rowIndex++;
          });
        }
        
        // Ajouter les articles du supplément
        if (packSupplement?.composition) {
          packSupplement.composition.forEach((item) => {
            const row = worksheetPacks.addRow({
              nom: benef.nom,
              tailleFamille: benef.tailleFamille,
              articleFavori: benef.articleFavori || 'Non spécifié',
              typeArticle: 'Supplément',
              produit: item.produit,
              typeProduit: item.type || '',
              quantite: item.quantiteParFamille || item.quantite,
              unite: item.unite,
              source: packSupplement.articleFavori
            });

            // Couleur orange pour supplément
            row.getCell('typeArticle').fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFDE68A' }
            };
            row.getCell('typeArticle').font = { bold: true, color: { argb: 'FFF59E0B' } };
            
            rowIndex++;
          });
        }
      } catch (error) {
        console.error(`Erreur pour ${benef.nom}:`, error);
      }
    }

    // Bordures
    worksheetPacks.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      });
    });

    // ===== FEUILLE 3 : RÉCAPITULATIF PRÉPARATION =====
    const worksheetRecap = workbook.addWorksheet('Récapitulatif Préparation', {
      properties: { tabColor: { argb: 'FF10B981' } }
    });

    worksheetRecap.columns = [
      { header: 'Produit', key: 'produit', width: 30 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Quantité Totale', key: 'quantiteTotale', width: 15 },
      { header: 'Unité', key: 'unite', width: 10 },
      { header: 'Familles concernées', key: 'nbFamilles', width: 18 },
    ];

    // Style de l'en-tête
    worksheetRecap.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheetRecap.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' }
    };
    worksheetRecap.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheetRecap.getRow(1).height = 25;

    // Calculer les totaux par produit
    const totauxProduits = {};
    
    for (const benef of benefsAvecPacks) {
      try {
        const { packStandard, packSupplement } = await getPacksAttribues(benef);
        
        // Compter les articles du pack standard
        if (packStandard?.composition) {
          packStandard.composition.forEach((item) => {
            const key = `${item.produit}_${item.unite}_${item.type || ''}`;
            const qte = parseFloat(item.quantiteParFamille || item.quantite);
            
            if (!totauxProduits[key]) {
              totauxProduits[key] = {
                produit: item.produit,
                type: item.type || '',
                quantiteTotale: 0,
                unite: item.unite,
                nbFamilles: 0
              };
            }
            
            totauxProduits[key].quantiteTotale += qte;
            totauxProduits[key].nbFamilles += 1;
          });
        }
        
        // Compter les articles du supplément
        if (packSupplement?.composition) {
          packSupplement.composition.forEach((item) => {
            const key = `${item.produit}_${item.unite}_${item.type || ''}`;
            const qte = parseFloat(item.quantiteParFamille || item.quantite);
            
            if (!totauxProduits[key]) {
              totauxProduits[key] = {
                produit: item.produit,
                type: item.type || '',
                quantiteTotale: 0,
                unite: item.unite,
                nbFamilles: 0
              };
            }
            
            totauxProduits[key].quantiteTotale += qte;
            totauxProduits[key].nbFamilles += 1;
          });
        }
      } catch (error) {
        console.error(`Erreur pour ${benef.nom}:`, error);
      }
    }

    // Ajouter les totaux triés par quantité décroissante
    Object.values(totauxProduits)
      .sort((a, b) => b.quantiteTotale - a.quantiteTotale)
      .forEach((item, index) => {
        const row = worksheetRecap.addRow({
          produit: item.produit,
          type: item.type,
          quantiteTotale: item.quantiteTotale.toFixed(2),
          unite: item.unite,
          nbFamilles: item.nbFamilles
        });

        if (index % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' }
          };
        }
      });

    // Bordures
    worksheetRecap.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      });
    });

    // ===== GÉNÉRATION DU FICHIER =====
    const date = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
    const fileName = `beneficiaires_packs_complet_${filterStatus !== 'all' ? filterStatus + '_' : ''}${date}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);

    console.log(`✅ Export Excel complet réussi: ${fileName}`);
    return { success: true, fileName };
  } catch (error) {
    console.error('❌ Erreur export Excel:', error);
    throw error;
  }
}