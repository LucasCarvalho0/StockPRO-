import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized, notFound, serverError } from '@/lib/auth';
import PDFDocument from 'pdfkit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return unauthorized();

    const inventory = await prisma.inventory.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: { product: { select: { codigo: true, nome: true, unidade: true } } },
          orderBy: { product: { nome: 'asc' } },
        },
      },
    });

    if (!inventory) return notFound('Inventário não encontrado');

    // Nomenclatura do arquivo: inventario_DD-MM-YYYY_HH-mm.pdf
    const date = new Date(inventory.finalizadoEm || inventory.iniciadoEm);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const filename = `inventario_${day}-${month}-${year}_${hours}-${minutes}.pdf`;

    return new Promise<Response>((resolve) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 40 });

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(
          new Response(buffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${filename}"`,
            },
          }),
        );
      });

      // --- Estilos e Utilitários ---
      const colors = {
        primary: '#1e293b',
        success: '#059669',
        danger: '#dc2626',
        neutral: '#64748b',
        border: '#e2e8f0',
      };

      const drawLine = (yPos: number) => {
        doc.moveTo(40, yPos).lineTo(555, yPos).strokeColor(colors.border).lineWidth(0.5).stroke();
      };

      // --- Header ---
      doc.fontSize(16).font('Helvetica-Bold').fillColor(colors.primary).text('StockPRO — Relatório de Inventário', { align: 'center' });
      doc.moveDown(0.5);
      
      const headerY = doc.y;
      doc.fontSize(9).font('Helvetica').fillColor(colors.neutral);
      doc.text(`Responsável: `, 40, headerY, { continued: true }).font('Helvetica-Bold').fillColor(colors.primary).text(inventory.responsavel, { continued: true })
         .font('Helvetica').fillColor(colors.neutral).text(`   |   Matrícula: `, { continued: true }).font('Helvetica-Bold').fillColor(colors.primary).text(inventory.matricula);
      
      doc.text(`Data/Hora: `, 40, doc.y, { continued: true }).font('Helvetica-Bold').fillColor(colors.primary).text(new Date(inventory.iniciadoEm).toLocaleString('pt-BR'), { continued: true })
         .font('Helvetica').fillColor(colors.neutral).text(`   |   Status: `, { continued: true }).font('Helvetica-Bold')
         .fillColor(inventory.status === 'CONCLUIDO' ? colors.success : colors.danger).text(inventory.status === 'CONCLUIDO' ? 'CONCLUÍDA' : 'EM ANDAMENTO');

      doc.moveDown(1.5);
      drawLine(doc.y);
      doc.moveDown(0.5);

      let y = doc.y;

      const renderSectionHeader = (title: string, color: string) => {
        if (y > 720) { doc.addPage(); y = 40; }
        doc.rect(40, y, 515, 18).fill(color);
        doc.fillColor('white').font('Helvetica-Bold').fontSize(9).text(title, 45, y + 5);
        y += 25;
        renderTableHeaders();
      };

      // Colunas: [Status (25), Código (85), Produto (175), Qtd Sist (70), Qtd Cont (80), Diverg (80)]
      const colWidths = [25, 80, 180, 75, 75, 80];
      const colOffsets = [40, 65, 145, 325, 400, 475];

      const renderTableHeaders = () => {
        doc.font('Helvetica-Bold').fontSize(8).fillColor(colors.neutral);
        const headers = ['St', 'Código', 'Produto', 'Qtd Sistema', 'Qtd Contada', 'Divergência'];
        headers.forEach((h, i) => {
          doc.text(h, colOffsets[i], y, { width: colWidths[i] });
        });
        y += 12;
        drawLine(y);
        y += 8;
      };

      const renderRow = (item: any) => {
        const textHeights = [
          doc.heightOfString(item.product.codigo, { width: colWidths[1] }),
          doc.heightOfString(item.product.nome, { width: colWidths[2] })
        ];
        const rowHeight = Math.max(...textHeights, 14) + 8; // Altura dinâmica

        if (y + rowHeight > 780) { 
          doc.addPage(); 
          y = 40; 
          renderTableHeaders(); 
        }

        // Desenhar indicador de status (Círculo colorido)
        const statusColor = item.conferido ? (item.divergencia === 0 ? colors.success : colors.danger) : colors.neutral;
        doc.circle(52, y + 5, 4).fill(statusColor);

        doc.fillColor(colors.primary).font('Helvetica').fontSize(8);
        doc.text(item.product.codigo, colOffsets[1], y, { width: colWidths[1] });
        doc.text(item.product.nome, colOffsets[2], y, { width: colWidths[2] });
        doc.text(`${item.quantidadeSistema} ${item.product.unidade}`, colOffsets[3], y, { width: colWidths[3] });
        
        if (item.conferido) {
          doc.text(`${item.quantidadeContada} ${item.product.unidade}`, colOffsets[4], y, { width: colWidths[4] });
          const divColor = item.divergencia < 0 ? colors.danger : (item.divergencia > 0 ? '#b45309' : colors.success);
          doc.fillColor(divColor).font('Helvetica-Bold').text(`${item.divergencia > 0 ? '+' : ''}${item.divergencia}`, colOffsets[5], y, { width: colWidths[5] });
        } else {
          doc.fillColor(colors.neutral).text('PENDENTE', colOffsets[4], y, { width: colWidths[4] });
          doc.text('-', colOffsets[5], y, { width: colWidths[5] });
        }

        y += rowHeight;
        drawLine(y - 4);
        y += 4;
      };

      // Separação de dados
      const divergentes = inventory.items.filter(item => item.conferido && item.divergencia !== 0);
      const sincronizados = inventory.items.filter(item => item.conferido && item.divergencia === 0);
      const naoAuditados = inventory.items.filter(item => !item.conferido);

      if (divergentes.length > 0) {
        renderSectionHeader('DIVERGÊNCIAS DETECTADAS (FALTA / SOBRA)', colors.danger);
        divergentes.forEach(renderRow);
      }

      if (sincronizados.length > 0) {
        renderSectionHeader('ITENS SINCRONIZADOS (QUANTIDADE OK)', colors.success);
        sincronizados.forEach(renderRow);
      }

      if (naoAuditados.length > 0) {
        renderSectionHeader('ITENS NÃO AUDITADOS', colors.neutral);
        naoAuditados.forEach(renderRow);
      }

      doc.moveDown(2);
      doc.fontSize(7).fillColor(colors.neutral).text(`Este documento é uma auditoria oficial de estoque gerada eletronicamente pelo StockPRO.`, { align: 'center' });
      doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
      
      doc.end();
    });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
