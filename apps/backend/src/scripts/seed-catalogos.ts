import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCatalogos() {
  console.log('Insertando tipos de documento...');
  
  // Insertar tipos de documento
  const tiposDoc = [
    { nombre: 'DNI', estado: true },
    { nombre: 'RUC', estado: true },
    { nombre: 'Carnet de Extranjería', estado: true },
    { nombre: 'Pasaporte', estado: true },
  ];

  for (const tipo of tiposDoc) {
    await prisma.tipoDoc.upsert({
      where: { id: 0 }, // Siempre creará nuevo porque id 0 no existe
      update: {},
      create: {
        nombre: tipo.nombre,
        estado: tipo.estado,
        created: new Date(),
        modified: new Date(),
      },
    }).catch(() => {
      // Si falla por nombre duplicado, ignorar
      console.log(`Tipo doc ${tipo.nombre} ya existe`);
    });
  }

  console.log('Insertando estados civiles...');
  
  // Insertar estados civiles
  const estadosCiviles = [
    { nombre: 'Soltero(a)', estado: true },
    { nombre: 'Casado(a)', estado: true },
    { nombre: 'Divorciado(a)', estado: true },
    { nombre: 'Viudo(a)', estado: true },
    { nombre: 'Conviviente', estado: true },
  ];

  for (const estado of estadosCiviles) {
    await prisma.estadoCivil.upsert({
      where: { id: 0 }, // Siempre creará nuevo porque id 0 no existe
      update: {},
      create: {
        nombre: estado.nombre,
        estado: estado.estado,
        created: new Date(),
        modified: new Date(),
      },
    }).catch(() => {
      // Si falla por nombre duplicado, ignorar
      console.log(`Estado civil ${estado.nombre} ya existe`);
    });
  }

  console.log('✅ Seed completado');
}

seedCatalogos()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error('Error:', error);
    prisma.$disconnect();
    process.exit(1);
  });
