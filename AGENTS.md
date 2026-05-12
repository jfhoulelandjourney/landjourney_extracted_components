# Session-start protocol — read first

This file is auto-loaded into your context when you open this repo. **Read it
fully before doing anything else**, then read `PLAN.md` for the wave plan.

## What this repo is

A standalone Angular 21 + Storybook playground that mirrors the **real**
components from a separate Angular monorepo. The user uses it to browse and
redesign the company's component library in isolation — without running the
production app and **without** modifying the source repo.

- **Source repo (read-only):**
  `/Users/jfhoule/Documents/Code/2026/lanjourney_local_environement_2026/user-interfaces/projects/common/src/lib/`
- **This repo (destination):** an Angular workspace with one library
  (`projects/extracted/`) and Storybook wired up.
- Components are physically **copied** from source — never linked, never
  consumed as a dep. Source is sacrosanct.

## Every new session — do this first, in order

```bash
# 1) Sync any new components / files added to source since last session.
#    Safe: never overwrites existing local files, never deletes anything.
npm run sync-source

# 2) Rebuild the progress checklist.
npm run list-components

# 3) See exactly how many components still need a story.
node scripts/list-components.mjs --diff
```

Then read **`PLAN.md`** end to end. It contains:

- The wave plan (1 → 6) and which waves are done
- Working patterns you must follow (service stubs cast `as unknown as ...`,
  dialog story shape, where to put files, etc.)
- A list of components consciously deferred and why
- The exact paths of source-of-truth example stories to model after

After that, look at the most recent commits with `git log --oneline -20` to
see what was done last. The user often interrupts and resumes across sessions
— do not assume the previous session got to "done."

## What "re-scanning" means

The source repo evolves. New components, new directives, new fields land in
upstream. Every session you must:

1. Run `npm run sync-source` — pulls new files into this repo (never
   overwrites local).
2. The script reports **new components** — those need stories.
3. The script also reports **orphans** (files we have but source no longer
   does). Do **not** auto-delete; flag them in your summary so the user can
   decide.

Treat this as table stakes, not optional. If you skip the sync, you'll write
stories for stale code or miss components entirely.

## What to do once you know what's missing

Pick up the next active wave per `PLAN.md`'s "Status by wave" section and
continue. Story-writing pattern is in `PLAN.md` under "Working patterns" —
**do not invent your own**. Use the existing source stories
(`web-components/button2/button.component.stories.ts`,
`web-components/signature/pdf-signature-builder.stories.ts`) as canonical
templates.

After each wave:

- `npm run build-storybook` must exit 0 — every component must compile.
- `npm run list-components` to refresh `EXTRACTION_PROGRESS.md`.
- Update `PLAN.md`'s "Status by wave" with what you finished and what you
  deferred (and why). **The next session reads PLAN.md to know where to
  start; if you don't update it, the next session re-does work.**

## Things that are not optional

- **Do not modify the source repo.** Read-only. If you need a sibling file
  that doesn't exist yet, that's a problem to flag, not to fix in source.
- **Do not delete anything from this repo without asking.** Including
  "obviously stale" files — they may be local mocks the user added.
- **Do not commit unless the user explicitly asks.** Local commits are fine
  to suggest; never push.
- **Do not invent component APIs.** If you can't figure out the inputs from
  reading the source `.component.ts`, look at the template, the existing
  source story (if any), and the model files. If still stuck, ask.

## Common pitfalls

- **Service stubs**: use `as unknown as ServiceType`, NOT `Partial<ServiceType>`
  — Partial breaks on private members. See PLAN.md.
- **Dialogs**: render inline inside a styled wrapper with `MAT_DIALOG_DATA`
  + stubbed `MatDialogRef`; don't try to invoke `MatDialog.open()`.
- **Lottie + router + animations** are already wired globally in
  `.storybook/preview.ts`. Don't re-provide per story.
- **Strict input typing**: when a component declares
  `value = input<string>()`, do NOT pass a number in `args` — Storybook's
  type checker WILL fail the build.
- **Mock data**: realistic Landjourney values (borrower names, loan amounts,
  ag domain). Never lorem ipsum — the point is to evaluate visual quality.
- **Missing deps**: a new sync may pull a component that imports a package
  not yet installed locally. Add it to `package.json`, `npm install`, rebuild.

## When you finish a session

1. Update `PLAN.md` "Status by wave" — what's complete, what's deferred,
   any new patterns you established.
2. Run `npm run build-storybook` one final time — must succeed.
3. Summarize for the user in chat: stories added, components covered,
   what's next, any blockers.
4. Do NOT commit unless the user said to.

This file (`CLAUDE.md`) and `AGENTS.md` are mirrors of the same content for
different agent runtimes. If you change one, change the other.
