const ExcelJS = require('exceljs');
const { execSync } = require('child_process');

async function main() {
  console.log('--- 1. Reading Excel file backups/cruces-complete.xlsx ---');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('./backups/cruces-complete.xlsx');

  const wsBDrs = wb.getWorksheet('BDrs');
  console.log('Worksheet BDrs total rows:', wsBDrs.rowCount);

  // Extract all rows from BDrs
  const excelRows = [];
  const headerRow = wsBDrs.getRow(1);
  const headers = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = cell.value ? String(cell.value).trim() : '';
  });

  for (let r = 2; r <= wsBDrs.rowCount; r++) {
    const row = wsBDrs.getRow(r);
    const hasAny = row.values && row.values.some(v => v !== null && v !== undefined && v !== '');
    if (!hasAny) continue;

    const rowData = { _row: r };
    headers.forEach((h, colIdx) => {
      if (h) {
        let v = row.getCell(colIdx).value;
        if (typeof v === 'object' && v !== null && 'result' in v) {
          v = v.result;
        }
        if (typeof v === 'string') {
          v = v.trim();
        }
        rowData[h] = v;
      }
    });

    // Clean codigo
    let codigo = rowData['codigo'] ? String(rowData['codigo']).trim() : '';
    let nombre = rowData['nombre'] ? String(rowData['nombre']).trim() : '';

    if (codigo || nombre) {
      rowData._cleanCodigo = codigo;
      rowData._cleanNombre = nombre;
      excelRows.push(rowData);
    }
  }

  console.log(`Excel total valid rows extracted: ${excelRows.length}`);

  // Fetch current database cruces
  console.log('--- 2. Fetching current DB cruces ---');
  const dbCrucesRaw = execSync(
    'docker exec -i monitoreo-db psql -U transito -d protransito -t -A -c "SELECT json_agg(c) FROM (SELECT id, trim(codigo) as codigo, trim(codigo_anterior) as codigo_anterior, trim(nombre) as nombre, via1, via2, ubigeo_id, latitud, longitud, tipo_gestion, administradore_id, proyecto_id, tipo_control, plataforma, electrico_suministro, ano_implementacion FROM cruces ORDER BY id) c;"',
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );

  const dbCruces = JSON.parse(dbCrucesRaw.trim());
  console.log(`Database total cruces: ${dbCruces.length}`);

  // Fetch tickets cruce_id summary
  const ticketsRaw = execSync(
    'docker exec -i monitoreo-db psql -U transito -d protransito -t -A -c "SELECT json_agg(t) FROM (SELECT cruce_id, count(*) as count FROM tickets GROUP BY cruce_id) t;"',
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );
  const ticketsByCruce = new Map();
  JSON.parse(ticketsRaw.trim()).forEach(t => {
    ticketsByCruce.set(t.cruce_id, Number(t.count));
  });
  console.log(`Database cruces referenced by tickets: ${ticketsByCruce.size}`);

  // Comparison Maps
  const dbByCodigo = new Map();
  const dbById = new Map();
  const dbByNombre = new Map();

  dbCruces.forEach(c => {
    dbById.set(c.id, c);
    if (c.codigo) dbByCodigo.set(c.codigo.toUpperCase(), c);
    if (c.nombre) dbByNombre.set(c.nombre.toUpperCase(), c);
  });

  const matchedByCodigo = [];
  const matchedByNombre = [];
  const excelWithoutMatch = [];
  const excelDuplicateCodes = [];

  const seenExcelCodes = new Set();

  excelRows.forEach(er => {
    const code = er._cleanCodigo ? er._cleanCodigo.toUpperCase() : '';
    const nom = er._cleanNombre ? er._cleanNombre.toUpperCase() : '';

    if (code) {
      if (seenExcelCodes.has(code)) {
        excelDuplicateCodes.push({ row: er._row, code, er });
      } else {
        seenExcelCodes.add(code);
      }
    }

    if (code && dbByCodigo.has(code)) {
      matchedByCodigo.push({ excel: er, db: dbByCodigo.get(code) });
    } else if (nom && dbByNombre.has(nom)) {
      matchedByNombre.push({ excel: er, db: dbByNombre.get(nom) });
    } else {
      excelWithoutMatch.push(er);
    }
  });

  console.log('\n--- 3. Matching Results ---');
  console.log(`Matched exactly by 'codigo': ${matchedByCodigo.length}`);
  console.log(`Matched by 'nombre' (where codigo differed or was empty): ${matchedByNombre.length}`);
  console.log(`Excel rows with NO match in DB (New Cruces to insert): ${excelWithoutMatch.length}`);
  console.log(`Excel duplicate codes: ${excelDuplicateCodes.length}`);

  // DB cruces not in Excel
  const matchedDbIds = new Set([
    ...matchedByCodigo.map(m => m.db.id),
    ...matchedByNombre.map(m => m.db.id)
  ]);

  const dbCrucesNotInExcel = dbCruces.filter(c => !matchedDbIds.has(c.id));
  console.log(`DB cruces NOT present in Excel: ${dbCrucesNotInExcel.length}`);

  const dbCrucesNotInExcelWithTickets = dbCrucesNotInExcel.filter(c => ticketsByCruce.has(c.id));
  console.log(`  -> of which have active tickets: ${dbCrucesNotInExcelWithTickets.length}`);

  console.log('\n--- 4. Sample Excel Rows with NO match (to be created): ---');
  console.log(excelWithoutMatch.slice(0, 10).map(e => ({
    row: e._row,
    codigo: e._cleanCodigo,
    nombre: e._cleanNombre,
    distrito: e.distrito,
    codigo_anterior: e.codigo_anterior,
    latitud: e.latitud,
    longitud: e.longitud
  })));

  console.log('\n--- 5. Sample DB Cruces NOT in Excel: ---');
  console.log(dbCrucesNotInExcel.slice(0, 10).map(c => ({
    id: c.id,
    codigo: c.codigo,
    nombre: c.nombre,
    ticketCount: ticketsByCruce.get(c.id) || 0
  })));

  // Inspect discrepancies in matched records (e.g. coordinates, names, etc.)
  let diffCoords = 0;
  let diffDistrito = 0;
  let diffSuministro = 0;

  matchedByCodigo.forEach(m => {
    const eLat = Number(m.excel.latitud);
    const eLng = Number(m.excel.longitud);
    const dbLat = Number(m.db.latitud);
    const dbLng = Number(m.db.longitud);

    if (eLat && (!dbLat || Math.abs(eLat - dbLat) > 0.0001)) {
      diffCoords++;
    }
    if (m.excel.electrico_suministro && m.excel.electrico_suministro !== m.db.electrico_suministro) {
      diffSuministro++;
    }
  });

  console.log('\n--- 6. Data Enrichment / Differences in Matched Cruces ---');
  console.log(`Cruces with different/updated coordinates: ${diffCoords}`);
  console.log(`Cruces with new/updated electric supply (suministro): ${diffSuministro}`);

  // 7. Check Catalogs in DB for unmapped values
  console.log('\n--- 7. Catalog Analysis for New & Existing Cruces ---');

  // Ubigeos
  const ubigeosRaw = execSync(
    'docker exec -i monitoreo-db psql -U transito -d protransito -t -A -c "SELECT json_agg(u) FROM (SELECT id, upper(trim(distrito)) as distrito FROM ubigeos) u;"',
    { encoding: 'utf8' }
  );
  const ubigeos = JSON.parse(ubigeosRaw.trim());
  const ubigeoMap = new Map();
  ubigeos.forEach(u => {
    ubigeoMap.set(u.distrito, u.id);
    const norm = u.distrito.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    ubigeoMap.set(norm, u.id);
  });
  // Special aliases
  ubigeoMap.set('CERCADO', '150101');
  ubigeoMap.set('LIMA', '150101');
  ubigeoMap.set('CERCADO DE LIMA', '150101');
  ubigeoMap.set('S.J.L.', '150132');
  ubigeoMap.set('S.J.M.', '150133');
  ubigeoMap.set('V.M.T.', '150143');
  ubigeoMap.set('V.E.S.', '150142');

  const unmappedDistritos = new Set();
  excelRows.forEach(r => {
    const d = r.distrito ? r.distrito.trim().toUpperCase() : '';
    if (d) {
      const norm = d.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (!ubigeoMap.has(d) && !ubigeoMap.has(norm)) {
        unmappedDistritos.add(d);
      }
    }
  });
  console.log('Unmapped distritos from Excel:', Array.from(unmappedDistritos));

  // Tipos (Gestion, Control, Plataforma)
  const tiposRaw = execSync(
    'docker exec -i monitoreo-db psql -U transito -d protransito -t -A -c "SELECT json_agg(t) FROM (SELECT id, parent_id, upper(trim(name)) as name FROM tipos) t;"',
    { encoding: 'utf8' }
  );
  const tipos = JSON.parse(tiposRaw.trim());
  console.log('Tipos in DB:', tipos.length);

  // Proyectos
  const proyectosRaw = execSync(
    'docker exec -i monitoreo-db psql -U transito -d protransito -t -A -c "SELECT json_agg(p) FROM (SELECT id, siglas, upper(trim(nombre)) as nombre FROM proyectos) p;"',
    { encoding: 'utf8' }
  );
  const proyectos = JSON.parse(proyectosRaw.trim());
  console.log('Proyectos in DB:', proyectos);

  // 8. Analyze 'verificado' column and CXXYYY structure
  console.log('\n--- 8. Analysis of "verificado" Column & CXXYYY Structure ---');
  let verifiedCount = 0;
  let unverifiedCount = 0;
  let unverifiedWithCode = 0;
  let unverifiedWithoutCode = 0;

  // Track max sequence per district (XX)
  const maxSeqByDistrict = new Map();
  // Initialize maxSeq from DB cruces
  dbCruces.forEach(c => {
    if (c.codigo && /^C\d{5}$/i.test(c.codigo)) {
      const xx = c.codigo.substring(1, 3);
      const yyy = parseInt(c.codigo.substring(3), 10);
      const curr = maxSeqByDistrict.get(xx) || 0;
      if (yyy > curr) maxSeqByDistrict.set(xx, yyy);
    }
  });

  const unverifiedList = [];

  excelRows.forEach(r => {
    const isVerified = (r.verificado && String(r.verificado).trim().toUpperCase() === 'C');
    if (isVerified) {
      verifiedCount++;
    } else {
      unverifiedCount++;
      const code = r._cleanCodigo;
      if (code) {
        unverifiedWithCode++;
      } else {
        unverifiedWithoutCode++;
      }

      // Check if it matches existing DB cruce by nombre or codigo_anterior
      const nom = r._cleanNombre ? r._cleanNombre.toUpperCase() : '';
      const matchedDb = dbByNombre.get(nom);

      unverifiedList.push({
        row: r._row,
        distrito: r.distrito,
        nombre: r._cleanNombre,
        excelCode: code,
        codigo_anterior: r.codigo_anterior,
        matchedDbId: matchedDb ? matchedDb.id : null,
        matchedDbCode: matchedDb ? matchedDb.codigo : null
      });
    }
  });

  console.log(`Verified (verificado = 'C'): ${verifiedCount}`);
  console.log(`Unverified (verificado != 'C'): ${unverifiedCount}`);
  console.log(`  - Unverified but has code in Excel: ${unverifiedWithCode}`);
  console.log(`  - Unverified and empty code in Excel: ${unverifiedWithoutCode}`);

  console.log('\nMax YYY sequence in DB by District XX:');
  const sortedDistricts = Array.from(maxSeqByDistrict.entries()).sort((a,b) => a[0].localeCompare(b[0]));
  sortedDistricts.forEach(([xx, maxYYY]) => {
    console.log(`  Distrito XX=${xx}: Max Correlativo YYY=${maxYYY} (próximo: C${xx}${String(maxYYY+1).padStart(3, '0')})`);
  });

  console.log('\nSample Unverified rows and how they can be resolved:');
  unverifiedList.slice(0, 10).forEach(u => {
    console.log(`  Row ${u.row} [${u.distrito}]: "${u.nombre}" | ExcelCode: "${u.excelCode}" | CodAnt: "${u.codigo_anterior}" | Matched DB: ${u.matchedDbId ? `ID ${u.matchedDbId} (Code: ${u.matchedDbCode})` : 'NO (Needs new CXXYYY)'}`);
  });

  // Base rows check
  const baseRows = excelRows.filter(r => r._cleanNombre && r._cleanNombre.toUpperCase().includes('BASE'));
  console.log('\nBase rows found in Excel:');
  baseRows.forEach(b => {
    console.log(`  Row ${b._row}: "${b._cleanNombre}", Distrito: "${b.distrito}", Proposed Code: B${b.distrito === 'RIMAC' ? '28' : '01'}001`);
  });
}

main().catch(console.error);
