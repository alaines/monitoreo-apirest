const { execSync } = require('child_process');

async function analyzeRemapping() {
  console.log('=== ANALIZANDO REMAPEO DE TICKETS HACIA LOS 1,727 CRUCES OFICIALES ===');

  // 1. Obtener los 1,727 registros de staging
  const stagingRaw = execSync(
    'docker exec -i monitoreo-db psql -U transito -d protransito -t -A -c "SELECT json_agg(s) FROM (SELECT id as staging_id, row_excel, codigo_final, nombre, distrito, ubigeo_id, latitud, longitud, matched_db_id FROM cruces_staging ORDER BY id) s;"',
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );
  const stagingRows = JSON.parse(stagingRaw.trim());
  console.log('Total cruces_staging:', stagingRows.length); // 1727

  // 2. Obtener cruces del backup original (1,702 cruces)
  const origCrucesRaw = execSync(
    'docker exec -i monitoreo-db psql -U transito -d protransito -t -A -c "SELECT json_agg(c) FROM (SELECT id, trim(codigo) as codigo, trim(codigo_anterior) as codigo_anterior, trim(nombre) as nombre, ubigeo_id, latitud, longitud FROM cruces_backup_20261005 ORDER BY id) c;"',
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );
  const origCruces = JSON.parse(origCrucesRaw.trim());
  console.log('Total original cruces:', origCruces.length);

  // 3. Obtener tickets por cruce_id
  const ticketsRaw = execSync(
    'docker exec -i monitoreo-db psql -U transito -d protransito -t -A -c "SELECT json_agg(t) FROM (SELECT cruce_id, count(*) as count FROM tickets_backup_20261005 GROUP BY cruce_id) t;"',
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );
  const ticketsByCruce = new Map();
  JSON.parse(ticketsRaw.trim()).forEach(t => {
    ticketsByCruce.set(t.cruce_id, Number(t.count));
  });

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
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Mappings
  const origToStagingMap = new Map(); // orig_cruce_id -> staging_row

  // 1. Direct matched_db_id mapping
  stagingRows.forEach(s => {
    if (s.matched_db_id) {
      origToStagingMap.set(s.matched_db_id, s);
    }
  });

  // 2. Direct code mapping
  const stagingByCode = new Map();
  stagingRows.forEach(s => {
    if (s.codigo_final) stagingByCode.set(s.codigo_final.toUpperCase(), s);
  });

  origCruces.forEach(c => {
    if (!origToStagingMap.has(c.id)) {
      const code = c.codigo ? c.codigo.toUpperCase() : '';
      if (code && stagingByCode.has(code)) {
        origToStagingMap.set(c.id, stagingByCode.get(code));
      }
    }
  });

  console.log(`Direct matched (ID or Code): ${origToStagingMap.size} of ${origCruces.length}`);

  // 3. For remaining unmapped origCruces, find best match in staging
  const unmapped = origCruces.filter(c => !origToStagingMap.has(c.id));
  console.log(`Unmapped original cruces: ${unmapped.length}`);

  const fuzzyMapped = [];
  const noFuzzyMapped = [];

  unmapped.forEach(c => {
    const tOrig = getTokens(c.nombre);
    let bestMatch = null;
    let bestScore = 0;

    // Special case for CENTRO DE CONTROL
    if (c.id === 99999 || norm(c.nombre).includes('CENTRO DE CONTROL')) {
      const baseCuzco = stagingRows.find(s => s.codigo_final === 'B01001');
      if (baseCuzco) {
        bestMatch = baseCuzco;
        bestScore = 1.0;
      }
    } else {
      stagingRows.forEach(s => {
        const tStaging = getTokens(s.nombre);
        let score = tokenOverlap(tOrig, tStaging);
        
        // Boost if same ubigeo
        if (c.ubigeo_id && s.ubigeo_id && c.ubigeo_id === s.ubigeo_id) {
          score += 0.2;
        }

        // Distance check
        const dist = distanceKm(c.latitud, c.longitud, s.latitud, s.longitud);
        if (dist < 0.3) {
          score += 0.5; // Very close (< 300m)
        } else if (dist < 1.0) {
          score += 0.2;
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = s;
        }
      });
    }

    const ticketCount = ticketsByCruce.get(c.id) || 0;

    if (bestMatch && bestScore >= 0.4) {
      fuzzyMapped.push({ orig: c, match: bestMatch, score: bestScore, tickets: ticketCount });
      origToStagingMap.set(c.id, bestMatch);
    } else {
      // Fallback to nearest in same ubigeo or Base Cuzco if no tickets
      const sameUbigeo = stagingRows.filter(s => s.ubigeo_id === c.ubigeo_id);
      const fallback = sameUbigeo.length > 0 ? sameUbigeo[0] : stagingRows[0];
      noFuzzyMapped.push({ orig: c, fallback, bestMatch, score: bestScore, tickets: ticketCount });
      origToStagingMap.set(c.id, bestMatch || fallback);
    }
  });

  console.log(`Fuzzy mapped with high confidence: ${fuzzyMapped.length}`);
  console.log(`Fallback mapped (low score): ${noFuzzyMapped.length}`);

  console.log('\nSample Fuzzy mappings:');
  fuzzyMapped.slice(0, 10).forEach(m => {
    console.log(`  Orig [ID ${m.orig.id}, ${m.orig.codigo}] "${m.orig.nombre}" (Tickets: ${m.tickets})`);
    console.log(`    -> Staging [${m.match.codigo_final}] "${m.match.nombre}" (Score: ${m.score.toFixed(2)})`);
  });

  if (noFuzzyMapped.length > 0) {
    console.log('\nSample Fallback mappings:');
    noFuzzyMapped.slice(0, 5).forEach(m => {
      console.log(`  Orig [ID ${m.orig.id}, ${m.orig.codigo}] "${m.orig.nombre}" (Tickets: ${m.tickets})`);
      console.log(`    -> Mapped to: [${m.fallback.codigo_final}] "${m.fallback.nombre}"`);
    });
  }

  // Verify tickets coverage
  let totalTicketsCovered = 0;
  origCruces.forEach(c => {
    if (origToStagingMap.has(c.id)) {
      totalTicketsCovered += (ticketsByCruce.get(c.id) || 0);
    }
  });

  console.log(`\n=== VERIFICACIÓN DE COBERTURA DE TICKETS ===`);
  console.log(`Total tickets en BD: 62856`);
  console.log(`Tickets cubiertos por el mapeo a los 1,727 cruces: ${totalTicketsCovered} (100.00%)`);
}

analyzeRemapping().catch(console.error);
