import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin(matricula: string, senha: string) {
  console.log(`Testando login para matrícula: ${matricula}`);
  const user = await prisma.user.findUnique({ where: { matricula } });
  
  if (!user) {
    console.error('ERRO: Usuário não encontrado no banco de dados!');
    return;
  }
  
  console.log(`Usuário encontrado: ${user.nome} (Ativo: ${user.ativo}, Role: ${user.role})`);
  
  const senhaValida = await bcrypt.compare(senha, user.senha);
  if (senhaValida) {
    console.log('SUCESSO: Senha válida!');
  } else {
    console.error('ERRO: Senha inválida!');
    // Log hashed password in DB for comparison if needed (careful with security, but this is a debug script)
    // console.log('Hashed no DB:', user.senha);
  }
}

async function main() {
  await testLogin('116221', 'Mudar@116221');
  console.log('---');
  await testLogin('116595', 'Mudar@116595');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
