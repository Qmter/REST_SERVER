from fastapi import APIRouter, Depends

from app.schemas.scenario_schema import (
    ScenarioCreate,
    ScenarioResponse,
    ScenarioUpdate
)

from app.services.scenario_service import (
    create_scenario_service,
    list_scenarios_service,
    delete_scenario_service,
    get_scenario_detail_service,
    update_scenario_service
)

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.core.dependencies_access import check_workspace_access_dep


router = APIRouter()


@router.post("/{id_workspace}", response_model=int)
def create_scenario(
    id_workspace: int,
    data: ScenarioCreate,
    db=Depends(get_db),
    access=Depends(check_workspace_access_dep("write"))
):
    return create_scenario_service(
        db=db,
        id_workspace=id_workspace,
        data=data
    )

@router.patch("/{id_workspace}/{id_scenario}")
def update_scenario(
    id_workspace: int,
    id_scenario: int,
    data: ScenarioUpdate,
    db=Depends(get_db),
    access=Depends(check_workspace_access_dep("write"))
):
    return update_scenario_service(
        db=db,
        id_workspace=id_workspace,
        id_scenario=id_scenario,
        data=data
    )


@router.get("/{id_workspace}")
def list_scenarios(
    id_workspace: int,
    db=Depends(get_db),
    access=Depends(check_workspace_access_dep("read"))
):
    return list_scenarios_service(
        db=db, 
        id_workspace=id_workspace)


@router.get("/{id_workspace}/detail/{id_scenario}", response_model=ScenarioResponse)
def get_scenario_detail(
    id_workspace: int,
    id_scenario: int,
    db=Depends(get_db),
    access=Depends(check_workspace_access_dep("read"))
):
    return get_scenario_detail_service(
        db=db,
        id_workspace=id_workspace,
        id_scenario=id_scenario
    )


@router.delete("/{id_scenario}")
def delete_scenario(
    id_scenario: int,
    db=Depends(get_db),
    user=Depends(get_current_user),
    access=Depends(check_workspace_access_dep("delete"))
):
    return delete_scenario_service(
        db=db,
        id_scenario=id_scenario,
        id_user=user["id_user"]
    )