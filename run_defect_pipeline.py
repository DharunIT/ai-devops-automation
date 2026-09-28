import sys
import os
import pandas as pd

# Add workspace to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from defect_prediction.config import (
    REPORT_JSON_PATH, REPORT_MD_PATH
)
from defect_prediction.preprocessing import run_preprocessing_pipeline
from defect_prediction.train_random_forest import train_random_forest_model
from defect_prediction.train_xgboost import train_xgboost_model
from defect_prediction.evaluation import evaluate_model
from defect_prediction.visualization import generate_all_visualizations
from defect_prediction.utils import logger, export_json, export_markdown_report
from mlflow_config import mlflow_run, EXPERIMENT_DEFECT
import mlflow

def main():
    logger.info("================================================================================")
    logger.info("       SOFTWARE DEFECT PREDICTION PIPELINE AUDIT & REFACTORING PIPELINE        ")
    logger.info("================================================================================")

    # 1. Execute Preprocessing & Sanity Audit
    prep_data = run_preprocessing_pipeline()
    X_train = prep_data["X_train"]
    X_test = prep_data["X_test"]
    y_train = prep_data["y_train"]
    y_test = prep_data["y_test"]
    audit_summary = prep_data["audit_summary"]
    raw_df = prep_data["raw_df"]

    # ── MLflow: Wrap full pipeline in a parent run ──
    try:
        with mlflow_run(EXPERIMENT_DEFECT, run_name="Defect Pipeline Run",
                        tags={"pipeline": "defect_prediction", "dataset_size": str(len(raw_df))}) as parent_run:
            mlflow.log_param("train_size", len(X_train))
            mlflow.log_param("test_size", len(X_test))
            mlflow.log_param("feature_count", len(X_train.columns))
            mlflow.log_param("features", ", ".join(X_train.columns.tolist()))

            # 2. Train Random Forest Classifier (nested run)
            with mlflow_run(EXPERIMENT_DEFECT, run_name="Random Forest Training", nested=True,
                            tags={"model_type": "random_forest"}) as rf_run:
                rf_model, rf_fi = train_random_forest_model(X_train, y_train)
                rf_eval = evaluate_model(rf_model, X_train, y_train, X_test, y_test, "Random Forest")

            # 3. Train XGBoost Classifier (nested run)
            with mlflow_run(EXPERIMENT_DEFECT, run_name="XGBoost Training", nested=True,
                            tags={"model_type": "xgboost"}) as xgb_run:
                xgb_model, xgb_fi = train_xgboost_model(X_train, y_train)
                xgb_eval = evaluate_model(xgb_model, X_train, y_train, X_test, y_test, "XGBoost")

            # Log summary metrics to parent run
            mlflow.log_metric("rf_accuracy", rf_eval["accuracy"])
            mlflow.log_metric("rf_f1_score", rf_eval["f1_score"])
            mlflow.log_metric("xgb_accuracy", xgb_eval["accuracy"])
            mlflow.log_metric("xgb_f1_score", xgb_eval["f1_score"])

            logger.info("[MLflow] Defect pipeline runs logged successfully.")
    except Exception as e:
        logger.warning(f"[MLflow] Pipeline tracking failed — {e}. Running without MLflow.")
        # Fallback: run without MLflow wrapping
        rf_model, rf_fi = train_random_forest_model(X_train, y_train)
        xgb_model, xgb_fi = train_xgboost_model(X_train, y_train)
        rf_eval = evaluate_model(rf_model, X_train, y_train, X_test, y_test, "Random Forest")
        xgb_eval = evaluate_model(xgb_model, X_train, y_train, X_test, y_test, "XGBoost")

    # Add Top 20 features to eval dict
    rf_eval["top_features"] = list(zip(rf_fi['feature'], rf_fi['importance']))
    xgb_eval["top_features"] = list(zip(xgb_fi['feature'], xgb_fi['importance']))

    # 5. Generate All Visualizations
    generate_all_visualizations(y_test, rf_eval, xgb_eval, rf_fi, xgb_fi, raw_df)

    # 6. Audit & Explanatory Summary
    summary_text = (
        "### Audit Explanation for 100% Accuracy Findings:\n"
        "1. **Synthetic Rule Boundary**: The input dataset (`software_defect_prediction_dataset.csv`) contains "
        "60,000 synthetic software metric samples created using deterministic decision logic:\n"
        "   `defect = 1` IF `(past_defects > 10)` OR `(static_analysis_warnings > 200)` OR `(cyclomatic_complexity > 25)` OR `(test_coverage <= 0.39)` ELSE `0`.\n"
        "   This rule matches **100.00%** of rows in the dataset. Because tree-based models (Decision Trees, Random Forests, XGBoost) "
        "recursively partition continuous metric spaces, they discover this exact 4-rule boundary with zero classification entropy.\n"
        "2. **StandardScaler Leakage Fixed**: Previously, `StandardScaler.fit_transform()` was called on the whole dataset before train-test split. "
        "In this refactored pipeline, scaling parameters ($\\mu, \\sigma$) are computed **strictly on the training set** and applied to the test set using `.transform()`.\n"
        "3. **Target Leakage Removed**: Engineered features no longer include target-derived interaction features. All feature transformations rely strictly on independent variables."
    )

    combined_report = {
        "summary_text": summary_text,
        "audit_findings": audit_summary,
        "models": {
            "Random Forest": rf_eval,
            "XGBoost": xgb_eval
        }
    }

    # Export Reports
    export_json(combined_report, REPORT_JSON_PATH)
    export_markdown_report(combined_report, REPORT_MD_PATH)

    logger.info("================================================================================")
    logger.info("       PIPELINE EXECUTION AND AUDIT COMPLETED SUCCESSFULLY                     ")
    logger.info("================================================================================")

if __name__ == "__main__":
    main()
