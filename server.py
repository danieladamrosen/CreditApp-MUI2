#!/usr/bin/env python3
"""
Python wrapper server for Node.js deployment on Replit.
This serves as a bridge to run the Node.js application.
"""

import subprocess
import sys
import os
import signal
import time

def run_nodejs_server():
    """Run the Node.js server using npm start"""
    process = None
    try:
        # Change to the project directory
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        
        print("Installing Node.js dependencies...")
        subprocess.run(["npm", "install"], check=True)
        
        print("Building the application...")
        subprocess.run(["npm", "run", "build"], check=True)
        
        print("Starting Node.js server...")
        # Set production environment
        os.environ['NODE_ENV'] = 'production'
        
        # Start the Node.js server
        process = subprocess.Popen(["npm", "start"], 
                                 stdout=subprocess.PIPE, 
                                 stderr=subprocess.STDOUT,
                                 universal_newlines=True,
                                 bufsize=1)
        
        # Forward output from Node.js server
        try:
            if process.stdout:
                while True:
                    output = process.stdout.readline()
                    if output == '' and process.poll() is not None:
                        break
                    if output:
                        print(output.strip())
                        sys.stdout.flush()
        except BrokenPipeError:
            # Handle case where process terminates
            pass
        
        # Wait for process to complete
        if process:
            process.wait()
            
    except subprocess.CalledProcessError as e:
        print(f"Error running Node.js server: {e}")
        if process:
            process.terminate()
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nShutting down server...")
        if process:
            process.terminate()
        sys.exit(0)

if __name__ == "__main__":
    run_nodejs_server()