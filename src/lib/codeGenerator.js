/**
 * Génère un code unique pour un itinéraire
 * Format: ITI-XXXYYY où XXX = 3 lettres, YYY = 3 chiffres
 * Exemple: ITI-ABC123
 */
export function genererCodeUnique() {
  const lettres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const chiffres = '0123456789';

  let code = 'ITI-';

  // 3 lettres aléatoires
  for (let i = 0; i < 3; i++) {
    code += lettres.charAt(Math.floor(Math.random() * lettres.length));
  }

  // 3 chiffres aléatoires
  for (let i = 0; i < 3; i++) {
    code += chiffres.charAt(Math.floor(Math.random() * chiffres.length));
  }

  return code;
}

/**
 * Vérifie si un code est valide (format)
 */
export function validerFormatCode(code) {
  const regex = /^ITI-[A-Z]{3}[0-9]{3}$/;
  return regex.test(code);
}

/**
 * Génère un code unique non utilisé
 * @param {Array} codesExistants - Liste des codes déjà utilisés
 */
export function genererCodeUniqueNonUtilise(codesExistants = []) {
  let code;
  let tentatives = 0;
  const maxTentatives = 100;

  do {
    code = genererCodeUnique();
    tentatives++;

    if (tentatives >= maxTentatives) {
      throw new Error('Impossible de générer un code unique après 100 tentatives');
    }
  } while (codesExistants.includes(code));

  return code;
}
