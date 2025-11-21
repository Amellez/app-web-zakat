// src/components/admin/ui/MosqueeSelector.jsx
'use client';

import { useMosquee } from '@/context/MosqueeContext';

export default function MosqueeSelector() {
  const { mosqueeActive, setMosqueeActive, mosqueesAccessibles, loading } = useMosquee();

  if (loading || mosqueesAccessibles.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 font-medium">🕌 Mosquée :</span>
      <select
        value={mosqueeActive || ''}
        onChange={(e) => setMosqueeActive(e.target.value)}
        className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none bg-white"
      >
        {mosqueesAccessibles.map(m => (
          <option key={m.id} value={m.id}>
            {m.nom} - {m.ville}
          </option>
        ))}
      </select>
    </div>
  );
}