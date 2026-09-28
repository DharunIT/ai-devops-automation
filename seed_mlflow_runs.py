"""
Seed MLflow Runs
================
Executes all model training pipelines to generate tracked runs across all MLflow experiments:
1. DevOps Infrastructure (devops-infrastructure) - Isolation Forest & Failure Predictor RF
2. Defect Prediction (defect-prediction) - Random Forest & XGBoost Pipeline
3. NASA JM1 Benchmark (jm1-benchmark) - 9 Classifiers Suite
"""

import sys
import os

# Add workspace root to sys.path
WORKSPACE_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, WORKSPACE_ROOT)

from mlflow_config import init_mlflow, EXPERIMENT_DEVOPS, EXPERIMENT_DEFECT, EXPERIMENT_JM1
from backend.models import MLManager, generate_synthetic_data

def main():
    print("================================================================================")
    print("                EXECUTING MLFLOW SEEDING & TRAINING PIPELINES                   ")
    print("================================================================================")

    init_mlflow()

    # 1. DevOps Infrastructure Training
    print("\n[+] [1/3] Running DevOps Infrastructure ML Training...")
    try:
        df_devops = generate_synthetic_data()
        devops_res = MLManager.train_models(df_devops)
        print(f"   [OK] DevOps ML Retrain finished: {devops_res}")
    except Exception as e:
        print(f"   [ERROR] DevOps ML Retrain error: {e}")


    # 2. Software Defect Prediction Pipeline
    print("\n[+] [2/3] Running Software Defect Prediction Pipeline...")
    try:
        import run_defect_pipeline
        run_defect_pipeline.main()
        print("   [OK] Software Defect Prediction Pipeline finished.")
    except Exception as e:
        print(f"   [ERROR] Software Defect Prediction Pipeline error: {e}")

    # 3. NASA JM1 Benchmark Suite
    print("\n[+] [3/3] Running NASA JM1 Benchmark Suite...")
    try:
        import jm1_model_training
        print("   [OK] NASA JM1 Benchmark Suite finished.")
    except Exception as e:
        print(f"   [ERROR] NASA JM1 Benchmark Suite error: {e}")


    print("\n================================================================================")
    print("                MLFLOW SEEDING & PIPELINES EXECUTION COMPLETE                   ")
    print("================================================================================")

if __name__ == "__main__":
    main()
