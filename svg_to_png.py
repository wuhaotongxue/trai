import sys
from PyQt6.QtGui import QImage, QPainter
from PyQt6.QtSvg import QSvgRenderer
from PyQt6.QtWidgets import QApplication
from PyQt6.QtCore import Qt

def main():
    app = QApplication(sys.argv)
    
    svg_path = "e:/code/zzgit/trai/client_electron/public/kity.svg"
    png_path = "e:/code/zzgit/trai/client_electron/public/kity.png"
    
    renderer = QSvgRenderer(svg_path)
    if not renderer.isValid():
        print("Invalid SVG")
        sys.exit(1)
        
    image = QImage(256, 256, QImage.Format.Format_ARGB32)
    image.fill(Qt.GlobalColor.transparent)
    
    painter = QPainter(image)
    painter.setRenderHint(QPainter.RenderHint.Antialiasing)
    renderer.render(painter)
    painter.end()
    
    image.save(png_path)
    print(f"Saved {png_path}")
    
if __name__ == "__main__":
    main()
