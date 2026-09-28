import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)
from sklearn.model_selection import StratifiedKFold, cross_val_score
from defect_prediction.config import CV_FOLDS, RANDOM_STATE
from defect_prediction.utils import logger
import mlflow

def evaluate_model(model, X_train: pd.DataFrame, y_train: pd.Series, X_test: pd.DataFrame, y_test: pd.Series, model_name: str):
    """
    Evaluates classifier across multiple metrics, 5-fold cross-validation, and checks for overfitting.
    """
    logger.info(f"Evaluating {model_name} Classifier...")

    # Predictions
    y_pred = model.predict(X_test)
    y_train_pred = model.predict(X_train)

    if hasattr(model, "predict_proba"):
        y_prob = model.predict_proba(X_test)[:, 1]
    else:
        y_prob = y_pred

    # Standard Classification Metrics
    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_test, y_prob)) if len(np.unique(y_test)) > 1 else 0.5
    cm = confusion_matrix(y_test, y_pred).tolist()
    clf_report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

    # Train Accuracy for Overfitting Check
    train_acc = float(accuracy_score(y_train, y_train_pred))
    overfit_gap = float(train_acc - acc)

    # Stratified K-Fold Cross Validation
    logger.info(f"Running {CV_FOLDS}-Fold Stratified Cross-Validation for {model_name}...")
    skf = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    cv_scores = cross_val_score(model, X_train, y_train, cv=skf, scoring='accuracy', n_jobs=-1)
    cv_mean = float(np.mean(cv_scores))
    cv_std = float(np.std(cv_scores))

    logger.info(f"[{model_name}] Test Acc: {acc:.4f} | Prec: {prec:.4f} | Rec: {rec:.4f} | F1: {f1:.4f} | ROC-AUC: {roc_auc:.4f}")
    logger.info(f"[{model_name}] Train Acc: {train_acc:.4f} | Overfitting Gap (Train-Test): {overfit_gap:.4f}")
    logger.info(f"[{model_name}] {CV_FOLDS}-Fold CV Accuracy: {cv_mean:.4f} (+/- {cv_std:.4f})")

    # Overfitting assessment string
    if overfit_gap > 0.05:
        overfit_status = f"Slight overfitting detected (Train-Test gap = {overfit_gap:.2%})"
    elif overfit_gap < -0.02:
        overfit_status = "Underfitting or noisy split detected"
    else:
        overfit_status = "Good generalization (No severe overfitting)"

    result = {
        "model_name": model_name,
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1_score": f1,
        "roc_auc": roc_auc,
        "train_acc": train_acc,
        "overfit_gap": overfit_gap,
        "overfit_status": overfit_status,
        "cv_scores": [float(s) for s in cv_scores],
        "cv_mean_acc": cv_mean,
        "cv_std_acc": cv_std,
        "confusion_matrix": cm,
        "classification_report": clf_report,
        "y_prob": y_prob.tolist(),
        "y_pred": y_pred.tolist()
    }

    # ── MLflow Logging ──
    try:
        prefix = model_name.lower().replace(" ", "_")
        mlflow.log_metric(f'{prefix}_accuracy', acc)
        mlflow.log_metric(f'{prefix}_precision', prec)
        mlflow.log_metric(f'{prefix}_recall', rec)
        mlflow.log_metric(f'{prefix}_f1_score', f1)
        mlflow.log_metric(f'{prefix}_roc_auc', roc_auc)
        mlflow.log_metric(f'{prefix}_train_accuracy', train_acc)
        mlflow.log_metric(f'{prefix}_overfit_gap', overfit_gap)
        mlflow.log_metric(f'{prefix}_cv_mean_accuracy', cv_mean)
        mlflow.log_metric(f'{prefix}_cv_std', cv_std)
        logger.info(f"[MLflow] {model_name} evaluation metrics logged successfully.")
    except Exception as e:
        logger.warning(f"[MLflow] Failed to log {model_name} evaluation metrics — {e}")

    return result
