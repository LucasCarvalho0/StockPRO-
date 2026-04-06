import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const keepers = ['116221', '116595'];
  
  console.log(`🧹 Iniciando limpeza de usuários exceto: ${keepers.join(', ')}`);
  
  const deleted = await prisma.user.deleteMany({
    where: {
      matricula: { notIn: keepers }
    }
  });

  console.log(`✅ Limpeza concluída: ${deleted.count} usuários removidos.`);
  
  const remaining = await prisma.user.findMany({ select: { nome: true, matricula: true, role: true } });
  console.log('👥 Usuários restantes:', remaining);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
