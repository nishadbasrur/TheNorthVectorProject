// North Vector desktop wrapper. Deliberately thin: this app has no native
// business logic of its own — the window just points at the existing
// deployed Next.js app (see tauri.conf.json's `build.devUrl` /
// `build.frontendDist`). Everything here is chrome: tray icon, "close
// button hides instead of quitting" (so the mic/voice session can keep
// running unfocused), and standard dock-app reopen behavior.

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, RunEvent, WindowEvent,
};

const MAIN_WINDOW_LABEL: &str = "main";

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let show_item = MenuItem::with_id(app, "show", "Show North Vector", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit North Vector", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => show_main_window(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        // Red close button hides the window instead of destroying it, so
        // the webview (and any live mic capture / open WebSocket) keeps
        // running in the background. Only the tray "Quit" item (or Cmd+Q,
        // which macOS/Tauri handles as a real quit by default) actually
        // exits the process. Needs live verification that macOS doesn't
        // throttle a hidden WKWebView's audio pipeline — see the plan's
        // verification checklist.
        .on_window_event(|window, event| {
            if window.label() == MAIN_WINDOW_LABEL {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building North Vector desktop app");

    app.run(|app_handle, event| {
        // Clicking the dock icon while the window is hidden (but the app
        // is still running, per the close-to-hide behavior above) should
        // reshow it — standard macOS dock-app behavior.
        if let RunEvent::Reopen { .. } = event {
            show_main_window(app_handle);
        }
    });
}
