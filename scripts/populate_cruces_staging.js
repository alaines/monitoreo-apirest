const ExcelJS = require('exceljs');
const { execSync } = require('child_process');

// District to Ubigeo ID mapping
const DISTRICT_MAP = {
  'LIMA': '150101',
  'CERCADO': '150101',
  'CERCADO DE LIMA': '150101',
  'CERCADO L': '150101',
  'ANCON': '150102',
  'ATE': '150103',
  'BARRANCO': '150104',
  'BREÑA': '150105',
  'BRENA': '150105',
  'CARABAYLLO': '150106',
  'CHACLACAYO': '150107',
  'CHORRILLOS': '150108',
  'CIENEGUILLA': '150109',
  'COMAS': '150110',
  'EL AGUSTINO': '150111',
  'AGUSTINO': '150111',
  'INDEPENDENCIA': '150112',
  'JESUS MARIA': '150113',
  'LA MOLINA': '150114',
  'MOLINA': '150114',
  'LA VICTORIA': '150115',
  'VICTORIA': '150115',
  'LINCE': '150116',
  'LOS OLIVOS': '150117',
  'OLIVOS': '150117',
  'LURIGANCHO': '150118',
  'CHOSICA': '150118',
  'LURIGANCHO CHOSICA': '150118',
  'LURIGANCHO-CHOSICA': '150118',
  'LURIN': '150119',
  'MAGDALENA DEL MAR': '150120',
  'MAGDALENA': '150120',
  'PUEBLO LIBRE': '150121',
  'MIRAFLORES': '150122',
  'MIRAFLORES L': '150122',
  'PACHACAMAC': '150123',
  'PUCUSANA': '150124',
  'PUENTE PIEDRA': '150125',
  'PUNTA HERMOSA': '150126',
  'PUNTA NEGRA': '150127',
  'RIMAC': '150128',
  'EL RIMAC': '150128',
  'SAN BARTOLO': '150129',
  'SAN BORJA': '150130',
  'SAN ISIDRO': '150131',
  'SAN ISIDRO L': '150131',
  'SAN JUAN DE LURIGANCHO': '150132',
  'SJL': '150132',
  'S.J.L.': '150132',
  'SAN JUAN DE MIRAFLORES': '150133',
  'SJM': '150133',
  'S.J.M.': '150133',
  'SAN LUIS': '150134',
  'SAN MARTIN DE PORRES': '150135',
  'SMP': '150135',
  'S.M.P.': '150135',
  'SAN MIGUEL': '150136',
  'SANTA ANITA': '150137',
  'SANTA MARIA DEL MAR': '150138',
  'SANTA ROSA': '150139',
  'SANTIAGO DE SURCO': '150140',
  'SURCO': '150140',
  'SURQUILLO': '150141',
  'VILLA EL SALVADOR': '150142',
  'VES': '150142',
  'V.E.S.': '150142',
  'VILLA MARIA DEL TRIUNFO': '150143',
  'VMT': '150143',
  'V.M.T.': '150143'
};

function normalizeText(str) {
  if (!str) return '';
  return String(str)
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function resolveUbigeo(distritoStr) {
  if (!distritoStr) return '150101'; // Default Cercado
  const norm = normalizeText(distritoStr);
  if (DISTRICT_MAP[norm]) return DISTRICT_MAP[norm];
  for (const [key, val] of Object.entries(DISTRICT_MAP)) {
    if (norm.includes(key) || key.includes(norm)) return val;
  }
  return '150101';
}

function parseViasFromNombre(nombre) {
  if (!nombre) return { via1: '', via2: '' };
  const clean = nombre.trim();
  const dashIdx = clean.indexOf('-');
  if (dashIdx !== -1) {
    const v1 = clean.substring(0, dashIdx).trim();
    const v2 = clean.substring(dashIdx + 1).trim();
    return { via1: v1, via2: v2 || v1 };
  }
  return { via1: clean, via2: clean };
}

function mapTipoGestion(condicion) {
  const c = normalizeText(condicion);
  if (c.includes('RSNC-SUB')) return 28;
  if (c.includes('RSC-SUB')) return 27;
  if (c.includes('RSNC') || c.includes('AIS')) return 7; // NO CENTRALIZADO
  if (c.includes('RSC') || c.includes('ATU')) return 6; // CENTRALIZADO
  return 6;
}

function mapPlataforma(plataformaStr) {
  const p = normalizeText(plataformaStr);
  if (p.includes('ECOTRAFIX')) return 47;
  if (p.includes('ADIMOT')) return 45;
  if (p.includes('FLEXCENCO')) return 46;
  if (p.includes('ATU') || p.includes('IQ CENTRAL')) return 49;
  if (p.includes('NO CENTRALIZADA') || p.includes('S/C') || p.includes('S/S')) return 48;
  return 47;
}

function mapProyecto(redStr) {
  const r = normalizeText(redStr);
  if (r.includes('AMPLIACION NORTE') || r.includes('AN')) return 17;
  if (r.includes('COSAC') || r.includes('ATU')) return 16;
  if (r.includes('LP15') || r.includes('SICE') || r.includes('CANADA')) return 1;
  if (r.includes('CCGT')) return 14;
  return 14; // Default CCGT
}

async function main() {
  console.log('=== POBLANDO TABLA CRUCES_STAGING ===');

  // 2. Cargar datos de la BD actual (cruces y ejes)
  console.log('2. Cargando cruces y ejes existentes de la BD...');
  const dbCrucesRaw = execSync(
    'docker exec -i monitoreo-db psql -U transito -d protransito -t -A -c "SELECT json_agg(c) FROM (SELECT id, trim(codigo) as codigo, trim(codigo_anterior) as codigo_anterior, trim(nombre) as nombre, via1, via2, ubigeo_id, latitud, longitud, tipo_gestion, administradore_id, proyecto_id, tipo_control, plataforma, electrico_suministro, ano_implementacion FROM cruces ORDER BY id) c;"',
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );
  const dbCruces = JSON.parse(dbCrucesRaw.trim());

  const dbByCodigo = new Map();
  const dbByNombreNorm = new Map();
  const dbByCodAnt = new Map();

  // Calcular max correlativo YYY por distrito XX (desde la BD)
  const maxSeqByDistrict = new Map();

  dbCruces.forEach(c => {
    if (c.codigo) {
      const codeClean = c.codigo.trim().toUpperCase();
      dbByCodigo.set(codeClean, c);
      const match = codeClean.match(/^C(\d{2})(\d{3,4})$/);
      if (match) {
        const xx = match[1];
        const yyy = parseInt(match[2], 10);
        const curr = maxSeqByDistrict.get(xx) || 0;
        if (yyy > curr) maxSeqByDistrict.set(xx, yyy);
      }
    }
    if (c.nombre) {
      dbByNombreNorm.set(normalizeText(c.nombre), c);
    }
    if (c.codigo_anterior) {
      dbByCodAnt.set(normalizeText(c.codigo_anterior), c);
    }
  });

  // 3. Leer Excel backups/cruces-complete.xlsx (hoja BDrs)
  console.log('3. Leyendo Excel backups/cruces-complete.xlsx...');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('./backups/cruces-complete.xlsx');
  const ws = wb.getWorksheet('BDrs');

  const rowsToInsert = [];

  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const hasAny = row.values && row.values.some(v => v !== null && v !== undefined && v !== '');
    if (!hasAny) continue;

    const getVal = (colIdx) => {
      let v = row.getCell(colIdx).value;
      if (typeof v === 'object' && v !== null && 'result' in v) v = v.result;
      if (typeof v === 'string') v = v.trim();
      return v;
    };

    const verificadoRaw = getVal(3);
    const verificado = (verificadoRaw ? String(verificadoRaw).trim().toUpperCase() : '');
    const isVerified = (verificado === 'C');

    const codigoRaw = getVal(4);
    const codigoExcel = (codigoRaw ? String(codigoRaw).trim().toUpperCase() : '');

    const nombreRaw = getVal(5);
    const nombre = (nombreRaw ? String(nombreRaw).trim() : '');
    if (!nombre && !codigoExcel) continue;

    let via1Excel = getVal(6);
    let via2Excel = getVal(7);
    const distritoExcel = getVal(9);
    const codigoAnterior = getVal(10) ? String(getVal(10)).trim() : null;
    const red = getVal(11) ? String(getVal(11)).trim() : null;
    const anoImplRaw = getVal(12);
    const anoImpl = anoImplRaw ? parseInt(anoImplRaw, 10) || null : null;
    const condicion = getVal(13) ? String(getVal(13)).trim() : null;
    const control = getVal(14) ? String(getVal(14)).trim() : null;
    const plataformaTxt = getVal(15) ? String(getVal(15)).trim() : null;
    const suministro = getVal(16) ? String(getVal(16)).trim() : null;
    const latRaw = getVal(18);
    const lngRaw = getVal(19);
    const latitud = latRaw ? parseFloat(latRaw) || null : null;
    const longitud = lngRaw ? parseFloat(lngRaw) || null : null;
    const planoRaw = getVal(20);
    let planoPdf = null;
    if (planoRaw) {
      if (typeof planoRaw === 'object') {
        planoPdf = planoRaw.text || planoRaw.hyperlink || planoRaw.result || null;
      } else {
        planoPdf = String(planoRaw).trim();
      }
    }

    // Resolver Ubigeo y XX
    const ubigeoId = resolveUbigeo(distritoExcel);
    const xx = ubigeoId.substring(4, 6);

    // Parse Vías
    const parsedVias = parseViasFromNombre(nombre);
    const via1Nombre = (via1Excel ? String(via1Excel).trim() : parsedVias.via1) || 'S/N';
    const via2Nombre = (via2Excel ? String(via2Excel).trim() : parsedVias.via2) || via1Nombre;

    // Normalizaciones de Catálogos
    const tipoGestion = mapTipoGestion(condicion);
    const plataforma = mapPlataforma(plataformaTxt);
    const proyectoId = mapProyecto(red);
    const tipoControl = (tipoGestion === 6 ? 32 : 31); // 32=Ordenador, 31=Local

    // Determinar Código Final, Estado y Tipo de Acción
    let codigoFinal = '';
    let estadoCodigo = '';
    let tipoAccion = '';
    let matchedDbId = null;
    let notas = '';

    const isBase = nombre.toUpperCase().includes('BASE');

    if (isBase) {
      tipoAccion = 'BASE';
      estadoCodigo = 'BASE_OPERATIVA';
      codigoFinal = (distritoExcel && normalizeText(distritoExcel) === 'RIMAC') ? 'B28001' : 'B01001';
      notas = 'Base Operativa registrada con prefijo B';
    } else if (isVerified && codigoExcel) {
      codigoFinal = codigoExcel;
      estadoCodigo = 'VERIFICADO_EXCEL';
      // Buscar en BD por código exacto
      if (dbByCodigo.has(codigoFinal)) {
        tipoAccion = 'ACTUALIZAR';
        matchedDbId = dbByCodigo.get(codigoFinal).id;
      } else {
        tipoAccion = 'INSERTAR';
        notas = 'Cruce verificado oficial que se creará como nuevo en BD';
      }
      // Actualizar max correlativo
      const match = codigoFinal.match(/^C(\d{2})(\d{3,4})$/);
      if (match) {
        const cXX = match[1];
        const cYYY = parseInt(match[2], 10);
        const curr = maxSeqByDistrict.get(cXX) || 0;
        if (cYYY > curr) maxSeqByDistrict.set(cXX, cYYY);
      }
    } else {
      // No verificado con C: Comprobar si existe en BD por nombre + mismo ubigeo o código anterior o código tentativo
      const normNom = normalizeText(nombre);
      const normCodAnt = codigoAnterior ? normalizeText(codigoAnterior) : '';

      let matchedDb = null;
      if (codigoExcel && dbByCodigo.has(codigoExcel)) {
        matchedDb = dbByCodigo.get(codigoExcel);
      } else if (normNom && dbByNombreNorm.has(normNom)) {
        const candidate = dbByNombreNorm.get(normNom);
        if (candidate.ubigeo_id === ubigeoId) {
          matchedDb = candidate;
        }
      } else if (normCodAnt && dbByCodAnt.has(normCodAnt)) {
        matchedDb = dbByCodAnt.get(normCodAnt);
      }

      if (matchedDb) {
        matchedDbId = matchedDb.id;
        codigoFinal = matchedDb.codigo || codigoExcel;
        estadoCodigo = 'RECUPERADO_BD';
        tipoAccion = 'ACTUALIZAR';
        notas = `Emparejado con cruce existente ID ${matchedDb.id} en BD`;
      } else {
        // Es un cruce completamente nuevo sin código
        const currMax = maxSeqByDistrict.get(xx) || 0;
        const nextYYY = currMax + 1;
        maxSeqByDistrict.set(xx, nextYYY);

        codigoFinal = `C${xx}${String(nextYYY).padStart(3, '0')}`;
        estadoCodigo = 'NUEVO_GENERADO';
        tipoAccion = 'INSERTAR';
        notas = `Nuevo cruce sin código en Excel. Generado secuencial C${xx}${String(nextYYY).padStart(3, '0')} para distrito ${distritoExcel}`;
      }
    }

    rowsToInsert.push({
      row_excel: r,
      verificado,
      codigo_excel: codigoExcel,
      codigo_final: codigoFinal,
      codigo_anterior: codigoAnterior,
      nombre,
      via1_nombre: via1Nombre,
      via2_nombre: via2Nombre,
      distrito: distritoExcel,
      ubigeo_id: ubigeoId,
      red,
      proyecto_id: proyectoId,
      ano_implementacion: anoImpl,
      condicion,
      tipo_gestion: tipoGestion,
      control,
      tipo_control: tipoControl,
      plataforma_txt: plataformaTxt,
      plataforma,
      electrico_suministro: suministro,
      latitud,
      longitud,
      plano_pdf: planoPdf,
      matched_db_id: matchedDbId,
      tipo_accion: tipoAccion,
      estado_codigo: estadoCodigo,
      notas
    });
  }

  console.log(`4. Filas procesadas listas para staging: ${rowsToInsert.length}`);

  // 5. Generar archivo SQL completo e importar
  const fs = require('fs');
  const sqlStatements = [
    `CREATE TABLE IF NOT EXISTS cruces_staging (
      id SERIAL PRIMARY KEY,
      row_excel INTEGER,
      verificado VARCHAR(10),
      codigo_excel VARCHAR(20),
      codigo_final VARCHAR(20) NOT NULL,
      codigo_anterior VARCHAR(50),
      nombre VARCHAR(255) NOT NULL,
      via1_nombre VARCHAR(255),
      via2_nombre VARCHAR(255),
      via1_id INTEGER,
      via2_id INTEGER,
      distrito VARCHAR(100),
      ubigeo_id VARCHAR(9) NOT NULL,
      red VARCHAR(100),
      proyecto_id INTEGER NOT NULL DEFAULT 14,
      ano_implementacion INTEGER,
      condicion VARCHAR(100),
      tipo_gestion INTEGER NOT NULL DEFAULT 6,
      control VARCHAR(100),
      tipo_control INTEGER DEFAULT 32,
      plataforma_txt VARCHAR(100),
      plataforma INTEGER DEFAULT 47,
      electrico_suministro VARCHAR(255),
      latitud DOUBLE PRECISION,
      longitud DOUBLE PRECISION,
      plano_pdf VARCHAR(255),
      matched_db_id INTEGER,
      tipo_accion VARCHAR(20) NOT NULL,
      estado_codigo VARCHAR(30) NOT NULL,
      notas TEXT
    );`,
    'BEGIN;',
    'TRUNCATE TABLE cruces_staging;'
  ];

  const esc = (s) => (s === null || s === undefined ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`);
  const num = (n) => (n === null || n === undefined || isNaN(n) ? 'NULL' : n);

  rowsToInsert.forEach(r => {
    sqlStatements.push(`
      INSERT INTO cruces_staging (
        row_excel, verificado, codigo_excel, codigo_final, codigo_anterior, nombre, via1_nombre, via2_nombre, distrito, ubigeo_id, red, proyecto_id, ano_implementacion, condicion, tipo_gestion, control, tipo_control, plataforma_txt, plataforma, electrico_suministro, latitud, longitud, plano_pdf, matched_db_id, tipo_accion, estado_codigo, notas
      ) VALUES (
        ${r.row_excel}, ${esc(r.verificado)}, ${esc(r.codigo_excel)}, ${esc(r.codigo_final)}, ${esc(r.codigo_anterior)}, ${esc(r.nombre)}, ${esc(r.via1_nombre)}, ${esc(r.via2_nombre)}, ${esc(r.distrito)}, ${esc(r.ubigeo_id)}, ${esc(r.red)}, ${num(r.proyecto_id)}, ${num(r.ano_implementacion)}, ${esc(r.condicion)}, ${num(r.tipo_gestion)}, ${esc(r.control)}, ${num(r.tipo_control)}, ${esc(r.plataforma_txt)}, ${num(r.plataforma)}, ${esc(r.electrico_suministro)}, ${num(r.latitud)}, ${num(r.longitud)}, ${esc(r.plano_pdf)}, ${num(r.matched_db_id)}, ${esc(r.tipo_accion)}, ${esc(r.estado_codigo)}, ${esc(r.notas)}
      );
    `);
  });

  sqlStatements.push('COMMIT;');

  const sqlFilePath = './backups/cruces_staging_insert.sql';
  fs.writeFileSync(sqlFilePath, sqlStatements.join('\n'), 'utf8');
  console.log(`5. Archivo SQL generado en ${sqlFilePath}. Importando en PostgreSQL...`);

  const sqlContent = fs.readFileSync(sqlFilePath);
  execSync('docker exec -i monitoreo-db psql -U transito -d protransito', {
    input: sqlContent,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  });

  // 6. Consultar estadísticas de la tabla cruces_staging
  const stats = execSync(
    `docker exec -i monitoreo-db psql -U transito -d protransito -c "
      SELECT estado_codigo, tipo_accion, count(*) as total
      FROM cruces_staging
      GROUP BY estado_codigo, tipo_accion
      ORDER BY total DESC;
    "`,
    { encoding: 'utf8' }
  );

  console.log('\n--- RESUMEN DE CRUCES_STAGING POBLADA ---');
  console.log(stats);
}

main().catch(console.error);
