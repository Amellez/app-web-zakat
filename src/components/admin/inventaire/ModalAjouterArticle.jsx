'use client';

import React, { useState } from 'react';
import { Loader2, Package, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import { ajouterArticleInventaire, getInventaire } from '@/lib/firebaseAdmin';
import { useMosquee } from '@/context/MosqueeContext';

// 🔥 LISTE PRÉDÉFINIE DE PRODUITS
const PRODUITS_PREDEFINIES = [
  'Riz',
  'Pâtes',
  'Couscous',
  'Semoule',
  'Lentilles',
  'Huile',
  'Sucre',
  'Farine',
  'Thé',
  'Café',
  'Lait en poudre',
  'Conserves',
  'Tomate concentrée',
  'Harissa',
  'Épices',
  'Autre' // Option pour produit personnalisé
];

export default function ModalAjouterArticle({ isOpen, onClose, onSuccess }) {
  const { mosqueeActive, getMosqueeActiveData } = useMosquee();
  const mosqueeData = getMosqueeActiveData();
  
  const [formData, setFormData] = useState({
    produitPredifini: '',
    nomPersonnalise: '',
    quantite: '',
    unite: 'kg'
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
      if (!mosqueeActive || mosqueeActive === 'ALL') {
        throw new Error('Veuillez sélectionner une mosquée spécifique pour ajouter un article');
      }

      // 🔥 Déterminer le nom final
      let nomFinal = '';
      if (formData.produitPredifini === 'Autre') {
        if (!formData.nomPersonnalise.trim()) {
          throw new Error('Veuillez saisir le nom du produit');
        }
        nomFinal = formData.nomPersonnalise.trim();
      } else {
        if (!formData.produitPredifini) {
          throw new Error('Veuillez sélectionner un produit');
        }
        nomFinal = formData.produitPredifini;
      }

      if (!formData.quantite || !formData.unite) {
        throw new Error('Veuillez remplir tous les champs');
      }

      if (parseFloat(formData.quantite) <= 0) {
        throw new Error('La quantité doit être positive');
      }

      // Vérifier les doublons
      console.log('🔍 Vérification des doublons...');
      const inventaireExistant = await getInventaire(mosqueeActive);
      
      const nomNormalise = nomFinal.toLowerCase();
      const articleExistant = inventaireExistant.find(
        item => item.nom.trim().toLowerCase() === nomNormalise
      );

      if (articleExistant) {
        throw new Error(`❌ Un article nommé "${articleExistant.nom}" existe déjà dans l'inventaire`);
      }

      await ajouterArticleInventaire({
        nom: nomFinal,
        quantite: parseFloat(formData.quantite),
        unite: formData.unite,
        seuil: 50
      }, mosqueeActive);

      // Reset form
      setFormData({
        produitPredifini: '',
        nomPersonnalise: '',
        quantite: '',
        unite: 'kg'
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

  // 🔥 Déterminer le nom à afficher dans la prévisualisation
  const nomAffiche = formData.produitPredifini === 'Autre' 
    ? formData.nomPersonnalise 
    : formData.produitPredifini;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un Article" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info mosquée */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            📦 Article pour : <strong>{mosqueeData?.nom}</strong>
          </p>
        </div>

        {/* 🔥 NOUVEAU : Select avec produits prédéfinis */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Produit *
          </label>
          <select
            name="produitPredifini"
            value={formData.produitPredifini}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
          >
            <option value="">-- Sélectionner un produit --</option>
            {PRODUITS_PREDEFINIES.map(produit => (
              <option key={produit} value={produit}>
                {produit}
              </option>
            ))}
          </select>
        </div>

        {/* 🔥 NOUVEAU : Input personnalisé si "Autre" sélectionné */}
        {formData.produitPredifini === 'Autre' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nom du produit personnalisé *
            </label>
            <input
              type="text"
              name="nomPersonnalise"
              value={formData.nomPersonnalise}
              onChange={handleChange}
              placeholder="Ex: Dates, Miel, etc."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
            />
          </div>
        )}

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

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Prévisualisation */}
        {nomAffiche && formData.quantite && (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Package className="w-10 h-10 text-emerald-600" />
              <div>
                <p className="font-semibold text-gray-800">{nomAffiche}</p>
                <p className="text-sm text-gray-600">
                  {formData.quantite} {formData.unite} disponibles
                </p>
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