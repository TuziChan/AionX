mod agent;
mod commands;
mod config;
mod db;
mod error;
mod events;
mod logging;
mod models;
mod services;
mod state;

use state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化日志（启动前先用控制台日志，setup 里再切换）
    logging::init_logging(None);

    let builder = tauri_specta::Builder::<tauri::Wry>::new()
        .commands(tauri_specta::collect_commands![
            // Chat commands
            commands::create_chat,
            commands::get_chat,
            commands::list_chats,
            commands::update_chat,
            commands::delete_chat,
            commands::get_workspace_chats,
            commands::get_messages,
            commands::add_message,
            // Settings commands
            commands::get_default_config,
            commands::get_system_info,
            commands::log_from_frontend,
        ]);

    #[cfg(debug_assertions)]
    builder
        .export(
            specta_typescript::Typescript::default(),
            "../src/bindings.ts",
        )
        .expect("Failed to export typescript bindings");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");

            // 确保数据目录存在
            std::fs::create_dir_all(&app_data_dir)
                .expect("Failed to create app data dir");

            // 初始化数据库
            let pool = tauri::async_runtime::block_on(async {
                db::init_database(&app_data_dir).await
            })
            .expect("Failed to initialize database");

            // 创建并注入应用状态
            let app_state = AppState::new(pool);
            app.manage(app_state);

            tracing::info!("AionX application started successfully");
            Ok(())
        })
        .invoke_handler(builder.invoke_handler())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
