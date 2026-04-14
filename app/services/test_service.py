import json
from fastapi import HTTPException

from app.repositories.test_repo import (
    get_tests_preview_by_workspace,
    get_test_by_id,
    delete_test,
    create_test,
    get_test_by_id_scenario,
    update_test
)

from app.repositories.scenario_repo import get_scenario_by_id
from app.repositories.connection_repo import get_openapi
from app.test_engine.generate_test import GeneralGenerator  

def list_tests_service(db, id_workspace):
    return get_tests_preview_by_workspace(db, id_workspace)


def get_test_detail_service(db, id_workspace, id_test):

    test = get_test_by_id(db, id_test)

    if not test:
        raise HTTPException(404, "Test not found")

    # защита от подмены workspace
    if test["id_workspace"] != id_workspace:
        raise HTTPException(403, "Forbidden")

    if isinstance(test["content_test"], str):
        test["content_test"] = json.loads(test["content_test"])

    return test


def delete_test_service(db, id_workspace, id_test):

    test = get_test_by_id(db, id_test)

    if not test:
        raise HTTPException(404, "Test not found")

    if test["id_workspace"] != id_workspace:
        raise HTTPException(403, "Forbidden")

    delete_test(db, id_test)

    return {"status": "deleted"}




def generate_tests_service(db, id_workspace, id_scenario):

    scenario = get_scenario_by_id(db, id_scenario)
    
    seed = 0

    if not scenario:
        raise HTTPException(404, "Scenario not found")

    # защита
    if scenario["id_workspace"] != id_workspace:
        raise HTTPException(403, "Forbidden")

    # JSON → dict
    if isinstance(scenario["content_scenario"], str):
        content = json.loads(scenario["content_scenario"])
    else:
        content = scenario["content_scenario"]

    openapi_spec = get_openapi(db=db, id_workspace=id_workspace)

    if not openapi_spec or openapi_spec is None:
        raise HTTPException(404, "OpenAPI not found")

    content_openapi = openapi_spec['openapi_schema']
    if isinstance(content_openapi, str):
        content_openapi = json.loads(content_openapi)

    # Генерация тестов
    generated = GeneralGenerator.generate_test(scenario=content, openapi_spec=content_openapi, seed=seed)

    # ожидаем структуру:
    # [
    #   {"name": "...", "content": {...}, "seed": "..."}
    # ]

    if not isinstance(generated, dict):
        raise HTTPException(500, "Generator returned unexpected format")
    

    # Получение теста из базы. Если есть то update, если нет то create
    exist_test = get_test_by_id_scenario(db=db, id_scenario=id_scenario)

    mess = ''

    if not exist_test:
        mess = "created test"

        test_id = create_test(
            db=db,
            id_scenario=id_scenario,
            name_test=scenario['name_scenario'],
            content_test=json.dumps(generated),
            last_seed=str(seed)
        )
    else:
        mess = 'updated test'
        update_rowcount = update_test(
            db=db, 
            id_scenario=id_scenario, 
            content_test=json.dumps(generated)
            )
    

        

    return {"success": [mess], "count": 1}