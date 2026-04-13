import sys1
from PIL import Image

def convert_to_ico(source_path, target_path, size):
    try:
        # 打开图片
        img = Image.open(source_path)
        # 调整大小，使用 Lanczos 算法保证缩放质量
        img = img.resize((size, size), Image.Resampling.LANCZOS)
        # 保存为真正的 ICO 格式
        img.save(target_path, format='ICO', sizes=[(size, size)])
        print(f"成功生成合法 ICO: {target_path}")
    except Exception as e:
        print(f"转换失败: {e}")

# 将伪装成 ICO 的 PNG 文件读取出来，重新转换为真正的 ICO
convert_to_ico('e:/code/zzgit/trai/client_electron/public/kity_256.ico', 'e:/code/zzgit/trai/client_electron/public/kity_256_real.ico', 256)
convert_to_ico('e:/code/zzgit/trai/client_electron/public/kity_16.ico', 'e:/code/zzgit/trai/client_electron/public/kity_16_real.ico', 16)
