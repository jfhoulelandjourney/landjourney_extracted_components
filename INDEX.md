# Extraction progress

Last updated: Wave 1
Source apps: admin.aglender.com:4200 (Angular + Material), clients.aglender.com:4201 (login)

## ✅ Wave 1 — Foundations (DONE)
- [x] Project skeleton: package.json, tsconfig.json, vite.config.ts, index.html, .gitignore
- [x] tokens: _tokens.scss, _typography.scss, index.scss
- [x] ui/AppShell
- [x] ui/SideRail (+ mock)
- [x] ui/PageHeader
- [x] ui/SectionCard
- [x] ui/EmptyState
- [x] ui/NotFoundPage
- [x] pages/HomeShowcase (assembly demo)
- [x] src/main.tsx, src/App.tsx (showcase router stub)

## ⏭️ Wave 2 — Tables & status primitives (NEXT)
- [ ] ui/DataTable (sticky header, search, skeleton rows, "Page X of Y", empty row)
- [ ] ui/StatusPill (Initiated / Processing / Approved / Closed colour map)
- [ ] ui/ProgressBar (segmented orange→red task progress)
- [ ] ui/Avatar + ui/AvatarStack (initials + generated colour)
- [ ] ui/Tabs (magenta underline)
- [ ] ui/SearchInput
- [ ] ui/FilterBar with FilterChip
- [ ] ui/Pagination
- [ ] pages/RequestsShowcase

## ⏭️ Wave 3 — Forms & auth
- [ ] ui/Button (primary/secondary/danger/icon variants)
- [ ] ui/TextField, PasswordField (with visibility toggle), NumberField
- [ ] ui/Checkbox, ui/Toggle, ui/Select, ui/SortDropdown
- [ ] ui/CopyableField, ui/Tag
- [ ] ui/LoginCard (clients app)
- [ ] pages/LoginShowcase, pages/SettingsGeneralShowcase

## ⏭️ Wave 4 — Domain widgets & detail pages
- [ ] domain/RequestStageStepper, RequestOverviewHeader, ProgressSummaryStrip
- [ ] domain/CustomerTaskTable, DiscussionPanel
- [ ] domain/CustomerIdentityCard, AddressesTable, BusinessesTable
- [ ] mocks/factories for request, customer, task
- [ ] pages/RequestOverviewShowcase, pages/CustomerDetailShowcase

## ⏭️ Wave 5 — Dynamic Form Builder
- [ ] form-builder/FormBuilderShell
- [ ] form-builder/FieldPalette
- [ ] form-builder/SectionCanvas (Inline/Steps/Tabs)
- [ ] form-builder/SubSection, RepeatingGroup
- [ ] form-builder/FieldEditorRow
- [ ] form-builder/PreviewPane, JsonEditorPane
- [ ] pages/FormBuilderShowcase
