import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from defect_prediction.config import XGB_PARAMS, XGB_MODEL_PATH
from defect_prediction.utils import logger, save_artifact
from mlflow_config import mlflow_run, log_sklearn_model, log_dict_as_artifact, EXPERIMENT_DEFECT
import mlflow

def train_xgboost_model(X_train: pd.DataFrame, y_train: pd.Series):
    """
    Trains XGBoost classifier with imbalance compensation (scale_pos_weight).
    Logs hyperparameters, model, and feature importances to MLflow.

    Returns:
    - Trained XGBClassifier instance
    - Top feature importances DataFrame
    """
    params = XGB_PARAMS.copy()

    # Calculate scale_pos_weight for imbalance handling: count(negative) / count(positive)
    neg_count = (y_train == 0).sum()
    pos_count = (y_train == 1).sum()
    scale_pos_weight = float(neg_count / (pos_count + 1e-5))
    params['scale_pos_weight'] = scale_pos_weight

    logger.info(f"Training XGBoost Classifier with scale_pos_weight={scale_pos_weight:.2f} and parameters: {params}")
    model = XGBClassifier(**params)
    model.fit(X_train, y_train)
    logger.info("XGBoost training completed successfully.")

    # Save model artifact
    save_artifact(model, XGB_MODEL_PATH)

    # Feature Importance Extraction
    importances = model.feature_importances_
    feature_names = X_train.columns
    fi_df = pd.DataFrame({
        'feature': feature_names,
        'importance': importances
    }).sort_values(by='importance', ascending=False).reset_index(drop=True)

    logger.info(f"Top 5 XGBoost Features:\n{fi_df.head(5).to_string(index=False)}")

    # ── MLflow Logging ──
    try:
        mlflow.log_params({f'xgb_{k}': v for k, v in params.items()})
        log_sklearn_model(model, artifact_path='xgboost')
        fi_dict = {row['feature']: float(row['importance']) for _, row in fi_df.head(20).iterrows()}
        log_dict_as_artifact(fi_dict, 'xgb_feature_importances.json')
        logger.info("[MLflow] XGBoost params, model, and features logged.")
    except Exception as e:
        logger.warning(f"[MLflow] Failed to log XGBoost artifacts — {e}")

    return model, fi_df
