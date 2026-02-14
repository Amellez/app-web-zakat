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
/**
 * Algorithme DBSCAN simplifié pour regrouper les bénéficiaires par proximité
 * @param {Array} beneficiaires - Liste des bénéficiaires avec coords
 * @param {number} rayonKm - Rayon maximum en km (défaut: 3km)
 * @returns {Array<Array>} Tableau de clusters
 */
export function creerClusters(beneficiaires, rayonKm = 3) {
  // Filtrer les bénéficiaires avec coordonnées valides
  const benefsAvecCoords = beneficiaires.filter(b =>
    b.coords && b.coords.lat && b.coords.lng
  );

  if (benefsAvecCoords.length === 0) {
    console.warn('⚠️ Aucun bénéficiaire avec coordonnées valides');
    return [];
  }

  console.log(`🔍 Clustering de ${benefsAvecCoords.length} bénéficiaires (rayon: ${rayonKm}km)`);

  const clusters = [];
  const assigned = new Set(); // Track les bénéficiaires déjà assignés à un cluster

  // Pour chaque bénéficiaire non assigné
  benefsAvecCoords.forEach((point, idx) => {
    if (assigned.has(point.id)) return; // Déjà dans un cluster

    // Trouver tous les voisins dans le rayon (y compris le point lui-même)
    const cluster = [point];
    assigned.add(point.id);

    // Chercher récursivement tous les voisins et leurs voisins
    let i = 0;
    while (i < cluster.length) {
      const current = cluster[i];

      // Trouver les voisins non assignés de ce point
      benefsAvecCoords.forEach(other => {
        if (assigned.has(other.id)) return;

        const distance = calculerDistance(current.coords, other.coords);

        if (distance <= rayonKm) {
          cluster.push(other);
          assigned.add(other.id);
        }
      });

      i++;
    }

    clusters.push(cluster);
  });

  const groupes = clusters.filter(c => c.length > 1).length;
  const individuels = clusters.filter(c => c.length === 1).length;

  console.log(`✅ ${clusters.length} itinéraires créés (${groupes} clusters groupés + ${individuels} itinéraires individuels)`);

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

      // ✅ CORRECTION : Élargir le cluster si le voisin a lui-même des voisins
      if (neighborNeighbors.length > 0) {
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
 * Calcule les statistiques d'un itinéraire avec parcours
 * ✅ MODIFIÉ : Ajoute la distance depuis la mosquée et gère les itinéraires individuels
 * @param {Array} cluster - Liste optimisée de bénéficiaires
 * @param {Object} coordsMosquee - Coordonnées de la mosquée (optionnel)
 */
export function calculerStatistiquesItineraire(cluster, coordsMosquee = null) {
  if (!cluster || cluster.length === 0) {
    return {
      nombreBeneficiaires: 0,
      distanceTotale: 0,
      distanceDepuisMosquee: 0,
      tempsEstime: 0,
      parcours: []
    };
  }

  let distanceTotale = 0;
  let distanceDepuisMosquee = 0;
  const parcours = [];

  // ✅ Calculer la distance mosquée → premier bénéficiaire
  if (coordsMosquee && coordsMosquee.lat && coordsMosquee.lng && cluster[0] && cluster[0].coords) {
    try {
      distanceDepuisMosquee = calculerDistance(coordsMosquee, cluster[0].coords);

       parcours.push({
        de: '🕌 Mosquée',
        vers: cluster[0].nom,
        distance: distanceDepuisMosquee
      });

    } catch (error) {
      console.warn('⚠️ Erreur calcul distance depuis mosquée:', error);
      distanceDepuisMosquee = 0;
    }
  }

  // ✅ Pour un itinéraire individuel (1 seul bénéficiaire)
  // La distance totale = distance depuis la mosquée
  if (cluster.length === 1) {
    distanceTotale = distanceDepuisMosquee;
  } else {
    // Calculer la distance totale entre tous les bénéficiaires
    for (let i = 0; i < cluster.length - 1; i++) {
      try {
        const distance = calculerDistance(
          cluster[i].coords,
          cluster[i + 1].coords
        );
        distanceTotale += distance;

        parcours.push({
          de: cluster[i].nom,
          vers: cluster[i + 1].nom,
          distance: distance
        });
      } catch (error) {
        console.warn(`⚠️ Erreur calcul distance entre bénéficiaires ${i} et ${i+1}:`, error);
      }
    }
    distanceTotale += distanceDepuisMosquee;
  }

  // Estimation du temps (5 min par livraison + temps de trajet)
  const tempsLivraison = cluster.length * 5; // 5 min par bénéficiaire
  const tempsTrajet = (distanceTotale + distanceDepuisMosquee) * 3; // 3 min par km (vitesse moyenne en ville)
  const tempsEstime = Math.round(tempsLivraison + tempsTrajet);

  return {
    nombreBeneficiaires: cluster.length,
    distanceTotale: Math.round(distanceTotale * 1000), // Convertir km en mètres
    distanceDepuisMosquee: Math.round(distanceDepuisMosquee * 1000), // Convertir km en mètres
    tempsEstime, // en minutes
    parcours
  };
}

/**
 * Génère un nom automatique pour un itinéraire
 */
export function genererNomItineraire(cluster, index) {
  if (!cluster || cluster.length === 0) return `Itinéraire ${index + 1}`;

  const premierBenef = cluster[0];
  const adresse = premierBenef.adresse;

  // Si l'adresse contient des virgules, utiliser la dernière partie
  if (adresse.includes(',')) {
    const parts = adresse.split(',');
    return parts[parts.length - 1]?.trim() || `Itinéraire ${index + 1}`;
  }

  // Sinon, extraire les 2 derniers mots (code postal + ville)
  // Ex: "69 Av du Professeur Emile Sergent 78680 Épône" → "Épône"
  const mots = adresse.trim().split(/\s+/); // Split par espaces

  // Si on a au moins 2 mots, prendre le dernier (la ville)
  if (mots.length >= 2) {
    // Vérifier si l'avant-dernier mot est un code postal (5 chiffres)
    const avantDernier = mots[mots.length - 2];
    if (/^\d{5}$/.test(avantDernier)) {
      // C'est bien un code postal, retourner juste la ville (dernier mot)
      return mots[mots.length - 1];
    }
  }

  // Sinon retourner le dernier mot
  return mots[mots.length - 1] || `Itinéraire ${index + 1}`;
}
