'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🔐 TENTATIVE DE CONNEXION');
    console.log('Email:', formData.email);

    try {
      // ÉTAPE 1 : Connexion Firebase Auth
      console.log('📧 Connexion à Firebase Auth...');
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;
      console.log('✅ Authentification réussie - UID:', user.uid);

      // ÉTAPE 2 : Récupérer le rôle depuis Firestore
      console.log('📄 Récupération du document utilisateur...');
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error('Document utilisateur introuvable. Contactez le support.');
      }

      const userData = userDocSnap.data();
      console.log('✅ Document trouvé:', {
        role: userData.role,
        email: userData.email,
        mosquees: userData.mosquees
      });

      // ÉTAPE 3 : Redirection selon le rôle
      console.log('🚀 Redirection selon le rôle:', userData.role);
      
      if (userData.role === 'super_admin') {
        console.log('➡️ Redirection vers /super-admin');
        router.push('/super-admin');
      } else if (userData.role === 'admin_mosquee') {
        console.log('➡️ Redirection vers /admin');
        router.push('/admin');
      } else {
        throw new Error('Rôle non reconnu : ' + userData.role);
      }

    } catch (error) {
      console.error('❌ ERREUR DE CONNEXION:', error);

      let errorMessage = '';

      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = '❌ Adresse email invalide';
          break;
        case 'auth/user-disabled':
          errorMessage = '❌ Ce compte a été désactivé';
          break;
        case 'auth/user-not-found':
          errorMessage = '❌ Aucun compte trouvé avec cet email';
          break;
        case 'auth/wrong-password':
          errorMessage = '❌ Mot de passe incorrect';
          break;
        case 'auth/invalid-credential':
          errorMessage = '❌ Email ou mot de passe incorrect';
          break;
        case 'auth/too-many-requests':
          errorMessage = '❌ Trop de tentatives. Réessayez plus tard.';
          break;
        default:
          errorMessage = error.message || '❌ Erreur de connexion';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-4">
            <LogIn className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🕌 Connexion
          </h1>
          <p className="text-gray-600">
            Accédez à votre espace d'administration
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Adresse Email
                </span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="votre@email.com"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none transition"
                disabled={loading}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Mot de Passe
                </span>
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none transition"
                disabled={loading}
              />
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Se Connecter
                </>
              )}
            </button>
          </form>

          {/* Lien mot de passe oublié */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push('/reset-password')}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Mot de passe oublié ?
            </button>
          </div>
        </div>

        {/* Informations de test */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-800 text-center">
            💡 <strong>Pour tester :</strong><br />
            Super Admin : utilisez les identifiants créés lors de l'installation<br />
            Admin Mosquée : utilisez les identifiants fournis lors de la création
          </p>
        </div>
      </div>
    </div>
  );
}