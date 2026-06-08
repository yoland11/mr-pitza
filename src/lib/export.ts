'use client';

/** أدوات تصدير مشتركة (CSV / JSON) — تعمل في المتصفح */

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function toCSV(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  // ‏﻿ لدعم العربية في Excel
  return '﻿' + [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n');
}

export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  downloadBlob(new Blob([toCSV(headers, rows)], { type: 'text/csv;charset=utf-8;' }), filename);
}

export function downloadJSON(filename: string, data: unknown) {
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), filename);
}
