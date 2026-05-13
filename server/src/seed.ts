import prisma from './utils/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@timetracker.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@timetracker.com',
      password,
      role: 'admin',
      verified: true,
    },
  });

  const tech = await prisma.user.upsert({
    where: { email: 'tech@timetracker.com' },
    update: {},
    create: {
      name: 'Técnico',
      email: 'tech@timetracker.com',
      password,
      role: 'tech',
      verified: true,
    },
  });

  console.log('Seed completado');
  console.log(`Admin: admin@timetracker.com / admin123`);
  console.log(`Técnico: tech@timetracker.com / admin123`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
