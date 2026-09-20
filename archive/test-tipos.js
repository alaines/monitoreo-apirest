const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testeando query de tipos...');
    
    // Test 1: Query simple
    const tipos = await prisma.tipo.findMany({
      orderBy: [{ lft: 'asc' }],
    });
    console.log(`✓ Query simple exitosa: ${tipos.length} tipos encontrados`);
    
    // Test 2: Verificar usuario
    const user = await prisma.user.findUnique({
      where: { id: 1 },
    });
    console.log(`✓ Usuario encontrado: ${user?.usuario}, grupo: ${user?.grupoId}`);
    
    // Test 3: Verificar permiso
    const permiso = await prisma.grupoMenu.findFirst({
      where: {
        grupoId: user.grupoId,
        menu: {
          codigo: 'catalogos',
        },
        accion: {
          codigo: 'view',
        },
      },
    });
    console.log(`✓ Permiso encontrado: ${permiso ? 'SÍ' : 'NO'}`);
    
    if (!permiso) {
      // Investigar más
      const menu = await prisma.menu.findFirst({
        where: { codigo: 'catalogos' },
      });
      console.log(`  Menu catalogos:`, menu);
      
      const accion = await prisma.accion.findFirst({
        where: { codigo: 'view' },
      });
      console.log(`  Accion view:`, accion);
      
      const permisos = await prisma.grupoMenu.findMany({
        where: {
          grupoId: user.grupoId,
        },
        include: {
          menu: true,
          accion: true,
        },
        take: 5,
      });
      console.log(`  Primeros 5 permisos del grupo:`, JSON.stringify(permisos, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

test();
