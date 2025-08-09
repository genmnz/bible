import { promises as fs } from "fs";
import * as path from "path";

async function main() {
  const projectRoot = path.resolve(__dirname, "..");
  const inputFile = path.join(projectRoot, "src", "bibles", "aravd", "ArabicAVDBible.xml");
  const outDir = path.join(projectRoot, "src", "bibles", "aravd", "books");

  const xml = await fs.readFile(inputFile, "utf8");

  await fs.mkdir(outDir, { recursive: true });

  const bookRegex = /<book\s+number=["'](\d+)["'][^>]*>([\s\S]*?)<\/book>/g;
  let match: RegExpExecArray | null;
  let bookCount = 0;

  while ((match = bookRegex.exec(xml)) !== null) {
    const bookNum = match[1];
    const bookInner = match[2];

    // Transform chapters and verses
    const chapterRegex = /<chapter\s+number=["'](\d+)["'][^>]*>([\s\S]*?)<\/chapter>/g;
    let chapterMatch: RegExpExecArray | null;
    let transformedBookParts: string[] = [];

    while ((chapterMatch = chapterRegex.exec(bookInner)) !== null) {
      const chapNum = chapterMatch[1];
      const chapInner = chapterMatch[2];

      // Replace verse open tags with osisID
      const transformedChapInner = chapInner.replace(/<verse\s+number=["'](\d+)["']([^>]*)>/g, (_m, verseNum: string, rest: string) => {
        return `<verse osisID='${bookNum}.${chapNum}.${verseNum}'>`;
      });

      const chapterBlock = `  <chapter osisID='${bookNum}.${chapNum}'>\n${transformedChapInner}\n  </chapter>`;
      transformedBookParts.push(chapterBlock);
    }

    const bookDiv = `<div type='book' osisID='${bookNum}'>\n${transformedBookParts.join("\n")}\n</div>\n`;

    const outPath = path.join(outDir, `${bookNum}.xml`);
    await fs.writeFile(outPath, bookDiv, "utf8");
    bookCount++;
  }

  console.log(`Split completed: ${bookCount} book file(s) written to ${path.relative(projectRoot, outDir)}`);
}

main().catch((err) => {
  console.error("Error while splitting ArabicAVDBible.xml:", err);
  process.exit(1);
});
