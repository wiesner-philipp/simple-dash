"""
Screenshot wrapper for simple-dash dashboard.
Takes screenshots at desktop (landscape) and mobile (portrait) viewports,
then saves them as screenshot-desktop.png and screenshot-mobile.png.
"""

import os
import time
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.edge.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from webdriver_manager.microsoft import EdgeChromiumDriverManager


def start_server(directory):
    """Start a local HTTP server to serve the static files."""
    os.chdir(directory)
    handler = SimpleHTTPRequestHandler
    httpd = HTTPServer(('127.0.0.1', 8080), handler)
    print("Serving on http://127.0.0.1:8080")
    return httpd


def take_screenshots():
    """Take screenshots at desktop and mobile viewports."""
    
    # Setup Edge browser with webdriver-manager
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1920,1080')
    
    service = Service(EdgeChromiumDriverManager().install())
    driver = webdriver.Edge(service=service, options=options)
    
    try:
        # Navigate to the page
        print("Loading page...")
        driver.get('http://127.0.0.1:8080')
        
        # Wait for content to load - look for dashboard items or title
        wait = WebDriverWait(driver, 10)
        try:
            # Try waiting for a specific element that indicates the page loaded
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '.item')))
        except Exception:
            print("Warning: Could not find .item elements, continuing anyway")
        
        time.sleep(2)  # Extra time for animations and rendering
        
        # Desktop screenshot (landscape) - use exact viewport via CDP
        print("Taking desktop screenshot...")
        driver.execute_cdp_cmd('Emulation.setDeviceMetricsOverride', {
            'width': 1920,
            'height': 1080,
            'deviceScaleFactor': 1,
            'mobile': False
        })
        time.sleep(1)
        driver.save_screenshot('screenshot-desktop.png')
        print("Saved screenshot-desktop.png")
        
        # Mobile screenshot (portrait) - use exact viewport via CDP
        print("Taking mobile screenshot...")
        driver.execute_cdp_cmd('Emulation.setDeviceMetricsOverride', {
            'width': 375,
            'height': 667,
            'deviceScaleFactor': 1,
            'mobile': True
        })
        time.sleep(1)
        driver.save_screenshot('screenshot-mobile.png')
        print("Saved screenshot-mobile.png")
        
    finally:
        driver.quit()


if __name__ == '__main__':
    project_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Start local server in background thread
    httpd = start_server(project_dir)
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()
    
    time.sleep(1)  # Give server time to start
    
    try:
        take_screenshots()
    finally:
        httpd.shutdown()
