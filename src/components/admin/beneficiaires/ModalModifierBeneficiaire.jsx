'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2, MapPin, Search } from 'lucide-react';
import Modal from '../ui/Modal';
import { updateBeneficiaire } from '@/lib/firebaseAdmin';
import { useMosquee } from '@/context/MosqueeContext';

export default function ModalModifierBeneficiaire({ isOpen, onClose, beneficiaire, onSuccess }) {
  const { mosqueeActive } = useMosquee();
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    nbPersonnes: 1,
    tailleFamille: 'Petite',
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

  useEffect(() => {
    if (beneficiaire) {
      setFormData({
        nom: beneficiaire.nom || '',
        email: beneficiaire.email || '',
        telephone: beneficiaire.telephone || '',
        adresse: beneficiaire.adresse || '',
        nbPersonnes: beneficiaire.nbPersonnes || 1,
        tailleFamille: beneficiaire.tailleFamille || 'Petite',
        articleFavori: beneficiaire.articleFavori || 'RIZ',
        statut: beneficiaire.statut || 'En attente'
      });
    }
  }, [beneficiaire]);

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
      
      // Filtrer uniquement les adresses d'Île-de-France
      const filteredFeatures = (data.features || []).filter(feature => {
        const postcode = feature.properties.postcode;
        if (!postcode) return false;
        
        const dept = postcode.substring(0, 2);
        return IDF_DEPARTEMENTS.includes(dept);
      }).slice(0, 5); // Limiter à 5 résultats après filtrage

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
      await updateBeneficiaire(beneficiaire.id, formData, mosqueeActive);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur modification:', error);
      alert('Erreur lors de la modification du bénéficiaire');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier le Bénéficiaire">
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Taille famille <span className="text-red-500">*</span>
            </label>
            <select
              name="tailleFamille"
              value={formData.tailleFamille}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
            >
              <option value="Petite">Petite (1-2)</option>
              <option value="Moyenne">Moyenne (3-5)</option>
              <option value="Grande">Grande (6+)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Article favori <span className="text-red-500">*</span>
          </label>
          <select
            name="articleFavori"
            value={formData.articleFavori}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
          >
            <option value="RIZ">🍚 RIZ</option>
            <option value="PÂTES">🍝 PÂTES</option>
            <option value="COUSCOUS">🥘 COUSCOUS</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Statut <span className="text-red-500">*</span>
          </label>
          <select
            name="statut"
            value={formData.statut}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
          >
            <option value="En attente">En attente</option>
            <option value="Validé">Validé</option>
            <option value="Refusé">Refusé</option>
            <option value="Pack Attribué">Pack Attribué</option>
            <option value="Livré">Livré</option>
          </select>
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
                Modification...
              </>
            ) : (
              'Enregistrer'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}