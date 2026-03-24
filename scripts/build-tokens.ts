/**
 * Token build script
 *
 * Reads the canonical JSON token files and generates CSS custom properties.
 *
 * Input:  src/tokens/primitives.json + src/tokens/semantics.json
 * Output: src/tokens/generated/tokens.css
 *
 * Run: npm run tokens:build
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PRIMITIVES_PATH = resolve(ROOT, 'src/tokens/primitives.json');
const SEMANTICS_PATH = resolve(ROOT, 'src/tokens/semantics.json');
const OUTPUT_PATH = resolve(ROOT, 'src/tokens/generated/tokens.css');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TokenEntry {
  $type?: string;
  $value?: string;
  $description?: string;
  $extensions?: {
    'com.figma'?: {
      modes?: {
        Light?: string;
        Dark?: string;
      };
    };
  };
  [key: string]: unknown;
}

/**
 * Convert a Figma alias like "{color.primary.500}" to a CSS var reference
 * like "var(--color-primary-500)".
 */
function aliasToVar(alias: string): string {
  // Strip braces: {color.primary.500} → color.primary.500
  const path = alias.replace(/^\{/, '').replace(/\}$/, '');
  // Split: ["color", "primary", "500"]
  const parts = path.split('.');
  // Skip the leading "color" segment — it's the JSON root key, not part of the CSS name
  // Result: --color-primary-500
  if (parts[0] === 'color' && parts.length === 3) {
    return `var(--color-${parts[1]}-${parts[2]})`;
  }
  // Fallback: just join all parts
  return `var(--${parts.join('-')})`;
}

/** Sanitize step names: "500-alpha-12" stays, "0-alpha-92" stays */
function cssVarName(family: string, step: string): string {
  return `--color-${family}-${step}`;
}

// ---------------------------------------------------------------------------
// Phase 1: Generate primitive CSS
// ---------------------------------------------------------------------------

function generatePrimitives(): string {
  const json = JSON.parse(readFileSync(PRIMITIVES_PATH, 'utf-8'));
  const families = json.color;
  const lines: string[] = [];

  lines.push('/* === Primitive Colour Ramps === */');
  lines.push('/* Source: src/tokens/primitives.json */');
  lines.push(':root {');

  for (const [familyName, familyData] of Object.entries(families)) {
    if (familyName.startsWith('$')) continue; // skip $description

    const family = familyData as Record<string, TokenEntry>;
    const desc = family.$description;
    lines.push('');
    if (desc) lines.push(`  /* ${familyName} — ${desc} */`);

    for (const [step, token] of Object.entries(family)) {
      if (step.startsWith('$')) continue; // skip $description, $type etc.
      const entry = token as TokenEntry;
      if (entry.$value) {
        const varName = cssVarName(familyName, step);
        lines.push(`  ${varName}: ${entry.$value};`);
      }
    }
  }

  lines.push('}');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Phase 2: Generate semantic CSS (light + dark)
// ---------------------------------------------------------------------------

interface SemanticResult {
  lightVars: string[];
  darkVars: string[];
}

function walkSemantics(obj: Record<string, unknown>, prefix: string): SemanticResult {
  const result: SemanticResult = { lightVars: [], darkVars: [] };

  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;

    const node = value as Record<string, unknown>;
    const currentPath = prefix ? `${prefix}-${key}` : key;

    // If this node has $type, it's a leaf token
    if (node.$type === 'color') {
      const extensions = node.$extensions as TokenEntry['$extensions'];
      const modes = extensions?.['com.figma']?.modes;

      if (modes) {
        const lightAlias = modes.Light;
        const darkAlias = modes.Dark;

        if (lightAlias) {
          result.lightVars.push(`  --${currentPath}: ${aliasToVar(lightAlias)};`);
        }
        if (darkAlias) {
          result.darkVars.push(`  --${currentPath}: ${aliasToVar(darkAlias)};`);
        }
      } else if (typeof node.$value === 'string') {
        // No modes — same value for both
        const varRef = aliasToVar(node.$value);
        result.lightVars.push(`  --${currentPath}: ${varRef};`);
        result.darkVars.push(`  --${currentPath}: ${varRef};`);
      }
    } else {
      // Nested object — recurse
      const nested = walkSemantics(node as Record<string, unknown>, currentPath);
      result.lightVars.push(...nested.lightVars);
      result.darkVars.push(...nested.darkVars);
    }
  }

  return result;
}

function generateSemantics(): string {
  const json = JSON.parse(readFileSync(SEMANTICS_PATH, 'utf-8'));
  const lines: string[] = [];

  // Collect all categories
  const categories = [
    'surface',
    'text',
    'border',
    'action',
    'feedback',
    'accent',
    'badge',
    'weather',
  ];
  const allLight: string[] = [];
  const allDark: string[] = [];

  for (const category of categories) {
    if (!json[category]) continue;

    allLight.push('');
    allLight.push(`  /* ${category} */`);
    allDark.push('');
    allDark.push(`  /* ${category} */`);

    const result = walkSemantics(json[category] as Record<string, unknown>, category);
    allLight.push(...result.lightVars);
    allDark.push(...result.darkVars);
  }

  lines.push('');
  lines.push('/* === Semantic Tokens (Light) === */');
  lines.push('/* Source: src/tokens/semantics.json */');
  lines.push(':root {');
  lines.push(...allLight);
  lines.push('}');

  lines.push('');
  lines.push('/* === Semantic Tokens (Dark) === */');
  lines.push('.dark {');
  lines.push(...allDark);
  lines.push('}');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const header = [
    '/*',
    ' * AUTO-GENERATED — do not edit manually.',
    ' * Source: src/tokens/primitives.json + src/tokens/semantics.json',
    ' * Script: scripts/build-tokens.ts',
    ' * Regenerate: npm run tokens:build',
    ' */',
    '',
  ].join('\n');

  const primitives = generatePrimitives();
  const semantics = generateSemantics();
  const output = header + primitives + '\n' + semantics + '\n';

  // Ensure output directory exists
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, output, 'utf-8');

  // Count what was generated
  const primCount = (output.match(/--color-\w+-/g) || []).length;
  const semCount = (output.match(/--(?:surface|text|border|action|feedback|accent|badge)-/g) || [])
    .length;
  console.log(
    `✓ Generated ${OUTPUT_PATH.replace(ROOT + '/', '')}\n` +
      `  ${primCount} primitive vars, ${semCount} semantic vars (light + dark)`,
  );
}

main();
