import urllib.request
import urllib.error

url = "https://gabrielbechtlufft.app.n8n.cloud/webhook-test/teste"
print(f"Testing connection to {url}")

try:
    # Create request with User-Agent to avoid blocking
    req = urllib.request.Request(url, method='POST')
    req.add_header('User-Agent', 'Python-urllib/3.x')
    
    # Send empty body key for POST
    with urllib.request.urlopen(req, timeout=5) as response:
        print(f"Success! Status: {response.status}")
        print(f"Response: {response.read().decode('utf-8')}")

except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code} - {e.reason}")
except urllib.error.URLError as e:
    print(f"URL Error: {e.reason}")
except Exception as e:
    print(f"General Error: {e}")
