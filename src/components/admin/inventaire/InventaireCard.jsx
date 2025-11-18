import React from 'react';
import { Box, Edit, Save, AlertCircle, Trash2 } from 'lucide-react';

export default function InventaireCard({ item, onEdit, onSave, onDelete, editingId, editValue, setEditValue }) {
  const isEditing = editingId === item.id;

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Box className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{item.nom}</h3>
              <p className="text-sm text-gray-500">Seuil: {item.seuil} {item.unite}</p>
            </div>
          </div>
          
          {/* Bouton de suppression */}
          <button
            onClick={() => onDelete(item.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Supprimer l'article"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {isEditing ? (
            <div className="flex gap-2">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="flex-1 px-3 py-2 border-2 border-emerald-500 rounded-lg focus:outline-none"
              />
              <button
                onClick={() => onSave(item.id)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                <Save className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-800">{item.quantite}</p>
                <p className="text-sm text-gray-500">{item.unite} disponibles</p>
              </div>
              <button
                onClick={() => onEdit(item.id, item.quantite)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                <Edit className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Barre de progression */}
          <div className="space-y-1">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  item.quantite > item.seuil * 2 ? 'bg-green-500' :
                  item.quantite > item.seuil ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((item.quantite / (item.seuil * 3)) * 100, 100)}%` }}
              />
            </div>
            {item.quantite <= item.seuil && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Stock faible
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}