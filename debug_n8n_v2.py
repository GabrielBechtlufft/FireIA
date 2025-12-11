import urllib.request
import urllib.error
import json
import time

# URL fornecida pelo usuario
URL = "https://gabrielbechtlufft.app.n8n.cloud/webhook/teste"

def test_request(method, data=None):
    print(f"\n--- Testando {method} ---")
    try:
        headers = {'User-Agent': 'Python-urllib/3.x'}
        encoded_data = None
        
        if data:
            headers['Content-Type'] = 'application/json'
            encoded_data = json.dumps(data).encode('utf-8')
        
        req = urllib.request.Request(URL, method=method, headers=headers, data=encoded_data)
        
        with urllib.request.urlopen(req, timeout=5) as response:
            print(f"SUCESSO! Status: {response.status}")
            print(f"Resposta: {response.read().decode('utf-8')}")
            return True
    except urllib.error.HTTPError as e:
        print(f"FALHA: Erro HTTP {e.code} - {e.reason}")
        print(f"Conteudo erro: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"FALHA: Erro {e}")
    return False

# 1. Teste POST com JSON (como está no código principal)
print(f"Alvo: {URL}")
test_request('POST', {"test": "data", "timestamp": time.time()})

# 2. Teste GET (caso o webhook esteja configurado como GET)
test_request('GET')

# 3. Teste POST sem JSON (form-data vazio/default)
print("\n--- Testando POST vazio ---")
try:
    req = urllib.request.Request(URL, method='POST', headers={'User-Agent': 'Python-urllib/3.x'})
    with urllib.request.urlopen(req, timeout=5) as response:
        print(f"SUCESSO! Status: {response.status}")
except Exception as e:
    print(f"FALHA: {e}")
