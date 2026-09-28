"""
MLflow Configuration & Utilities
==================================
Central configuration for MLflow experiment tracking across the
AI DevOps Automation Platform (AutoOps).

Tracking URI : ./mlruns  (local SQLite-backed file store)
MLflow UI    : mlflow ui --port 5001
"""

import os
import json
import mlflow
import mlflow.sklearn
import mlflow.xgboost
from contextlib import contextmanager
from pathlib import Path

os.environ["MLFLOW_ALLOW_FILE_STORE"] = "true"

# ─────────────────────────────────────────────────────────────
# Configuration Constants
# ─────────────────────────────────────────────────────────────

WORKSPACE_ROOT = os.path.dirname(os.path.abspath(__file__))
TRACKING_DIR = os.path.join(WORKSPACE_ROOT, "mlruns")
DB_PATH = os.path.join(WORKSPACE_ROOT, "mlflow.db")
TRACKING_URI = f"sqlite:///{DB_PATH}"
MLFLOW_UI_PORT = 5001


# Experiment Names
EXPERIMENT_DEVOPS = "devops-infrastructure"
EXPERIMENT_DEFECT = "defect-prediction"
EXPERIMENT_JM1 = "jm1-benchmark"


def init_mlflow(experiment_name=None):
    """
    Initialise MLflow tracking URI and optionally set the active experiment.

    Returns the experiment_id if an experiment_name is provided, else None.
    """
    mlflow.set_tracking_uri(TRACKING_URI)

    if experiment_name:
        return get_or_create_experiment(experiment_name)
    return None


def get_or_create_experiment(name):
    """
    Get an existing MLflow experiment by name, or create it if it doesn't exist.
    Returns the experiment_id (str).
    """
    os.makedirs(TRACKING_DIR, exist_ok=True)
    experiment = mlflow.get_experiment_by_name(name)
    if experiment is None:
        art_loc = Path(os.path.join(TRACKING_DIR, name)).as_uri()
        experiment_id = mlflow.create_experiment(
            name,
            artifact_location=art_loc,
        )
    else:
        experiment_id = experiment.experiment_id
    mlflow.set_experiment(name)
    return experiment_id



@contextmanager
def mlflow_run(experiment_name, run_name=None, nested=False, tags=None):
    """
    Context manager that wraps an MLflow run.

    Usage::

        with mlflow_run("devops-infrastructure", run_name="IF+RF Training") as run:
            mlflow.log_param("n_estimators", 100)
            mlflow.log_metric("accuracy", 0.99)
    """
    exp_id = init_mlflow(experiment_name)
    with mlflow.start_run(experiment_id=exp_id, run_name=run_name, nested=nested) as run:
        if tags:
            mlflow.set_tags(tags)
        yield run



def log_sklearn_model(model, artifact_path, input_example=None):
    """
    Log a scikit-learn (or XGBoost compatible) model to the active MLflow run.
    """
    try:
        if "xgboost" in type(model).__module__.lower():
            mlflow.xgboost.log_model(model, artifact_path=artifact_path, input_example=input_example)
        else:
            mlflow.sklearn.log_model(model, artifact_path=artifact_path, input_example=input_example)
    except Exception as e:
        print(f"[MLflow] Model logging warning: {e}")



def log_dict_as_artifact(data, filename):
    """
    Serialise a dictionary to JSON and log it as an MLflow artifact.
    """
    import tempfile
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(data, f, indent=2, default=str)
        tmp_path = f.name
    mlflow.log_artifact(tmp_path, artifact_path="reports")
    os.remove(tmp_path)


def log_dataframe_as_artifact(df, filename):
    """
    Save a pandas DataFrame to CSV and log it as an MLflow artifact.
    """
    import tempfile
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
        df.to_csv(f, index=False)
        tmp_path = f.name
    mlflow.log_artifact(tmp_path, artifact_path="data")
    os.remove(tmp_path)
