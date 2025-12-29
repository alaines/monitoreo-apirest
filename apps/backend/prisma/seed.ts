import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Verificar si ya existen grupos
  const grupoCount = await prisma.grupo.count();
  
  if (grupoCount === 0) {
    console.log('📝 Creando grupos de usuarios...');
    
    // Crear grupos
    const grupos = await Promise.all([
      prisma.grupo.create({
        data: {
          nombre: 'PUBLICO',
          descripcion: 'Usuario público con acceso limitado',
        },
      }),
      prisma.grupo.create({
        data: {
          nombre: 'OPERADOR',
          descripcion: 'Operador que gestiona incidencias',
        },
      }),
      prisma.grupo.create({
        data: {
          nombre: 'SUPERVISOR',
          descripcion: 'Supervisor con permisos de monitoreo',
        },
      }),
      prisma.grupo.create({
        data: {
          nombre: 'ADMINISTRADOR',
          descripcion: 'Administrador con acceso total',
        },
      }),
    ]);

    console.log(`✅ ${grupos.length} grupos creados`);
  } else {
    console.log('⏭️  Grupos ya existen, saltando...');
  }

  // Verificar si ya existen usuarios
  const userCount = await prisma.user.count();
  
  if (userCount === 0) {
    console.log('👥 Creando usuarios de prueba...');
    
    const grupos = await prisma.grupo.findMany();
    const adminGroup = grupos.find(g => g.nombre === 'ADMINISTRADOR');
    const operadorGroup = grupos.find(g => g.nombre === 'OPERADOR');
    const supervisorGroup = grupos.find(g => g.nombre === 'SUPERVISOR');
    
    if (!adminGroup || !operadorGroup || !supervisorGroup) {
      throw new Error('Grupos no encontrados. Ejecute el seed de grupos primero.');
    }
    
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const operadorPassword = await bcrypt.hash('operador123', 10);
    const supervisorPassword = await bcrypt.hash('supervisor123', 10);

    // Crear usuarios
    const users = await Promise.all([
      prisma.user.create({
        data: {
          usuario: 'admin',
          passwordHash: adminPassword,
          grupoId: adminGroup.id,
          estado: true,
        },
      }),
      prisma.user.create({
        data: {
          usuario: 'operador',
          passwordHash: operadorPassword,
          grupoId: operadorGroup.id,
          estado: true,
        },
      }),
      prisma.user.create({
        data: {
          usuario: 'supervisor',
          passwordHash: supervisorPassword,
          grupoId: supervisorGroup.id,
          estado: true,
        },
      }),
    ]);

    console.log(`✅ ${users.length} usuarios creados`);
    console.log('\n📋 Credenciales de prueba:');
    console.log('   👤 admin / admin123');
    console.log('   👤 operador / operador123');
    console.log('   👤 supervisor / supervisor123');
  } else {
    console.log('⏭️  Usuarios ya existen, saltando...');
  }

  console.log('\n✅ Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
