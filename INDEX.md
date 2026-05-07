# Extraction progress

Last updated: Wave 2
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
- [x] pages/HomeShowcase
- [x] src/main.tsx, src/App.tsx (showcase router stub)

## ✅ Wave 2 — Tables & status primitives (DONE)
- [x] ui/Avatar (initials + generated colour palette)
- [x] ui/AvatarStack (with overflow +N indicator)
- [x] ui/StatusPill (info / progress / success / danger / warning / neutral tones, calibrated to real app)
- [x] ui/ProgressBar (multi-segment, tone or hex colour)
- [x] ui/Tabs (magenta underline, optional rightSlot for sort/toggle)
- [x] ui/SearchInput (inline + banner variants)
- [x] ui/FilterBar (+ chips, +Add filter button)
- [x] ui/Pagination (simple + numbered variants)
- [x] ui/DataTable (sticky header, sortable, skeleton rows, empty state, optional pagination footer)
- [x] mocks/types.ts, mocks/users.ts, mocks/requests.ts
- [x] pages/RequestsShowcase (rebuilds the live Requests page look)

## ⏭️ Wave 3 — Forms & auth (NEXT)
- [ ] ui/Button (primary/secondary/danger/ghost/icon variants)
- [ ] ui/TextField, PasswordField (with visibility toggle), NumberField
- [ ] ui/Checkbox, ui/Toggle, ui/Select, ui/SortDropdown
- [ ] ui/CopyableField, ui/Tag
- [ ] ui/LoginCard (clients app)
- [ ] pages/LoginShowcase, pages/SettingsGeneralShowcase

## ⏭️ Wave 4 — Domain widgets & detail pages
- [ ] domain/RequestStageStepper, RequestOverviewHeader, ProgressSummaryStrip
- [ ] domain/CustomerTaskTable, DiscussionPanel
- [ ] domain/CustomerIdentityCard, AddressesTable, BusinessesTable
- [ ] mocks/factories for tasks, sections
- [ ] pages/RequestOverviewShowcase, pages/CustomerDetailShowcase

## ⏭️ Wave 5 — Dynamic Form Builder
- [ ] form-builder/FormBuilderShell
- [ ] form-builder/FieldPalette
- [ ] form-builder/SectionCanvas (Inline/Steps/Tabs)
- [ ] form-builder/SubSection, RepeatingGroup
- [ ] form-builder/FieldEditorRow
- [ ] form-builder/PreviewPane, JsonEditorPane
- [ ] pages/FormBuilderShowcase
