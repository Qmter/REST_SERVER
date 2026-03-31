from fastapi import Depends, HTTPException, Path
from app.db.database import get_db
from app.core.dependencies import get_current_user

ROLE_LEVEL = {
    "viewer": 1,
    "editor": 2,
    "owner": 3
}

REQUIRED_LEVEL = {
    "read": 1,
    "write": 2,
    "delete": 3
}


def check_workspace_access_dep(required: str):
    def dependency(
        id_workspace: int = Path(...),
        user=Depends(get_current_user),
        db=Depends(get_db)
    ):  
        print("ACCESS")
        print("USER:", user)
        print("WORKSPACE:", id_workspace)
        with db.cursor() as cursor:
            cursor.execute(
                """
                SELECT at.name_access_type
                FROM workspace_users wu
                JOIN access_type at ON wu.id_access_type = at.id_access_type
                WHERE wu.id_workspace = %s AND wu.id_user = %s
                """,
                (id_workspace, user["id_user"])
            )

            row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=403, detail="No access to workspace")

        role = row["name_access_type"]
        print(f"role = {role}")

        if ROLE_LEVEL[role] < REQUIRED_LEVEL[required]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        print(f"required = {required}")
        return True
    

    return dependency