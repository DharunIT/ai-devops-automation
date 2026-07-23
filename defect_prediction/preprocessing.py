import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from defect_prediction.config import (
    DATASET_PATH, TARGET_COLUMN, TEST_SIZE, RANDOM_STATE,
    PREPROCESSED_DATA_PATH, TRAIN_DATA_PATH, TEST_DATA_PATH, SCALER_PATH
)
from defect_prediction.feature_engineering import engineer_features
from defect_prediction.utils import logger, save_artifact

def load_and_audit_dataset(file_path=DATASET_PATH):
    """
    Loads raw CSV dataset and performs comprehensive sanity checks:
    - Shape, data types, missing values, duplicates
    - Class distribution & imbalance ratio
    - Detects synthetic rule logic if present
    """
    logger.info(f"Loading raw dataset from: {file_path}")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset file not found at {file_path}")

    df = pd.read_csv(file_path)
    total_rows, total_cols = df.shape
    logger.info(f"Loaded dataset: {total_rows} rows, {total_cols} columns")

    # 1. Missing Values
    missing_sum = int(df.isnull().sum().sum())
    logger.info(f"Total missing values: {missing_sum}")
    if missing_sum > 0:
        for col in df.columns:
            if df[col].isnull().sum() > 0:
                median_val = df[col].median()
                df[col] = df[col].fillna(median_val)
        logger.info("Imputed missing values using column medians.")

    # 2. Duplicates
    dup_count = int(df.duplicated().sum())
    logger.info(f"Duplicate rows detected: {dup_count}")
    if dup_count > 0:
        df = df.drop_duplicates().reset_index(drop=True)
        logger.info(f"Removed duplicate rows. New shape: {df.shape}")

    # 3. Target Distribution
    if TARGET_COLUMN not in df.columns:
        raise ValueError(f"Target column '{TARGET_COLUMN}' not found in dataset.")

    class_counts = df[TARGET_COLUMN].value_counts().to_dict()
    imbalance_ratio = class_counts.get(1, 0) / (class_counts.get(0, 1) + 1e-5)
    logger.info(f"Target '{TARGET_COLUMN}' distribution: {class_counts} (Positive ratio: {imbalance_ratio:.2f})")

    # 4. Detect Synthetic Deterministic Rules
    rule_match_pct = 0.0
    synthetic_rule = "None detected"
    if all(col in df.columns for col in ['past_defects', 'static_analysis_warnings', 'cyclomatic_complexity', 'test_coverage']):
        rule_pred = (
            (df['past_defects'] > 10) |
            (df['static_analysis_warnings'] > 200) |
            (df['cyclomatic_complexity'] > 25) |
            (df['test_coverage'] <= 0.39)
        ).astype(int)
        matches = (df[TARGET_COLUMN] == rule_pred).sum()
        rule_match_pct = float(matches / len(df) * 100.0)
        synthetic_rule = "(past_defects > 10) | (static_analysis_warnings > 200) | (cyclomatic_complexity > 25) | (test_coverage <= 0.39)"
        logger.info(f"Synthetic Rule Detection Audit: {rule_match_pct:.2f}% match with deterministic rule: {synthetic_rule}")

    audit_summary = {
        "total_rows": total_rows,
        "total_features": total_cols - 1,
        "missing_values": missing_sum,
        "duplicate_rows": dup_count,
        "class_distribution": class_counts,
        "imbalance_ratio": imbalance_ratio,
        "synthetic_rule": synthetic_rule,
        "rule_match_percentage": rule_match_pct
    }

    return df, audit_summary

def run_preprocessing_pipeline(file_path=DATASET_PATH):
    """
    Executes complete, leakage-free preprocessing pipeline:
    1. Loads dataset and audits features
    2. Applies feature engineering (independent variables only)
    3. Performs 80:20 Stratified Train-Test Split (BEFORE scaling)
    4. Fits StandardScaler ONLY on X_train and transforms X_test
    5. Saves preprocessed datasets and fitted scaler artifact
    """
    logger.info("Starting Leakage-Free Preprocessing Pipeline...")
    df, audit_summary = load_and_audit_dataset(file_path)

    # Apply Feature Engineering
    df_feat = engineer_features(df)

    # Separate Features and Target
    X = df_feat.drop(columns=[TARGET_COLUMN])
    y = df_feat[TARGET_COLUMN]

    feature_names = list(X.columns)

    # Stratified Train-Test Split (BEFORE SCALING to prevent data leakage)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    logger.info(f"Stratified Train-Test Split (80:20): Train shape = {X_train.shape}, Test shape = {X_test.shape}")

    # Standard Scaling (Fit on Train ONLY)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    logger.info("StandardScaler fitted on X_train and applied to X_test without leakage.")

    # Save Scaler Artifact
    save_artifact(scaler, SCALER_PATH)

    # Convert back to DataFrames
    X_train_scaled_df = pd.DataFrame(X_train_scaled, columns=feature_names)
    X_test_scaled_df = pd.DataFrame(X_test_scaled, columns=feature_names)

    # Save Preprocessed Files
    train_df = pd.concat([X_train_scaled_df.reset_index(drop=True), y_train.reset_index(drop=True)], axis=1)
    test_df = pd.concat([X_test_scaled_df.reset_index(drop=True), y_test.reset_index(drop=True)], axis=1)
    full_preprocessed_df = pd.concat([train_df, test_df], axis=0).reset_index(drop=True)

    train_df.to_csv(TRAIN_DATA_PATH, index=False)
    test_df.to_csv(TEST_DATA_PATH, index=False)
    full_preprocessed_df.to_csv(PREPROCESSED_DATA_PATH, index=False)
    logger.info(f"Saved train dataset: {TRAIN_DATA_PATH}")
    logger.info(f"Saved test dataset: {TEST_DATA_PATH}")
    logger.info(f"Saved preprocessed dataset: {PREPROCESSED_DATA_PATH}")

    return {
        "X_train": X_train_scaled_df,
        "X_test": X_test_scaled_df,
        "y_train": y_train.reset_index(drop=True),
        "y_test": y_test.reset_index(drop=True),
        "feature_names": feature_names,
        "scaler": scaler,
        "audit_summary": audit_summary,
        "raw_df": df_feat
    }
