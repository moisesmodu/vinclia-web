// En el despliegue: si hay base de datos, crea o actualiza las tablas (prisma db push). Sin base de datos, no hace nada.
import { execSync } from 'node:child_process';
if (!process.env.DATABASE_URL) {
  console.log('Sin DATABASE_URL: se omite la base de datos (la app funciona sin cuentas, con el progreso en el navegador).');
} else {
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
}
