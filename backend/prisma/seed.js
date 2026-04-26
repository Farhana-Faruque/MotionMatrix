const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Checking if admin user exists...');

    // Only create admin if it doesn't exist - NO DATA DELETION
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@gmail.com' }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin1234', 10);
      
      console.log('👤 Creating admin user...');
      const adminUser = await prisma.user.create({
        data: {
          name: 'Admin',
          email: 'admin@gmail.com',
          password: hashedPassword,
          role: 'ADMIN',
          status: 'active'
        }
      });

      console.log('✅ Admin user created:');
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Password: admin1234`);
      console.log(`   Role: ${adminUser.role}`);
    } else {
      console.log('✅ Admin user already exists - preserving all existing data');
    }

    console.log('\n🎉 Database ready! Using your real data.');
  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
