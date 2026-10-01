const data = require('./api_docs.json');
const rawElements = data.elements;

// Simulate deduplicarDocumentos
function deduplicarDocumentos(list) {
  const seenCodes = new Set();
  const seenNames = new Set();
  const dedup = [];

  list.forEach(item => {
    const rawCode = (item.codigo || item.codigo_Documento || item.codigo_Documentos_Controlados || '').toString().trim().toUpperCase();
    const rawNom = (item.nombre || item.denominacion || '').toString().trim().toLowerCase();

    const isCodeDupe = rawCode !== '' && seenCodes.has(rawCode);
    const isNameDupe = rawNom !== '' && seenNames.has(rawNom);

    if (!isCodeDupe && !isNameDupe) {
      if (rawCode !== '') seenCodes.add(rawCode);
      if (rawNom !== '') seenNames.add(rawNom);
      dedup.push(item);
    } else {
      console.log('DUPLICATE DROPPED:', rawCode, '|', rawNom);
    }
  });
  return dedup;
}

const deduped = deduplicarDocumentos(rawElements);
console.log('Remaining after deduplication:', deduped.length);
