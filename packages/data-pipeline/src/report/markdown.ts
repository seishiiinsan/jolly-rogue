/** Tableaux Markdown du rapport. */

export const cell = (value: unknown): string =>
  String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

export function table(headers: string[], rows: unknown[][]): string {
  if (rows.length === 0) return '_Aucun._\n';
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`),
  ].join('\n') + '\n';
}
