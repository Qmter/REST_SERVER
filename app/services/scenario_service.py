import json
from fastapi import HTTPException

from app.repositories.scenario_repo import (
    create_scenario,
    get_scenarios_by_workspace,
    get_scenarios_preview,
    get_scenario_by_id,
    delete_scenario,
    update_scenario
)

from app.repositories.workspace_repo import get_workspace_by_id


def create_scenario_service(db, id_workspace, data):

    workspace = get_workspace_by_id(db, id_workspace)

    if not workspace:
        raise HTTPException(404, "Workspace not found")

    content_json = json.dumps(data.content_scenario)

    return create_scenario(
        db=db,
        id_workspace=id_workspace,
        name_scenario=data.name_scenario,
        content_scenario=content_json
    )


def list_scenarios_service(db, id_workspace):
    return get_scenarios_preview(db, id_workspace)


def get_scenario_detail_service(db, id_workspace, id_scenario):

    scenario = get_scenario_by_id(db, id_scenario)

    if not scenario:
        raise HTTPException(404, "Scenario not found")

    if scenario["id_workspace"] != id_workspace:
        raise HTTPException(403, "Scenario does not belong to workspace")

    if isinstance(scenario["content_scenario"], str):
        scenario["content_scenario"] = json.loads(scenario["content_scenario"])

    return scenario

def delete_scenario_service(db, id_scenario, id_user):

    with db.cursor() as cursor:
        cursor.execute(
            """
            SELECT id_workspace FROM scenarios WHERE id_scenario = %s
            """,
            (id_scenario,)
        )
        row = cursor.fetchone()

    if not row:
        raise HTTPException(404, "Scenario not found")

    delete_scenario(db, id_scenario)

    return {"status": "deleted"}

def update_scenario_service(db, id_workspace, id_scenario, data):

    scenario = get_scenario_by_id(db, id_scenario)

    if not scenario:
        raise HTTPException(404, "Scenario not found")

    # защита от подмены
    if scenario["id_workspace"] != id_workspace:
        raise HTTPException(403, "Forbidden")

    # берём старые значения если не передали новые
    name = data.name_scenario or scenario["name_scenario"]

    if data.content_scenario is not None:
        content = json.dumps(data.content_scenario)
    else:
        content = scenario["content_scenario"]

    update_scenario(
        db=db,
        id_scenario=id_scenario,
        name_scenario=name,
        content_scenario=content
    )

    return {"status": "updated"}