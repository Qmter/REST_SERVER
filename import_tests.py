"""
Скрипт для импорта ваших 169 JSON файлов с тестами в директорию примеров.
"""

import shutil
import sys
from pathlib import Path


def import_test_files(source_dir: str, dest_dir: str = "./app/test_engine/neural/examples"):
    """
    Копирует все JSON файлы из исходной директории в директорию примеров.

    Args:
        source_dir: Путь к директории с вашими JSON файлами
        dest_dir: Путь к директории назначения
    """
    source_path = Path(source_dir)
    dest_path = Path(dest_dir)

    if not source_path.exists():
        print(f"Ошибка: Директория {source_dir} не найдена")
        return False

    if not dest_path.exists():
        dest_path.mkdir(parents=True, exist_ok=True)
        print(f"Создана директория: {dest_path}")

    json_files = list(source_path.glob("*.json"))

    if not json_files:
        print(f"В директории {source_dir} не найдено JSON файлов")
        return False

    copied_count = 0
    for file_path in json_files:
        try:
            dest_file = dest_path / file_path.name
            shutil.copy2(file_path, dest_file)
            copied_count += 1
            print(f"Скопирован: {file_path.name}")
        except Exception as e:
            print(f"Ошибка копирования {file_path.name}: {e}")

    print(f"\n=== ИТОГО ===")
    print(f"Скопировано файлов: {copied_count}/{len(json_files)}")
    print(f"Директория с примерами: {dest_path.absolute()}")

    return True


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Использование:")
        print("  python import_tests.py <путь_к_директории_с_JSON>")
        print("\nПример:")
        print("  python import_tests.py /home/user/my_tests")
        print("\nИли переместите ваши 169 JSON файлов вручную в:")
        print("  /workspace/app/test_engine/neural/examples/")
        sys.exit(1)

    source_directory = sys.argv[1]
    success = import_test_files(source_directory)
    sys.exit(0 if success else 1)