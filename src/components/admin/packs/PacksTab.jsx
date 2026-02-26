'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, Printer, FileDown, FileSpreadsheet } from 'lucide-react';
import ModalGenererPacks from './ModalGenererPacks';
import PacksTable from './PacksTable';
import { useMosquee } from '@/context/MosqueeContext';
import { getPacks, supprimerTousLesPacks } from '@/lib/firebaseAdmin';
import { exportToPDF, exportToExcel } from '@/lib/exportUtils';

export default function PacksTab({ inventaire, beneficiaires }) {
  const { mosqueeActive, getMosqueeActiveData } = useMosquee();
  const mosqueeData = getMosqueeActiveData();
  
  const [packs, setPacks] = useState({ standard: [], supplements: [] });
  const [loading, setLoading] = useState(false);
  const [showModalGenerer, setShowModalGenerer] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (mosqueeActive) {
      chargerPacks();
    }
  }, [mosqueeActive]);

  const chargerPacks = async () => {
    if (!mosqueeActive) return;
    
    setLoading(true);
    try {
      const data = await getPacks(mosqueeActive);
      // 🔥 FIX : Sécuriser contre null/undefined
      setPacks(data || { standard: [], supplements: [] });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erreur chargement packs:', error);
      // En cas d'erreur, remettre à vide
      setPacks({ standard: [], supplements: [] });
    } finally {
      setLoading(false);
    }
  };

const handleSupprimerTout = async () => {
  const confirmation = confirm(
    '⚠️ Êtes-vous sûr de vouloir supprimer TOUS les packs ?\n\n' +
    'Cette action est irréversible et supprimera :\n' +
    '- Tous les packs standard\n' +
    '- Tous les packs suppléments\n' +
    '- Le pack bonus\n\n' +
    'Les bénéficiaires seront remis en statut "Validé".'
  );

  if (!confirmation) return; // ✅ Si annulé, on sort SANS RIEN TOUCHER

  setLoading(true);
  
  try {
    // 1️⃣ Supprimer côté serveur
    await supprimerTousLesPacks(mosqueeActive);
    
    // 2️⃣ Attendre la synchronisation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3️⃣ Recharger les packs (sera vide)
    await chargerPacks();
    
    // 4️⃣ PUIS afficher l'alerte de succès
    alert('✅ Tous les packs ont été supprimés avec succès');
    
  } catch (error) {
    console.error('Erreur suppression:', error);
    alert('❌ Erreur lors de la suppression des packs');
    await chargerPacks();
  } finally {
    setLoading(false);
  }
};
  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    try {
      const fileName = `Packs_${mosqueeData?.nom || 'Mosquee'}_${new Date().toLocaleDateString('fr-FR')}`;
      await exportToPDF(packs, mosqueeData, fileName);
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('❌ Erreur lors de l\'export PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      const fileName = `Packs_${mosqueeData?.nom || 'Mosquee'}_${new Date().toLocaleDateString('fr-FR')}`;
      await exportToExcel(packs, mosqueeData, fileName);
    } catch (error) {
      console.error('Erreur export Excel:', error);
      alert('❌ Erreur lors de l\'export Excel');
    }
  };

  const handleSuccess = async () => {
    await chargerPacks();
  };

  const hasPacks = (packs?.standard?.length > 0) || (packs?.supplements?.length > 0);

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Récapitulatif des Packs</h2>
          {lastUpdate && (
            <p className="text-sm text-gray-500 mt-1">
              Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR')}
            </p>
          )}
        </div>
        
        <div className="flex gap-3">
          {hasPacks && (
            <>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                <Printer className="w-5 h-5" />
                Imprimer
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                <FileDown className="w-5 h-5" />
                PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
              >
                <FileSpreadsheet className="w-5 h-5" />
                Excel
              </button>
            </>
          )}
          
          {hasPacks && (
            <button
              onClick={handleSupprimerTout}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5" />
              Supprimer tout
            </button>
          )}
          
          <button
            onClick={() => setShowModalGenerer(true)}
            disabled={loading || !mosqueeActive}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            {hasPacks ? 'Régénérer' : 'Générer les packs'}
          </button>
        </div>
      </div>

      {/* En-tête pour impression */}
      <div className="hidden print:block mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          Récapitulatif des Packs - {mosqueeData?.nom}
        </h1>
        <p className="text-center text-gray-600">
          Généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
        </p>
      </div>

      {/* Contenu */}
      {loading && !hasPacks ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : !hasPacks ? (
        <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-12 text-center">
          <p className="text-gray-600 mb-4">Aucun pack généré pour le moment</p>
          <button
            onClick={() => setShowModalGenerer(true)}
            disabled={!mosqueeActive}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold disabled:opacity-50"
          >
            Générer les packs automatiquement
          </button>
        </div>
      ) : (
        <PacksTable packs={packs} />
      )}

      {/* Modal génération */}
      <ModalGenererPacks
        isOpen={showModalGenerer}
        onClose={() => setShowModalGenerer(false)}
        onSuccess={handleSuccess}
        inventaire={inventaire}
        beneficiaires={beneficiaires}
      />
    </div>
  );
}