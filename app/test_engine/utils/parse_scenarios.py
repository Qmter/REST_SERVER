from fastapi import HTTPException

class ScenarioParser:

    @staticmethod
    def find_all_endpoints(scenario, dict_endpoints) -> dict:
        try:
            def _find_endpoints_recursive(data):
                if isinstance(data, dict):
                    for key, value in data.items():

                        if key == 'endpoint' and isinstance(value, str):
                            method = data.get('method', 'post').upper()

                            # теперь endpoint хранит МНОЖЕСТВО методов
                            endpoints_in_scenario.setdefault(value, set()).add(method)

                        _find_endpoints_recursive(value)

                elif isinstance(data, list):
                    for item in data:
                        _find_endpoints_recursive(item)

            endpoints_in_scenario = {}
            _find_endpoints_recursive(scenario)

            #TODO
            # # ВАЛИДАЦИЯ
            # validation_errors = []
            # for endpoint in endpoints_in_scenario.keys():
            #     if endpoint not in dict_endpoints:
            #         validation_errors.append(
            #             f"Endpoint '{endpoint}' не найден в словаре endpoints_dict"
            #         )

            # if validation_errors:
            #     raise HTTPException(422,
            #         "Ошибки валидации endpoints:\n" +
            #         "\n".join(validation_errors[:10])
            #     )

            return endpoints_in_scenario

        except Exception as e:
            print(f"Ошибка при поиске endpoints: {e}")
            raise HTTPException(422, e)
