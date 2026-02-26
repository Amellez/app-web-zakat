/**
 * Service de géolocalisation utilisant l'API Adresse française (data.gouv.fr)
 * Plus fiable pour les adresses françaises
 * 
 * 🔥 OPTIMISÉ : Gestion du rate limiting, retry automatique, traitement par batches
 */

const API_ADRESSE_URL = 'https://api-adresse.data.gouv.fr/search';

// ⚙️ Configuration du rate limiting
const CONFIG = {
  DELAY_BETWEEN_REQUESTS: 500,  // 500ms entre chaque requête (2 req/sec max)
  DELAY_BETWEEN_BATCHES: 5000,   // 5 secondes entre chaque lot
  BATCH_SIZE: 20,                 // Traiter par lots de 20
  MAX_RETRIES: 3,                 // 3 tentatives max par adresse
  RETRY_DELAY_BASE: 1000          // Délai de base pour retry (1s, 2s, 3s)
};

/**
 * Attendre un certain délai
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 🔥 NOUVEAU : Géolocalise une adresse avec retry automatique
 * @param {string} adresse - Adresse complète
 * @param {number} maxRetries - Nombre max de tentatives
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
async function geocodeAdresseAvecRetry(adresse, maxRetries = CONFIG.MAX_RETRIES) {
  if (!adresse || adresse.trim() === '') {
    console.warn('⚠️ Adresse vide, impossible de géolocaliser');
    return null;
  }

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const params = new URLSearchParams({
        q: adresse,
        limit: '1'
      });

      const response = await fetch(`${API_ADRESSE_URL}?${params}`, {
        signal: AbortSignal.timeout(10000) // Timeout de 10 secondes
      });

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

      // Aucun résultat trouvé (pas une erreur, on ne retry pas)
      console.warn(`⚠️ Aucun résultat pour: ${adresse}`);
      return null;

    } catch (error) {
      lastError = error;

      // Vérifier si c'est une erreur qui justifie un retry
      const shouldRetry = 
        error.message.includes('504') ||           // Gateway Timeout
        error.message.includes('502') ||           // Bad Gateway
        error.message.includes('503') ||           // Service Unavailable
        error.message.includes('Failed to fetch') || // Erreur réseau
        error.message.includes('timeout');         // Timeout

      if (shouldRetry && attempt < maxRetries) {
        const retryDelay = CONFIG.RETRY_DELAY_BASE * attempt; // Backoff exponentiel
        console.log(`⏳ Tentative ${attempt}/${maxRetries} échouée pour "${adresse.substring(0, 50)}...", retry dans ${retryDelay}ms...`);
        await delay(retryDelay);
        continue;
      }

      // Autre erreur ou max retries atteint
      if (attempt === maxRetries) {
        console.error(`❌ Abandon après ${maxRetries} tentatives pour "${adresse.substring(0, 50)}...": ${error.message}`);
      }
      return null;
    }
  }

  return null;
}

/**
 * Géolocalise une adresse (version simple, sans retry)
 * @param {string} adresse - Adresse complète
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export async function geocodeAdresse(adresse) {
  return await geocodeAdresseAvecRetry(adresse, 1); // 1 seule tentative
}

/**
 * ✅ Géolocalise une seule adresse (pour mosquée)
 */
export async function geocodeAdresseUnique(adresse) {
  return await geocodeAdresseAvecRetry(adresse, 2); // 2 tentatives pour la mosquée
}

/**
 * 🔥 OPTIMISÉ : Géolocalise plusieurs adresses avec rate limiting et retry
 * Traitement par batches pour éviter de surcharger l'API
 * 
 * @param {Array<{id: string, adresse: string}>} adresses
 * @param {Function} onProgress - Callback pour suivre la progression
 * @returns {Promise<Array<{id: string, coords: {lat, lng} | null}>>}
 */
export async function geocodeMultiple(adresses, onProgress = null) {
  const results = [];
  const errors = [];

  console.log(`🌍 Début géolocalisation de ${adresses.length} adresses...`);
  console.log(`⚙️ Configuration: ${CONFIG.BATCH_SIZE} adresses/batch, ${CONFIG.DELAY_BETWEEN_REQUESTS}ms entre requêtes, ${CONFIG.DELAY_BETWEEN_BATCHES}ms entre batches`);

  const totalBatches = Math.ceil(adresses.length / CONFIG.BATCH_SIZE);

  // Traiter par batches
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batchStart = batchIndex * CONFIG.BATCH_SIZE;
    const batchEnd = Math.min(batchStart + CONFIG.BATCH_SIZE, adresses.length);
    const batch = adresses.slice(batchStart, batchEnd);

    console.log(`📦 Batch ${batchIndex + 1}/${totalBatches} (${batch.length} adresses)`);

    // Traiter chaque adresse du batch
    for (let i = 0; i < batch.length; i++) {
      const item = batch[i];
      const globalIndex = batchStart + i;

      // Attendre entre chaque requête (sauf pour la première du batch)
      if (i > 0) {
        await delay(CONFIG.DELAY_BETWEEN_REQUESTS);
      }

      try {
        // Géolocaliser avec retry
        const coords = await geocodeAdresseAvecRetry(item.adresse);

        results.push({
          id: item.id,
          coords
        });

        // Notifier la progression
        if (onProgress) {
          onProgress({
            current: globalIndex + 1,
            total: adresses.length,
            percentage: Math.round(((globalIndex + 1) / adresses.length) * 100),
            address: item.adresse,
            success: !!coords
          });
        }

        const statusIcon = coords ? '✓' : '✗';
        console.log(`${statusIcon} ${globalIndex + 1}/${adresses.length} - ${item.adresse.substring(0, 50)}...`);

        if (!coords) {
          errors.push({
            id: item.id,
            adresse: item.adresse,
            raison: 'Aucun résultat trouvé'
          });
        }

      } catch (error) {
        console.error(`❌ Erreur définitive pour "${item.adresse}":`, error);
        
        results.push({
          id: item.id,
          coords: null
        });

        errors.push({
          id: item.id,
          adresse: item.adresse,
          raison: error.message
        });

        // Notifier l'échec
        if (onProgress) {
          onProgress({
            current: globalIndex + 1,
            total: adresses.length,
            percentage: Math.round(((globalIndex + 1) / adresses.length) * 100),
            address: item.adresse,
            success: false
          });
        }
      }
    }

    // Pause entre les batches (sauf pour le dernier)
    if (batchIndex < totalBatches - 1) {
      const pauseSeconds = CONFIG.DELAY_BETWEEN_BATCHES / 1000;
      console.log(`⏸️ Pause de ${pauseSeconds}s avant le prochain batch...`);
      await delay(CONFIG.DELAY_BETWEEN_BATCHES);
    }
  }

  const succes = results.filter(r => r.coords !== null).length;
  const echecs = results.filter(r => r.coords === null).length;
  
  console.log(`✅ Géolocalisation terminée: ${succes}/${adresses.length} succès (${echecs} échecs)`);
  
  if (errors.length > 0) {
    console.log(`⚠️ ${errors.length} erreurs détectées`);
    // Afficher les 5 premières erreurs pour debug
    errors.slice(0, 5).forEach(err => {
      console.log(`   - ${err.adresse.substring(0, 40)}... : ${err.raison}`);
    });
    if (errors.length > 5) {
      console.log(`   ... et ${errors.length - 5} autres erreurs`);
    }
  }

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