/**
 * Utilitaires d'export PDF et Excel pour les packs
 */

// Export PDF avec jsPDF et html2canvas
export async function exportToPDF(packs, mosqueeData, fileName) {
  try {
    // Import dynamique de jsPDF
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    // Créer un conteneur temporaire pour le contenu
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '1400px';
    container.style.background = 'white';
    container.style.padding = '40px';
    
    // Construire le HTML du PDF
    container.innerHTML = buildPDFContent(packs, mosqueeData);
    
    document.body.appendChild(container);

    // Capturer en image
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    // Supprimer le conteneur temporaire
    document.body.removeChild(container);

    // Créer le PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    
    const imgWidth = 297; // A4 landscape width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Télécharger
    pdf.save(`${fileName}.pdf`);
    
  } catch (error) {
    console.error('Erreur export PDF:', error);
    throw error;
  }
}

// Export Excel avec SheetJS
export async function exportToExcel(packs, mosqueeData, fileName) {
  try {
    // Import dynamique de XLSX
    const XLSX = await import('xlsx');

    const workbook = XLSX.utils.book_new();

    // ONGLET 1 : Packs Standard
    if (packs.standard && packs.standard.length > 0) {
      const wsDataStandard = buildStandardSheetData(packs.standard);
      const wsStandard = XLSX.utils.aoa_to_sheet(wsDataStandard);
      XLSX.utils.book_append_sheet(workbook, wsStandard, 'Packs Standard');
    }

    // ONGLET 2 : Suppléments
    const supplements = packs.supplements?.filter(p => p.type !== 'bonus') || [];
    if (supplements.length > 0) {
      const wsDataSupp = buildSupplementsSheetData(supplements);
      const wsSupp = XLSX.utils.aoa_to_sheet(wsDataSupp);
      XLSX.utils.book_append_sheet(workbook, wsSupp, 'Suppléments');
    }

    // ONGLET 3 : Pack Bonus
    const packBonus = packs.supplements?.find(p => p.type === 'bonus');
    if (packBonus && packBonus.composition?.length > 0) {
      const wsDataBonus = buildBonusSheetData(packBonus);
      const wsBonus = XLSX.utils.aoa_to_sheet(wsDataBonus);
      XLSX.utils.book_append_sheet(workbook, wsBonus, 'Pack Bonus');
    }

    // Télécharger
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    
  } catch (error) {
    console.error('Erreur export Excel:', error);
    throw error;
  }
}

// Construire le contenu HTML pour PDF
function buildPDFContent(packs, mosqueeData) {
  const date = new Date().toLocaleDateString('fr-FR');
  const time = new Date().toLocaleTimeString('fr-FR');
  
  let html = `
    <div style="font-family: Arial, sans-serif;">
      <h1 style="text-align: center; margin-bottom: 10px;">
        Récapitulatif des Packs - ${mosqueeData?.nom || 'Mosquée'}
      </h1>
      <p style="text-align: center; color: #666; margin-bottom: 30px;">
        Généré le ${date} à ${time}
      </p>
  `;

  // Packs Standard
  if (packs.standard && packs.standard.length > 0) {
    html += buildStandardTableHTML(packs.standard);
  }

  // Suppléments
  const supplements = packs.supplements?.filter(p => p.type !== 'bonus') || [];
  if (supplements.length > 0) {
    html += buildSupplementsTableHTML(supplements);
  }

  // Pack Bonus
  const packBonus = packs.supplements?.find(p => p.type === 'bonus');
  if (packBonus && packBonus.composition?.length > 0) {
    html += buildBonusTableHTML(packBonus);
  }

  html += '</div>';
  return html;
}

// Construire tableau HTML packs standard
function buildStandardTableHTML(packsStandard) {
  const articlesUniques = new Set();
  packsStandard.forEach(pack => {
    pack.composition?.forEach(item => articlesUniques.add(item.produit));
  });
  const colonnes = Array.from(articlesUniques);

  let html = `
    <h2 style="margin-top: 30px; color: #059669;">🏢 PACKS STANDARD</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">TYPE</th>
          <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">FAMILLES</th>
  `;

  colonnes.forEach(article => {
    html += `<th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${article}</th>`;
  });

  html += `</tr></thead><tbody>`;

  packsStandard.forEach(pack => {
    html += `<tr>
      <td style="border: 1px solid #d1d5db; padding: 8px;"><strong>${pack.tailleFamille}</strong></td>
      <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;"><strong>${pack.nombreFamilles}</strong></td>
    `;

    colonnes.forEach(article => {
      const item = pack.composition?.find(c => c.produit === article);
      const qte = item?.quantiteParFamille || 0;
      html += `<td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">
        ${qte > 0 ? `${qte.toFixed(2)} ${item.unite}` : '—'}
      </td>`;
    });

    html += `</tr>`;
  });

  html += `</tbody></table>`;
  return html;
}

// Construire tableau HTML suppléments
function buildSupplementsTableHTML(supplements) {
  let html = `
    <h2 style="margin-top: 30px; color: #f59e0b;">🎁 PACKS SUPPLÉMENTS</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <thead>
        <tr style="background-color: #fef3c7;">
          <th style="border: 1px solid #fbbf24; padding: 8px; text-align: left;">ARTICLE</th>
          <th style="border: 1px solid #fbbf24; padding: 8px; text-align: center;">FAMILLES</th>
          <th style="border: 1px solid #fbbf24; padding: 8px; text-align: center;">QTÉ/FAMILLE</th>
          <th style="border: 1px solid #fbbf24; padding: 8px; text-align: center;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
  `;

  supplements.forEach(pack => {
    const article = pack.composition?.[0];
    const qteParFamille = article?.quantiteParFamille || 0;
    const total = qteParFamille * pack.nombreFamilles;

    html += `<tr>
      <td style="border: 1px solid #fbbf24; padding: 8px;"><strong>${article?.produit}</strong></td>
      <td style="border: 1px solid #fbbf24; padding: 8px; text-align: center;">${pack.nombreFamilles}</td>
      <td style="border: 1px solid #fbbf24; padding: 8px; text-align: center;">${qteParFamille.toFixed(2)} ${article?.unite}</td>
      <td style="border: 1px solid #fbbf24; padding: 8px; text-align: center;"><strong>${total.toFixed(2)} ${article?.unite}</strong></td>
    </tr>`;
  });

  html += `</tbody></table>`;
  return html;
}

// Construire tableau HTML pack bonus
function buildBonusTableHTML(packBonus) {
  let html = `
    <h2 style="margin-top: 30px; color: #059669;">💰 PACK BONUS</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <thead>
        <tr style="background-color: #d1fae5;">
          <th style="border: 1px solid #10b981; padding: 8px; text-align: left;">ARTICLE</th>
          <th style="border: 1px solid #10b981; padding: 8px; text-align: center;">QUANTITÉ</th>
        </tr>
      </thead>
      <tbody>
  `;

  packBonus.composition.forEach(item => {
    html += `<tr>
      <td style="border: 1px solid #10b981; padding: 8px;"><strong>${item.produit}</strong></td>
      <td style="border: 1px solid #10b981; padding: 8px; text-align: center;"><strong>${item.quantite.toFixed(2)} ${item.unite}</strong></td>
    </tr>`;
  });

  html += `</tbody></table>`;
  return html;
}

// Construire données Excel packs standard
function buildStandardSheetData(packsStandard) {
  const articlesUniques = new Set();
  packsStandard.forEach(pack => {
    pack.composition?.forEach(item => articlesUniques.add(item.produit));
  });
  const colonnes = Array.from(articlesUniques);

  const data = [];
  
  // En-têtes
  const headers = ['TYPE', 'FAMILLES', ...colonnes];
  data.push(headers);

  // Données
  packsStandard.forEach(pack => {
    const row = [pack.tailleFamille, pack.nombreFamilles];
    colonnes.forEach(article => {
      const item = pack.composition?.find(c => c.produit === article);
      const qte = item?.quantiteParFamille || 0;
      row.push(qte > 0 ? `${qte.toFixed(2)} ${item.unite}` : '—');
    });
    data.push(row);
  });

  return data;
}

// Construire données Excel suppléments
function buildSupplementsSheetData(supplements) {
  const data = [];
  
  // En-têtes
  data.push(['ARTICLE', 'FAMILLES', 'QTÉ/FAMILLE', 'TOTAL']);

  // Données
  supplements.forEach(pack => {
    const article = pack.composition?.[0];
    const qteParFamille = article?.quantiteParFamille || 0;
    const total = qteParFamille * pack.nombreFamilles;
    
    data.push([
      article?.produit,
      pack.nombreFamilles,
      `${qteParFamille.toFixed(2)} ${article?.unite}`,
      `${total.toFixed(2)} ${article?.unite}`
    ]);
  });

  return data;
}

// Construire données Excel pack bonus
function buildBonusSheetData(packBonus) {
  const data = [];
  
  // En-têtes
  data.push(['ARTICLE', 'QUANTITÉ']);

  // Données
  packBonus.composition.forEach(item => {
    data.push([
      item.produit,
      `${item.quantite.toFixed(2)} ${item.unite}`
    ]);
  });

  // Ligne total
  data.push(['TOTAL', `${packBonus.quantiteTotale.toFixed(2)} kg`]);

  return data;
}