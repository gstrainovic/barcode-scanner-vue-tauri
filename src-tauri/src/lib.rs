use std::thread;
use std::time::Duration;
use multiinput::{RawInputManager, RawEvent, KeyId};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn start_looper() {
    thread::spawn(|| {
        let mut counter = 0;
        println!("Tastatureingabe-Thread gestartet!");

        // Initialisiere den RawInputManager
        let mut manager = match RawInputManager::new() {
            Ok(m) => m,
            Err(e) => {
                eprintln!("Fehler beim Initialisieren des RawInputManagers: {:?}", e);
                return;
            }
        };

        manager.register_devices(multiinput::DeviceType::Keyboards);

        loop {
            println!("Log-Nachricht aus dem separaten Thread: {}", counter);
            counter += 1;
            thread::sleep(Duration::from_millis(100)); // Reduziere die Wartezeit für schnellere Eingabeerkennung

            // Hole das nächste Event
            while let Some(event) = manager.get_event() {
                match event {
                    RawEvent::KeyboardEvent(_, key_id, state) => {
                        let key_event = format!("Taste: {:?}, Zustand: {:?}", key_id, state);
                        println!("{}", key_event);

                        // Beenden, wenn ESC gedrückt wird
                        if key_id == KeyId::Escape {
                            println!("ESC gedrückt, Thread wird beendet.");
                            return; // Beende den Thread
                        }
                    }
                    _ => {}
                }
            }
        }
    });
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, start_looper]) // start_logging hinzugefügt
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


// use multiinput::{RawInputManager, RawEvent, KeyId};
// use std::thread;
// use std::sync::Arc; // Import Arc for thread-safe reference counting
// use std::time::Duration; // Import Duration for thread sleeping
// use serde::Serialize; // Import Serialize derive macro
// use multiinput::DeviceType; // Import DeviceType for device registration

// // static mut ERROR_STATUS : Status = Status::Ok;
// // use crate::sync::sync;

// // use std::sync::atomic::{AtomicBool};
// // static LOOPER_RUNNING: AtomicBool = AtomicBool::new(false);

// #[derive(Serialize)]
// struct SerializableDevice {
//     name: String,
// }

// pub enum Status {
//     Warn,
//     Error,
//     Ok,
// }

// pub enum Type {
//     Ausnahme,
//     ZuKurz,
//     DhlLeitcode,
//     BereitsGesendet,
//     KeineNummern,
//     Ok,
// }

// pub struct Error {
//     pub message: String,
//     pub status: Status,
//     pub error_type: Type,
// }

// pub fn ausnahme(x : String) -> Error {
//     Error {
//         // message: "@C03Ausnahme".to_string(),
//         message: format!("@C03{}", x),
//         status: Status::Warn,
//         error_type: Type::Ausnahme,
//     }
// }

// pub fn zu_kurz() -> Error {
//     Error {
//         message: "@C88Zu kurz".to_string(),
//         status: Status::Error,
//         error_type: Type::ZuKurz,
//     }
// }

// pub fn leitcode(x : String) -> Error {
//     Error {
//         message: format!("@C88{} Leitcode", x),
//         status: Status::Error,
//         error_type: Type::DhlLeitcode,
//     }
// }

// pub fn bereits_gesendet() -> Error {
//     Error {
//         message: "@C88Doppelt".to_string(),
//         status: Status::Error,
//         error_type: Type::BereitsGesendet,
//     }
// }

// pub fn ok() -> Error {
//     Error {
//         message: "OK".to_string(),
//         status: Status::Ok,
//         error_type: Type::Ok,
//     }
// }

// pub fn no_numbers() -> Error {
//     Error {
//         message: "@C03Seltsamer Barcode".to_string(),
//         status: Status::Warn,
//         error_type: Type::KeineNummern,
//     }
// }

// #[tauri::command]
// fn get_devices() -> Arc<Vec<SerializableDevice>> {
//     let mut manager = RawInputManager::new().unwrap();
//     manager.register_devices(DeviceType::Keyboards);
//     let devices = manager.get_device_list();
//     let keyboardsl = Arc::new(
//         devices
//             .keyboards
//             .iter()
//             .map(|device| SerializableDevice {
//                 name: device.name.clone(),
//             })
//             .collect::<Vec<SerializableDevice>>(),
//     );
//     keyboardsl
// }


// #[tauri::command]
// fn start_looper() {
//     thread::spawn(|| {
//         let mut counter = 0;
//         println!("Tastatureingabe-Thread gestartet!");

//         // Initialisiere den RawInputManager
//         let mut manager = match RawInputManager::new() {
//             Ok(m) => m,
//             Err(e) => {
//                 eprintln!("Fehler beim Initialisieren des RawInputManagers: {:?}", e);
//                 return;
//             }
//         };

//         manager.register_devices(multiinput::DeviceType::Keyboards);

//         loop {
//             println!("Log-Nachricht aus dem separaten Thread: {}", counter);
//             counter += 1;
//             thread::sleep(Duration::from_millis(100)); // Reduziere die Wartezeit für schnellere Eingabeerkennung

//             // Hole das nächste Event
//             while let Some(event) = manager.get_event() {
//                 match event {
//                     RawEvent::KeyboardEvent(_, key_id, state) => {
//                         let key_event = format!("Taste: {:?}, Zustand: {:?}", key_id, state);
//                         println!("{}", key_event);

//                         // Beenden, wenn ESC gedrückt wird
//                         if key_id == KeyId::Escape {
//                             println!("ESC gedrückt, Thread wird beendet.");
//                             return; // Beende den Thread
//                         }
//                     }
//                     _ => {}
//                 }
//             }
//         }
//     });
// }

// #[cfg_attr(mobile, tauri::mobile_entry_point)]
// pub fn run() {
//     tauri::Builder::default()
//         .plugin(tauri_plugin_opener::init())
//         .invoke_handler(tauri::generate_handler![get_devices, start_looper])
//         .run(tauri::generate_context!())
//         .expect("error while running tauri application");
// }



// // pub fn looper(app_handle: tauri::AppHandle) {
// //     let mut manager = RawInputManager::new().unwrap();
// //     manager.register_devices(DeviceType::Keyboards);
// //     println!("Registered devices: {:?}", manager.get_device_list());

// //     loop {
// //         if let Some(event) = manager.get_event() {
// //             println!("Event: {:?}", event);

// //             // Sende das Event an das Frontend
// //             if let Err(e) = app_handle.emit("keyboard-event", format!("{:?}", event)) {
// //                 println!("Failed to emit event: {:?}", e);
// //             }
// //         } else {
// //             std::thread::sleep(std::time::Duration::from_millis(10));
// //         }
// //     }
// // }


// //     let my_windows_hwnd = unsafe {
// //         winapi::um::winuser::FindWindowA(
// //             std::ptr::null(),
// //             "BarcodeScanner\0".as_ptr() as *const i8,
// //         )
// //     };
// //     println!("My windows hwnd: {:?}", my_windows_hwnd);
// //     if my_windows_hwnd.is_null() {
// //         println!("Window not found");
// //         return;
// //     }


// //     loop {
// //         if let Some(event) = manager.get_event() {
// //             println!("Event from filtered device: {:?}", event);
// //                 // Verarbeite das Ereignis
// //         } else {
// //             println!("No event from filtered device");
// //         }
// //     }

// //     loop {
// //         if let Some(event) = manager.get_event() {
// //             println!("Event: {:?}", event);
// //             // add charachter from event to barcode_string

// //             let current_active_window_hwnd = unsafe { winapi::um::winuser::GetForegroundWindow() };
// //             if current_active_window_hwnd != my_windows_hwnd {
// //                 switch_back_hwd = current_active_window_hwnd;
// //             }

// //             unsafe {
// //                 winapi::um::winuser::ShowWindow(my_windows_hwnd, winapi::um::winuser::SW_MAXIMIZE);
// //                 winapi::um::winuser::SetForegroundWindow(my_windows_hwnd);
// //                 winapi::um::winuser::SetActiveWindow(my_windows_hwnd);
// //                 winapi::um::winuser::SetFocus(my_windows_hwnd);
// //             }

// //             match event {
// //                 RawEvent::KeyboardEvent(_, KeyId::Return, State::Released) => {
// //                     unsafe {
// //                     // activate the window current_active_window_hwnd again
// //                         match ERROR_STATUS {
// //                             Status::Ok => {
// //                                 if rolle == "Produktion" {
// //                                     winapi::um::winuser::ShowWindow(
// //                                         my_windows_hwnd,
// //                                         winapi::um::winuser::SW_MINIMIZE,
// //                                     );
// //                                     winapi::um::winuser::SetForegroundWindow(switch_back_hwd);
// //                                     winapi::um::winuser::SetActiveWindow(switch_back_hwd);
// //                                     winapi::um::winuser::SetFocus(switch_back_hwd);
// //                                 }
// //                             }
// //                             _ => {}
// //                         }
// //                     }
// //                 }

// //                 _ => {
// //                 }
// //             }
// //         } else {
// //             std::thread::sleep(std::time::Duration::from_millis(10));
// //             let has_focus_my_windows_hwnd = unsafe {
// //                 winapi::um::winuser::GetForegroundWindow() == my_windows_hwnd
// //             };
// //             let is_a_mxg_box_open = unsafe {
// //                 winapi::um::winuser::GetForegroundWindow()
// //                     == winapi::um::winuser::GetLastActivePopup(my_windows_hwnd)
// //             };
// //             // minimize the window if it has no focus, expect if there is an msgbox
// //             if !has_focus_my_windows_hwnd && !is_a_mxg_box_open {
// //                 unsafe {
// //                     winapi::um::winuser::ShowWindow(
// //                         my_windows_hwnd,
// //                         winapi::um::winuser::SW_MINIMIZE,
// //                     );
// //                 }
// //             }


// //         }
// //     }
// // }
