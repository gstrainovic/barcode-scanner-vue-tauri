import sys
import time
import subprocess
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class ReloadHandler(FileSystemEventHandler):
    def __init__(self, script):
        self.script = script
        self.process = None
        self.start_script()

    def start_script(self):
        if self.process:
            self.process.terminate()
        self.process = subprocess.Popen([sys.executable, self.script])

    def on_modified(self, event):
        if event.src_path.endswith(self.script):
            print(f'{self.script} wurde geändert, Neustart...')
            self.start_script()

if __name__ == "__main__":
    script_to_watch = 'index.py'
    event_handler = ReloadHandler(script_to_watch)
    observer = Observer()
    observer.schedule(event_handler, path='.', recursive=False)
    observer.start()
    print(f'Überwache {script_to_watch} für Änderungen...')

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
