import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, 'src');

function getAllTsxFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllTsxFiles(full, files);
    } else if (entry.name.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
}

function stripTypeScript(code) {
  // Remove interface declarations (multi-line)
  code = code.replace(/^(export\s+)?interface\s+\w+[^{]*\{[^}]*\}/gms, '');

  // Remove type alias declarations
  code = code.replace(/^(export\s+)?type\s+\w+\s*(<[^>]*)?\s*=\s*[^;]+;/gms, '');

  // Remove import type statements
  code = code.replace(/^import\s+type\s+.*;$/gm, '');

  // Remove type-only named imports: import { type Foo, Bar } -> import { Bar }
  code = code.replace(/import\s*\{([^}]+)\}\s*(from\s*['"][^'"]+['"])/g, (match, imports, fromPart) => {
    const cleaned = imports
      .split(',')
      .map(i => i.trim())
      .filter(i => !i.startsWith('type ') && i !== '')
      .join(', ');
    if (!cleaned) return '';
    return `import { ${cleaned} } ${fromPart}`;
  });

  // Remove generic type parameters from React hooks: useState<Type> -> useState
  code = code.replace(/\buse(State|Ref|Context|Reducer|Callback|Memo|ImperativeHandle)\s*<[^>]*>/g, (match, hook) => `use${hook}`);

  // Remove createContext generic: createContext<Type> -> createContext
  code = code.replace(/\bcreateContext\s*<[^>]*>/g, 'createContext');

  // Remove type assertions: value as Type -> value
  code = code.replace(/\s+as\s+[A-Z][A-Za-z<>\[\]|&\s]+(?=[,)\s;{])/g, '');

  // Remove destructured param types: { children }: { children: React.ReactNode }
  code = code.replace(/\}:\s*\{[^}]+\}/g, '}');

  // Remove simple param type annotations with defaults
  code = code.replace(/(\w+)\s*:\s*(?:React\.)?(?:[\w<>\[\]|&'".\s]+\s*(?:\|\s*[\w<>\[\]|&'".\s]+)*)?\s*(?==)/g, '$1 ');

  // Remove inline type annotations from function params
  code = code.replace(/\(([^)]*)\)/g, (match, params) => {
    const cleanedParams = params
      .replace(/(\w+)\s*\?\s*:\s*[^,)=]+/g, '$1')
      .replace(/(\w+)\s*:\s*[^,)=]+/g, '$1');
    return `(${cleanedParams})`;
  });

  // Remove return type annotations: ): ReturnType =>  and ): ReturnType {
  code = code.replace(/\)\s*:\s*(?:Promise<[^>]+>|[A-Za-z<>\[\]|&\s]+)\s*(?=[{=>])/g, ') ');

  // Remove non-null assertion operator: value! -> value
  code = code.replace(/(\w|\))!/g, '$1');

  // Remove TypeScript generic function calls: func<Type>(args) -> func(args)
  code = code.replace(/\b([a-zA-Z_$][\w$]*)\s*<([A-Z][\w,<>\s\[\]|&"'.]+)>\s*\(/g, '$1(');

  // Fix import paths: .tsx -> .jsx  and .ts -> .js
  code = code.replace(/from\s*(['"])(.*?)\.tsx(['"])/g, 'from $1$2.jsx$3');
  code = code.replace(/from\s*(['"])(.*?)\.ts(['"])/g, 'from $1$2.js$3');

  // Clean up multiple empty lines -> max 2
  code = code.replace(/\n{3,}/g, '\n\n');

  return code;
}

const tsxFiles = getAllTsxFiles(srcDir);
console.log(`Found ${tsxFiles.length} TSX files\n`);

for (const tsxPath of tsxFiles) {
  const content = fs.readFileSync(tsxPath, 'utf8');
  const converted = stripTypeScript(content);
  const jsxPath = tsxPath.replace(/\.tsx$/, '.jsx');

  fs.writeFileSync(jsxPath, converted, 'utf8');
  fs.unlinkSync(tsxPath);

  const relativePath = path.relative(__dirname, tsxPath);
  console.log(`✓ Converted: ${relativePath}`);
}

console.log(`\n✅ Done! Converted ${tsxFiles.length} files.`);
