'use client';
import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import Modal from '../ui/Modal';
import { assignerItineraireBenevole } from '@/lib/itinerairesService';

export default function ModalAssignerBenevole({ isOpen, onClose, itineraire, onSuccess }) {
  const [formData, setFormData] = useState({
    nom: '',
    telephone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nom.trim()) {
      setError('Le nom du bénévole est requis');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await assignerItineraireBenevole(itineraire.id, formData);

      // Réinitialiser et fermer
      setFormData({ nom: '', telephone: '', email: '' });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erreur assignation:', err);
      setError('Erreur lors de l\'assignation du bénévole');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ nom: '', telephone: '', email: '' });
      setError('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Assigner un Bénévole">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Informations sur l'itinéraire */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">{itineraire?.nom}</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>📍 {itineraire?.statistiques?.nombreBeneficiaires || 0} bénéficiaires</p>
            <p>🚗 {itineraire?.statistiques?.distanceTotale || 0} km</p>
            <p>⏱️ {itineraire?.statistiques?.tempsEstime || 0} minutes estimées</p>
          </div>
        </div>

        {/* Formulaire */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nom du bénévole <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            required
            placeholder="Ex: Ahmed Benali"
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Téléphone
          </label>
          <input
            type="tel"
            name="telephone"
            value={formData.telephone}
            onChange={handleChange}
            placeholder="Ex: 06 12 34 56 78"
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Ex: ahmed@example.com"
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Boutons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold disabled:opacity-50"
          >
            <UserPlus className="w-5 h-5" />
            {loading ? 'Assignation...' : 'Assigner'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
