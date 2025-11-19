'use client';
import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';

export default function CarteItineraires({ itineraires }) {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Charger Leaflet dynamiquement côté client uniquement
    if (typeof window === 'undefined') return;

    // Vérifier si déjà chargé
    if (mapInstance.current) return;

    // Fonction pour initialiser la carte
    const initMap = async () => {
      try {
        // Importer Leaflet dynamiquement
        const L = (await import('leaflet')).default;

        // Importer les CSS de Leaflet
        await import('leaflet/dist/leaflet.css');

        // Fix pour les icônes par défaut de Leaflet avec Next.js
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Calculer le centre de la carte
        let centerLat = 48.8566; // Paris par défaut
        let centerLng = 2.3522;
        let zoom = 12;

        if (itineraires.length > 0) {
          const allCoords = itineraires.flatMap(it =>
            it.beneficiaires.map(b => b.coords)
          ).filter(c => c && c.lat && c.lng);

          if (allCoords.length > 0) {
            centerLat = allCoords.reduce((sum, c) => sum + c.lat, 0) / allCoords.length;
            centerLng = allCoords.reduce((sum, c) => sum + c.lng, 0) / allCoords.length;
          }
        }

        // Créer la carte
        const map = L.map(mapContainer.current).setView([centerLat, centerLng], zoom);

        // Ajouter la couche OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);

        // Couleurs pour différencier les itinéraires
        const colors = [
          '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
          '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
        ];

        // Ajouter les marqueurs et les routes pour chaque itinéraire
        itineraires.forEach((itineraire, idx) => {
          const color = colors[idx % colors.length];
          const beneficiaires = itineraire.beneficiaires || [];

          // Créer un groupe pour cet itinéraire
          const group = L.layerGroup().addTo(map);

          // Ajouter les marqueurs
          beneficiaires.forEach((benef, benefIdx) => {
            if (!benef.coords || !benef.coords.lat || !benef.coords.lng) return;

            // Créer une icône numérotée personnalisée
            const customIcon = L.divIcon({
              className: 'custom-marker',
              html: `<div style="
                background-color: ${color};
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 50% 50% 50% 0;
                border: 3px solid white;
                display: flex;
                align-items: center;
                justify-center: center;
                font-weight: bold;
                font-size: 14px;
                box-shadow: 0 3px 6px rgba(0,0,0,0.3);
                transform: rotate(-45deg);
              ">
                <span style="transform: rotate(45deg);">${benefIdx + 1}</span>
              </div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32]
            });

            const marker = L.marker([benef.coords.lat, benef.coords.lng], {
              icon: customIcon
            });

            // Popup avec les informations
            const popupContent = `
              <div style="min-width: 200px;">
                <h3 style="font-weight: bold; margin-bottom: 8px; color: ${color};">
                  #${benefIdx + 1} - ${benef.nom}
                </h3>
                <p style="font-size: 12px; margin: 4px 0;">
                  <strong>Adresse:</strong><br/>${benef.adresse}
                </p>
                ${benef.telephone ? `
                  <p style="font-size: 12px; margin: 4px 0;">
                    <strong>Tél:</strong> ${benef.telephone}
                  </p>
                ` : ''}
                <p style="font-size: 12px; margin: 4px 0;">
                  <strong>Personnes:</strong> ${benef.nbPersonnes || 'N/A'}
                </p>
                <hr style="margin: 8px 0;" />
                <p style="font-size: 11px; color: #666;">
                  <strong>Itinéraire:</strong> ${itineraire.nom}
                </p>
              </div>
            `;

            marker.bindPopup(popupContent);
            marker.addTo(group);
          });

          // Tracer la ligne de l'itinéraire
          const validCoords = beneficiaires
            .filter(b => b.coords && b.coords.lat && b.coords.lng)
            .map(b => [b.coords.lat, b.coords.lng]);

          if (validCoords.length > 1) {
            L.polyline(validCoords, {
              color: color,
              weight: 3,
              opacity: 0.7,
              dashArray: '10, 10'
            }).addTo(group);
          }
        });

        // Ajuster la vue pour montrer tous les marqueurs
        const allMarkers = itineraires.flatMap(it =>
          it.beneficiaires
            .filter(b => b.coords && b.coords.lat && b.coords.lng)
            .map(b => [b.coords.lat, b.coords.lng])
        );

        if (allMarkers.length > 0) {
          const bounds = L.latLngBounds(allMarkers);
          map.fitBounds(bounds, { padding: [50, 50] });
        }

        mapInstance.current = map;

      } catch (err) {
        console.error('Erreur initialisation carte:', err);
        setError('Impossible de charger la carte');
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [itineraires]);

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg border-2 border-red-200 p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Erreur de chargement</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Légende */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-4">
        <h3 className="font-bold text-gray-800 mb-3">Légende</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {itineraires.map((it, idx) => {
            const colors = [
              '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
              '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
            ];
            const color = colors[idx % colors.length];

            return (
              <div key={it.id} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-gray-700 truncate">{it.nom}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Carte */}
      <div
        ref={mapContainer}
        className="w-full h-[600px] rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden"
      />
    </div>
  );
}
