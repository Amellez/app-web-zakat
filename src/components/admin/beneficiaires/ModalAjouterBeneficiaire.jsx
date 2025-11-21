'use client';

import React, { useState } from 'react';
import { Loader2, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import { ajouterBeneficiaire } from '@/lib/firebaseAdmin';
import { useMosquee } from '@/context/MosqueeContext'; // 🔥 AJOUTÉ

export default function ModalAjouterBeneficiaire({ isOpen, onClose, onSuccess }) {
  const { mosqueeActive, getMosqueeActiveData } = useMosquee(); // 🔥 AJOUTÉ
  const mosqueeData = getMosqueeActiveData(); // 🔥 AJOUTÉ
  
  const [formData, setFormData] = useState({
    nom: '',
    articleFavori: '',
    email: '',
    telephone: '',
    adresse: '',
    complementAdresse: '',
    nbPersonnes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Articles favoris disponibles
  const articlesFavoris = [
    { 
      value: 'RIZ', 
      label: 'Riz', 
      emoji: '🍚',
      description: 'Supplément de riz' 
    },
    { 
      value: 'PÂTES', 
      label: 'Pâtes', 
      emoji: '🍝',
      description: 'Supplément de pâtes' 
    },
    { 
      value: 'COUSCOUS', 
      label: 'Couscous', 
      emoji: '🥘',
      description: 'Supplément de couscous' 
    }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Recherche d'adresses avec autocomplétion (API Adresse Gouv.fr)
  const searchAddress = async (query) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);

    try {
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?` +
        `q=${encodeURIComponent(query)}&` +
        `limit=8`
      );

      const data = await response.json();

      // Filtrer pour garder uniquement Île-de-France (départements 75, 77, 78, 91, 92, 93, 94, 95)
      const idfDepartments = ['75', '77', '78', '91', '92', '93', '94', '95'];
      
      const suggestions = data.features
        .filter(item => {
          const postcode = item.properties.postcode || '';
          const dept = postcode.substring(0, 2);
          return idfDepartments.includes(dept);
        })
        .map(item => {
          const props = item.properties;
          return {
            label: props.label,
            name: props.name,
            postcode: props.postcode,
            city: props.city,
            context: props.context,
            formatted: props.label
          };
        });

      setAddressSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('Erreur recherche adresse:', error);
      setAddressSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Gestion de la saisie d'adresse avec debounce
  const handleAddressChange = (e) => {
    const value = e.target.value;
    handleChange(e);
    
    // Annuler le timeout précédent
    if (window.addressTimeoutAdmin) {
      clearTimeout(window.addressTimeoutAdmin);
    }
    
    // Attendre 500ms après que l'utilisateur ait fini de taper
    window.addressTimeoutAdmin = setTimeout(() => {
      searchAddress(value);
    }, 500);
  };

  // Sélection d'une suggestion
  const selectAddress = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      adresse: suggestion.formatted
    }));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const getTailleFamille = (nb) => {
    const n = parseInt(nb);
    if (n <= 2) return 'Petite';
    if (n <= 5) return 'Moyenne';
    return 'Grande';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 🔥 VÉRIFICATION : S'assurer qu'une mosquée est active
      if (!mosqueeActive || mosqueeActive === 'ALL') {
        throw new Error('Veuillez sélectionner une mosquée spécifique pour ajouter un bénéficiaire');
      }

      // Validation basique
      if (!formData.nom || !formData.articleFavori || !formData.email || !formData.telephone || !formData.adresse || !formData.nbPersonnes) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      // Validation email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Veuillez entrer une adresse email valide');
      }

      // Validation téléphone
      const telRegex = /^[0-9\s\+\-\(\)]{10,}$/;
      if (!telRegex.test(formData.telephone)) {
        throw new Error('Veuillez entrer un numéro de téléphone valide');
      }

      const nbPersonnes = parseInt(formData.nbPersonnes);
      if (isNaN(nbPersonnes) || nbPersonnes < 1) {
        throw new Error('Le nombre de personnes doit être supérieur à 0');
      }

      // 🔥 MODIFIÉ : Ajouter mosqueeId et mosqueeName
      const beneficiaire = {
        nom: formData.nom,
        articleFavori: formData.articleFavori,
        email: formData.email,
        telephone: formData.telephone,
        adresse: formData.adresse,
        complementAdresse: formData.complementAdresse || '',
        nbPersonnes: nbPersonnes,
        tailleFamille: getTailleFamille(nbPersonnes),
        mosqueeId: mosqueeActive, // 🔥 AJOUTÉ
        mosqueeName: mosqueeData?.nom || '', // 🔥 AJOUTÉ
        mosqueeVille: mosqueeData?.ville || '', // 🔥 AJOUTÉ (optionnel)
        attestations: {
          musulman: true,
          besoin: true,
          veracite: true,
          ileDeFrance: true
        },
        source: 'admin', // SOURCE ADMIN
        statut: 'Validé', // DIRECTEMENT VALIDÉ
        createdAt: new Date().toISOString()
      };

      console.log('🔥 Ajout bénéficiaire avec mosqueeId:', mosqueeActive);

      // Envoyer à Firebase
      await ajouterBeneficiaire(beneficiaire);

      // Réinitialiser le formulaire
      setFormData({
        nom: '',
        articleFavori: '',
        email: '',
        telephone: '',
        adresse: '',
        complementAdresse: '',
        nbPersonnes: ''
      });
      setAddressSuggestions([]);
      setShowSuggestions(false);

      // Callback de succès
      if (onSuccess) {
        onSuccess();
      }

      // Fermer la modal
      onClose();

    } catch (err) {
      console.error('❌ Erreur ajout bénéficiaire:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 AJOUTÉ : Message si pas de mosquée sélectionnée
  if (!mosqueeActive) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un Bénéficiaire sur Place" size="lg">
        <div className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <p className="text-gray-800 font-semibold mb-2">
            Aucune mosquée sélectionnée
          </p>
          <p className="text-gray-600 text-sm">
            Veuillez sélectionner une mosquée avant d'ajouter un bénéficiaire.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un Bénéficiaire sur Place" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              Inscription sur place - {mosqueeData?.nom}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Les bénéficiaires ajoutés ici sont automatiquement validés et marqués comme "Sur place"
            </p>
          </div>
        </div>

        {/* Nom Complet */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nom Complet *
          </label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            placeholder="Ex: Ahmed Ben Mohamed"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Article Favori */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Article Favori * 
            <span className="text-xs font-normal text-gray-500 ml-2">
              (Le bénéficiaire recevra un supplément de cet article)
            </span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {articlesFavoris.map(article => (
              <button
                key={article.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, articleFavori: article.value }))}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  formData.articleFavori === article.value
                    ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{article.emoji}</div>
                  <div className="font-bold text-gray-800 mb-1">{article.label}</div>
                  <div className="text-xs text-gray-600">{article.description}</div>
                </div>
                {formData.articleFavori === article.value && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Email et Téléphone sur la même ligne */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Adresse Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@exemple.com"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Téléphone *
            </label>
            <input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              placeholder="06 12 34 56 78"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Adresse avec autocomplétion */}
        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Adresse Complète *
          </label>
          <input
            type="text"
            name="adresse"
            value={formData.adresse}
            onChange={handleAddressChange}
            onFocus={() => setShowSuggestions(addressSuggestions.length > 0)}
            placeholder="Commencez à taper l'adresse..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
            autoComplete="off"
          />
          {loadingSuggestions && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Recherche d'adresses...
            </p>
          )}
          {!loadingSuggestions && (
            <p className="text-xs text-gray-500 mt-1">
              Tapez au moins 3 caractères pour voir les suggestions
            </p>
          )}
          
          {/* Liste des suggestions */}
          {showSuggestions && addressSuggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border-2 border-emerald-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {addressSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectAddress(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition border-b border-gray-100 last:border-b-0"
                >
                  <p className="text-sm font-semibold text-gray-800">
                    {suggestion.name}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {suggestion.postcode} {suggestion.city}
                  </p>
                </button>
              ))}
            </div>
          )}
          
          {/* Message si pas de résultats */}
          {showSuggestions && addressSuggestions.length === 0 && !loadingSuggestions && formData.adresse.length >= 3 && (
            <div className="absolute z-50 w-full mt-1 bg-yellow-50 border-2 border-yellow-200 rounded-lg shadow-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Aucune adresse trouvée en Île-de-France. Vérifiez l'orthographe ou entrez l'adresse manuellement.
              </p>
            </div>
          )}
        </div>

        {/* Complément d'adresse */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Complément d'adresse (optionnel)
          </label>
          <input
            type="text"
            name="complementAdresse"
            value={formData.complementAdresse}
            onChange={handleChange}
            placeholder="Bâtiment, Étage, Porte..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Nombre de Personnes */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nombre de Personnes dans le Foyer *
          </label>
          <input
            type="number"
            name="nbPersonnes"
            value={formData.nbPersonnes}
            onChange={handleChange}
            min="1"
            placeholder="Ex: 5"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
          />
          {formData.nbPersonnes && (
            <p className="text-sm text-emerald-600 mt-2 font-medium">
              Catégorie: {getTailleFamille(formData.nbPersonnes)} famille
            </p>
          )}
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Aperçu */}
        {formData.nom && formData.articleFavori && formData.nbPersonnes && (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-lg">
            <div className="flex items-center gap-3">
              <UserPlus className="w-10 h-10 text-emerald-600" />
              <div>
                <p className="font-semibold text-gray-800">{formData.nom}</p>
                <p className="text-sm text-gray-600">
                  Article favori: {formData.articleFavori} • {formData.nbPersonnes} personnes ({getTailleFamille(formData.nbPersonnes)} famille)
                </p>
                <p className="text-xs text-emerald-600 font-medium mt-1">
                  ✓ Sera automatiquement validé pour {mosqueeData?.nom}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Boutons */}
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
              <>
                <UserPlus className="w-5 h-5" />
                Ajouter le bénéficiaire
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}