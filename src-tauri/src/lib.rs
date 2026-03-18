mod agents;
mod channels;
mod commands;
mod config;
mod dao;
mod db;
mod error;
mod events;
mod extensions;
mod logging;
mod models;
mod services;
mod state;
mod utils;
mod webui;

use state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化日志（启动前先用控制台日志，setup 里用文件日志）
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
            commands::get_grouped_history,
            commands::get_associated_chat,
            commands::get_messages,
            commands::add_message,
            // Agent commands
            commands::send_message,
            commands::stop_agent,
            commands::get_agent_status,
            commands::approve_permission,
            commands::detect_agents,
            commands::list_builtin_assistants,
            commands::save_builtin_assistant_preferences,
            commands::list_assistant_plugins,
            commands::create_assistant_plugin,
            commands::update_assistant_plugin,
            commands::remove_assistant_plugin,
            // Channel commands
            commands::list_channel_plugins,
            commands::create_channel_plugin,
            commands::update_channel_plugin,
            commands::delete_channel_plugin,
            commands::validate_channel_plugin_config,
            commands::list_extensions,
            commands::update_extension,
            commands::list_extension_settings_tabs,
            commands::get_extension_settings_tab,
            commands::set_extension_enabled,
            commands::get_extension_host_context,
            // Settings commands
            commands::get_settings,
            commands::update_settings,
            commands::change_language,
            commands::get_default_config,
            commands::get_display_settings,
            commands::save_display_settings,
            commands::get_app_metadata,
            commands::get_update_preferences,
            commands::save_update_preferences,
            commands::check_for_updates,
            commands::get_gemini_settings,
            commands::save_gemini_settings,
            commands::get_google_auth_status,
            commands::start_google_auth,
            commands::logout_google_auth,
            commands::get_webui_settings,
            commands::save_webui_settings,
            commands::get_system_settings,
            commands::save_system_settings,
            commands::get_system_info,
            commands::get_system_directories,
            commands::open_dev_tools,
            commands::set_zoom_factor,
            commands::log_from_frontend,
            // Model settings commands
            commands::list_model_providers,
            commands::create_model_provider,
            commands::update_model_provider,
            commands::delete_model_provider,
            commands::upsert_provider_model,
            commands::delete_provider_model,
            commands::set_model_provider_enabled,
            commands::set_provider_model_enabled,
            commands::set_provider_model_protocol,
            commands::run_model_health_check,
            // File commands
            commands::read_file,
            commands::write_file,
            commands::list_directory,
            commands::create_zip,
            commands::extract_zip,
            commands::download_file,
            commands::get_file_type,
            // MCP / tools commands
            commands::list_mcp_servers,
            commands::create_mcp_server,
            commands::update_mcp_server,
            commands::delete_mcp_server,
            commands::test_mcp_connection,
            commands::get_image_generation_settings,
            commands::save_image_generation_settings,
            // Cron commands
            commands::add_cron_job,
            commands::list_cron_jobs,
            commands::get_cron_job,
            commands::update_cron_job,
            commands::remove_cron_job,
            // WebUI commands
            commands::start_webui,
            commands::stop_webui,
            commands::get_webui_status,
            commands::change_webui_password,
            commands::reset_webui_password,
        ]);

    #[cfg(debug_assertions)]
    builder
        .export(
            specta_typescript::Typescript::default(),
            "../src/bindings.ts",
        )
        .expect("Failed to export typescript bindings");

    tauri::Builder::default()
        // Tauri plugins (按03文档完整注册)
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // 当第二个实例启动时，聚焦已有窗口
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
        }))
        .setup(|app| {
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;

            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data dir");

            // 确保数据目录存在
            std::fs::create_dir_all(&app_data_dir)
                .expect("Failed to create app data dir");

            // 重新初始化日志（带文件输出）
            // 注：tracing 只能初始化一次，此处使用文件日志需要在 init_logging(None) 之前处理
            // 实际上 tracing global subscriber 只能设置一次，所以只在 setup 中初始化

            // 初始化数据库
            let pool = tauri::async_runtime::block_on(async {
                db::init_database(&app_data_dir).await
            })
            .expect("Failed to initialize database");

            tauri::async_runtime::block_on(async {
                seed_e2e_extension_if_needed(&pool).await
            })
            .expect("Failed to seed E2E extension fixture");

            // 创建应用状态
            let app_state = AppState::new(pool);

            // 启动事件桥接：InternalEvent → Tauri Event
            let rx = app_state.event_bus.subscribe();
            events::bridge::spawn_event_bridge(app.handle().clone(), rx);

            // 注入状态
            app.manage(app_state);

            tracing::info!("AionX application started successfully");
            Ok(())
        })
        .invoke_handler(builder.invoke_handler())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn seed_e2e_extension_if_needed(pool: &sqlx::SqlitePool) -> Result<(), String> {
    if !should_seed_e2e_extension() {
        return Ok(());
    }

    let now = chrono::Utc::now().timestamp();
    let config = serde_json::json!({
        "settings": {
            "tabId": "host-smoke",
            "host": {
                "entryUrl": "/extension-host-smoke.html"
            }
        }
    })
    .to_string();

    sqlx::query(
        "INSERT INTO extensions (id, name, version, description, path, enabled, config, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           version = excluded.version,
           description = excluded.description,
           path = excluded.path,
           enabled = excluded.enabled,
           config = excluded.config,
           updated_at = excluded.updated_at",
    )
    .bind("e2e-extension-host")
    .bind("E2E Host Extension")
    .bind("0.1.0")
    .bind("用于验证扩展设置宿主页 iframe 链路的自动化样本。")
    .bind("embedded://extension-host-smoke")
    .bind(true)
    .bind(config)
    .bind(now)
    .bind(now)
    .execute(pool)
    .await
    .map_err(|error| error.to_string())?;

    Ok(())
}

fn should_seed_e2e_extension() -> bool {
    std::env::var("AIONX_E2E_SEED_EXTENSION")
        .map(|value| matches!(value.as_str(), "1" | "true" | "TRUE" | "yes" | "YES"))
        .unwrap_or(false)
}
