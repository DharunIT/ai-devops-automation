"""
JM1 Software Defect Prediction - Model Training & Accuracy Evaluation
======================================================================
Dataset: NASA JM1 (McCabe & Halstead features, 10885 instances, 21 features)
Target : defects (true/false) — binary classification
"""

import io
import urllib.request
import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix,
    roc_auc_score, f1_score, precision_score, recall_score
)
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import (
    RandomForestClassifier, GradientBoostingClassifier,
    AdaBoostClassifier, ExtraTreesClassifier
)
from sklearn.naive_bayes import GaussianNB
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from mlflow_config import mlflow_run, log_sklearn_model, log_dict_as_artifact, EXPERIMENT_JM1
import mlflow

# ─────────────────────────────────────────────────────────────
# 1. LOAD DATA (try local CSV first, then ARFF from PROMISE repo)
# ─────────────────────────────────────────────────────────────

COLUMNS = [
    "loc", "v(g)", "ev(g)", "iv(g)", "n", "v", "l", "d",
    "i", "e", "b", "t", "lOCode", "lOComment", "lOBlank",
    "lOCodeAndComment", "uniq_Op", "uniq_Opnd", "total_Op",
    "total_Opnd", "branchCount", "defects"
]

def load_from_arff(filepath):
    """Parse a simple ARFF file and return a DataFrame."""
    lines = []
    data_section = False
    with open(filepath, "r", errors="replace") as f:
        for line in f:
            line = line.strip()
            if line.lower() == "@data":
                data_section = True
                continue
            if data_section and line and not line.startswith("%"):
                lines.append(line)
    rows = []
    for line in lines:
        parts = [p.strip() for p in line.split(",")]
        rows.append(parts)
    df = pd.DataFrame(rows, columns=COLUMNS)
    for col in COLUMNS[:-1]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df["defects"] = df["defects"].str.strip().str.lower().map({"true": 1, "false": 0})
    return df

def load_from_csv(filepath):
    """Load from CSV with defects column."""
    df = pd.read_csv(filepath)
    if "defects" in df.columns:
        df["defects"] = df["defects"].astype(str).str.strip().str.lower()
        df["defects"] = df["defects"].map({"true": 1, "false": 0, "1": 1, "0": 0})
    return df

# Try loading from workspace (copied files)
import os
workspace = r"C:\Users\dharu\OneDrive\Desktop\ai-devops-automation"
arff_path = os.path.join(workspace, "jm1_real.arff")   # downloaded from OpenML
csv_path  = os.path.join(workspace, "jm1.csv")

df = None

if os.path.exists(arff_path):
    print("[+] Loading from local ARFF file...")
    df = load_from_arff(arff_path)
elif os.path.exists(csv_path):
    print("[+] Loading from local CSV file...")
    df = load_from_csv(csv_path)
else:
    # Download from OpenML (public mirror of PROMISE datasets)
    print("[+] Downloading JM1 dataset from OpenML API...")
    url = "https://api.openml.org/data/v1/download/1053987"   # JM1 CSV on OpenML
    try:
        req = urllib.request.Request(url, headers={"Accept": "text/plain"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
        df = pd.read_csv(io.StringIO(raw))
        # Normalize column names (OpenML may differ slightly)
        df.columns = [c.strip().lower() for c in df.columns]
        if "class" in df.columns:
            df.rename(columns={"class": "defects"}, inplace=True)
        df["defects"] = df["defects"].astype(str).str.strip().str.lower()
        df["defects"] = df["defects"].map({"true": 1, "false": 0, "1": 1, "0": 0})
        print("[OK] Downloaded successfully!")
    except Exception as ex:
        print(f"[ERROR] Download failed: {ex}")
        print("Generating synthetic JM1-like dataset for demo purposes...")
        rng = np.random.default_rng(42)
        n = 10885
        X_syn = rng.exponential(scale=[5,3,2,2,50,200,0.1,20,10,5000,0.05,300,5,2,1,0.5,10,10,50,50,3], size=(n, 21))
        y_syn = (rng.random(n) < 0.8).astype(int)
        df = pd.DataFrame(X_syn, columns=COLUMNS[:-1])
        df["defects"] = y_syn

print(f"\n[OK] Dataset loaded: {df.shape[0]} rows x {df.shape[1]} columns")
print(f"   Class distribution:\n{df['defects'].value_counts().rename({0:'No Defect (false)', 1:'Defect (true)'})}")

# ─────────────────────────────────────────────────────────────
# 2. PREPARE FEATURES & TARGET
# ─────────────────────────────────────────────────────────────
feature_cols = [c for c in df.columns if c != "defects"]
X = df[feature_cols]
y = df["defects"]

# Drop rows where target is NaN
mask = y.notna()
X, y = X[mask], y[mask]
y = y.astype(int)

print(f"\n[+] Features : {len(feature_cols)}")
print(f"   Samples  : {len(y)}")
print(f"   Defective: {y.sum()} ({y.mean()*100:.1f}%)")

# ─────────────────────────────────────────────────────────────
# 3. TRAIN / TEST SPLIT  (80 / 20, stratified)
# ─────────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)

# ─────────────────────────────────────────────────────────────
# 4. BUILD MODELS
# ─────────────────────────────────────────────────────────────
models = {
    "Logistic Regression"       : LogisticRegression(max_iter=1000, random_state=42),
    "Naive Bayes"               : GaussianNB(),
    "Decision Tree"             : DecisionTreeClassifier(random_state=42),
    "K-Nearest Neighbors"       : KNeighborsClassifier(n_neighbors=5),
    "Random Forest"             : RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1),
    "Extra Trees"               : ExtraTreesClassifier(n_estimators=200, random_state=42, n_jobs=-1),
    "AdaBoost"                  : AdaBoostClassifier(n_estimators=100, random_state=42),
    "Gradient Boosting"         : GradientBoostingClassifier(n_estimators=100, random_state=42),
    "SVM (RBF)"                 : SVC(kernel="rbf", probability=True, random_state=42),
}

# Each model is wrapped in an imputer + scaler pipeline
def make_pipeline(model):
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler",  StandardScaler()),
        ("model",   model),
    ])

# ─────────────────────────────────────────────────────────────
# 5. TRAIN & EVALUATE
# ─────────────────────────────────────────────────────────────
SEPARATOR = "=" * 80
print(f"\n{SEPARATOR}")
print("  JM1 SOFTWARE DEFECT PREDICTION — MODEL COMPARISON")
print(SEPARATOR)

results = []
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

try:
    with mlflow_run(EXPERIMENT_JM1, run_name="JM1 Benchmark Suite",
                    tags={"dataset": "NASA_JM1", "instances": str(len(df))}) as parent_run:
        mlflow.log_param("dataset_rows", len(df))
        mlflow.log_param("num_features", len(feature_cols))
        mlflow.log_param("train_samples", len(X_train))
        mlflow.log_param("test_samples", len(X_test))

        for name, model in models.items():
            pipe = make_pipeline(model)

            # 5-fold CV accuracy
            cv_scores = cross_val_score(pipe, X_train, y_train, cv=cv, scoring="accuracy", n_jobs=-1)

            # Fit on full training set
            pipe.fit(X_train, y_train)
            y_pred = pipe.predict(X_test)
            y_prob = pipe.predict_proba(X_test)[:, 1] if hasattr(pipe.named_steps["model"], "predict_proba") else None

            acc   = accuracy_score(y_test, y_pred)
            prec  = precision_score(y_test, y_pred, zero_division=0)
            rec   = recall_score(y_test, y_pred, zero_division=0)
            f1    = f1_score(y_test, y_pred, zero_division=0)
            auc   = roc_auc_score(y_test, y_prob) if y_prob is not None else float("nan")

            results.append({
                "Model"           : name,
                "CV Accuracy (5F)": f"{cv_scores.mean()*100:.2f}% ± {cv_scores.std()*100:.2f}%",
                "Test Accuracy"   : acc,
                "Precision"       : prec,
                "Recall (PD)"     : rec,
                "F1 Score"        : f1,
                "ROC-AUC"         : auc,
            })

            # Nested MLflow Run per Classifier
            try:
                clean_name = name.lower().replace(" ", "_").replace("(", "").replace(")", "")
                with mlflow_run(EXPERIMENT_JM1, run_name=f"JM1 - {name}", nested=True,
                                tags={"model_type": name}) as child_run:
                    mlflow.log_param("model_name", name)
                    mlflow.log_metric("accuracy", float(acc))
                    mlflow.log_metric("cv_mean_accuracy", float(cv_scores.mean()))
                    mlflow.log_metric("cv_std", float(cv_scores.std()))
                    mlflow.log_metric("precision", float(prec))
                    mlflow.log_metric("recall", float(rec))
                    mlflow.log_metric("f1_score", float(f1))
                    if not np.isnan(auc):
                        mlflow.log_metric("roc_auc", float(auc))
                    log_sklearn_model(pipe, artifact_path=f"model_{clean_name}")
            except Exception as ex:
                print(f"[MLflow] Warning: Failed to log child run for {name}: {ex}")

            print(f"\n{'─'*70}")
            print(f"  [+] {name}")
            print(f"{'─'*70}")
            print(f"  CV Accuracy (5-fold) : {cv_scores.mean()*100:.2f}% ± {cv_scores.std()*100:.2f}%")
            print(f"  Test Accuracy        : {acc*100:.2f}%")
            print(f"  Precision            : {prec:.4f}")
            print(f"  Recall (PD)          : {rec:.4f}")
            print(f"  F1 Score             : {f1:.4f}")
            print(f"  ROC-AUC              : {auc:.4f}" if not np.isnan(auc) else "  ROC-AUC              : N/A")
            cm = confusion_matrix(y_test, y_pred)
            print(f"  Confusion Matrix     :\n    {cm}")

        # Log overall summary metrics to parent run
        best_model_run = max(results, key=lambda r: r["Test Accuracy"])
        mlflow.log_metric("best_test_accuracy", float(best_model_run["Test Accuracy"]))
        mlflow.log_metric("best_f1_score", float(best_model_run["F1 Score"]))
        mlflow.set_tag("best_model", best_model_run["Model"])

except Exception as e:
    print(f"[MLflow] Warning: Pipeline MLflow run failed: {e}. Executing un-tracked fallback.")
    results = []
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    for name, model in models.items():
        pipe = make_pipeline(model)
        cv_scores = cross_val_score(pipe, X_train, y_train, cv=cv, scoring="accuracy", n_jobs=-1)
        pipe.fit(X_train, y_train)
        y_pred = pipe.predict(X_test)
        y_prob = pipe.predict_proba(X_test)[:, 1] if hasattr(pipe.named_steps["model"], "predict_proba") else None
        acc   = accuracy_score(y_test, y_pred)
        prec  = precision_score(y_test, y_pred, zero_division=0)
        rec   = recall_score(y_test, y_pred, zero_division=0)
        f1    = f1_score(y_test, y_pred, zero_division=0)
        auc   = roc_auc_score(y_test, y_prob) if y_prob is not None else float("nan")
        results.append({
            "Model"           : name,
            "CV Accuracy (5F)": f"{cv_scores.mean()*100:.2f}% ± {cv_scores.std()*100:.2f}%",
            "Test Accuracy"   : acc,
            "Precision"       : prec,
            "Recall (PD)"     : rec,
            "F1 Score"        : f1,
            "ROC-AUC"         : auc,
        })

# ─────────────────────────────────────────────────────────────
# 6. SUMMARY TABLE
# ─────────────────────────────────────────────────────────────
print(f"\n{SEPARATOR}")
print("  SUMMARY TABLE (sorted by Test Accuracy)")
print(SEPARATOR)

results_df = pd.DataFrame(results)
results_df_sorted = results_df.sort_values("Test Accuracy", ascending=False).reset_index(drop=True)
results_df_sorted["Test Accuracy"] = results_df_sorted["Test Accuracy"].apply(lambda x: f"{x*100:.2f}%")
results_df_sorted["Precision"]     = results_df_sorted["Precision"].apply(lambda x: f"{x:.4f}")
results_df_sorted["Recall (PD)"]   = results_df_sorted["Recall (PD)"].apply(lambda x: f"{x:.4f}")
results_df_sorted["F1 Score"]      = results_df_sorted["F1 Score"].apply(lambda x: f"{x:.4f}")
results_df_sorted["ROC-AUC"]       = results_df_sorted["ROC-AUC"].apply(lambda x: f"{float(x):.4f}" if x != "nan" else "N/A")

print(results_df_sorted.to_string(index=False))

# ─────────────────────────────────────────────────────────────
# 7. BEST MODEL DETAIL
# ─────────────────────────────────────────────────────────────
best_row = max(results, key=lambda r: r["Test Accuracy"])
print(f"\n{SEPARATOR}")
print(f"  [BEST MODEL] {best_row['Model']}")
print(f"      Test Accuracy : {best_row['Test Accuracy']*100:.2f}%")
print(f"      F1 Score      : {best_row['F1 Score']:.4f}")
print(f"      ROC-AUC       : {best_row['ROC-AUC']:.4f}")
print(SEPARATOR)
print("\n[OK] Training and evaluation complete!")
