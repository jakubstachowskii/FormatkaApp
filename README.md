# FormatkaApp

Lokalna aplikacja desktopowa (Electron + React + Vite + SQLite) do planowania zabudowy i rozkroju mebli.

## Wymagania

- Node.js 20+
- Windows (instalator NSIS)

## Development

```bash
npm install
npm run dev
```

Otworzy Vite na `127.0.0.1:5173` oraz okno Electron.

## Instalator Windows

```bash
npm run dist
```

Plik instalatora: `release/FormatkaApp-Setup-0.1.0.exe`

## Dane

Baza SQLite: `%APPDATA%/formatka-app/data/formatka.db` (projekty, katalog, ustawienia, historia rozkrojów).

## Legacy

`legacy/index.html` — prototyp przeglądarkowy (referencja logiki).
