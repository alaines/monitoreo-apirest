import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCatalogos() {
  console.log('Actualizando tipos de documento a estado = true...');
  
  const tiposActualizados = await prisma.tipoDoc.updateMany({
    where: {
      OR: [
        { estado: false },
        { estado: null },
      ],
    },
    data: {
      estado: true,
      modified: new Date(),
    },
  });
  
  console.log(`✅ ${tiposActualizados.count} tipos de documento actualizados`);

  console.log('Actualizando estados civiles a estado = true...');
  
  const estadosActualizados = await prisma.estadoCivil.updateMany({
    where: {
      OR: [
        { estado: false },
        { estado: null },
      ],
    },
    data: {
      estado: true,
      modified: new Date(),
    },
  });
  
  console.log(`✅ ${estadosActualizados.count} estados civiles actualizados`);

  // Listar todos
  const tiposDoc = await prisma.tipoDoc.findMany({ orderBy: { id: 'asc' } });
  console.log('\n📋 Tipos de documento:');
  tiposDoc.forEach(t => console.log(`  ${t.id}: ${t.nombre} (estado: ${t.estado})`));

  const estadosCiviles = await prisma.estadoCivil.findMany({ orderBy: { id: 'asc' } });
  console.log('\n📋 Estados civiles:');
  estadosCiviles.forEach(e => console.log(`  ${e.id}: ${e.nombre} (estado: ${e.estado})`));
}

updateCatalogos()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('Error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
