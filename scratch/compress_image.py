import os
import sys

# Try to import Pillow, install it if missing
try:
    from PIL import Image
except ImportError:
    print("Pillow is not installed. Installing it now...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

input_path = r'c:\Users\USER\Desktop\EduBridge\src\assets\hero.jpg'
output_path = r'c:\Users\USER\Desktop\EduBridge\src\assets\hero.jpg'

if os.path.exists(input_path):
    orig_size = os.path.getsize(input_path)
    print(f"Original image size: {orig_size / 1024 / 1024:.2f} MB")
    try:
        with Image.open(input_path) as img:
            # Resize to max width 1920px keeping aspect ratio
            img.thumbnail((1920, 1920), Image.Resampling.LANCZOS)
            # Save with optimized JPEG quality
            img.save(output_path, 'JPEG', quality=82, optimize=True)
        comp_size = os.path.getsize(output_path)
        print(f"Compressed image size: {comp_size / 1024:.2f} KB")
        print(f"Reduction: {((orig_size - comp_size) / orig_size) * 100:.1f}%")
    except Exception as e:
        print("Error compressing image:", e)
else:
    print("Image not found at path:", input_path)
