'use client';

import React, { useState } from 'react';
import { Loader2, Package, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import { ajouterArticleInventaire } from '@/lib/firebaseAdmin';
import { useMosquee } from '@/context/MosqueeContext'; // 🔥 AJOUTÉ

export default function ModalAjouterArticle({ isOpen, onClose, onSuccess }) {
  const { mosqueeActive, getMosqueeActiveData } = useMosquee(); // 🔥 AJOUTÉ
  const mosqueeData = getMosqueeActiveData(); // 🔥 AJOUTÉ
  
  const [formData, setFormData] = useState({
    nom: '',
    quantite: '',
    unite: 'kg',
    seuil: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 🔥 VÉRIFICATION mosqueeActive
      if (!mosqueeActive || mosqueeActive === 'ALL') {
        throw new Error('Veuillez sélectionner une mosquée spécifique pour ajouter un article');
      }

      if (!formData.nom || !formData.quantite || !formData.unite || !formData.seuil) {
        throw new Error('Veuillez remplir tous les champs');
      }

      if (parseFloat(formData.quantite) <= 0 || parseFloat(formData.seuil) <= 0) {
        throw new Error('Les quantités doivent être positives');
      }

      // 🔥 MODIFIÉ : Passer mosqueeActive
      await ajouterArticleInventaire({
        nom: formData.nom.trim(),
        quantite: parseFloat(formData.quantite),
        unite: formData.unite,
        seuil: parseFloat(formData.seuil)
      }, mosqueeActive);

      setFormData({
        nom: '',
        quantite: '',
        unite: 'kg',
        seuil: ''
      });

      if (onSuccess) {
        onSuccess();
      }

      onClose();

    } catch (err) {
      console.error('❌ Erreur ajout article:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mosqueeActive) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un Article" size="md">
        <div className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <p className="text-gray-800 font-semibold mb-2">
            Aucune mosquée sélectionnée
          </p>
          <p className="text-gray-600 text-sm">
            Veuillez sélectionner une mosquée avant d'ajouter un article.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un Article" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info mosquée */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            📦 Article pour : <strong>{mosqueeData?.nom}</strong>
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nom de l'article *
          </label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            placeholder="Ex: Riz, Farine, Huile..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Articles prioritaires : Riz, Pâtes, Semoule, Couscous
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantité *
            </label>
            <input
              type="number"
              name="quantite"
              value={formData.quantite}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="Ex: 500"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Unité *
            </label>
            <select
              name="unite"
              value={formData.unite}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
            >
              <option value="kg">Kilogrammes (kg)</option>
              <option value="L">Litres (L)</option>
              <option value="unité">Unités</option>
              <option value="paquets">Paquets</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Seuil d'alerte *
          </label>
          <input
            type="number"
            name="seuil"
            value={formData.seuil}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="Ex: 100"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Vous serez alerté quand le stock descendra sous ce seuil
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {formData.nom && formData.quantite && (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Package className="w-10 h-10 text-emerald-600" />
              <div>
                <p className="font-semibold text-gray-800">{formData.nom}</p>
                <p className="text-sm text-gray-600">
                  {formData.quantite} {formData.unite} disponibles
                </p>
                {formData.seuil && (
                  <p className="text-xs text-gray-500">
                    Alerte à {formData.seuil} {formData.unite}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Ajout en cours...
              </>
            ) : (
              'Ajouter l\'article'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}