# FormatkaApp — karta aplikacji w serii

| Pole | Wartość |
|------|---------|
| **ID serii** | `formatka-app` |
| **Nazwa** | FormatkaApp |
| **W czym budujemy** | Desktop Electron + React (Vite) + SQLite; logika obliczeniowa w czystym JS; eksport PDF po stronie renderera |
| **Stack (ID)** | `electron-react-sqlite` |
| **Domena** | Stolarstwo / meble — kalkulator rozkroju i planer zabudowy (szafki, regały, szuflady) |
| **Status w serii** | Szablon w katalogu |
| **Repozytorium / folder kodu** | `FormatkaApp/` (workspace główny projektu) |
| **Blueprint** | `aplikacje/formatka-app/BLUEPRINT.md` |
| **Instrukcja budowy** | `INSTRUKCJA-BUDOWA.md` |
| **Wersja blueprintu** | 1.0.0 (wrzesień 2026) |

## Karta wyboru (dla agenta — Pytanie 1)

To jest **gotowa podstawa** dla nowej app. Pytanie do usera: czy **te** pliki wziąć jako bazę.

| | |
|--|--|
| **ID** | `formatka-app` |
| **Nazwa na liście** | FormatkaApp — kalkulator z podglądem i PDF |
| **Styl** | Ciemny motyw techniczny (`#0F2436`), akcent pomarańczowy `#FF7A45`, fonty Space Grotesk + Inter + JetBrains Mono; layout 2-kolumnowy (formularz + wyniki); panele `.panel`, siatka CSS 12 kolumn, przyciski toggle, chipy projektów |
| **Funkcjonalność** | Formularz krokowy z warunkowymi sekcjami; katalog presetów (uzupełnia puste pola); zapis/wczytywanie projektów SQLite; podgląd SVG na żywo; tabela wyników; eksport PDF z polskimi znakami; tryb „wiele slotów” (lista modułów); walidacja i ostrzeżenia |
| **Stack oryginału** | Electron 33, React 18, Vite 6, better-sqlite3, jsPDF; CommonJS w `electron/`, ESM w `src/` |
| **Kiedy brać** | Gdy nowa app to **lokalny kalkulator/konfigurator** z podglądem graficznym, listą elementów wynikowych, eksportem PDF/raportu, zapisem projektów w SQLite — niezależnie od branży |

## Kiedy używać jako wzorzec

### Jako wzorzec design (wygląd)
- Ciemny UI „CAD / warsztat” z pomarańczowym akcentem i monospace na liczbach
- Layout: nagłówek + pasek projektu/katalogu + grid formularz | podgląd+tabela
- Sekcje numerowane (`01 Układ`, `02 Wymiary`…) z `.section-title .num`
- Komponent `ToggleGroup` jako uniwersalny wybór enumów
- Podgląd w kontenerze z siatką tła (`.canvas-wrap`) i legendą kolorów
- Pasek statystyk `.summary-bar` nad tabelą wyników

### Jako wzorzec techniczny (architektura)
- Electron: `contextIsolation: true`, preload `window.formatka`, handlery `ipcMain.handle('db:*')` i `app:*`
- SQLite w `userData/data/*.db`, init przy `app.whenReady`, WAL mode
- React: jeden stan `cfg` + funkcja `patch(partial)` z regułami ubocznymi
- Logika domenowa w `src/lib/*` (pure functions), UI tylko składa config i wyświetla `useMemo(compute)`
- Graceful degradation: `hasApi()` — w przeglądarce bez Electron działa podgląd i pobieranie PDF
- Dynamiczny import ciężkich zasobów (fonty PDF ~1.3 MB)

### Kiedy używać (ogólnie)
- Aplikacje desktopowe typu „kreator + wynik + dokument dla drukarni/warsztatu”
- Gdy potrzebny jest katalog presetów bez nadpisywania wyborów użytkownika
- Gdy wynik to lista pozycji + wizualizacja + PDF

## Co kopiować (wzorce techniczne)
- Struktura `electron/main.cjs` + `preload.cjs` + `db.cjs`
- Wzorzec `patch()` / `EMPTY_CONFIG` / `DEFAULT_CONFIG`
- `ToggleGroup`, grid formularza 12-kolumnowy, chipy projektów
- `useMemo` dla compute + preview + warnings
- `makePartsMap()` — agregacja pozycji wynikowych po kluczu
- Eksport PDF: generacja w rendererze, zapis przez IPC `savePdfDialog` + `writeFile` (base64)
- Katalog SQLite z seedem przy pustej bazie
- Projekty jako `config_json` (JSON blob) — elastyczny schemat bez migracji przy każdej zmianie UI

## Czego NIE kopiować (domena tej app)
- Typy mebli: wisząca, stojąca, narożna, regał, szuflady
- Wzory wymiarów szuflad (`drawers.js`), wiercenia pod wkręty (`pdf.js` hole diagrams)
- `MODULE_KINDS`, `buildLinearParts`, `buildCornerParts`
- Katalog `catalog_types` z wpisami stolarskimi (slugi `wiszaca`, `kuchenna_dol` itd.)
- Tabela `cut_history` specyficzna dla rozkroju — adaptuj do nowej domeny lub usuń

## Powiązane aplikacje w serii
| Aplikacja | Relacja |
|-----------|---------|
| — | Pierwszy szablon w katalogu (brak innych wpisów) |

## Tagi (do wyszukiwania w katalogu)
`electron` `react` `vite` `sqlite` `pdf` `kalkulator` `konfigurator` `dark-ui` `desktop` `polski` `svg-preview` `projekty` `katalog-presetów`
