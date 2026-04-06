import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, serverError } from '@/lib/auth';
import ExcelJS from 'exceljs';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const products = await prisma.product.findMany({
      where: { ativo: true },
      include: { supplier: { select: { nome: true } } },
      orderBy: { nome: 'asc' },
    });

    const now = new Date();
    const labelDate = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const labelTime = String(now.getHours()).padStart(2, '0') + '-' + String(now.getMinutes()).padStart(2, '0');
    const filename = `posicao_estoque_${labelDate}_${labelTime}.xlsx`;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'StockPRO';
    const sheet = workbook.addWorksheet('Posição de Estoque');

    // Cabeçalho Principal
    sheet.mergeCells('A1:G1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'STOCKPRO — RELATÓRIO DE POSIÇÃO DE ESTOQUE ATUAL';
    titleCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 25;

    sheet.columns = [
      { header: 'CÓDIGO', key: 'codigo', width: 15 },
      { header: 'PRODUTO', key: 'nome', width: 40 },
      { header: 'FORNECEDOR', key: 'fornecedor', width: 25 },
      { header: 'QUANTIDADE', key: 'quantidade', width: 15 },
      { header: 'ESTOQUE MÍNIMO', key: 'minima', width: 18 },
      { header: 'UNIDADE', key: 'unidade', width: 12 },
      { header: 'SITUAÇÃO', key: 'status', width: 15 },
    ];

    sheet.getRow(2).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(2).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
      cell.alignment = { horizontal: 'center' };
    });

    for (const p of products) {
      const isCritical = p.quantidade <= (p.quantidadeMinima ?? 0);
      const status = isCritical ? 'CRÍTICO' : 'NORMAL';
      const row = sheet.addRow({
        codigo: p.codigo,
        nome: p.nome,
        fornecedor: p.supplier?.nome ?? 'S/ FORNECEDOR',
        quantidade: p.quantidade,
        minima: p.quantidadeMinima,
        unidade: p.unidade,
        status,
      });

      row.eachCell((cell) => {
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
          cell.alignment = { vertical: 'middle' };
      });

      if (isCritical) {
        row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
        row.getCell('status').font = { color: { argb: 'FFDC2626' }, bold: true };
        row.getCell('status').alignment = { horizontal: 'center' };
        row.getCell('quantidade').font = { color: { argb: 'FFDC2626' }, bold: true };
      } else {
        row.getCell('status').alignment = { horizontal: 'center' };
      }
    }

    sheet.addRow([]);
    const footer = sheet.addRow([`Relatório gerado em ${now.toLocaleString('pt-BR')} — StockPRO Gestão de Ativos`]);
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

