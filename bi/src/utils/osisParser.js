import { XMLParser } from 'fast-xml-parser';

export const OSIS_BOOK_NAMES = {
  Gen: 'Genesis', Exod: 'Exodus', Lev: 'Leviticus', Num: 'Numbers', Deut: 'Deuteronomy',
  Josh: 'Joshua', Judg: 'Judges', Ruth: 'Ruth', '1Sam': '1 Samuel', '2Sam': '2 Samuel',
  '1Kgs': '1 Kings', '2Kgs': '2 Kings', '1Chr': '1 Chronicles', '2Chr': '2 Chronicles',
  Ezra: 'Ezra', Neh: 'Nehemiah', Esth: 'Esther', Job: 'Job', Ps: 'Psalms', Prov: 'Proverbs',
  Eccl: 'Ecclesiastes', Song: 'Song of Solomon', Isa: 'Isaiah', Jer: 'Jeremiah', Lam: 'Lamentations',
  Ezek: 'Ezekiel', Dan: 'Daniel', Hos: 'Hosea', Joel: 'Joel', Amos: 'Amos', Obad: 'Obadiah',
  Jonah: 'Jonah', Mic: 'Micah', Nah: 'Nahum', Hab: 'Habakkuk', Zeph: 'Zephaniah', Hag: 'Haggai',
  Zech: 'Zechariah', Mal: 'Malachi', Matt: 'Matthew', Mark: 'Mark', Luke: 'Luke', John: 'John',
  Acts: 'Acts', Rom: 'Romans', '1Cor': '1 Corinthians', '2Cor': '2 Corinthians', Gal: 'Galatians',
  Eph: 'Ephesians', Phil: 'Philippians', Col: 'Colossians', '1Thess': '1 Thessalonians', '2Thess': '2 Thessalonians',
  '1Tim': '1 Timothy', '2Tim': '2 Timothy', Titus: 'Titus', Phlm: 'Philemon', Heb: 'Hebrews', Jas: 'James',
  '1Pet': '1 Peter', '2Pet': '2 Peter', '1John': '1 John', '2John': '2 John', '3John': '3 John', Jude: 'Jude', Rev: 'Revelation'
};

export const OSIS_BOOK_NAMES_ARABIC = {
  Gen: 'التكوين',Exod: 'الخروج',Lev: 'اللاويين',Num: 'العدد',Deut: 'التثنية',
  Josh: 'يشوع',Judg: 'القضاة',Ruth: 'راعوث','1Sam': 'صموئيل الأول','2Sam': 'صموئيل الثاني',
  '1Kgs': 'الملوك الأول','2Kgs': 'الملوك الثاني','1Chr': 'أخبار الأيام الأول','2Chr': 'أخبار الأيام الثاني','Ezra': 'عزرا',
  'Neh': 'نحميا','Esth': 'أستير',Job: 'أيوب',Ps: 'المزامير',Prov: 'الأمثال',Eccl: 'الجامعة',Song: 'نشيد الأنشاد',
  Isa: 'إشعياء',Jer: 'إرميا',Lam: 'مراثي إرميا',Ezek: 'حزقيال',Dan: 'دانيال',Hos: 'هوشع',Joel: 'يوئيل',Amos: 'عاموس',Obad: 'عوبديا',
  Jonah: 'يونان',Mic: 'ميخا',Nah: 'ناحوم',Hab: 'حبقوق',Zeph: 'صفنيا',Hag: 'حجاي',Zech: 'زكريا',Mal: 'ملاخي',
  Matt: 'متى',Mark: 'مرقس',Luke: 'لوقا',John: 'يوحنا',Acts: 'أعمال الرسل',
  Rom: 'رومية','1Cor': 'كورنثوس الأولى','2Cor': 'كورنثوس الثانية',Gal: 'غلاطية',Eph: 'أفسس',Phil: 'فيلبي',
  Col: 'كولوسي','1Thess': 'تسالونيكي الأولى','2Thess': 'تسالونيكي الثانية','1Tim': 'تيموثاوس الأول','2Tim': 'تيموثاوس الثاني',Titus: 'تيطس',Phlm: 'فليمون',Heb: 'عبرانيين',Jas: 'يعقوب','1Pet': 'بطرس الأولى','2Pet': 'بطرس الثانية','1John': 'يوحنا الأولى','2John': 'يوحنا الثانية','3John': 'يوحنا الثالثة','Jude': 'يهودا','Rev': 'سفر الرؤيا'
};


const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '',
  allowBooleanAttributes: true,
  ignoreDeclaration: true,
  trimValues: false,
  parseTagValue: false,
  parseAttributeValue: false,
  ignoreNameSpace: true,
  textNodeName: '#text',
};

const parser = new XMLParser(parserOptions);

const toArray = (value) => {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
};

function collectText(node) {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  let text = '';
  for (const key of Object.keys(node)) {
    if (key === '#text') {
      text += node[key];
    } else if (key === ':@') {
      continue;
    } else {
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) text += collectText(c);
      } else if (typeof child === 'object') {
        text += collectText(child);
      }
    }
  }
  return text;
}

function parseChapterNumber(ch) {
  // Prefer osisID like Gen.1
  const id = ch.osisID || ch.ID || ch.id || '';
  const match = /^(?:[^.]+)\.(\d+)/.exec(id);
  if (match) return parseInt(match[1], 10);
  if (ch.n) {
    const n = parseInt(String(ch.n), 10);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

function parseVerseNumber(v) {
  const id = v.osisID || v.ID || v.id || '';
  const match = /^(?:[^.]+)\.(?:\d+)\.(\d+)/.exec(id);
  if (match) return parseInt(match[1], 10);
  if (v.n) {
    const n = parseInt(String(v.n), 10);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

function normalizeBookId(bookDiv) {
  if (bookDiv.osisID) return bookDiv.osisID;
  // Fallback: try from first chapter osisID
  const chapters = toArray(bookDiv.chapter);
  if (chapters.length > 0) {
    const id = chapters[0].osisID || '';
    const m = /^([^.]+)/.exec(id);
    if (m) return m[1];
  }
  return 'Unknown';
}

function parseBookDiv(bookDiv) {
  const bookId = normalizeBookId(bookDiv);
  const chaptersArr = toArray(bookDiv.chapter);
  const chapters = chaptersArr.map((ch, chIdx) => {
    const versesArr = toArray(ch.verse);
    const verses = versesArr.map((v, vIdx) => {
      const text = collectText(v).replace(/\s+/g, ' ').trim();
      const osisID = v.osisID || v.ID || v.id || '';
      return {
        id: osisID,
        number: (() => { const n = parseVerseNumber(v); return n && n > 0 ? n : vIdx + 1; })(),
        text,
      };
    });
    return {
      number: (() => { const n = parseChapterNumber(ch); return n && n > 0 ? n : chIdx + 1; })(),
      verses,
    };
  });
  const totalChapters = chapters.length;
  const totalVerses = chapters.reduce((acc, c) => acc + c.verses.length, 0);
  return {
    id: bookId,
    // Prefer XML title; otherwise fall back to OSIS name maps (EN first, then AR), then id
    name: bookDiv.title || OSIS_BOOK_NAMES[bookId] || OSIS_BOOK_NAMES_ARABIC[bookId] || bookId,
    chapters,
    totalChapters,
    totalVerses,
  };
}

export function parseOsisXmlString(xmlString) {
  const root = parser.parse(xmlString);
  const osisText = root?.osis?.osisText ?? root?.osisText ?? root;
  let divs = toArray(osisText?.div);
  // Filter to books only
  divs = divs.filter((d) => (d?.type ? String(d.type).toLowerCase() === 'book' : true));
  return divs.map(parseBookDiv);
}

export function parseOsisBookXmlString(xmlString) {
  const root = parser.parse(xmlString);
  // Try various shapes: osis -> osisText -> div, or direct div
  let bookDiv = null;
  const divs = toArray(root?.osis?.osisText?.div || root?.osisText?.div || root?.div);
  if (divs.length > 0) {
    bookDiv = divs.find((d) => String(d?.type || '').toLowerCase() === 'book') || divs[0];
  }
  if (!bookDiv) {
    // Some files could wrap chapters directly
    const chapters = toArray(root?.chapter);
    if (chapters.length) {
      bookDiv = { chapter: chapters };
    }
  }
  if (!bookDiv) throw new Error('Invalid OSIS book XML: no book or chapters found');
  return parseBookDiv(bookDiv);
}
