from fastapi import HTTPException

from app.repositories.workspace_repo import (
    create_workspace,
    get_workspaces_by_user,
    get_workspace_by_id,
    get_access_type_by_name,
    get_workspace_membership,
    delete_workspace,
    delete_workspace_users,
    list_workspace_members,
    add_workspace_member,
    delete_workspace_member
)
from app.repositories.connection_repo import delete_connections_by_workspace
from app.repositories.user_repo import get_user_by_username


def create_workspace_service(db, id_user, name_workspace, description):

    dict_id_access_type = get_access_type_by_name(db=db, name_access_type="owner")
    id_access_type = dict_id_access_type["id_access_type"]

    return create_workspace(
        db=db, 
        id_user=id_user, 
        name_workspace=name_workspace, 
        description=description,
        id_access_type=id_access_type
        )
    


def list_workspaces_service(db, id_user):

    return get_workspaces_by_user(
        db=db, 
        id_user=id_user
        )


def delete_workspace_service(db, id_user, id_workspace):

    workspace = get_workspace_by_id(
        db=db, 
        id_workspace=id_workspace
        )

    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    owner_access = get_access_type_by_name(db=db, name_access_type="owner")
    owner_access_id = owner_access["id_access_type"]

    membership = get_workspace_membership(db=db, id_workspace=id_workspace, id_user=id_user)

    if not membership or membership["id_access_type"] != owner_access_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # remove related connections to avoid FK issues
    delete_connections_by_workspace(db=db, id_workspace=id_workspace)
    delete_workspace_users(db=db, id_workspace=id_workspace)

    delete_workspace(
        db=db, 
        id_workspace=id_workspace
        )


def list_workspace_members_service(db, id_workspace, id_user):
    owner_access = get_access_type_by_name(db=db, name_access_type="owner")["id_access_type"]
    membership = get_workspace_membership(db=db, id_workspace=id_workspace, id_user=id_user)
    if not membership or membership["id_access_type"] != owner_access:
        raise HTTPException(status_code=403, detail="Only owner can view members")
    return list_workspace_members(db=db, id_workspace=id_workspace)


def add_workspace_member_service(db, id_workspace, id_user_actor, username, access_name):
    owner_access = get_access_type_by_name(db=db, name_access_type="owner")["id_access_type"]
    actor_membership = get_workspace_membership(db=db, id_workspace=id_workspace, id_user=id_user_actor)
    if not actor_membership or actor_membership["id_access_type"] != owner_access:
        raise HTTPException(status_code=403, detail="Only owner can share workspace")

    target_user = get_user_by_username(db=db, username=username)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    access = get_access_type_by_name(db=db, name_access_type=access_name)
    if not access:
        raise HTTPException(status_code=400, detail="Invalid access type")

    # запрет понижения владельца (включая себя)
    target_membership = get_workspace_membership(db=db, id_workspace=id_workspace, id_user=target_user["id_user"])
    if target_membership and target_membership["id_access_type"] == owner_access and access_name != "owner":
        raise HTTPException(status_code=400, detail="Нельзя понизить владельца")

    if target_user["id_user"] == id_user_actor and access_name != "owner":
        raise HTTPException(status_code=400, detail="Нельзя понизить собственные права владельца")

    add_workspace_member(
        db=db,
        id_workspace=id_workspace,
        id_user=target_user["id_user"],
        id_access_type=access["id_access_type"]
    )

    return {"status": "added", "id_user": target_user["id_user"]}


def delete_workspace_member_service(db, id_workspace, id_user_actor, id_user_target):
    owner_access = get_access_type_by_name(db=db, name_access_type="owner")["id_access_type"]
    actor_membership = get_workspace_membership(db=db, id_workspace=id_workspace, id_user=id_user_actor)
    if not actor_membership or actor_membership["id_access_type"] != owner_access:
        raise HTTPException(status_code=403, detail="Only owner can manage members")
    # prevent removing owner record itself
    target_membership = get_workspace_membership(db=db, id_workspace=id_workspace, id_user=id_user_target)
    if not target_membership:
        raise HTTPException(status_code=404, detail="Member not found")
    if target_membership["id_access_type"] == owner_access:
        raise HTTPException(status_code=400, detail="Нельзя удалить владельца")

    delete_workspace_member(db=db, id_workspace=id_workspace, id_user=id_user_target)
    return {"status": "removed", "id_user": id_user_target}
