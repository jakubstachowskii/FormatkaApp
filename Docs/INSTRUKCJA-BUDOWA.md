# INSTRUKCJA BUDOWA — nowa aplikacja z szablonu META + BLUEPRINT

> **Kiedy używać:** masz gotowy szablon w katalogu poniżej i chcesz zbudować **nową aplikację** w innej domenie, zachowując wzorce UI/UX/architektury.

**Wersja:** 1.0 · wrzesień 2026

**Powiązany plik:** [INSTRUKCJA-EKSTRAKCJA.md](INSTRUKCJA-EKSTRAKCJA.md) — wydobycie szablonu z działającej aplikacji.

---

## Katalog szablonów

| ID | Nazwa na liście | Styl / wzorce | Stack | META | BLUEPRINT |
|----|-----------------|---------------|-------|------|-----------|
| `formatka-app` | FormatkaApp — kalkulator z podglądem i PDF | Ciemny UI techniczny, formularz krokowy, toggle-group, podgląd SVG, tabela wyników, eksport PDF PL, projekty SQLite, katalog presetów | Electron + React + Vite + SQLite | [META.md](aplikacje/formatka-app/META.md) | [BLUEPRINT.md](aplikacje/formatka-app/BLUEPRINT.md) |

### Tagi szablonów

| ID | Tagi |
|----|------|
| `formatka-app` | `electron` `react` `vite` `sqlite` `pdf` `kalkulator` `konfigurator` `dark-ui` `desktop` `polski` |

---

## Pytanie 1 — wybór szablonu

Agent prezentuje tabelę katalogu i pyta użytkownika, który szablon wziąć jako bazę. Szczegóły wyboru — w `META.md` → sekcja **Karta wyboru**.

---

## Prompt budowy (skrót)

```
@INSTRUKCJA-BUDOWA.md
@aplikacje/[ID]/META.md
@aplikacje/[ID]/BLUEPRINT.md

Zbuduj nową aplikację:
- Domena: [opis]
- Nazwa: [nazwa]
- ID nowej app: [slug]

Zachowaj wzorce z BLUEPRINT. Nie klonuj domeny FormatkaApp.
```

---

## Fazy budowy

Szczegółowa checklist — w `BLUEPRINT.md` §24 (Fazy 1–7).

1. Szkielet Electron + React + Vite
2. Design system (CSS variables, ToggleGroup, layout)
3. Stan `cfg` + `computeFromConfig`
4. UI formularza + podgląd + tabela
5. SQLite (projekty, settings)
6. Eksport PDF
7. Release NSIS

---

*Katalog aktualizowany przez [INSTRUKCJA-EKSTRAKCJA.md](INSTRUKCJA-EKSTRAKCJA.md) §7.*
