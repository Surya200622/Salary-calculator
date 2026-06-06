const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("All users:", users);
  
  const deleted = await prisma.user.deleteMany({
    where: { role: 'admin' }
  });
  console.log(`Deleted ${deleted.count} admins.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
