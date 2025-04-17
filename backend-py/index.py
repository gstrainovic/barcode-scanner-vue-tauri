import os
import webview
import requests
from database import initialize_database
from sqlite import Sqlite
import winrawin
import ctypes
from config import STRAPI_URL

class Api(Sqlite):


def getToken() -> str:
    return window.evaluate_js('sessionStorage.getItem("token")')

def handle_event(e: winrawin.RawInputEvent):
    try:
        if e.device.vendor_id == 0x0483 and e.device.product_id == 0x5750 and e.event_type == 'down':
            if e.name == 'ctrl':
                try:
                    window.maximize()
                except Exception as ex:
                    print(f"An error occurred: {ex}")
            if e.name == 'enter':
                window.minimize()
    except Exception as ex:
        print(f"An error occurred: {ex}")

def activate_window(hwnd):
    ctypes.windll.user32.ShowWindow(hwnd, 3)
    ctypes.windll.user32.SetForegroundWindow(hwnd)
    ctypes.windll.user32.SetActiveWindow(hwnd)
    ctypes.windll.user32.SetFocus(hwnd)

def on_maximized():
    activate_window(get_app_window())
    barcodei = window.evaluate_js('document.getElementById("barcodei")')
    if barcodei:
        window.evaluate_js('document.getElementById("barcodei").focus()')

def on_minimized():
    sendButton = window.evaluate_js('document.getElementById("sendButton")')
    if sendButton:
        window.evaluate_js('document.getElementById("sendButton").click()')

def on_loaded():
    get_window_handle()

def get_entrypoint():
    try:
        url = 'http://localhost:5173' # pnpm dev
        get = requests.get(url)
        if get.status_code == 200:
            return url, True
    except:
        print('Vite server not running. Trying static files')

    possible_paths = [
        ('_internal/gui/index.html', False, 'gui/index.html'), # pnpm build
        ('../gui/index.html', True, '../gui/index.html'), # npm run start
    ]

    for path, bool, url in possible_paths:
        if os.path.exists(path):
            return url, bool
    raise Exception('No index.html found!')

localization_de = {
    'global.quitConfirmation': 'Barcode Scanner V2 wirklich beenden?',
}

def get_app_window():
    hwnd = ctypes.windll.user32.FindWindowW(None, "Barcodescanner V2")
    return hwnd

def get_current_window():
    hwnd = ctypes.windll.user32.GetForegroundWindow()
    return hwnd

def get_window_handle():
    dark = False
    while True:
        toggleDarkModeButton = window.evaluate_js('document.getElementById("toggleDarkModeButton")')
        if toggleDarkModeButton and not dark and debug_mode:
            window.evaluate_js('document.getElementById("toggleDarkModeButton").click()')
            dark = True
        hwnd = get_app_window()
        if hwnd:
            # winrawin.hook_raw_input_for_window(hwnd, handle_event)
            break

if __name__ == '__main__':
    hwnd = get_app_window()
    if hwnd:
        ctypes.windll.user32.MessageBoxW(0, "Barcodescanner V2 ist bereits geöffnet. Bringe es in den Vordergrund. Falls es abgestürzt ist dann bitte mit Taskmanager zuerst beenden.", "Barcodescanner V2", 0)
        activate_window()
        exit()
    initialize_database()
    entry, debug_mode = get_entrypoint()
    api = Api()
    window = webview.create_window('Barcodescanner V2', entry, js_api=api,maximized=True,confirm_close=True,text_select=True,zoomable=True, localization=localization_de, on_top=debug_mode)
    window.events.loaded += on_loaded
    window.events.maximized += on_maximized
    window.events.minimized += on_minimized
    webview.start(debug=debug_mode, private_mode=False)
