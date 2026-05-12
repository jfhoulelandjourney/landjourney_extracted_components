#!/usr/bin/env node
/**
 * Sync NEW components, directives, pipes, models, services, and styles from
 * the source repo into this extraction repo.
 *
 * The source repo evolves: new components get added, existing ones get new
 * sibling files (additional .scss, sub-component, etc.). This script catches
 * those additions so a re-scan at the start of a new session brings them in.
 *
 * What it does
 * ------------
 *   - Walks every file under SOURCE_LIB
 *   - Skips test files (`.spec.ts`) and source `.stories.ts` (we author our
 *     own stories — but if a NEW source story lands for a component we don't
 *     yet have a story for, we DO copy it as a free win)
 *   - Copies each missing file into the matching DEST_LIB path
 *   - Copies updated `public-api.ts` if the source one changed
 *   - Reports: NEW (copied), MISSING-IN-SOURCE (likely deleted upstream — we
 *     do NOT auto-delete; the user decides)
 *   - Does NOT modify any file that already exists locally — local edits win
 *
 * What it does NOT do
 * -------------------
 *   - It does not write stories. Run `scripts/list-components.mjs --diff` to
 *     see what new components still need a `.stories.ts`.
 *   - It does not re-run npm install. If a NEW component imports a dep we
 *     don't yet have, the next build will fail with a clear "Cannot find
 *     module" error and you can `npm install` that dep.
 *
 * Usage
 *   node scripts/sync-source.mjs            # do the sync, print summary
 *   node scripts/sync-source.mjs --dry-run  # show what would change
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const SOURCE_REPO =
  '/Users/jfhoule/Documents/Code/2026/lanjourney_local_environement_2026/user-interfaces';
const SOURCE_LIB = path.join(SOURCE_REPO, 'projects/common/src/lib');
const SOURCE_PUBLIC_API = path.join(SOURCE_REPO, 'projects/common/src/public-api.ts');

const DEST_LIB = path.join(REPO_ROOT, 'projects/extracted/src/lib');
const DEST_PUBLIC_API = path.join(REPO_ROOT, 'projects/extracted/src/public-api.ts');

const DRY_RUN = process.argv.includes('--dry-run');

if (!fs.existsSync(SOURCE_LIB)) {
  console.error(`Source repo not found at ${SOURCE_LIB}`);
  console.error(
    `If the source repo moved, update SOURCE_REPO at the top of this script.`
  );
  process.exit(1);
}

function walk(dir, predicate) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, predicate));
    else if (predicate(entry.name, full)) out.push(full);
  }
  return out;
}

function shouldCopy(name) {
  // Skip tests — we don't run karma here.
  if (name.endsWith('.spec.ts')) return false;
  // We author our own stories. The notable exception is the team's
  // pre-existing source stories; those are valuable so we always pull a
  // story file IF we don't already have one with the same basename.
  if (name.endsWith('.stories.ts')) return true;
  return true;
}

const sourceFiles = walk(SOURCE_LIB, shouldCopy);

let copiedCount = 0;
const copiedDirs = new Set();
const newComponents = [];

for (const sourceFile of sourceFiles) {
  const rel = path.relative(SOURCE_LIB, sourceFile);
  const destFile = path.join(DEST_LIB, rel);

  if (fs.existsSync(destFile)) continue; // already present, leave local edits alone

  const destDir = path.dirname(destFile);
  if (!fs.existsSync(destDir)) {
    if (!DRY_RUN) fs.mkdirSync(destDir, { recursive: true });
    copiedDirs.add(path.relative(DEST_LIB, destDir));
  }
  if (!DRY_RUN) fs.copyFileSync(sourceFile, destFile);
  copiedCount++;
  if (rel.endsWith('.component.ts')) newComponents.push(rel);
}

// Sync public-api if it changed
let publicApiChanged = false;
if (fs.existsSync(SOURCE_PUBLIC_API)) {
  const sourceContent = fs.readFileSync(SOURCE_PUBLIC_API, 'utf-8');
  const destContent = fs.existsSync(DEST_PUBLIC_API)
    ? fs.readFileSync(DEST_PUBLIC_API, 'utf-8')
    : '';
  if (sourceContent !== destContent) {
    publicApiChanged = true;
    if (!DRY_RUN) fs.writeFileSync(DEST_PUBLIC_API, sourceContent);
  }
}

// Report files that exist locally but no longer in source (likely deleted).
// We do NOT auto-delete — humans decide.
const sourceRel = new Set(sourceFiles.map((f) => path.relative(SOURCE_LIB, f)));
const destFiles = fs.existsSync(DEST_LIB)
  ? walk(DEST_LIB, (name) => !name.endsWith('.stories.ts')) // don't flag local stories
  : [];
const orphans = destFiles
  .map((f) => path.relative(DEST_LIB, f))
  .filter(
    (rel) =>
      !sourceRel.has(rel) &&
      !rel.startsWith('_mocks/') && // local-only mock harness
      // Allow purely-local paths (none today, but reserve `_local/`)
      !rel.startsWith('_local/'),
  );

console.log(DRY_RUN ? '=== DRY RUN ===' : '=== SYNC COMPLETE ===');
console.log(`Source: ${SOURCE_LIB}`);
console.log(`Dest:   ${DEST_LIB}`);
console.log('');
console.log(`Files copied:           ${copiedCount}`);
console.log(`New component files:    ${newComponents.length}`);
console.log(`New directories:        ${copiedDirs.size}`);
console.log(`public-api.ts updated:  ${publicApiChanged ? 'yes' : 'no'}`);
console.log(`Orphans (in dest, not in source): ${orphans.length}`);
console.log('');

if (newComponents.length > 0) {
  console.log('New components needing stories:');
  for (const c of newComponents.slice(0, 30)) console.log(`  + ${c}`);
  if (newComponents.length > 30) {
    console.log(`  …and ${newComponents.length - 30} more.`);
  }
  console.log('');
}

if (orphans.length > 0) {
  console.log('Orphans (manually review — DO NOT auto-delete):');
  for (const o of orphans.slice(0, 30)) console.log(`  - ${o}`);
  if (orphans.length > 30) {
    console.log(`  …and ${orphans.length - 30} more.`);
  }
  console.log('');
}

if (copiedCount === 0 && !publicApiChanged) {
  console.log('Nothing new to sync.');
} else if (DRY_RUN) {
  console.log('Re-run without --dry-run to apply.');
} else {
  console.log('Next steps:');
  console.log('  1. node scripts/list-components.mjs   # rewrite EXTRACTION_PROGRESS.md');
  console.log('  2. npm run build-storybook            # confirm new files compile');
  console.log('  3. Write stories for the new components (see PLAN.md patterns)');
}
