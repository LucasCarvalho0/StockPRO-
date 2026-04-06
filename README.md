# StockPRO VPC — Sistema de Estoque + NF de Clientes

Sistema fullstack Next.js baseado na planilha **Controle_de_Estoque_VPC-_BASE_.xlsm**,
com módulo completo de **Nota Fiscal de Cliente** (baixa de estoque por NF).

---

## Novidades em relação à versão base

### Módulo NF de Clientes (`/nf`)
- **Emissão de NF**: registra uma NF de saída com cliente, número, itens e quantidades
- **Baixa total**: dá baixa em todos os itens pendentes de uma vez
- **Baixa parcial**: informa quantidade por item — gera status `PARCIAL`
- **Validação de estoque**: impede baixa se não houver saldo
- **Rastreabilidade**: cada baixa gera um `Movement` do tipo `SAIDA` vinculado à NF
- **Alertas automáticos**: após baixa, verifica se produto ficou abaixo do mínimo

### Módulo de Clientes (`/clientes`)
- Cadastro dos 11 clientes da planilha
- Vínculo produto ↔ cliente
- Filtro de estoque e produtos por cliente

### Estoque atualizado
- Coluna **Modelo** (Kicks, Frontier, Leaf, etc.)
- Coluna **Cliente** com badge colorido
- Filtro por cliente
- 146 produtos importados da planilha VPC

### Banco de dados atualizado (Prisma)
```
Cliente           — clientes da planilha
NotaFiscalCliente — NFs emitidas (ABERTA / PARCIAL / BAIXADA)
NfItem            — itens de cada NF com quantidade e baixada
Movement.nfId     — movimentos vinculados a NFs
```

---

## Setup

```bash
npm install
cp .env.example .env
# Configure DATABASE_URL e JWT_SECRET

npm run db:migrate
npm run db:seed     # importa os 146 produtos + 11 clientes da planilha

npm run dev
# http://localhost:3000
```

## Credenciais

| Perfil        | Matrícula | Senha      |
|---------------|-----------|------------|
| Administrador | `0001`    | `admin123` |
| Líder         | `0002`    | `senha123` |
| Estoquista    | `4821`    | `senha123` |

---

## Fluxo da NF de Cliente

```
1. Acesse /nf → "Nova NF"
2. Informe número da NF, cliente e itens com quantidades
3. NF criada com status ABERTA
4. Clique "Baixar NF"
5. Ajuste as quantidades por item (ou deixe no máximo)
6. Confirmar Baixa:
   → Deduz estoque de cada produto
   → Registra Movement SAIDA para cada item
   → NF vira BAIXADA (total) ou PARCIAL
   → Gera alertas automáticos se necessário
```

## API Routes novas

| Método | Rota                     | Descrição                          |
|--------|--------------------------|------------------------------------|
| GET    | /api/clientes            | Listar clientes                    |
| POST   | /api/clientes            | Criar cliente                      |
| PATCH  | /api/clientes/[id]       | Editar cliente                     |
| GET    | /api/nf                  | Listar NFs (filtro status/cliente) |
| POST   | /api/nf                  | Emitir nova NF                     |
| GET    | /api/nf/[id]             | Detalhe da NF                      |
| PATCH  | /api/nf/[id]/baixar      | **Realizar baixa de estoque**      |
