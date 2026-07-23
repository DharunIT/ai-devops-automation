import os

# Base Directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = r"c:\Users\dharu\OneDrive\Desktop\software_defect_prediction_dataset.csv"
OUTPUT_DIR = os.path.join(BASE_DIR, "artifacts", "defect_outputs")
MODELS_DIR = os.path.join(OUTPUT_DIR, "models")
DATA_DIR = os.path.join(OUTPUT_DIR, "data")
PLOTS_DIR = os.path.join(OUTPUT_DIR, "plots")
REPORTS_DIR = os.path.join(OUTPUT_DIR, "reports")

for d in [OUTPUT_DIR, MODELS_DIR, DATA_DIR, PLOTS_DIR, REPORTS_DIR]:
    os.makedirs(d, exist_ok=True)

# Target & Data Specs
TARGET_COLUMN = 'defect'
TEST_SIZE = 0.20
RANDOM_STATE = 42
CV_FOLDS = 5

# Model Save Paths
RF_MODEL_PATH = os.path.join(MODELS_DIR, "defect_random_forest.joblib")
XGB_MODEL_PATH = os.path.join(MODELS_DIR, "defect_xgboost.joblib")
SCALER_PATH = os.path.join(MODELS_DIR, "defect_scaler.joblib")

# Output Data Paths
PREPROCESSED_DATA_PATH = os.path.join(DATA_DIR, "software_defect_preprocessed.csv")
TRAIN_DATA_PATH = os.path.join(DATA_DIR, "defect_train.csv")
TEST_DATA_PATH = os.path.join(DATA_DIR, "defect_test.csv")
REPORT_JSON_PATH = os.path.join(REPORTS_DIR, "evaluation_report.json")
REPORT_MD_PATH = os.path.join(REPORTS_DIR, "evaluation_report.md")

# Random Forest Hyperparameters
RF_PARAMS = {
    'n_estimators': 100,
    'max_depth': None,
    'random_state': RANDOM_STATE,
    'class_weight': 'balanced',
    'n_jobs': -1
}

# XGBoost Hyperparameters
XGB_PARAMS = {
    'n_estimators': 100,
    'max_depth': 6,
    'learning_rate': 0.1,
    'random_state': RANDOM_STATE,
    'eval_metric': 'logloss',
    'n_jobs': -1
}
