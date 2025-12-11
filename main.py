from app import app

if __name__ == '__main__':
    print("Iniciando Interface Web COE Surveillance...")
    print("Acesse: http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
