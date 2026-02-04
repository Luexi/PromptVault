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
) -> Result<Prompt, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let data_dir = db.get_data_dir().clone();

    let (image_path, thumbnail_path) = if let Some(data) = resolve_image_data(image_data, image_path.as_deref())? {
        let ext = resolve_image_extension(filename.as_deref(), image_path.as_deref());
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
        let thumbnail_filename = format!("{}_thumb.{}", uuid, ext);
        let thumbnail_path_full = thumbnails_dir.join(&thumbnail_filename);

        if let Ok(img) = image::load_from_memory(&data) {
            let thumbnail = img.resize(300, 300, FilterType::Lanczos3);
            thumbnail
                .save(&thumbnail_path_full)
                .map_err(|e| e.to_string())?;
        }

        let image_rel_path = format!("images/{}/{}", month_dir, image_filename);
        let thumbnail_rel_path = format!("thumbnails/{}", thumbnail_filename);

        (Some(image_rel_path), Some(thumbnail_rel_path))
    } else {
        (None, None)
    };

    db.create_prompt(&prompt, image_path.as_deref(), thumbnail_path.as_deref())
        .map_err(|e| e.to_string())
}

fn resolve_image_data(
    image_data: Option<Vec<u8>>,
    image_path: Option<&str>,
) -> Result<Option<Vec<u8>>, String> {
    if let Some(path) = image_path {
        match fs::read(path) {
            Ok(bytes) => return Ok(Some(bytes)),
            Err(_) => {
                if image_data.is_some() {
                    return Ok(image_data);
                }
            }
        }
    }
    Ok(image_data)
}

fn resolve_image_extension(filename: Option<&str>, image_path: Option<&str>) -> String {
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
    "png".to_string()
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
