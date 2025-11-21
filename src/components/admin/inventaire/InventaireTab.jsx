'use client';

import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Loader2, Zap, CheckCircle2 } from 'lucide-react';
import InventaireCard from './InventaireCard';
import ModalAjouterArticle from './ModalAjouterArticle';
import { useMosquee } from '@/context/MosqueeContext'; // 🔥 AJOUTÉ
import { 
  getInventaire, 
  updateArticleInventaire, 
  supprimerArticleInventaire,
  ecouterInventaire 
} from '@/lib/firebaseAdmin';

export default function InventaireTab({ inventaire, setInventaire, beneficiaires }) {
  const { mosqueeActive } = useMosquee(); // 🔥 AJOUTÉ
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (mosqueeActive) {
      chargerInventaire();
    }
  }, [mosqueeActive]);

  const chargerInventaire = async () => {
    if (!mosqueeActive) return;
    
    setLoading(true);
    try {
      const data = await getInventaire(mosqueeActive); // 🔥 MODIFIÉ
      setInventaire(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erreur chargement inventaire:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id, currentQuantite) => {
    setEditingId(id);
    setEditValue(currentQuantite.toString());
  };

  const handleSave = async (id) => {
    try {
      setIsRegenerating(true);
      
      await updateArticleInventaire(id, {
        quantite: parseFloat(editValue)
      }, mosqueeActive); // 🔥 AJOUTÉ

      setInventaire(prev => prev.map(item =>
        item.id === id ? { ...item, quantite: parseFloat(editValue) } : item
      ));
      
      setEditingId(null);
      setLastUpdate(new Date());

      console.log('✅ Article mis à jour - Packs régénérés automatiquement');
      
      setTimeout(() => {
        setIsRegenerating(false);
      }, 2000);
      
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      alert('Erreur lors de la mise à jour');
      setIsRegenerating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.')) {
      return;
    }

    try {
      setIsRegenerating(true);
      
      await supprimerArticleInventaire(id, mosqueeActive); // 🔥 AJOUTÉ

      setInventaire(prev => prev.filter(item => item.id !== id));
      
      alert('✅ Article supprimé avec succès');
      setLastUpdate(new Date());

      console.log('✅ Article supprimé - Packs régénérés automatiquement');
      
      setTimeout(() => {
        setIsRegenerating(false);
      }, 2000);
      
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
      setIsRegenerating(false);
    }
  };

  const handleSuccess = async () => {
    setIsRegenerating(true);
    await chargerInventaire();
    
    console.log('✅ Article ajouté - Packs régénérés automatiquement');
    
    setTimeout(() => {
      setIsRegenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestion de l'Inventaire</h2>
        <div className="flex gap-3">
          <button
            onClick={chargerInventaire}
            disabled={loading || !mosqueeActive}
            className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={() => setShowModal(true)}
            disabled={!mosqueeActive}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Ajouter un produit
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-emerald-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
              Régénération automatique activée en permanence
              {!isRegenerating ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              )}
            </p>
            <p className="text-sm text-emerald-700 mt-1">
              Les packs sont automatiquement régénérés à chaque modification de l'inventaire (ajout, modification, suppression).
              {isRegenerating && (
                <span className="block mt-1 text-blue-600 font-semibold">
                  🔄 Régénération en cours...
                </span>
              )}
            </p>
          </div>
        </div>
        
        {lastUpdate && (
          <div className="mt-3 pt-3 border-t border-emerald-200">
            <p className="text-xs text-emerald-600">
              Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR')}
            </p>
          </div>
        )}
      </div>

      {isRegenerating && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 flex items-center gap-3 animate-pulse">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-800">
              Régénération automatique des packs en cours...
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Les packs se mettent à jour automatiquement suite à votre modification
            </p>
          </div>
        </div>
      )}

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
              onEdit={handleEdit}
              onSave={handleSave}
              onDelete={handleDelete}
              editingId={editingId}
              editValue={editValue}
              setEditValue={setEditValue}
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