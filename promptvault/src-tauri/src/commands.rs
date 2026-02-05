use crate::db::{NewPrompt, Prompt, UpdatePrompt};
use crate::AppState;
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use image::imageops::FilterType;
use std::fs;
use std::path::{Component, Path};
use tauri::State;
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_shell::ShellExt;
use uuid::Uuid;

#[tauri::command]
pub fn get_all_prompts(
    state: State<AppState>,
    filter: Option<String>,
    collection_id: Option<i32>,
) -> Result<Vec<Prompt>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_all_prompts(filter.as_deref(), collection_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_prompt_by_id(state: State<AppState>, id: i32) -> Result<Prompt, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_prompt_by_id(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_prompt(
    state: State<AppState>,
    prompt: NewPrompt,
    image_data: Option<Vec<u8>>,
    filename: Option<String>,
    image_path: Option<String>,
    image_base64: Option<String>,
    has_image: Option<bool>,
) -> Result<Prompt, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let data_dir = db.get_data_dir().clone();

    let expects_image = has_image.unwrap_or(false)
        || image_data.is_some()
        || image_path.as_deref().is_some_and(|p| !p.is_empty())
        || image_base64.as_deref().is_some_and(|p| !p.is_empty());

    let (image_path, thumbnail_path) = if let Some(data) = resolve_image_data(
        image_data,
        image_path.as_deref(),
        image_base64.as_deref(),
    )? {
        let ext = resolve_image_extension(
            filename.as_deref(),
            image_path.as_deref(),
            image_base64.as_deref(),
        );
        let uuid = Uuid::new_v4().to_string();
        let now = chrono::Local::now();
        let month_dir = now.format("%Y-%m").to_string();

        // Create directories
        let images_dir = data_dir.join("images").join(&month_dir);
        let thumbnails_dir = data_dir.join("thumbnails");
        fs::create_dir_all(&images_dir).map_err(|e| e.to_string())?;
        fs::create_dir_all(&thumbnails_dir).map_err(|e| e.to_string())?;

        // Save original image
        let image_filename = format!("{}.{}" , uuid, ext);
        let image_path_full = images_dir.join(&image_filename);
        fs::write(&image_path_full, &data).map_err(|e| e.to_string())?;

        // Create thumbnail
        let image_rel_path = format!("images/{}/{}", month_dir, image_filename);

        let thumbnail_rel_path = if ext.eq_ignore_ascii_case("svg") {
            // The `image` crate doesn't decode SVG. Reuse the original for preview.
            image_rel_path.clone()
        } else {
            let thumbnail_filename = format!("{}_thumb.{}", uuid, ext);
            let thumbnail_path_full = thumbnails_dir.join(&thumbnail_filename);
            match image::load_from_memory(&data) {
                Ok(img) => {
                    let thumbnail = img.resize(300, 300, FilterType::Lanczos3);
                    thumbnail
                        .save(&thumbnail_path_full)
                        .map_err(|e| e.to_string())?;
                    format!("thumbnails/{}", thumbnail_filename)
                }
                Err(_) => {
                    // Fallback: if we can't decode the image for thumbnail generation,
                    // still show something in the UI.
                    image_rel_path.clone()
                }
            }
        };

        (Some(image_rel_path), Some(thumbnail_rel_path))
    } else {
        if expects_image {
            return Err("No se recibieron datos de imagen. Vuelve a seleccionar el archivo e intenta de nuevo.".to_string());
        }
        (None, None)
    };

    db.create_prompt(&prompt, image_path.as_deref(), thumbnail_path.as_deref())
        .map_err(|e| e.to_string())
}

fn resolve_image_data(
    image_data: Option<Vec<u8>>,
    image_path: Option<&str>,
    image_base64: Option<&str>,
) -> Result<Option<Vec<u8>>, String> {
    // Prefer bytes sent over IPC (most reliable) over trying to read a client-provided path.
    if image_data.is_some() {
        return Ok(image_data);
    }
    if let Some(data_url) = image_base64 {
        // Supports both:
        // - data:<mime>;base64,<...>
        // - data:<mime>,<percent-encoded bytes> (common for SVG)
        if let Some((meta, data)) = data_url.split_once(',') {
            if meta.contains(";base64") {
                match BASE64.decode(data) {
                    Ok(bytes) => return Ok(Some(bytes)),
                    Err(_) => {
                        if image_data.is_some() {
                            return Ok(image_data);
                        }
                    }
                }
            } else {
                let decoded = percent_decode(data.as_bytes());
                if !decoded.is_empty() {
                    return Ok(Some(decoded));
                }
            }
        } else {
            // If the string is raw base64 without a data URL prefix.
            if let Ok(bytes) = BASE64.decode(data_url) {
                return Ok(Some(bytes));
            }
        }
    }
    if let Some(path) = image_path {
        let normalized = normalize_fs_path(path);
        if let Ok(bytes) = fs::read(path) {
            return Ok(Some(bytes));
        }
        if let Some(p) = normalized.as_deref() {
            if p != path {
                if let Ok(bytes) = fs::read(p) {
                    return Ok(Some(bytes));
                }
            }
        }
    }
    Ok(None)
}

fn normalize_fs_path(path: &str) -> Option<String> {
    let p = path.trim();
    if let Some(rest) = p.strip_prefix("file://") {
        // Common when a frontend passes a file URL instead of a plain path.
        // file:///C:/... or file://C:/...
        let rest = rest.strip_prefix('/').unwrap_or(rest);
        return Some(rest.replace('/', "\\"));
    }
    None
}

fn resolve_image_extension(
    filename: Option<&str>,
    image_path: Option<&str>,
    image_base64: Option<&str>,
) -> String {
    if let Some(name) = filename {
        if let Some(ext) = name.split('.').last() {
            if !ext.is_empty() {
                return ext.to_string();
            }
        }
    }
    if let Some(path) = image_path {
        if let Some(ext) = Path::new(path).extension().and_then(|e| e.to_str()) {
            if !ext.is_empty() {
                return ext.to_string();
            }
        }
    }
    if let Some(data_url) = image_base64 {
        if let Some(mime) = data_url.strip_prefix("data:").and_then(|v| v.split(';').next()) {
            return match mime {
                "image/jpeg" => "jpg",
                "image/jpg" => "jpg",
                "image/png" => "png",
                "image/webp" => "webp",
                "image/gif" => "gif",
                "image/bmp" => "bmp",
                "image/tiff" => "tiff",
                "image/svg+xml" => "svg",
                _ => "png",
            }
            .to_string();
        }
    }
    "png".to_string()
}

fn percent_decode(input: &[u8]) -> Vec<u8> {
    // Minimal percent-decoder for data URLs (ASCII/UTF-8). Also converts '+' to space.
    let mut out = Vec::with_capacity(input.len());
    let mut i = 0;
    while i < input.len() {
        match input[i] {
            b'%' if i + 2 < input.len() => {
                let h1 = from_hex(input[i + 1]);
                let h2 = from_hex(input[i + 2]);
                if let (Some(h1), Some(h2)) = (h1, h2) {
                    out.push((h1 << 4) | h2);
                    i += 3;
                    continue;
                }
                out.push(input[i]);
                i += 1;
            }
            b'+' => {
                out.push(b' ');
                i += 1;
            }
            b => {
                out.push(b);
                i += 1;
            }
        }
    }
    out
}

fn from_hex(b: u8) -> Option<u8> {
    match b {
        b'0'..=b'9' => Some(b - b'0'),
        b'a'..=b'f' => Some(b - b'a' + 10),
        b'A'..=b'F' => Some(b - b'A' + 10),
        _ => None,
    }
}

#[tauri::command]
pub fn update_prompt(
    state: State<AppState>,
    id: i32,
    prompt: UpdatePrompt,
) -> Result<Prompt, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_prompt(id, &prompt).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_prompt(state: State<AppState>, id: i32) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_prompt(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn toggle_favorite(state: State<AppState>, id: i32) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.toggle_favorite(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn search_prompts(state: State<AppState>, query: String) -> Result<Vec<Prompt>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.search_prompts(&query).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_collections(state: State<AppState>) -> Result<Vec<crate::db::Collection>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_collections().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_collection(state: State<AppState>, name: String) -> Result<crate::db::Collection, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.create_collection(&name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_models(state: State<AppState>) -> Result<Vec<crate::db::Model>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_models().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_image_base64(
    state: State<AppState>,
    path: String,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let data_dir = db.get_data_dir();
    let rel_path = Path::new(&path);

    if rel_path.is_absolute()
        || rel_path.components().any(|c| matches!(c, Component::ParentDir))
    {
        return Err("invalid path".to_string());
    }

    let full_path = data_dir.join(rel_path);
    let bytes = fs::read(&full_path).map_err(|e| e.to_string())?;
    Ok(BASE64.encode(bytes))
}

#[tauri::command]
pub fn copy_to_clipboard(
    app: tauri::AppHandle,
    text: String,
) -> Result<(), String> {
    app.clipboard()
        .write_text(text)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn open_image_external(
    app: tauri::AppHandle,
    state: State<AppState>,
    path: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let data_dir = db.get_data_dir();
    let full_path = data_dir.join(path);
    
    let shell = app.shell();
    shell
        .open(full_path.to_string_lossy().to_string(), None)
        .map_err(|e| e.to_string())
}
