# PromptVault

PromptVault is a native desktop app to organize image generation prompts locally. It is built with Tauri 2, React, and SQLite, and runs fully offline.

## Key Features
- Local prompt library with favorites, collections, and search
- Image attachments with thumbnails
- Model filters, including Gemini and Chat GPT
- Fast native desktop experience (Tauri 2 + Rust)

## Data Storage
PromptVault stores data on your machine (not in the database as blobs). By default it creates:

- Windows: C:\\Users\\<You>\\Documents\\PromptVault
  - promptvault.db
  - images/
  - 	humbnails/

If you previously ran an older build, your data may be in the app data folder. You can move the old promptvault.db, images/, and 	humbnails/ into Documents\\PromptVault.

## Development

### Prerequisites
- Node.js 18+
- Rust (stable)
- Tauri prerequisites

### Install
`ash
npm install
`

### Run (desktop)
`ash
npm run tauri dev
`

### Run (web only)
`ash
npm run dev
`

### Build installer
`ash
npm run tauri build
`
The Windows installer will be created under:
promptvault\\src-tauri\\target\\release\\bundle\\msi

## Project Structure
- promptvault/src/ React frontend
- promptvault/src-tauri/ Rust backend + Tauri config
- promptvault/src-tauri/icons/ App icons

## Notes
- This repo ignores build artifacts (
ode_modules, dist, src-tauri/target).
- If you see file-lock errors on Windows during build, close running app processes and retry.
