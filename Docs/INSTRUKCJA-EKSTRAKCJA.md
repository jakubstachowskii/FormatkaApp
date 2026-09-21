# INSTRUKCJA EKSTRAKCJA — z kodu aplikacji do META + BLUEPRINT

> **Kiedy używać:** masz **działającą aplikację** i chcesz z niej wydobyć bazę dla AI (szablon), żeby kolejne app budować **na wzorcach, nie jako klon**.

**Wersja:** 1.0 · wrzesień 2026

**Powiązany plik:** [INSTRUKCJA-BUDOWA.md](INSTRUKCJA-BUDOWA.md) — budowa nowej aplikacji z gotowych META + BLUEPRINT.

---

## START — Prompt ekstrakcji

**Gdzie:** otwórz chat **w repozytorium kodu** analizowanej aplikacji (nie w folderze instrukcji).

Uzupełnij `[ID]` i `[ścieżka folderu instrukcji]` — reszta bez zmian.

```
@INSTRUKCJA-EKSTRAKCJA.md

Wygeneruj szablon z TEJ aplikacji (kod w tym workspace).

ID szablonu: [ID]                              np. project-manager
Folder instrukcji (zapis META + BLUEPRINT): [ścieżka]

Zadanie według INSTRUKCJA-EKSTRAKCJA.md — bez kodu nowej aplikacji biznesowej.
```

**Co się dzieje dalej:**

1. Agent analizuje **rzeczywisty kod** (nie zgaduje).
2. Tworzy `META.md` + `BLUEPRINT.md` według kontraktu poniżej.
3. Dopisuje wiersz w katalogu szablonów w `INSTRUKCJA-BUDOWA.md`.
4. **Nie zmienia** kodu analizowanej aplikacji.

---

## Spis treści

1. [Cel i zasady](#1-cel-i-zasady)
2. [Zasady dla agenta](#2-zasady-dla-agenta)
3. [Co analizować w kodzie](#3-co-analizować-w-kodzie)
4. [Gdzie zapisać pliki](#4-gdzie-zapisać-pliki)
5. [Kontrakt META.md](#5-kontrakt-metamd)
6. [Kontrakt BLUEPRINT.md](#6-kontrakt-blueprintmd)
7. [Po zapisaniu](#7-po-zapisaniu)
8. [Prompty — skopiuj i wklej](#8-prompty--skopiuj-i-wklej)

---

## 1. Cel i zasady

### Cel

Z działającej aplikacji wyciągnąć **wzorce** do kopiowania przy budowie **innych** aplikacji:

| Wydobyć (wzorce) | Nie kopiować jako szablon (domena tej app) |
|------------------|--------------------------------------------|
| Wygląd, layout, design system | Encje branżowe (tabele, menu 1:1) |
| UX: CRUD, modale, filtry, paginacja | Reguły biznesowe specyficzne dla branży |
| Stack, architektura, IPC/DB/API | Nazwy modułów domenowych bez adaptacji |
| Bezpieczeństwo, backup, testy, release | Klon ekranów pod inną branżę |

### Ważne

- **Nie wymagaj** istniejących plików META/BLUEPRINT jako wejścia — struktura jest **w tym pliku**.
- Inne szablony w folderze instrukcji to **przykłady w katalogu**, nie input do ekstrakcji.
- Wynik ekstrakcji służy plikowi [INSTRUKCJA-BUDOWA.md](INSTRUKCJA-BUDOWA.md).

---

## 2. Zasady dla agenta

```
NIE TWÓRZ NOWEJ APLIKACJI BIZNESOWEJ.

ZANIM ZAPISZESZ PLIKI:
  ✓ przeczytasz TEN plik w całości
  ✓ przeanalizujesz realne pliki kodu (nie z pamięci)
  ✓ oddzielisz WZORCE od DOMENY tej aplikacji
  ✓ zapiszesz META.md + BLUEPRINT.md według kontraktu §5 i §6
  ✓ zaktualizujesz katalog w INSTRUKCJA-BUDOWA.md
  ✓ NIE zmienisz kodu analizowanej aplikacji
```

| Zrób | Nie rób |
|------|---------|
| Opisuj to, co **jest** w kodzie | Wymyślaj funkcji, których nie ma |
| W BLUEPRINT wyraźnie oznacz „wzorce” vs „domena tej app” | Robić opisu tylko produktu bez wzorców |
| Sekcje UI i architektury — szczegółowo (kolory, klasy, IPC, tabele) | Ogólnych fraz typu „ma ładny interfejs” |
| Sekcje bez odpowiednika — „nie dotyczy” + dlaczego | Pomijać sekcji kontraktu |
| Zapytaj usera tylko o brakujące **parametry** (ID, ścieżka) | Pytać o wygląd/stack — wyciągnij z kodu |

---

## 3. Co analizować w kodzie

Przeczytaj realne pliki (nie zgaduj):

| Obszar | Pliki / miejsca |
|--------|-----------------|
| Stack i zależności | `package.json`, lockfile, skrypty npm |
| TypeScript / build | `tsconfig*`, `vite.config`, `electron-builder.yml` |
| Struktura | drzewo folderów `electron/`, `src/`, `tests/`… |
| Entry point | main, preload, `App.tsx`, router |
| Design system | `tailwind.config`, `index.css`, `components/ui/` |
| Layout | `AppLayout`, sidebar, topbar, PageHeader |
| Wzorce stron | listy CRUD, modale, master-detail, dashboard |
| Dane | SQLite / API / IPC / GAS — init, migracje, handlery |
| Moduły | każda domena: strona + handler + typy |
| Bezpieczeństwo | preload allowlist, parametryzacja SQL, path containment |
| Backup, logi | pliki backup, logger |
| Testy | `tests/unit/`, `tests/security/` |
| Release | build, wersjonowanie, ikony |

---

## 4. Gdzie zapisać pliki

### Standardowa struktura

```
[folder instrukcji]/
├── INSTRUKCJA-EKSTRAKCJA.md
├── INSTRUKCJA-BUDOWA.md
└── aplikacje/
    └── [ID]/
        ├── META.md
        └── BLUEPRINT.md
```

Jeśli w folderze instrukcji pliki leżą płasko (np. `META.md` w root) — zapisz tam, gdzie wskazał user, i dopisz ścieżkę w katalogu budowy.

### Parametry (user musi podać w prompcie)

| Parametr | Przykład |
|----------|----------|
| **ID szablonu** | `project-manager` |
| **Folder instrukcji** | `C:\...\0001_test` |
| **Ścieżka kodu** (opcjonalnie) | `../project-manager` — jeśli chat nie jest w repo kodu |

---

## 5. Kontrakt META.md

Wypełnij i zapisz jako `aplikacje/[ID]/META.md` (lub ścieżka wskazana przez usera).

### Obowiązkowa struktura

```markdown
# [Nazwa aplikacji] — karta aplikacji w serii

| Pole | Wartość |
|------|---------|
| **ID serii** | `[id]` |
| **Nazwa** | … |
| **W czym budujemy** | … (krótki opis stacku) |
| **Stack (ID)** | `electron-react-sqlite` (lub inny slug) |
| **Domena** | … (branża TEJ aplikacji — informacyjnie) |
| **Status w serii** | Szablon w katalogu |
| **Repozytorium / folder kodu** | … |
| **Blueprint** | `aplikacje/[id]/BLUEPRINT.md` |
| **Instrukcja budowy** | `INSTRUKCJA-BUDOWA.md` |
| **Wersja blueprintu** | X.Y.Z (miesiąc rok) |

## Karta wyboru (dla agenta — Pytanie 1)

To jest **gotowa podstawa** dla nowej app. Pytanie do usera: czy **te** pliki wziąć jako bazę.

| | |
|--|--|
| **ID** | `[id]` |
| **Nazwa na liście** | … |
| **Styl** | … (konkret: kolory, layout, komponenty) |
| **Funkcjonalność** | … (wzorce: CRUD, finanse, raporty…) |
| **Stack oryginału** | … |
| **Kiedy brać** | … (kiedy nowa app pasuje do tych wzorców) |

## Kiedy używać jako wzorzec

### Jako wzorzec design (wygląd)
- …

### Jako wzorzec techniczny (architektura)
- …

### Kiedy używać (ogólnie)
- …

## Co kopiować (wzorce techniczne)
- …

## Czego NIE kopiować (domena tej app)
- …

## Powiązane aplikacje w serii
| Aplikacja | Relacja |
|-----------|---------|
| … | … |

## Tagi (do wyszukiwania w katalogu)
`tag1` `tag2` …
```

**Karta wyboru** musi być na tyle konkretna, żeby agent mógł złożyć tabelę Pytania 1 w INSTRUKCJA-BUDOWA bez dopytywania usera o styl/stack.

---

## 6. Kontrakt BLUEPRINT.md

Wypełnij i zapisz jako `aplikacje/[ID]/BLUEPRINT.md`.

### Nagłówek (obowiązkowy)

```markdown
# Blueprint aplikacji referencyjnej ([Nazwa])

> **Cel dokumentu:** Gotowa **baza dla AI**: jak aplikacja ma wyglądać, jak działać, jaki stack i jak to zbudować.
> Agent czyta go **po wyborze** tego szablonu. Nową aplikację buduje w **innej domenie**, zachowując UI, UX, architekturę i konwencje poniżej.
> Nie klonuje encji / menu / reguł branżowych tej aplikacji.
```

### 24 sekcje — obowiązkowy układ

Każda sekcja: **konkret z kodu** (nie ogólniki). Gdzie brak odpowiednika: „nie dotyczy” + uzasadnienie.

| # | Sekcja | Co wpisać (skąd w kodzie) |
|---|--------|----------------------------|
| 1 | **Profil produktu** | Typ app, platforma, domena **tej** app, filozofia; tabela „zachować vs dostosować” |
| 2 | **Stack technologiczny** | Z `package.json`, configów; skrypty npm; TS; builder |
| 3 | **Architektura systemu** | Diagram przepływu; kolejność startu; konfiguracja okna |
| 4 | **Struktura repozytorium** | Drzewo folderów z opisem odpowiedzialności |
| 5 | **Wygląd i design system** | Paleta, typografia, klasy CSS, ikony, animacje |
| 6 | **Wzorce UI i layoutu** | Shell, sidebar, TopBar, CRUD list, master-detail, EmptyState |
| 7 | **Komponenty UI** | Katalog `ui/` i `shared/` z API |
| 8 | **Routing i nawigacja** | Router, trasy, lazy loading, CommandPalette |
| 9 | **Zarządzanie stanem** | Store vs lokalny stan; wzorce fetch |
| 10 | **Komunikacja IPC** (lub API/GAS) | Konwencja nazw, preload, wrapper, wzorzec handlera |
| 11 | **Baza danych** (lub storage) | Config, migracje, schemat **jako wzorzec** + tabele domenowe oznaczone |
| 12 | **Moduły funkcjonalne** | Każdy moduł: zakres; oddziel wzorzec od domeny |
| 13 | **Reguły biznesowe** | Reguły jako **wzorce do odtworzenia** + reguły czysto domenowe (nie kopiować) |
| 14 | **Formularze i walidacja** | RHF/zod lub inne; wzorzec modala; dirty form |
| 15 | **Raporty i eksport** | PDF, CSV, silniki raportów |
| 16 | **Kopie zapasowe i dane użytkownika** | Ścieżki userData, operacje backup |
| 17 | **Bezpieczeństwo** | Electron, SQL, path containment, testy |
| 18 | **Obsługa błędów i logowanie** | IPC errors, toasty, logger, ErrorBoundary |
| 19 | **Wzorce techniczne** | Tabela: wzorzec → plik |
| 20 | **Testy** | Struktura, co testować, czego świadomie brak |
| 21 | **Build, wersjonowanie, release** | Komendy, instalator, ikony |
| 22 | **Konwencje kodu** | Nazewnictwo, importy, commity |
| 23 | **Język i lokalizacja UI** | PL, formatowanie, komunikaty |
| 24 | **Checklist dla nowej aplikacji** | Fazy 1–7 do odhaczenia przy budowie |

### Sekcja końcowa (obowiązkowa)

```markdown
## Instrukcja dla agenta AI

Gdy otrzymasz ten dokument i polecenie budowy nowej aplikacji:
1. Przeczytaj cały dokument — to kontrakt architektoniczny.
2. Zapytaj o domenę, jeśli nie podana.
3. Zachowaj architekturę i design system.
4. Dostosuj schemat DB i moduły do nowej domeny.
5. Nie kopiuj encji/menu/reguł branżowych tej aplikacji.
6. UI po polsku.
7. Dostarcz kompletny kod gotowy do uruchomienia.
```

Na końcu dokumentu: wersja i data na podstawie `package.json` / kodu.

---

## 7. Po zapisaniu

1. **Zaktualizuj katalog** w [INSTRUKCJA-BUDOWA.md](INSTRUKCJA-BUDOWA.md) § Katalog szablonów — nowy wiersz z ID, nazwą, linkami do META i BLUEPRINT.
2. **Podsumuj userowi:** co zapisano, pełne ścieżki, ID szablonu, wersja blueprintu.
3. **Nie uruchamiaj** budowy nowej aplikacji — to rola INSTRUKCJA-BUDOWA.

---

## 8. Prompty — skopiuj i wklej

### Prompt A — Pełna ekstrakcja (zalecany)

Chat w **repo kodu** analizowanej aplikacji.

```
@INSTRUKCJA-EKSTRAKCJA.md

Wygeneruj szablon z TEJ aplikacji (kod w tym workspace).

ID szablonu: [ID]
Folder instrukcji (zapis META + BLUEPRINT): [ścieżka]

Wykonaj po kolei:
1. Analiza kodu według §3 (realne pliki).
2. Utwórz META.md i BLUEPRINT.md według kontraktu §5 i §6.
3. Zaktualizuj katalog w INSTRUKCJA-BUDOWA.md.
4. Nie zmieniaj kodu tej aplikacji.
5. Podsumowanie: co zapisano i gdzie.
```

### Prompt B — Skrót

```
@INSTRUKCJA-EKSTRAKCJA.md

ID: [slug]
Folder instrukcji: [ścieżka]

Wydobądź szablon (META + BLUEPRINT) z tego projektu. Tylko dokumentacja.
```

### Prompt C — Aktualizacja istniejącego szablonu

Gdy kod app się zmienił i trzeba odświeżyć META/BLUEPRINT:

```
@INSTRUKCJA-EKSTRAKCJA.md

Zaktualizuj szablon [ID] na podstawie AKTUALNEGO kodu tej aplikacji.
Folder instrukcji: [ścieżka]
Nadpisz aplikacje/[ID]/META.md i BLUEPRINT.md. Podnieś wersję blueprintu.
Nie zmieniaj kodu aplikacji.
```

---

*Ekstrakcja: kod → META + BLUEPRINT. Budowa: [INSTRUKCJA-BUDOWA.md](INSTRUKCJA-BUDOWA.md).*
