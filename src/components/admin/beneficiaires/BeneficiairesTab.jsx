import React, { useState } from 'react';
import { Users, Clock, Package, RefreshCw, Loader2, PackageX } from 'lucide-react';
import StatCard from '../ui/StatCard';
import SearchAndFilter from '../ui/SearchAndFilter';
import BeneficiaireRow from './BeneficiaireRow';
import ModalAjouterBeneficiaire from './ModalAjouterBeneficiaire';
import ModalModifierBeneficiaire from './ModalModifierBeneficiaire';
import { getBeneficiaires, updateBeneficiaireStatut, supprimerBeneficiaire } from '@/lib/firebaseAdmin';
import { useMosquee } from '@/context/MosqueeContext'; // 🔥 AJOUTÉ

export default function BeneficiairesTab({ beneficiaires, setBeneficiaires }) {
  const { mosqueeActive } = useMosquee(); // 🔥 AJOUTÉ
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [beneficiaireToEdit, setBeneficiaireToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);

  // Charger les bénéficiaires depuis Firebase
  const chargerBeneficiaires = async () => {
    if (!mosqueeActive) {
      console.warn('⚠️ Pas de mosqueeActive, chargement annulé');
      return;
    }

    setLoading(true);
    try {
      // 🔥 MODIFIÉ : Passer mosqueeActive
      const data = await getBeneficiaires(mosqueeActive);
      setBeneficiaires(data);
      console.log(`✅ ${data.length} bénéficiaires chargés pour mosquée ${mosqueeActive}`);
    } catch (error) {
      console.error('Erreur chargement bénéficiaires:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredBeneficiaires = beneficiaires.filter(b => {
    const matchesSearch = b.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         b.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || b.statut === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleValidate = async (id) => {
    try {
      await updateBeneficiaireStatut(id, 'Validé');
      setBeneficiaires(prev => prev.map(b => 
        b.id === id ? { ...b, statut: 'Validé' } : b
      ));
    } catch (error) {
      console.error('Erreur validation:', error);
      alert('Erreur lors de la validation');
    }
  };

  const handleReject = async (id) => {
    try {
      await updateBeneficiaireStatut(id, 'Rejeté');
      setBeneficiaires(prev => prev.map(b => 
        b.id === id ? { ...b, statut: 'Rejeté' } : b
      ));
    } catch (error) {
      console.error('Erreur rejet:', error);
      alert('Erreur lors du rejet');
    }
  };

  const handleEdit = (beneficiaire) => {
    setBeneficiaireToEdit(beneficiaire);
    setShowEditForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce bénéficiaire ? Cette action est irréversible.')) {
      return;
    }
    
    try {
      await supprimerBeneficiaire(id);
      setBeneficiaires(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleAddSuccess = () => {
    chargerBeneficiaires();
  };

  const handleEditSuccess = () => {
    chargerBeneficiaires();
  };

  // Statistiques simplifiées
  const stats = {
    total: beneficiaires.length,
    enAttente: beneficiaires.filter(b => b.statut === 'En attente').length,
    // Bénéficiaires validés SANS pack attribué (en attente d'attribution)
    packsEnAttente: beneficiaires.filter(b => 
      b.statut === 'Validé' && !b.packId && !b.packSupplementId
    ).length,
    // Bénéficiaires avec packs attribués
    packAttribues: beneficiaires.filter(b => 
      b.statut === 'Pack Attribué' || b.packId || b.packSupplementId
    ).length
  };

  return (
    <div className="space-y-6">
      {/* Statistiques - Tout sur une ligne */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Bénéficiaires" 
          value={stats.total} 
          icon={Users} 
          color="gray" 
        />
        <StatCard 
          title="En Attente de Validation" 
          value={stats.enAttente} 
          icon={Clock} 
          color="yellow" 
        />
        <StatCard 
          title="Packs en Attente d'Attribution" 
          value={stats.packsEnAttente} 
          icon={PackageX} 
          color="orange"
          subtitle={stats.packsEnAttente > 0 ? "Générez les packs" : "Tous attribués"}
        />
        <StatCard 
          title="Packs Attribués" 
          value={stats.packAttribues} 
          icon={Package} 
          color="blue" 
        />
      </div>

      {/* Alerte si des packs sont en attente */}
      {stats.packsEnAttente > 0 && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 flex items-start gap-3">
          <PackageX className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800">
              {stats.packsEnAttente} bénéficiaire{stats.packsEnAttente > 1 ? 's' : ''} en attente d'attribution
            </p>
            <p className="text-sm text-orange-700 mt-1">
              Ces bénéficiaires sont validés mais n'ont pas encore de pack. Rendez-vous dans l'onglet "Packs" pour générer et attribuer automatiquement.
            </p>
          </div>
        </div>
      )}

      {/* En-tête avec bouton actualiser */}
      <div className="flex justify-between items-center">
        <button
          onClick={chargerBeneficiaires}
          disabled={loading || !mosqueeActive}
          className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Filtres et Recherche */}
      <SearchAndFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onAddNew={() => setShowAddForm(true)}
        addButtonText="Ajouter sur place"
      />

      {/* Tableau */}
      {loading && beneficiaires.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nom</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Article Favori</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Famille</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Source</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Statut</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBeneficiaires.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      Aucun bénéficiaire trouvé
                    </td>
                  </tr>
                ) : (
                  filteredBeneficiaires.map(beneficiaire => (
                    <BeneficiaireRow
                      key={beneficiaire.id}
                      beneficiaire={beneficiaire}
                      onValidate={handleValidate}
                      onReject={handleReject}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal d'ajout */}
      <ModalAjouterBeneficiaire
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Modal de modification */}
      <ModalModifierBeneficiaire
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setBeneficiaireToEdit(null);
        }}
        onSuccess={handleEditSuccess}
        beneficiaire={beneficiaireToEdit}
      />
    </div>
  );
}