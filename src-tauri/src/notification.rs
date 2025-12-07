use tauri::{command, AppHandle};

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct NotificationPayload {
    title: String,
    body: String,
    icon: Option<String>,
}

#[command]
pub async fn send_notification(app: AppHandle, payload: NotificationPayload) -> Result<(), String> {
    println!("[RUST] 收到通知请求: {} - {}", payload.title, payload.body);

    #[cfg(desktop)]
    {
        use tauri_plugin_notification::NotificationExt;

        let mut builder = app
            .notification()
            .builder()
            .title(&payload.title)
            .body(&payload.body);

        if let Some(icon) = &payload.icon {
            builder = builder.icon(icon);
        }

        builder.show().map_err(|err| {
            println!("[RUST] 通知发送失败: {}", err);
            err.to_string()
        })?;

        println!("[RUST] 通知已发送");
    }

    Ok(())
}