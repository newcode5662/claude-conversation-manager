mod commands;
mod db;

use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = db::init_db(&handle).await {
                    eprintln!("Failed to initialize database: {}", e);
                } else {
                    println!("Database initialized successfully");
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            import_history,
            get_sessions,
            get_session,
            get_prompts,
            delete_sessions,
            archive_sessions,
            get_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
