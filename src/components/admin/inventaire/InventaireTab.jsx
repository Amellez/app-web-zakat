'use client';

import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Loader2 } from 'lucide-react';
import InventaireCard from './InventaireCard';
import ModalAjouterArticle from './ModalAjouterArticle';
import { getInventaire, updateArticleInventaire, supprimerArticleInventaire } from '@/lib/firebaseAdmin';

export default function InventaireTab({ inventaire, setInventaire }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Charger l'inventaire depuis Firebase
  const chargerInventaire = async () => {
    setLoading(true);
    try {
      const data = await getInventaire();
      setInventaire(data);
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
      // Mettre à jour dans Firebase
      await updateArticleInventaire(id, {
        quantite: parseFloat(editValue)
      });

      // Mettre à jour localement
      setInventaire(prev => prev.map(item =>
        item.id === id ? { ...item, quantite: parseFloat(editValue) } : item
      ));
      
      setEditingId(null);
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.')) {
      return;
    }

    try {
      // Supprimer de Firebase
      await supprimerArticleInventaire(id);

      // Mettre à jour localement
      setInventaire(prev => prev.filter(item => item.id !== id));
      
      alert('✅ Article supprimé avec succès');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const handleSuccess = () => {
    // Recharger l'inventaire après ajout
    chargerInventaire();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestion de l'Inventaire</h2>
        <div className="flex gap-3">
          <button
            onClick={chargerInventaire}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            <Plus className="w-5 h-5" />
            Ajouter un produit
          </button>
        </div>
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
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold"
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

      {/* Modal d'ajout */}
      <ModalAjouterArticle
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}