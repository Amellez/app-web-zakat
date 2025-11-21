'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2, Search, MapPin } from 'lucide-react';
import { collection, addDoc, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams } from 'next/navigation';

export default function InscriptionPage() {
  const params = useParams();
  const mosqueeIdFromUrl = params?.mosqueeId; // ID de la mosquée si venant de l'URL
  
  const [mosquees, setMosquees] = useState([]);
  const [loadingMosquees, setLoadingMosquees] = useState(true);
  const [mosqueeSelectionnee, setMosqueeSelectionnee] = useState(null);
  const [searchMosquee, setSearchMosquee] = useState('');
  const [showMosqueeList, setShowMosqueeList] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState('');
  
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
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const articlesFavoris = [
    { value: 'RIZ', label: 'Riz', emoji: '🍚', description: 'Vous recevrez un supplément de riz dans votre pack' },
    { value: 'PÂTES', label: 'Pâtes', emoji: '🍝', description: 'Vous recevrez un supplément de pâtes dans votre pack' },
    { value: 'COUSCOUS', label: 'Couscous', emoji: '🥘', description: 'Vous recevrez un supplément de couscous dans votre pack' }
  ];

  // Charger les mosquées au démarrage
  useEffect(() => {
    chargerMosquees();
  }, []);

  // Si mosqueeId dans l'URL, charger cette mosquée
  useEffect(() => {
    if (mosqueeIdFromUrl && mosquees.length > 0) {
      const mosquee = mosquees.find(m => m.id === mosqueeIdFromUrl);
      if (mosquee) {
        setMosqueeSelectionnee(mosquee);
      }
    }
  }, [mosqueeIdFromUrl, mosquees]);

  const chargerMosquees = async () => {
    try {
      const q = query(collection(db, 'mosquees'), orderBy('nom'));
      const querySnapshot = await getDocs(q);
      const mosqueesData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(m => m.actif !== false); // Filtrer les mosquées actives
      
      setMosquees(mosqueesData);
      console.log('✅ Mosquées chargées:', mosqueesData.length);
    } catch (error) {
      console.error('Erreur chargement mosquées:', error);
      setError('Impossible de charger la liste des mosquées');
    } finally {
      setLoadingMosquees(false);
      setLoading(false);
    }
  };

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

  const searchAddress = async (query) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);

    try {
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=8`
      );
      const data = await response.json();
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

  const handleAddressChange = (e) => {
    const value = e.target.value;
    handleChange(e);

    if (window.addressTimeout) {
      clearTimeout(window.addressTimeout);
    }

    window.addressTimeout = setTimeout(() => {
      searchAddress(value);
    }, 500);
  };

  const selectAddress = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      adresse: suggestion.formatted,
      adresseCorrigee: ''
    }));
    setAddressSelected(true);
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Validation mosquée
      if (!mosqueeSelectionnee) {
        throw new Error('Veuillez sélectionner une mosquée');
      }

      if (!formData.nom || !formData.articleFavori || !formData.email || !formData.telephone || !formData.adresse || !formData.nbPersonnes) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Veuillez entrer une adresse email valide');
      }

      const telRegex = /^[0-9\s\+\-\(\)]{10,}$/;
      if (!formData.telephone.match(telRegex)) {
        throw new Error('Veuillez entrer un numéro de téléphone valide');
      }

      if (!formData.attestationMusulman || !formData.attestationBesoin ||
          !formData.attestationVeracite || !formData.attestationIleDeFrance) {
        throw new Error('Vous devez cocher toutes les attestations obligatoires');
      }

      const nbPersonnes = parseInt(formData.nbPersonnes);
      if (isNaN(nbPersonnes) || nbPersonnes < 1) {
        throw new Error('Le nombre de personnes doit être supérieur à 0');
      }

      const beneficiaire = {
        mosqueeId: mosqueeSelectionnee.id,
        mosqueeName: mosqueeSelectionnee.nom,
        mosqueeVille: mosqueeSelectionnee.ville,
        nom: formData.nom,
        articleFavori: formData.articleFavori,
        email: formData.email,
        telephone: formData.telephone,
        adresse: formData.adresseCorrigee || formData.adresse,
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

      await addDoc(collection(db, 'beneficiaires'), beneficiaire);

      setShowSuccessModal(true);

      // Réinitialiser le formulaire
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
      // Ne pas réinitialiser la mosquée sélectionnée pour faciliter plusieurs inscriptions

    } catch (error) {
      setError(error.message || 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrer les mosquées selon la recherche
  const mosqueesFilterees = mosquees.filter(m => 
    m.nom.toLowerCase().includes(searchMosquee.toLowerCase()) ||
    m.ville.toLowerCase().includes(searchMosquee.toLowerCase()) ||
    m.codePostal?.includes(searchMosquee)
  );

  const SuccessModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 m-4">
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
              Votre demande a bien été enregistrée auprès de <strong>{mosqueeSelectionnee?.nom}</strong>.
            </p>
            <p className="text-sm text-emerald-700 mt-1">
              Vous recevrez très prochainement un email ou un appel pour confirmer le jour et l'horaire précis de la livraison.
            </p>
          </div>
          <button
            onClick={() => setShowSuccessModal(false)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {showSuccessModal && <SuccessModal />}

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-full text-sm font-bold mb-6 shadow-lg">
            🕌 Inscription Bénéficiaire Zakat al-Fitr
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-4">
            Inscription en Ligne
          </h1>
          <p className="text-lg text-gray-600">
            Remplissez ce formulaire pour vous inscrire et recevoir votre colis alimentaire
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border-2 border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Sélection de la Mosquée */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <span className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  Sélectionnez votre mosquée *
                </span>
              </label>

              {mosqueeSelectionnee ? (
                // Mosquée sélectionnée - affichage
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-emerald-900 text-lg">
                        🕌 {mosqueeSelectionnee.nom}
                      </h3>
                      <p className="text-emerald-700 text-sm mt-1">
                        📍 {mosqueeSelectionnee.ville} ({mosqueeSelectionnee.codePostal})
                      </p>
                      {mosqueeSelectionnee.adresse && (
                        <p className="text-emerald-600 text-xs mt-1">
                          {mosqueeSelectionnee.adresse}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setMosqueeSelectionnee(null)}
                      className="ml-4 px-3 py-1 text-sm bg-white border-2 border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition"
                    >
                      Changer
                    </button>
                  </div>
                </div>
              ) : (
                // Sélecteur de mosquée
                <div className="space-y-3">
                  {/* Barre de recherche */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher par nom, ville ou code postal..."
                      value={searchMosquee}
                      onChange={(e) => {
                        setSearchMosquee(e.target.value);
                        setShowMosqueeList(true);
                      }}
                      onFocus={() => setShowMosqueeList(true)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none transition"
                    />
                  </div>

                  {/* Liste des mosquées */}
                  {showMosqueeList && (
                    <div className="max-h-64 overflow-y-auto border-2 border-gray-200 rounded-lg bg-white">
                      {loadingMosquees ? (
                        <div className="p-4 text-center text-gray-500">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                          Chargement des mosquées...
                        </div>
                      ) : mosqueesFilterees.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          {searchMosquee ? 'Aucune mosquée trouvée' : 'Aucune mosquée disponible'}
                        </div>
                      ) : (
                        mosqueesFilterees.map(mosquee => (
                          <button
                            key={mosquee.id}
                            type="button"
                            onClick={() => {
                              setMosqueeSelectionnee(mosquee);
                              setShowMosqueeList(false);
                              setSearchMosquee('');
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-semibold text-gray-800">
                              🕌 {mosquee.nom}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              📍 {mosquee.ville} ({mosquee.codePostal})
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {!showMosqueeList && mosquees.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowMosqueeList(true)}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-emerald-400 hover:text-emerald-600 transition"
                    >
                      Afficher toutes les mosquées ({mosquees.length})
                    </button>
                  )}
                </div>
              )}
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none transition"
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
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
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
            </div>

            {/* Email et Téléphone */}
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none transition"
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Adresse */}
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none transition"
                autoComplete="off"
                disabled={addressSelected}
              />
              
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border-2 border-emerald-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {addressSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectAddress(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition border-b border-gray-100 last:border-b-0"
                    >
                      <p className="text-sm font-semibold text-gray-800">{suggestion.name}</p>
                      <p className="text-xs text-gray-600 mt-1">{suggestion.postcode} {suggestion.city}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Correction d'adresse */}
            {addressSelected && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-800 mb-1">
                      L'adresse proposée n'est pas correcte ?
                    </p>
                    <p className="text-xs text-blue-700 mb-3">
                      Vous pouvez la corriger dans le champ ci-dessous.
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
                placeholder="Ex: Bâtiment B, 3ème étage, Porte 12"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none transition"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900 focus:border-emerald-500 focus:outline-none transition"
              />
            </div>

            {/* Attestations */}
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
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  <span className="text-red-600">*</span> J'atteste être dans le besoin
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="attestationVeracite"
                  checked={formData.attestationVeracite}
                  onChange={handleChange}
                  className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  <span className="text-red-600">*</span> Je confirme que les informations sont véridiques
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="attestationIleDeFrance"
                  checked={formData.attestationIleDeFrance}
                  onChange={handleChange}
                  className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  <span className="text-red-600">*</span> J'atteste vivre en Île-de-France
                </span>
              </label>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border-2 border-red-200">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Bouton Submit */}
            <button
              type="submit"
              disabled={submitting || showSuccessModal}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer mon inscription'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


