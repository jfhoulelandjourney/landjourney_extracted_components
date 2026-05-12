#!/usr/bin/env node
/**
 * Walk the source repo's `projects/common/src/lib` tree and emit a Markdown
 * checklist of every *.component.ts file, grouped by top-level directory.
 *
 * Usage:
 *   node scripts/list-components.mjs            # writes EXTRACTION_PROGRESS.md
 *   node scripts/list-components.mjs --diff     # prints components missing a story in this repo
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SOURCE_LIB =
  '/Users/jfhoule/Documents/Code/2026/lanjourney_local_environement_2026/user-interfaces/projects/common/src/lib';
const DEST_LIB = path.join(REPO_ROOT, 'projects/extracted/src/lib');

function walk(dir, ext) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, ext));
    else if (entry.name.endsWith(ext)) out.push(full);
  }
  return out;
}

const sourceComponents = walk(SOURCE_LIB, '.component.ts').sort();
const sourceDirectives = walk(SOURCE_LIB, '.directive.ts').sort();
const sourcePipes = walk(SOURCE_LIB, '.pipe.ts').sort();
const destStories = new Set(
  walk(DEST_LIB, '.stories.ts').map((p) =>
    path.basename(p).replace('.stories.ts', ''),
  ),
);

function relSource(p) {
  return p.slice(SOURCE_LIB.length + 1);
}

function groupByTopDir(files) {
  const groups = new Map();
  for (const file of files) {
    const rel = relSource(file);
    const top = rel.split('/')[0];
    if (!groups.has(top)) groups.set(top, []);
    groups.get(top).push(rel);
  }
  return groups;
}

if (process.argv.includes('--diff')) {
  const missing = sourceComponents.filter((p) => {
    const base = path.basename(p).replace('.component.ts', '');
    return !destStories.has(`${base}.component`);
  });
  console.log(`Source components: ${sourceComponents.length}`);
  console.log(`With stories in dest: ${sourceComponents.length - missing.length}`);
  console.log(`Missing stories: ${missing.length}`);
  process.exit(0);
}

const groups = groupByTopDir(sourceComponents);
const dirGroups = groupByTopDir(sourceDirectives);
const pipeGroups = groupByTopDir(sourcePipes);

let out = `# Extraction progress\n\n`;
out += `Source: \`projects/common/src/lib/\`  \n`;
out += `Total components: **${sourceComponents.length}**  \n`;
out += `Total directives: **${sourceDirectives.length}**  \n`;
out += `Total pipes: **${sourcePipes.length}**  \n\n`;
out += `Each box gets ticked when the component has a \`.stories.ts\` in this repo.\n\n`;

for (const [top, files] of [...groups.entries()].sort()) {
  out += `## ${top} (${files.length})\n\n`;
  for (const rel of files) {
    const base = path.basename(rel).replace('.component.ts', '');
    const checked = destStories.has(`${base}.component`) ? 'x' : ' ';
    out += `- [${checked}] \`${rel}\`\n`;
  }
  out += `\n`;
}

if (sourceDirectives.length) {
  out += `## Directives (${sourceDirectives.length})\n\n`;
  for (const [, files] of dirGroups) for (const rel of files) out += `- \`${rel}\`\n`;
  out += `\n`;
}
if (sourcePipes.length) {
  out += `## Pipes (${sourcePipes.length})\n\n`;
  for (const [, files] of pipeGroups) for (const rel of files) out += `- \`${rel}\`\n`;
  out += `\n`;
}

const target = path.join(REPO_ROOT, 'EXTRACTION_PROGRESS.md');
fs.writeFileSync(target, out);
console.log(
  `Wrote ${target} — ${sourceComponents.length} components, ${destStories.size} stories present.`,
);
