// Utilidades sin dependencias de Node: se pueden usar en componentes de cliente.
export function t(plantilla: string, vars: Record<string, string | number>): string {
  return plantilla.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
