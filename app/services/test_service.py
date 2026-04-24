import json
import time
from fastapi import HTTPException

from app.repositories.test_repo import (
    get_tests_preview_by_workspace,
    get_test_by_id,
    delete_test,
    create_test,
    get_test_by_id_scenario,
    update_test,
    create_test_execution,
    create_log_execution,
    get_test_executions_by_test,
    get_log_execution,
    get_test_execution,
    delete_test_execution_with_logs,
    delete_test_executions_with_logs_by_test
)

from app.repositories.scenario_repo import get_scenario_by_id
from app.repositories.connection_repo import get_openapi, get_connections_by_workspace
from app.test_engine.generate_test import GeneralGenerator  
from app.test_engine.utils.running_test import RunningTest


def run_test_service(db, id_workspace, id_test, id_user):

    # 1. test
    test = get_test_by_id(db, id_test)
    if not test:
        raise HTTPException(404, "Test not found")

    if test["id_workspace"] != id_workspace:
        raise HTTPException(403, "Forbidden")

    # 2. connection
    connection = get_connections_by_workspace(db, id_workspace)
    if not connection:
        raise HTTPException(404, "Connection not found")

    # 3. JSON
    content = test["content_test"]
    if isinstance(content, str):
        content = json.loads(content)

    auth_data = connection["auth_data"]
    if isinstance(auth_data, str):
        auth_data = json.loads(auth_data)

    # 4. запуск
    start = time.time()

    print(auth_data)

    print(f"[run_test] start id_test={id_test} workspace={id_workspace} user={id_user}")

    result = RunningTest.run(
        test=content,
        base_url=connection["base_url"],
        auth_type=connection["id_auth_type"],
        auth_data=auth_data
    )

    end = time.time()
    print(f"[run_test] finished id_test={id_test} status={result.get('status')} failed={result.get('failed_indexes')} duration={end - start:.2f}s")

    # ожидаем:
    # result = {
    #   "status": "success"/"failed",
    #   "failed_indexes": [...]
    # }

    # 5. сохранить
    exec_id = create_test_execution(
        db=db,
        id_test=id_test,
        id_user=id_user,
        status=result["status"],
        failed_indexes=json.dumps(result["failed_indexes"]),
        time_execution=end - start
    )

    if result.get("log") is not None:
        try:
            create_log_execution(
                db=db,
                id_test_execution=exec_id,
                detail=json.dumps({"log": result["log"]}, ensure_ascii=False)
            )
        except Exception as e:
            print(f"[run_test] failed to save log: {e}")

    return result



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

    last_exec = get_test_executions_by_test(db, id_test, limit=1)
    if last_exec:
        test["last_status"] = last_exec[0].get("test_status")
        test["last_start"] = last_exec[0].get("start_at")

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


def list_test_executions_service(db, id_workspace, id_test, limit=20):
    test = get_test_by_id(db, id_test)
    if not test:
        raise HTTPException(404, "Test not found")
    if test["id_workspace"] != id_workspace:
        raise HTTPException(403, "Forbidden")

    rows = get_test_executions_by_test(db, id_test, limit=limit)
    for r in rows:
        if isinstance(r.get("failed_indexes"), str):
            try:
                r["failed_indexes"] = json.loads(r["failed_indexes"])
            except Exception:
                pass
    return rows


def get_test_execution_log_service(db, id_workspace, id_execution):
    exec_row = get_test_execution(db, id_execution)
    if not exec_row:
        raise HTTPException(404, "Execution not found")
    if exec_row["id_workspace"] != id_workspace:
        raise HTTPException(403, "Forbidden")

    log_row = get_log_execution(db, id_execution)
    if not log_row or log_row.get("detail") is None:
        return {"log": ""}

    detail = log_row["detail"]
    if isinstance(detail, str):
        try:
            detail = json.loads(detail)
        except Exception:
            detail = {"log": detail}

    return detail


def delete_test_execution_service(db, id_workspace, id_execution):
    exec_row = get_test_execution(db, id_execution)
    if not exec_row:
        raise HTTPException(404, "Execution not found")
    if exec_row["id_workspace"] != id_workspace:
        raise HTTPException(403, "Forbidden")

    result = delete_test_execution_with_logs(db=db, id_test_execution=id_execution)
    return {
        "success": True,
        "deleted_logs": result["deleted_logs"],
        "deleted_executions": result["deleted_executions"]
    }


def delete_all_test_logs_service(db, id_workspace, id_test):
    test = get_test_by_id(db, id_test)
    if not test:
        raise HTTPException(404, "Test not found")
    if test["id_workspace"] != id_workspace:
        raise HTTPException(403, "Forbidden")

    result = delete_test_executions_with_logs_by_test(db=db, id_test=id_test)
    return {
        "success": True,
        "deleted_logs": result["deleted_logs"],
        "deleted_executions": result["deleted_executions"]
    }
