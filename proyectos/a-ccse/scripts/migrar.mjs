// En el build de Vercel: aplica las migraciones si hay base de datos; si no, sigue (el build no depende de Neon).
import { execSync } from 'node:child_process';
if (!process.env.DATABASE_URL) {
  console.log('migrar: sin DATABASE_URL, se omite prisma migrate deploy');
} else {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
}
