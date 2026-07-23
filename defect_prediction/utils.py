import logging
import json
import joblib
import pandas as pd
import numpy as np

def setup_logger():
    """Configures structured console logging for the pipeline."""
    logger = logging.getLogger("DefectPrediction")
    logger.setLevel(logging.INFO)
    if not logger.handlers:
        ch = logging.StreamHandler()
        ch.setLevel(logging.INFO)
        formatter = logging.Formatter('[%(asctime)s] [%(levelname)s] %(message)s', datefmt='%H:%M:%S')
        ch.setFormatter(formatter)
        logger.addHandler(ch)
    return logger

logger = setup_logger()

def save_artifact(obj, filepath):
    """Saves a model, scaler, or Python object using joblib."""
    joblib.dump(obj, filepath)
    logger.info(f"Saved artifact to: {filepath}")

def load_artifact(filepath):
    """Loads a saved joblib artifact."""
    obj = joblib.load(filepath)
    logger.info(f"Loaded artifact from: {filepath}")
    return obj

def export_json(data, filepath):
    """Exports dictionary results to a JSON file."""
    def convert_types(o):
        if isinstance(o, (np.int64, np.int32, np.int16)):
            return int(o)
        if isinstance(o, (np.float64, np.float32, np.float16)):
            return float(o)
        if isinstance(o, np.ndarray):
            return o.tolist()
        return str(o)

    with open(filepath, 'w') as f:
        json.dump(data, f, indent=4, default=convert_types)
    logger.info(f"Exported report to: {filepath}")

def export_markdown_report(data, filepath):
    """Generates a clean, readable Markdown report of evaluation results."""
    md = []
    md.append("# Software Defect Prediction Pipeline Audit & Performance Report\n")
    md.append("## Executive Summary\n")
    md.append(data.get("summary_text", "Audit complete."))
    md.append("\n---\n")
    
    md.append("## 1. Data Audit & Leakage Audit Findings\n")
    audit = data.get("audit_findings", {})
    md.append(f"- **Total Rows:** {audit.get('total_rows')}")
    md.append(f"- **Total Features:** {audit.get('total_features')}")
    md.append(f"- **Missing Values:** {audit.get('missing_values')}")
    md.append(f"- **Duplicate Rows:** {audit.get('duplicate_rows')}")
    md.append(f"- **Class Distribution:** Defect (1): {audit.get('class_distribution', {}).get(1, 0)}, Non-Defect (0): {audit.get('class_distribution', {}).get(0, 0)}")
    md.append(f"- **Synthetic Rule Detected:** `{audit.get('synthetic_rule', 'None')}`")
    md.append(f"- **Rule Match Accuracy:** {audit.get('rule_match_percentage', 0):.2f}%\n")

    md.append("## 2. Model Performance Comparison\n")
    md.append("| Metric | Random Forest | XGBoost |")
    md.append("|---|---|---|")
    rf_m = data.get("models", {}).get("Random Forest", {})
    xgb_m = data.get("models", {}).get("XGBoost", {})
    
    for metric in ["accuracy", "precision", "recall", "f1_score", "roc_auc", "cv_mean_acc", "cv_std_acc", "train_acc"]:
        rf_val = rf_m.get(metric, 0)
        xgb_val = xgb_m.get(metric, 0)
        if isinstance(rf_val, float):
            md.append(f"| **{metric.replace('_', ' ').title()}** | {rf_val:.4f} | {xgb_val:.4f} |")
        else:
            md.append(f"| **{metric.replace('_', ' ').title()}** | {rf_val} | {xgb_val} |")

    md.append("\n---\n")
    md.append("## 3. Top 10 Feature Importances\n")
    md.append("### Random Forest")
    rf_imp = rf_m.get("top_features", [])
    for feat, imp in rf_imp[:10]:
        md.append(f"- **{feat}**: {imp:.4f}")

    md.append("\n### XGBoost")
    xgb_imp = xgb_m.get("top_features", [])
    for feat, imp in xgb_imp[:10]:
        md.append(f"- **{feat}**: {imp:.4f}")

    with open(filepath, 'w') as f:
        f.write("\n".join(md))
    logger.info(f"Exported Markdown evaluation report to: {filepath}")
