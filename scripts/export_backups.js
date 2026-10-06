const { execSync } = require('child_process');
const fs = require('fs');

async function exportBackups() {
  console.log('=== EXPORTANDO BACKUPS DE CRUCES OFICIALES (1,727 REGISTROS) ===');

  // 1. Exportar CSV con UTF-8 limpio
  const queryCsv = `
    SELECT 
      c.id, 
      c.codigo, 
      c.codigo_anterior, 
      c.nombre, 
      e1.nombre_via as via1_nombre, 
      e2.nombre_via as via2_nombre, 
      u.distrito, 
      c.ubigeo_id, 
      p.siglas as proyecto, 
      t.name as tipo_gestion, 
      c.electrico_suministro, 
      c.ano_implementacion, 
      c.latitud, 
      c.longitud, 
      c.plano_pdf
    FROM cruces c 
    LEFT JOIN ejes e1 ON c.via1 = e1.id 
    LEFT JOIN ejes e2 ON c.via2 = e2.id 
    LEFT JOIN ubigeos u ON c.ubigeo_id = u.id 
    LEFT JOIN proyectos p ON c.proyecto_id = p.id 
    LEFT JOIN tipos t ON c.tipo_gestion = t.id 
    ORDER BY c.codigo;
  `;

  const copyCommand = `\\copy (${queryCsv.trim().replace(/;\s*$/, '').replace(/\n/g, ' ')}) TO STDOUT WITH CSV HEADER;`;

  const csvOutput = execSync('docker exec -i monitoreo-db psql -U transito -d protransito', {
    input: Buffer.from(copyCommand, 'utf8'),
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  });

  const csvPath = './backups/cruces_oficial_1727.csv';
  fs.writeFileSync(csvPath, csvOutput, 'utf8');
  console.log(`1. CSV oficial guardado en ${csvPath} (${(fs.statSync(csvPath).size / 1024).toFixed(1)} KB)`);

  // 2. Exportar DUMP SQL de tabla cruces
  const sqlCruces = execSync('docker exec -i monitoreo-db pg_dump -U transito -d protransito --table=cruces --clean --if-exists', {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  });
  const sqlCrucesPath = './backups/cruces_oficial_1727.sql';
  fs.writeFileSync(sqlCrucesPath, sqlCruces, 'utf8');
  console.log(`2. SQL Dump de tabla 'cruces' guardado en ${sqlCrucesPath} (${(fs.statSync(sqlCrucesPath).size / 1024).toFixed(1)} KB)`);

  // 3. Exportar DUMP SQL conjunto de cruces + ejes (para evitar problemas de FK en bases limpias)
  const sqlCrucesEjes = execSync('docker exec -i monitoreo-db pg_dump -U transito -d protransito --table=cruces --table=ejes --clean --if-exists', {
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  });
  const sqlCrucesEjesPath = './backups/cruces_y_ejes_oficial_1727.sql';
  fs.writeFileSync(sqlCrucesEjesPath, sqlCrucesEjes, 'utf8');
  console.log(`3. SQL Dump conjunto 'cruces + ejes' guardado en ${sqlCrucesEjesPath} (${(fs.statSync(sqlCrucesEjesPath).size / 1024).toFixed(1)} KB)`);

  // 4. Verificación de líneas del CSV
  const csvLines = fs.readFileSync(csvPath, 'utf8').trim().split('\n');
  console.log(`4. Verificación de CSV: ${csvLines.length - 1} filas de datos (debe ser 1727)`);
}

exportBackups().catch(console.error);
