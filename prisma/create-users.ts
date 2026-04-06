import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      nome: 'Lucas Carvalho',
      matricula: '116221',
      senha: 'Mudar@116221',
      role: 'ADMINISTRADOR',
      email: 'lucas.carvalho@stockpro.com.br'
    },
    {
      nome: 'BRENO RIBEIRO BAFA',
      matricula: '116595',
      senha: 'Mudar@116595',
      role: 'ESTOQUISTA',
      email: 'breno.bafa@stockpro.com.br'
    }
  ];

  for (const u of users) {
    const hashedSenha = await bcrypt.hash(u.senha, 10);
    const existing = await prisma.user.findUnique({ where: { matricula: u.matricula } });

    if (existing) {
      await prisma.user.update({
        where: { matricula: u.matricula },
        data: { nome: u.nome, role: u.role as any, senha: hashedSenha }
      });
      console.log(`Usuário atualizado: ${u.nome} (Matrícula: ${u.matricula})`);
    } else {
      await prisma.user.create({
        data: {
          nome: u.nome,
          matricula: u.matricula,
          email: u.email,
          senha: hashedSenha,
          role: u.role as any,
          ativo: true
        }
      });
      console.log(`Usuário criado: ${u.nome} (Matrícula: ${u.matricula})`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
