const fs = require('fs');
const filePath = 'src/app/components/documentos-controlados/documentos-controlados.component.ts';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Update extraerProcesoDelCodigo candidateParts priority
const oldCandidateBlock = `    const candidateParts = parts.length > 1 ? parts.slice(1) : [];
    if (parts.length >= 3 && mapSubProcesos[parts[2]]) {
      return mapSubProcesos[parts[2]];
    }
    if (parts.length >= 2 && mapSubProcesos[parts[1]]) {
      return mapSubProcesos[parts[1]];
    }
    if (parts.length >= 2 && mapMacros[parts[1]]) {
      return mapMacros[parts[1]];
    }
    for (const part of candidateParts) {
      if (mapSubProcesos[part]) return mapSubProcesos[part];
    }
    for (const part of candidateParts) {
      if (mapMacros[part]) return mapMacros[part];
    }
    return '';`;

const newCandidateBlock = `    const candidateParts = parts.length > 1 ? parts.slice(1) : [];
    // 1. Prioridad: Verificar si alguna parte coincide exactamente con un Subproceso oficial
    for (const part of candidateParts) {
      if (mapSubProcesos[part]) return mapSubProcesos[part];
    }
    // 2. Si no hay subproceso específico, verificar si alguna parte es un Macroproceso
    for (const part of candidateParts) {
      if (mapMacros[part]) return mapMacros[part];
    }
    return '';`;

if (code.includes(oldCandidateBlock)) {
  code = code.replace(oldCandidateBlock, newCandidateBlock);
  console.log('Successfully updated candidateParts priority in extraerProcesoDelCodigo');
} else {
  console.warn('Could not find oldCandidateBlock');
}

// 2. Update normalizeProcessKey to add specific aliases for OPM subprocesses and IMC
const oldAliases = `    if (s === 'o&m' || s === 'oym' || s === 'om' || s === 'organizacion y metodos') return 'organizacion y metodos';
    if (s === 'sst' || s === 'ssoma' || s === 'seguridad y salud en el trabajo') return 'ssoma';
    if (s === 'costuras' || s === 'costura' || s === 'cos' || s === 'cost') return 'costura';
    if (s.includes('investiga') && s.includes('innova')) return 'investigacion, desarrollo e innovacion';
    if (s === 'idi' || s === 'i+d+i' || s === 'i+d') return 'investigacion, desarrollo e innovacion';`;

const newAliases = `    if (s === 'o&m' || s === 'oym' || s === 'om' || s === 'organizacion y metodos') return 'organizacion y metodos';
    if (s === 'sst' || s === 'ssoma' || s === 'seguridad y salud en el trabajo') return 'ssoma';
    if (s === 'costuras' || s === 'costura' || s === 'cos' || s === 'cost') return 'costura';
    if (s === 'inspeccion' || s === 'inspecciones' || s === 'insp') return 'inspeccion';
    if (s === 'acabados' || s === 'acabado' || s === 'acab') return 'acabados';
    if (s === 'corte' || s === 'cort' || s === 'cor') return 'corte';
    if (s === 'consumos' || s === 'consumo' || s === 'cons') return 'consumos';
    if (s === 'ingenieria' || s === 'ing' || s === 'mejora continua') return 'ingenieria';
    if (s.includes('investiga') && s.includes('innova')) return 'investigacion, desarrollo e innovacion';
    if (s === 'idi' || s === 'i+d+i' || s === 'i+d') return 'investigacion, desarrollo e innovacion';`;

if (code.includes(oldAliases)) {
  code = code.replace(oldAliases, newAliases);
  console.log('Successfully updated normalizeProcessKey aliases');
} else {
  console.warn('Could not find oldAliases');
}

// 3. Update procesarYPersistirLista
const oldProcesarStart = `  procesarYPersistirLista(rawElements: any[]): void {
    let rawList: any[] = [];
    if (rawElements && rawElements.length > 0) {
      rawList = rawElements.map((d: any) => {
        const codDoc = d.codigo_Documento || d.codigo_Documentos_Controlados || d.codigo || 'DOC-' + (d.id || '001');
        let procName = d.nombre_Proceso || d.proceso || (d.codigo_Proceso ? this.getProcessNameByCode(d.codigo_Proceso) : '');
        if (!procName || procName === 'Organización y Métodos') {
          const inferred = this.extraerProcesoDelCodigo(codDoc);
          if (inferred) procName = inferred;
        }
        if (!procName) procName = 'Organización y Métodos';

        const nomDoc = d.denominacion || d.nombre || d.descripcion || 'Documento';
        const fecVenc = d.fec_Vencimiento ? d.fec_Vencimiento.split('T')[0] : (d.fec_Registro ? d.fec_Registro.split('T')[0] : (d.vig || ''));

        return {
          codigo_Documentos_Controlados: d.codigo_Documentos_Controlados || codDoc,
          nombre: nomDoc,
          codigo: codDoc,
          tipo: d.codigo_Normas || d.tipo || 'Procedimiento',
          version: d.version_Documento || d.version || 'v1.0',
          formato: d.codigo_Tipo_Descarga || d.formato || 'PDF',
          proceso: procName,
          vig: fecVenc,
          estado: this.calcularEstadoDinamico(fecVenc, d.flg_Estado || d.estado),
          archivo: d.ruta_Adjunto || d.archivo || codDoc,
          procesos: d.procesos || (d.nombre_Proceso ? [d.nombre_Proceso] : [procName]),
          procesosVisibles: d.procesosVisibles || ['Todos los procesos'],
          modoVisibilidad: d.modoVisibilidad || 'TODOS',
          raw: d
        };
      });
    } else {
      rawList = [...this.defaultDocs];
    }`;

const newProcesarStart = `  procesarYPersistirLista(rawElements: any[]): void {
    let rawList: any[] = [];
    const isApiConnected = rawElements && rawElements.length > 0;

    if (isApiConnected) {
      rawList = rawElements.map((d: any) => {
        const codDoc = (d.codigo_Documento || d.codigo_Documentos_Controlados || d.codigo || 'DOC-' + (d.id || '001')).toString().trim();
        const inferred = this.extraerProcesoDelCodigo(codDoc);
        let procName = inferred || d.nombre_Proceso || d.proceso || (d.codigo_Proceso ? this.getProcessNameByCode(d.codigo_Proceso) : '');
        if (!procName) procName = 'Organización y Métodos';

        const nomDoc = d.denominacion || d.nombre || d.descripcion || 'Documento';
        const fecVenc = d.fec_Vencimiento ? d.fec_Vencimiento.split('T')[0] : (d.fec_Registro ? d.fec_Registro.split('T')[0] : (d.vig || ''));

        return {
          codigo_Documentos_Controlados: d.codigo_Documentos_Controlados || codDoc,
          nombre: nomDoc,
          codigo: codDoc,
          tipo: d.codigo_Normas || d.tipo || 'Procedimiento',
          version: d.version_Documento || d.version || 'v1.0',
          formato: d.codigo_Tipo_Descarga || d.formato || 'PDF',
          proceso: procName,
          vig: fecVenc,
          estado: this.calcularEstadoDinamico(fecVenc, d.flg_Estado || d.estado),
          archivo: d.ruta_Adjunto || d.archivo || codDoc,
          procesos: d.procesos || [procName],
          procesosVisibles: d.procesosVisibles || ['Todos los procesos'],
          modoVisibilidad: d.modoVisibilidad || 'TODOS',
          raw: d
        };
      });
    } else {
      // Fallback sólo si no hay conexión al backend ni datos en API
      const cached = localStorage.getItem('precotex:documentacion');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            rawList = parsed;
          }
        } catch (e) { }
      }
      if (rawList.length === 0) {
        rawList = [...this.defaultDocs];
      }
    }`;

if (code.includes(oldProcesarStart)) {
  code = code.replace(oldProcesarStart, newProcesarStart);
  console.log('Successfully updated start of procesarYPersistirLista');
} else {
  console.warn('Could not find oldProcesarStart');
}

// 4. Replace Step 1 through Step 5 in procesarYPersistirLista
const searchStartMarker = '// 1. Unificar almacenamiento local: precotex_documentos_creados + precotex:documentacion';
const searchEndMarker = 'this.docsList = this.deduplicarDocumentos(rawList);';

const startIndex = code.indexOf(searchStartMarker);
const endIndex = code.indexOf(searchEndMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const replacementMiddle = `// 1. Fusionar únicamente documentos subidos/creados por el usuario localmente
    const localCombined: any[] = [];
    try {
      const localCreatedRaw = localStorage.getItem('precotex_documentos_creados');
      if (localCreatedRaw) {
        const parsed = JSON.parse(localCreatedRaw);
        if (Array.isArray(parsed)) {
          // Filtrar cualquier documento mock antiguo
          const mockCodes = ['pro-cos-001', 'ins-cos-002', 'for-cos-003', 'pro-imc-oym-003', 'ins-imc-oym-002', 'man-imc-oym-001', 'per-imc-oym-004', 'pro-sop-ctp-002', 'pln-aio-001'];
          const cleanUserDocs = parsed.filter((ud: any) => !mockCodes.includes((ud.codigo || '').toLowerCase().trim()));
          localCombined.push(...cleanUserDocs);
        }
      }
    } catch (e) { }

    localCombined.forEach(locDoc => {
      const codeClean = (locDoc.codigo || locDoc.codigo_Documentos_Controlados || '').toString().trim().toLowerCase();
      const nomClean = (locDoc.nombre || locDoc.denominacion || '').toString().trim().toLowerCase();
      const matchIdx = rawList.findIndex((r: any) => {
        const rCode = (r.codigo || r.codigo_Documentos_Controlados || '').toString().trim().toLowerCase();
        const rNom = (r.nombre || r.denominacion || '').toString().trim().toLowerCase();
        return (codeClean !== '' && rCode !== '' && rCode === codeClean) ||
               (nomClean !== '' && rNom !== '' && rNom === nomClean);
      });
      if (matchIdx >= 0) {
        rawList[matchIdx] = {
          ...rawList[matchIdx],
          ...locDoc,
          archivo: locDoc.archivo || rawList[matchIdx].archivo,
          version: locDoc.version || rawList[matchIdx].version
        };
      } else {
        rawList.unshift(locDoc);
      }
    });

    // 2. Filtrar eliminados según papelera/deleted_items
    const deletedKey = 'precotex:docs_deleted_items';
    let deletedItems: string[] = [];
    try {
      deletedItems = JSON.parse(localStorage.getItem(deletedKey) || '[]');
    } catch { deletedItems = []; }
    deletedItems = (deletedItems || []).filter(x => typeof x === 'string' && x.trim() !== '');

    if (deletedItems.length > 0) {
      rawList = rawList.filter((d: any) => {
        const c = (d.codigo || d.codigo_Documentos_Controlados || '').toString().trim();
        const n = (d.nombre || d.denominacion || '').toString().trim();
        const cMatch = c !== '' && deletedItems.includes(c);
        const nMatch = n !== '' && deletedItems.includes(n);
        return !cMatch && !nMatch;
      });
    }

    // 3. Garantía absoluta de asignación canónica según código oficial Precotex
    rawList.forEach((d: any) => {
      const c = (d.codigo || d.codigo_Documentos_Controlados || '').toString().trim().toUpperCase();
      const inferred = this.extraerProcesoDelCodigo(c);
      if (inferred) {
        d.proceso = inferred;
        d.procesos = [inferred];
      } else if (!d.proceso) {
        d.proceso = 'Organización y Métodos';
        d.procesos = ['Organización y Métodos'];
      }
    });

    `;

  code = code.substring(0, startIndex) + replacementMiddle + code.substring(endIndex);
  console.log('Successfully replaced middle of procesarYPersistirLista');
} else {
  console.warn('Could not find middle markers:', startIndex, endIndex);
}

// 5. In onGuardarNuevoDocumento, respect inferred process from code
const oldProcPrincipal = `const procPrincipal = res.procesos && res.procesos.length > 0 ? res.procesos[0] : res.proceso;
        const finalProc = procPrincipal || activeProc || 'Costura';`;

const newProcPrincipal = `const inferredFromCode = this.extraerProcesoDelCodigo(res.codigo);
        const procPrincipal = inferredFromCode || (res.procesos && res.procesos.length > 0 ? res.procesos[0] : res.proceso);
        const finalProc = procPrincipal || activeProc || 'Costura';`;

if (code.includes(oldProcPrincipal)) {
  code = code.replace(oldProcPrincipal, newProcPrincipal);
  console.log('Successfully updated onGuardarNuevoDocumento to respect inferred process');
} else {
  console.warn('Could not find oldProcPrincipal');
}

// 6. In ngOnInit, clean up any mock defaultDocs from localStorage
const oldNgOnInitInit = `  ngOnInit(): void {
    // Cargar permisos finos del usuario
    this.loadFinePermissions();

    this.loadDocs();`;

const newNgOnInitInit = `  ngOnInit(): void {
    // Limpieza preventiva de documentos mock residuales de localStorage
    try {
      const mockCodes = ['pro-cos-001', 'ins-cos-002', 'for-cos-003', 'pro-imc-oym-003', 'ins-imc-oym-002', 'man-imc-oym-001', 'per-imc-oym-004', 'pro-sop-ctp-002', 'pln-aio-001'];
      const locCreatedRaw = localStorage.getItem('precotex_documentos_creados');
      if (locCreatedRaw) {
        const parsed = JSON.parse(locCreatedRaw);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((d: any) => !mockCodes.includes((d.codigo || '').toLowerCase().trim()));
          localStorage.setItem('precotex_documentos_creados', JSON.stringify(cleaned));
        }
      }
    } catch (e) { }

    // Cargar permisos finos del usuario
    this.loadFinePermissions();

    this.loadDocs();`;

if (code.includes(oldNgOnInitInit)) {
  code = code.replace(oldNgOnInitInit, newNgOnInitInit);
  console.log('Successfully updated ngOnInit cleanup');
} else {
  console.warn('Could not find oldNgOnInitInit');
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('All changes written to', filePath);
