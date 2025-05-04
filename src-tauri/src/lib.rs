use multiinput::{KeyId, RawEvent, RawInputManager, State};
use native_dialog::{DialogBuilder, MessageLevel};
use once_cell::sync::Lazy;
use sqlite::get_history;
use std::sync::Arc;
use std::sync::Mutex;
use std::thread;
use tauri::AppHandle;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

static mut ERROR_STATUS: Status = Status::Ok;

static USER_ROLE: Lazy<Mutex<String>> = Lazy::new(|| Mutex::new(String::new()));

// use config::VERSION;

use winapi::shared::windef::HWND__;

pub fn get_hwnd_barcode_scanner() -> *mut HWND__ {
    let my_windows_hwnd = unsafe {
        winapi::um::winuser::FindWindowA(std::ptr::null(), "BarcodeScanner\0".as_ptr() as *const i8)
    };
    return my_windows_hwnd;
}

fn check_single_instance() {
    let hwnd_of_barcode_scanner = get_hwnd_barcode_scanner();
    if hwnd_of_barcode_scanner != std::ptr::null_mut() {
        let message = "Die Anwendung ist bereits geöffnet.";
        println!("{}", message);

        let _ = DialogBuilder::message()
            .set_title(config::DIALOG_TITLE)
            .set_text(message)
            .alert()
            .show();

        std::process::exit(0);
    } else {
        println!("No other instance found.");
    }
}

#[tauri::command]
fn get_version() -> String {
    config::VERSION.to_string()
}

#[tauri::command]
fn get_strapi_url() -> String {
    config::STRAPI_URL.to_string()
}

#[tauri::command]
fn update(app: AppHandle) {
    println!("Checking for updates...");
    if let Ok(update) = self_update::backends::github::Update::configure()
        .repo_owner("gstrainovic")
        .repo_name("barcode-scanner-vue-tauri")
        .bin_name("barcode-scanner-v2.exe")
        .show_download_progress(true)
        .no_confirm(true)
        .current_version(get_version().as_str())
        .build()
    {
        if let Ok(status) = update.update() {
            if status.updated() {
                let message = format!(
                    "Aktualisiert zu {}. Bitte barcode_scanner.exe nochmals starten",
                    status.version()
                );

                app.dialog()
                    .message(message.as_str())
                    .kind(tauri_plugin_dialog::MessageDialogKind::Info)
                    .title(config::DIALOG_TITLE)
                    .blocking_show();

                std::process::exit(0);
            } else {
                let message = "Keine neuen Updates verfügbar.";
                println!("{}", message);
            }
        } else {
            let message = "Fehler beim Aktualisieren der Anwendung.";
            println!("{}", message);
        }
    }
}

#[tauri::command]
fn set_user_role(role: String) {
    let mut user_role = USER_ROLE.lock().unwrap();
    *user_role = role.clone();
    println!("User role set to: {}", role);
}

#[tauri::command]
fn start_looper(app: AppHandle, window: tauri::Window) {
    let app_clone = app.clone();
    thread::spawn(move || {
        let mut manager = RawInputManager::new().unwrap();
        manager.register_devices(multiinput::DeviceType::Keyboards);
        let devices = manager.get_device_list();
        let keyboards = Arc::new(devices.keyboards);
        let keyboard = keyboards
            .iter()
            .find(|device| device.name.contains("VID_0483") && device.name.contains("PID_5750"))
            .unwrap_or_else(|| {
                let message =
                    "Bitte stecken Sie den Scanner ein und starten Sie die Anwendung neu.";
                eprintln!("{}", message);

                app_clone
                    .dialog()
                    .message(message)
                    .kind(tauri_plugin_dialog::MessageDialogKind::Error)
                    .title(config::DIALOG_TITLE)
                    .blocking_show();

                std::process::exit(1);
            });
        manager.filter_devices(vec![keyboard.name.clone()]);

        loop {
            let switch_back_hwd = unsafe { winapi::um::winuser::GetForegroundWindow() };

            
            if let Some(event) = manager.get_event() {
                



                window.show().unwrap();
                window.maximize().unwrap();
                window.set_always_on_top(true).unwrap();
                window.set_focus().unwrap();
                window.request_user_attention(tauri::UserAttentionType::Critical).unwrap();
               
                
                let my_windows_hwnd = match window.hwnd() {
                    Ok(hwnd) => hwnd,
                    Err(e) => {
                        eprintln!("Failed to get window HWND: {:?}", e);
                        continue;
                    }
                };

                // Convert HWND (windows crate) to *mut HWND__ (winapi crate)
                let my_windows_hwnd_ptr = my_windows_hwnd.0 as *mut HWND__;

                unsafe {
                    winapi::um::winuser::ShowWindow(my_windows_hwnd_ptr, winapi::um::winuser::SW_MAXIMIZE);
                    winapi::um::winuser::SetForegroundWindow(my_windows_hwnd_ptr);
                    winapi::um::winuser::SetActiveWindow(my_windows_hwnd_ptr);
                    winapi::um::winuser::SetFocus(my_windows_hwnd_ptr);
                    // let _ = inp.take_focus();
                }


                let webview = app_clone.get_webview_window("main").unwrap();
                if let Err(e) = webview.eval("document.getElementById(\"barcodei\").focus()") {
                    eprintln!("Failed to evaluate JavaScript: {:?}", e);
                }

                match event {
                    RawEvent::KeyboardEvent(_, KeyId::Return, State::Released) => {
                        unsafe {
                            // activate the window current_active_window_hwnd again
                            match ERROR_STATUS {
                                Status::Ok => {
                                    // window.set_always_on_top(false).unwrap();

                                    // let user_role = USER_ROLE.lock().unwrap();
                                    // let rolle = user_role.clone();

                                    // if rolle == "Produktion" {
                                    //     window.minimize().unwrap();
                                    //     winapi::um::winuser::SetForegroundWindow(switch_back_hwd);
                                    //     winapi::um::winuser::SetActiveWindow(switch_back_hwd);
                                    //     winapi::um::winuser::SetFocus(switch_back_hwd);
                                    // }
                                }
                                _ => {}
                            }
                        }
                    }

                    _ => {}
                }
            } else {
                std::thread::sleep(std::time::Duration::from_millis(10));
                window.set_always_on_top(false).unwrap();
                // let has_focus_my_windows_hwnd = unsafe {
                //     winapi::um::winuser::GetForegroundWindow() == my_windows_hwnd
                // };
                // let is_a_mxg_box_open = unsafe {
                //     winapi::um::winuser::GetForegroundWindow()
                //         == winapi::um::winuser::GetLastActivePopup(my_windows_hwnd)
                // };
                // // minimize the window if it has no focus, expect if there is an msgbox
                // if !has_focus_my_windows_hwnd && !is_a_mxg_box_open {
                //     unsafe {
                //         winapi::um::winuser::ShowWindow(
                //             my_windows_hwnd,
                //             winapi::um::winuser::SW_MINIMIZE,
                //         );
                //     }
                // }
            }
        }
    });
}

#[tauri::command]
fn process_barcode(barcode: &str, uid: i32, jwt: String, luids: Vec<i32>, rolle: &str) {
    // create_history(status.as_str(), barcode.as_str(), &uid, offline, &luids);
    sqlite::process_barcode::process_barcode(barcode, uid, jwt, &luids, rolle);
}

#[tauri::command]
fn load_history() -> Result<serde_json::Value, String> {
    get_history()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    check_single_instance();
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            start_looper,
            load_history,
            process_barcode,
            set_user_role,
            update,
            get_strapi_url,
            get_version
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let window = window.clone();
                let ans = window
                    .dialog()
                    .message("Bestätigung: Möchten Sie die Anwendung wirklich schließen?")
                    .title(config::DIALOG_TITLE)
                    .buttons(tauri_plugin_dialog::MessageDialogButtons::YesNo)
                    .blocking_show();
                match ans {
                    true => {
                        std::process::exit(0);
                    }
                    false => {}
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

pub enum Status {
    Warn,
    Error,
    Ok,
}

pub enum Type {
    Ausnahme,
    ZuKurz,
    DhlLeitcode,
    BereitsGesendet,
    KeineNummern,
    Ok,
}

pub struct Error {
    pub message: String,
    pub status: Status,
    pub error_type: Type,
}

pub fn ausnahme(x: String) -> Error {
    Error {
        // message: "@C03Ausnahme".to_string(),
        message: format!("@C03{}", x),
        status: Status::Warn,
        error_type: Type::Ausnahme,
    }
}

pub fn zu_kurz() -> Error {
    Error {
        message: "@C88Zu kurz".to_string(),
        status: Status::Error,
        error_type: Type::ZuKurz,
    }
}

pub fn leitcode(x: String) -> Error {
    Error {
        message: format!("@C88{} Leitcode", x),
        status: Status::Error,
        error_type: Type::DhlLeitcode,
    }
}

pub fn bereits_gesendet() -> Error {
    Error {
        message: "@C88Doppelt".to_string(),
        status: Status::Error,
        error_type: Type::BereitsGesendet,
    }
}

pub fn ok() -> Error {
    Error {
        message: "OK".to_string(),
        status: Status::Ok,
        error_type: Type::Ok,
    }
}

pub fn no_numbers() -> Error {
    Error {
        message: "@C03Seltsamer Barcode".to_string(),
        status: Status::Warn,
        error_type: Type::KeineNummern,
    }
}
