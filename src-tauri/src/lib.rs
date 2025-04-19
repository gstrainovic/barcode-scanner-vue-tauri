use std::thread;
use std::sync::Arc;
use multiinput::{RawInputManager, RawEvent, KeyId, State};
use tauri::Manager;
use tauri::AppHandle;

static mut ERROR_STATUS : Status = Status::Ok;

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
            eprintln!("Keyboard not found!");
            std::process::exit(1);
        });
        manager.filter_devices(vec![keyboard.name.clone()]);
        
        // let mut switch_back_hwd = unsafe { winapi::um::winuser::GetForegroundWindow() };
        let my_windows_hwnd = unsafe {
            winapi::um::winuser::FindWindowA(
                std::ptr::null(),
                "BarcodeScanner\0".as_ptr() as *const i8,
            )
        };

 loop {
        // handle events
        if let Some(event) = manager.get_event() {
            // println!("Event: {:?}", event);
            // add charachter from event to barcode_string

            // let current_active_window_hwnd = unsafe { winapi::um::winuser::GetForegroundWindow() };
            // if current_active_window_hwnd != my_windows_hwnd {
            //     switch_back_hwd = current_active_window_hwnd;
            // }

            unsafe {
                // old code with winapi
                // winapi::um::winuser::ShowWindow(my_windows_hwnd, winapi::um::winuser::SW_MAXIMIZE);
                // winapi::um::winuser::SetForegroundWindow(my_windows_hwnd);
                // winapi::um::winuser::SetActiveWindow(my_windows_hwnd);
                // winapi::um::winuser::SetFocus(my_windows_hwnd);

                // new code with tauri window
                window.show().unwrap();
                window.maximize().unwrap();
                window.set_focus().unwrap();
                window.set_always_on_top(true).unwrap();

                let webview = app_clone.get_webview_window("main").unwrap();
                if let Err(e) = webview.eval("document.getElementById(\"barcodei\").focus()") {
                    eprintln!("Failed to evaluate JavaScript: {:?}", e);
                }


            }

            match event {
                RawEvent::KeyboardEvent(_, KeyId::Return, State::Released) => {
                    unsafe {
                    // activate the window current_active_window_hwnd again
                        match ERROR_STATUS {
                            Status::Ok => {
                                // if rolle == "Produktion" {
                                    // winapi::um::winuser::ShowWindow(
                                    //     my_windows_hwnd,
                                    //     winapi::um::winuser::SW_MINIMIZE,
                                    // );
                                    // winapi::um::winuser::SetForegroundWindow(switch_back_hwd);
                                    // winapi::um::winuser::SetActiveWindow(switch_back_hwd);
                                    // winapi::um::winuser::SetFocus(switch_back_hwd);
                                // }
                            }
                            _ => {}
                        }
                    }
                }

                _ => {
                }
            }
        } else {
            std::thread::sleep(std::time::Duration::from_millis(10));
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




#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![start_looper])
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

pub fn ausnahme(x : String) -> Error {
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

pub fn leitcode(x : String) -> Error {
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


