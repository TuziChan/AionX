use std::path::Path;
use tracing_appender::rolling;
use tracing_subscriber::{fmt, EnvFilter, layer::SubscriberExt, util::SubscriberInitExt};

/// 初始化日志系统
/// - 控制台输出：开发模式调试
/// - 文件日志：按天轮转，写入 {app_data_dir}/logs/aionx.YYYY-MM-DD.log
pub fn init_logging(app_data_dir: Option<&Path>) {
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| {
            EnvFilter::new("aionx=debug,aionx_lib=debug,axum=info,sqlx=warn")
        });

    let console_layer = fmt::layer()
        .with_file(true)
        .with_line_number(true);

    if let Some(dir) = app_data_dir {
        let log_dir = dir.join("logs");

        // 按天轮转日志文件
        let file_appender = rolling::daily(&log_dir, "aionx.log");
        let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);

        // 将 guard 泄漏到 'static，确保程序退出前日志都能刷写
        // 这是 tracing-appender 文档推荐的做法
        std::mem::forget(_guard);

        let file_layer = fmt::layer()
            .with_writer(non_blocking)
            .with_ansi(false)
            .with_file(true)
            .with_line_number(true)
            .with_target(true);

        tracing_subscriber::registry()
            .with(env_filter)
            .with(console_layer)
            .with(file_layer)
            .init();

        return;
    }

    // 仅控制台输出 fallback
    tracing_subscriber::registry()
        .with(env_filter)
        .with(console_layer)
        .init();
}
