'use client';

import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Loader2, Save, AlertTriangle } from 'lucide-react';
import InventaireCard from './InventaireCard';
import ModalAjouterArticle from './ModalAjouterArticle';
import { useMosquee } from '@/context/MosqueeContext';
import { 
  getInventaire, 
  updateArticleInventaire, 
  supprimerArticleInventaire
} from '@/lib/firebaseAdmin';

export default function InventaireTab({ inventaire, setInventaire, beneficiaires }) {
  const { mosqueeActive } = useMosquee();
  const [inventaireOriginal, setInventaireOriginal] = useState([]); // 🔥 NOUVEAU : Pour comparer
  const [modificationsEnCours, setModificationsEnCours] = useState({}); // 🔥 NOUVEAU : Tracker les modifs
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (mosqueeActive) {
      chargerInventaire();
    }
  }, [mosqueeActive]);

  // 🔥 NOUVEAU : Warning avant de quitter la page
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const chargerInventaire = async () => {
    if (!mosqueeActive) return;
    
    setLoading(true);
    try {
      const data = await getInventaire(mosqueeActive);
      setInventaire(data);
      setInventaireOriginal(JSON.parse(JSON.stringify(data))); // Deep copy
      setModificationsEnCours({});
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Erreur chargement inventaire:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 NOUVEAU : Marquer un article comme modifié
  const handleModificationLocale = (id, nouveauNom, nouvelleQuantite) => {
    setInventaire(prev => prev.map(item =>
      item.id === id 
        ? { ...item, nom: nouveauNom, quantite: parseFloat(nouvelleQuantite) }
        : item
    ));

    setModificationsEnCours(prev => ({
      ...prev,
      [id]: { nom: nouveauNom, quantite: parseFloat(nouvelleQuantite) }
    }));

    setHasUnsavedChanges(true);
  };

  // 🔥 NOUVEAU : Annuler toutes les modifications
  const handleAnnulerTout = () => {
    if (!confirm('Annuler toutes les modifications non enregistrées ?')) {
      return;
    }

    setInventaire(JSON.parse(JSON.stringify(inventaireOriginal)));
    setModificationsEnCours({});
    setHasUnsavedChanges(false);
  };

  // 🔥 NOUVEAU : Enregistrer toutes les modifications d'un coup
  const handleEnregistrerTout = async () => {
    if (Object.keys(modificationsEnCours).length === 0) {
      alert('Aucune modification à enregistrer');
      return;
    }

    const confirmation = confirm(
      `Enregistrer ${Object.keys(modificationsEnCours).length} modification(s) ?\n\n` +
      `⚡ Les packs seront automatiquement régénérés après l'enregistrement.`
    );

    if (!confirmation) return;

    setSaving(true);
    try {
      // Sauvegarder toutes les modifications en parallèle
      const promises = Object.entries(modificationsEnCours).map(([id, updates]) =>
        updateArticleInventaire(id, updates, mosqueeActive)
      );

      await Promise.all(promises);

      // Mettre à jour l'original
      setInventaireOriginal(JSON.parse(JSON.stringify(inventaire)));
      setModificationsEnCours({});
      setHasUnsavedChanges(false);

      alert(`✅ ${Object.keys(modificationsEnCours).length} modification(s) enregistrée(s) avec succès !\n\n🔄 Les packs ont été automatiquement régénérés.`);

    } catch (error) {
      console.error('Erreur enregistrement:', error);
      alert('❌ Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmation = confirm(
      'Êtes-vous sûr de vouloir supprimer cet article ?\n\n' +
      '⚠️ Cette action est irréversible.\n' +
      '⚡ Les packs seront automatiquement régénérés.'
    );
    
    if (!confirmation) return;

    try {
      setSaving(true);
      await supprimerArticleInventaire(id, mosqueeActive);

      setInventaire(prev => prev.filter(item => item.id !== id));
      setInventaireOriginal(prev => prev.filter(item => item.id !== id));
      
      // Supprimer des modifications en cours si présent
      const newModifs = { ...modificationsEnCours };
      delete newModifs[id];
      setModificationsEnCours(newModifs);

      alert('✅ Article supprimé avec succès !\n\n🔄 Les packs ont été automatiquement régénérés.');
      
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  const handleSuccess = async () => {
    await chargerInventaire();
    alert('✅ Article ajouté avec succès !\n\n🔄 Les packs ont été automatiquement régénérés.');
  };

  const nombreModifications = Object.keys(modificationsEnCours).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestion de l'Inventaire</h2>
        <div className="flex gap-3">
          <button
            onClick={chargerInventaire}
            disabled={loading || !mosqueeActive || hasUnsavedChanges}
            className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            title={hasUnsavedChanges ? 'Enregistrez d\'abord vos modifications' : 'Actualiser'}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={() => setShowModal(true)}
            disabled={!mosqueeActive || hasUnsavedChanges}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
            title={hasUnsavedChanges ? 'Enregistrez d\'abord vos modifications' : 'Ajouter un article'}
          >
            <Plus className="w-5 h-5" />
            Ajouter un produit
          </button>
        </div>
      </div>

      {/* 🔥 NOUVEAU : Barre de modifications en cours */}
      {hasUnsavedChanges && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-lg p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-orange-800 mb-2">
                ⚠️ {nombreModifications} modification(s) non enregistrée(s)
              </p>
              <p className="text-xs text-orange-700 mb-3">
                Les modifications sont enregistrées localement. Cliquez sur "Enregistrer" pour sauvegarder et régénérer les packs automatiquement.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleEnregistrerTout}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Enregistrer ({nombreModifications})
                    </>
                  )}
                </button>
                <button
                  onClick={handleAnnulerTout}
                  disabled={saving}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold disabled:opacity-50"
                >
                  Annuler tout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info régénération automatique */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          ⚡ <strong>Régénération automatique :</strong> Les packs sont automatiquement régénérés après chaque enregistrement (ajout, modification, suppression).
        </p>
      </div>

      {loading && inventaire.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : inventaire.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-12 text-center">
          <p className="text-gray-600 mb-4">Aucun article dans l'inventaire</p>
          <button
            onClick={() => setShowModal(true)}
            disabled={!mosqueeActive}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold disabled:opacity-50"
          >
            Ajouter le premier article
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventaire.map(item => (
            <InventaireCard
              key={item.id}
              item={item}
              onModification={handleModificationLocale}
              onDelete={handleDelete}
              isModified={!!modificationsEnCours[item.id]}
              disabled={saving}
            />
          ))}
        </div>
      )}

      <ModalAjouterArticle
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}