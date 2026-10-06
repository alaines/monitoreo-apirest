const { execSync } = require('child_process');
const fs = require('fs');

async function reconcileExact1727() {
  console.log('=== RECONCILIACIÓN EXACTA: 1,725 CRUCES + 2 BASES (1,727 REGISTROS) ===');

  // 1. Asegurar que todos los 1,727 registros de staging existan en cruces
  console.log('1. Insertando registros faltantes de staging en cruces...');
  execSync(
    `docker exec -i monitoreo-db psql -U transito -d protransito -c "
      INSERT INTO cruces (
        codigo, codigo_anterior, nombre, via1, via2, ubigeo_id, proyecto_id, tipo_gestion, tipo_control, plataforma, electrico_suministro, latitud, longitud, ano_implementacion, plano_pdf, estado, created, modified
      )
      SELECT 
        cs.codigo_final, cs.codigo_anterior, cs.nombre, cs.via1_id, cs.via2_id, cs.ubigeo_id, cs.proyecto_id, cs.tipo_gestion, cs.tipo_control, cs.plataforma, cs.electrico_suministro, cs.latitud, cs.longitud, cs.ano_implementacion, cs.plano_pdf, true, NOW(), NOW()
      FROM cruces_staging cs
      WHERE NOT EXISTS (SELECT 1 FROM cruces c WHERE c.codigo = cs.codigo_final);
    "`,
    { encoding: 'utf8' }
  );

  // 2. Obtener los 1,727 registros de cruces_staging
  const stagingRaw = execSync(
    'docker exec -i monitoreo-db psql -U transito -d protransito -t -A -c "SELECT json_agg(s) FROM (SELECT id as staging_id, row_excel, codigo_final, codigo_anterior, nombre, via1_id, via2_id, ubigeo_id, proyecto_id, tipo_gestion, tipo_control, plataforma, electrico_suministro, latitud, longitud, ano_implementacion, plano_pdf FROM cruces_staging ORDER BY id) s;"',
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );
  const stagingRows = JSON.parse(stagingRaw.trim());
  console.log('Total registros en staging:', stagingRows.length);

  // 3. Obtener cruces actuales en la BD
  const dbCrucesRaw = execSync(
    'docker exec -i monitoreo-db psql -U transito -d protransito -t -A -c "SELECT json_agg(c) FROM (SELECT id, trim(codigo) as codigo, trim(nombre) as nombre, ubigeo_id, latitud, longitud FROM cruces ORDER BY id) c;"',
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );
  const dbCruces = JSON.parse(dbCrucesRaw.trim());
  console.log('Total cruces actuales en BD:', dbCruces.length);

  // Mapear código a cruces.id
  const dbByCodigo = new Map();
  dbCruces.forEach(c => {
    if (c.codigo) dbByCodigo.set(c.codigo.trim().toUpperCase(), c);
  });

  const stagingToDbIdMap = new Map(); // staging_id -> cruces.id
  const officialCrucesIds = new Set();

  stagingRows.forEach(s => {
    const code = s.codigo_final.trim().toUpperCase();
    if (dbByCodigo.has(code)) {
      const realDbId = dbByCodigo.get(code).id;
      stagingToDbIdMap.set(s.staging_id, realDbId);
      officialCrucesIds.add(realDbId);
    }
  });

  console.log(`Cruces oficiales identificados en BD: ${officialCrucesIds.size} de ${stagingRows.length}`);

  // Helpers para matching difuso
  function norm(str) {
    if (!str) return '';
    return str.toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getTokens(str) {
    const stopWords = new Set(['AV', 'AVENIDA', 'JR', 'JIRON', 'CA', 'CALLE', 'PJE', 'PASAJE', 'PROL', 'PROLONGACION', 'DE', 'DEL', 'LA', 'EL', 'LOS', 'LAS', 'Y', 'EN', 'SAN', 'SANTA']);
    return norm(str).split(' ').filter(w => w.length > 1 && !stopWords.has(w));
  }

  function tokenOverlap(t1, t2) {
    const s1 = new Set(t1);
    const s2 = new Set(t2);
    let common = 0;
    s1.forEach(w => { if (s2.has(w)) common++; });
    const union = new Set([...s1, ...s2]).size;
    return union > 0 ? common / union : 0;
  }

  function distanceKm(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Identificar los cruces obsoletos en BD (los que NO están en officialCrucesIds)
  const obsoleteCruces = dbCruces.filter(c => !officialCrucesIds.has(c.id));
  console.log(`Cruces obsoletos a depurar/re-mapear: ${obsoleteCruces.length}`);

  // Construir sentencias de re-mapeo de tickets
  const ticketRemapStatements = [];
  const baseCuzcoDbId = stagingToDbIdMap.get(stagingRows.find(s => s.codigo_final === 'B01001').staging_id);

  obsoleteCruces.forEach(c => {
    let targetDbId = null;

    if (c.id === 99999 || norm(c.nombre).includes('CENTRO DE CONTROL')) {
      targetDbId = baseCuzcoDbId;
    } else {
      const tOrig = getTokens(c.nombre);
      let bestMatchStaging = null;
      let bestScore = 0;

      stagingRows.forEach(s => {
        const tStaging = getTokens(s.nombre);
        let score = tokenOverlap(tOrig, tStaging);
        if (c.ubigeo_id && s.ubigeo_id && c.ubigeo_id === s.ubigeo_id) score += 0.2;
        const dist = distanceKm(c.latitud, c.longitud, s.latitud, s.longitud);
        if (dist < 0.3) score += 0.5;
        else if (dist < 1.0) score += 0.2;

        if (score > bestScore) {
          bestScore = score;
          bestMatchStaging = s;
        }
      });

      if (bestMatchStaging) {
        targetDbId = stagingToDbIdMap.get(bestMatchStaging.staging_id);
      }
    }

    if (!targetDbId) {
      targetDbId = baseCuzcoDbId; // Fallback seguro
    }

    ticketRemapStatements.push(`UPDATE tickets SET cruce_id = ${targetDbId} WHERE cruce_id = ${c.id};`);
  });

  // Generar script SQL completo
  const sqlLines = [
    'BEGIN;',
    '-- 1. Re-mapeo de tickets asociados a cruces no oficiales hacia sus cruces oficiales equivalentes',
    ...ticketRemapStatements,
    '',
    `-- 2. Eliminar cruces obsoletos para dejar EXACTAMENTE los 1,727 cruces oficiales`,
    `DELETE FROM cruces WHERE id NOT IN (${Array.from(officialCrucesIds).join(', ')});`,
    '',
    `-- 3. Sincronizar secuencia cruces_id_seq`,
    `SELECT setval('cruces_id_seq', (SELECT MAX(id) FROM cruces));`,
    'COMMIT;'
  ];

  const sqlFilePath = './backups/reconcile_1727.sql';
  fs.writeFileSync(sqlFilePath, sqlLines.join('\n'), 'utf8');
  console.log(`Script SQL de reconciliación generado en ${sqlFilePath}.`);
  console.log('Ejecutando en PostgreSQL...');

  const sqlContent = fs.readFileSync(sqlFilePath);
  execSync('docker exec -i monitoreo-db psql -U transito -d protransito', {
    input: sqlContent,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  });

  console.log('Reconciliación completada. Verificando conteos finales...');

  const finalCheckSql = `
    SELECT 
      (SELECT count(*) FROM cruces) as total_cruces,
      (SELECT count(*) FROM cruces WHERE codigo LIKE 'C%') as total_cruces_semaforicos,
      (SELECT count(*) FROM cruces WHERE codigo LIKE 'B%') as total_bases_operativas,
      (SELECT count(*) FROM tickets) as total_tickets,
      (SELECT count(*) FROM tickets t WHERE NOT EXISTS (SELECT 1 FROM cruces c WHERE c.id = t.cruce_id)) as tickets_huerfanos;
  `;

  const results = execSync(`docker exec -i monitoreo-db psql -U transito -d protransito -c "${finalCheckSql}"`, {
    encoding: 'utf8'
  });

  console.log('\n--- VERIFICACIÓN FINAL EN BASE DE DATOS ---');
  console.log(results);
}

reconcileExact1727().catch(console.error);
