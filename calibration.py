import cv2
import numpy as np

# Variáveis globais
points_img = []
img_captured = None
CAMERA_SOURCE = 1

def click_event(event, x, y, flags, params):
    global points_img, img_captured
    if event == cv2.EVENT_LBUTTONDOWN:
        if len(points_img) < 4:
            print(f"Ponto capturado: ({x}, {y})")
            points_img.append((x, y))
            cv2.circle(img_captured, (x, y), 5, (0, 0, 255), -1)
            cv2.putText(img_captured, str(len(points_img)), (x+10, y), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.imshow("Calibrar Homografia", img_captured)

def main():
    global img_captured
    print("=== FERRAMENTA DE CALIBRAÇÃO DE HOMOGRAFIA ===")
    print("1. A câmera irá abrir.")
    print("2. Pressione 'c' para CAPTURAR a imagem do chão.")
    print("3. Na imagem capturada, clique em 4 pontos no chão (A, B, C, D) formando um retângulo/quadrado.")
    print("4. Insira as coordenadas reais desses pontos no terminal.")
    
    cap = cv2.VideoCapture(CAMERA_SOURCE)
    cap.set(3, 640)
    cap.set(4, 480)

    while True:
        ret, frame = cap.read()
        if not ret: continue
        cv2.imshow("Camera - Pressione 'c' para capturar", frame)
        if cv2.waitKey(1) == ord('c'):
            img_captured = frame
            break
    
    cap.release()
    cv2.destroyAllWindows()

    if img_captured is None:
        print("Nenhuma imagem capturada.")
        return

    cv2.imshow("Calibrar Homografia", img_captured)
    cv2.setMouseCallback("Calibrar Homografia", click_event)

    print("\n>>> Clique nos 4 pontos na janela da imagem... Aguardando...")
    while len(points_img) < 4:
        cv2.waitKey(100)

    print("\nPontos capturados (Pixels):", points_img)
    cv2.destroyAllWindows()

    # Entrada de coordenadas reais
    points_real = []
    print("\n>>> Agora insira as coordenadas REAIS (em metros, X Y) para cada ponto.")
    print("Exemplo: Para um retângulo de 2x3m")
    print("Ponto 1 (ex: canto inf esq): 0 0")
    print("Ponto 2 (ex: canto inf dir): 2 0")
    print("Ponto 3 (ex: canto sup dir): 2 3")
    print("Ponto 4 (ex: canto sup esq): 0 3")
    
    for i in range(4):
        coord = input(f"Digite X Y (metros) para o Ponto {i+1} capturado ({points_img[i]}): ")
        x, y = map(float, coord.split())
        points_real.append((x, y))

    # Converter para numpy
    pts_src = np.array(points_img, dtype=float)
    pts_dst = np.array(points_real, dtype=float)

    # Calcular Homografia
    h_matrix, status = cv2.findHomography(pts_src, pts_dst)
    
    print("\n--- MATRIZ DE HOMOGRAFIA CALCULADA ---")
    print(h_matrix)
    
    # Salvar
    np.save("homography_matrix.npy", h_matrix)
    print("\n>>> Matriz salva em 'homography_matrix.npy'. O sistema principal irá usar este arquivo.")

if __name__ == "__main__":
    main()
