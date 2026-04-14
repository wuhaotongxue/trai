import sys

def check_ico_header(file_path):
    with open(file_path, 'rb') as f:
        header = f.read(4)
        if len(header) < 4:
            print("文件太小，不是有效的图标")
            return
            
        # ICO 文件的魔数 (Magic Number): 00 00 01 00
        is_ico = header[0] == 0 and header[1] == 0 and header[2] == 1 and header[3] == 0
        
        # PNG 文件的魔数: 89 50 4E 47
        is_png = header[0] == 0x89 and header[1] == 0x50 and header[2] == 0x4E and header[3] == 0x47
        
        print(f"Header hex: {header.hex()}")
        if is_ico:
            print("这确实是一个合法的 ICO 格式文件！")
        elif is_png:
            print("这是一个伪装的 PNG 文件！(后缀名是 .ico 但实际内容是 png)")
        else:
            print("这是一个未知的图片格式！")

check_ico_header('e:/code/zzgit/trai/client_electron/public/kity_256.ico')
