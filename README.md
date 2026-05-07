# landjourney_extracted_components

A showcase library that extracts the visual component vocabulary of the Landjourney admin & client apps into a stand-alone, mock-data-driven workspace. Built so each component can be refined in isolation, then ported back into the main project.

## Stack

- **Vite + React + TypeScript** (the source app is Angular Material; we mirror its visual language but ship a framework-agnostic-ish library that is trivial to port back)
- **SCSS** with the original app's design tokens (extracted from the live CSS variables)
- **Storybook 8** for individual components (added in a later wave)
- **MSW + @faker-js/faker** for realistic mock data (added in Wave 4)

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints. The top-right dropdown lets you switch between showcase pages.

## Project layout

```
src/
  tokens/      # design tokens (colors, spacing, typography, motion)
  ui/          # primitives & layout (AppShell, SideRail, PageHeader, ...)
  domain/      # data-aware widgets (request, customer, ...)  — added in Wave 4
  form-builder/# the dynamic form builder                    — added in Wave 5
  mocks/       # faker generators + JSON fixtures            — added in Wave 4
  pages/       # showcase pages assembled from the above
```

## Progress & resume marker

See [INDEX.md](./INDEX.md). Each "wave" is a self-contained batch of components delivered in a single commit so you can interrupt and resume cleanly.

## Porting back

Every component is presentational with typed props and no app-specific data fetching. The plan is to publish the library, then in the original Angular app either consume it as a web-component bundle or re-implement screens against the same prop contracts.
