# PromptVault - Prompt para Claude Code

## 🎯 Objetivo

Crear una aplicación de escritorio nativa para Windows llamada **PromptVault** usando **Tauri 2.0 + React + TypeScript + SQLite + Tailwind CSS**. Es una galería local para guardar prompts de generación de imágenes con IA, similar a PromptHero pero completamente offline y local.

---

## 📁 Estructura del Proyecto

```
promptvault/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   ├── db.rs              # SQLite operations
│   │   └── commands.rs        # Tauri commands
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── TrafficLights.tsx
│   │   ├── Gallery/
│   │   │   ├── GalleryGrid.tsx
│   │   │   ├── PromptCard.tsx
│   │   │   └── FilterTabs.tsx
│   │   ├── Inspector/
│   │   │   └── InspectorPanel.tsx
│   │   ├── Modals/
│   │   │   └── NewPromptModal.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       └── Toggle.tsx
│   ├── hooks/
│   │   ├── usePrompts.ts
│   │   ├── useCollections.ts
│   │   └── useImageHandler.ts
│   ├── lib/
│   │   ├── db.ts              # Tauri invoke wrappers
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🗄️ Esquema de Base de Datos (SQLite)

```sql
-- Tabla principal de prompts
CREATE TABLE IF NOT EXISTS prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    negative_prompt TEXT DEFAULT '',
    model TEXT NOT NULL,
    image_path TEXT,
    thumbnail_path TEXT,
    dimensions TEXT DEFAULT '1:1',
    steps INTEGER,
    sampler TEXT,
    cfg_scale REAL,
    seed TEXT,
    tags TEXT DEFAULT '[]',  -- JSON array
    is_favorite INTEGER DEFAULT 0,
    collection_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collection_id) REFERENCES collections(id)
);

-- Colecciones/Carpetas
CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT 'folder',
    color TEXT DEFAULT '#6b7280',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Modelos de IA disponibles
CREATE TABLE IF NOT EXISTS models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    short_name TEXT,
    is_active INTEGER DEFAULT 1
);

-- Insertar modelos por defecto
INSERT OR IGNORE INTO models (name, short_name) VALUES 
    ('Stable Diffusion XL', 'SDXL'),
    ('Midjourney V6', 'MJ'),
    ('DALL-E 3', 'DALL-E'),
    ('Flux Pro', 'Flux'),
    ('Flux.1', 'Flux.1'),
    ('Leonardo AI', 'Leo'),
    ('Firefly', 'Adobe');
```

---

## 🎨 Diseño UI/UX (Estilo macOS)

### Paleta de Colores

```javascript
// tailwind.config.js
colors: {
  // Backgrounds
  'bg-primary': '#F5F5F7',      // Fondo principal gris claro
  'bg-surface': '#FFFFFF',      // Cards y panels
  'bg-sidebar': '#F5F5F7',      // Sidebar
  
  // Borders
  'border-subtle': '#E5E5E5',
  'border-divider': '#E5E7EB',
  
  // Text
  'text-primary': '#1D1D1F',
  'text-secondary': '#86868B',
  'text-muted': '#9CA3AF',
  
  // Accent
  'accent-blue': '#007AFF',     // macOS System Blue
  'accent-blue-hover': '#0066D6',
  
  // Traffic lights
  'traffic-red': '#FF5F57',
  'traffic-yellow': '#FEBC2E', 
  'traffic-green': '#28C840',
  
  // Tags/Badges
  'badge-bg': '#F3F4F6',
  'badge-border': '#E5E7EB',
}
```

### Tipografía

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Estilos Clave

- **Bordes redondeados**: `rounded-xl` (12px), `rounded-2xl` (16px)
- **Sombras suaves**: 
  ```css
  shadow-soft: '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)'
  shadow-floating: '0 8px 24px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04)'
  shadow-sheet: '0 20px 40px -10px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1)'
  ```
- **Scrollbar personalizado**: Delgado, gris claro, con hover
- **Transiciones**: `transition-colors duration-200`, `transition-all duration-300`
- **Hover states**: Sutiles, con cambio de background o border

---

## 🖼️ Vistas Principales

### 1. Vista de Galería (Main View)

Layout de 3 columnas:
- **Sidebar izquierdo** (220px fijo):
  - Traffic lights decorativos (rojo, amarillo, verde)
  - Sección LIBRARY: All Prompts, Favorites, History
  - Sección COLLECTIONS: Lista de colecciones dinámicas
  - Footer: Settings, User
  
- **Área central** (flex-1):
  - Header con título "Gallery", barra de búsqueda, botón "+ New"
  - Filter tabs: All, Midjourney, DALL-E 3, Stable Diffusion, etc.
  - Grid de cards (4 columnas en desktop, responsive)
  - Cada card muestra: imagen thumbnail, título, badge del modelo, preview del prompt truncado

- **Inspector Panel derecho** (360px, condicional):
  - Se muestra al seleccionar un prompt
  - Muestra imagen grande, prompt completo, negative prompt
  - Generation Info: Model, Dimensions, Steps, Sampler, CFG, Seed
  - Botones: Copy prompt, Download image, Delete

### 2. Modal de Nuevo Prompt

Modal centrado con overlay blur:
- **Lado izquierdo**: Área de drop para imagen con preview
- **Lado derecho**: Formulario
  - Title (input)
  - Model (select dropdown)
  - Positive Prompt (textarea grande)
  - Negative Prompt (textarea)
  - Campos opcionales: Steps, Sampler, CFG Scale, Seed
  - Collection (select)
  - Tags (input con chips)
- Botones: Cancel, Save

### 3. Vista de Detalle (alternativa al inspector)

Pantalla completa con:
- Imagen grande centrada con controles de zoom
- Panel lateral con toda la información
- Navegación entre prompts (flechas)

---

## ⚙️ Funcionalidades Core

### Gestión de Imágenes

```typescript
// El flujo de guardado de imágenes:
// 1. Usuario selecciona/arrastra imagen
// 2. Tauri copia a: ./data/images/{YYYY-MM}/{uuid}.{ext}
// 3. Genera thumbnail en: ./data/thumbnails/{uuid}_thumb.{ext}
// 4. SQLite guarda rutas relativas

interface ImagePaths {
  original: string;    // "images/2024-02/abc123.png"
  thumbnail: string;   // "thumbnails/abc123_thumb.png"
}
```

### Tauri Commands (Rust)

```rust
// commands.rs - Comandos que React invocará

#[tauri::command]
fn get_all_prompts(filter: Option<String>, collection_id: Option<i32>) -> Result<Vec<Prompt>, String>

#[tauri::command]
fn get_prompt_by_id(id: i32) -> Result<Prompt, String>

#[tauri::command]
fn create_prompt(prompt: NewPrompt, image_data: Option<Vec<u8>>, filename: Option<String>) -> Result<Prompt, String>

#[tauri::command]
fn update_prompt(id: i32, prompt: UpdatePrompt) -> Result<Prompt, String>

#[tauri::command]
fn delete_prompt(id: i32) -> Result<(), String>

#[tauri::command]
fn toggle_favorite(id: i32) -> Result<bool, String>

#[tauri::command]
fn search_prompts(query: String) -> Result<Vec<Prompt>, String>

#[tauri::command]
fn get_collections() -> Result<Vec<Collection>, String>

#[tauri::command]
fn create_collection(name: String) -> Result<Collection, String>

#[tauri::command]
fn get_models() -> Result<Vec<Model>, String>

#[tauri::command]
fn copy_to_clipboard(text: String) -> Result<(), String>

#[tauri::command]
fn open_image_external(path: String) -> Result<(), String>

#[tauri::command]
fn export_prompt(id: i32, format: String) -> Result<String, String>  // JSON o PNG con metadata
```

### React Hooks

```typescript
// hooks/usePrompts.ts
export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  
  // Fetch prompts with optional filter
  const fetchPrompts = async (modelFilter?: string, collectionId?: number) => {...}
  
  // CRUD operations
  const createPrompt = async (data: NewPromptData) => {...}
  const updatePrompt = async (id: number, data: Partial<Prompt>) => {...}
  const deletePrompt = async (id: number) => {...}
  const toggleFavorite = async (id: number) => {...}
  
  return { prompts, loading, filter, setFilter, fetchPrompts, createPrompt, ... }
}

// hooks/useImageHandler.ts
export function useImageHandler() {
  const [preview, setPreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<Uint8Array | null>(null);
  
  const handleDrop = (e: DragEvent) => {...}
  const handleFileSelect = (file: File) => {...}
  const clearImage = () => {...}
  
  return { preview, imageData, handleDrop, handleFileSelect, clearImage }
}
```

---

## 📋 TypeScript Types

```typescript
// types/index.ts

export interface Prompt {
  id: number;
  title: string;
  prompt_text: string;
  negative_prompt: string;
  model: string;
  image_path: string | null;
  thumbnail_path: string | null;
  dimensions: string;
  steps: number | null;
  sampler: string | null;
  cfg_scale: number | null;
  seed: string | null;
  tags: string[];
  is_favorite: boolean;
  collection_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface NewPrompt {
  title: string;
  prompt_text: string;
  negative_prompt?: string;
  model: string;
  dimensions?: string;
  steps?: number;
  sampler?: string;
  cfg_scale?: number;
  seed?: string;
  tags?: string[];
  collection_id?: number;
}

export interface Collection {
  id: number;
  name: string;
  icon: string;
  color: string;
  prompt_count?: number;
}

export interface Model {
  id: number;
  name: string;
  short_name: string;
  is_active: boolean;
}

export type ViewMode = 'gallery' | 'detail';
export type SidebarSection = 'all' | 'favorites' | 'history' | 'collection';
```

---

## 🚀 Configuración Inicial

### package.json (dependencias clave)

```json
{
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-fs": "^2.0.0",
    "@tauri-apps/plugin-clipboard-manager": "^2.0.0",
    "@tauri-apps/plugin-dialog": "^2.0.0",
    "@tauri-apps/plugin-shell": "^2.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.5.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

### Cargo.toml (dependencias Rust)

```toml
[dependencies]
tauri = { version = "2.0", features = ["devtools"] }
tauri-plugin-fs = "2.0"
tauri-plugin-clipboard-manager = "2.0"
tauri-plugin-dialog = "2.0"
tauri-plugin-shell = "2.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
rusqlite = { version = "0.31", features = ["bundled"] }
uuid = { version = "1.7", features = ["v4"] }
chrono = "0.4"
image = "0.25"  # Para generar thumbnails
```

### tauri.conf.json

```json
{
  "productName": "PromptVault",
  "version": "1.0.0",
  "identifier": "com.promptvault.app",
  "build": {
    "frontendDist": "../dist"
  },
  "app": {
    "withGlobalTauri": true,
    "windows": [
      {
        "title": "PromptVault",
        "width": 1400,
        "height": 900,
        "minWidth": 1000,
        "minHeight": 700,
        "decorations": false,
        "transparent": false,
        "center": true
      }
    ]
  },
  "bundle": {
    "active": true,
    "targets": ["msi", "nsis"],
    "icon": ["icons/icon.ico"],
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256"
    }
  }
}
```

---

## 🎯 Orden de Implementación Sugerido

1. **Fase 1 - Setup**
   - Inicializar proyecto Tauri 2 + React + Vite
   - Configurar Tailwind con la paleta de colores
   - Crear estructura de carpetas

2. **Fase 2 - Base de Datos**
   - Implementar db.rs con conexión SQLite
   - Crear tablas y migraciones
   - Implementar CRUD básico en Rust

3. **Fase 3 - Layout Principal**
   - Crear Sidebar con navegación
   - Crear Header con búsqueda
   - Traffic lights decorativos
   - Estructura responsive

4. **Fase 4 - Galería**
   - GalleryGrid con cards
   - PromptCard component
   - FilterTabs por modelo
   - Búsqueda funcional

5. **Fase 5 - Inspector Panel**
   - Panel lateral con detalles
   - Copiar prompt al clipboard
   - Mostrar imagen grande

6. **Fase 6 - Crear/Editar Prompts**
   - Modal de nuevo prompt
   - Drag & drop de imágenes
   - Guardado de imágenes locales
   - Generación de thumbnails

7. **Fase 7 - Features Adicionales**
   - Colecciones/carpetas
   - Favoritos
   - Tags
   - Export/Import

---

## 📎 Archivos de Referencia de Diseño

He adjuntado 3 mockups HTML que muestran exactamente cómo debe verse la UI:

1. **screen.png / code.html (Gallery View)**: Vista principal con sidebar, galería de cards, y filtros
2. **screen.png / code.html (Inspector)**: Panel lateral derecho mostrando detalles del prompt seleccionado
3. **screen.png / code.html (New Prompt Modal)**: Modal para crear nuevo prompt con área de imagen y formulario

**IMPORTANTE**: Usa estos archivos HTML como referencia EXACTA para los estilos, espaciados, colores y estructura. El diseño ya está perfecto, solo hay que implementarlo funcionalmente en React.

---

## ✅ Criterios de Éxito

- [ ] La app compila y corre en Windows sin errores
- [ ] Se puede crear un prompt con imagen y se guarda localmente
- [ ] La galería muestra todos los prompts con thumbnails
- [ ] Se puede filtrar por modelo de IA
- [ ] La búsqueda funciona por título y contenido del prompt
- [ ] Se puede copiar el prompt al clipboard con un click
- [ ] Las imágenes se guardan en `./data/images/` organizadas por fecha
- [ ] La UI se ve idéntica a los mockups adjuntos
- [ ] El ejecutable final pesa menos de 15MB

---

## 💡 Tips para Claude Code

1. **Empieza con el backend Rust** - La base de datos y los commands son la base de todo
2. **Usa los mockups HTML como referencia** - Los estilos ya están definidos, no inventes nuevos
3. **Testea el flujo de imágenes temprano** - Es la parte más crítica
4. **Mantén el código modular** - Un componente por archivo
5. **Usa Zustand para estado global** - Más simple que Redux para esta escala

¡Adelante! Crea PromptVault paso a paso, empezando por el setup del proyecto Tauri.
