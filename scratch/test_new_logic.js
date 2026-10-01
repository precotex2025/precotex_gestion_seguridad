const data = require('./api_docs.json');
const rawElements = data.elements;

const PROCESOS_GROUPS = {
  'Soporte (SOP)': ['Sistemas', 'Mantenimiento General', 'Seguridad Patrimonial', 'SSOMA'],
  'Auditoría Interna (AIO)': ['Auditoría Interna'],
  'Control Patrimonial (CPT)': ['Control Patrimonial'],
  'Ingeniería y Mejora Continua (IMC)': ['Ingeniería', 'Organización y Métodos', 'Investigación, Desarrollo e Innovación', 'Certificaciones'],
  'Administración y Finanzas (AFC)': ['Administración', 'Finanzas', 'Contabilidad y Costos', 'Tesorería'],
  'Gestión Humana (GGHH)': ['Administración de Personal', 'Capacitación', 'Comunicaciones', 'Desarrollo Organizacional', 'Gestión Humana', 'Bienestar Social', 'Selección de Personal'],
  'Servicio de Estampado y Bordado (SEB)': ['Estampado', 'Bordado', 'Calidad Estampado y Bordado', 'Planeamiento y Programación de la Producción E&B'],
  'Operaciones Manufactura (OPM)': ['Corte', 'Costura', 'Inspección', 'Acabados', 'Aseguramiento de la Calidad Manufactura', 'Consumos'],
  'Operaciones Textil (OPT)': ['Tejeduría', 'Tintorería', 'Producción Textil', 'Laboratorio de Color', 'Estampado Digital', 'Acabados Textil', 'Laboratorio de Calidad Textil', 'Aseguramiento de la Calidad Textil', 'Lavandería'],
  'Balance de Materia (BM)': ['Balance de Materia'],
  'Planeamiento y Control de la Producción (PCP)': ['PCP Textil', 'PCP Manufactura', 'PCP Estampado y Bordado'],
  'Logística (LOG)': ['Almacén', 'Comercio Exterior', 'Logística', 'Transporte'],
  'Gestión Comercial (GCOM)': ['Desarrollo de Producto', 'Desarrollo de Estampado y Bordado', 'Desarrollo Textil', 'Comercial Exportación de Prendas', 'Comercial Exportación de Telas', 'Comercial Venta Local Textil'],
  'Gerencia General (GG)': ['Alianzas Estratégicas', 'Desarrollo de Negocios', 'Proyectos Gerenciales', 'Sistema de Gestión General', 'Gestión Estratégica']
};

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

function extraer(code) {
  if (!code) return '';
  const parts = code.trim().toUpperCase().split('-');
  const candidateParts = parts.length > 1 ? parts.slice(1) : [];
  if (parts.length >= 3 && mapSubProcesos[parts[2]]) return mapSubProcesos[parts[2]];
  if (parts.length >= 2 && mapSubProcesos[parts[1]]) return mapSubProcesos[parts[1]];
  for (const p of candidateParts) if (mapSubProcesos[p]) return mapSubProcesos[p];
  return '';
}

function deduplicar(list) {
  const seen = new Set();
  const res = [];
  list.forEach(d => {
    const c = (d.codigo || d.codigo_Documento || '').trim().toLowerCase();
    if (c && !seen.has(c)) {
      seen.add(c);
      res.push(d);
    }
  });
  return res;
}

const rawList = rawElements.map(d => {
  const codDoc = (d.codigo_Documento || d.codigo_Documentos_Controlados || '').trim();
  const inferred = extraer(codDoc);
  const procName = inferred || d.nombre_Proceso || 'Organización y Métodos';
  return {
    codigo: codDoc,
    nombre: d.denominacion,
    proceso: procName
  };
});

const docsList = deduplicar(rawList);
console.log('Total unique docs:', docsList.length);

const macroCounts = {};
for (const [macro, procs] of Object.entries(PROCESOS_GROUPS)) {
  macroCounts[macro] = docsList.filter(d => procs.includes(d.proceso)).length;
}
console.log('Macro counts:', macroCounts);

console.log('\nSubprocess counts for Operaciones Manufactura (OPM):');
PROCESOS_GROUPS['Operaciones Manufactura (OPM)'].forEach(sub => {
  const count = docsList.filter(d => d.proceso === sub).length;
  console.log('  -', sub + ':', count);
});

console.log('\nSubprocess counts for Ingeniería y Mejora Continua (IMC):');
PROCESOS_GROUPS['Ingeniería y Mejora Continua (IMC)'].forEach(sub => {
  const count = docsList.filter(d => d.proceso === sub).length;
  console.log('  -', sub + ':', count);
});
