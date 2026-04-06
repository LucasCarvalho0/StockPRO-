import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, serverError, notFound } from '@/lib/auth';
import ExcelJS from 'exceljs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const inv = await prisma.inventory.findUnique({
      where: { id: params.id },
      include: {
        items: { include: { product: { select: { codigo: true, nome: true, unidade: true } } } },
      },
    });

    if (!inv) return notFound();

    const date = new Date(inv.finalizadoEm || inv.iniciadoEm);
    const labelDate = date.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const labelTime = String(date.getHours()).padStart(2, '0') + '-' + String(date.getMinutes()).padStart(2, '0');
    const filename = `inventario_${labelDate}_${labelTime}.xlsx`;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'StockPRO';
    const sheet = workbook.addWorksheet(`Inventário ${labelDate}`);

    // Estilo de Cabeçalho Superior
    sheet.mergeCells('A1:G1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'STOCKPRO — RELATÓRIO OFICIAL DE INVENTÁRIO';
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    sheet.addRow(['Responsável:', inv.responsavel, '', 'Matrícula:', inv.matricula]);
    sheet.addRow(['Início:', new Date(inv.iniciadoEm).toLocaleString('pt-BR'), '', 'Fim:', inv.finalizadoEm ? new Date(inv.finalizadoEm).toLocaleString('pt-BR') : 'EM ANDAMENTO']);
    sheet.addRow([]);

    // Tabela Header
    const headerRow = sheet.addRow(['SITUAÇÃO', 'CÓDIGO', 'PRODUTO', 'QTD SISTEMA', 'QTD CONTADA', 'DIVERGÊNCIA', 'UNIDADE']);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      cell.alignment = { horizontal: 'center' };
    });

    sheet.columns = [
      { key: 'situacao', width: 15 },
      { key: 'codigo', width: 15 },
      { key: 'produto', width: 40 },
      { key: 'sistema', width: 15 },
      { key: 'contada', width: 15 },
      { key: 'diverg', width: 15 },
      { key: 'unidade', width: 10 },
    ];

    const addSectionHeader = (title: string, color: string) => {
      const row = sheet.addRow([title]);
      row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
      sheet.mergeCells(row.number, 1, row.number, 7);
      row.alignment = { horizontal: 'center' };
    };

    const addItems = (items: typeof inv.items, sectionLabel: string) => {
      for (const item of items) {
        const row = sheet.addRow({
          situacao: sectionLabel,
          codigo: item.product.codigo,
          produto: item.product.nome,
          sistema: item.quantidadeSistema,
          contada: item.conferido ? item.quantidadeContada : 'PENDENTE',
          diverg: item.conferido ? item.divergencia : '-',
          unidade: item.product.unidade,
        });

        row.eachCell((cell) => {
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
          cell.alignment = { vertical: 'middle' };
        });

        if (item.conferido && item.divergencia !== 0) {
          row.getCell(6).font = { color: { argb: 'FFDC2626' }, bold: true };
          row.getCell(1).font = { color: { argb: 'FFDC2626' }, bold: true };
        }
      }
    };

    const divergentes = inv.items.filter(item => item.conferido && item.divergencia !== 0);
    const sincronizados = inv.items.filter(item => item.conferido && item.divergencia === 0);
    const naoConferidos = inv.items.filter(item => !item.conferido);

    if (divergentes.length > 0) {
      addSectionHeader('DIVERGÊNCIAS DETECTADAS', 'FFDC2626');
      addItems(divergentes, 'DIVERGENTE');
    }

    if (sincronizados.length > 0) {
      addSectionHeader('ITENS SINCRONIZADOS (OK)', 'FF059669');
      addItems(sincronizados, 'OK');
    }

    if (naoConferidos.length > 0) {
      addSectionHeader('ITENS NÃO AUDITADOS', 'FF64748B');
      addItems(naoConferidos, 'PENDENTE');
    }

    sheet.addRow([]);
    const footer = sheet.addRow([`Relatório gerado em ${new Date().toLocaleString('pt-BR')} — Auditoria StockPRO`]);
    footer.font = { italic: true, size: 8, color: { argb: 'FF64748B' } };
    sheet.mergeCells(footer.number, 1, footer.number, 7);

    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}

