const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const estados = await prisma.estado.findMany({
    where: { estado: true },
    orderBy: { id: 'asc' }
  });
  console.log('Estados en la base de datos:');
  console.table(estados);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
