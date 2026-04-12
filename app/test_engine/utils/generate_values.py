import rstr
import random
import logging
from jsonpath_ng import parse

# Список интерфейсов которые нельзя использовать
NO_USE_LIST = []


class GenerateValues:
    """Генерация значений для аргументов сценария"""

    # Словарь {endpoint: {arg_name: {pattern/min/max}}}
    arguments_pattern = {}
    
    # Контекст для хранения уже сгенерированных значений (для ref) 
    context = {}

    @staticmethod
    def read_scenario(resolved_scenario: dict, arguments_patterns: dict, seed: int):
        """
        Читает сценарий и подставляет значения в parameters и validation
        на основе паттернов из OpenAPI.
        """

        # Устанавливает seed для воспроизводимой генерации
        random.seed(seed)

        # Очищает контекст перед обработкой
        GenerateValues.context = {}

        # Сохраняет паттерны
        GenerateValues.arguments_pattern = arguments_patterns

        # Собираем все шаги с endpoint/parameters вручную, чтобы избежать
        # странных строковых представлений путей из jsonpath_ng
        step_objects = []  # Список кортежей (obj, path_parts)

        def traverse(node, path_parts):
            if isinstance(node, dict):
                # Если это шаг с endpoint
                if 'endpoint' in node and ('parameters' in node or 'validation' in node):
                    step_objects.append((node, path_parts.copy()))

                for key, val in node.items():
                    traverse(val, path_parts + [str(key)])

            elif isinstance(node, list):
                for idx, val in enumerate(node):
                    traverse(val, path_parts + [str(idx)])

        traverse(resolved_scenario, [])

        # Обрабатываем каждый шаг
        for obj, path_parts in step_objects:
            try:
                endpoint = obj['endpoint']
                method = obj.get('method', 'POST').upper()
                endpoint_key = f"{method}:{endpoint}"

                # Если есть parameters — обрабатываем
                if 'parameters' in obj:
                    GenerateValues.process_fields(
                        resolved_scenario=resolved_scenario,
                        fields=obj['parameters'],
                        path_parts=path_parts,
                        field_type="parameters",
                        endpoint=endpoint_key
                    )

                # Если есть validation — обрабатываем
                if 'validation' in obj:
                    GenerateValues.process_fields(
                        resolved_scenario=resolved_scenario,
                        fields=obj['validation'],
                        path_parts=path_parts,
                        field_type="validation",
                        endpoint=endpoint_key
                    )

            except Exception as e:
                print(f"Ошибка при обработке шага сценария: {e}")
                continue

        return resolved_scenario  # Возвращаем сценарий с подставленными значениями
    

    @staticmethod
    def process_fields(resolved_scenario, fields, path_parts, field_type, endpoint):
        """Обрабатывает словарь parameters или validation"""

        # Итерируемся по копии словаря, чтобы можно было безопасно удалять элементы
        for full_key, value in list(fields.items()):
            try:
                # Разбиваем ключ по точке (для DSL-конструкций)
                key_parts = full_key.split(".") 

                # Последний элемент — это имя аргумента
                leaf_key = key_parts[-1] # Сам аргумент

                # Формируем путь для сохранения в context (используется в ref)
                type_candidates = ["TESTS", "PRESET", "AFTER-TEST"]
                type_test = ''
                type_index = None
                for cand in type_candidates:
                    if cand in path_parts:
                        type_test = cand
                        type_index = path_parts.index(cand)
                        break

                # База пути без endpoint (нужно совпадение с ref вида #TESTS.1.steps...)
                context_base = ''
                if type_index is not None:
                    context_base = '.'.join(path_parts[type_index:])

                current_path = f"#{context_base}.{field_type}.{full_key}" if context_base else ''

                # Флаг, было ли значение сгенерировано
                generated = False

                # В arg_value будет записано итоговое значение аргумента
                arg_value = None

                # ================= RANDOM =================
                if value == 'random':

                    # Получаем информацию о паттернах аргумента
                    patterns_info = (
                        GenerateValues.arguments_pattern
                        .get(endpoint, {})
                        .get(leaf_key, {})
                    )
                    
                    # Если аргумент описан через pattern
                    if "pattern" in patterns_info:
                        patterns = patterns_info["pattern"]

                        # Если pattern один — приводим к списку
                        if isinstance(patterns, str):
                            patterns = [patterns]

                        # Выбираем случайный паттерн
                        selected_pattern = random.choice(patterns)

                        # Генерируем значение, пока оно не будет равно запрещенному интерфейсу 
                        while True:
                            arg_value = rstr.xeger(selected_pattern)
                            if arg_value not in NO_USE_LIST:
                                break
                    
                    # Если аргумент описан через minimum/maximum
                    elif "minimum" in patterns_info and "maximum" in patterns_info:
                        arg_min = patterns_info["minimum"]
                        arg_max = patterns_info["maximum"]

                        # Генерируем значение, пока оно не будет равно запрещенному интерфейсу 
                        while True:
                            arg_value = random.randint(arg_min, arg_max)
                            if arg_value not in NO_USE_LIST:
                                break
                    

                    generated = arg_value is not None

                # ================= MIN / MAX =================
                elif value == 'minimum':
                    arg_value = GenerateValues.arguments_pattern[endpoint][leaf_key]["minimum"]
                    generated = True

                elif value == 'maximum':
                    arg_value = GenerateValues.arguments_pattern[endpoint][leaf_key]["maximum"]
                    generated = True
    
                # ================= greater than max / less than min =================  
                elif value == 'gt_max':
                    arg_value = GenerateValues.arguments_pattern[endpoint][leaf_key]["maximum"] + 1
                    generated = True

                elif value == 'lt_min':
                    arg_value = GenerateValues.arguments_pattern[endpoint][leaf_key]["minimum"] - 1
                    generated = True

                # ================= MODIFY =================
                elif isinstance(value, dict) and "modify" in value:

                    # Тип модификации
                    modify = value.get("modify")

                    # Получаем список паттернов аргумента
                    patterns = (
                        GenerateValues.arguments_pattern
                        .get(endpoint, {})
                        .get(leaf_key, {})
                        .get("pattern", [])
                    )

                    # Если pattern один — приводим к списку
                    if isinstance(patterns, str):
                        patterns = [patterns]

                    # Если нет доступных паттернов
                    if not patterns:
                        raise ValueError("No patterns available")

                    # Выбор конкретного паттерна по индексу
                    if isinstance(modify, int):
                        selected_patterns = [patterns[modify]]

                    # Выбор паттерна IPv4
                    elif modify == "ipv4":
                        selected_patterns = [
                            p for p in patterns
                            if "25[0-5]" in p or "2[0-4][0-9]" in p or "1[0-9][0-9]" in p
                        ]

                    # Выбор паттерна имени интерфейса
                    elif modify == "ifname":
                        selected_patterns = [
                            p for p in patterns
                            if "eth" in p or "vlan" in p or "tun" in p or "lo" in p
                        ]

                    # Использование кастомного regex
                    elif modify == "regex":
                        selected_patterns = [value["regex"]]

                    else:
                        raise ValueError(f"Unknown modify type: {modify}")

                    # Генерация значения по выбранному паттерну
                    selected_pattern = random.choice(selected_patterns)

                    # Генерируем значение, пока оно не будет равно запрещенному интерфейсу 
                    while True:
                        arg_value = rstr.xeger(selected_pattern)
                        if arg_value not in NO_USE_LIST:
                            break

                    generated = True

                # ================= REF =================
                elif isinstance(value, dict) and "ref" in value:
                    
                    # Получаем путь ссылки
                    ref_path = value["ref"]

                    # Берём ранее сохранённое значение из контекста
                    arg_value = GenerateValues.context[ref_path]

                    generated = True

                # ================= CONST =================
                else:
                     # Если это константа — используем её как есть
                    arg_value = value
                    generated = True

                # ===== Установка значния =====
                if generated:

                    # Устанавливаем значение в сценарий
                    # Устанавливаем значение в текущий словарь fields
                    GenerateValues.set_nested_field(fields, key_parts, arg_value)

                    # Сохраняем значение в контекст
                    if current_path:
                        GenerateValues.context[current_path] = arg_value

                    # Если ключ DSL содержит точку — удаляем исходный ключ
                    if "." in full_key:
                        fields.pop(full_key, None)

                    if type_test and "steps" in path_parts:
                        num_test = path_parts.index(type_test) + 1
                        num_step = path_parts.index("steps") + 1

                        print('_'*58)
                        print(f"{type_test}{' №' + path_parts[num_test] if type_test == 'TESTS' else ''}. Step №{path_parts[num_step]}:\nparameter={full_key}\nvalue={arg_value}")
                        print('-'*58)

            except Exception as e:
                print(f"Ошибка обработки поля {full_key}: {e}")
                continue

    @staticmethod
    def setup_values(scenario_scheme, path_to_arg, value):
        """Функция для установки значений"""
        # Разбиваем путь на части
        parts = path_to_arg.split('.')

        # Рекурсивная функция установки значения
        def _set(obj, parts_left):

            # Если это последний элемент пути — устанавливаем значение
            if len(parts_left) == 1:
                obj[parts_left[0]] = value
                return
            
            # Если промежуточного словаря нет — создаём
            if parts_left[0] not in obj or not isinstance(obj[parts_left[0]], dict):
                obj[parts_left[0]] = {}
            
            # Рекурсивно углубляемся
            _set(obj[parts_left[0]], parts_left[1:])

        # Запуск рекурсивной установки
        _set(scenario_scheme, parts)

        # Возвращаем обновлённую схему
        return scenario_scheme

    @staticmethod
    def set_nested_field(container: dict, key_parts: list, value):
        """Устанавливает значение по списку ключей, создавая вложенные dict по пути"""
        current = container
        for part in key_parts[:-1]:
            if part not in current or not isinstance(current.get(part), dict):
                current[part] = {}
            current = current[part]
        current[key_parts[-1]] = value
