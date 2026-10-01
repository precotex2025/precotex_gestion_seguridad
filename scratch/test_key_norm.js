function normalizeProcessKey(p) {
  if (!p) return '';
  let s = p.toString().trim().toLowerCase();
  if (s === 'todos los procesos' || s === '__all__') return '__all__';

  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (s === 'o&m' || s === 'oym' || s === 'om' || s === 'organizacion y metodos') return 'organizacion y metodos';
  if (s === 'sst' || s === 'ssoma' || s === 'seguridad y salud en el trabajo') return 'ssoma';
  if (s === 'costuras' || s === 'costura' || s === 'cos' || s === 'cost') return 'costura';
  if (s === 'inspeccion' || s === 'inspecciones' || s === 'insp') return 'inspeccion';
  if (s === 'acabados' || s === 'acabado' || s === 'acab') return 'acabados';
  if (s === 'corte' || s === 'cort' || s === 'cor') return 'corte';
  if (s === 'consumos' || s === 'consumo' || s === 'cons') return 'consumos';

  if (s === 'calidad estampado y bordado' || s === 'calidad e&b' || s === 'ceb') return 'calidad estampado y bordado';
  if (s === 'estampado' || s === 'est') return 'estampado';
  if (s === 'bordado' || s === 'bord' || s === 'bor') return 'bordado';
  if (s.includes('planeamiento') && (s.includes('estampado') || s.includes('e&b') || s.includes('pceb'))) {
    return 'planeamiento y programacion de la produccion e&b';
  }

  if (s === 'aseguramiento de la calidad manufactura' || s === 'aseguramiento de calidad manufactura' || s === 'calidad manufactura' || s === 'cal') {
    return 'aseguramiento de la calidad manufactura';
  }
  if (s === 'aseguramiento de la calidad textil' || s === 'aseguramiento de calidad textil' || s === 'calidad textil' || s === 'ctx') {
    return 'aseguramiento de la calidad textil';
  }
  if (s === 'laboratorio de calidad textil' || s === 'ltx') return 'laboratorio de calidad textil';

  return s;
}

function matchesProcess(a, b) {
  if (!a || !b) return false;
  if (a === 'Todos los procesos' || b === 'Todos los procesos' || a === '__all__' || b === '__all__') return true;
  const ka = normalizeProcessKey(a);
  const kb = normalizeProcessKey(b);
  if (!ka || !kb) return false;
  if (ka === '__all__' || kb === '__all__') return true;
  return ka === kb;
}

console.log('Inspección vs Costura:', matchesProcess('Inspección', 'Costura')); // must be false
console.log('Inspección vs Inspección:', matchesProcess('Inspección', 'Inspección')); // true
console.log('INSP vs Inspección:', matchesProcess('INSP', 'Inspección')); // true
console.log('Costura vs Costura:', matchesProcess('Costura', 'Costura')); // true
console.log('Aseguramiento de la Calidad Manufactura vs Costura:', matchesProcess('Aseguramiento de la Calidad Manufactura', 'Costura')); // false
console.log('Calidad Estampado y Bordado vs Estampado:', matchesProcess('Calidad Estampado y Bordado', 'Estampado')); // false
console.log('Calidad Estampado y Bordado vs Bordado:', matchesProcess('Calidad Estampado y Bordado', 'Bordado')); // false
