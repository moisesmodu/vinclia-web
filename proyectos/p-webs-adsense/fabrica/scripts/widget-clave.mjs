// Alta de un cliente de marca blanca del widget: imprime la línea para widget-clientes.json.
//   node scripts/widget-clave.mjs gestoria-puig gestoriapuig.es [profesional|agencia] [#color] [https://logo]
// Después: pegar la línea en «clientes», `npm test` (valida claves, dominios y límites del plan) y redesplegar.
import { createHash } from 'node:crypto';
const [cliente, dominioBruto, plan = 'profesional', color, logo] = process.argv.slice(2);
if (!cliente || !dominioBruto) { console.error('Uso: node scripts/widget-clave.mjs <cliente> <dominio> [plan] [#color] [logo]'); process.exit(1); }
const dominio = dominioBruto.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[/:].*$/, '');
const clave = createHash('sha256').update(`${cliente.trim().toLowerCase()}:${dominio}`).digest('hex').slice(0, 24);
const fila = { cliente, dominio, plan, clave, ...(color ? { color } : {}), ...(logo ? { logo } : {}), alta: new Date().toISOString().slice(0, 10) };
console.log(JSON.stringify(fila, null, 2));
console.error(`\nAñade «pro=${clave}» a la dirección /embed/… que el cliente copie del configurador (o pégala en su campo «Clave»).`);
