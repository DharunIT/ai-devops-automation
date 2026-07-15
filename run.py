import os
import sys
import time
import webbrowser
from threading import Thread

# Inject parent directory into path to ensure backend package is resolvable
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def start_browser():
    # Allow Flask to bind to port 5000 first
    time.sleep(2.0)
    print("=== LAUNCHING DASHBOARD IN BROWSER ===")
    webbrowser.open("http://localhost:5000/")

if __name__ == '__main__':
    print("=== INITIALIZING AUTONOMIC DEVOPS PLATFORM (AUTOOPS) ===")
    
    # Import the app module
    try:
        from backend.app import app
        from backend.simulation import simulator
    except ImportError as e:
        print(f"ImportError encountered while loading modules: {e}")
        print("Please ensure dependencies are installed via: pip install -r backend/requirements.txt")
        sys.exit(1)
        
    # Start the simulator thread
    simulator.set_app(app)
    simulator.start()

        
    # Start browser asynchronously
    browser_thread = Thread(target=start_browser, daemon=True)
    browser_thread.start()
    
    # Start Flask server
    print("Starting Flask web server on http://localhost:5000...")
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
