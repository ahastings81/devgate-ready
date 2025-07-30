import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const result = await prisma.project.updateMany({
    where: {
      completedAt: { not: null }
    },
    data: {
      completed: true
    }
  });
  console.log(`Backfilled ${result.count} projects as completed.`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
