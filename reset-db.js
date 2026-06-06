const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Wiping all data from the database...");
  
  // Delete in order to respect foreign key constraints
  const workLogs = await prisma.workLog.deleteMany({});
  console.log(`Deleted ${workLogs.count} work logs.`);
  
  const history = await prisma.historySnapshot.deleteMany({});
  console.log(`Deleted ${history.count} history snapshots.`);
  
  const employees = await prisma.employee.deleteMany({});
  console.log(`Deleted ${employees.count} employees.`);
  
  const users = await prisma.user.deleteMany({});
  console.log(`Deleted ${users.count} users (including admins).`);
  
  console.log("Database wipe complete! It is now 100% fresh.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
