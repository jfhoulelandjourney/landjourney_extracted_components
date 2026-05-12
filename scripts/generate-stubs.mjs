#!/usr/bin/env node
/**
 * Generate minimal `Default` story stubs for every *.component.ts that
 * doesn't already have a sibling .stories.ts.
 *
 * The stubs:
 *   - Compile cleanly (no TypeScript errors)
 *   - Show up in the Storybook sidebar so the design system is browsable
 *   - Render with empty `args: {}` — components that need props/services may
 *     show a runtime error in the canvas; that's fine, the entry exists for
 *     navigation and the error tells you what needs mocking next.
 *
 * The stubs are MARKED. Each generated file starts with `// AUTO-GENERATED STUB`
 * so a follow-up wave can find them and upgrade them. Real stories should
 * remove that marker (or just be longer than the stub template).
 *
 * Skip rules:
 *   - File already has a story → skip
 *   - No exported component class (private) → skip (logged as 'private-class')
 *   - Class is `abstract` → skip (logged as 'abstract')
 *   - Component selector starts with `[` (attribute-only) → skip with note,
 *     since `<selector>` template form doesn't apply
 *
 * Usage
 *   node scripts/generate-stubs.mjs              # generate stubs
 *   node scripts/generate-stubs.mjs --dry-run    # report only
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DEST_LIB = path.join(REPO_ROOT, 'projects/extracted/src/lib');
const DRY_RUN = process.argv.includes('--dry-run');

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.component.ts')) out.push(full);
  }
  return out;
}

function hasStory(componentPath) {
  const dir = path.dirname(componentPath);
  const base = path.basename(componentPath, '.component.ts');
  return (
    fs.existsSync(path.join(dir, `${base}.component.stories.ts`)) ||
    fs.existsSync(path.join(dir, `${base}.stories.ts`))
  );
}

/**
 * Parse the file to find an exported, non-abstract @Component class.
 * Returns { className, selector } or null if unsuitable.
 */
function inspect(content) {
  // Find exported component classes (not abstract).
  // Abstract:    `export abstract class Foo`  → skip
  // Default:     `export class Foo`            → keep
  // Private:     `class Foo` (no export)       → skip
  // Generic:     `export class Foo<T>`         → keep, but track that it's generic
  const exportRegex =
    /export\s+(?:abstract\s+)?class\s+(\w+)(\s*<[^{]+>)?/g;
  const exportMatches = [...content.matchAll(exportRegex)];
  if (exportMatches.length === 0) return { reason: 'private-class' };

  let className = null;
  let generic = '';
  for (const m of exportMatches) {
    if (/abstract/.test(m[0])) continue;
    className = m[1];
    if (m[2]) {
      // Replace each generic param with `unknown` so the story typings
      // resolve without us authoring real type arguments.
      // Use `Record<string, unknown>` so it satisfies common
      // generic constraints like `T extends object`.
      const params = m[2]
        .slice(1, -1)
        .split(',')
        .map(() => 'Record<string, unknown>');
      generic = `<${params.join(', ')}>`;
    }
    break;
  }
  if (!className) return { reason: 'abstract' };

  // Pull the selector from the @Component decorator (best-effort).
  const selectorMatch = content.match(/selector:\s*['"`]([^'"`]+)['"`]/);
  const selector = selectorMatch ? selectorMatch[1] : null;

  return { className, selector, generic };
}

/**
 * Convert a path inside DEST_LIB into a Storybook title hierarchy.
 *  web-components/loans/loan-tile/loan-tile.component.ts
 *    → 'Web Components / Loans / Loan Tile'
 */
function titleCase(seg) {
  return seg
    .replace(/^_/, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function deriveTitle(componentPath) {
  const rel = path.relative(DEST_LIB, componentPath);
  const parts = rel.split('/');
  const filenameBase = path
    .basename(componentPath, '.component.ts')
    // turn `field-inspector` into `Field Inspector`
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  // The directory tree, minus generic "components" wrappers AND the
  // immediate parent dir if it matches the filename base (e.g.
  // `button2/button.component.ts` is just `button2/`, no need to repeat).
  const dirParts = parts
    .slice(0, -1)
    .filter((p) => p !== 'components')
    .map(titleCase);

  const lastDir = dirParts[dirParts.length - 1];

  // If the last dir already matches the filename base, just use the
  // dir hierarchy. Otherwise, append the filename base for uniqueness so
  // sibling components in the same dir don't collide.
  if (lastDir && lastDir.toLowerCase() === filenameBase.toLowerCase()) {
    return dirParts.join(' / ');
  }
  return [...dirParts, filenameBase].join(' / ');
}

const found = walk(DEST_LIB);
const result = {
  generated: [],
  skipped_already: 0,
  skipped_private: [],
  skipped_abstract: [],
  skipped_attribute_selector: [],
};

for (const componentPath of found) {
  if (hasStory(componentPath)) {
    result.skipped_already++;
    continue;
  }

  const content = fs.readFileSync(componentPath, 'utf-8');
  const inspected = inspect(content);

  if ('reason' in inspected) {
    if (inspected.reason === 'private-class') {
      result.skipped_private.push(path.relative(DEST_LIB, componentPath));
    } else if (inspected.reason === 'abstract') {
      result.skipped_abstract.push(path.relative(DEST_LIB, componentPath));
    }
    continue;
  }

  const { className, selector, generic = '' } = inspected;
  const classRef = `${className}${generic}`;

  // Attribute-only selectors (e.g. `[lj-input]`) need an attribute on a
  // host element, not <selector>. We still generate the meta so the
  // component appears in the sidebar (autodocs only); the Default story
  // is rendered with the most permissive template we can author.
  const isAttributeOnly = selector && selector.trim().startsWith('[');

  const title = deriveTitle(componentPath);
  const dir = path.dirname(componentPath);
  const base = path.basename(componentPath, '.component.ts');
  const storyPath = path.join(dir, `${base}.component.stories.ts`);
  const importBase = `./${base}.component`;

  // Build the file content
  const lines = [
    `// AUTO-GENERATED STUB — replace with a real story when ready.`,
    `// See PLAN.md "Working patterns" for the full story template.`,
    `import type { Meta, StoryObj } from '@storybook/angular';`,
    `import { ${className} } from '${importBase}';`,
    ``,
    `const meta: Meta<${classRef}> = {`,
    `  title: '${title}',`,
    `  component: ${className},`,
    `  tags: ['autodocs'],`,
    `  parameters: {`,
    `    docs: {`,
    `      description: {`,
    `        component:`,
    `          'Auto-generated stub. May render with errors until real mock inputs are provided. Replace with a hand-written story to fix.',`,
    `      },`,
    `    },`,
    `  },`,
    `};`,
    ``,
    `export default meta;`,
    `type Story = StoryObj<${classRef}>;`,
    ``,
  ];

  if (isAttributeOnly) {
    lines.push(
      `export const Default: Story = {`,
      `  // Attribute-only selector ('${selector}') — the component is meant to`,
      `  // be applied to a host element. A meaningful story needs a real host.`,
      `  args: {},`,
      `};`,
      ``,
    );
    result.skipped_attribute_selector.push(
      path.relative(DEST_LIB, componentPath),
    );
  } else {
    lines.push(
      `export const Default: Story = {`,
      `  args: {},`,
      `};`,
      ``,
    );
  }

  if (!DRY_RUN) {
    fs.writeFileSync(storyPath, lines.join('\n'));
  }
  result.generated.push(path.relative(DEST_LIB, componentPath));
}

console.log(DRY_RUN ? '=== DRY RUN ===' : '=== STUBS GENERATED ===');
console.log(`Components scanned:      ${found.length}`);
console.log(`Already had a story:     ${result.skipped_already}`);
console.log(`Generated stubs:         ${result.generated.length}`);
console.log(`Skipped (private class): ${result.skipped_private.length}`);
console.log(`Skipped (abstract):      ${result.skipped_abstract.length}`);
console.log(
  `Note: ${result.skipped_attribute_selector.length} stubs have attribute-only selectors (rendered as autodocs entries only).`,
);
console.log('');

if (result.skipped_private.length > 0) {
  console.log('Private classes (not exported, can\'t be storied):');
  for (const f of result.skipped_private.slice(0, 10)) console.log(`  - ${f}`);
  if (result.skipped_private.length > 10) {
    console.log(`  …and ${result.skipped_private.length - 10} more.`);
  }
  console.log('');
}

if (result.skipped_abstract.length > 0) {
  console.log('Abstract classes (can\'t be instantiated):');
  for (const f of result.skipped_abstract.slice(0, 10)) console.log(`  - ${f}`);
  if (result.skipped_abstract.length > 10) {
    console.log(`  …and ${result.skipped_abstract.length - 10} more.`);
  }
  console.log('');
}

if (DRY_RUN && result.generated.length > 0) {
  console.log('Re-run without --dry-run to write the stub files.');
}
