# Handoff: Budget-Planer — UI Mockups

## Overview
UI mockups for a personal budget-planning web app ("Kontobuch"). Users register/log in, record Einnahmen (income) and Ausgaben (expenses — fix or variabel), create/edit/delete transactions, and maintain a reusable list of recurring expense labels (e.g. "Miete", "Tanken"). Each user only sees their own data — no sharing/multi-user households, just isolated accounts behind email+password auth.

## About the Design Files
The files in `design/` are **design references built in HTML**, not production code to copy directly. `Budget-Planer.dc.html` is a static prototype — open it in a browser (it's self-contained with `support.js` and the `_ds/` design-system assets alongside it) to view all screens. The task is to **recreate these designs in the target codebase's stack** (pick React/Vue/whatever fits, or use the project's existing stack if one exists) using real components, real state, and a real backend/auth — not to embed this HTML as-is.

## Fidelity
**High-fidelity.** Colors, type, spacing and component styles are final and come from the bound design system ("Broadsheet") — see Design Tokens below. Layouts and copy (German) are final; interactive behavior (data binding, validation, persistence) is only implied by the static mockups and must be implemented for real.

## Design System
All screens use the **Broadsheet** design system: a newsprint-style aesthetic — Source Serif 4 throughout (headings and body), a light paper background, near-black text, and two spot-color accents (cyan `--color-accent`, magenta `--color-accent-2`) used sparingly. No boxes/dividers for layout — hierarchy comes from type scale and whitespace; `.card` is reserved for discrete list items (e.g. dashboard stat tiles), never for page structure.

The system ships as:
- `_ds/broadsheet-.../styles.css` — all tokens (`--color-*`, `--font-*`, `--space-*`, `--radius-*`, `--shadow-*`) plus component classes (`.btn`, `.tag`, `.field`/`.input`/`.radio`/`.seg`, `.card`, `.nav`, `.table`, `.dialog*`).
- `_ds/broadsheet-.../_ds_bundle.js` — bundled JS for the system's print-plate effects (not used on these interface screens).

**Recreate the app using this stylesheet's CSS variables and class names directly** (or port the tokens into your framework's theme) rather than inventing new colors/spacing.

## Screens / Views

### 1. Login (`#1f`)
- **Purpose**: Existing user signs in.
- **Layout**: Centered card, 420px wide, generous vertical padding (~56px/40px). Column stack, centered brand mark (wallet icon + "Kontobuch" wordmark), left-aligned heading block below it.
- **Components**: `h1` "Willkommen zurück" (22px, serif heading weight) + subcopy (13px, 60% opacity). Fields: E-Mail (`.field`/`.input`), Passwort (`.input type=password`). "Angemeldet bleiben" checkbox. `.btn.btn-primary.btn-block` "Anmelden". Footer line: "Noch kein Konto? **Registrieren**" (link in `--color-accent-700`, links to Register screen).
- **Content**: sample value `maria.keller@email.de` shown as placeholder-filled text (illustrative only).

### 2. Registrierung (`#1g`)
- **Purpose**: New user creates an account.
- **Layout**: Same shell as Login (420px centered card).
- **Components**: `h1` "Konto erstellen" + subcopy "Deine Daten bleiben privat — nur du siehst deine Einnahmen und Ausgaben." Fields: E-Mail, Passwort, Passwort bestätigen. `.btn.btn-primary.btn-block` "Konto erstellen". Footer: "Bereits registriert? **Anmelden**".
- **Validation to implement**: email format, password length (mock placeholder says "Mindestens 8 Zeichen"), password/confirm match.

### 3a. Dashboard — Kartenübersicht (`#1a`)
- **Purpose**: Default landing screen after login; monthly/yearly summary.
- **Layout**: `.nav` header (brand "Kontobuch", links Übersicht/Transaktionen/Bezeichnungen, primary "+ Neue Ausgabe" button, user name at far right). Page body: header row with `h1` "Übersicht" + a `.seg` Monat/Jahr toggle + period label with chevron (e.g. "Juli 2026"). 3-column grid of `.card` stat tiles (Einnahmen, Ausgaben, Saldo — Saldo value in `--color-accent-700`). Below: 2-column grid — left is a fix/variabel proportion bar (`.bar-track`, two flex segments colored `--color-accent-500` / `--color-accent-2-400`) with a legend; right is a "Letzte Transaktionen" mini-list (label + type tag + amount, 4 rows).
- **Content (July 2026 sample)**: Einnahmen 2.770,00 €, Ausgaben 1.363,59 € (Fix 951,89 € / Variabel 411,70 €), Saldo 1.406,41 €.

### 3b. Dashboard — Tabellenfokus (`#1b`)
- **Purpose**: Alternative dashboard for users who prefer a dense, all-transactions table over cards.
- **Layout**: Same `.nav` + header row (Monat/Jahr `.seg`). Compact inline totals line (three `stat-meta` labels, no boxes). Full `.table` below listing all transactions for the period: Datum / Bezeichnung / Art (tag) / Betrag (right-aligned).
- **Content**: 9 rows mixing Einnahmen (Gehalt, Nebenjob) and Ausgaben (Miete, Lebensmittel, Netflix, Tanken, Strom, Internet, Restaurant), tagged Fix/Variabel/Einnahme.

### 3c. Dashboard — Zeitstrahl (`#1c`)
- **Purpose**: Chronological, filterable view.
- **Layout**: Two-column: 220px left sidebar (Zeitraum `.seg`, Art `.radio` list — Alle/Einnahmen/Fix/Variabel, Bezeichnung filter chips using `.chip`/`.chip-active`); right column groups transactions under date headings ("Dienstag, 22. Juli", etc.), each a `.mini-row` (label + tag + signed amount).

### 4a. Ausgabe anlegen — Formularseite (`#1d`)
- **Purpose**: Full-page form to create/edit an expense.
- **Layout**: `.nav` (Transaktionen active) + "← Zurück zu Transaktionen" back-link + `h1` "Neue Ausgabe". Form, max-width 640px: 2-col row (Betrag, Datum), `.seg` Fix/Variabel, a **Bezeichnung chip-picker** (existing recurring labels as `.tag` chips — one shown selected via `.tag-accent`, rest `.tag-outline` — plus a "+ Neue Bezeichnung" `.btn-ghost` to add one inline), optional Notiz `textarea`. Actions: `.btn-primary` "Ausgabe speichern", `.btn-secondary` "Abbrechen".
- **Behavior to implement**: selecting a Bezeichnung chip should set the transaction's category; "+ Neue Bezeichnung" should open the label-creation flow (see Screen 6) without losing the in-progress form.

### 4b. Ausgabe anlegen — Dialog (`#1e`)
- **Purpose**: Same create/edit form, presented as a modal over the dashboard so users don't leave their current context.
- **Layout**: `.dialog-backdrop` + `.dialog` (`.dialog-title`/`-body`/`-actions`) over a dimmed dashboard background. Same fields as 4a, condensed (no Notiz field shown, but can be added).
- **Recommendation**: use this variant if the team wants "quick add" from anywhere (e.g. a keyboard shortcut or the nav's "+ Neue Ausgabe" button); use 4a if expense entry warrants its own URL/route.

### 5. Bezeichnungen verwalten (`#1h`)
- **Purpose**: Manage the reusable list of recurring expense labels referenced from the expense form's chip-picker.
- **Layout**: `.nav` (Bezeichnungen active) + `h1` + subcopy. Add-new row: `.input` (placeholder "z. B. Fitnessstudio") + `.btn-primary` "Hinzufügen". List of existing labels as rows (`.mini-row`): type tag (Fix/Variabel) + label name + usage meta ("Fix · zuletzt 22.07.2026") + edit (pencil) / delete (trash) icon buttons (`.icon-btn`).
- **Sample labels**: Miete (Fix), Tanken (Variabel), Lebensmittel (Variabel), Strom (Fix), Internet (Fix), Netflix (Fix).
- **Behavior to implement**: delete should warn if the label is still used by existing transactions (not shown in mockup — flag for the dev to decide: block delete, or delete label but keep transactions' text).

### 6. Alle Transaktionen (`#1i`)
- **Purpose**: Full, filterable/searchable transaction list with edit/delete.
- **Layout**: `.nav` (Transaktionen active) + header row (`h1` "Transaktionen" + `.btn-primary` "+ Neue Ausgabe" linking to screen 4a/4b). Filter row: `.seg` Alle/Einnahmen/Ausgaben, `.chip`/`.chip-active` Fix/Variabel toggle, search `.input` (right-aligned, `margin-left:auto`). `.table` with Datum/Bezeichnung/Art/Betrag/Aktionen (edit + delete `.icon-btn` per row). Pagination note "1–5 von 34" at bottom.
- **Behavior to implement**: delete should ask for confirmation (no dialog shown in mockup — reuse `.dialog` pattern from screen 4b for a "Wirklich löschen?" confirm).

## Interactions & Behavior
- Auth: email+password login/register; each user's transactions and labels are scoped to their account only (no sharing).
- Fix vs. Variabel is a per-expense classification set at creation, editable later.
- Recurring labels are a user-owned lookup list (CRUD), referenced by expenses via the chip-picker — not free text.
- Dashboard's Monat/Jahr `.seg` toggles the aggregation period; the period label (e.g. "Juli 2026") should be clickable/steppable (prev/next period) — only the chevron affordance is mocked.
- All amounts are EUR, formatted with a comma decimal separator and thousands dot (German locale, e.g. `1.363,59 €`); dates as `DD.MM.` (list context) or `DD.MM.YYYY` (form context).
- No hover/focus states were custom-designed beyond what `styles.css` already themes — buttons, links, inputs, and `.icon-btn` inherit the system's `:hover`/`:focus-visible` treatment (accent-ramp tint, 2px accent focus ring). Don't restyle these per screen.

## State Management
Suggested minimum state/data model:
- `User { id, email, passwordHash }`
- `Label { id, userId, name, type: 'fix' | 'variabel' }` (recurring expense label)
- `Transaction { id, userId, type: 'einnahme' | 'ausgabe', labelId (nullable, ausgabe only), amount, date, note }`
- View state: selected period (month/year + which month/year), active filters (type, label chips, search query) on the transactions list.

## Design Tokens
From `_ds/broadsheet-.../styles.css` — use these, don't hardcode new values:
- **Background**: `--color-bg #f3f2f2`, **surface** (cards): `--color-surface #eae9e9`, **text**: `--color-text #201e1d`, **divider**: `--color-divider` (16% mix of text).
- **Accent (cyan)**: `--color-accent #0088b0`, ramp `--color-accent-100…900` (`#e9f8ff` → `#0a303e`).
- **Accent 2 (magenta)**: `--color-accent-2 #d6006c`, ramp `--color-accent-2-100…900` (`#fff1f4` → `#4b1528`).
- **Neutral ramp**: `--color-neutral-100…900` (`#f8f4f4` → `#2d2b2b`).
- **Type**: `--font-heading` / `--font-body` = `"Source Serif 4", system-ui, sans-serif`; heading weight `600`.
- **Spacing** (1.25× density): `--space-1: 5px`, `-2: 10px`, `-3: 15px`, `-4: 20px`, `-6: 30px`, `-8: 40px`.
- **Radius**: `--radius-sm: 1px`, `-md: 2px`, `-lg: 4px`.
- **Shadow**: `--shadow-sm/md/lg` (ink-tinted, see styles.css).

## Assets
- Icons are hand-drawn duotone-style SVGs (plus, pencil, trash, mail, lock, wallet, chevron-down, arrow-left) inlined directly in the mockup HTML, styled after Phosphor's duotone convention (outline shape at 25% opacity + solid detail). **Recreate with actual Phosphor icons** (duotone weight, https://phosphoricons.com) in the real app rather than reusing these approximations.
- No photographs/illustrations are used on these interface screens (per the design system, interface imagery would take the `.halftone` treatment if any were added later).

## Screenshots
`screenshots/` contains a PNG per screen (1f-login, 1g-registrierung, 1a-dashboard-karten, 1b-dashboard-tabelle, 1c-dashboard-zeitstrahl, 1d-ausgabe-formular, 1e-ausgabe-dialog, 1h-bezeichnungen, 1i-transaktionen) for quick reference without opening the HTML.

## Files
- `design/Budget-Planer.dc.html` — all 9 screens, open in any browser (self-contained with the two files below).
- `design/support.js` — runtime helper required by the mockup file above; keep alongside it, not needed by your real implementation.
- `design/_ds/broadsheet-.../styles.css` — the design system stylesheet (source of truth for tokens/components).
- `design/_ds/broadsheet-.../_ds_bundle.js` — design system bundle JS (print-plate effects; not exercised on these screens).
