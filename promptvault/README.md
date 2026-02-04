# PromptVault 📸

Native desktop application for local AI image generation prompt management. Built with **Tauri 2.0 + React + SQLite**.

## 🚀 Getting Started

### Prerequisites
- [Rust](https://www.rust-lang.org/tools/install)
- [Node.js](https://nodejs.org/) (v18+)
- [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development
To run the application in development mode:
```bash
npm run tauri dev
```

To run only the frontend in the browser:
```bash
npm run dev
```

## 🏗️ Architecture

- **Frontend:** React + TypeScript + Tailwind CSS + Zustand
- **Backend:** Rust + Tauri 2.0
- **Database:** SQLite (local storage)
- **Design:** macOS inspired aesthetics

## 📂 Project Structure
- `src/`: React frontend source code
- `src-tauri/`: Rust backend and Tauri configuration
- `data/`: Local storage for images and thumbnails (generated at runtime)
