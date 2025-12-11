import datetime
import uuid
import sqlite3
import json
import urllib.request

class IncidentManager:
    def __init__(self, db_path="incidents.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Inicializa o banco de dados SQLite."""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        # Tabela de Incidentes
        c.execute('''CREATE TABLE IF NOT EXISTS incidents (
            id TEXT PRIMARY KEY,
            type TEXT,
            tag TEXT,
            priority TEXT,
            status TEXT,
            address TEXT,
            description TEXT,
            timestamp TEXT,
            lat REAL,
            lon REAL,
            notes TEXT
        )''')
        
        conn.commit()
        conn.close()

    def _get_auto_location(self):
        """Obtém localização aproximada via IP (Fallback)."""
        try:
            with urllib.request.urlopen("http://ip-api.com/json/", timeout=3) as url:
                data = json.loads(url.read().decode())
                if data['status'] == 'success':
                    return data['lat'], data['lon']
        except Exception as e:
            print(f"[LOCATION] Erro ao obter localização: {e}")
        return -23.5505, -46.6333 # Default SP

    def get_all(self):
        """Retorna todos os incidentes ordenados por data."""
        conn = sqlite3.connect(self.db_path)
        # Row factory para retornar dicionários compatíveis com o frontend
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        c.execute("SELECT * FROM incidents ORDER BY timestamp DESC")
        rows = c.fetchall()
        
        incidents = []
        for row in rows:
            inc = dict(row)
            # Reconstrói objeto 'location' e 'notes'
            inc['location'] = {'lat': inc['lat'], 'lon': inc['lon']}
            inc['notes'] = json.loads(inc['notes']) if inc['notes'] else []
            # Remove campos chatos de duplicar se quiser, mas o frontend espera estrutura flat as vezes? 
            # O frontend espera 'location' aninhado.
            incidents.append(inc)
            
        conn.close()
        return incidents

    def create_incident(self, type, tag, priority, address, description, status="Novo"):
        # Auto-Location se não fornecido (aqui assume-se que camera passará coord 0,0 se desconhecido)
        # Se address contiver "Camera 01" e coordenadas forem dummy, tentamos pegar reais.
        
        lat, lon = self._get_auto_location()
        
        new_id = f"INC-{str(uuid.uuid4())[:6].upper()}"
        timestamp = datetime.datetime.now().isoformat()
        notes_json = json.dumps([])
        
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        c.execute('''INSERT INTO incidents 
                     (id, type, tag, priority, status, address, description, timestamp, lat, lon, notes)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                  (new_id, type, tag, priority, status, address, description, timestamp, lat, lon, notes_json))
        
        conn.commit()
        conn.close()
        
        # Retorna formato para o frontend
        return {
            "id": new_id,
            "type": type,
            "tag": tag,
            "priority": priority,
            "status": status,
            "address": address,
            "location": {"lat": lat, "lon": lon},
            "description": description,
            "timestamp": timestamp,
            "notes": []
        }

    def update_incident(self, id, data):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        # Constroi query dinâmica
        fields = []
        values = []
        for k, v in data.items():
            if k in ['type', 'tag', 'priority', 'status', 'address', 'description']:
                fields.append(f"{k} = ?")
                values.append(v)
        
        if not fields:
            conn.close()
            return None
            
        values.append(id)
        c.execute(f"UPDATE incidents SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()
        conn.close()
        return True

    def delete_incident(self, id):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("DELETE FROM incidents WHERE id = ?", (id,))
        conn.commit()
        conn.close()
        return True

    def get_stats(self):
        """Retorna estatísticas para o dashboard."""
        incidents = self.get_all()
        
        today = datetime.datetime.now().date()
        daily_fire = 0
        monthly_fire = 0
        
        for inc in incidents:
            dt = datetime.datetime.fromisoformat(inc['timestamp']).date()
            if inc['tag'] == 'FOGO':
                if dt == today:
                    daily_fire += 1
                if dt.month == today.month and dt.year == today.year:
                    monthly_fire += 1
                    
        return {
            "dailyFireCount": daily_fire,
            "monthlyFireCount": monthly_fire,
            "total": len(incidents)
        }

    def add_note(self, incident_id, author, content):
        # Primeiro lê notas atuais
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        c.execute("SELECT notes FROM incidents WHERE id = ?", (incident_id,))
        row = c.fetchone()
        
        if not row:
            conn.close()
            return None
            
        current_notes = json.loads(row['notes']) if row['notes'] else []
        
        new_note = {
            "id": f"n-{str(uuid.uuid4())[:8]}",
            "author": author,
            "content": content,
            "timestamp": datetime.datetime.now().isoformat()
        }
        
        current_notes.append(new_note)
        
        c.execute("UPDATE incidents SET notes = ? WHERE id = ?", (json.dumps(current_notes), incident_id))
        conn.commit()
        conn.close()
        
        return new_note

# Singleton instance
incident_manager = IncidentManager()
