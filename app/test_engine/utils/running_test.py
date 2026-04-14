from .http_methods import Http_methods
from .log import logging
from .validation.validator import Validator
import time
import sys
import io


class RunningTest:


    @staticmethod
    def run(test, base_url, auth_type, auth_data):
        # Собираем лог в память
        log_stream = io.StringIO()
        handler = logging.StreamHandler(log_stream)
        handler.setLevel(logging.DEBUG)
        formatter = logging.Formatter('%(message)s')
        handler.setFormatter(formatter)
        logger = logging.getLogger()
        prev_level = logger.level
        logger.setLevel(logging.DEBUG)
        logger.addHandler(handler)

        failed, status, desc = RunningTest.read_test(
            test_schema=test,
            runtime={
                "base_url": base_url,
                "auth_type": auth_type,
                "auth_data": auth_data
            }
        )

        logger.removeHandler(handler)
        logger.setLevel(prev_level)
        log_text = log_stream.getvalue()
        log_stream.close()

        return {
            "status": status,
            "failed_indexes": failed,
            "description": str(desc),
            "log": log_text
        }

    json_log = ''

    @staticmethod
    def read_test(test_schema, test_index=None, runtime=None):
        """ Функция запуска теста по схеме """

        pass_message = "PASS"
        failed_indexes = []
        failed_actions = set()
        desc = ''

        list_steps = list(test_schema.keys())

        if test_index is None:
            for action in list_steps:

                if action == "PRESET":
                    logging.debug("PRESET-TEST")

                if action == "AFTER-TEST":
                    logging.debug("AFTER-TEST")

                if action not in ("PRESET", "AFTER-TEST"):
                    if "description" in test_schema[action]:
                        description_dynamic = test_schema[action]["description"]
                        test_schema[action].pop("description")

                        logging.debug("-" * 68)
                        logging.debug(f"TEST: {action} | {description_dynamic}")
                        logging.debug("-" * 68)
                    else:
                        logging.debug("-" * 68)
                        logging.debug(f"TEST: {action}")
                        logging.debug("-" * 68)

                try:
                    RunningTest.execute_test(
                        input_schema=test_schema[action], 
                        runtime=runtime
                        )
                    logging.debug("")

                except (AssertionError, RuntimeError) as e:  # 
                    logging.debug(f"An error occurred: {e}")
                    logging.debug("")

                    if action.isdigit():
                        failed_indexes.append(action)
                    else:
                        failed_actions.add(action)

                    pass_message = "FAIL"
                    desc = e

                    if "AFTER-TEST" in list_steps:
                        try:
                            logging.debug("AFTER-TEST")

                            RunningTest.execute_test(
                                input_schema=test_schema["AFTER-TEST"],
                                runtime=runtime
                                )
                            
                        except (AssertionError, RuntimeError) as e_after:  # 
                            logging.debug(f"An error occurred: {e_after}")
                            logging.debug("")
                            failed_actions.add("AFTER-TEST")

                    if "PRESET" in list_steps:
                        try:
                            logging.debug("PRESET-TEST")
                            
                            RunningTest.execute_test(
                                input_schema=test_schema["PRESET"],
                                runtime=runtime
                                )
                            
                        except (AssertionError, RuntimeError) as e_preset:  # 
                            logging.debug(f"An error occurred: {e_preset}")
                            logging.debug("")
                            failed_actions.add("PRESET")

        else:
            try:
                if "PRESET" in list_steps:
                    logging.debug("PRESET-TEST")

                    RunningTest.execute_test(
                        input_schema=test_schema["PRESET"],
                        runtime=runtime
                        )
                    
            except (AssertionError, RuntimeError) as e:  # 
                logging.debug(f"An error occurred: {e}")
                logging.debug("")
                failed_actions.add("PRESET")
                pass_message = "FAIL"
                desc = e

            try:
                logging.debug("")
                scenario_index = test_schema[str(test_index)]

                if "description" in scenario_index:
                    description_index = scenario_index["description"]
                    logging.debug("-" * 68)
                    logging.debug(f"TEST: {test_index} | {description_index}")
                    logging.debug("-" * 68)
                    scenario_index.pop("description")
                else:
                    logging.debug(f"TEST: {test_index}")

                RunningTest.execute_test(
                    input_schema=scenario_index,
                    runtime=runtime
                    )

            except (AssertionError, RuntimeError) as e:  # 
                logging.debug(f"An error occurred: {e}")
                logging.debug("")
                failed_indexes.append(test_index)
                pass_message = "FAIL"
                desc = e

            try:
                if "AFTER-TEST" in list_steps:
                    logging.debug("AFTER-TEST")

                    RunningTest.execute_test(
                        input_schema=test_schema["AFTER-TEST"],
                        runtime=runtime
                        )
                    
            except (AssertionError, RuntimeError) as e:  #
                desc = e
                logging.debug(f"An error occurred: {e}")
                logging.debug("")
                failed_actions.add("AFTER-TEST")
                pass_message = "FAIL"

        return failed_indexes + list(failed_actions), pass_message, desc

    @staticmethod
    def execute_test(input_schema,  runtime=None):
        """Выполнение запросов по последовательности схемы"""

        action_indexes = list(input_schema.keys())

        for index in action_indexes:
            logging.debug("-" * 68)
            logging.debug(f"step.{index}")
            logging.debug("-" * 68)

            request_type = input_schema[index]["type"]
            endpoint_value = input_schema[index]["endpoint"]
            keys_in_test = input_schema[index].keys()

            if request_type == "POST":
                request_schema = input_schema[index]["schema"]

                try:
                    post_response = Http_methods.post(
                        base_url=runtime["base_url"],
                        endpoint=endpoint_value,
                        body=request_schema,
                        auth_type=runtime["auth_type"],
                        auth_data=runtime["auth_data"]
                    )
                except RuntimeError as e:
                    raise AssertionError(str(e))  # 

                if post_response is None:
                    raise AssertionError("POST response is None")  # 

                response_json = post_response.json()

                if 'httpCode' in input_schema[index].keys():
                    # Проверка на http-код ошибки
                    Validator.check_http_code(status_code=post_response.status_code,
                                            expected_code=input_schema[index]["httpCode"])

                if 'errCode' in input_schema[index].keys():
                    # Проверка на внутренний код ошибки
                    Validator.check_err_code(err_code=post_response.json().get("errCode")[0],
                                            expected_code=input_schema[index]["errCode"])


                

                # Выполнение GET-запроса для проверки доступности системы после перезагрузки
                if endpoint_value == "/system/reboot":
                    timeout = 300
                    retry_interval = 30
                    start_time = time.time()
                    attempt = 0
                    

                    logging.info('=' * 56)
                    logging.info("System is going to reboot now!")
                    print("\nSystem is going to reboot now!")
                    logging.info('=' * 56)
                    
                    time.sleep(20)
                    # Инициализация переменной для хранения состояния системы
                    system_rebooted = False

                    while time.time() - start_time < timeout:
                        elapsed = time.time() - start_time
                        
                        try:
                            attempt += 1
                            print(f"\rTrying to connect{'.' * (attempt)}", end="")
                            # Попытка выполнить запрос к системе
                            reboot_response = Http_methods.get(
                                base_url=runtime["base_url"],
                                endpoint=endpoint_value,
                                auth_type=runtime["auth_type"],
                                auth_data=runtime["auth_data"]
                            )
                            
                            # Проверка, что reboot_response не является None
                            if reboot_response is not None:
                                # Если статус ответа 200, система доступна
                                if reboot_response.status_code == 200:
                                    logging.info('=' * 56)
                                    logging.info(f"System is back online after {elapsed:.1f} seconds.")
                                    print("\r" + " " * 50, end="\r")
                                    print(f"\rSystem is back online after {elapsed:.1f} seconds.")
                                    logging.info('=' * 56)
                                    system_rebooted = True
                                    break
                                
                                # Если статус не 200, но система отвечает, выводим информацию
                                logging.debug('=' * 56)
                                logging.debug(f"Received status code {reboot_response.status_code} after {elapsed:.1f} seconds.")
                                logging.debug('=' * 56)
                            else:
                                # Логируем, что reboot_response равен None
                                logging.debug('=' * 56)
                                logging.debug(f"Reboot response is None after {elapsed:.1f} seconds.")
                                logging.debug('=' * 56)

                        except (ConnectionError, RuntimeError) as e:
                            # Логируем ошибку и продолжаем ожидание
                            logging.debug('=' * 56)
                            logging.debug(f"Waiting for server to reboot: ({int(elapsed)}) seconds elapsed. Error: {e}")
                            logging.debug('=' * 56)

                        # Ждём перед следующей попыткой
                        time.sleep(retry_interval)

                    # Если время истекло, возвращаем False
                    if not system_rebooted:
                        logging.debug('=' * 56)
                        logging.debug(f"Timeout reached ({timeout} seconds). System did not become available.")
                        logging.debug('=' * 56)
                        return False

            if request_type == "GET":
                request_arguments = input_schema[index].get("arguments")

                try:
                    get_response = Http_methods.get(
                        base_url=runtime["base_url"],
                        endpoint=endpoint_value,
                        auth_type=runtime["auth_type"],
                        auth_data=runtime["auth_data"],
                        arguments=request_arguments
                    )
                except RuntimeError as e:
                    raise AssertionError(str(e))  # 

                if get_response is None:
                    raise AssertionError("GET response is None")  # 

                response_json = get_response.json()
                
                # Проверка корректности возвращаемой схемы
                if "validation" in input_schema[index]:
                    Validator.check_schemas(get_response=get_response,
                                            expectations=input_schema[index]["validation"],
                                            step=index)

                if 'httpCode' in input_schema[index].keys():
                    # Проверка на http-код ошибки
                    Validator.check_http_code(status_code=get_response.status_code,
                                            expected_code=input_schema[index]["httpCode"])

                if 'errCode' in input_schema[index].keys():
                    # Проверка на внутренний код ошибки
                    Validator.check_err_code(err_code=get_response.json().get("errCode")[0],
                                            expected_code=input_schema[index]["errCode"])


                
