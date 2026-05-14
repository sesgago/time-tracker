import { copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgresql://');
const schemaFile = isPostgres ? 'schema.postgresql.prisma' : 'schema.sqlite.prisma';
const src = join(__dirname, 'prisma', schemaFile);
const dest = join(__dirname, 'prisma', 'schema.prisma');

if (!existsSync(src)) {
  console.error(`Schema file not found: ${src}`);
  process.exit(1);
}

copyFileSync(src, dest);
console.log(`Using ${isPostgres ? 'PostgreSQL' : 'SQLite'} schema (DB: ${isPostgres ? 'postgresql' : 'sqlite'})`);
