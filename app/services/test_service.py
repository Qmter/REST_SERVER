import json
import time
from datetime import datetime
from fastapi import HTTPException

from app.repositories.test_repo import (
    get_tests_preview_by_workspace,
    get_tests_by_workspace,
    get_test_by_id,
    delete_test,
    create_test,
    get_test_by_id_scenario,
    update_test,
    create_test_execution,
    create_log_execution,
    get_test_executions_by_test,
    get_test_executions_by_workspace,
    get_log_execution,
    get_test_execution,
    delete_test_execution_with_logs,
    delete_test_executions_with_logs_by_test
)

from app.repositories.scenario_repo import get_scenario_by_id
from app.repositories.connection_repo import get_openapi, get_connections_by_workspace
from app.core.run_state import finish_run, list_active_runs, start_run
from app.test_engine.generate_test import GeneralGenerator  
from app.test_engine.utils.running_test import RunningTest


def _get_workspace_connection(db, id_workspace):
    connection = get_connections_by_workspace(db, id_workspace)
    if not connection:
        raise HTTPException(404, "Connection not found")

    base_url = connection.get("base_url")
    if not base_url:
        raise HTTPException(
            status_code=400,
            detail="Workspace connection base_url is not set"
        )

    auth_data = connection["auth_data"]
    if isinstance(auth_data, str):
        auth_data = json.loads(auth_data)

    return connection, base_url, auth_data


def _run_loaded_test(test, connection, base_url, auth_data):
    content = test["content_test"]
    if isinstance(content, str):
        content = json.loads(content)

    start = time.time()
    result = RunningTest.run(
        test=content,
        base_url=base_url,
        auth_type=connection["id_auth_type"],
        auth_data=auth_data
    )
    end = time.time()

    return result, end - start


def run_test_service(db, id_workspace, id_test, id_user):
    test = get_test_by_id(db, id_test)
    if not test:
        raise HTTPException(404, "Test not found")

    if test["id_workspace"] != id_workspace:
        raise HTTPException(403, "Forbidden")

    run_id = start_run(
        id_workspace=id_workspace,
        run_type="test",
        id_test=id_test,
        name_test=test.get("name_test") or f"Тест #{id_test}",
        id_user=id_user
    )

    try:
        connection, base_url, auth_data = _get_workspace_connection(db, id_workspace)
        result, duration = _run_loaded_test(test, connection, base_url, auth_data)

        exec_id = create_test_execution(
            db=db,
            id_test=id_test,
            id_user=id_user,
            status=result["status"],
            failed_indexes=json.dumps(result["failed_indexes"]),
            time_execution=duration
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
    finally:
        finish_run(run_id)


def run_all_tests_service(db, id_workspace, id_user):
    tests = get_tests_by_workspace(db, id_workspace)
    if not tests:
        raise HTTPException(404, "Tests not found")

    connection, base_url, auth_data = _get_workspace_connection(db, id_workspace)
    run_name = f"{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}_all_tests"
    run_id = start_run(
        id_workspace=id_workspace,
        run_type="all_tests",
        name=run_name,
        id_user=id_user,
        test_ids=[test["id_test"] for test in tests],
        count=len(tests)
    )
    executions = []
    combined_log_parts = [
        f"RUN: {run_name}",
        f"WORKSPACE: {id_workspace}",
        "=" * 68
    ]

    try:
        for test in tests:
            test_name = test.get("name_test") or f"Тест #{test['id_test']}"
            combined_log_parts.extend([
                "",
                "=" * 68,
                f"TEST RUN: {test_name} | id_test={test['id_test']}",
                "=" * 68
            ])

            try:
                result, duration = _run_loaded_test(test, connection, base_url, auth_data)
                status = result["status"]
                failed_indexes = result["failed_indexes"]
                log_text = result.get("log") or ""
                combined_log_parts.append(log_text)
            except Exception as e:
                duration = 0
                status = "FAIL"
                failed_indexes = ["run_error"]
                log_text = f"An error occurred: {e}"
                combined_log_parts.append(log_text)

            exec_id = create_test_execution(
                db=db,
                id_test=test["id_test"],
                id_user=id_user,
                status=status,
                failed_indexes=json.dumps(failed_indexes),
                time_execution=duration
            )

            executions.append({
                "id_test_execution": exec_id,
                "id_test": test["id_test"],
                "name_test": test_name,
                "status": status,
                "failed_indexes": failed_indexes,
                "time_execution": duration
            })

        common_detail = json.dumps(
            {
                "name": run_name,
                "log": "\n".join(combined_log_parts),
                "is_all_tests": True,
                "execution_ids": [row["id_test_execution"] for row in executions],
                "test_ids": [row["id_test"] for row in executions]
            },
            ensure_ascii=False
        )

        for row in executions:
            try:
                create_log_execution(
                    db=db,
                    id_test_execution=row["id_test_execution"],
                    detail=common_detail
                )
            except Exception as e:
                print(f"[run_all_tests] failed to save common log: {e}")

        failed_count = sum(1 for row in executions if row["status"] == "FAIL" or row["failed_indexes"])
        return {
            "name": run_name,
            "status": "FAIL" if failed_count else "PASS",
            "count": len(executions),
            "failed_count": failed_count,
            "executions": executions
        }
    finally:
        finish_run(run_id)



def list_tests_service(db, id_workspace):
    return get_tests_preview_by_workspace(db, id_workspace)


def list_active_test_runs_service(id_workspace):
    return list_active_runs(id_workspace)


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


def list_workspace_test_executions_service(db, id_workspace, limit=100):
    rows = get_test_executions_by_workspace(db, id_workspace, limit=limit)
    for r in rows:
        if isinstance(r.get("failed_indexes"), str):
            try:
                r["failed_indexes"] = json.loads(r["failed_indexes"])
            except Exception:
                pass
        log_row = get_log_execution(db, r["id_test_execution"])
        if log_row and log_row.get("detail") is not None:
            detail = log_row["detail"]
            if isinstance(detail, str):
                try:
                    detail = json.loads(detail)
                except Exception:
                    detail = {}
            r["log_name"] = detail.get("name")
            r["is_all_tests"] = bool(detail.get("is_all_tests"))
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
