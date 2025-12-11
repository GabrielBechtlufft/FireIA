import cv2
import threading
import time
import copy
from ultralytics import YOLO
import numpy as np
from incidents_manager import incident_manager

# === Configurações ===
MODEL_PATH = "best.pt"
CONF_FIRE = 0.4
CONF_SMOKE = 0.35

# Configuração da Câmera
# 0 = Câmera Nativa/Integrada
# 1 = Webcam USB Externa
# URL rtsp://... = Câmera IP
CAMERA_SOURCE = 0 

FIRE_KEYWORDS = ["fire", "fogo", "flame", "chama"]
SMOKE_KEYWORDS = ["smoke", "fumaca", "fog", "smoke_cloud", "neblina"]

class VideoCamera:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(VideoCamera, cls).__new__(cls)
                    cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        print(f"Inicializando Câmera Assíncrona (Fonte: {CAMERA_SOURCE})...")
        
        # Estado Compartilhado
        self.current_frame = None
        self.latest_boxes = [] # [(x1,y1,x2,y2, tag, color, conf), ...]
        
        # Controle
        self.started = False
        self.frame_lock = threading.Lock()
        self.box_lock = threading.Lock()
        self.last_trigger_time = 0 # Inicializa cooldown
        
        # Inicializa Câmera com Failover
        # Tentativa 1: DirectShow (Melhor para Windows)
        print(" [CAM] Tentando abrir com DirectShow (CAP_DSHOW)...")
        self.cap = cv2.VideoCapture(CAMERA_SOURCE, cv2.CAP_DSHOW)
        
        # Tentativa 2: Default (Auto) se a 1 falhar
        if not self.cap.isOpened():
            print(" [CAM] DirectShow falhou. Tentando backend Padrão...")
            self.cap = cv2.VideoCapture(CAMERA_SOURCE)
            
        if not self.cap.isOpened():
             print(" [CAM] FATAL: Câmera não detectada/aberta.")
             # Não levanta erro para não crashar o server, deixa rodar em modo 'NO SIGNAL'
             # O loop de captura cuidará do fallback
        else:
             print(" [CAM] Câmera iniciada com sucesso.")
        
        # Seta resolução padrão (640x480) - Mais compatível
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        
        # OTIMIZAÇÃO DE LATÊNCIA: Buffer Size = 1
        # Isso força o OpenCV a sempre pegar o frame mais recente e descartar antigos
        try:
             self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        except: pass
            
        # Carrega modelo (pode demorar)
        print(" [CAM] Carregando modelo YOLO...")
        try:
            self.model = YOLO(MODEL_PATH)
            self.names = self.model.names
            print(" [CAM] Modelo carregado.")
        except Exception as e:
            print(f" [CAM] Erro ao carregar YOLO: {e}")
            self.model = None
            self.names = {}

        # Carrega Homografia
        try:
            self.homography_matrix = np.load("homography_matrix.npy")
            print(" [CAM] Homografia carregada.")
        except:
            print(" [CAM] AVISO: 'homography_matrix.npy' não encontrado.")
            self.homography_matrix = None

        # Inicia Threads
        self.start()
# ...
    def trigger_actions(self, tipo_alerta, x=0.0, y=0.0):
        current_time = time.time()
        # Cooldown global (n8n/robot): 5 seconds
        if current_time - self.last_trigger_time < 5.0: return
        self.last_trigger_time = current_time
        
        # 0. Create Incident
        print(f"[SYSTEM] Criando incidente automático: {tipo_alerta}")
        incident_manager.create_incident(
            type=f"Detecção de {tipo_alerta.capitalize()}",
            tag=tipo_alerta.upper(),
            priority="Crítica" if tipo_alerta == "fogo" else "Alta",
            address=f"Coord: {x:.2f}, {y:.2f} (Camera 01)",
            description=f"Detecção automática via IA. Confiança > 40%.",
            status="Novo"
        )
        
        # 1. Trigger n8n Webhook (Replaces Native WhatsApp)
        self.trigger_n8n(tipo_alerta, x, y)
        
        # 2. Trigger ESP32 Robot
        self.trigger_robot(x, y)

    def trigger_n8n(self, tipo_alerta, x, y):
        webhook_url = "https://gabrielbechtlufft.app.n8n.cloud/webhook-test/ligar"
        def _send():
            try:
                import urllib.request
                import urllib.parse
                
                params = {
                    "alerta": f"{tipo_alerta}_detectado",
                    "posX": f"{x:.2f}",
                    "posY": f"{y:.2f}",
                    "timestamp": str(time.time())
                }
                query_string = urllib.parse.urlencode(params)
                
                full_url = f"{webhook_url}"
                if '?' in full_url: full_url += f"&{query_string}"
                else: full_url += f"?{query_string}"
                    
                print(f"[n8n] Enviando: {full_url}")
                req = urllib.request.Request(
                    full_url, 
                    method='GET',
                    headers={"User-Agent": "Python-urllib/3.x"}
                )
                with urllib.request.urlopen(req, timeout=2) as response:
                    print(f"[n8n] Status: {response.status}")
            except Exception as e:
                print(f"[n8n] Erro: {e}")
                
        threading.Thread(target=_send).start()

    def start(self):
        if self.started:
            return
        self.started = True
        
        # Thread 1: Captura de Vídeo (Alta Velocidade)
        self.t_cap = threading.Thread(target=self._capture_loop)
        self.t_cap.daemon = True
        self.t_cap.start()
        
        # Thread 2: Inferência IA (Velocidade Variável)
        self.t_inf = threading.Thread(target=self._inference_loop)
        self.t_inf.daemon = True
        self.t_inf.start()

    def get_label(self, cls_idx):
        if isinstance(self.names, dict):
            return str(self.names.get(cls_idx, cls_idx))
        return str(self.names[cls_idx])

    def is_fire(self, label):
        return any(word in label.lower() for word in FIRE_KEYWORDS)

    def is_smoke(self, label):
        return any(word in label.lower() for word in SMOKE_KEYWORDS)

    def _capture_loop(self):
        """Lê frames da câmera o mais rápido possível."""
        frame_count = 0
        while self.started:
            success, frame = self.cap.read()
            if success:
                # Debug logging to verify stream
                frame_count += 1
                if frame_count % 100 == 0:
                    print(f" [CAM] Frame capturado: {frame_count} ({frame.shape})")

                # Resize leve para garantir consistência se a câmera teimar em vir alta
                h, w = frame.shape[:2]
                if h > 480: 
                    frame = cv2.resize(frame, (640, 480))
                
                with self.frame_lock:
                    self.current_frame = frame
            else:
                print(" [CAM] Falha ao ler frame (success=False).")
                # Capture failed - Create placeholder
                h, w = 480, 640
                blank_frame = np.zeros((h, w, 3), np.uint8)
                cv2.putText(blank_frame, "NO SIGNAL", (w//2 - 60, h//2), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                with self.frame_lock:
                    self.current_frame = blank_frame
                time.sleep(0.5) # Wait before retry
            time.sleep(0.005) # Yield

    def process_frame(self, frame):
        """Processa um frame arbitrário e retorna as detecções."""
        if self.model is None: return []

        # Resize para inferência (320x240)
        inf_frame = cv2.resize(frame, (320, 240))
        
        try:
            results_list = self.model(inf_frame, verbose=False)
            if not results_list: return []
            results = results_list[0]
        except Exception as e:
            print(f"Error in inference: {e}")
            return []
        
        # Escala de volta
        scale_x = frame.shape[1] / 320
        scale_y = frame.shape[0] / 240
        
        detections = []
        for box in results.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = float(box.conf[0])
            cls = int(box.cls[0])
            label = self.get_label(cls).lower()
            
            # DEBUG
            if conf > 0.1:
                # print(f" [AI-DEBUG] Detected: {label.upper()} ({conf:.2f})")
                pass

            fire_detect = self.is_fire(label) and conf >= CONF_FIRE
            smoke_detect = self.is_smoke(label) and conf >= CONF_SMOKE

            if fire_detect or smoke_detect:
                tag = "FOGO" if fire_detect else "FUMACA"
                color = (0, 0, 255) if fire_detect else (0, 255, 255) # BGR para OpenCV
                
                # Ajusta coordenadas
                x1 = int(x1 * scale_x)
                x2 = int(x2 * scale_x)
                y1 = int(y1 * scale_y)
                y2 = int(y2 * scale_y)
                
                # Real World Coords
                real_x, real_y = 0.0, 0.0
                if self.homography_matrix is not None:
                    cx_feet = (x1 + x2) / 2
                    cy_feet = y2 
                    pt_vec = np.array([[[cx_feet, cy_feet]]], dtype='float32')
                    dst_vec = cv2.perspectiveTransform(pt_vec, self.homography_matrix)
                    real_x = float(dst_vec[0][0][0])
                    real_y = float(dst_vec[0][0][1])

                detections.append({
                    "box": [x1, y1, x2, y2],
                    "tag": tag,
                    "color": color, # (B, G, R)
                    "conf": conf,
                    "coords": (real_x, real_y),
                    "label": label
                })
        return detections

    def _inference_loop(self):
        """Roda YOLO no frame mais recente disponível."""
        while self.started:
            frame_to_process = None
            
            with self.frame_lock:
                if self.current_frame is not None:
                    frame_to_process = self.current_frame.copy()
            
            if frame_to_process is None:
                time.sleep(0.1)
                continue

            # Usa o método compartilhado
            detections = self.process_frame(frame_to_process)
            
            # Converte formato interno para o formato esperado pela UI server-side
            # (x1, y1, x2, y2, tag, color, conf, real_x, real_y)
            new_boxes = []
            for d in detections:
                x1, y1, x2, y2 = d['box']
                tag = d['tag']
                color = d['color']
                conf = d['conf']
                rx, ry = d['coords']
                # Trigger Actions (apenas na câmera do servidor, por enquanto, ou compartilhado?)
                # Se for compartilhado, chamaria aqui.
                # Mantendo lógica original de trigger:
                
                if tag == "FOGO": self.trigger_actions("fogo", rx, ry)
                elif tag == "FUMACA": self.trigger_actions("fumaca", rx, ry)
                
                new_boxes.append((x1, y1, x2, y2, tag, color, conf, rx, ry))
            
            with self.box_lock:
                self.latest_boxes = new_boxes
                
            time.sleep(0.01) 
            
    def trigger_actions(self, tipo_alerta, x=0.0, y=0.0):
        current_time = time.time()
        # Cooldown global (n8n/robot): 5 seconds
        if current_time - self.last_trigger_time < 5.0: return
        self.last_trigger_time = current_time
        
        # 0. Create Incident
        print(f"[SYSTEM] Criando incidente automático: {tipo_alerta}")
        incident_manager.create_incident(
            type=f"Detecção de {tipo_alerta.capitalize()}",
            tag=tipo_alerta.upper(),
            priority="Crítica" if tipo_alerta == "fogo" else "Alta",
            address=f"Coord: {x:.2f}, {y:.2f} (Camera 01)",
            description=f"Detecção automática via IA. Confiança > 40%.",
            status="Novo"
        )
        
        # 1. Automatic WhatsApp (Only for Fire, with longer cooldown)
        if tipo_alerta == "fogo":
             self.trigger_whatsapp(x, y)

        # 2. Trigger n8n
        self.trigger_n8n(tipo_alerta, x, y)
        
        # 3. Trigger ESP32 Robot
        self.trigger_robot(x, y)

    def trigger_whatsapp(self, x, y):
        # WhatsApp Cooldown: 60 seconds to avoid spamming usage
        if not hasattr(self, 'last_whatsapp_time'): self.last_whatsapp_time = 0
        if time.time() - self.last_whatsapp_time < 60.0: return
        self.last_whatsapp_time = time.time()

        try:
            import pywhatkit
            # Placeholder Number - User must update this!
            # Format: "+CountryCodeAreaCodeNumber"
            target_number = "+5512992171215" 
            message = f"🚨 *ALERTA DE INCENDIO* 🚨\n\nFogo detectado na Camera 01.\nPosição: X={x:.1f} Y={y:.1f}\n\nAcesse o painel imediatamente!"
            
            print(f"[WHATSAPP] Enviando alerta para {target_number}...")
            # wait_time=10 (seconds to load web), tab_close=True, close_time=3
            pywhatkit.sendwhatmsg_instantly(target_number, message, 10, True, 3)
            print("[WHATSAPP] Mensagem enviada (ou tentativa realizada).")
        except Exception as e:
            print(f"[WHATSAPP] Falha ao enviar: {e}")

    def trigger_n8n(self, tipo_alerta, x, y):
        webhook_url = "https://gabrielbechtlufft.app.n8n.cloud/webhook-test/ligar"
        def _send():
            try:
                import urllib.request
                import urllib.parse
                
                params = {
                    "alerta": f"{tipo_alerta}_detectado",
                    "posX": f"{x:.2f}",
                    "posY": f"{y:.2f}",
                    "timestamp": str(time.time())
                }
                query_string = urllib.parse.urlencode(params)
                
                full_url = f"{webhook_url}"
                if '?' in full_url: full_url += f"&{query_string}"
                else: full_url += f"?{query_string}"
                    
                print(f"[n8n] Enviando: {full_url}")
                req = urllib.request.Request(
                    full_url, 
                    method='GET',
                    headers={"User-Agent": "Python-urllib/3.x"}
                )
                with urllib.request.urlopen(req, timeout=2) as response:
                    print(f"[n8n] Status: {response.status}")
            except Exception as e:
                print(f"[n8n] Erro: {e}")
                
        threading.Thread(target=_send).start()

    def trigger_robot(self, x, y):
        # Envia comando para ESP32
        # ESP32_IP deve ser configurado
        esp32_ip = "192.168.43.221"
        url = f"http://{esp32_ip}/goto?x={x:.2f}&y={y:.2f}"
        print(f"[ROBOT] Navegando para X={x:.2f}m Y={y:.2f}m -> {url}")
        
        def _send_bot():
            try:
                import urllib.request
                with urllib.request.urlopen(url, timeout=1): pass
            except Exception as e:
                print(f"[ROBOT] Erro ao conectar: {e}")
        threading.Thread(target=_send_bot).start() 

    def get_frame(self):
        """Gera o JPEG final para streaming."""
        frame = None
        with self.frame_lock:
            if self.current_frame is not None:
                frame = self.current_frame.copy()
        
        if frame is None:
            return None

        # Desenha caixas (pegando a lista mais recente da IA)
        boxes = []
        with self.box_lock:
            boxes = list(self.latest_boxes)
        
        fogo_detectado = False
        fumaca_detectada = False
        h, w = frame.shape[:2]

        for (x1, y1, x2, y2, tag, color, conf, rx, ry) in boxes:
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            
            # Label
            label_text = f"{tag} {conf:.2f}"
            if rx != 0 or ry != 0:
                label_text += f" | X:{rx:.1f}m Y:{ry:.1f}m"
                
            cv2.putText(frame, label_text, (x1, max(20, y1 - 5)),
                        cv2.FONT_HERSHEY_PLAIN, 1.0, color, 1)
            
            if tag == "FOGO": fogo_detectado = True
            if tag == "FUMACA": fumaca_detectada = True

        # === Overlays CCTV ===
        # Alertas
        if fogo_detectado:
            cv2.putText(frame, "WARNING: FIRE DETECTED", (10, 30),
                        cv2.FONT_HERSHEY_PLAIN, 1.5, (0, 0, 255), 2)
        if fumaca_detectada:
            cv2.putText(frame, "WARNING: SMOKE DETECTED", (10, 60),
                        cv2.FONT_HERSHEY_PLAIN, 1.5, (0, 255, 255), 2)

        # Timestamp
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(frame, timestamp, (10, h - 10), 
                    cv2.FONT_HERSHEY_PLAIN, 1.0, (255, 255, 255), 1)
        
        # Identificador Câmera
        cv2.putText(frame, "CAM-01 [LIVE]", (w - 120, 20),
                    cv2.FONT_HERSHEY_PLAIN, 0.8, (0, 255, 0), 1)

        # Encode JPEG (qualidade média para fluidez)
        ret, jpeg = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 60])
        return jpeg.tobytes()
