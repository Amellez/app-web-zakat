import React, { useState, useEffect } from "react"; // 🔥 useEffect ajouté
import {
  Users,
  Clock,
  Package,
  RefreshCw,
  Loader2,
  PackageX,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  X,
  Trash2,
} from "lucide-react";
import StatCard from "../ui/StatCard";
import SearchAndFilter from "../ui/SearchAndFilter";
import BeneficiaireRow from "./BeneficiaireRow";
import ModalAjouterBeneficiaire from "./ModalAjouterBeneficiaire";
import ModalModifierBeneficiaire from "./ModalModifierBeneficiaire";
import ModalImporterBeneficiaires from "./ModalImporterBeneficiaires";
import {
  getBeneficiaires,
  updateBeneficiaireStatut,
  supprimerBeneficiaire,
} from "@/lib/firebaseAdmin";
import { useMosquee } from "@/context/MosqueeContext";
import { ecouterBeneficiaires } from "@/lib/firebaseAdmin";

export default function BeneficiairesTab({ beneficiaires, setBeneficiaires }) {
  const { mosqueeActive } = useMosquee();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [beneficiaireToEdit, setBeneficiaireToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(false);
  
  // États pour la sélection multiple
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // État pour désactiver le listener pendant l'import
  const [isImporting, setIsImporting] = useState(false);

  // 🔥 AJOUTÉ : Charger automatiquement quand mosqueeActive change
  useEffect(() => {
    if (mosqueeActive) {
      chargerBeneficiaires();
    }
  }, [mosqueeActive]);

  // Charger les bénéficiaires depuis Firebase
  const chargerBeneficiaires = async () => {
    if (!mosqueeActive) {
      console.warn("⚠️ Pas de mosqueeActive, chargement annulé");
      return;
    }

    setLoading(true);
    try {
      const data = await getBeneficiaires(mosqueeActive);
      setBeneficiaires(data);
      console.log(
        `✅ ${data.length} bénéficiaires chargés pour mosquée ${mosqueeActive}`
      );
    } catch (error) {
      console.error("Erreur chargement bénéficiaires:", error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Dans le composant, ajoutez ce useEffect APRÈS celui qui charge les bénéficiaires
  useEffect(() => {
    // 🔥 Ne pas écouter pendant l'import pour éviter les rechargements multiples
    if (!mosqueeActive || isImporting) return;

    // 🔥 Écouter les changements en temps réel
    const unsubscribe = ecouterBeneficiaires((data) => {
      setBeneficiaires(data);
    }, mosqueeActive);

    return () => unsubscribe();
  }, [mosqueeActive, isImporting]); // ← Dépendance isImporting ajoutée

  const filteredBeneficiaires = beneficiaires.filter((b) => {
    const matchesSearch =
      b.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || b.statut === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleValidate = async (id) => {
    try {
      await updateBeneficiaireStatut(id, "Validé");
      setBeneficiaires((prev) =>
        prev.map((b) => (b.id === id ? { ...b, statut: "Validé" } : b))
      );
    } catch (error) {
      console.error("Erreur validation:", error);
      alert("Erreur lors de la validation");
    }
  };

  const handleReject = async (id) => {
    try {
      await updateBeneficiaireStatut(id, "Rejeté");
      setBeneficiaires((prev) =>
        prev.map((b) => (b.id === id ? { ...b, statut: "Rejeté" } : b))
      );
    } catch (error) {
      console.error("Erreur rejet:", error);
      alert("Erreur lors du rejet");
    }
  };

  const handleEdit = (beneficiaire) => {
    setBeneficiaireToEdit(beneficiaire);
    setShowEditForm(true);
  };

  const handleDelete = async (id) => {
    // 🔥 CORRIGÉ : await pour le confirm
    const confirmed = await window.confirm(
      "Êtes-vous sûr de vouloir supprimer ce bénéficiaire ? Cette action est irréversible."
    );

    if (!confirmed) {
      return;
    }

    if (!mosqueeActive) {
      alert("Erreur: Aucune mosquée sélectionnée");
      return;
    }

    try {
      await supprimerBeneficiaire(id, mosqueeActive);
      setBeneficiaires((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      console.error("Erreur suppression:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const handleAddSuccess = () => {
    chargerBeneficiaires();
  };

  const handleEditSuccess = () => {
    chargerBeneficiaires();
  };

  const handleImportSuccess = () => {
    chargerBeneficiaires();
  };

  // Fonctions de sélection multiple
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(selectedId => selectedId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredBeneficiaires.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBeneficiaires.map(b => b.id));
    }
  };

  const handleBulkValidate = async () => {
    if (selectedIds.length === 0) return;
    
    const confirmed = await window.confirm(
      `Êtes-vous sûr de vouloir valider ${selectedIds.length} bénéficiaire(s) ?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      
      // 🔥 Validation en parallèle au lieu de séquentielle
      await Promise.all(
        selectedIds.map(id => updateBeneficiaireStatut(id, "Validé"))
      );
      
      // Le listener va automatiquement recharger
      setSelectedIds([]);
      alert(`✅ ${selectedIds.length} bénéficiaire(s) validé(s)`);
    } catch (error) {
      console.error("Erreur validation multiple:", error);
      alert("Erreur lors de la validation multiple");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    
    const confirmed = await window.confirm(
      `Êtes-vous sûr de vouloir rejeter ${selectedIds.length} bénéficiaire(s) ?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      
      // 🔥 Rejet en parallèle au lieu de séquentielle
      await Promise.all(
        selectedIds.map(id => updateBeneficiaireStatut(id, "Rejeté"))
      );
      
      // Le listener va automatiquement recharger
      setSelectedIds([]);
      alert(`✅ ${selectedIds.length} bénéficiaire(s) rejeté(s)`);
    } catch (error) {
      console.error("Erreur rejet multiple:", error);
      alert("Erreur lors du rejet multiple");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    const confirmed = await window.confirm(
      `⚠️ ATTENTION: Êtes-vous sûr de vouloir supprimer ${selectedIds.length} bénéficiaire(s) ?\n\nCette action est IRRÉVERSIBLE.`
    );

    if (!confirmed) return;

    if (!mosqueeActive) {
      alert("Erreur: Aucune mosquée sélectionnée");
      return;
    }

    try {
      setLoading(true);
      
      // 🔥 Suppression en parallèle au lieu de séquentielle
      await Promise.all(
        selectedIds.map(id => supprimerBeneficiaire(id, mosqueeActive))
      );
      
      // Le listener va automatiquement recharger, pas besoin de chargerBeneficiaires()
      setSelectedIds([]);
      alert(`✅ ${selectedIds.length} bénéficiaire(s) supprimé(s)`);
    } catch (error) {
      console.error("Erreur suppression multiple:", error);
      alert("Erreur lors de la suppression multiple");
    } finally {
      setLoading(false);
    }
  };

  // 📥 Export Excel
  const exporterVersExcel = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Gestion Zakat';
      workbook.created = new Date();
      
      const worksheet = workbook.addWorksheet('Bénéficiaires', {
        properties: { tabColor: { argb: 'FF10B981' } }
      });

      worksheet.columns = [
        { header: 'N°', key: 'numero', width: 6 },
        { header: 'Nom', key: 'nom', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Téléphone', key: 'telephone', width: 15 },
        { header: 'Adresse', key: 'adresse', width: 50 },
        { header: 'Nb Personnes', key: 'nbPersonnes', width: 12 },
        { header: 'Taille Famille', key: 'tailleFamille', width: 15 },
        { header: 'Article Favori', key: 'articleFavori', width: 15 },
        { header: 'Source', key: 'source', width: 20 },
        { header: 'Statut', key: 'statut', width: 15 },
        { header: 'Pack Standard', key: 'packStandard', width: 14 },
        { header: 'Pack Supplément', key: 'packSupplement', width: 14 },
        { header: 'Date Inscription', key: 'dateInscription', width: 16 },
      ];

      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF10B981' }
      };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(1).height = 25;

      filteredBeneficiaires.forEach((b, index) => {
        const row = worksheet.addRow({
          numero: index + 1,
          nom: b.nom,
          email: b.email,
          telephone: b.telephone,
          adresse: b.adresse,
          nbPersonnes: b.nbPersonnes,
          tailleFamille: b.tailleFamille,
          articleFavori: b.articleFavori || 'Non spécifié',
          source: b.source || 'Formulaire en ligne',
          statut: b.statut,
          packStandard: b.packId ? 'Oui' : 'Non',
          packSupplement: b.packSupplementId ? 'Oui' : 'Non',
          dateInscription: b.createdAt ? new Date(b.createdAt).toLocaleDateString('fr-FR') : '',
        });

        if (index % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' }
          };
        }

        const statutCell = row.getCell('statut');
        if (b.statut === 'Validé') {
          statutCell.font = { color: { argb: 'FF10B981' }, bold: true };
        } else if (b.statut === 'En attente') {
          statutCell.font = { color: { argb: 'FFF59E0B' }, bold: true };
        } else if (b.statut === 'Pack Attribué') {
          statutCell.font = { color: { argb: 'FF3B82F6' }, bold: true };
        } else if (b.statut === 'Rejeté') {
          statutCell.font = { color: { argb: 'FFEF4444' }, bold: true };
        }
      });

      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          };
        });
      });

      const date = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
      const fileName = `beneficiaires_${filterStatus !== 'all' ? filterStatus + '_' : ''}${date}.xlsx`;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);

      console.log(`✅ Export Excel réussi: ${fileName}`);
    } catch (error) {
      console.error('❌ Erreur export Excel:', error);
      alert('Erreur lors de l\'export Excel');
    }
  };

  // Statistiques simplifiées
  const stats = {
    total: beneficiaires.length,
    enAttente: beneficiaires.filter((b) => b.statut === "En attente").length,
    // Bénéficiaires validés SANS pack attribué (en attente d'attribution)
    packsEnAttente: beneficiaires.filter(
      (b) => b.statut === "Validé" && !b.packId && !b.packSupplementId
    ).length,
    // Bénéficiaires avec packs attribués
    packAttribues: beneficiaires.filter(
      (b) => b.statut === "Pack Attribué" || b.packId || b.packSupplementId
    ).length,
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
          subtitle={
            stats.packsEnAttente > 0 ? "Générez les packs" : "Tous attribués"
          }
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
              {stats.packsEnAttente} bénéficiaire
              {stats.packsEnAttente > 1 ? "s" : ""} en attente d'attribution
            </p>
            <p className="text-sm text-orange-700 mt-1">
              Ces bénéficiaires sont validés mais n'ont pas encore de pack.
              Rendez-vous dans l'onglet "Packs" pour générer et attribuer
              automatiquement.
            </p>
          </div>
        </div>
      )}

      {/* En-tête avec boutons actualiser, importer et exporter */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={chargerBeneficiaires}
            disabled={loading || !mosqueeActive}
            className="flex items-center gap-2 px-3 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
          
          <button
            onClick={() => setShowImportForm(true)}
            disabled={!mosqueeActive}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm"
          >
            <Upload className="w-4 h-4" />
            Importer
          </button>

          <button
            onClick={exporterVersExcel}
            disabled={filteredBeneficiaires.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm"
          >
            <Download className="w-4 h-4" />
            Exporter ({filteredBeneficiaires.length})
          </button>
        </div>
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

      {/* Barre d'actions groupées */}
      {selectedIds.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-emerald-300 rounded-lg p-4 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
              {selectedIds.length}
            </div>
            <span className="font-semibold text-gray-800">
              {selectedIds.length} bénéficiaire{selectedIds.length > 1 ? 's' : ''} sélectionné{selectedIds.length > 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleBulkValidate}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Valider
            </button>
            
            <button
              onClick={handleBulkReject}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold disabled:opacity-50 text-sm"
            >
              <XCircle className="w-4 h-4" />
              Rejeter
            </button>
            
            <button
              onClick={handleBulkDelete}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
            
            <button
              onClick={() => setSelectedIds([])}
              className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-sm"
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
          </div>
        </div>
      )}

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
                  <th className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredBeneficiaires.length}
                      onChange={handleSelectAll}
                      className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                      title={selectedIds.length === filteredBeneficiaires.length ? "Tout désélectionner" : "Tout sélectionner"}
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Nom
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Article Favori
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Famille
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Source
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBeneficiaires.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      Aucun bénéficiaire trouvé
                    </td>
                  </tr>
                ) : (
                  filteredBeneficiaires.map((beneficiaire) => (
                    <BeneficiaireRow
                      key={beneficiaire.id}
                      beneficiaire={beneficiaire}
                      onValidate={handleValidate}
                      onReject={handleReject}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isSelected={selectedIds.includes(beneficiaire.id)}
                      onToggleSelect={handleToggleSelect}
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

      {/* Modal d'import */}
      <ModalImporterBeneficiaires
        isOpen={showImportForm}
        onClose={() => setShowImportForm(false)}
        onSuccess={handleImportSuccess}
        setIsImporting={setIsImporting}
      />
    </div>
  );
}