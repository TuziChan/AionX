use std::path::Path;
use tracing_subscriber::{fmt, EnvFilter, layer::SubscriberExt, util::SubscriberInitExt};

/// 初始化日志系统
/// - 控制台输出：开发模式
/// - 文件日志：写入 app_data_dir/logs/aionx.log
pub fn init_logging(app_data_dir: Option<&Path>) {
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| {
            EnvFilter::new("aionx=debug,aionx_lib=debug,axum=info,sqlx=warn")
        });

    if let Some(dir) = app_data_dir {
        let log_dir = dir.join("logs");
        let _ = std::fs::create_dir_all(&log_dir);

        let file = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(log_dir.join("aionx.log"))
            .ok();

        if let Some(file) = file {
            let file_layer = fmt::layer()
                .with_writer(file)
                .with_ansi(false)
                .with_file(true)
                .with_line_number(true)
                .with_target(true);

            let console_layer = fmt::layer()
                .with_file(true)
                .with_line_number(true);

            tracing_subscriber::registry()
                .with(env_filter)
                .with(console_layer)
                .with(file_layer)
                .init();

            return;
        }
    }

    // 仅控制台输出 fallback
    tracing_subscriber::fmt()
        .with_env_filter(env_filter)
        .with_file(true)
        .with_line_number(true)
        .init();
}
