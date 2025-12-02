'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      console.log('📧 Envoi email de réinitialisation à:', email);
      
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false
      });

      console.log('✅ Email envoyé avec succès');
      setSuccess(true);
      setEmail('');

    } catch (error) {
      console.error('❌ Erreur:', error);

      let errorMessage = '';
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = '❌ Adresse email invalide';
          break;
        case 'auth/user-not-found':
          errorMessage = '❌ Aucun compte trouvé avec cet email';
          break;
        case 'auth/too-many-requests':
          errorMessage = '❌ Trop de tentatives. Réessayez plus tard.';
          break;
        default:
          errorMessage = '❌ Erreur lors de l\'envoi de l\'email';
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
            <Mail className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Mot de passe oublié ?
          </h1>
          <p className="text-gray-600">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          
          {/* Message de succès */}
          {success && (
            <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-green-800 font-semibold mb-1">
                    ✅ Email envoyé avec succès !
                  </p>
                  <p className="text-xs text-green-700">
                    Vérifiez votre boîte email et cliquez sur le lien pour réinitialiser votre mot de passe.
                    Si vous ne voyez pas l'email, vérifiez vos spams.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
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
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none transition"
                disabled={loading}
              />
            </div>

            {/* Bouton d'envoi */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Envoyer le lien
                </>
              )}
            </button>
          </form>

          {/* Bouton retour */}
          <div className="mt-6">
            <button
              onClick={() => router.push('/login')}
              className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 font-medium py-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </button>
          </div>
        </div>

        {/* Informations */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-800">
            💡 <strong>Important :</strong><br />
            Le lien de réinitialisation est valable pendant 1 heure.
            Si vous ne recevez pas l'email, vérifiez vos spams ou contactez l'administrateur.
          </p>
        </div>
      </div>
    </div>
  );
}