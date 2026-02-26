import React, { useState } from 'react';
import { Edit, Trash2, Package, Check, X } from 'lucide-react';

export default function InventaireCard({ item, onModification, onDelete, isModified, disabled }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editNom, setEditNom] = useState(item.nom);
  const [editQuantite, setEditQuantite] = useState(item.quantite.toString());

  const handleStartEdit = () => {
    setEditNom(item.nom);
    setEditQuantite(item.quantite.toString());
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditNom(item.nom);
    setEditQuantite(item.quantite.toString());
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!editNom.trim() || !editQuantite || parseFloat(editQuantite) < 0) {
      alert('Veuillez remplir correctement tous les champs');
      return;
    }

    // 🔥 NOUVEAU : Notifier le parent sans sauvegarder dans Firebase
    onModification(item.id, editNom.trim(), editQuantite);
    setIsEditing(false);
  };

  return (
    <div className={`group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 ${
      isModified ? 'border-orange-400 ring-2 ring-orange-200' : 'border-gray-100'
    }`}>
      
      {/* 🔥 NOUVEAU : Badge "Modifié" */}
      {isModified && !isEditing && (
        <div className="absolute top-2 left-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10 animate-pulse">
          ⚠️ Modifié
        </div>
      )}

      {/* Badge unité */}
      <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
        {item.unite}
      </div>

      <div className="p-6">
        
        {/* Header avec icône et nom */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white"></div>
          </div>
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editNom}
                onChange={(e) => setEditNom(e.target.value)}
                className="w-full px-3 py-2 text-lg font-bold border-2 border-emerald-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white"
                placeholder="Nom de l'article"
                disabled={disabled}
              />
            ) : (
              <>
                <h3 className="font-bold text-lg text-gray-800 truncate mb-1">
                  {item.nom}
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Stock disponible
                </p>
              </>
            )}
          </div>
        </div>

        {/* Quantité */}
        {isEditing ? (
          <div className="space-y-3">
            <div className="relative">
              <input
                type="number"
                value={editQuantite}
                onChange={(e) => setEditQuantite(e.target.value)}
                className="w-full px-4 py-3 text-2xl font-bold text-center border-2 border-emerald-400 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-100 bg-white shadow-inner"
                placeholder="Quantité"
                min="0"
                step="0.01"
                disabled={disabled}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={disabled}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Valider
              </button>
              <button
                onClick={handleCancel}
                disabled={disabled}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quantité en grand */}
            <div className={`bg-gradient-to-br rounded-xl p-6 text-center border-2 ${
              isModified 
                ? 'from-orange-50 to-yellow-50 border-orange-200'
                : 'from-emerald-50 to-teal-50 border-emerald-100'
            }`}>
              <div className={`text-5xl font-black bg-gradient-to-r bg-clip-text text-transparent mb-1 ${
                isModified
                  ? 'from-orange-600 to-yellow-600'
                  : 'from-emerald-600 to-teal-600'
              }`}>
                {item.quantite}
              </div>
              <div className={`text-sm font-semibold ${
                isModified ? 'text-orange-700' : 'text-emerald-700'
              }`}>
                {item.unite} en stock
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-2">
              <button
                onClick={handleStartEdit}
                disabled={disabled}
                className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                <Edit className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                Modifier
              </button>
              <button
                onClick={() => onDelete(item.id)}
                disabled={disabled}
                className="px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-md hover:shadow-lg group disabled:opacity-50"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Effet de brillance au survol */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"></div>
    </div>
  );
}