import os
import ast
from pathlib import Path

def check_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    issues = []
    
    # Check for author/header
    if "作者: wuhao" not in content:
        issues.append("Missing author 'wuhao'")
    
    try:
        tree = ast.parse(content)
    except Exception as e:
        return [f"Parse error: {e}"]

    # Check for at least one class
    classes = [n for n in tree.body if isinstance(n, ast.ClassDef)]
    if not classes:
        issues.append("No class defined in file")

    # Check docstrings for all classes and functions
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            if ast.get_docstring(node) is None:
                issues.append(f"Missing docstring for {type(node).__name__} '{node.name}'")
    
    # Check for print()
    if "print(" in content and "logger" not in content: # rough check
         pass # will use grep for exact match

    return issues

backend_src = Path("backend/src")
for py_file in backend_src.rglob("*.py"):
    if "__init__.py" in str(py_file): continue
    res = check_file(py_file)
    if res:
        print(f"File: {py_file}")
        for issue in res:
            print(f"  - {issue}")
