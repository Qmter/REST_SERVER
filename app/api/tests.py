from fastapi import APIRouter, Depends

from app.schemas.test_schema import (
    TestPreview,
    TestDetail
)

from app.services.test_service import (
    list_tests_service,
    get_test_detail_service,
    delete_test_service,
    generate_tests_service
)

from app.db.database import get_db
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