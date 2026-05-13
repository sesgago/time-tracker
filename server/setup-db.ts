import { copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isRailway = !!process.env.RAILWAY_SERVICE_ID;
const schemaFile = isRailway ? 'schema.postgresql.prisma' : 'schema.sqlite.prisma';
const src = join(__dirname, 'prisma', schemaFile);
const dest = join(__dirname, 'prisma', 'schema.prisma');

if (!existsSync(src)) {
  console.error(`Schema file not found: ${src}`);
  process.exit(1);
}

copyFileSync(src, dest);
console.log(`Using ${isRailway ? 'PostgreSQL' : 'SQLite'} schema`);
