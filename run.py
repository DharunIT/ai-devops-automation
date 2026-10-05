import os
import sys
import time
import webbrowser
from threading import Thread

# Inject parent directory into path to ensure backend package is resolvable
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def start_browser(port):
    time.sleep(2.0)
    print(f"=== LAUNCHING AUTOOPS AI DASHBOARD IN BROWSER (PORT {port}) ===")
    try:
        webbrowser.open(f"http://localhost:{port}/")
    except Exception as e:
        print(f"Browser launch skipped: {e}")

import socket

def find_available_port(default_port=5000):
    if 'PORT' in os.environ:
        return int(os.environ['PORT'])
    port = default_port
    while port < default_port + 100:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
        port += 1
    return default_port

if __name__ == '__main__':
    port = find_available_port(5000)
    print(f"=== INITIALIZING AUTOOPS AI PLATFORM (PORT {port}) ===")
    
    # Import the app module
    try:
        from backend.app import app
        from backend.simulation import simulator
    except ImportError as e:
        print(f"ImportError encountered while loading modules: {e}")
        print("Please ensure dependencies are installed via: pip install -r requirements.txt")
        sys.exit(1)
        
    # Start the simulator thread if not already running
    if not simulator.running:
        simulator.set_app(app)
        simulator.start()
        
    # Start browser asynchronously only in interactive desktop environments
    if os.environ.get('AUTO_OPEN_BROWSER', 'true').lower() in ('true', '1', 'yes'):
        browser_thread = Thread(target=start_browser, args=(port,), daemon=True)
        browser_thread.start()
    
    # Start Flask server
    print(f"Starting AutoOps AI web server on http://0.0.0.0:{port}...")
    app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False)

