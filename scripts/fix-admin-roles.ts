import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAdminRoles() {
  try {
    console.log('🔍 Verificando roles do admin...\n');

    // Buscar usuário admin
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@alldev.com' },
      include: {
        roles: true,
      },
    });

    if (!admin) {
      console.log('❌ Usuário admin não encontrado!');
      return;
    }

    console.log(`✅ Admin encontrado: ${admin.username} (${admin.email})`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   Roles atuais: ${admin.roles.map(r => r.role).join(', ') || 'NENHUMA'}\n`);

    // Verificar se tem role ADMIN
    const hasAdminRole = admin.roles.some(r => r.role === Role.ADMIN);

    if (hasAdminRole) {
      console.log('✅ Usuário já possui role ADMIN!');
    } else {
      console.log('⚠️  Usuário NÃO possui role ADMIN. Adicionando...');
      
      await prisma.userRole.create({
        data: {
          userId: admin.id,
          role: Role.ADMIN,
        },
      });

      console.log('✅ Role ADMIN adicionada com sucesso!');
    }

    // Verificar novamente
    const updatedAdmin = await prisma.user.findUnique({
      where: { email: 'admin@alldev.com' },
      include: {
        roles: true,
      },
    });

    console.log('\n📊 Roles finais:');
    updatedAdmin?.roles.forEach(r => {
      console.log(`   - ${r.role}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminRoles();

