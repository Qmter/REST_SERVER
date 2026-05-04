from datetime import datetime, timezone
from threading import Lock
from uuid import uuid4


_lock = Lock()
_active_runs = {}


def start_run(id_workspace, run_type, **metadata):
    run_id = str(uuid4())
    run = {
        "run_id": run_id,
        "id_workspace": id_workspace,
        "type": run_type,
        "started_at": datetime.now(timezone.utc).isoformat(),
        **metadata,
    }
    with _lock:
        _active_runs[run_id] = run
    return run_id


def finish_run(run_id):
    with _lock:
        _active_runs.pop(run_id, None)


def list_active_runs(id_workspace):
    with _lock:
        return [
            run.copy()
            for run in _active_runs.values()
            if run["id_workspace"] == id_workspace
        ]
