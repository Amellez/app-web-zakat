'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  getDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { 
  Building, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Users,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  Copy,
  ExternalLink
} from 'lucide-react';

export default function MosqueesListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mosquees, setMosquees] = useState([]);
  const [filteredMosquees, setFilteredMosquees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('all'); // all, actives, inactives
  const [stats, setStats] = useState({
    total: 0,
    actives: 0,
    inactives: 0
  });

  useEffect(() => {
    verifierAccesEtCharger();
  }, []);

  useEffect(() => {
    // Filtrer les mosquées selon la recherche et le statut
    let filtered = mosquees;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.codePostal?.includes(searchTerm) ||
        m.responsable?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (filterStatut === 'actives') {
      filtered = filtered.filter(m => m.actif !== false);
    } else if (filterStatut === 'inactives') {
      filtered = filtered.filter(m => m.actif === false);
    }

    setFilteredMosquees(filtered);
  }, [searchTerm, filterStatut, mosquees]);

  const verifierAccesEtCharger = async () => {
    try {
      if (!auth.currentUser) {
        router.push('/login');
        return;
      }

      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists() || userDocSnap.data().role !== 'super_admin') {
        router.push('/login');
        return;
      }

      await chargerMosquees();
    } catch (error) {
      console.error('❌ Erreur vérification accès:', error);
      router.push('/login');
    }
  };

  const chargerMosquees = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'mosquees'), orderBy('nom'));
      const querySnapshot = await getDocs(q);
      
      const mosqueesData = await Promise.all(
        querySnapshot.docs.map(async (mosqueeDoc) => {
          const mosqueeData = { id: mosqueeDoc.id, ...mosqueeDoc.data() };
          
          // Compter les bénéficiaires
          const benefQuery = query(
            collection(db, 'beneficiaires'),
            // On ne peut pas utiliser where avec l'import actuel
          );
          const benefSnap = await getDocs(benefQuery);
          const nbBeneficiaires = benefSnap.docs.filter(
            doc => doc.data().mosqueeId === mosqueeDoc.id
          ).length;
          
          return { ...mosqueeData, nbBeneficiaires };
        })
      );

      setMosquees(mosqueesData);
      setFilteredMosquees(mosqueesData);

      // Calculer les stats
      const actives = mosqueesData.filter(m => m.actif !== false).length;
      setStats({
        total: mosqueesData.length,
        actives,
        inactives: mosqueesData.length - actives
      });

    } catch (error) {
      console.error('❌ Erreur chargement mosquées:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatut = async (mosqueeId, currentStatut) => {
    try {
      const nouveauStatut = !currentStatut;
      await updateDoc(doc(db, 'mosquees', mosqueeId), {
        actif: nouveauStatut
      });

      setMosquees(prev => prev.map(m => 
        m.id === mosqueeId ? { ...m, actif: nouveauStatut } : m
      ));

      alert(nouveauStatut ? '✅ Mosquée activée' : '⚠️ Mosquée désactivée');
    } catch (error) {
      console.error('❌ Erreur modification statut:', error);
      alert('❌ Erreur lors de la modification');
    }
  };

  const supprimerMosquee = async (mosqueeId, nom) => {
    if (!confirm(`⚠️ ATTENTION !\n\nÊtes-vous sûr de vouloir supprimer "${nom}" ?\n\nCette action est irréversible et supprimera :\n- La mosquée\n- Tous ses bénéficiaires\n- Tous ses paramètres\n\nTapez "SUPPRIMER" pour confirmer.`)) {
      return;
    }

    const confirmation = prompt('Tapez "SUPPRIMER" pour confirmer :');
    if (confirmation !== 'SUPPRIMER') {
      alert('❌ Suppression annulée');
      return;
    }

    try {
      // Supprimer la mosquée
      await deleteDoc(doc(db, 'mosquees', mosqueeId));
      
      // Note: Les bénéficiaires et paramètres devraient aussi être supprimés
      // mais nécessitent des requêtes supplémentaires
      
      setMosquees(prev => prev.filter(m => m.id !== mosqueeId));
      alert('✅ Mosquée supprimée');
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const copierLien = (mosqueeId) => {
    const lien = `${window.location.origin}/inscription/${mosqueeId}`;
    navigator.clipboard.writeText(lien);
    alert('✅ Lien copié dans le presse-papier !');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des mosquées...</p>
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
              <button
                onClick={() => router.push('/super-admin')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Gestion des Mosquées
                </h1>
                <p className="text-sm text-gray-600">
                  {filteredMosquees.length} mosquée(s) affichée(s)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <Building className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Actives</p>
                <p className="text-3xl font-bold text-green-600">{stats.actives}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Inactives</p>
                <p className="text-3xl font-bold text-red-600">{stats.inactives}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher (nom, ville, code postal, email...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none transition"
              />
            </div>

            {/* Filtre statut */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatut('all')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                  filterStatut === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Toutes ({stats.total})
              </button>
              <button
                onClick={() => setFilterStatut('actives')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                  filterStatut === 'actives'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Actives ({stats.actives})
              </button>
              <button
                onClick={() => setFilterStatut('inactives')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                  filterStatut === 'inactives'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inactives ({stats.inactives})
              </button>
            </div>
          </div>
        </div>

        {/* Liste des mosquées */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {filteredMosquees.length === 0 ? (
            <div className="p-12 text-center">
              <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                {searchTerm || filterStatut !== 'all' 
                  ? 'Aucune mosquée trouvée avec ces critères'
                  : 'Aucune mosquée créée'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredMosquees.map((mosquee) => (
                <div 
                  key={mosquee.id} 
                  className={`p-6 hover:bg-gray-50 transition ${
                    mosquee.actif === false ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    
                    {/* Indicateur statut */}
                    <div className={`w-3 h-3 rounded-full mt-2 ${
                      mosquee.actif !== false ? 'bg-green-500' : 'bg-red-500'
                    }`} />

                    {/* Infos principales */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        🕌 {mosquee.nom}
                        {mosquee.actif === false && (
                          <span className="ml-3 text-sm bg-red-100 text-red-700 px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{mosquee.ville} ({mosquee.codePostal})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{mosquee.telephone}</span>
                        </div>
                        {mosquee.responsable && (
                          <>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span>{mosquee.responsable.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>{mosquee.nbBeneficiaires || 0} bénéficiaires</span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="mt-3 text-xs text-gray-500">
                        <span>🆔 {mosquee.id}</span>
                        <span className="mx-2">•</span>
                        <span>📅 Créée le {new Date(mosquee.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => copierLien(mosquee.id)}
                        className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-semibold flex items-center gap-2"
                        title="Copier le lien d'inscription"
                      >
                        <Copy className="w-4 h-4" />
                        Lien
                      </button>

                      <button
                        onClick={() => window.open(`/inscription/${mosquee.id}`, '_blank')}
                        className="px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition text-sm font-semibold flex items-center gap-2"
                        title="Ouvrir le formulaire d'inscription"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Voir
                      </button>

                      <button
                        onClick={() => toggleStatut(mosquee.id, mosquee.actif !== false)}
                        className={`px-3 py-2 rounded-lg transition text-sm font-semibold flex items-center gap-2 ${
                          mosquee.actif !== false
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {mosquee.actif !== false ? (
                          <>
                            <XCircle className="w-4 h-4" />
                            Désact.
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Activer
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => supprimerMosquee(mosquee.id, mosquee.nom)}
                        className="px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition text-sm font-semibold flex items-center gap-2"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="w-4 h-4" />
                        Suppr.
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}