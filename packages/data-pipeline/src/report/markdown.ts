/** Tableaux Markdown du rapport. */

const text = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value);
  return JSON.stringify(value);
};

export const cell = (value: unknown): string =>
  text(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

export function table(headers: string[], rows: unknown[][]): string {
  if (rows.length === 0) return '_Aucun._\n';
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`),
  ].join('\n') + '\n';
}
