-- =============================================================
-- StockPRO – Schema SQL para Supabase (SQL Editor)
-- Gerado a partir do prisma/schema.prisma
-- =============================================================

-- -------------------------------------------------------------
-- 1. ENUMS
-- -------------------------------------------------------------
CREATE TYPE "UserRole"        AS ENUM ('ESTOQUISTA', 'LIDER', 'ADMINISTRADOR');
CREATE TYPE "MovementType"    AS ENUM ('ENTRADA', 'SAIDA');
CREATE TYPE "AlertStatus"     AS ENUM ('ATIVO', 'RESOLVIDO');
CREATE TYPE "InventoryStatus" AS ENUM ('EM_ANDAMENTO', 'CONCLUIDO');
CREATE TYPE "NfStatus"        AS ENUM ('ABERTA', 'BAIXADA', 'PARCIAL');
CREATE TYPE "LogAction"       AS ENUM (
  'LOGIN', 'LOGOUT',
  'PRODUTO_CRIADO', 'PRODUTO_EDITADO',
  'ENTRADA_REGISTRADA', 'SAIDA_REGISTRADA',
  'NF_EMITIDA', 'NF_BAIXADA', 'NF_PARCIAL',
  'INVENTARIO_INICIADO', 'INVENTARIO_FINALIZADO',
  'ALERTA_GERADO', 'ALERTA_RESOLVIDO',
  'USUARIO_CRIADO', 'USUARIO_EDITADO',
  'FORNECEDOR_CRIADO', 'FORNECEDOR_EDITADO',
  'CLIENTE_CRIADO', 'CLIENTE_EDITADO'
);

-- -------------------------------------------------------------
-- 2. TABELAS (sem dependências primeiro)
-- -------------------------------------------------------------

-- users
CREATE TABLE users (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  matricula   TEXT        NOT NULL UNIQUE,
  nome        TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  senha       TEXT        NOT NULL,
  role        "UserRole"  NOT NULL DEFAULT 'ESTOQUISTA',
  ativo       BOOLEAN     NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- clientes
CREATE TABLE clientes (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nome        TEXT        NOT NULL UNIQUE,
  cnpj        TEXT,
  email       TEXT,
  telefone    TEXT,
  contato     TEXT,
  ativo       BOOLEAN     NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- suppliers
CREATE TABLE suppliers (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  nome        TEXT        NOT NULL,
  cnpj        TEXT        UNIQUE,
  email       TEXT,
  telefone    TEXT,
  contato     TEXT,
  ativo       BOOLEAN     NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- products
CREATE TABLE products (
  id                TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  codigo            TEXT        NOT NULL UNIQUE,
  nome              TEXT        NOT NULL,
  modelo            TEXT        NOT NULL DEFAULT '-',
  descricao         TEXT,
  unidade           TEXT        NOT NULL DEFAULT 'un',
  quantidade        INTEGER     NOT NULL DEFAULT 0,
  "quantidadeMinima" INTEGER    NOT NULL DEFAULT 0,
  "supplierId"      TEXT        REFERENCES suppliers(id),
  "clienteId"       TEXT        REFERENCES clientes(id),
  ativo             BOOLEAN     NOT NULL DEFAULT TRUE,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- notas_fiscais_clientes
CREATE TABLE notas_fiscais_clientes (
  id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  numero        TEXT        NOT NULL,
  "clienteId"   TEXT        NOT NULL REFERENCES clientes(id),
  "userId"      TEXT        NOT NULL REFERENCES users(id),
  status        "NfStatus"  NOT NULL DEFAULT 'ABERTA',
  observacao    TEXT,
  "dataEmissao" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "dataBaixa"   TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- movements
CREATE TABLE movements (
  id           TEXT           PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  type         "MovementType" NOT NULL,
  quantidade   INTEGER        NOT NULL,
  "notaFiscal" TEXT,
  observacao   TEXT,
  "productId"  TEXT           NOT NULL REFERENCES products(id),
  "userId"     TEXT           NOT NULL REFERENCES users(id),
  "nfId"       TEXT           REFERENCES notas_fiscais_clientes(id),
  "createdAt"  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- nf_items
CREATE TABLE nf_items (
  id                  TEXT    PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "nfId"              TEXT    NOT NULL REFERENCES notas_fiscais_clientes(id),
  "productId"         TEXT    NOT NULL REFERENCES products(id),
  quantidade          INTEGER NOT NULL,
  "quantidadeBaixada" INTEGER NOT NULL DEFAULT 0,
  observacao          TEXT
);

-- inventories
CREATE TABLE inventories (
  id             TEXT               PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  responsavel    TEXT               NOT NULL,
  matricula      TEXT               NOT NULL,
  status         "InventoryStatus"  NOT NULL DEFAULT 'EM_ANDAMENTO',
  "userId"       TEXT               NOT NULL REFERENCES users(id),
  "iniciadoEm"   TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  "finalizadoEm" TIMESTAMPTZ
);

-- inventory_items
CREATE TABLE inventory_items (
  id                   TEXT    PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "inventoryId"        TEXT    NOT NULL REFERENCES inventories(id),
  "productId"          TEXT    NOT NULL REFERENCES products(id),
  "quantidadeContada"  INTEGER NOT NULL DEFAULT 0,
  "quantidadeSistema"  INTEGER NOT NULL,
  divergencia          INTEGER NOT NULL DEFAULT 0,
  conferido            BOOLEAN NOT NULL DEFAULT FALSE,
  observacao           TEXT
);

-- alerts
CREATE TABLE alerts (
  id                TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "productId"       TEXT          NOT NULL REFERENCES products(id),
  "quantidadeAtual" INTEGER       NOT NULL,
  "quantidadeMinima" INTEGER      NOT NULL,
  status            "AlertStatus" NOT NULL DEFAULT 'ATIVO',
  "resolvidoEm"     TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- logs
CREATE TABLE logs (
  id           TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  action       "LogAction"   NOT NULL,
  descricao    TEXT          NOT NULL,
  entidade     TEXT,
  "entidadeId" TEXT,
  "ipAddress"  TEXT,
  "userId"     TEXT          REFERENCES users(id),
  "createdAt"  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 3. TRIGGER para atualizar "updatedAt" automaticamente
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_nfc_updated_at
  BEFORE UPDATE ON notas_fiscais_clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_alerts_updated_at
  BEFORE UPDATE ON alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
