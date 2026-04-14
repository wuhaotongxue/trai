import os
import glob
import re

replacements = {
    '：': ':',
    '，': ',',
    '。': '.',
    '！': '!',
    '？': '?',
    '（': '(',
    '）': ')',
    '“': '"',
    '”': '"',
    '‘': "'",
    '’': "'"
}

def process_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return False
        
    new_content = content
    for k, v in replacements.items():
        new_content = new_content.replace(k, v)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed punctuation in {filepath}")
        return True
    return False

if __name__ == '__main__':
    count = 0
    for filepath in glob.glob('src/**/*.py', recursive=True):
        if process_file(filepath):
            count += 1
    print(f"Total files fixed: {count}")
