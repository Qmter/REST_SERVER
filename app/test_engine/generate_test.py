import argparse # Импортируем модуль для обработки аргументов командной строки
import json # Импортируем модуль для работы с JSON 
import os # Импортируем модуль для работы с файлами
from datetime import datetime # Импортируем модуль для работы с датой и временем
import sys # Импортируем модуль для работы с аргументами командной строки
from pydantic import ValidationError
from fastapi import HTTPException

 
from .utils.parse_scenarios import ScenarioParser # Импортируем класс для парсинга сценариев
from .utils.resolve_scheme import ResolveScheme # Импортируем класс для разрешения схемы
from .utils.generate_values import GenerateValues # Импортируем класс для генерации значений для аргументов сценария
from .utils.make_test import GenerateTests # Импортируем класс для генерации тестов
from .utils.validation.scenario_models import Scenario



# # ASCII-символы для консольных сообщений
# OK_SIMBOL = '|  OK  |'
# FAIL_SIMBOL = '| FAIL |'

# # Объявляем переменную для сохранения итоговых логов
# LOGS_EXECUTION_LIST = []

# def gen_endpoints(endpoints_list):
#     for endpoint in endpoints_list:
#         endpoint_processed = endpoint.replace("/", "_")
#         correct_name_endpoint = cfg.DICT_ENDPOINTS.get(f'{endpoint}'.replace('_', '/'), endpoint)
        
#         try:
#             logging.debug("=" * 68)
#             logging.debug(f"Генерация теста: {correct_name_endpoint}")
#             logging.debug("=" * 68)

#             generate_test(endpoint_test=endpoint_processed)

#             # Сообщение об успехе
#             execution_message_e = f"{correct_name_endpoint.ljust(50, '.')}{OK_SIMBOL}"
#             LOGS_EXECUTION_LIST.append(execution_message_e)    
#             print(execution_message_e)
            
#         except Exception as e:
#             error_msg = handle_generation_error(correct_name_endpoint, e, endpoint)
#             LOGS_EXECUTION_LIST.append(error_msg)
#             print(error_msg)

    

# def gen_dir_endpoints():
#     target_dir = parser_args.dir[0].strip('/')
    
#     # Строим путь к директории
#     dir_path = os.path.join(cfg.SCENARIOS_DIR, target_dir.replace('/', os.sep))
    
#     if not os.path.exists(dir_path):
#         print(f"Директория не найдена: {dir_path}")
#         return
    
#     # Рекурсивно ищем все JSON файлы
#     for root, dirs, files in os.walk(dir_path):
#         for file in files:
#             if file.endswith('.json') and file.startswith('_'):
#                 # Получаем относительный путь от SCENARIOS_DIR
#                 rel_path = os.path.relpath(root, cfg.SCENARIOS_DIR)
                
#                 # Имя файла без _ и .json
#                 file_base = file[:-5]  # Например: '_fail2ban_enable' -> 'fail2ban_enable'
                
#                 # ДЕБАГ: выводим информацию
#                 logging.debug("=" * 68)
#                 logging.debug(f"Обработка файла: {file}")
#                 logging.debug(f"rel_path: {rel_path}")
#                 logging.debug(f"file_base: {file_base}")
#                 logging.debug("=" * 68)


#                 correct_name_endpoint = cfg.DICT_ENDPOINTS.get(f'{file_base}'.replace('_', '/'), file_base.replace('_', '/'))
                
#                 try:
#                     generate_test(endpoint_test=file_base)
                    
#                     # Сообщение об успехе
#                     execution_message = f"{correct_name_endpoint.ljust(50, '.')}{OK_SIMBOL}"
#                     LOGS_EXECUTION_LIST.append(execution_message)
#                     print(execution_message)
                    
#                 except Exception as e:
#                     error_msg = handle_generation_error(correct_name_endpoint, e, file_base)
#                     LOGS_EXECUTION_LIST.append(error_msg)
#                     print(error_msg)


# def gen_all_endpoints():
#     # Строим путь к директории
#     dir_path = os.path.join(cfg.SCENARIOS_DIR)
    
#     if not os.path.exists(dir_path):
#         print(f"Директория не найдена: {dir_path}")
#         return
    
#     # Рекурсивно ищем все JSON файлы
#     for root, dirs, files in sorted(os.walk(dir_path)):
#         for file in files:
#             if file.endswith('.json') and file.startswith('_'):
#                 # Получаем относительный путь от SCENARIOS_DIR
#                 rel_path = os.path.relpath(root, cfg.SCENARIOS_DIR)
                
#                 # Имя файла без .json
#                 file_base = file[:-5]
                
#                 # ДЕБАГ: выводим информацию
#                 logging.debug("=" * 68)
#                 logging.debug(f"Обработка файла: {file}")
#                 logging.debug(f"rel_path: {rel_path}")
#                 logging.debug(f"file_base: {file_base}")
#                 logging.debug("=" * 68)


#                 correct_name_endpoint = cfg.DICT_ENDPOINTS.get(f'{file_base}'.replace('_', '/'), file_base.replace('_', '/'))
                
#                 try:
#                     generate_test(endpoint_test=file_base)
                    
#                     # Сообщение об успехе
#                     execution_message = f"{correct_name_endpoint.ljust(50, '.')}{OK_SIMBOL}"
#                     LOGS_EXECUTION_LIST.append(execution_message)
#                     print(execution_message)
                    
#                 except Exception as e:
#                     error_msg = handle_generation_error(correct_name_endpoint, e, file_base)
#                     LOGS_EXECUTION_LIST.append(error_msg)
#                     print(error_msg)





class GeneralGenerator:

    @staticmethod
    def generate_test(scenario, seed, openapi_spec = None):
        
        try:
            if openapi_spec == None:
                raise HTTPException(404, "Openapi not found")
            
            schema = openapi_spec

            # Теперь openapi
            all_endpoints = list(schema['paths'].keys())

            print(f"scenario type: {type(scenario)}")

            print(f"openapi_spec type: {type(openapi_spec)}")
            
            print(f"all_endpoints type: {type(all_endpoints)}")

            print("=" * 100)
            print("СЦЕНАРИЙ")
            print(json.dumps(scenario, indent=2))
            print("=" * 100)

            # print(scenario)

            # try:
            #     scenario_model = Scenario.model_validate(scenario)
            # except ValidationError as e:
            #     raise HTTPException(422, e)

            
            # Извлечение всех эндпоинтов которые присутствуют в сценарии
            all_endpoints_in_scenario = ScenarioParser.find_all_endpoints(scenario=scenario, dict_endpoints=all_endpoints)

            print("=" * 100)
            print("ендаоинты в сценарии")
            print(all_endpoints_in_scenario, "all_endpoints_in_scenario")
            print("=" * 100)


            # Словарь структуры {endpoint: scheme}
            dict_endpoint_scheme = {}

            # Массив со всеми паттернами endpoint'ов для теста. Пример {"endpoint": {patterns}}
            arguments_patterns = {}

            # Проходимся по всем endpoint'ам, разрешаем схему и собираем паттерны
            for endpoint, methods in all_endpoints_in_scenario.items():
                for method in methods:
                    # Разрешение схемы endpoint'а сценария
                    resolved_scheme = ResolveScheme.resolve_endpoint(openapi_file=openapi_spec, endpoint_path=endpoint, method=method)

                    dict_endpoint_scheme[f"{method}:{endpoint}"] = resolved_scheme

                    # Получение паттернов аргументов
                    arguments_patterns[f"{method}:{endpoint}"] = ResolveScheme.find_all_patterns_min_max(schema=resolved_scheme)


            print("=" * 100)
            print("arguments_patterns")
            print(arguments_patterns)
            print("=" * 100)



            # Генерация значений для аргументов
            ready_scenario = GenerateValues.read_scenario(resolved_scenario=scenario, arguments_patterns=arguments_patterns, seed=seed)

            ready_json_test = GenerateTests.generate_test(scenario=ready_scenario)
            
            print("=" * 100)
            print("ready_scenario")
            print(json.dumps(ready_scenario, indent=2))
            print("=" * 100)

            
            return ready_json_test
        

        # TODO Доработать http exception + logging
        except ValueError as e:
            raise HTTPException(422, str(e))
        except Exception as e:
            # Прокидываем HTTPException как есть, чтобы FastAPI корректно сериализовал ответ
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(422, str(e))
