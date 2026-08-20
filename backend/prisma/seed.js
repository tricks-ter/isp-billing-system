const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Hash the default admin password
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create default admin user
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      fullName: 'System Administrator',
      role: 'ADMIN',
    },
  });

  // Create sample packages
  const packages = await Promise.all([
    prisma.package.upsert({
      where: { id: 1 },
      update: {},
      create: { name: 'Home Basic', speed: '10 Mbps', price: 500, validity: 30 },
    }),
    prisma.package.upsert({
      where: { id: 2 },
      update: {},
      create: { name: 'Home Standard', speed: '20 Mbps', price: 1000, validity: 30 },
    }),
    prisma.package.upsert({
      where: { id: 3 },
      update: {},
      create: { name: 'Home Premium', speed: '50 Mbps', price: 2000, validity: 30 },
    }),
  ]);

  console.log('✅ Seed complete:', { admin: admin.username, packages: packages.length });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());