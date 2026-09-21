# PRD — FormatkaApp (desktop: Electron + React + SQLite)

**Status:** Migracja z prototypu HTML → aplikacja desktopowa.  
**Model dystrybucji:** lokalna aplikacja Windows z **pełnym instalatorem** (`electron-builder`, NSIS). Bez hostingu / serwera produkcyjnego.  
**Prototyp (referencja):** `legacy/index.html` — nie rozwijany dalej jako produkt.

---

## 1. Cel produktu

Narzędzie dla majsterkowicza / stolarza / projektanta zabudowy:

1. Podajesz **przestrzeń** (kształt + wymiary) i/lub **konkretny mebel**.
2. Aplikacja **proponuje rozplanowanie** modułów (w tym narożniki) na podstawie dostępnego miejsca i dopowiedzeń użytkownika.
3. Pokazuje **rysunek poglądowy**, **listę rozkroju** i **PDF dla stolarni** (z orientacyjnymi punktami wiercenia).
4. Zapisuje projekty, katalog typów i historię w **lokalnej bazie SQLite**.

Zakres mebli: różne korpusy płytowe.  
Zakres przestrzeni: różne (ściana, L, wnęka…).  
UX: wizard + asystent (kolejne fazy).

---

## 2. Decyzje produktowe

| ID | Decyzja |
|----|---------|
| A–E | Jak wcześniej (kategorie, kształty, auto-layout, wizard+chat, wszystkie fazy) |
| F | Rozbicie kodu — **tak** (modułowa appka React) |
| G | Aplikacja **lokalna desktop** |
| H | Stack: **Electron + React + Vite + CSS blueprint + SQLite (better-sqlite3)** |
| I | Start: **od razu scaffold + migracja MVP** |
| J | SQLite: **wszystko** (projekty, ustawienia, katalog, historia rozkrojów) |
| K | Dystrybucja: **pełny instalator Windows** |

---

## 3. Architektura

```
Electron main
  ├── better-sqlite3 (userData/formatka.db)
  ├── IPC (projekty / katalog / ustawienia / historia)
  └── dialogi zapisu PDF / plików
Renderer (React + Vite)
  ├── UI (formularz MVP → wizard/chat)
  ├── lib/parts | doors | validate | layout | svg | pdf
  └── styles/app.css (motyw blueprint z prototypu)
```

### 3.1 Schemat SQLite (v1)

- `settings` — klucz/wartość (ostatni projekt, preferencje UI)
- `catalog_types` — typy/kategorie mebli + domyślne wymiary
- `projects` — nazwa, daty, `config_json` (pełny stan formularza/layoutu)
- `cut_history` — snapshot rozkroju powiązany z projektem (po generacji PDF / zapisie)

### 3.2 Skrypty

| Komenda | Opis |
|---------|------|
| `npm run dev` | Vite + Electron (hot reload UI) |
| `npm run build` | build renderera + pakiet Electron |
| `npm run dist` | instalator NSIS Windows |

---

## 4. Roadmapa

### Faza M0 — Scaffold + migracja MVP (w toku)

- Electron + React + Vite
- CSS blueprint
- Logika rozkroju / drzwi / walidacja / SVG / PDF
- SQLite + IPC
- electron-builder (NSIS)

### Faza 2 — Planer przestrzeni (kształty, wiele korpusów, kategorie)

### Faza 3 — Wizard + asystent

### Faza 4 — Jakość (testy lib, dopracowanie katalogu, offline fonty w paczce)

### Faza 5 — Okucia, warianty drzwi, eksport CSV/DXF

---

## 5. Legacy

`legacy/index.html` — działający prototyp przeglądarkowy (Faza 1: przesuwne, walidacja, JSON). Źródło prawdy dla reguł wymiarowania do czasu pełnej migracji testów.
