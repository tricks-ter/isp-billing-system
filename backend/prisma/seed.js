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

  // Create sample OLTs (BDCOM and ECOM)
  const bdcomOlt = await prisma.olt.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'BDCOM Core OLT - Main POP',
      brand: 'BDCOM',
      ponType: 'EPON',
      ipAddress: '192.168.10.20',
      snmpCommunity: 'public',
      snmpPort: 161,
      cliProtocol: 'TELNET',
      cliPort: 23,
      username: 'admin',
      password: 'adminpassword',
      enablePassword: 'enablepassword',
      ponPortCount: 4,
      uplinkPortCount: 2,
      location: 'Central Server Room, Rack A1',
      hardwareModel: 'BDCOM P3310D-2AC',
      firmwareVersion: '10.1.0E Build 78521',
      uptime: '42 days, 14 hours',
      cpuUsage: 14.5,
      temperature: 39.0,
      status: 'ONLINE',
      isMock: true,
      isActive: true,
    },
  });

  const ecomOlt = await prisma.olt.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'ECOM Branch OLT - North Zone',
      brand: 'ECOM',
      ponType: 'EPON',
      ipAddress: '192.168.20.20',
      snmpCommunity: 'public',
      snmpPort: 161,
      cliProtocol: 'TELNET',
      cliPort: 23,
      username: 'admin',
      password: 'ecomadmin123',
      ponPortCount: 8,
      uplinkPortCount: 2,
      location: 'North Sub-station POP',
      hardwareModel: 'ECOM-EPON-8P',
      firmwareVersion: 'V3.2.1_R2108',
      uptime: '28 days, 06 hours',
      cpuUsage: 11.2,
      temperature: 37.5,
      status: 'ONLINE',
      isMock: true,
      isActive: true,
    },
  });

  // Create PON Ports for BDCOM
  for (let p = 1; p <= 4; p++) {
    await prisma.ponPort.upsert({
      where: { oltId_portNumber: { oltId: 1, portNumber: p } },
      update: {},
      create: {
        oltId: 1,
        portNumber: p,
        portName: `EPON0/${p}`,
        adminStatus: 'UP',
        operStatus: 'UP',
        maxOnus: 64,
        sfpModel: 'EPON-OLT-PX20+++',
        txPower: 4.5,
        temperature: 41.5,
        voltage: 3.3,
        current: 13.8,
        description: `BDCOM Distribution PON ${p}`,
      },
    });
  }

  // Create PON Ports for ECOM
  for (let p = 1; p <= 8; p++) {
    await prisma.ponPort.upsert({
      where: { oltId_portNumber: { oltId: 2, portNumber: p } },
      update: {},
      create: {
        oltId: 2,
        portNumber: p,
        portName: `EPON0/${p}`,
        adminStatus: 'UP',
        operStatus: 'UP',
        maxOnus: 64,
        sfpModel: 'ECOM-PX20+',
        txPower: 4.2,
        temperature: 39.5,
        voltage: 3.3,
        current: 13.2,
        description: `ECOM Feeder PON ${p}`,
      },
    });
  }

  console.log('✅ Seed complete:', { admin: admin.username, packages: packages.length, olts: [bdcomOlt.name, ecomOlt.name] });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());