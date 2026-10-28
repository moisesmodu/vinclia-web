// Generado por motor/compilar.mjs. No editar a mano.
import type { Banco } from '@/lib/tipos';
import auxiliarAdministratiuAjuntaments from './auxiliar-administratiu-ajuntaments.json';
import auxiliarAdministratiuGeneralitat from './auxiliar-administratiu-generalitat.json';
import bombersGeneralitat from './bombers-generalitat.json';
import mossosEsquadra from './mossos-esquadra.json';
import tcaiIcs from './tcai-ics.json';

export const bancos: Record<string, Banco> = {
  'auxiliar-administratiu-ajuntaments': auxiliarAdministratiuAjuntaments as unknown as Banco,
  'auxiliar-administratiu-generalitat': auxiliarAdministratiuGeneralitat as unknown as Banco,
  'bombers-generalitat': bombersGeneralitat as unknown as Banco,
  'mossos-esquadra': mossosEsquadra as unknown as Banco,
  'tcai-ics': tcaiIcs as unknown as Banco,
};
