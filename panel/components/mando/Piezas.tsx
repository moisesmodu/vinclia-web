import { ArrowDownRight, ArrowUpRight, CheckCircle, Minus, Warning, WarningOctagon, Info, Circle } from '@phosphor-icons/react/dist/ssr';
import type { Kpi } from '@/lib/mando/metricas';

const TZ = 'Europe/Madrid';
export const euros = (centimos: number, decimales?: number) => {
  const d = decimales ?? (Math.abs(centimos) >= 100_000 ? 0 : 2);
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: d, maximumFractionDigits: d }).format(centimos / 100);
};
export const numero = (n: number) => n.toLocaleString('es-ES');
export const pct = (a: number, b: number) => (b > 0 ? `${((a / b) * 100).toLocaleString('es-ES', { maximumFractionDigits: 1 })} %` : '—');

export function haceCuanto(d: Date | null | undefined, corto = false): string {
  if (!d) return '—';
  const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
  if (corto) return s < 60 ? 'ahora' : s < 3600 ? `${Math.round(s / 60)} min` : s < 86400 ? `${Math.round(s / 3600)} h` : `${Math.round(s / 86400)} d`;
  if (s < 60) return 'ahora';
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
  const dias = Math.round(s / 86400);
  return dias === 1 ? 'ayer' : `hace ${dias} días`;
}
export const fechaCorta = (d: Date | string | null | undefined) => (d == null ? '—' : new Intl.DateTimeFormat('es-ES', { timeZone: TZ, day: 'numeric', month: 'short' }).format(new Date(d)));
export const fechaHora = (d: Date | string | null | undefined) => (d == null ? '—' : new Intl.DateTimeFormat('es-ES', { timeZone: TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(d)));

export function Caja({ children, className = '', apretado = false, estilo }: { children: React.ReactNode; className?: string; apretado?: boolean; estilo?: React.CSSProperties }) {
  return <div className={`caja ${className}`} style={estilo}><div className={`nucleo${apretado ? ' apretado' : ''}`}>{children}</div></div>;
}

export function Delta({ valor, antes }: { valor: number | null; antes: number | null }) {
  if (valor == null || antes == null) return null;
  if (antes === 0 && valor === 0) return <span className="delta"><Minus aria-hidden="true" weight="bold" />igual</span>;
  if (antes === 0) return <span className="delta sube"><ArrowUpRight aria-hidden="true" weight="bold" />nuevo</span>;
  const v = ((valor - antes) / Math.abs(antes)) * 100;
  if (Math.abs(v) < 0.5) return <span className="delta"><Minus aria-hidden="true" weight="bold" />igual</span>;
  const sube = v > 0;
  const txt = `${sube ? '+' : '−'}${Math.abs(v).toLocaleString('es-ES', { maximumFractionDigits: Math.abs(v) < 10 ? 1 : 0 })} %`;
  return <span className={`delta ${sube ? 'sube' : 'baja'}`}>{sube ? <ArrowUpRight aria-hidden="true" weight="bold" /> : <ArrowDownRight aria-hidden="true" weight="bold" />}{txt}</span>;
}

export const formatoKpi = (k: Pick<Kpi, 'formato'>, v: number) => (k.formato === 'euros' ? euros(v) : numero(v));

export function Estado({ nivel, children }: { nivel: 'bien' | 'atencion' | 'mal' | 'neutro'; children: React.ReactNode }) {
  const Icono = nivel === 'bien' ? CheckCircle : nivel === 'atencion' ? Warning : nivel === 'mal' ? WarningOctagon : Circle;
  return <span className={`estado ${nivel}`}><Icono weight="fill" aria-hidden="true" />{children}</span>;
}

export function Aviso({ titulo, children, tipo = 'aviso' }: { titulo: string; children?: React.ReactNode; tipo?: 'aviso' | 'info' }) {
  return (
    <div className={`aviso ${tipo === 'info' ? 'info' : ''}`} role="status">
      {tipo === 'info' ? <Info weight="fill" aria-hidden="true" /> : <Warning weight="fill" aria-hidden="true" />}
      <div><b>{titulo}</b>{children ? <small>{children}</small> : null}</div>
    </div>
  );
}

export function IconoMarca({ svg, nombre, grande = false }: { svg?: string; nombre: string; grande?: boolean }) {
  if (!svg) return <span className={`icono-marca${grande ? ' grande' : ''}`} aria-hidden="true" style={{ display: 'grid', placeItems: 'center', background: 'var(--s3)', fontWeight: 700 }}>{nombre[0]}</span>;
  // SVG propio del repositorio (marcas/logos), generado en el build: no viene de fuera.
  return <span className={`icono-marca${grande ? ' grande' : ''}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** Línea mínima (sin ejes) para dar forma a una cifra. Server component, sin JavaScript en el cliente. */
export function Chispa({ valores, color = '#a9afbc', alto = 36, etiqueta }: { valores: number[]; color?: string; alto?: number; etiqueta: string }) {
  const ancho = 200;
  const max = Math.max(...valores, 0);
  const min = Math.min(...valores, 0);
  const rango = max - min || 1;
  const paso = valores.length > 1 ? ancho / (valores.length - 1) : ancho;
  const y = (v: number) => alto - 3 - ((v - min) / rango) * (alto - 6);
  const puntos = valores.map((v, i) => `${(i * paso).toFixed(1)},${y(v).toFixed(1)}`);
  const id = `ch-${etiqueta.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg className="chispa" viewBox={`0 0 ${ancho} ${alto}`} preserveAspectRatio="none" width="100%" height={alto} role="img" aria-label={etiqueta}>
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={`M0,${alto} L${puntos.join(' L')} L${ancho},${alto} Z`} fill={`url(#${id})`} />
      <polyline points={puntos.join(' ')} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function TarjetaKpi({ k, chispa, heroe = false, children }: { k: Kpi; chispa?: { valores: number[]; color?: string }; heroe?: boolean; children?: React.ReactNode }) {
  return (
    <Caja className={heroe ? 'heroe' : ''}>
      <div className="kpi">
        <span className="kpi-tit">{k.titulo}</span>
        <span className="kpi-valor">{k.valor == null ? <span className="sin-dato">—</span> : formatoKpi(k, k.valor)}</span>
        <span className="kpi-pie"><Delta valor={k.valor} antes={k.antes} />{k.antes != null && k.valor != null ? <span>vs {k.comparacion}</span> : <span>sin datos</span>}</span>
        {k.detalle ? <span className="kpi-pie">{k.detalle}</span> : null}
        {children}
        {chispa ? <div className="chispa"><Chispa valores={chispa.valores} color={chispa.color} alto={heroe ? 80 : 34} etiqueta={`Evolución de ${k.titulo} en 30 días`} /></div> : null}
      </div>
    </Caja>
  );
}
