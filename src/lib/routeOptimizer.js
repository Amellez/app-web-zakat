/**
 * Algorithmes de clustering et optimisation d'itinéraires
 */

import { calculerDistance } from './geocoding';

/**
 * Algorithme DBSCAN pour regrouper les bénéficiaires par proximité
 * @param {Array} beneficiaires - Liste des bénéficiaires avec coords
 * @param {number} rayonKm - Rayon maximum en km (défaut: 3km)
 * @param {number} minPoints - Nombre minimum de points par cluster (défaut: 1)
 * @returns {Array<Array>} Tableau de clusters
 */
export function creerClusters(beneficiaires, rayonKm = 3, minPoints = 1) {
  // Filtrer les bénéficiaires avec coordonnées valides
  const benefsAvecCoords = beneficiaires.filter(b =>
    b.coords && b.coords.lat && b.coords.lng
  );

  if (benefsAvecCoords.length === 0) {
    console.warn('⚠️ Aucun bénéficiaire avec coordonnées valides');
    return [];
  }

  console.log(`🔍 Clustering de ${benefsAvecCoords.length} bénéficiaires (rayon: ${rayonKm}km)`);

  const visited = new Set();
  const clusters = [];
  const noise = [];

  // DBSCAN Algorithm
  benefsAvecCoords.forEach((point, idx) => {
    if (visited.has(idx)) return;

    visited.add(idx);
    const neighbors = getNeighbors(point, benefsAvecCoords, rayonKm);

    if (neighbors.length < minPoints) {
      noise.push(point);
    } else {
      const cluster = [];
      expandCluster(point, neighbors, cluster, visited, benefsAvecCoords, rayonKm, minPoints);
      clusters.push(cluster);
    }
  });

  console.log(`✅ ${clusters.length} clusters créés (${noise.length} points isolés)`);

  return clusters;
}

/**
 * Trouve les voisins dans le rayon donné
 */
function getNeighbors(point, allPoints, rayonKm) {
  const neighbors = [];

  allPoints.forEach((otherPoint, idx) => {
    if (point.id === otherPoint.id) return;

    const distance = calculerDistance(point.coords, otherPoint.coords);

    if (distance <= rayonKm) {
      neighbors.push({ point: otherPoint, index: idx });
    }
  });

  return neighbors;
}

/**
 * Étend le cluster en ajoutant les voisins
 */
function expandCluster(point, neighbors, cluster, visited, allPoints, rayonKm, minPoints) {
  cluster.push(point);

  for (let i = 0; i < neighbors.length; i++) {
    const neighbor = neighbors[i];
    const neighborIdx = neighbor.index;

    if (!visited.has(neighborIdx)) {
      visited.add(neighborIdx);
      const neighborNeighbors = getNeighbors(neighbor.point, allPoints, rayonKm);

      if (neighborNeighbors.length >= minPoints) {
        neighbors.push(...neighborNeighbors);
      }
    }

    // Ajouter au cluster si pas déjà dans un autre
    if (!cluster.some(p => p.id === neighbor.point.id)) {
      cluster.push(neighbor.point);
    }
  }
}

/**
 * Optimise l'ordre de visite dans un cluster (Algorithme du plus proche voisin)
 * @param {Array} cluster - Liste de bénéficiaires
 * @param {Object} pointDepart - Coordonnées de départ (optionnel)
 * @returns {Array} Cluster avec ordre optimisé
 */
export function optimiserOrdreVisite(cluster, pointDepart = null) {
  if (!cluster || cluster.length <= 1) return cluster;

  const nonVisites = [...cluster];
  const itineraireOptimise = [];

  // Déterminer le point de départ
  let current;
  if (pointDepart && pointDepart.lat && pointDepart.lng) {
    // Trouver le bénéficiaire le plus proche du point de départ
    current = trouverPlusProche(pointDepart, nonVisites);
  } else {
    // Commencer par le premier bénéficiaire du cluster
    current = nonVisites[0];
  }

  // Retirer le point de départ
  const idx = nonVisites.findIndex(b => b.id === current.id);
  if (idx !== -1) nonVisites.splice(idx, 1);
  itineraireOptimise.push(current);

  // Algorithme du plus proche voisin
  while (nonVisites.length > 0) {
    const plusProche = trouverPlusProche(current.coords, nonVisites);
    const idx = nonVisites.findIndex(b => b.id === plusProche.id);

    if (idx !== -1) {
      nonVisites.splice(idx, 1);
      itineraireOptimise.push(plusProche);
      current = plusProche;
    } else {
      break;
    }
  }

  return itineraireOptimise;
}

/**
 * Trouve le point le plus proche parmi une liste
 */
function trouverPlusProche(coords, points) {
  let plusProche = points[0];
  let distanceMin = calculerDistance(coords, points[0].coords);

  for (let i = 1; i < points.length; i++) {
    const distance = calculerDistance(coords, points[i].coords);
    if (distance < distanceMin) {
      distanceMin = distance;
      plusProche = points[i];
    }
  }

  return plusProche;
}

/**
 * Calcule les statistiques d'un itinéraire
 */
export function calculerStatistiquesItineraire(cluster) {
  if (!cluster || cluster.length === 0) {
    return {
      nombreBeneficiaires: 0,
      distanceTotale: 0,
      tempsEstime: 0
    };
  }

  let distanceTotale = 0;

  // Calculer la distance totale
  for (let i = 0; i < cluster.length - 1; i++) {
    const distance = calculerDistance(
      cluster[i].coords,
      cluster[i + 1].coords
    );
    distanceTotale += distance;
  }

  // Estimation du temps (10 min par livraison + temps de trajet)
  const tempsLivraison = cluster.length * 10; // 10 min par bénéficiaire
  const tempsTrajet = distanceTotale * 3; // 3 min par km (vitesse moyenne en ville)
  const tempsEstime = Math.round(tempsLivraison + tempsTrajet);

  return {
    nombreBeneficiaires: cluster.length,
    distanceTotale: Math.round(distanceTotale * 10) / 10, // Arrondi à 0.1 km
    tempsEstime // en minutes
  };
}

/**
 * Génère un nom automatique pour un itinéraire
 */
export function genererNomItineraire(cluster, index) {
  if (!cluster || cluster.length === 0) return `Itinéraire ${index + 1}`;

  // Trouver la ville/quartier le plus fréquent
  const adresses = cluster.map(b => b.adresse);
  const villes = adresses.map(a => {
    // Extraire la ville (dernière partie après la virgule)
    const parts = a.split(',');
    return parts[parts.length - 1]?.trim() || '';
  });

  // Compter les occurrences
  const villeFrequente = villes.reduce((acc, ville) => {
    if (!ville) return acc;
    acc[ville] = (acc[ville] || 0) + 1;
    return acc;
  }, {});

  const villePrincipale = Object.keys(villeFrequente).reduce((a, b) =>
    villeFrequente[a] > villeFrequente[b] ? a : b
  , '');

  return villePrincipale
    ? `${villePrincipale} (${cluster.length} bénéf.)`
    : `Itinéraire ${index + 1}`;
}
