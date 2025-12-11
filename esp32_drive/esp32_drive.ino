#include <WiFi.h>
#include <WebServer.h>

// --- CONFIGURAR SUA REDE WIFI ---
const char* ssid = "Sara";
const char* password = "SARASARA";

// --- PINOS DO L298N ---
#define IN1 26  // Motor Esquerdo Fwd
#define IN2 27  // Motor Esquerdo Rev
#define IN3 14  // Motor Direito Fwd
#define IN4 12  // Motor Direito Rev

WebServer server(80);

// --- NAVEGAÇÃO ---
// Velocidade e Tempo por Metro (Calibrar na prática)
// Ex: Se o carro anda 0.5m por segundo
const float SPEED_METERS_PER_SEC = 0.5; 
const float ROTATION_DEG_PER_SEC = 90.0; // 90 graus por segundo

// Estado
float current_x = 0.0;
float current_y = 0.0;
float current_theta = 0.0; // 0 = apontando para Y+ (Frente)

void parar() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
}

void frente() {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
}

void esquerda() {
  // Gira no próprio eixo (Motors opostos)
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
}

void direita() {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
}

// Movimenta por T milissegundos
void mover_tempo(void (*func)(), int ms) {
  func();
  delay(ms);
  parar();
}

// --- LÓGICA DE NAVEGAÇÃO ---
void navigate_to(float target_x, float target_y) {
  Serial.printf("NAV: Indo de (%.2f, %.2f) para (%.2f, %.2f)\n", current_x, current_y, target_x, target_y);

  float dx = target_x - current_x;
  float dy = target_y - current_y;
  float distance = sqrt(dx*dx + dy*dy);
  
  // 1. Calcular ângulo do alvo (atan2 retorna radianos, convertemos para graus)
  // Assumindo grid padrão onde Y+ é "frente" inicial
  float target_angle_rad = atan2(dx, dy); 
  float target_angle_deg = target_angle_rad * 180.0 / PI;

  // 2. Calcular quanto precisa girar
  float rotation_needed = target_angle_deg - current_theta;
  
  // Normalizar para -180 a 180
  while (rotation_needed > 180) rotation_needed -= 360;
  while (rotation_needed < -180) rotation_needed += 360;

  Serial.printf("NAV: Dist: %.2fm, Girar: %.2f deg\n", distance, rotation_needed);

  // 3. Executar Giro
  int rotate_ms = abs(rotation_needed) / ROTATION_DEG_PER_SEC * 1000;
  if (rotation_needed > 0) {
    mover_tempo(direita, rotate_ms);
  } else {
    mover_tempo(esquerda, rotate_ms);
  }
  delay(500); // Estabilizar

  // 4. Executar Movimento Linear
  int move_ms = distance / SPEED_METERS_PER_SEC * 1000;
  mover_tempo(frente, move_ms);

  // Atualizar estimativa de posição (Dead Reckoning Simples)
  current_x = target_x;
  current_y = target_y;
  current_theta = target_angle_deg;
  
  Serial.println("NAV: Chegou (estimado).");
}

// --- ROTAS HTTP ---
void handleRoot() {
  server.send(200, "text/plain", "ESP32 Autonomous Robot OK");
}

void handleGoto() {
  if (server.hasArg("x") && server.hasArg("y")) {
    float x = server.arg("x").toFloat();
    float y = server.arg("y").toFloat();
    server.send(200, "text/plain", "Command Received. Navigating...");
    
    // Executa navegação (Bloqueante neste MVP simples)
    navigate_to(x, y);
  } else {
    server.send(400, "text/plain", "Missing x or y params");
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  parar();

  // Conectar Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Conectando Wifi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  server.on("/", handleRoot);
  server.on("/goto", handleGoto);
  server.begin();
}

void loop() {
  server.handleClient();
}
