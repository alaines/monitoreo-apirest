const ExcelJS = require('exceljs');
const { execSync } = require('child_process');

async function check186() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('./backups/cruces-complete.xlsx');
  const ws = wb.getWorksheet('BDrs');

  // Load all Excel rows
  const excelList = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const hasAny = row.values && row.values.some(v => v !== null && v !== undefined && v !== '');
    if (!hasAny) continue;

    let cod = row.getCell(4).value;
    if (typeof cod === 'object' && cod !== null && 'result' in cod) cod = cod.result;
    let nom = row.getCell(5).value;
    if (typeof nom === 'object' && nom !== null && 'result' in nom) nom = nom.result;
    let codAnt = row.getCell(10).value;
    if (typeof codAnt === 'object' && codAnt !== null && 'result' in codAnt) codAnt = codAnt.result;

    excelList.push({
      row: r,
      codigo: cod ? String(cod).trim().toUpperCase() : '',
      nombre: nom ? String(nom).trim() : '',
      codigo_anterior: codAnt ? String(codAnt).trim().toUpperCase() : ''
    });
  }

  console.log('Total Excel rows:', excelList.length);

  // Load 186 cruces from cruces_backup_20261005 (original DB before our previous insert)
  const dbRaw = execSync(
    'docker exec -i monitoreo-db psql -U transito -d protransito -t -A -c "SELECT json_agg(c) FROM (SELECT id, trim(codigo) as codigo, trim(codigo_anterior) as codigo_anterior, trim(nombre) as nombre, ubigeo_id, (SELECT count(*) FROM tickets t WHERE t.cruce_id = cruces_backup_20261005.id) as tickets_count FROM cruces_backup_20261005 ORDER BY id) c;"',
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  );
  const dbOriginal = JSON.parse(dbRaw.trim());
  console.log('Total original DB cruces:', dbOriginal.length);

  // Check how each dbOriginal cruce matches Excel
  const excelByCode = new Map();
  const excelByCodAnt = new Map();
  const excelByNom = new Map();

  function norm(str) {
    if (!str) return '';
    return str.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  excelList.forEach(e => {
    if (e.codigo) excelByCode.set(e.codigo, e);
    if (e.codigo_anterior) excelByCodAnt.set(e.codigo_anterior, e);
    if (e.nombre) excelByNom.set(norm(e.nombre), e);
  });

  const matchedByCode = [];
  const matchedByCodAnt = [];
  const matchedByNom = [];
  const notInExcel = [];

  dbOriginal.forEach(c => {
    const cCode = c.codigo ? c.codigo.toUpperCase() : '';
    const cCodAnt = c.codigo_anterior ? c.codigo_anterior.toUpperCase() : '';
    const cNom = norm(c.nombre);

    if (cCode && excelByCode.has(cCode)) {
      matchedByCode.push({ db: c, excel: excelByCode.get(cCode) });
    } else if (cCodAnt && excelByCodAnt.has(cCodAnt)) {
      matchedByCodAnt.push({ db: c, excel: excelByCodAnt.get(cCodAnt) });
    } else if (cNom && excelByNom.has(cNom)) {
      matchedByNom.push({ db: c, excel: excelByNom.get(cNom) });
    } else {
      notInExcel.push(c);
    }
  });

  console.log({
    totalOriginalDb: dbOriginal.length,
    matchedByCode: matchedByCode.length,
    matchedByCodAnt: matchedByCodAnt.length,
    matchedByNom: matchedByNom.length,
    notInExcel: notInExcel.length
  });

  console.log('\nTop 20 DB cruces not found in Excel by Code/CodAnt/ExactNom:');
  notInExcel.sort((a,b) => (parseInt(b.tickets_count)||0) - (parseInt(a.tickets_count)||0));
  console.log(notInExcel.slice(0, 20).map(c => ({
    id: c.id,
    codigo: c.codigo,
    nombre: c.nombre,
    codAnt: c.codigo_anterior,
    tickets: c.tickets_count
  })));
}

check186().catch(console.error);
