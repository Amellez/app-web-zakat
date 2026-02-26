import React from 'react';

export default function PacksTable({ packs }) {
  // Séparer les packs
  const packsStandard = packs.standard || [];
  const packsSupplements = packs.supplements?.filter(p => p.type !== 'bonus') || [];
  const packBonus = packs.supplements?.find(p => p.type === 'bonus');

  // Récupérer tous les articles uniques pour les colonnes
  const articlesUniques = new Set();
  packsStandard.forEach(pack => {
    pack.composition?.forEach(item => {
      articlesUniques.add(item.produit);
    });
  });
  const colonnesArticles = Array.from(articlesUniques);

  return (
    <div className="space-y-8">
      {/* TABLEAU PACKS STANDARD */}
      {packsStandard.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-800">🏢 PACKS STANDARD</h3>
            <p className="text-sm text-gray-600 mt-1">Distribution 70% + autres articles (100%)</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    TYPE
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    FAMILLES
                  </th>
                  {colonnesArticles.map((article, idx) => (
                    <th key={idx} className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {article}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    TOTAL/PACK
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {packsStandard.map((pack, packIdx) => {
                  const totalParPack = pack.composition?.reduce((sum, item) => {
                    // Convertir en kg si possible (ignorer L)
                    if (item.unite === 'kg') {
                      return sum + (item.quantiteParFamille || 0);
                    }
                    return sum;
                  }, 0) || 0;

                  return (
                    <tr key={packIdx} className={packIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {pack.tailleFamille === 'Petite' && '🏠'} 
                            {pack.tailleFamille === 'Moyenne' && '🏡'} 
                            {pack.tailleFamille === 'Grande' && '🏘️'}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {pack.tailleFamille}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-gray-900">
                        {pack.nombreFamilles}
                      </td>
                      {colonnesArticles.map((article, idx) => {
                        const item = pack.composition?.find(c => c.produit === article);
                        const qte = item?.quantiteParFamille || 0;
                        return (
                          <td key={idx} className="px-6 py-4 text-center">
                            {qte > 0 ? (
                              <span className="font-semibold text-emerald-700">
                                {qte.toFixed(2)} {item?.unite}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 text-center font-bold text-gray-900">
                        {totalParPack.toFixed(2)} kg
                      </td>
                    </tr>
                  );
                })}
                
                {/* Ligne TOTAL */}
                <tr className="bg-emerald-50 border-t-2 border-emerald-200 font-bold">
                  <td className="px-6 py-4 whitespace-nowrap text-emerald-900">
                    💼 TOTAL À PRÉPARER
                  </td>
                  <td className="px-6 py-4 text-center text-emerald-900">
                    {packsStandard.reduce((sum, p) => sum + (p.nombreFamilles || 0), 0)}
                  </td>
                  {colonnesArticles.map((article, idx) => {
                    const total = packsStandard.reduce((sum, pack) => {
                      const item = pack.composition?.find(c => c.produit === article);
                      const qte = item?.quantiteParFamille || 0;
                      return sum + (qte * (pack.nombreFamilles || 0));
                    }, 0);
                    const unite = packsStandard.find(pack => 
                      pack.composition?.find(c => c.produit === article)
                    )?.composition?.find(c => c.produit === article)?.unite || 'kg';
                    
                    return (
                      <td key={idx} className="px-6 py-4 text-center text-emerald-900">
                        {total > 0 ? `${total.toFixed(2)} ${unite}` : '—'}
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 text-center text-emerald-900">
                    {packsStandard.reduce((sum, pack) => {
                      const totalPack = pack.composition?.reduce((s, item) => {
                        if (item.unite === 'kg') {
                          return s + (item.quantiteParFamille || 0);
                        }
                        return s;
                      }, 0) || 0;
                      return sum + (totalPack * (pack.nombreFamilles || 0));
                    }, 0).toFixed(2)} kg
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABLEAU SUPPLÉMENTS */}
      {packsSupplements.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
            <h3 className="text-xl font-bold text-gray-800">🎁 PACKS SUPPLÉMENTS</h3>
            <p className="text-sm text-gray-600 mt-1">30% des articles favoris (RIZ, PÂTES, COUSCOUS)</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-orange-100 border-b border-orange-200">
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    ARTICLE
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    FAMILLES
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    QTÉ/FAMILLE
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    TOTAL À PRÉPARER
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {packsSupplements.map((pack, idx) => {
                  const article = pack.composition?.[0];
                  const qteParFamille = article?.quantiteParFamille || 0;
                  const totalPrep = qteParFamille * (pack.nombreFamilles || 0);
                  
                  const emoji = pack.articleFavori === 'RIZ' ? '🍚' :
                                pack.articleFavori === 'PÂTES' ? '🍝' :
                                pack.articleFavori === 'COUSCOUS' ? '🌾' : '📦';

                  return (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-orange-50/30'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-900">
                          {emoji} {article?.produit || pack.articleFavori}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-gray-900">
                        {pack.nombreFamilles}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-emerald-700">
                        {qteParFamille.toFixed(2)} {article?.unite}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-gray-900">
                        {totalPrep.toFixed(2)} {article?.unite}
                      </td>
                    </tr>
                  );
                })}
                
                {/* Ligne TOTAL */}
                <tr className="bg-orange-100 border-t-2 border-orange-300 font-bold">
                  <td className="px-6 py-4 whitespace-nowrap text-orange-900">
                    💼 TOTAL
                  </td>
                  <td className="px-6 py-4 text-center text-orange-900">
                    {packsSupplements.reduce((sum, p) => sum + (p.nombreFamilles || 0), 0)}
                  </td>
                  <td className="px-6 py-4 text-center text-orange-900">
                    —
                  </td>
                  <td className="px-6 py-4 text-center text-orange-900">
                    {packsSupplements.reduce((sum, pack) => {
                      const article = pack.composition?.[0];
                      const qteParFamille = article?.quantiteParFamille || 0;
                      return sum + (qteParFamille * (pack.nombreFamilles || 0));
                    }, 0).toFixed(2)} kg
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABLEAU PACK BONUS */}
      {packBonus && packBonus.composition?.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-yellow-300 overflow-hidden">
          <div className="bg-yellow-50 px-6 py-4 border-b border-yellow-200">
            <h3 className="text-xl font-bold text-gray-800">💰 PACK BONUS</h3>
            <p className="text-sm text-gray-600 mt-1">{packBonus.note || 'Restes à distribuer'}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-yellow-100 border-b border-yellow-200">
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    ARTICLE
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    QUANTITÉ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    NOTE
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {packBonus.composition.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-yellow-50/30'}>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                      📦 {item.produit}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-yellow-700">
                      {(item.quantite || 0).toFixed(2)} {item.unite}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Redistribuer en priorité
                    </td>
                  </tr>
                ))}
                
                {/* Ligne TOTAL */}
                <tr className="bg-yellow-100 border-t-2 border-yellow-300 font-bold">
                  <td className="px-6 py-4 whitespace-nowrap text-yellow-900">
                    💼 TOTAL
                  </td>
                  <td className="px-6 py-4 text-center text-yellow-900">
                    {(packBonus.quantiteTotale || 0).toFixed(2)} kg
                  </td>
                  <td className="px-6 py-4 text-yellow-900">
                    —
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}