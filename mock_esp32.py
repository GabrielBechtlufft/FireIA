from http.server import BaseHTTPRequestHandler, HTTPServer

class MockESP32(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/andar':
            print(">>> [MOCK ESP32] RECEBIDO COMANDO: ANDAR")
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b"Carrinho andando!")
        else:
            self.send_response(404)
            self.end_headers()

def run(server_class=HTTPServer, handler_class=MockESP32, port=5000):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f"Mock ESP32 Server rodando na porta {port}...")
    print(f"Para testar, altere ESP32_IP em main.py para '127.0.0.1:{port}'")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    print("Server parado.")

if __name__ == '__main__':
    run()
