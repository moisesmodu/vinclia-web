// Uso: node scripts/hoja-contactos.mjs <carpeta> <salida.jpg>
import sharp from "sharp";
import { readdirSync } from "node:fs";
const [dir, out] = process.argv.slice(2);
const files = readdirSync(dir).filter((f) => /\.(png|jpe?g|webp)$/.test(f)).sort();
const T = 360, cols = 5, rows = Math.ceil(files.length / cols);
const tiles = await Promise.all(files.map((f) => sharp(`${dir}/${f}`).resize(T, T).toBuffer()));
await sharp({ create: { width: cols * T, height: rows * T, channels: 3, background: "#fff" } })
  .composite(tiles.map((b, i) => ({ input: b, left: (i % cols) * T, top: Math.floor(i / cols) * T })))
  .jpeg({ quality: 78 }).toFile(out);
console.log(files.join(" "));
