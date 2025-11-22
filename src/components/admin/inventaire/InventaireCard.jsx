import React from 'react';
import { Box, Edit, Save, Trash2, Package } from 'lucide-react';

export default function InventaireCard({ item, onEdit, onCancel, onSave, onDelete, editingId, editValue, setEditValue, editName, setEditName }) {
  const isEditing = editingId === item.id;

  return (
    <div className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100">
      
      {/* Badge unité en haut à droite */}
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
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 text-lg font-bold border-2 border-emerald-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-100 bg-white"
                placeholder="Nom de l'article"
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
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full px-4 py-3 text-2xl font-bold text-center border-2 border-emerald-400 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-100 bg-white shadow-inner"
                placeholder="Quantité"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onSave(item.id)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Enregistrer
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quantité en grand */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 text-center border-2 border-emerald-100">
              <div className="text-5xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-1">
                {item.quantite}
              </div>
              <div className="text-sm text-emerald-700 font-semibold">
                {item.unite} en stock
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(item.id, item.quantite, item.nom)}
                className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-semibold shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
              >
                <Edit className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                Modifier
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-md hover:shadow-lg group"
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