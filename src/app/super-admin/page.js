'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  Building, 
  Plus, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  LogOut, 
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mosquees, setMosquees] = useState([]);
  const [stats, setStats] = useState({
    totalMosquees: 0,
    mosqueesActives: 0,
    totalBeneficiaires: 0
  });
  const [error, setError] = useState('');

  useEffect(() => {
    verifierAcces();
  }, []);

  const verifierAcces = async () => {
    try {
      console.log('🔐 Vérification accès super admin...');
      
      // Vérifier si l'utilisateur est connecté
      if (!auth.currentUser) {
        console.log('❌ Pas d\'utilisateur connecté');
        router.push('/login');
        return;
      }

      // Vérifier le rôle
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        console.log('❌ Document utilisateur introuvable');
        router.push('/login');
        return;
      }

      const userData = userDocSnap.data();
      console.log('✅ Utilisateur:', userData);

      if (userData.role !== 'super_admin') {
        console.log('❌ Pas super admin, rôle:', userData.role);
        router.push('/login');
        return;
      }

      console.log('✅ Accès super admin confirmé');
      await chargerDonnees();

    } catch (error) {
      console.error('❌ Erreur vérification accès:', error);
      setError('Erreur de vérification d\'accès');
      router.push('/login');
    }
  };

  const chargerDonnees = async () => {
    try {
      setLoading(true);

      // Charger les mosquées
      const mosqueesQuery = query(collection(db, 'mosquees'), orderBy('nom'));
      const mosqueesSnap = await getDocs(mosqueesQuery);
      const mosqueesData = mosqueesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Charger tous les bénéficiaires pour les stats
      const beneficiairesSnap = await getDocs(collection(db, 'beneficiaires'));
      
      // Calculer les stats
      const totalBeneficiaires = beneficiairesSnap.size;
      const mosqueesActives = mosqueesData.filter(m => m.actif !== false).length;

      setMosquees(mosqueesData);
      setStats({
        totalMosquees: mosqueesData.length,
        mosqueesActives,
        totalBeneficiaires
      });

      console.log('✅ Données chargées:', {
        mosquees: mosqueesData.length,
        beneficiaires: totalBeneficiaires
      });

    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      setError('Erreur de chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const toggleMosqueeStatut = async (mosqueeId, currentStatut) => {
    try {
      const nouveauStatut = !currentStatut;
      const mosqueeRef = doc(db, 'mosquees', mosqueeId);
      await updateDoc(mosqueeRef, {
        actif: nouveauStatut
      });

      // Mettre à jour l'état local
      setMosquees(prev => prev.map(m => 
        m.id === mosqueeId ? { ...m, actif: nouveauStatut } : m
      ));

      // Recalculer les stats
      const mosqueesActives = mosquees.filter(m => 
        m.id === mosqueeId ? nouveauStatut : m.actif !== false
      ).length;

      setStats(prev => ({ ...prev, mosqueesActives }));

      alert(nouveauStatut ? '✅ Mosquée activée' : '⚠️ Mosquée désactivée');
    } catch (error) {
      console.error('❌ Erreur modification statut:', error);
      alert('❌ Erreur lors de la modification du statut');
    }
  };

  const handleLogout = async () => {
    const confirmation = await confirm('Voulez-vous vraiment vous déconnecter ?');
    if (confirmation) {
      try {
        await signOut(auth);
        router.push('/login');
      } catch (error) {
        console.error('❌ Erreur déconnexion:', error);
        alert('❌ Erreur lors de la déconnexion');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      
      {/* Header */}
      <div className="bg-white shadow-md border-b-4 border-emerald-600">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <Building className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Super Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  👤 {auth.currentUser?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-semibold"
            >
              <LogOut className="w-5 h-5" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Mosquées</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalMosquees}</p>
              </div>
              <Building className="w-12 h-12 text-emerald-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Mosquées Actives</p>
                <p className="text-3xl font-bold text-gray-800">{stats.mosqueesActives}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Bénéficiaires</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalBeneficiaires}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Bouton Créer Nouvelle Mosquée */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/super-admin/nouvelle-mosquee')}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Créer une Nouvelle Mosquée
          </button>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Liste des Mosquées */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-emerald-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Building className="w-6 h-6" />
              Liste des Mosquées
            </h2>
          </div>

          {mosquees.length === 0 ? (
            <div className="p-12 text-center">
              <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">Aucune mosquée créée</p>
              <p className="text-sm text-gray-500">
                Cliquez sur "Créer une Nouvelle Mosquée" pour commencer
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {mosquees.map(mosquee => (
                <div key={mosquee.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    
                    {/* Infos Mosquée */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-3 h-3 rounded-full mt-1.5 ${
                          mosquee.actif !== false ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 mb-1">
                            🕌 {mosquee.nom}
                          </h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {mosquee.ville} ({mosquee.codePostal}) - {mosquee.adresse}
                            </p>
                            <p className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {mosquee.telephone}
                            </p>
                            {mosquee.responsable && (
                              <>
                                <p className="flex items-center gap-2">
                                  <Mail className="w-4 h-4" />
                                  {mosquee.responsable.email}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Responsable : {mosquee.responsable.nom}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>📅 Créée le {new Date(mosquee.createdAt).toLocaleDateString('fr-FR')}</span>
                        <span>•</span>
                        <span>🆔 ID: {mosquee.id}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => toggleMosqueeStatut(mosquee.id, mosquee.actif !== false)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition flex items-center gap-2 ${
                          mosquee.actif !== false
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {mosquee.actif !== false ? (
                          <>
                            <XCircle className="w-4 h-4" />
                            Désactiver
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Activer
                          </>
                        )}
                      </button>

                      
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info lien inscription */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Lien d'inscription général :</strong> {window.location.origin}/inscription
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Les bénéficiaires peuvent choisir leur mosquée directement sur ce formulaire
          </p>
        </div>
      </div>
    </div>
  );
}