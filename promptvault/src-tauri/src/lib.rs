pub mod commands;
pub mod db;

use db::Database;
use std::sync::Mutex;
use tauri::Manager;

pub struct AppState {
    pub db: Mutex<Database>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let app_handle = app.handle();
            let db = Database::new(&app_handle)?;
            app.manage(AppState {
                db: Mutex::new(db),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_all_prompts,
            commands::get_prompt_by_id,
            commands::create_prompt,
            commands::update_prompt,
            commands::delete_prompt,
            commands::toggle_favorite,
            commands::search_prompts,
            commands::get_collections,
            commands::create_collection,
            commands::get_models,
            commands::copy_to_clipboard,
            commands::open_image_external,
            commands::get_image_base64,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
