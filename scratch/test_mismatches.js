const data = require('./api_docs.json');
const docs = data.elements;

const mapSubProcesos = {
  'SIST': 'Sistemas', 'SIS': 'Sistemas',
  'MANT': 'Mantenimiento General', 'MNT': 'Mantenimiento General',
  'SEGP': 'Seguridad Patrimonial',
  'SSOMA': 'SSOMA', 'SST': 'SSOMA',
  'AUDI': 'Auditoría Interna', 'AUD': 'Auditoría Interna',
  'CPT': 'Control Patrimonial', 'CTP': 'Control Patrimonial',
  'ING': 'Ingeniería', 'MC': 'Ingeniería',
  'OYM': 'Organización y Métodos', 'OM': 'Organización y Métodos',
  'IDI': 'Investigación, Desarrollo e Innovación', 'ID': 'Investigación, Desarrollo e Innovación',
  'CERT': 'Certificaciones',
  'ADMIN': 'Administración', 'ADM': 'Administración',
  'FIN': 'Finanzas', 'CONT': 'Contabilidad y Costos', 'TES': 'Tesorería',
  'AP': 'Administración de Personal', 'CAP': 'Capacitación',
  'COMU': 'Comunicaciones', 'DO': 'Desarrollo Organizacional',
  'GH': 'Gestión Humana', 'BSO': 'Bienestar Social', 'SDP': 'Selección de Personal',
  'EST': 'Estampado', 'BORD': 'Bordado', 'BOR': 'Bordado',
  'CEB': 'Calidad Estampado y Bordado',
  'PCEB': 'Planeamiento y Programación de la Producción E&B',
  'COR': 'Corte', 'COST': 'Costura', 'COS': 'Costura',
  'INSP': 'Inspección', 'ACAB': 'Acabados',
  'CAL': 'Aseguramiento de la Calidad Manufactura',
  'MNF': 'Manufactura', 'CONS': 'Consumos', 'CON': 'Consumos',
  'TEJ': 'Tejeduría', 'TIN': 'Tintorería', 'LDC': 'Laboratorio de Color',
  'EDG': 'Estampado Digital', 'ATX': 'Acabados Textil', 'ACT': 'Acabados Textil',
  'LTX': 'Laboratorio de Calidad Textil', 'CTX': 'Aseguramiento de Calidad Textil',
  'LAV': 'Lavandería', 'BM': 'Balance de Materia',
  'PTX': 'PCP Textil', 'PMA': 'PCP Manufactura',
  'ALM': 'Almacén', 'CEXT': 'Comercio Exterior', 'LOG': 'Logística',
  'TRANS': 'Transporte', 'TRA': 'Transporte',
  'DDP': 'Desarrollo de Producto', 'UDP': 'Desarrollo de Estampado y Bordado', 'DTX': 'Desarrollo Textil',
  'COM': 'Comercial Exportación de Prendas', 'CET': 'Comercial Exportación de Telas', 'CVL': 'Comercial Venta Local Textil',
  'AES': 'Alianzas Estratégicas', 'DDN': 'Desarrollo de Negocios', 'PGE': 'Proyectos Gerenciales',
  'SGG': 'Sistema de Gestión General', 'GGE': 'Gestión Estratégica'
};

const mapMacros = {
  'SOP': 'Sistemas', 'AIO': 'Auditoría Interna', 'CPT': 'Control Patrimonial',
  'IMC': 'Organización y Métodos', 'AFC': 'Administración', 'GGHH': 'Gestión Humana',
  'RRHH': 'Gestión Humana', 'SEB': 'Estampado', 'OPM': 'Costura', 'OPT': 'Acabados Textil',
  'PCP': 'PCP Manufactura', 'GCOM': 'Desarrollo de Producto', 'GG': 'Sistema de Gestión General'
};

function extraer(code) {
  if (!code) return '';
  const parts = code.trim().toUpperCase().split('-');
  const candidateParts = parts.length > 1 ? parts.slice(1) : [];
  if (parts.length >= 3 && mapSubProcesos[parts[2]]) return mapSubProcesos[parts[2]];
  if (parts.length >= 2 && mapSubProcesos[parts[1]]) return mapSubProcesos[parts[1]];
  if (parts.length >= 2 && mapMacros[parts[1]]) return mapMacros[parts[1]];
  for (const p of candidateParts) if (mapSubProcesos[p]) return mapSubProcesos[p];
  for (const p of candidateParts) if (mapMacros[p]) return mapMacros[p];
  return '';
}

console.log('--- Checking DB docs inference ---');
const mismatches = [];
docs.forEach((d, i) => {
  const code = d.codigo_Documento || '';
  const ext = extraer(code);
  const dbProc = d.nombre_Proceso;
  if (ext && ext !== dbProc) {
    mismatches.push({ i: i+1, code, ext, dbProc, nom: d.denominacion });
  }
});
console.log('Found ' + mismatches.length + ' mismatches:');
mismatches.forEach(m => console.log(m.i + '. ' + m.code + ' -> Extracted: [' + m.ext + '] vs DB: [' + m.dbProc + '] (' + m.nom + ')'));
