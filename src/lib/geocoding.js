/**
 * Service de géolocalisation utilisant l'API Adresse française (data.gouv.fr)
 * Plus fiable pour les adresses françaises
 */

const API_ADRESSE_URL = 'https://api-adresse.data.gouv.fr/search';
const REQUEST_DELAY = 300; // 300ms entre chaque requête (pas de limite stricte)

/**
 * Attendre un certain délai
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Géolocalise une adresse en coordonnées GPS
 * @param {string} adresse - Adresse complète
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export async function geocodeAdresse(adresse) {
  if (!adresse || adresse.trim() === '') {
    console.warn('⚠️ Adresse vide, impossible de géolocaliser');
    return null;
  }

  try {
    const params = new URLSearchParams({
      q: adresse,
      limit: '1'
    });

    const response = await fetch(`${API_ADRESSE_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.features && data.features.length > 0) {
      const result = data.features[0];
      const coords = result.geometry.coordinates; // [lng, lat]

      return {
        lat: coords[1],
        lng: coords[0]
      };
    }

    console.warn(`⚠️ Aucun résultat trouvé pour: ${adresse}`);
    return null;

  } catch (error) {
    console.error('❌ Erreur géolocalisation:', error);
    return null;
  }
}
/**
 * ✅ NOUVEAU : Géolocalise une seule adresse avec délai (pour mosquée)
 */
export async function geocodeAdresseUnique(adresse) {
  return await geocodeAdresse(adresse);
}

/**
 * Géolocalise plusieurs adresses avec rate limiting
 * @param {Array<{id: string, adresse: string}>} adresses
 * @param {Function} onProgress - Callback pour suivre la progression
 * @returns {Promise<Array<{id: string, coords: {lat, lng} | null}>>}
 */
export async function geocodeMultiple(adresses, onProgress = null) {
  const results = [];

  console.log(`🌍 Début géolocalisation de ${adresses.length} adresses...`);

  for (let i = 0; i < adresses.length; i++) {
    const item = adresses[i];

    // Géolocaliser
    const coords = await geocodeAdresse(item.adresse);

    results.push({
      id: item.id,
      coords
    });

    // Notifier la progression
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: adresses.length,
        percentage: Math.round(((i + 1) / adresses.length) * 100)
      });
    }

    console.log(`✅ ${i + 1}/${adresses.length} - ${item.adresse}: ${coords ? '✓' : '✗'}`);

    // Attendre avant la prochaine requête (rate limiting léger)
    if (i < adresses.length - 1) {
      await delay(REQUEST_DELAY);
    }
  }

  const succes = results.filter(r => r.coords !== null).length;
  console.log(`✅ Géolocalisation terminée: ${succes}/${adresses.length} succès`);

  return results;
}

/**
 * Calcule la distance entre deux points GPS (en km)
 * Formule de Haversine
 */
export function calculerDistance(coord1, coord2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = deg2rad(coord2.lat - coord1.lat);
  const dLng = deg2rad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(coord1.lat)) * Math.cos(deg2rad(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Trouve le point central d'un groupe de coordonnées
 */
export function calculerCentreGeographique(coords) {
  if (!coords || coords.length === 0) return null;

  let totalLat = 0;
  let totalLng = 0;

  coords.forEach(coord => {
    totalLat += coord.lat;
    totalLng += coord.lng;
  });

  return {
    lat: totalLat / coords.length,
    lng: totalLng / coords.length
  };
}
