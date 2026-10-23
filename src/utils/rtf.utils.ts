export function encodeRTF(str: string): string {
  if (!str) return '';
  return str.replace(/[^\x00-\x7F]/g, char => `\\'${char.charCodeAt(0).toString(16).toLowerCase()}`);
}

export function limparEspacos(str: string): string {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
}