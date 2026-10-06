const { execSync } = require('child_process');

async function executeMigration() {
  console.log('=== EJECUTANDO MIGRACIÓN DE CRUCES ===');

  // Script SQL de migración en una sola transacción segura
  const migrationSql = `
    BEGIN;

    -- 1. Actualización de cruces existentes (1,517 cruces)
    UPDATE cruces c
    SET 
      codigo = CASE 
        WHEN cs.estado_codigo = 'VERIFICADO_EXCEL' THEN cs.codigo_final
        ELSE COALESCE(c.codigo, cs.codigo_final)
      END,
      codigo_anterior = COALESCE(cs.codigo_anterior, c.codigo_anterior),
      latitud = COALESCE(cs.latitud, c.latitud),
      longitud = COALESCE(cs.longitud, c.longitud),
      electrico_suministro = CASE 
        WHEN cs.electrico_suministro IS NOT NULL AND cs.electrico_suministro != '' THEN cs.electrico_suministro
        ELSE c.electrico_suministro
      END,
      ano_implementacion = COALESCE(cs.ano_implementacion, c.ano_implementacion),
      plataforma = COALESCE(cs.plataforma, c.plataforma),
      plano_pdf = CASE 
        WHEN cs.plano_pdf IS NOT NULL AND cs.plano_pdf != '' THEN cs.plano_pdf
        ELSE c.plano_pdf
      END,
      modified = NOW()
    FROM cruces_staging cs
    WHERE cs.tipo_accion = 'ACTUALIZAR'
      AND cs.matched_db_id = c.id;

    -- 2. Inserción de cruces nuevos y bases (210 registros)
    INSERT INTO cruces (
      codigo,
      codigo_anterior,
      nombre,
      via1,
      via2,
      ubigeo_id,
      proyecto_id,
      tipo_gestion,
      tipo_control,
      plataforma,
      electrico_suministro,
      latitud,
      longitud,
      ano_implementacion,
      plano_pdf,
      estado,
      created,
      modified
    )
    SELECT 
      cs.codigo_final,
      cs.codigo_anterior,
      cs.nombre,
      cs.via1_id,
      cs.via2_id,
      cs.ubigeo_id,
      cs.proyecto_id,
      cs.tipo_gestion,
      cs.tipo_control,
      cs.plataforma,
      cs.electrico_suministro,
      cs.latitud,
      cs.longitud,
      cs.ano_implementacion,
      cs.plano_pdf,
      true,
      NOW(),
      NOW()
    FROM cruces_staging cs
    WHERE cs.tipo_accion IN ('INSERTAR', 'BASE')
    ORDER BY cs.id;

    -- 3. Sincronizar la secuencia de cruces_id_seq con el nuevo MAX(id)
    SELECT setval('cruces_id_seq', (SELECT MAX(id) FROM cruces WHERE id < 99999));

    COMMIT;
  `;

  console.log('1. Ejecutando transacción SQL en PostgreSQL...');
  execSync('docker exec -i monitoreo-db psql -U transito -d protransito', {
    input: Buffer.from(migrationSql, 'utf8'),
    encoding: 'utf8'
  });

  console.log('2. Verificando resultados de la migración...');

  // 4. Verificación de integridad
  const verificationSql = `
    SELECT 
      (SELECT count(*) FROM cruces_backup_20261005) as cruces_antes,
      (SELECT count(*) FROM cruces) as cruces_despues,
      (SELECT count(*) FROM cruces WHERE created >= NOW() - INTERVAL '5 minutes') as nuevos_cruces_creados,
      (SELECT count(*) FROM tickets) as total_tickets_actual,
      (SELECT count(*) FROM tickets t WHERE NOT EXISTS (SELECT 1 FROM cruces c WHERE c.id = t.cruce_id)) as tickets_huerfanos;
  `;

  const results = execSync(`docker exec -i monitoreo-db psql -U transito -d protransito -c "${verificationSql}"`, {
    encoding: 'utf8'
  });

  console.log('\n--- RESULTADOS DE INTEGRIDAD POST-MIGRACIÓN ---');
  console.log(results);

  // 5. Estadísticas de cruces por tipo de prefijo (C vs B)
  const prefixStats = execSync(
    `docker exec -i monitoreo-db psql -U transito -d protransito -c "
      SELECT 
        substring(codigo from 1 for 1) as prefijo,
        count(*) as total
      FROM cruces
      GROUP BY 1
      ORDER BY 1;
    "`,
    { encoding: 'utf8' }
  );

  console.log('\n--- ESTADÍSTICAS POR PREFIJO (C: Cruces, B: Bases) ---');
  console.log(prefixStats);
}

executeMigration().catch(console.error);
