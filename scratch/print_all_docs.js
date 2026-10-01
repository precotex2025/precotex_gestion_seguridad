const data = require('./api_docs.json');
const docs = data.elements;
console.log('Total documents:', docs.length);
docs.forEach((d, i) => {
  console.log((i + 1) + '. ' + d.codigo_Documento + ' | ' + (d.denominacion || '').substring(0, 45) + ' | DB: ' + d.nombre_Proceso + ' (' + d.codigo_Proceso + ')');
});
