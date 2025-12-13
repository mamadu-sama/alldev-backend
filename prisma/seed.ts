import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Criar admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@alldev.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@alldev.com',
      passwordHash: adminPassword,
      isVerified: true,
      reputation: 1000,
      level: 'GURU',
      bio: 'Administrador da plataforma Alldev',
      skills: ['JavaScript', 'TypeScript', 'Node.js', 'React', 'PostgreSQL'],
      roles: {
        create: { role: Role.ADMIN },
      },
    },
  });

  console.log('✅ Admin user created:', admin.username);

  // Criar moderador
  const moderatorPassword = await bcrypt.hash('moderator123', 10);
  const moderator = await prisma.user.upsert({
    where: { email: 'moderator@alldev.com' },
    update: {},
    create: {
      username: 'moderator',
      email: 'moderator@alldev.com',
      passwordHash: moderatorPassword,
      isVerified: true,
      reputation: 500,
      level: 'EXPERT',
      bio: 'Moderador da comunidade Alldev',
      skills: ['JavaScript', 'React', 'Node.js'],
      roles: {
        create: { role: Role.MODERATOR },
      },
    },
  });

  console.log('✅ Moderator user created:', moderator.username);

  // Criar utilizador normal para testes
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@alldev.com' },
    update: {},
    create: {
      username: 'testuser',
      email: 'user@alldev.com',
      passwordHash: userPassword,
      isVerified: true,
      reputation: 150,
      level: 'CONTRIBUIDOR',
      bio: 'Utilizador de teste da plataforma',
      skills: ['JavaScript', 'HTML', 'CSS'],
      roles: {
        create: { role: Role.USER },
      },
    },
  });

  console.log('✅ Test user created:', user.username);

  // Criar tags iniciais
  const tags = [
    {
      name: 'JavaScript',
      slug: 'javascript',
      description: 'Linguagem de programação para web',
    },
    {
      name: 'TypeScript',
      slug: 'typescript',
      description: 'Superset tipado do JavaScript',
    },
    {
      name: 'React',
      slug: 'react',
      description: 'Biblioteca para construção de interfaces',
    },
    {
      name: 'Node.js',
      slug: 'nodejs',
      description: 'Runtime JavaScript no servidor',
    },
    {
      name: 'Python',
      slug: 'python',
      description: 'Linguagem versátil e fácil de aprender',
    },
    {
      name: 'PostgreSQL',
      slug: 'postgresql',
      description: 'Base de dados relacional robusta',
    },
    {
      name: 'Docker',
      slug: 'docker',
      description: 'Plataforma de containerização',
    },
    { name: 'Git', slug: 'git', description: 'Sistema de controlo de versão' },
    {
      name: 'Express',
      slug: 'express',
      description: 'Framework web para Node.js',
    },
    {
      name: 'Prisma',
      slug: 'prisma',
      description: 'ORM moderno para TypeScript e Node.js',
    },
    {
      name: 'Tailwind CSS',
      slug: 'tailwindcss',
      description: 'Framework CSS utility-first',
    },
    {
      name: 'Next.js',
      slug: 'nextjs',
      description: 'Framework React para produção',
    },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }

  console.log('✅ Tags created:', tags.length);

  // Configuração inicial de manutenção
  await prisma.maintenanceMode.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      isEnabled: false,
    },
  });

  console.log('✅ Maintenance mode configuration created');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Credentials for testing:');
  console.log('Admin - Email: admin@alldev.com, Password: admin123');
  console.log('Moderator - Email: moderator@alldev.com, Password: moderator123');
  console.log('User - Email: user@alldev.com, Password: user123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

