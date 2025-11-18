'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, X } from 'lucide-react'; // Ajout de X pour le bouton de fermeture
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function InscriptionPage() {
  const [formData, setFormData] = useState({
    nom: '',
    articleFavori: '',
    email: '',
    telephone: '',
    adresse: '',
    adresseCorrigee: '',
    complementAdresse: '',
    nbPersonnes: '',
    attestationMusulman: false,
    attestationBesoin: false,
    attestationVeracite: false,
    attestationIleDeFrance: false
  });
  
  const [addressSelected, setAddressSelected] = useState(false);
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  // ✅ NOUVEL ÉTAT POUR LA MODALE DE SUCCÈS
  const [showSuccessModal, setShowSuccessModal] = useState(false); 

  const articlesFavoris = [
    { 
      value: 'RIZ', 
      label: 'Riz', 
      emoji: '🍚',
      description: 'Vous recevrez un supplément de riz dans votre pack' 
    },
    { 
      value: 'PÂTES', 
      label: 'Pâtes', 
      emoji: '🍝',
      description: 'Vous recevrez un supplément de pâtes dans votre pack' 
    },
    { 
      value: 'COUSCOUS', 
      label: 'Couscous', 
      emoji: '🥘',
      description: 'Vous recevrez un supplément de couscous dans votre pack' 
    }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getTailleFamille = (nb) => {
    const n = parseInt(nb);
    if (n <= 2) return 'Petite';
    if (n <= 5) return 'Moyenne';
    return 'Grande';
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
    if (window.addressTimeout) {
      clearTimeout(window.addressTimeout);
    }
    
    // Attendre 500ms après que l'utilisateur ait fini de taper
    window.addressTimeout = setTimeout(() => {
      searchAddress(value);
    }, 500);
  };

  // Sélection d'une suggestion
  const selectAddress = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      adresse: suggestion.formatted,
      adresseCorrigee: '' // Reset la correction quand on change d'adresse
    }));
    setAddressSelected(true);
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setStatus({ type: '', message: '' });
    setShowSuccessModal(false); // S'assurer que la modale n'est pas affichée au début du submit

    try {
      // Validation basique
      if (!formData.nom || !formData.articleFavori || !formData.email || !formData.telephone || !formData.adresse || !formData.nbPersonnes) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      // Validation email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Veuillez entrer une adresse email valide');
      }

      // Validation téléphone (format basique)
      const telRegex = /^[0-9\s\+\-\(\)]{10,}$/;
      if (!telRegex.test(formData.telephone)) {
        throw new Error('Veuillez entrer un numéro de téléphone valide');
      }

      // ✅ Validation stricte des attestations
      if (!formData.attestationMusulman || !formData.attestationBesoin || 
          !formData.attestationVeracite || !formData.attestationIleDeFrance) {
        throw new Error('Vous devez cocher toutes les attestations obligatoires pour continuer');
      }

      const nbPersonnes = parseInt(formData.nbPersonnes);
      if (isNaN(nbPersonnes) || nbPersonnes < 1) {
        throw new Error('Le nombre de personnes doit être supérieur à 0');
      }

      // Préparer les données
      const beneficiaire = {
        nom: formData.nom,
        articleFavori: formData.articleFavori,
        email: formData.email,
        telephone: formData.telephone,
        adresse: formData.adresseCorrigee || formData.adresse, // Utilise l'adresse corrigée si présente
        complementAdresse: formData.complementAdresse || '',
        nbPersonnes: nbPersonnes,
        tailleFamille: getTailleFamille(nbPersonnes),
        attestations: {
          musulman: formData.attestationMusulman,
          besoin: formData.attestationBesoin,
          veracite: formData.attestationVeracite,
          ileDeFrance: formData.attestationIleDeFrance
        },
        source: 'online',
        statut: 'En attente',
        createdAt: new Date().toISOString()
      };

      // Envoyer à Firebase
      await addDoc(collection(db, 'beneficiaires'), beneficiaire);

      // 🛑 Remplacer le message de statut par l'affichage de la modale de succès
      setStatus({ type: 'success', message: '' }); // Vider le message car on utilise la modale
      setShowSuccessModal(true); // Afficher la modale

      // Reset form
      setFormData({
        nom: '',
        articleFavori: '',
        email: '',
        telephone: '',
        adresse: '',
        adresseCorrigee: '',
        complementAdresse: '',
        nbPersonnes: '',
        attestationMusulman: false,
        attestationBesoin: false,
        attestationVeracite: false,
        attestationIleDeFrance: false
      });
      setAddressSuggestions([]);
      setShowSuggestions(false);
      setAddressSelected(false);

    } catch (error) {
      // Garder le message de statut d'erreur
      setStatus({
        type: 'error',
        message: error.message || 'Une erreur est survenue. Veuillez réessayer.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Composant Modal (Ajouté ici)
  const SuccessModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 m-4 transform transition-all duration-300 scale-100">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-6 animate-pulse" />
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Inscription Confirmée !
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Jazakoum Allahu Khayran.
          </p>
          
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 mb-8 text-left">
            <p className="text-sm font-medium text-emerald-800">
              Votre demande a bien été enregistrée.
            </p>
            <p className="text-sm text-emerald-700 mt-1">
              **Information Importante :** Votre inscription sera vérifiée. Vous recevrez très prochainement un email ou un appel pour confirmer le jour et l'horaire précis de la livraison de votre colis alimentaire.
            </p>
          </div>

          <button
            onClick={() => setShowSuccessModal(false)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition"
          >
            Fermer et revenir au formulaire
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Affichage de la modale si l'état est vrai */}
      {showSuccessModal && <SuccessModal />}

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* En-tête */}
        <div className="text-center mb-12">
          <div className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-full text-sm font-bold mb-6 shadow-lg">
            🌙 Zakat al-Fitr - Ramadan 1446
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-4">
            Inscription Bénéficiaire
          </h1>
          <p className="text-lg text-gray-600">
            Remplissez ce formulaire pour vous inscrire et recevoir votre colis alimentaire
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border-2 border-gray-100">
          <div className="space-y-6">
            {/* ... Tous les champs du formulaire restent ici ... */}
            
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition"
              />
            </div>

            {/* Article Favori */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Article Favori * <span className="text-xs font-normal text-gray-500 ml-2">
                  (Choisissez l'aliment que vous préférez - vous recevrez un supplément de celui-ci)
                </span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {articlesFavoris.map(article => (
                  <button
                    key={article.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, articleFavori: article.value }))}
                    className={`relative p-5 rounded-xl border-2 transition-all duration-200 ${
                      formData.articleFavori === article.value
                        ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-105 ring-2 ring-emerald-200'
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50 hover:scale-102'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">{article.emoji}</div>
                      <div className="font-bold text-gray-800 text-lg mb-2">{article.label}</div>
                      <div className="text-xs text-gray-600 leading-relaxed">{article.description}</div>
                    </div>
                    {formData.articleFavori === article.value && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {formData.articleFavori && (
                <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-sm text-emerald-700 font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Parfait ! Vous recevrez un pack standard + un supplément de {formData.articleFavori.toLowerCase()}
                  </p>
                </div>
              )}
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Vous recevrez une confirmation avec le jour et l'horaire de livraison
                </p>
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition"
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
                placeholder="Commencez à taper votre adresse..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition"
                autoComplete="off"
                disabled={addressSelected}
              />
              <p className="text-xs text-gray-500 mt-1">
                {loadingSuggestions ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Recherche d'adresses...
                  </span>
                ) : addressSelected ? (
                  'Adresse sélectionnée. Utilisez le champ ci-dessous pour la corriger si nécessaire.'
                ) : (
                  'Tapez au moins 3 caractères pour voir les suggestions.'
                )}
              </p>
              
              {/* Liste des suggestions */}
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border-2 border-emerald-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                <div className="absolute z-10 w-full mt-1 bg-yellow-50 border-2 border-yellow-200 rounded-lg shadow-lg p-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Aucune adresse trouvée en Île-de-France. Vérifiez l'orthographe ou entrez l'adresse manuellement.
                  </p>
                </div>
              )}
            </div>

            {/* ✅ NOUVEAU : Champ de correction d'adresse */}
            {addressSelected && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-800 mb-1">
                      L'adresse proposée n'est pas correcte ?
                    </p>
                    <p className="text-xs text-blue-700 mb-3">
                      Vous pouvez la corriger ou la compléter dans le champ ci-dessous. Si l'adresse est correcte, laissez ce champ vide.
                    </p>
                  </div>
                </div>
                
                <input
                  type="text"
                  name="adresseCorrigee"
                  value={formData.adresseCorrigee}
                  onChange={handleChange}
                  placeholder="Entrez l'adresse corrigée (optionnel)"
                  className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none transition bg-white"
                />
                
                <button
                  type="button"
                  onClick={() => {
                    setAddressSelected(false);
                    setFormData(prev => ({ ...prev, adresse: '', adresseCorrigee: '' }));
                  }}
                  className="text-xs text-blue-700 hover:text-blue-900 underline"
                >
                  Rechercher une autre adresse
                </button>
              </div>
            )}

            {/* Complément d'adresse */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Complément d'adresse (Bâtiment, Étage, Porte...)
              </label>
              <input
                type="text"
                name="complementAdresse"
                value={formData.complementAdresse}
                onChange={handleChange}
                placeholder="Ex: Bâtiment B, 3ème étage, Porte 12, Code 1234A"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition"
              />
              <p className="text-xs text-gray-500 mt-1">
                Informations complémentaires pour faciliter la livraison
              </p>
            </div>

            {/* Nombre de Personnes - SANS affichage de la taille */}
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition"
              />
            </div>

            {/* Séparateur */}
            <div className="border-t-2 border-gray-200 my-6"></div>

            {/* ✅ Attestations avec indicateur visuel d'obligation */}
            <div className="space-y-4 bg-amber-50 p-6 rounded-lg border-2 border-amber-200">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-red-600">*</span>
                Attestations sur l'honneur (obligatoires)
              </h3>
              
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="attestationMusulman"
                  checked={formData.attestationMusulman}
                  onChange={handleChange}
                  className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  required
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  <span className="text-red-600">*</span> J'atteste être de confession musulmane
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="attestationBesoin"
                  checked={formData.attestationBesoin}
                  onChange={handleChange}
                  className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  required
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  <span className="text-red-600">*</span> J'atteste être une personne dans le besoin et être dans la nécessité de recevoir la Zakat al-Fitr
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="attestationVeracite"
                  checked={formData.attestationVeracite}
                  onChange={handleChange}
                  className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  required
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  <span className="text-red-600">*</span> Je confirme que les informations fournies ne sont pas mensongères
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="attestationIleDeFrance"
                  checked={formData.attestationIleDeFrance}
                  onChange={handleChange}
                  className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  required
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  <span className="text-red-600">*</span> J'atteste vivre en Île-de-France
                </span>
              </label>
            </div>


            {/* Message de statut d'ERREUR (gardé uniquement pour l'erreur) */}
            {status.message && status.type === 'error' && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border-2 border-red-200">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">
                  {status.message}
                </p>
              </div>
            )}

            {/* Bouton Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading || showSuccessModal} // Désactiver pendant le chargement ET si la modale est affichée
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer mon inscription'
              )}
            </button>
          </div>

          {/* Note en bas */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ <strong>Important:</strong> Votre inscription sera vérifiée par nos équipes. 
              Vous recevrez un email de confirmation avec le jour et l'horaire précis de livraison.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600 text-sm">
          <p>Des questions ? Contactez-nous à la mosquée</p>
        </div>
      </div>
    </div>
  );
}