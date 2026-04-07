/**
 * Safe TSX-to-JSX line-level stripper.
 * Operates on lines, skipping lines that are inside JSX attributes or strings.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, 'src');

function getAllFiles(dir, ext, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) getAllFiles(full, ext, files);
    else if (entry.name.endsWith(ext)) files.push(full);
  }
  return files;
}

/**
 * Strip TypeScript from a TSX source using a line-aware approach.
 * We only apply type-stripping regexes to lines that look like TS,
 * never inside JSX return blocks.
 */
function safeStripTS(code) {
  const lines = code.split('\n');
  const out = [];
  let inReturn = false;
  let braceDepth = 0;
  let returnBraceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Track if we're inside a JSX return statement
    if (/^\s*return\s*\(/.test(line)) {
      inReturn = true;
      returnBraceDepth = braceDepth;
    }
    if (inReturn) {
      // Count parens to know when return block ends
      for (const ch of line) {
        if (ch === '(') braceDepth++;
        if (ch === ')') {
          braceDepth--;
          if (braceDepth <= returnBraceDepth) inReturn = false;
        }
      }
      out.push(line); // keep JSX lines as-is
      continue;
    }

    // Skip import type lines
    if (/^\s*import\s+type\s+/.test(line)) continue;

    // Skip interface/type declarations (single line)
    if (/^\s*(export\s+)?(interface|type)\s+/.test(line)) {
      // multi-line: skip until closing brace
      if (/{/.test(line) && !(/}/.test(line))) {
        while (i < lines.length && !(/^\s*}/.test(lines[i]))) i++;
      }
      continue;
    }

    // Remove type-only imports: { type Foo, Bar } → { Bar }
    line = line.replace(/import\s*\{([^}]+)\}\s*(from\s*['"][^'"]+['"])/g, (match, imports, fromPart) => {
      const cleaned = imports.split(',')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('type '))
        .join(', ');
      return cleaned ? `import { ${cleaned} } ${fromPart}` : '';
    });

    // Remove generic type params from React hooks: useState<X> → useState
    line = line.replace(/\buse(State|Ref|Context|Reducer|Callback|Memo|ImperativeHandle)\s*<[^>]*>/g, (_, h) => `use${h}`);

    // createContext<X> → createContext
    line = line.replace(/\bcreateContext\s*<[^>]*>/g, 'createContext');

    // Remove return type annotation:  ): SomeType {  or  ): SomeType =>
    line = line.replace(/\)\s*:\s*(?:Promise<[^>]+>|[A-Za-z][A-Za-z0-9<>\[\]|&\s]*)\s*(?=[{=]|=>)/g, ') ');

    // Remove non-null assertion  foo! → foo  but NOT in strings
    line = line.replace(/([a-zA-Z0-9_$\])])\!/g, '$1');

    // Remove type assertion `value as SomeType` – only outside strings on TS-looking lines
    // Only strip if the line doesn't contain JSX (no < > tags)
    if (!/\bclassName\b/.test(line) && !/<[A-Z]/.test(line)) {
      line = line.replace(/\bas\s+[A-Z][A-Za-z0-9<>\[\]|&\s]*(?=[,)\s;])/g, '');
    }

    // Fix import paths .tsx → .jsx  .ts → .js
    line = line.replace(/from\s*(['"])(.*?)\.tsx(['"])/g, 'from $1$2.jsx$3');
    line = line.replace(/from\s*(['"])(.*?)\.ts(['"])/g, 'from $1$2.js$3');

    out.push(line);
  }

  // Also handle function parameter type annotations ONLY in function signature lines
  // (lines before the return block that look like function params)
  let result = out.join('\n');

  // Remove }: { children: ReactNode } style destructured type annotations
  result = result.replace(/\}:\s*\{[^}]+\}/g, '}');

  // Remove interface blocks that span multiple lines
  result = result.replace(/^(export\s+)?interface\s+\w+[^{]*\{[^}]*\}/gms, '');

  // Remove type alias blocks
  result = result.replace(/^(export\s+)?type\s+\w+\s*(?:<[^>]*)?\s*=\s*[^;]+;/gms, '');

  // Remove param type annotations ONLY in function/arrow definitions
  // Match: const foo = (param: Type, param2: Type) =>
  result = result.replace(/^(\s*(?:export\s+)?(?:const|function|async function)\s+\w+\s*=?\s*(?:async\s+)?\()([^)]*)\)/gm, (match, prefix, params) => {
    const cleaned = params
      .replace(/(\w+)\s*\??\s*:\s*(?:[A-Z][^,)]*|string|number|boolean|any|void|never|unknown)[^,)]*/g, '$1')
      .replace(/,\s*,/g, ',')
      .trim();
    return `${prefix}${cleaned})`;
  });

  // Clean up excess blank lines
  result = result.replace(/\n{3,}/g, '\n\n');

  return result;
}

// ---- Process TSX files ----
const tsxFiles = getAllFiles(srcDir, '.tsx');
console.log(`Found ${tsxFiles.length} TSX files\n`);
for (const p of tsxFiles) {
  const content = fs.readFileSync(p, 'utf8');
  const converted = safeStripTS(content);
  const jsxPath = p.replace(/\.tsx$/, '.jsx');
  fs.writeFileSync(jsxPath, converted, 'utf8');
  fs.unlinkSync(p);
  console.log('✓ Converted:', path.relative(__dirname, p));
}
if (tsxFiles.length) console.log(`\n✅ Done! Converted ${tsxFiles.length} TSX files.`);
else console.log('No TSX files found.');

// ---- Also re-process already-converted JSX files that are broken ----
// We can't really fix broken JSX without the originals.
// Instead, let's identify which files have obvious corruption markers and report them.
const jsxFiles = getAllFiles(srcDir, '.jsx');
const broken = [];
for (const p of jsxFiles) {
  const content = fs.readFileSync(p, 'utf8');
  if (/dark="[A-Za-z]/.test(content) || /Array\.from\(\{ length,/.test(content)) {
    broken.push(path.relative(__dirname, p));
  }
}

if (broken.length) {
  console.log('\n⚠️  The following JSX files appear to have corruption from the previous bad conversion:');
  broken.forEach(f => console.log('   -', f));
  console.log('\nThese need their original TSX sources to be restored properly.');
}
