/**
 * Génère un code numérique simple pour un itinéraire
 * Format: 001, 002, 003, etc.
 * @param {Array} codesExistants - Liste des codes déjà utilisés
 */
export function genererCodeUniqueNonUtilise(codesExistants = []) {
  // Trouver le prochain numéro disponible
  let numero = 1;

  // Convertir tous les codes existants en nombres pour trouver le max
  const numerosExistants = codesExistants
    .map(code => parseInt(code, 10))
    .filter(n => !isNaN(n));

  if (numerosExistants.length > 0) {
    // Prendre le max + 1
    numero = Math.max(...numerosExistants) + 1;
  }

  // Formatter sur 3 chiffres avec des zéros devant
  const code = numero.toString().padStart(3, '0');

  return code;
}

/**
 * Vérifie si un code est valide (format numérique)
 */
export function validerFormatCode(code) {
  const regex = /^[0-9]{3}$/;
  return regex.test(code);
}

/**
 * @deprecated Fonction gardée pour rétrocompatibilité
 * Utiliser genererCodeUniqueNonUtilise directement
 */
export function genererCodeUnique() {
  return genererCodeUniqueNonUtilise();
}
