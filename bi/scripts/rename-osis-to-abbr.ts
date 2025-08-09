import { promises as fs } from 'fs';
import path from 'path';

// Map 1..66 to OSIS book IDs
// Source: OSIS standard book IDs
const OSIS: string[] = [
  '', // 0 unused
  'Gen','Exod','Lev','Num','Deut','Josh','Judg','Ruth','1Sam','2Sam','1Kgs','2Kgs','1Chr','2Chr','Ezra','Neh','Esth','Job','Ps','Prov','Eccl','Song','Isa','Jer','Lam','Ezek','Dan','Hos','Joel','Amos','Obad','Jonah','Mic','Nah','Hab','Zeph','Hag','Zech','Mal','Matt','Mark','Luke','John','Acts','Rom','1Cor','2Cor','Gal','Eph','Phil','Col','1Thess','2Thess','1Tim','2Tim','Titus','Phlm','Heb','Jas','1Pet','2Pet','1John','2John','3John','Jude','Rev'
];

function parseArgs(argv: string[]) {
  const opts = { only: [] as number[], renameFiles: false };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--only=')) {
      const list = arg.slice('--only='.length);
      opts.only = list
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(n => Number(n))
        .filter(n => Number.isFinite(n) && n >= 1 && n <= 66);
    } else if (arg === '--rename-files') {
      opts.renameFiles = true;
    }
  }
  return opts;
}

function replaceOsis(content: string, n: number, abbr: string): string {
  // Replace verse osisIDs first: N.C.V -> Abbr.C.V
  const verseRe = new RegExp(`osisID=(["'])${n}\\.([0-9]+)\\.([0-9]+)\\1`, 'g');
  content = content.replace(verseRe, (_m, q, c, v) => `osisID=${q}${abbr}.${c}.${v}${q}`);

  // Replace chapter osisIDs: N.C -> Abbr.C
  const chapRe = new RegExp(`osisID=(["'])${n}\\.([0-9]+)\\1`, 'g');
  content = content.replace(chapRe, (_m, q, c) => `osisID=${q}${abbr}.${c}${q}`);

  // Replace book osisID: N -> Abbr (only matches exact N)
  const bookRe = new RegExp(`osisID=(["'])${n}\\1`, 'g');
  content = content.replace(bookRe, (_m, q) => `osisID=${q}${abbr}${q}`);

  return content;
}

async function transformOne(booksDir: string, n: number, abbr: string, renameFiles: boolean) {
  const fileNumeric = path.join(booksDir, `${n}.xml`);
  let existsNumeric = false;
  try { await fs.stat(fileNumeric); existsNumeric = true; } catch {}

  const fileAbbr = path.join(booksDir, `${abbr}.xml`);
  let existsAbbr = false;
  try { await fs.stat(fileAbbr); existsAbbr = true; } catch {}

  const inputPath = existsNumeric ? fileNumeric : existsAbbr ? fileAbbr : undefined;
  if (!inputPath) {
    console.warn(`- Skip ${n} (${abbr}): file not found.`);
    return;
  }

  let content = await fs.readFile(inputPath, 'utf8');
  const updated = replaceOsis(content, n, abbr);
  if (updated === content) {
    console.log(`- No changes needed: ${path.basename(inputPath)}`);
  } else {
    await fs.writeFile(inputPath, updated, 'utf8');
    console.log(`- Updated osisIDs in ${path.basename(inputPath)}`);
  }

  if (renameFiles && inputPath === fileNumeric) {
    // Rename 2.xml -> Exod.xml (overwrite if exists)
    if (existsAbbr) {
      // If target exists, remove it to allow rename
      await fs.unlink(fileAbbr);
    }
    await fs.rename(fileNumeric, fileAbbr);
    console.log(`  Renamed file to ${abbr}.xml`);
  }
}

async function main() {
  const { only, renameFiles } = parseArgs(process.argv);
  const booksDir = path.join(process.cwd(), 'src', 'bibles', 'aravd', 'books');
  try { await fs.stat(booksDir); } catch {
    console.error(`Books directory not found: ${booksDir}`);
    process.exit(1);
  }

  const targets: number[] = only.length ? only : Array.from({ length: 66 }, (_, i) => i + 1);

  for (const n of targets) {
    const abbr = OSIS[n];
    if (!abbr) {
      console.warn(`- Skip ${n}: no OSIS abbreviation`);
      continue;
    }
    await transformOne(booksDir, n, abbr, renameFiles);
  }

  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
