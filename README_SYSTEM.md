# Sistema de Combate a Incêndio Autônomo (Python + ESP32 + YOLO)

Este projeto implementa um sistema onde uma câmera monitora um ambiente, detecta fogo, mapeia a posição do fogo no mundo real (em metros) e envia o robô (ESP32) para o local.

## Arquitetura
1.  **Câmera/PC**: Roda YOLOv8 para detectar fogo.
2.  **Calibration**: Script para mapear pixels da câmera para metros no chão (Homografia).
3.  **Python Backend**: Calcula coordenadas `(X, Y)` reais e envia para o robô.
4.  **ESP32 Robot**: Recebe `(X, Y)`, calcula rota e se move.

## 1. Instalação e Configuração

### Dependências Python
```bash
pip install opencv-python ultralytics numpy requests flask
```

### Configuração Hardware (ESP32)
1.  Abra `esp32_drive/esp32_drive.ino` na Arduino IDE.
2.  Edite `ssid` e `password` com seu Wi-Fi.
3.  Carregue o código no ESP32.
4.  Anote o IP que aparecer no Serial Monitor (ex: `192.168.1.105`).
5.  **Atualize** este IP no arquivo `camera.py` (função `trigger_robot`).

## 2. Calibração (Homografia)
Antes de usar, você precisa "ensinar" ao sistema como converter pixels em metros.

1.  Posicione a câmera no local final (fixa).
2.  Coloque 4 marcadores no chão formando um retângulo conhecido (ex: um quadrado de 2m x 2m).
3.  Execute:
    ```bash
    python calibration.py
    ```
4.  Pressione **'c'** para capturar a imagem.
5.  Clique nos 4 pontos na ordem (ex: Canto Inf Esq -> Inf Dir -> Sup Dir -> Sup Esq).
6.  No terminal, digite as coordenadas reais em metros para cada ponto. Ex:
    -   Ponto 1: `0 0`
    -   Ponto 2: `2 0`
    -   Ponto 3: `2 2`
    -   Ponto 4: `0 2`
7.  O arquivo `homography_matrix.npy` será gerado. O sistema usará ele automaticamente.

## 3. Executando o Sistema
Para iniciar a vigilância e controle:

```bash
python main.py
```
Acesse `http://localhost:5000` no navegador.

### Como funciona a Navegação?
-   Quando o fogo é detectado, o sistema calcula `X` e `Y` reais baseados na calibração.
-   Ele envia um comando `GET http://ESP_IP/goto?x=...&y=...`.
-   O ESP32 calcula o ângulo e distância e move os motores.

## Troubleshooting
-   **Carro não anda**: Verifique se o IP no `camera.py` está igual ao do ESP32. Pressione 't' na interface web (se implementado) ou use o navegador para acessar `http://ESP_IP/goto?x=1&y=0` e ver se ele responde.
-   **Coordenadas erradas**: Refaça a calibração com cuidado. Certifique-se de que o chão é plano.
