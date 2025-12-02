'use client';

import { useState } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import Modal from '../ui/Modal';
import { ajouterBeneficiaire, getBeneficiaires } from '@/lib/firebaseAdmin';
import { useMosquee } from '@/context/MosqueeContext';
import { determinerTailleFamille } from '@/lib/packCalculator';

export default function ModalImporterBeneficiaires({ isOpen, onClose, onSuccess }) {
  const { mosqueeActive, getMosqueeActiveData } = useMosquee();
  const mosqueeData = getMosqueeActiveData();
  
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [errors, setErrors] = useState([]);
  const [preview, setPreview] = useState([]);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Vérifier le type de fichier
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      alert('❌ Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setResultat(null);

    // Lire et afficher un aperçu
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await selectedFile.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
      
      const worksheet = workbook.worksheets[0];
      const previewData = [];
      
      // Fonction pour extraire la valeur texte d'une cellule
      const getCellValue = (cell) => {
        if (cell === null || cell === undefined) return '';
        if (typeof cell === 'object' && cell.text !== undefined) return cell.text;
        if (typeof cell === 'object' && cell.result !== undefined) return cell.result;
        return cell;
      };
      
      // Lire les 5 premières lignes pour aperçu
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber <= 6) { // En-tête + 5 lignes
          const rowValues = row.values.slice(1).map(cell => getCellValue(cell));
          previewData.push(rowValues);
        }
      });
      
      setPreview(previewData);
    } catch (error) {
      console.error('Erreur lecture fichier:', error);
      alert('❌ Erreur lors de la lecture du fichier');
    }
  };

  const handleImport = async () => {
    if (!file || !mosqueeActive || mosqueeActive === 'ALL') {
      alert('❌ Veuillez sélectionner une mosquée et un fichier');
      return;
    }

    setLoading(true);
    setErrors([]);
    const erreurs = [];
    let importes = 0;
    let ignores = 0;
    let doublons = 0;

    try {
      // 🔍 NOUVEAU : Charger les bénéficiaires existants pour détecter les doublons
      const beneficiairesExistants = await getBeneficiaires(mosqueeActive);
      const emailsExistants = new Set(beneficiairesExistants.map(b => b.email.toLowerCase().trim()));
      
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
      
      const worksheet = workbook.worksheets[0];
      const beneficiaires = [];

      // Lire toutes les lignes (sauf l'en-tête)
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Ignorer l'en-tête
        
        const values = row.values.slice(1); // Enlever le premier élément vide
        
        // 🔧 CORRECTION : Fonction pour extraire la valeur texte d'une cellule
        const getCellValue = (cell) => {
          if (cell === null || cell === undefined) return '';
          
          // Si c'est un objet avec une propriété 'text' (hyperlien, formule, etc.)
          if (typeof cell === 'object' && cell.text !== undefined) {
            return cell.text;
          }
          
          // Si c'est un objet avec une propriété 'result' (formule calculée)
          if (typeof cell === 'object' && cell.result !== undefined) {
            return cell.result;
          }
          
          // Si c'est déjà une valeur simple
          return cell;
        };
        
        // Format attendu : [Nom, Email, Téléphone, Adresse, Nb Personnes, Article Favori]
        const [nomRaw, emailRaw, telephoneRaw, adresseRaw, nbPersonnesRaw, articleFavoriRaw] = values;
        
        // Extraire les valeurs texte
        const nom = getCellValue(nomRaw);
        const email = getCellValue(emailRaw);
        const telephone = getCellValue(telephoneRaw);
        const adresse = getCellValue(adresseRaw);
        const nbPersonnes = getCellValue(nbPersonnesRaw);
        const articleFavori = getCellValue(articleFavoriRaw);

        // Validation basique
        if (!nom || !email) {
          erreurs.push(`Ligne ${rowNumber}: Nom et Email obligatoires`);
          ignores++;
          return;
        }

        // 🔍 NOUVEAU : Vérifier les doublons d'email
        const emailNormalise = String(email).toLowerCase().trim();
        if (emailsExistants.has(emailNormalise)) {
          erreurs.push(`Ligne ${rowNumber} - ${nom}: Email ${email} déjà existant (doublon ignoré)`);
          doublons++;
          ignores++;
          return;
        }

        // Normaliser l'article favori
        let articleNormalise = null;
        if (articleFavori) {
          const articleUpper = String(articleFavori).toUpperCase().trim();
          if (['RIZ', 'PÂTES', 'PATES', 'COUSCOUS'].includes(articleUpper)) {
            articleNormalise = articleUpper === 'PATES' ? 'PÂTES' : articleUpper;
          }
        }

        // 🔍 NOUVEAU : Ajouter l'email au Set pour détecter les doublons dans le fichier lui-même
        emailsExistants.add(emailNormalise);

        beneficiaires.push({
          nom: String(nom).trim(),
          email: emailNormalise,
          telephone: telephone ? String(telephone).trim() : '',
          adresse: adresse ? String(adresse).trim() : '',
          nbPersonnes: nbPersonnes ? parseInt(nbPersonnes) : 2,
          tailleFamille: determinerTailleFamille(nbPersonnes || 2),
          articleFavori: articleNormalise,
          source: 'Import',
          statut: 'En attente',
          mosqueeId: mosqueeActive
        });
      });

      // Importer dans Firebase
      for (const beneficiaire of beneficiaires) {
        try {
          // Passer mosqueeId comme deuxième paramètre
          await ajouterBeneficiaire(beneficiaire, mosqueeActive);
          importes++;
        } catch (error) {
          console.error(`Erreur pour ${beneficiaire.nom}:`, error);
          erreurs.push(`${beneficiaire.nom}: ${error.message}`);
          ignores++;
        }
      }

      setResultat({
        total: beneficiaires.length + doublons,
        importes,
        ignores,
        doublons
      });

      // 🎉 NOUVEAU : Popup de succès avec customConfirm (système global)
      if (importes > 0) {
        // Import dynamique du customConfirm
        const { customConfirm } = await import('@/lib/globalPopup');
        
        const confirmation = await customConfirm(
          `✅ Import terminé avec succès !\n\n` +
          `• ${importes} bénéficiaire${importes > 1 ? 's' : ''} importé${importes > 1 ? 's' : ''}\n` +
          `${doublons > 0 ? `• ${doublons} doublon${doublons > 1 ? 's' : ''} ignoré${doublons > 1 ? 's' : ''}\n` : ''}` +
          `${ignores - doublons > 0 ? `• ${ignores - doublons} erreur${ignores - doublons > 1 ? 's' : ''}\n` : ''}` +
          `\nRetourner à la liste des bénéficiaires ?`
        );
        
        if (confirmation && onSuccess) {
          onSuccess();
          handleClose();
        }
      }

    } catch (error) {
      console.error('❌ Erreur import:', error);
      alert('❌ Erreur lors de l\'importation');
    } finally {
      setLoading(false);
      setErrors(erreurs);
    }
  };

  const telechargerModele = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Bénéficiaires');

      // En-tête avec style
      worksheet.columns = [
        { header: 'Nom *', key: 'nom', width: 25 },
        { header: 'Email *', key: 'email', width: 30 },
        { header: 'Téléphone', key: 'telephone', width: 15 },
        { header: 'Adresse', key: 'adresse', width: 40 },
        { header: 'Nb Personnes', key: 'nbPersonnes', width: 15 },
        { header: 'Article Favori', key: 'articleFavori', width: 15 },
      ];

      // Styliser l'en-tête
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF10B981' }
      };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Exemples de données
      worksheet.addRow({
        nom: 'Ahmed Benali',
        email: 'ahmed.benali@example.com',
        telephone: '0612345678',
        adresse: '15 Rue de la Paix, 75001 Paris',
        nbPersonnes: 4,
        articleFavori: 'RIZ'
      });

      worksheet.addRow({
        nom: 'Fatima Kaddouri',
        email: 'fatima.k@example.com',
        telephone: '0698765432',
        adresse: '42 Avenue Victor Hugo, 94100 Saint-Maur-des-Fossés',
        nbPersonnes: 6,
        articleFavori: 'PÂTES'
      });

      worksheet.addRow({
        nom: 'Mohamed Ziani',
        email: 'mohamed.z@example.com',
        telephone: '0756789012',
        adresse: '8 Boulevard Gambetta, 93400 Saint-Ouen',
        nbPersonnes: 2,
        articleFavori: 'COUSCOUS'
      });

      // Instructions en bas
      worksheet.addRow([]);
      worksheet.addRow(['INSTRUCTIONS :']).font = { bold: true };
      worksheet.addRow(['• Nom et Email sont OBLIGATOIRES']);
      worksheet.addRow(['• Nb Personnes : nombre de personnes dans la famille (défaut : 2)']);
      worksheet.addRow(['• Article Favori : RIZ, PÂTES ou COUSCOUS (optionnel)']);
      worksheet.addRow(['• Supprimez les exemples avant d\'importer vos données']);
      worksheet.addRow(['• Gardez EXACTEMENT les mêmes colonnes']);

      // Télécharger
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'modele_import_beneficiaires.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);

      console.log('✅ Modèle Excel téléchargé');
    } catch (error) {
      console.error('❌ Erreur téléchargement modèle:', error);
      alert('Erreur lors du téléchargement du modèle');
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setResultat(null);
    setErrors([]);
    onClose();
  };

  if (!mosqueeActive || mosqueeActive === 'ALL') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Importer des Bénéficiaires" size="lg">
        <div className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <p className="text-gray-800 font-semibold mb-2">
            Aucune mosquée sélectionnée
          </p>
          <p className="text-gray-600 text-sm">
            Veuillez sélectionner une mosquée spécifique avant d'importer des bénéficiaires.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importer des Bénéficiaires" size="xl">
      <div className="space-y-6">

        {/* Info mosquée */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            📥 Import pour : <strong>{mosqueeData?.nom}</strong>
          </p>
        </div>

        {/* Télécharger modèle */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Download className="w-8 h-8 text-emerald-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-emerald-900 mb-2">
                Étape 1 : Télécharger le modèle Excel
              </h3>
              <p className="text-sm text-emerald-800 mb-3">
                Téléchargez le fichier modèle avec des exemples et remplissez-le avec vos données.
              </p>
              <button
                onClick={telechargerModele}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold"
              >
                <Download className="w-4 h-4" />
                Télécharger le modèle
              </button>
            </div>
          </div>
        </div>

        {/* Upload fichier */}
        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Upload className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2">
                Étape 2 : Importer votre fichier
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                Sélectionnez votre fichier Excel rempli (.xlsx ou .xls)
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
        </div>

        {/* Aperçu */}
        {preview.length > 0 && (
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Aperçu du fichier
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {preview.map((row, idx) => (
                    <tr key={idx} className={idx === 0 ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'}>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-2 py-1 border">
                          {cell || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Aperçu des 5 premières lignes
            </p>
          </div>
        )}

        {/* Résultat */}
        {resultat && (
          <div className={`border-2 rounded-lg p-6 ${resultat.importes > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start gap-3">
              {resultat.importes > 0 ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-600" />
              )}
              <div className="flex-1">
                <h3 className={`font-bold mb-2 ${resultat.importes > 0 ? 'text-green-900' : 'text-red-900'}`}>
                  Import terminé
                </h3>
                <div className="grid grid-cols-4 gap-4 mb-3">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-800">{resultat.total}</p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{resultat.importes}</p>
                    <p className="text-xs text-gray-600">Importés</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-orange-600">{resultat.doublons || 0}</p>
                    <p className="text-xs text-gray-600">Doublons</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{resultat.ignores}</p>
                    <p className="text-xs text-gray-600">Ignorés</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Erreurs */}
        {errors.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 max-h-40 overflow-y-auto">
            <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Erreurs ({errors.length})
            </h4>
            <ul className="space-y-1 text-sm text-red-800">
              {errors.map((error, idx) => (
                <li key={idx}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <h4 className="font-bold text-yellow-900 mb-2">⚠️ Important</h4>
          <ul className="space-y-1 text-sm text-yellow-800">
            <li>• <strong>Nom</strong> et <strong>Email</strong> sont obligatoires</li>
            <li>• Article Favori : RIZ, PÂTES ou COUSCOUS (optionnel)</li>
            <li>• Les bénéficiaires importés auront le statut "En attente"</li>
            <li>• Source sera automatiquement définie à "Import"</li>
            <li>• Vérifiez qu'il n'y a pas de doublons d'emails</li>
          </ul>
        </div>

        {/* Boutons */}
        <div className="flex gap-4">
          <button
            onClick={handleClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
          >
            Fermer
          </button>
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Import en cours...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Importer les bénéficiaires
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}