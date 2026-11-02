import Link from 'next/link';
import type { Salud } from '@/lib/mando/salud';
import { contenido } from '@/lib/mando/contenido';
import { Estado, haceCuanto, IconoMarca } from './Piezas';

const TEXTO = { bien: 'Bien', atencion: 'Atención', mal: 'Caída' } as const;

export default function SaludTarjeta({ s }: { s: Salud }) {
  const marca = contenido.marcas[s.web.repo];
  return (
    <Link href={`/proyectos/${s.web.slug}/`} className="caja" aria-label={`${s.web.nombre}: ${TEXTO[s.nivel]}. ${s.motivo}`}>
      <div className="nucleo apretado salud">
        <div className="salud-cab">
          <IconoMarca svg={marca?.svg} nombre={s.web.nombre} />
          <div className="crece"><b>{s.web.nombre}</b><small className="t3">{[s.web.dominio, ...s.otras.map((o) => o.dominio)].join(' · ')}</small></div>
        </div>
        <div className="salud-estado"><Estado nivel={s.nivel}>{TEXTO[s.nivel]}</Estado><small>{s.motivo}</small></div>
        <div className="salud-datos">
          <span>HTTP<b>{s.http.estado ?? '—'}{s.http.ms != null ? <small className="t3"> {s.http.ms} ms</small> : null}</b></span>
          <span>Desplegado<b title={s.despliegue?.mensaje}>{s.despliegue ? haceCuanto(s.despliegue.creado, true) : '—'}</b></span>
          <span>5xx 24 h<b>{s.errores ?? '—'}</b></span>
        </div>
      </div>
    </Link>
  );
}

export function ResumenSalud({ lista }: { lista: Salud[] }) {
  const n = (k: Salud['nivel']) => lista.filter((s) => s.nivel === k).length;
  return (
    <span className="semaforo-resumen">
      <Estado nivel="bien">{n('bien')} bien</Estado>
      {n('atencion') > 0 && <Estado nivel="atencion">{n('atencion')} atención</Estado>}
      {n('mal') > 0 && <Estado nivel="mal">{n('mal')} caída{n('mal') > 1 ? 's' : ''}</Estado>}
    </span>
  );
}
