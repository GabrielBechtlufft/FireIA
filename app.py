from flask import Flask, render_template, Response, jsonify, request
from camera import VideoCamera
from incidents_manager import incident_manager
import os
import time
import datetime

# Configure Flask to serve the React build
# ...
app = Flask(__name__, 
            static_folder='frontend/dist/assets', 
            template_folder='frontend/dist',
            static_url_path='/assets')

# ... (Routes for static files)

# === API ENDPOINTS ===
@app.route('/api/incidents', methods=['GET'])
def get_incidents():
    return jsonify(incident_manager.get_all())

@app.route('/api/incidents', methods=['POST'])
def create_incident():
    data = request.json
    
    # Validation
    if not data or 'type' not in data:
        return jsonify({"error": "Type is required"}), 400
    if len(data.get('description', '')) > 500:
        return jsonify({"error": "Description too long"}), 400

    new_incident = incident_manager.create_incident(
        type=data.get('type', 'Manual'),
        tag=data.get('tag', 'OUTRO'),
        priority=data.get('priority', 'Média'),
        address=data.get('address', 'Manual'),
        description=data.get('description', ''),
        status=data.get('status', 'Novo')
    )
    return jsonify(new_incident), 201

@app.route('/api/incidents/<id>', methods=['PUT'])
def update_incident(id):
    data = request.json
    updated = incident_manager.update_incident(id, data)
    if updated: return jsonify(updated)
    return jsonify({"error": "Not found"}), 404

@app.route('/api/incidents/<id>', methods=['DELETE'])
def delete_incident(id):
    if incident_manager.delete_incident(id):
        return jsonify({"success": True})
    return jsonify({"error": "Not found"}), 404

@app.route('/api/incidents/<id>/notes', methods=['POST'])
def add_note(id):
    data = request.json
    note = incident_manager.add_note(id, data.get('author'), data.get('content'))
    if note: return jsonify(note), 201
    return jsonify({"error": "Not found"}), 404

# === Security: Rate Limiter ===
class Limiter:
    def __init__(self):
        self.requests = {}
    
    def is_allowed(self, ip):
        now = time.time()
        if ip not in self.requests:
            self.requests[ip] = []
        # Filter requests from last 60 seconds
        self.requests[ip] = [t for t in self.requests[ip] if now - t < 60]
        
        if len(self.requests[ip]) >= 5: # Limit: 5 per minute
            return False
            
        self.requests[ip].append(now)
        return True

limiter = Limiter()

@app.route('/api/login', methods=['POST'])
def login():
    # Rate Limiting Check
    if not limiter.is_allowed(request.remote_addr):
        return jsonify({"success": False, "message": "Muitas tentativas. Aguarde 1 minuto."}), 429

    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    # Mock Auth
    if username == "admin" and password == "admin":
        return jsonify({
            "success": True,
            "user": {
                "id": "u-1",
                "name": "Administrador",
                "role": "Comandante Operacional"
            }
        })
    return jsonify({"success": False, "message": "Credenciais inválidas"}), 401

# === Security: Headers ===
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    return response

@app.route('/api/stats', methods=['GET'])
def get_stats():
    # Helper Stats from DB
    stats = incident_manager.get_stats()
    
    # We need to construct the breakdown and activity data here or in manager.
    # Manager returns basic counts. Let's do it properly.
    # Actually, incident_manager.get_stats() provided currently returns:
    # { dailyFireCount, monthlyFireCount, total }
    # But frontend needs 'statusBreakdown' and 'activityData'.
    # So we need to fetch all and build the rest, OR update manager.
    # Let's fetch all fixes it faster without changing manager again.
    
    incidents = incident_manager.get_all()
    
    # 1. Counts
    today = datetime.datetime.now().date()
    current_month = datetime.datetime.now().month
    
    daily_count = sum(1 for i in incidents if datetime.datetime.fromisoformat(i['timestamp']).date() == today and i['tag'] == 'FOGO')
    monthly_count = sum(1 for i in incidents if datetime.datetime.fromisoformat(i['timestamp']).month == current_month and i['tag'] == 'FOGO')
    
    # 2. Status Breakdown
    status_counts = {}
    for i in incidents:
        status_counts[i['status']] = status_counts.get(i['status'], 0) + 1
        
    status_breakdown = [
        { "name": "Novo", "value": status_counts.get("Novo", 0), "color": "#ef4444" },
        { "name": "Em Andamento", "value": status_counts.get("Em Andamento", 0), "color": "#f59e0b" },
        { "name": "Resolvido", "value": status_counts.get("Resolvido", 0), "color": "#10b981" },
        { "name": "Outros", "value": status_counts.get("Outros", 0), "color": "#64748b" }
    ]
    
    # 3. Hourly Activity (Last 24h)
    activity_data = []
    
    # Initialize 24h buckets for today
    buckets = {h: 0 for h in range(24)}
    
    for i in incidents:
        dt = datetime.datetime.fromisoformat(i['timestamp'])
        # Only count today's incidents for the hourly chart
        if dt.date() == today:
            buckets[dt.hour] += 1
            
    # Format for Recharts
    for h in range(0, 24, 4): # Every 4 hours to keep chart clean
        # Sum the interval
        count = sum(buckets[x] for x in range(h, h+4) if x < 24)
        label = f"{h:02d}h"
        activity_data.append({"name": label, "fires": count})

    return jsonify({
        "dailyFireCount": daily_count,
        "monthlyFireCount": monthly_count,
        "statusBreakdown": status_breakdown,
        "activityData": activity_data
    })

@app.route('/api/snapshot', methods=['POST'])
def snapshot():
    camera = VideoCamera()
    if camera.current_frame is not None:
        filename = f"snapshot_{int(time.time())}.jpg"
        filepath = os.path.join(app.static_folder, filename)
        import cv2
        cv2.imwrite(filepath, camera.current_frame)
        return jsonify({"url": f"/assets/{filename}", "success": True})
    return jsonify({"error": "Camera not ready"}), 503

@app.route('/api/detect', methods=['POST'])
def detect_external():
    """Recebe uma imagem (blob) e retorna detecções."""
    if 'image' not in request.files:
        return jsonify({"error": "No image"}), 400
    
    file = request.files['image']
    import numpy as np
    import cv2
    
    # Decode image securely
    npimg = np.fromfile(file, np.uint8)
    frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
    
    if frame is None:
        return jsonify({"error": "Invalid image"}), 400

    # Run Inference (Shared Logic)
    detections = VideoCamera().process_frame(frame)
    
    return jsonify({"success": True, "detections": detections})

# ... (Original Routes)
def gen(camera):
    while True:
        frame = camera.get_frame()
        if frame is None:
            continue
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
# ...
    try:
        return Response(gen(VideoCamera()),
                        mimetype='multipart/x-mixed-replace; boundary=frame')
    except RuntimeError as e:
        return str(e)

# Catch-all for React Router
@app.route('/<path:path>')
def catch_all(path):
    # Pass unrelated requests to index.html so React Router handles them
    # Exception: if it puts /video_feed here it might be an issue if defined after? 
    # Actually explicit routes take precedence.
    return render_template('index.html')

if __name__ == '__main__':
    # Debug=False para melhor performance e evitar reloads
    app.run(host='0.0.0.0', debug=False, threaded=True)
