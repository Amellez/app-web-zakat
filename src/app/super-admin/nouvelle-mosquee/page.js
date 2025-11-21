'use client';

import { useState, useCallback, useMemo } from 'react';
import { addDoc, collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Loader2, Building, User, Mail, Phone, Lock, MapPin } from 'lucide-react';

export default function NouvelleMosquee() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nomMosquee: '',
    ville: '',
    adresse: '',
    codePostal: '',
    telephone: '',
    nomAdmin: '',
    prenomAdmin: '',
    emailAdmin: '',
    telephoneAdmin: '',
    motDePasse: ''
  });
  
  // NOUVEAUX ÉTATS POUR L'API ADRESSE
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressInput, setAddressInput] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    
    if (name === 'adresse') {
      setAddressInput(value); // Synchroniser l'input d'adresse
      if (value.length > 3) {
        searchAddress(value);
      } else {
        setAddressSuggestions([]);
      }
    }
  };

  const searchAddress = useCallback(async (query) => {
    try {
      // API Adresse du Gouvernement français
      const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();
      
      if (data.features) {
        setAddressSuggestions(data.features.map(f => ({
          label: f.properties.label,
          city: f.properties.city,
          postcode: f.properties.postcode,
          fullAddress: f.properties.context, // Peut être utilisé pour des infos complètes
        })));
      }
    } catch (err) {
      console.error("Erreur lors de la recherche d'adresse:", err);
      // Gérer l'erreur de l'API si nécessaire
    }
  }, []);

  const handleAddressSelect = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      adresse: suggestion.label,
      ville: suggestion.city,
      codePostal: suggestion.postcode,
    }));
    setAddressInput(suggestion.label); // Mettre à jour l'input pour qu'il corresponde à la sélection
    setAddressSuggestions([]); // Cacher les suggestions
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('='.repeat(60));
    console.log('🚀 DÉBUT CRÉATION MOSQUÉE');
    console.log('='.repeat(60));

    try {
      // VÉRIFICATION AUTH
      console.log('\n🔎 ÉTAPE 0 : Vérification authentification');
      if (!auth.currentUser) {
        throw new Error('Vous devez être connecté pour créer une mosquée');
      }
      console.log('✅ Utilisateur connecté:', {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email
      });

      // VÉRIFICATION ROLE
      console.log('\n🔎 ÉTAPE 0.5 : Vérification du rôle');
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        throw new Error('Document utilisateur introuvable. Contactez le support.');
      }
      
      const userData = userDocSnap.data();
      console.log('✅ Document user trouvé:', {
        role: userData.role,
        mosquees: userData.mosquees
      });

      if (userData.role !== 'super_admin') {
        throw new Error('Seul un super admin peut créer une mosquée');
      }
      console.log('✅ Rôle super_admin confirmé');

      // ÉTAPE 1 : CRÉER LA MOSQUÉE
      console.log('\n📝 ÉTAPE 1 : Création de la mosquée dans Firestore');
      const mosqueeData = {
        nom: formData.nomMosquee,
        ville: formData.ville,
        adresse: formData.adresse,
        codePostal: formData.codePostal,
        telephone: formData.telephone,
        responsable: {
          nom: `${formData.prenomAdmin} ${formData.nomAdmin}`,
          email: formData.emailAdmin,
          telephone: formData.telephoneAdmin
        },
        actif: true,
        createdAt: new Date().toISOString()
      };
      console.log('📦 Données mosquée:', mosqueeData);

      const mosqueeRef = await addDoc(collection(db, 'mosquees'), mosqueeData);
      const mosqueeId = mosqueeRef.id;
      console.log('✅ ÉTAPE 1 RÉUSSIE - Mosquée créée avec ID:', mosqueeId);

      // ÉTAPE 2 : CRÉER LE COMPTE ADMIN
      console.log('\n📝 ÉTAPE 2 : Création du compte Firebase Auth');
      console.log('📧 Email:', formData.emailAdmin);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.emailAdmin,
        formData.motDePasse
      );

      const userId = userCredential.user.uid;
      console.log('✅ ÉTAPE 2 RÉUSSIE - Compte Auth créé avec UID:', userId);

      // ÉTAPE 3 : CRÉER LE DOCUMENT USER
      console.log('\n📝 ÉTAPE 3 : Création du document user dans Firestore');
      const newUserData = {
        email: formData.emailAdmin,
        role: 'admin_mosquee',
        mosquees: [mosqueeId],
        mosqueeActive: mosqueeId,
        nom: `${formData.prenomAdmin} ${formData.nomAdmin}`,
        telephone: formData.telephoneAdmin,
        createdAt: new Date().toISOString()
      };
      console.log('📦 Données user:', newUserData);

      await setDoc(doc(db, 'users', userId), newUserData);
      console.log('✅ ÉTAPE 3 RÉUSSIE - Document user créé');

      // ÉTAPE 4 : CRÉER LES PARAMÈTRES
      console.log('\n⚙️ ÉTAPE 4 : Création des paramètres');
      const parametresData = {
        repartition: {
          standard: 70,
          supplement: 30
        },
        coefficients: {
          Petite: 1,
          Moyenne: 2,
          Grande: 3
        },
        mosqueeId: mosqueeId,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'parametres', mosqueeId), parametresData);
      console.log('✅ ÉTAPE 4 RÉUSSIE - Paramètres créés');

      console.log('\n' + '='.repeat(60));
      console.log('🎉 SUCCÈS TOTAL - MOSQUÉE CRÉÉE !');
      console.log('='.repeat(60));

      alert(`✅ Mosquée "${formData.nomMosquee}" créée avec succès !\n\n` +
            `🆔 ID Mosquée: ${mosqueeId}\n` +
            `📧 Email admin: ${formData.emailAdmin}\n` +
            `🔑 Mot de passe: ${formData.motDePasse}\n\n` +
            `✅ L'administrateur peut maintenant se connecter.\n` +
            `🔗 Lien inscription: /inscription/${mosqueeId}`);

      router.push('/admin');

    } catch (error) {
      console.error('\n' + '='.repeat(60));
      console.error('❌ ERREUR DÉTECTÉE');
      console.error('='.repeat(60));
      console.error('Type:', error.name);
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      console.error('='.repeat(60));

      let errorMessage = '';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = '❌ Cet email est déjà utilisé';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '❌ Le mot de passe doit contenir au moins 6 caractères';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '❌ Email invalide';
      } else if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        errorMessage = '❌ Permission refusée. Vérifiez que vous êtes bien super admin.';
      } else if (error.message?.includes('Missing or insufficient permissions')) {
        errorMessage = '❌ Permissions insuffisantes. Les règles Firestore bloquent l\'accès.';
      } else {
        errorMessage = '❌ ' + error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 py-8">
      <div className="max-w-4xl mx-auto px-6">
        
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Retour</span>
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
            <Building className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🕌 Créer une Nouvelle Mosquée
          </h1>
          <p className="text-gray-600">
            Remplissez les informations pour créer une mosquée et son administrateur
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-red-800 font-semibold">{error}</p>
                <p className="text-xs text-red-700 mt-1">
                  Consultez la console (F12) pour plus de détails
                </p>
              </div>
            </div>
          )}

          {/* Section Mosquée */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-200">
              <Building className="w-6 h-6 text-emerald-600" />
              <h2 className="text-xl font-bold text-gray-800">
                Informations de la Mosquée
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom de la Mosquée *
                </label>
                <input
                  type="text"
                  name="nomMosquee"
                  required
                  value={formData.nomMosquee}
                  onChange={handleChange}
                  placeholder="Ex: Mosquée Al-Nour"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none transition"
                />
              </div>
              
              {/* CHAMP ADRESSE AVEC AUTOCOMPLÉTION */}
              <div className="md:col-span-2 relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Adresse Complète (Recherche) *
                </label>
                <input
                  type="text"
                  name="adresse"
                  required
                  value={addressInput} // Utiliser addressInput pour l'affichage
                  onChange={handleChange}
                  placeholder="Ex: 123 rue de la République"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none transition"
                  autoComplete="off"
                />
                {addressSuggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {addressSuggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        onClick={() => handleAddressSelect(suggestion)}
                        className="p-3 cursor-pointer hover:bg-emerald-50 text-sm border-b border-gray-100"
                      >
                        <span className="font-medium text-gray-800">{suggestion.label}</span>
                        <span className="text-xs text-gray-500 ml-2">({suggestion.postcode} {suggestion.city})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ville * (Rempli automatiquement)
                </label>
                <input
                  type="text"
                  name="ville"
                  required
                  value={formData.ville}
                  onChange={handleChange}
                  placeholder="Ex: Paris"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 focus:border-emerald-500 focus:outline-none transition"
                  readOnly={true} // Rendre le champ lecture seule après autocomplétion
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Code Postal * (Rempli automatiquement)
                </label>
                <input
                  type="text"
                  name="codePostal"
                  required
                  value={formData.codePostal}
                  onChange={handleChange}
                  placeholder="Ex: 75001"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 focus:border-emerald-500 focus:outline-none transition"
                  readOnly={true} // Rendre le champ lecture seule après autocomplétion
                />
              </div>


              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Téléphone de la Mosquée *
                </label>
                <input
                  type="tel"
                  name="telephone"
                  required
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="Ex: 01 23 45 67 89"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Section Admin */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-200">
              <User className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">
                Compte Administrateur
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  name="prenomAdmin"
                  required
                  value={formData.prenomAdmin}
                  onChange={handleChange}
                  placeholder="Ex: Ahmed"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  name="nomAdmin"
                  required
                  value={formData.nomAdmin}
                  onChange={handleChange}
                  placeholder="Ex: Benali"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email *
                </label>
                <input
                  type="email"
                  name="emailAdmin"
                  required
                  value={formData.emailAdmin}
                  onChange={handleChange}
                  placeholder="Ex: admin@mosquee.fr"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Téléphone *
                </label>
                <input
                  type="tel"
                  name="telephoneAdmin"
                  required
                  value={formData.telephoneAdmin}
                  onChange={handleChange}
                  placeholder="Ex: 06 12 34 56 78"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none transition"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Mot de Passe *
                </label>
                <input
                  type="password"
                  name="motDePasse"
                  required
                  minLength={6}
                  value={formData.motDePasse}
                  onChange={handleChange}
                  placeholder="Minimum 6 caractères"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold disabled:opacity-50"
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
                  Création en cours...
                </>
              ) : (
                <>
                  <Building className="w-5 h-5" />
                  Créer la Mosquée
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}