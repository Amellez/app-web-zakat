'use client';
import React, { useState, useCallback } from 'react';
import { X, Loader2, MapPin, Search, CheckCircle, UserPlus, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import { ajouterBeneficiaire } from '@/lib/firebaseAdmin';
import { useMosquee } from '@/context/MosqueeContext';

export default function ModalAjouterBeneficiaire({ isOpen, onClose, onSuccess }) {
  const { mosqueeActive, getMosqueeActiveData } = useMosquee();
  const mosqueeData = getMosqueeActiveData();
  
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    nbPersonnes: 1,
    articleFavori: 'RIZ',
    statut: 'En attente'
  });
  
  const [loading, setLoading] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Départements Île-de-France
  const IDF_DEPARTEMENTS = ['75', '77', '78', '91', '92', '93', '94', '95'];

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

  // 🔥 FONCTION : Calculer automatiquement la taille de famille
  const calculerTailleFamille = (nbPersonnes) => {
    const nb = parseInt(nbPersonnes);
    if (nb <= 2) return 'Petite';
    if (nb <= 5) return 'Moyenne';
    return 'Grande';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const searchAddress = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchingAddress(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=20`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Erreur de recherche');
      }

      const data = await response.json();
      
      const filteredFeatures = (data.features || []).filter(feature => {
        const postcode = feature.properties.postcode;
        if (!postcode) return false;
        
        const dept = postcode.substring(0, 2);
        return IDF_DEPARTEMENTS.includes(dept);
      }).slice(0, 5);

      setAddressSuggestions(filteredFeatures);
      setShowSuggestions(filteredFeatures.length > 0);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Recherche annulée (timeout)');
      } else {
        console.error('Erreur recherche adresse:', error);
      }
      setAddressSuggestions([]);
    } finally {
      setSearchingAddress(false);
    }
  }, []);

  const handleAddressChange = (e) => {
    handleChange(e);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const newTimeout = setTimeout(() => {
      searchAddress(e.target.value);
    }, 500);

    setSearchTimeout(newTimeout);
  };

  const handleAddressSelect = (feature) => {
    const address = feature.properties.label;
    setFormData(prev => ({
      ...prev,
      adresse: address
    }));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mosqueeActive) {
      alert('Erreur: Aucune mosquée sélectionnée');
      return;
    }

    setLoading(true);

    try {
      // 🔥 AJOUTÉ : Calculer automatiquement la taille de famille
      const tailleFamille = calculerTailleFamille(formData.nbPersonnes);
      
      const beneficiaireData = {
        ...formData,
        tailleFamille,
        mosqueeId: mosqueeActive,
        source: 'admin'
      };

      await ajouterBeneficiaire(beneficiaireData);

      // Réinitialiser le formulaire
      setFormData({
        nom: '',
        email: '',
        telephone: '',
        adresse: '',
        nbPersonnes: 1,
        articleFavori: 'RIZ',
        statut: 'En attente'
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur ajout:', error);
      alert('Erreur lors de l\'ajout du bénéficiaire');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 AJOUTÉ : Calculer la taille affichée
  const tailleFamilleCalculee = calculerTailleFamille(formData.nbPersonnes);

  // 🔥 Message si pas de mosquée sélectionnée
  if (!mosqueeActive) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un Bénéficiaire">
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
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un Bénéficiaire">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              Inscription sur place - {mosqueeData?.nom}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Les bénéficiaires ajoutés ici sont marqués comme "Sur place"
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nom complet <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            required
            placeholder="Ex: Ahmed Benali"
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="exemple@email.com"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Téléphone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              required
              placeholder="06 12 34 56 78"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Adresse complète (Île-de-France uniquement) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              name="adresse"
              value={formData.adresse}
              onChange={handleAddressChange}
              onFocus={() => {
                if (addressSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              required
              placeholder="Ex: 12 rue de Paris, 75001 Paris"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none pr-10"
            />
            {searchingAddress && (
              <Loader2 className="absolute right-3 top-3 w-5 h-5 text-gray-400 animate-spin" />
            )}
            {!searchingAddress && formData.adresse && (
              <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            📍 Départements: Paris (75), Seine-et-Marne (77), Yvelines (78), Essonne (91), Hauts-de-Seine (92), Seine-Saint-Denis (93), Val-de-Marne (94), Val-d'Oise (95)
          </p>

          {showSuggestions && addressSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {addressSuggestions.map((feature, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddressSelect(feature)}
                  className="w-full px-4 py-3 text-left hover:bg-emerald-50 border-b border-gray-100 last:border-b-0 flex items-start gap-2 transition"
                >
                  <MapPin className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium">
                      {feature.properties.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {feature.properties.postcode} {feature.properties.city}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {!searchingAddress && showSuggestions && addressSuggestions.length === 0 && formData.adresse.length >= 3 && (
            <div className="absolute z-10 w-full mt-1 bg-white border-2 border-yellow-300 rounded-lg shadow-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Aucune adresse trouvée en Île-de-France. Vérifiez votre saisie.
              </p>
            </div>
          )}
        </div>

        {/* 🔥 MODIFIÉ : Affichage du nombre de personnes avec taille calculée */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nombre de personnes <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="nbPersonnes"
            value={formData.nbPersonnes}
            onChange={handleChange}
            min="1"
            required
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
          />
          <p className="text-xs text-emerald-600 mt-1 font-medium">
            → Taille de famille: {tailleFamilleCalculee} 
            {tailleFamilleCalculee === 'Petite' && ' (1-2 personnes)'}
            {tailleFamilleCalculee === 'Moyenne' && ' (3-5 personnes)'}
            {tailleFamilleCalculee === 'Grande' && ' (6+ personnes)'}
          </p>
        </div>

        {/* 🔥 Design avec cartes pour l'article favori */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Article Favori * 
            <span className="text-xs font-normal text-gray-500 ml-2">
              (Le bénéficiaire recevra un supplément de cet article)
            </span>
          </label>
          <div className="grid grid-cols-3 gap-3">
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
                  <div className="font-bold text-gray-800 text-sm mb-1">{article.label}</div>
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

        

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Ajout en cours...
              </>
            ) : (
              'Ajouter'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}