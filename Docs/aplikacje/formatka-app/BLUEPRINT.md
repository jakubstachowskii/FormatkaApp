# Blueprint aplikacji referencyjnej (FormatkaApp)

> **Cel dokumentu:** Gotowa **baza dla AI**: jak aplikacja ma wyglądać, jak działać, jaki stack i jak to zbudować.
> Agent czyta go **po wyborze** tego szablonu. Nową aplikację buduje w **innej domenie**, zachowując UI, UX, architekturę i konwencje poniżej.
> Nie klonuje encji / menu / reguł branżowych tej aplikacji.

**Wersja blueprintu:** 1.0.0 · wrzesień 2026 · `package.json` v0.1.0

---

## 1. Profil produktu

| Aspekt | Opis |
|--------|------|
| **Typ** | Lokalna aplikacja desktopowa (Windows NSIS) |
| **Platforma** | Electron 33, okno 1280×860 (min 960×640) |
| **Domena tej app** | Kalkulator komponentów mebla — rozkrój płyty, podgląd SVG, lista elementów, PDF dla stolarni |
| **Filozofia** | Użytkownik konfiguruje parametry → natychmiastowy podgląd i tabela → eksport PDF; projekty zapisywane lokalnie |

### Zachować vs dostosować

| Zachować (wzorce) | Dostosować (domena) |
|-------------------|---------------------|
| Układ 2-kolumnowy, sekcje 01–05 | Nazwy pól, typy encji, jednostki |
| Stan `cfg` + `patch()` | Struktura `cfg` pod nową domenę |
| `computeFromConfig(cfg)` → `data.parts` | Funkcje obliczeniowe |
| Katalog presetów (tylko puste pola) | Wpisy katalogu i meta |
| SQLite: projects + settings | Dodatkowe tabele domenowe |
| PDF + SVG preview | Treść raportu i diagramy |

---

## 2. Stack technologiczny

Źródło: `package.json`, `vite.config.js`, sekcja `build` w package.json.

| Warstwa | Technologia | Wersja (lock) |
|---------|-------------|---------------|
| Runtime desktop | Electron | ^33.2.1 |
| UI | React + react-dom | ^18.3.1 |
| Bundler | Vite + @vitejs/plugin-react | ^6.0.7 |
| Baza | better-sqlite3 | ^11.8.1 |
| PDF | jspdf | ^2.5.2 |
| Instalator | electron-builder (NSIS) | ^25.1.8 |
| Dev orchestration | concurrently, wait-on, cross-env | — |

**TypeScript:** nie dotyczy — projekt w czystym JavaScript (`.jsx`, `.cjs`, `.mjs`).

### Skrypty npm

| Skrypt | Działanie |
|--------|-----------|
| `npm run dev` | Vite na `127.0.0.1:5173` + Electron z `ELECTRON_DEV=1` |
| `npm run build` | `vite build` → `dist/` |
| `npm start` | Electron ładuje `dist/index.html` |
| `npm run dist` | build + `electron-builder --win nsis` → `release/` |
| `postinstall` | `gen-pdf-font.mjs` + `electron-builder install-app-deps` |

### Builder (Windows)

- `appId`: `pl.formatka.app`
- `productName`: FormatkaApp
- NSIS: `oneClick: false`, język 1045 (PL), skróty pulpitu i menu Start
- Artefakt: `FormatkaApp-Setup-${version}.exe`

---

## 3. Architektura systemu

```
┌─────────────────────────────────────────────────────────────┐
│  Electron Main (electron/main.cjs)                          │
│  ├── initDb(userData/data/formatka.db)                      │
│  ├── ipcMain.handle('db:*')  → db.cjs api                   │
│  └── ipcMain.handle('app:savePdfDialog', 'app:writeFile')   │
└──────────────────────────┬──────────────────────────────────┘
                           │ contextBridge
┌──────────────────────────▼──────────────────────────────────┐
│  Preload (electron/preload.cjs) → window.formatka           │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  React Renderer (src/)                                      │
│  App.jsx: cfg state → computeFromConfig → preview + table   │
│  lib/: parts, compute, svg, pdf, validate (pure JS)        │
└─────────────────────────────────────────────────────────────┘
```

### Kolejność startu

1. `app.whenReady()` → `initDb(app.getPath('userData'))`
2. `createWindow()` — preload, `contextIsolation: true`, `nodeIntegration: false`
3. Dev: `loadURL(127.0.0.1:5173)` | Prod: `loadFile(dist/index.html)`
4. Renderer: `useEffect` → `listProjects()` + `listCatalog()` jeśli `window.formatka`

### Konfiguracja okna

```javascript
// electron/main.cjs
new BrowserWindow({
  width: 1280, height: 860, minWidth: 960, minHeight: 640,
  backgroundColor: '#0F2436',
  webPreferences: {
    preload: path.join(__dirname, 'preload.cjs'),
    contextIsolation: true, nodeIntegration: false, sandbox: false
  }
});
```

---

## 4. Struktura repozytorium

```
FormatkaApp/
├── electron/
│   ├── main.cjs          # Okno, IPC, dialogi systemowe
│   ├── preload.cjs       # contextBridge → window.formatka
│   └── db.cjs            # SQLite init, api CRUD
├── src/
│   ├── main.jsx          # createRoot + import CSS
│   ├── App.jsx           # Główny stan, formularz, wyniki (~590 linii)
│   ├── components/
│   │   ├── ToggleGroup.jsx       # EMPTY_CONFIG, DEFAULT_CONFIG, przyciski enum
│   │   ├── ModulesEditor.jsx     # [DOMENA] lista slotów zabudowy
│   │   └── TopConstructionFields.jsx  # [DOMENA] konstrukcja górna
│   ├── lib/
│   │   ├── compute.js    # computeFromConfig — orchestrator
│   │   ├── parts.js      # [DOMENA] buildLinearParts, buildCornerParts
│   │   ├── drawers.js    # [DOMENA] wzory szuflad
│   │   ├── doors.js      # [DOMENA] fronty drzwi
│   │   ├── layout.js     # [DOMENA] MODULE_KINDS, redistributeWidths
│   │   ├── svg.js        # Podgląd SVG (wzór + domena rysowania)
│   │   ├── pdf.js        # Eksport PDF (wzór layoutu + domena treści)
│   │   ├── pdf-fonts.js  # Wygenerowany — Roboto base64
│   │   ├── validate.js   # Ostrzeżenia sanity
│   │   └── utils.js      # fmt(), makePartsMap()
│   └── styles/
│       └── app.css       # Design system (CSS variables)
├── scripts/
│   └── gen-pdf-font.mjs  # Generuje pdf-fonts.js z TTF
├── Docs/                 # Dokumentacja produktu i szablony
├── index.html            # CSP, Google Fonts
├── vite.config.js
└── package.json
```

**Brak:** `tests/`, routera, `components/ui/` (shadcn), Tailwind.

---

## 5. Wygląd i design system

Źródło: `src/styles/app.css`, `index.html` (fonty).

### Paleta (CSS variables)

| Token | Wartość | Użycie |
|-------|---------|--------|
| `--bg` | `#0F2436` | Tło body, tło okna Electron |
| `--bg-panel` | `#15304A` | Panele `.panel` |
| `--bg-panel-2` | `#1B3A59` | Inputy, karty modułów |
| `--grid-line` | `#2A5573` | Obramowania, siatka podglądu |
| `--line` | `#3E6E8E` | Hover obramowań |
| `--accent` | `#FF7A45` | Akcent, aktywne toggle, qty w tabeli |
| `--accent-dim` | `#B9542A` | Obramowanie numerów sekcji |
| `--cyan` | `#7FDBFF` | Focus, linki statusu |
| `--text` | `#EAF3FB` | Tekst główny |
| `--text-dim` | `#9FB8CC` | Labelki |
| `--text-faint` | `#5F86A3` | Hinty, nagłówki tabel |
| `--danger` | `#F0997B` | Błędy |
| `--radius` | `8px` | Zaokrąglenia paneli |

### Typografia

| Rola | Font | Klasy |
|------|------|-------|
| Nagłówki | Space Grotesk 500–700 | `h1`, `.panel h2`, `.section-title` |
| UI | Inter 400–600 | body, labelki, przyciski |
| Liczby / wymiary | JetBrains Mono | `input`, `thead th`, `.mono`, `.stat .v` |
| Eyebrow | JetBrains Mono 10px uppercase | `.eyebrow` |

Google Fonts ładowane z CDN (`index.html`); CSP: `style-src` + `font-src` dla fonts.googleapis.com / gstatic.com.

### Komponenty wizualne

- **`.panel`** — karta z obramowaniem `1px solid var(--grid-line)`
- **`.toggle-group button.active`** — `background: rgba(255,122,69,0.12)`, `border-color: var(--accent)`
- **`.btn-primary`** — pełny akcent pomarańczowy, tekst ciemny `#1a1005`
- **`.chip`** — para przycisków: nazwa projektu + usuń
- **`.canvas-wrap`** — tło siatki 20×20px, `height: min(300px, 42vh)`, `overflow: hidden`
- **`.summary-bar`** — 3 kolumny statystyk nad tabelą
- **Zebra w PDF** — analogiczne kolory w `pdf.js` (ACCENT `[217,87,45]`)

### Animacje

Minimalne: `transition: border-color .15s` na inputach i toggle; brak biblioteki animacji.

### Ikony

Brak biblioteki ikon — tekst, symbole Unicode (×), kolory w legendzie SVG.

---

## 6. Wzorce UI i layoutu

### Shell aplikacji

Brak klasycznego sidebar + topbar. Layout:

1. **Header** — eyebrow + `h1` + opis
2. **Pasek projektu** (`.projects-bar`) — nazwa, katalog, Zapisz/Nowy, chipy projektów
3. **`.layout`** — CSS grid `minmax(320px, 0.95fr) | minmax(0, 1.05fr)`; na `<1100px` jedna kolumna

### Formularz krokowy (warunkowy)

Sekcje pokazywane wg stanu `cfg`:

| # | Sekcja | Warunek widoczności |
|---|--------|---------------------|
| 01 | Układ (tryb, typ) | zawsze po starcie |
| 02 | Wymiary | `hasMode && (!single \|\| cfg.type)` |
| 03 | Podział / sloty | `single && cfg.type` lub `zabudowa` |
| 04 | Widok SVG | kolumna wyników |
| 05 | Rozkrój + PDF | kolumna wyników |

**Empty state:** `.canvas-empty` z komunikatem zależnym od braku trybu/typu/wymiarów.

### ToggleGroup (wzór wyboru enum)

Zamiast radio/select dla krótkich list — rząd przycisków z klasą `.active`. Wariant `.toggle-group--wrap` — zawijanie 3→2 kolumny na mobile.

### Lista projektów (wzór CRUD-lite)

- Chipy: klik = wczytaj, × = usuń
- Aktywny projekt: `.chip-main.active`
- Brak modali — operacje inline

### Master-detail (zabudowa)

`ModulesEditor` — lista `.module-card` z toolbar dodawania, reorder, redystrybucja szerokości. **Wzorzec:** edytor listy slotów z `occupiedWidth` / `remainingWidth`.

### Sidebar / TopBar / CommandPalette

Nie dotyczy — aplikacja single-page bez nawigacji tras.

---

## 7. Komponenty UI

Brak katalogu `components/ui/`. Komponenty współdzielone:

### `ToggleGroup`

```javascript
// API
<ToggleGroup
  options={[{ value, label }]}
  value={cfg.field}
  onChange={(v) => patch({ field: v })}
  disabledValues={[]}
  className="toggle-group--wrap"  // opcjonalnie
/>
```

Eksportuje też `EMPTY_CONFIG` i `DEFAULT_CONFIG` — wzorce stanu początkowego.

### `TopConstructionFields` — [DOMENA]

Pola konstrukcji górnej mebla; w nowej app zastąp odpowiednim podzbiorem pól domenowych lub usuń.

### `ModulesEditor` — [DOMENA]

Edytor wielu modułów na jednej szerokości; **wzór techniczny:** `update(id, patch)`, `onChange(modules[])`, toolbar z selectem typu + przycisk dodaj.

---

## 8. Routing i nawigacja

**Nie dotyczy** — brak `react-router`. Cała aplikacja w `App.jsx`. Jedyny „routing” to warunkowe renderowanie sekcji formularza wg `cfg.mode`, `cfg.type`.

Lazy loading: dynamiczny `import('./pdf-fonts.js')` przy pierwszym PDF.

---

## 9. Zarządzanie stanem

| Stan | Lokalizacja | Opis |
|------|-------------|------|
| `cfg` | `useState` w App | Cała konfiguracja użytkownika (JSON do zapisu) |
| `projectId` | `useState` | ID aktywnego projektu SQLite |
| `projects`, `catalog` | `useState` | Listy z IPC przy boot |
| `status`, `pdfStatus` | `useState` | Komunikaty UI |
| `data`, `preview`, `warnings` | `useMemo` | Pochodne z `cfg` |

### Wzorzec `patch(partial)`

```javascript
const patch = (partial) => setCfg((c) => {
  const next = { ...c, ...partial };
  // reguły uboczne: zmiana mode → czyść modules;
  // zmiana door → szuflady → shelves=0;
  // zmiana h → przelicz auto-półki w modules
  return next;
});
```

**Zasada:** jedna funkcja mutacji z regułami spójności; unikać rozproszonych `setCfg` poza `patch` / `setModules`.

### Fetch danych

`useEffect` na mount → `Promise.all([listProjects(), listCatalog()])`. Brak React Query / SWR.

---

## 10. Komunikacja IPC

### Konwencja nazw

`namespace:action` — np. `db:listProjects`, `app:savePdfDialog`.

### Preload (`window.formatka`)

| Metoda | IPC | Zwraca |
|--------|-----|--------|
| `listProjects()` | `db:listProjects` | `{id, name, created_at, updated_at, notes}[]` |
| `getProject(id)` | `db:getProject` | pełny wiersz + `config_json` |
| `saveProject(payload)` | `db:saveProject` | zapisany projekt |
| `deleteProject(id)` | `db:deleteProject` | `true` |
| `listCatalog()` | `db:listCatalog` | wiersze katalogu |
| `upsertCatalog(row)` | `db:upsertCatalog` | wiersz |
| `getSettings()` | `db:getSettings` | `{ key: value }` |
| `setSetting(key, value)` | `db:setSetting` | `true` |
| `addCutHistory(payload)` | `db:addCutHistory` | `lastInsertRowid` |
| `listCutHistory(projectId?)` | `db:listCutHistory` | historia |
| `savePdfDialog(defaultName)` | `app:savePdfDialog` | ścieżka lub `null` |
| `writeFile(path, base64)` | `app:writeFile` | `true` |

### Wzorzec w rendererze

```javascript
function hasApi() {
  return typeof window !== 'undefined' && window.formatka;
}
// Wszystkie operacje persystencji za hasApi() — fallback komunikatem lub download w przeglądarce
```

### Wzorzec handlera (main)

```javascript
ipcMain.handle('db:listProjects', () => api.listProjects());
```

Bezpośrednie mapowanie na `api` w `db.cjs` — bez dodatkowej warstwy DTO.

---

## 11. Baza danych (storage)

**Silnik:** better-sqlite3, synchroniczny API.  
**Ścieżka:** `{userData}/data/formatka.db` (np. `%APPDATA%/formatka-app/data/` na Windows).  
**PRAGMA:** `journal_mode = WAL`.

### Schemat — wzorzec vs domena

| Tabela | Rola | Uwaga |
|--------|------|-------|
| `settings` | **Wzorzec** — key/value | `lastProjectId` itp. |
| `projects` | **Wzorzec** — projekty jako JSON | `config_json TEXT NOT NULL` |
| `catalog_types` | **Wzorzec** presetów + **domena** wpisów | Seed `DEFAULT_CATALOG` przy `COUNT=0` |
| `cut_history` | **Domena** — historia rozkrojów | Adaptuj lub usuń |

### Migracje

Brak formalnych migracji — `CREATE TABLE IF NOT EXISTS` przy init. Zmiany schematu wymagają ręcznej migracji lub nowej tabeli.

### Parametryzacja SQL

Wszystkie zapytania z `?` placeholders (`db.prepare('... WHERE id = ?').get(id)`). Brak konkatenacji user input w SQL.

---

## 12. Moduły funkcjonalne

| Moduł | Pliki | Wzorzec | Domena (nie kopiować) |
|-------|-------|---------|------------------------|
| **Projekty** | App.jsx, db.cjs | Zapis/wczytaj/usuń JSON config | Pola w `cfg` |
| **Katalog** | App.jsx `applyCatalog`, db.cjs | Presety uzupełniające puste pola | Slugi mebli, default_depth/height |
| **Kalkulator** | compute.js, parts.js | `computeFromConfig` → `{ error, data }` | Geometria korpusu |
| **Szuflady** | drawers.js | `addDrawerParts(pm, opts)` agregacja | Wzory LW−75 mm |
| **Podgląd** | svg.js | `buildPreviewSvg(data, cfg)` → `{ svg, legend }` | Rysowanie szafek |
| **PDF** | pdf.js, pdf-fonts.js | Layout A4, tabela, sekcje | Diagramy wierceń |
| **Walidacja** | validate.js | `collectSanityWarnings(data, cfg)` | Reguły stolarskie |
| **Zabudowa** | layout.js, ModulesEditor | Lista modułów, redistributeWidths | MODULE_KINDS |

---

## 13. Reguły biznesowe

### Wzorce do odtworzenia

1. **Katalog nie nadpisuje** — `applyCatalog` uzupełnia tylko puste pola (`isBlank`)
2. **Obliczenia reaktywne** — każda zmiana `cfg` przelicza wynik (`useMemo`)
3. **Agregacja części** — `makePartsMap` łączy identyczne elementy po kluczu `name|w|h|thick`
4. **Tryb przeglądarki** — bez API: podgląd + download PDF; zapis projektu z komunikatem
5. **Pusty start** — `EMPTY_CONFIG` bez auto-wczytywania ostatniego projektu

### Reguły czysto domenowe (nie kopiować)

- Wzory szuflad: dno LW−75 mm, tył LW−87 mm, NL = standardowa długość prowadnicy
- `optimalShelves(H)` — heurystyka półek co ~28 cm
- Konstrukcja pod blat: cargi zamiast wieńca górnego
- Wiercenia w PDF: `sideHoles`, `perimeterHoles` dla boków i pleców

---

## 14. Formularze i walidacja

**Brak** React Hook Form / Zod. Wzorzec:

- Kontrolowane inputy: `value={inputVal(cfg.w)}` + `onChange` → `patch({ w: numOrEmpty(e.target.value) })`
- `numOrEmpty` — puste pole = `''` (nie 0), compute sprawdza `!W`
- Błędy blokujące: `error` z `computeFromConfig` → `.error-msg.show`
- Ostrzeżenia nieblokujące: `warnings[]` → `.warn-msg.show`
- Placeholder `—` na pustych polach numerycznych

**Dirty form / modale:** nie dotyczy — brak potwierdzenia przy opuszczeniu; zapis jawny przyciskiem „Zapisz”.

---

## 15. Raporty i eksport

### PDF (`src/lib/pdf.js`)

1. `buildPdfBase64(data, cfg)` — async, zwraca `ArrayBuffer`
2. Font Roboto (polskie znaki) — lazy import `pdf-fonts.js`
3. Struktura: nagłówek → metadane → tabela elementów → sekcja szuflad (jeśli dotyczy) → diagramy wierceń
4. Zapis Electron: konwersja do base64 → `savePdfDialog` → `writeFile`
5. Przeglądarka: `Blob` + `<a download>`

### CSV / inne

Nie dotyczy — tylko PDF i tabela HTML w UI.

### Historia eksportów

`addCutHistory` zapisuje `summary_json` + `parts_json` po udanym zapisie PDF (domena rozkroju).

---

## 16. Kopie zapasowe i dane użytkownika

**Brak** dedykowanego modułu backupu w kodzie.

Dane użytkownika:
- `%APPDATA%/formatka-app/data/formatka.db` — cała baza
- Ustawienia w tabeli `settings`

**Wzorzec dla nowej app:** dokumentuj ścieżkę `userData` w README; opcjonalnie dodaj eksport/import JSON projektów (obecnie nie zaimplementowane).

---

## 17. Bezpieczeństwo

| Obszar | Stan w kodzie |
|--------|---------------|
| **Electron** | `contextIsolation: true`, `nodeIntegration: false`, API tylko przez preload |
| **CSP** | `index.html` — `default-src 'self'`, fonty Google dozwolone |
| **SQL injection** | Parametryzowane zapytania better-sqlite3 |
| **Path traversal** | `writeFile` zapisuje dokładnie ścieżkę z dialogu systemowego — brak walidacji containment (ograniczone do user-selected path) |
| **Sandbox** | `sandbox: false` (wymóg better-sqlite3 w main) |

**Testy security:** nie dotyczy — brak folderu `tests/security/`.

---

## 18. Obsługa błędów i logowanie

| Mechanizm | Implementacja |
|-----------|---------------|
| Błędy compute | `error` string w UI (`.error-msg`) |
| Błędy PDF | `try/catch` → `pdfStatus` |
| Błędy IPC boot | `boot().catch(e => setStatus('Błąd bazy: ' + e.message))` |
| Toasty | Nie dotyczy — inline `status` / `pdfStatus` w `.hint` |
| Logger | Nie dotyczy — brak winston/pino |
| ErrorBoundary React | Nie dotyczy |

---

## 19. Wzorce techniczne — tabela plików

| Wzorzec | Plik |
|---------|------|
| Entry Electron | `electron/main.cjs` |
| Preload bridge | `electron/preload.cjs` |
| SQLite API | `electron/db.cjs` |
| Stan + patch | `src/App.jsx` |
| EMPTY/DEFAULT config | `src/components/ToggleGroup.jsx` |
| Enum toggle UI | `src/components/ToggleGroup.jsx` |
| Pure compute | `src/lib/compute.js` |
| Agregacja wyników | `src/lib/utils.js` → `makePartsMap` |
| SVG preview + fitScale | `src/lib/svg.js` |
| PDF layout PL | `src/lib/pdf.js` |
| Font embed script | `scripts/gen-pdf-font.mjs` |
| Design tokens | `src/styles/app.css` `:root` |
| Graceful no-Electron | `hasApi()` w App.jsx |
| Lista modułów/slotów | `src/components/ModulesEditor.jsx` + `layout.js` |

---

## 20. Testy

**Nie dotyczy** — brak `tests/unit/`, `tests/security/`, brak frameworka testowego w `package.json`.

Świadomie: logika w `lib/` jest testowalna unitowo (pure functions), ale testy nie zostały napisane.

**Rekomendacja dla nowej app:** dodać Vitest dla `compute.js`, `utils.js`, `validate.js`.

---

## 21. Build, wersjonowanie, release

| Krok | Komenda / output |
|------|------------------|
| Dev | `npm run dev` |
| Produkcja renderer | `npm run build` → `dist/` |
| Uruchomienie prod | `npm start` |
| Instalator Win | `npm run dist` → `release/FormatkaApp-Setup-0.1.0.exe` |
| Wersja | `package.json` → `"version": "0.1.0"` |

**Ikony:** nie skonfigurowane explicite w `build` — domyślne Electron.

**Code signing:** nie dotyczy.

---

## 22. Konwencje kodu

| Obszar | Konwencja |
|--------|-----------|
| Język UI / komentarze | Polski |
| Pliki Electron | `.cjs` (CommonJS) |
| Pliki frontend | `.jsx` / `.js` ESM |
| Importy | Relatywne `./lib/...`, alias `@/` w vite (rzadko używany) |
| Nazewnictwo | camelCase funkcje, `cfg` dla configu, `patch` dla aktualizacji |
| Komponenty | PascalCase, jeden komponent na plik |
| IPC | `db:verbNoun`, `app:verbNoun` |
| Stałe domenowe | `MODULE_KINDS`, `DRAWER`, `EMPTY_CONFIG` — UPPER lub exported const |

---

## 23. Język i lokalizacja UI

- **Język interfejsu:** polski (etykiety, komunikaty, PDF)
- **Format liczb:** `fmt(n)` — przecinek dziesiętny, 1 miejsce (`12,5`)
- **Data w PDF:** `toLocaleDateString('pl-PL')`
- **NSIS:** `language: 1045` (polski instalator)
- **i18n framework:** nie dotyczy — brak react-i18next; stringi inline

---

## 24. Checklist dla nowej aplikacji

### Faza 1 — Szkielet
- [ ] Sklonuj strukturę `electron/` + `src/` + `vite.config.js`
- [ ] Ustaw `appId`, `productName`, kolory okna = `--bg`
- [ ] Preload `window.[nazwaApp]` z minimalnym `db:list` / `db:save`

### Faza 2 — Design system
- [ ] Skopiuj `app.css` :root i klasy `.panel`, `.toggle-group`, `.layout`
- [ ] Podłącz fonty w `index.html`
- [ ] Zaimplementuj `ToggleGroup` + `EMPTY_CONFIG`

### Faza 3 — Stan i compute
- [ ] Zdefiniuj `cfg` dla nowej domeny
- [ ] `patch()` z regułami spójności
- [ ] `computeFromConfig(cfg)` → `{ error, data: { parts: [] } }`

### Faza 4 — UI
- [ ] Sekcje numerowane formularza
- [ ] Kolumna podglądu (SVG/Canvas) + tabela wyników
- [ ] Pasek projektów + katalog presetów (opcjonalnie)

### Faza 5 — Persystencja
- [ ] SQLite: `projects`, `settings`, seed katalogu
- [ ] Zapis/wczytaj `config_json`

### Faza 6 — Eksport
- [ ] PDF z polskimi fontami (wzór `pdf.js` + `gen-pdf-font.mjs`)
- [ ] Dialog zapisu + `writeFile` przez IPC

### Faza 7 — Release
- [ ] `npm run dist`, README ze ścieżką bazy
- [ ] Test w trybie bez Electron (degradacja)

---

## Instrukcja dla agenta AI

Gdy otrzymasz ten dokument i polecenie budowy nowej aplikacji:

1. Przeczytaj cały dokument — to kontrakt architektoniczny.
2. Zapytaj o domenę, jeśli nie podana.
3. Zachowaj architekturę i design system.
4. Dostosuj schemat DB i moduły do nowej domeny.
5. Nie kopiuj encji/menu/reguł branżowych tej aplikacji.
6. UI po polsku.
7. Dostarcz kompletny kod gotowy do uruchomienia.

---

*Blueprint v1.0.0 · wrzesień 2026 · źródło: FormatkaApp package.json 0.1.0*
