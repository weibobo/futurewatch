// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod notification;

use serde::Deserialize;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[derive(Clone, Deserialize)]
struct ShortcutModifiers {
    ctrl: bool,
    shift: bool,
    alt: bool,
    meta: bool,
}

#[derive(Clone, Deserialize)]
struct ShortcutPayload {
    code: String,
    modifiers: ShortcutModifiers,
}

impl Default for ShortcutPayload {
    fn default() -> Self {
        Self {
            code: "Digit1".to_string(),
            modifiers: ShortcutModifiers {
                ctrl: true,
                shift: false,
                alt: true,
                meta: false,
            },
        }
    }
}

#[tauri::command]
fn register_toggle_shortcut(
    app: tauri::AppHandle,
    shortcut: ShortcutPayload,
) -> Result<(), String> {
    apply_shortcut(&app, &shortcut)
}

fn apply_shortcut(handle: &AppHandle, payload: &ShortcutPayload) -> Result<(), String> {
    let accelerator = build_accelerator(payload)?;
    let manager = handle.global_shortcut();

    if let Err(error) = manager.unregister_all() {
        eprintln!("Failed to clear previous shortcuts: {error}");
    }

    let shortcut = parse_shortcut(&accelerator)?;

    manager
        .on_shortcut(shortcut, |app_handle, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                toggle_main_window(app_handle);
            }
        })
        .map_err(|error| error.to_string())
}

fn parse_shortcut(accelerator: &str) -> Result<Shortcut, String> {
    // Parse the accelerator string into a Shortcut
    // Format: "Ctrl+Shift+Key" or "Alt+Space" etc.
    let parts: Vec<&str> = accelerator.split('+').collect();

    let mut mods = Modifiers::empty();
    let mut key_str = "";

    for part in &parts {
        match *part {
            "Ctrl" => mods |= Modifiers::CONTROL,
            "Shift" => mods |= Modifiers::SHIFT,
            "Alt" => mods |= Modifiers::ALT,
            "Meta" => mods |= Modifiers::META,
            _ => key_str = part,
        }
    }

    // Convert key string to KeyCode
    let key_code = match key_str {
        "A" => tauri_plugin_global_shortcut::Code::KeyA,
        "B" => tauri_plugin_global_shortcut::Code::KeyB,
        "C" => tauri_plugin_global_shortcut::Code::KeyC,
        "D" => tauri_plugin_global_shortcut::Code::KeyD,
        "E" => tauri_plugin_global_shortcut::Code::KeyE,
        "F" => tauri_plugin_global_shortcut::Code::KeyF,
        "G" => tauri_plugin_global_shortcut::Code::KeyG,
        "H" => tauri_plugin_global_shortcut::Code::KeyH,
        "I" => tauri_plugin_global_shortcut::Code::KeyI,
        "J" => tauri_plugin_global_shortcut::Code::KeyJ,
        "K" => tauri_plugin_global_shortcut::Code::KeyK,
        "L" => tauri_plugin_global_shortcut::Code::KeyL,
        "M" => tauri_plugin_global_shortcut::Code::KeyM,
        "N" => tauri_plugin_global_shortcut::Code::KeyN,
        "O" => tauri_plugin_global_shortcut::Code::KeyO,
        "P" => tauri_plugin_global_shortcut::Code::KeyP,
        "Q" => tauri_plugin_global_shortcut::Code::KeyQ,
        "R" => tauri_plugin_global_shortcut::Code::KeyR,
        "S" => tauri_plugin_global_shortcut::Code::KeyS,
        "T" => tauri_plugin_global_shortcut::Code::KeyT,
        "U" => tauri_plugin_global_shortcut::Code::KeyU,
        "V" => tauri_plugin_global_shortcut::Code::KeyV,
        "W" => tauri_plugin_global_shortcut::Code::KeyW,
        "X" => tauri_plugin_global_shortcut::Code::KeyX,
        "Y" => tauri_plugin_global_shortcut::Code::KeyY,
        "Z" => tauri_plugin_global_shortcut::Code::KeyZ,
        "0" => tauri_plugin_global_shortcut::Code::Digit0,
        "1" => tauri_plugin_global_shortcut::Code::Digit1,
        "2" => tauri_plugin_global_shortcut::Code::Digit2,
        "3" => tauri_plugin_global_shortcut::Code::Digit3,
        "4" => tauri_plugin_global_shortcut::Code::Digit4,
        "5" => tauri_plugin_global_shortcut::Code::Digit5,
        "6" => tauri_plugin_global_shortcut::Code::Digit6,
        "7" => tauri_plugin_global_shortcut::Code::Digit7,
        "8" => tauri_plugin_global_shortcut::Code::Digit8,
        "9" => tauri_plugin_global_shortcut::Code::Digit9,
        "Space" => tauri_plugin_global_shortcut::Code::Space,
        "Enter" => tauri_plugin_global_shortcut::Code::Enter,
        "Escape" => tauri_plugin_global_shortcut::Code::Escape,
        "Backspace" => tauri_plugin_global_shortcut::Code::Backspace,
        "Delete" => tauri_plugin_global_shortcut::Code::Delete,
        "Tab" => tauri_plugin_global_shortcut::Code::Tab,
        "ArrowUp" => tauri_plugin_global_shortcut::Code::ArrowUp,
        "ArrowDown" => tauri_plugin_global_shortcut::Code::ArrowDown,
        "ArrowLeft" => tauri_plugin_global_shortcut::Code::ArrowLeft,
        "ArrowRight" => tauri_plugin_global_shortcut::Code::ArrowRight,
        "F1" => tauri_plugin_global_shortcut::Code::F1,
        "F2" => tauri_plugin_global_shortcut::Code::F2,
        "F3" => tauri_plugin_global_shortcut::Code::F3,
        "F4" => tauri_plugin_global_shortcut::Code::F4,
        "F5" => tauri_plugin_global_shortcut::Code::F5,
        "F6" => tauri_plugin_global_shortcut::Code::F6,
        "F7" => tauri_plugin_global_shortcut::Code::F7,
        "F8" => tauri_plugin_global_shortcut::Code::F8,
        "F9" => tauri_plugin_global_shortcut::Code::F9,
        "F10" => tauri_plugin_global_shortcut::Code::F10,
        "F11" => tauri_plugin_global_shortcut::Code::F11,
        "F12" => tauri_plugin_global_shortcut::Code::F12,
        _ => return Err(format!("Unsupported key: {}", key_str)),
    };

    Ok(Shortcut::new(Some(mods), key_code))
}

fn build_accelerator(payload: &ShortcutPayload) -> Result<String, String> {
    let mut parts: Vec<String> = Vec::new();

    if payload.modifiers.ctrl {
        parts.push("Ctrl".to_string());
    }

    if payload.modifiers.shift {
        parts.push("Shift".to_string());
    }

    if payload.modifiers.alt {
        parts.push("Alt".to_string());
    }

    if payload.modifiers.meta {
        parts.push("Meta".to_string());
    }

    let key = key_from_code(&payload.code)?;
    parts.push(key);

    Ok(parts.join("+"))
}

fn key_from_code(code: &str) -> Result<String, String> {
    if let Some(letter) = code.strip_prefix("Key") {
        if letter.len() == 1 {
            return Ok(letter.to_ascii_uppercase());
        }
    }

    if let Some(digit) = code.strip_prefix("Digit") {
        if digit.len() == 1 {
            return Ok(digit.to_string());
        }
    }

    if let Some(function) = code.strip_prefix('F') {
        return Ok(format!("F{function}"));
    }

    match code {
        "ArrowUp" => Ok("ArrowUp".into()),
        "ArrowDown" => Ok("ArrowDown".into()),
        "ArrowLeft" => Ok("ArrowLeft".into()),
        "ArrowRight" => Ok("ArrowRight".into()),
        "Backspace" => Ok("Backspace".into()),
        "Delete" => Ok("Delete".into()),
        "Enter" => Ok("Enter".into()),
        "Escape" => Ok("Escape".into()),
        "Space" => Ok("Space".into()),
        "Tab" => Ok("Tab".into()),
        other => Err(format!("Unsupported key code: {other}")),
    }
}

fn toggle_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            show_main_window(app);
        }
    }
}

fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            notification::send_notification,
            register_toggle_shortcut
        ])
        .setup(|app| {
            let quit_i = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let toggle_i = MenuItem::with_id(app, "toggle", "切换", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&toggle_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "toggle" => {
                        toggle_main_window(app);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        ..
                    } => {
                        let app = tray.app_handle();
                        show_main_window(&app);
                    }
                    _ => {}
                })
                .build(app)?;

            let default_shortcut = ShortcutPayload::default();
            if let Err(error) = apply_shortcut(&app.handle(), &default_shortcut) {
                eprintln!("Failed to register default shortcut: {error}");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
