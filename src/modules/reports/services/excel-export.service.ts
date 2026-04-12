import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';

export interface ExcelColumn<T> {
  header: string;
  key: keyof T & string;
  width?: number;
  format?: (value: unknown) => string | number | Date;
}

/**
 * ExcelExportService (Sprint 15).
 *
 * Thin wrapper around ExcelJS that produces a single-sheet workbook
 * and returns it as a Buffer. Controllers stream the buffer as an
 * application/vnd.openxmlformats response.
 */
@Injectable()
export class ExcelExportService {
  async buildSheet<T extends Record<string, unknown>>(
    sheetName: string,
    columns: ExcelColumn<T>[],
    rows: T[],
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EBusatis';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = columns.map((c) => ({
      header: c.header,
      key: c.key,
      width: c.width ?? 20,
    }));
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { horizontal: 'center' };

    for (const row of rows) {
      const mapped: Record<string, unknown> = {};
      for (const c of columns) {
        const raw = row[c.key];
        mapped[c.key] = c.format ? c.format(raw) : (raw as unknown);
      }
      sheet.addRow(mapped);
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer as ArrayBuffer);
  }
}
