from fastapi import APIRouter, Depends

from app.schemas.test_schema import (
    TestPreview,
    TestDetail
)

from app.services.test_service import (
    list_tests_service,
    get_test_detail_service,
    delete_test_service,
    generate_tests_service,
    run_test_service,
    list_test_executions_service,
    get_test_execution_log_service,
    delete_test_execution_service,
    delete_all_test_logs_service
)

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.core.dependencies_access import check_workspace_access_dep


router = APIRouter()


@router.get("/{id_workspace}", response_model=list[TestPreview])
def list_tests(
    id_workspace: int,
    db=Depends(get_db),
    access=Depends(check_workspace_access_dep("read"))
):
    return list_tests_service(db, id_workspace)


@router.get("/{id_workspace}/detail/{id_test}", response_model=TestDetail)
def get_test_detail(
    id_workspace: int,
    id_test: int,
    db=Depends(get_db),
    access=Depends(check_workspace_access_dep("read"))
):
    return get_test_detail_service(db, id_workspace, id_test)


@router.delete("/{id_workspace}/{id_test}")
def delete_test(
    id_workspace: int,
    id_test: int,
    db=Depends(get_db),
    access=Depends(check_workspace_access_dep("delete"))
):
    return delete_test_service(db, id_workspace, id_test)


@router.post("/generate/{id_workspace}/{id_scenario}")
def generate_tests(
    id_workspace: int,
    id_scenario: int,
    db=Depends(get_db),
    access=Depends(check_workspace_access_dep("write"))
):
    return generate_tests_service(
        db=db,
        id_workspace=id_workspace,
        id_scenario=id_scenario
    )

@router.post("/{id_workspace}/run/{id_test}")
def run_test(
    id_workspace: int,
    id_test: int,
    user=Depends(get_current_user),
    db=Depends(get_db),
    access=Depends(check_workspace_access_dep("write"))
):
    return run_test_service(
        db=db,
        id_workspace=id_workspace,
        id_test=id_test,
        id_user=user["id_user"]
    )


@router.get("/{id_workspace}/executions/{id_test}")
def list_test_executions(
    id_workspace: int,
    id_test: int,
    db=Depends(get_db),
    access=Depends(check_workspace_access_dep("read"))
):
    return list_test_executions_service(db=db, id_workspace=id_workspace, id_test=id_test)


@router.get("/{id_workspace}/executions/log/{id_execution}")
def get_test_execution_log(
    id_workspace: int,
    id_execution: int,
    db=Depends(get_db),
    access=Depends(check_workspace_access_dep("read"))
):
    return get_test_execution_log_service(db=db, id_workspace=id_workspace, id_execution=id_execution)


@router.delete("/{id_workspace}/executions/log/{id_execution}")
def delete_test_execution_log(
    id_workspace: int,
    id_execution: int,
    db=Depends(get_db),
    access=Depends(check_workspace_access_dep("delete"))
):
    return delete_test_execution_service(db=db, id_workspace=id_workspace, id_execution=id_execution)


@router.delete("/{id_workspace}/executions/{id_test}")
def delete_all_test_logs(
    id_workspace: int,
    id_test: int,
    db=Depends(get_db),
    access=Depends(check_workspace_access_dep("delete"))
):
    return delete_all_test_logs_service(db=db, id_workspace=id_workspace, id_test=id_test)
