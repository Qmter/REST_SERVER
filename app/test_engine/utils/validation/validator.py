import requests
import logging


class Validator:
    """
    Класс для валидации JSON-ответов API.

    Поддерживает:
    - частичное сравнение словарей (лишние поля допускаются)
    - проверку списков как подпоследовательности (с сохранением порядка)
    - вложенные структуры любой глубины
    - сбор предупреждений (extra keys / extra items)
    """

    @staticmethod
    def check_schemas(get_response, expectations, step):
        """
        Основной метод валидации.

        get_response: либо requests.Response, либо уже dict
        expectations: ожидаемая (частичная) структура
        """

        try:
            # --- Получение данных из response ---
            # Если передан объект Response, то берём .json()["result"]
            if isinstance(get_response, requests.models.Response):
                result = get_response.json().get("result")
            else:
                # Иначе считаем, что это уже словарь
                result = get_response

            # Список для накопления предупреждений
            warnings = []

            # Запуск рекурсивной проверки
            is_valid = Validator._match(
                expectations,
                result,
                path="result",   # начальная точка (корень)
                warnings=warnings
            )

            # --- Вывод предупреждений---
            if warnings:
                logging.debug("\n" + "=" * 60)
                logging.debug(f"VALIDATION WARNINGS. STEP: {step}")
                logging.debug("=" * 60)

                for w in warnings:
                    w_type, path, expected, response, extra = w

                    # Тип предупреждения + путь до поля
                    logging.debug(f"[{w_type}] {path}")

                    # Что ожидали
                    logging.debug(f"  expected: {expected}")

                    # Что пришло
                    logging.debug(f"  response: {response}")

                    # Аргументы, которые не ожидались но пришли в response 
                    if extra:
                        logging.debug(f"  extra:    {extra}")

                    logging.debug("-" * 60)

                logging.debug("=" * 60 + "\n")

            # --- Финальная проверка ---
            # Если обязательные данные не совпали, то вызываем AssertionError
            assert is_valid, \
                f"value error: request field: {result}, expected: {expectations}"

        except AssertionError as e:
            raise AssertionError(f"Error in validation: {e}")
        except Exception as e:
            raise AssertionError(f"Error in validation: {e}")

    @staticmethod
    def _match(expected, response, path="result", warnings=None):
        """
        Рекурсивное сравнение expected vs response.

        Возвращает:
        - True , то если expected содержится в response
        - False , то если есть несовпадение

        Дополнительно:
        - записывает warnings при наличии лишних данных
        """

        # expected — dict
        if isinstance(expected, dict):

            # Если response не dict , то несовпадение типов
            if not isinstance(response, dict):
                return False

            # Поиск лишних ключей
            # Ключи, которые есть в response, но не ожидаются
            extra_keys = set(response.keys()) - set(expected.keys())

            if extra_keys:
                warnings.append((
                    "EXTRA_KEYS",
                    path,
                    list(expected.keys()),   # что ожидали (ключи)
                    list(response.keys()),   # что пришло (ключи)
                    list(extra_keys)         # лишние ключи
                ))

            # Проверка ожидаемых ключей
            for key, value in expected.items():

                # Если ключа нет, то ошибка
                if key not in response:
                    return False

                # Рекурсивно проверяем вложенность
                if not Validator._match(
                    value,
                    response[key],
                    path=f"{path}.{key}",   # формируем путь (JSON-path)
                    warnings=warnings
                ):
                    return False

            return True

        # expected — list
        elif isinstance(expected, list):

            # Тип должен совпадать
            if not isinstance(response, list):
                return False

            # Проверка как подпоследовательности
            return Validator._list_match_ordered(expected, response, path, warnings)

        # примитивы
        else:
            # Строгое сравнение значений
            return expected == response

    @staticmethod
    def _list_match_ordered(expected, response, path, warnings):
        """
        Проверяет, что expected является подпоследовательностью response.

        Пример:
            expected   =    [A,    B]
            response   = [X, A, Y, B, Z] , то OK

        Важно:
        - порядок сохраняется
        - лишние элементы допускаются
        """

        # Указатель текущей позиции в response
        response_index = 0

        # Индексы элементов response, которые были использованы
        used_indices = set()

        # Перебираем ожидаемые элементы
        for exp_item in expected:
            found = False

            # Ищем exp_item в response начиная с текущей позиции
            while response_index < len(response):

                # Рекурсивное сравнение элемента
                if Validator._match(
                    exp_item,
                    response[response_index],
                    path=f"{path}[{response_index}]",  # путь с индексом
                    warnings=warnings
                ):
                    # Если нашли , то фиксируем
                    used_indices.add(response_index)
                    found = True
                    response_index += 1
                    break

                # Иначе идём дальше по списку
                response_index += 1

            # Если хотя бы один expected элемент не найден , то ошибка
            if not found:
                return False

        # --- Поиск лишних элементов списка ---
        # Всё, что не использовалось — лишнее
        extra_items = [
            response[i] for i in range(len(response))
            if i not in used_indices
        ]

        if extra_items:
            warnings.append((
                "EXTRA_ITEMS",
                path,
                expected,     # ожидаемый список
                response,     # фактический список
                extra_items   # лишние элементы
            ))

        return True

    @staticmethod
    def check_http_code(status_code, expected_code):
        """Сравнивает полученный http_code с ожидаемыми кодами (одним или списком)."""
        allowed = expected_code if isinstance(expected_code, (list, tuple, set)) else [expected_code]
        try:
            assert status_code in allowed, f"httpCode error, got {status_code}, expected one of {allowed}"
        except AssertionError:
            raise AssertionError(f"Error in httpCode. Expected one of {allowed}. Response {status_code}")


    @staticmethod
    def check_err_code(err_code, expected_code):
        """Сравнивает полученный err_code с ожидаемыми кодами (одним или списком)."""
        allowed = expected_code if isinstance(expected_code, (list, tuple, set)) else [expected_code]
        try:
            assert err_code in allowed, f"errCode error, got {err_code}, expected one of {allowed}"
        except AssertionError:
            raise AssertionError(f"Error in errCode. Expected one of {allowed}. Response {err_code}")
