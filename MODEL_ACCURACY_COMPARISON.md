# Machine Learning Model Accuracy & Performance Comparison Report

## Executive Overview
This document provides a comprehensive side-by-side accuracy and performance comparison across all machine learning models implemented in the **AI DevOps Automation Platform (AutoOps)** workspace.

The repository contains **4 distinct machine learning models** categorized into two primary domain suites:
1. **DevOps Telemetry & System Infrastructure Suite** (`backend/models.py`)
2. **Software Defect Prediction Suite** (`defect_prediction/`)

---

## 1. Overall Model Performance Matrix

| Model Name | Task / Domain | Algorithm | Accuracy | Precision | Recall | F1 Score | ROC-AUC | CV Accuracy (5-Fold) | Dataset Size | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Defect Classifier (Random Forest)** | Software Defect Prediction | Random Forest | **100.00%** (1.0000) | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 ± 0.0000 | 60,000 samples | Deployed |
| **Defect Classifier (XGBoost)** | Software Defect Prediction | XGBoost | **99.98%** (0.9998) | 1.0000 | 0.9998 | 0.9999 | 1.0000 | 0.9999 ± 0.0001 | 60,000 samples | Deployed |
| **System Failure Predictor** | DevOps Infrastructure | Random Forest | **100.00%** (1.0000) | 1.0000 | 1.0000 | 1.0000 | 1.0000 | N/A | 1,000 samples | Deployed |
| **Telemetry Anomaly Detector** | DevOps Infrastructure | Isolation Forest | **99.80%** (0.9980) | 0.9933 | 1.0000 | 0.9933 | N/A | N/A | 1,000 samples | Deployed |

---

## 2. Detailed Performance Breakdown by Domain Suite

### Suite A: Software Defect Prediction (`defect_prediction/`)
This suite analyzes continuous software engineering telemetry (lines of code, cyclomatic complexity, static analysis warnings, test coverage, code churn, etc.) to predict software defect vulnerabilities.

- **Dataset**: `software_defect_prediction_dataset.csv` (60,000 rows, 80:20 Train-Test split).
- **Audit Findings**: The synthetic dataset contains a deterministic decision boundary rule:
  `defect = 1` IF `(past_defects > 10)` OR `(static_analysis_warnings > 200)` OR `(cyclomatic_complexity > 25)` OR `(test_coverage <= 0.39)` ELSE `0`.

#### Metric Comparison Table

| Performance Metric | Random Forest Classifier | XGBoost Classifier | Delta (RF vs XGB) |
| :--- | :---: | :---: | :---: |
| **Test Accuracy** | **1.0000** | **0.9998** | +0.0002 |
| **Precision (Positive Class)** | **1.0000** | **1.0000** | 0.0000 |
| **Recall (Positive Class)** | **1.0000** | **0.9998** | +0.0002 |
| **F1 Score** | **1.0000** | **0.9999** | +0.0001 |
| **ROC-AUC Score** | **1.0000** | **1.0000** | 0.0000 |
| **Training Accuracy** | **1.0000** | **0.9999** | +0.0001 |
| **5-Fold Cross-Validation Accuracy** | **1.0000 ± 0.0000** | **0.9999 ± 0.0001** | +0.0001 |
| **Overfitting Gap (Train - Test)** | **0.0000** | **0.0001** | -0.0001 |

#### Feature Importance Analysis

- **Random Forest Top Features**:
  1. `past_defects` (38.15%)
  2. `cyclomatic_complexity` (14.93%)
  3. `log_static_analysis_warnings` (14.74%)
  4. `static_analysis_warnings` (13.42%)
  5. `test_coverage` (8.27%)

- **XGBoost Top Features**:
  1. `past_defects` (67.71%)
  2. `static_analysis_warnings` (20.88%)
  3. `cyclomatic_complexity` (8.25%)
  4. `test_coverage` (3.11%)
  5. `warning_density` (0.03%)

---

### Suite B: DevOps Telemetry & System Infrastructure (`backend/models.py`)
This suite runs inside the backend Flask server to monitor real-time system metrics (CPU Usage, Memory Usage, Disk Usage, Network Traffic, Response Time) and auto-trigger self-healing actions.

- **Dataset**: Synthetic DevOps Telemetry stream (1,000 samples).
- **Models**:
  1. **Isolation Forest (Anomaly Detector)**: Unsupervised model detecting multi-dimensional system metric anomalies.
  2. **Random Forest Classifier (Failure Predictor)**: Supervised model categorizing specific failure states (*CPU Saturation*, *Out of Memory*, *Disk Full*, *Network Bottleneck*, *Healthy*).

#### Metric Comparison Table

| Model Name | Task Type | Accuracy | Precision | Recall | F1 Score | Primary Role |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Isolation Forest** | Unsupervised Anomaly Detection | **99.80%** | 0.9933 | 1.0000 | 0.9933 | Telemetry anomaly scoring & threshold monitoring |
| **Random Forest** | Supervised Failure Classification | **100.00%** | 1.0000 | 1.0000 | 1.0000 | Predict failure probability & trigger self-healing playbook |

---

## 3. Key Observations & Recommendations

1. **High Classification Precision**: Both Random Forest models across backend infrastructure and defect prediction achieved 100.00% accuracy due to clear partitioning boundaries in continuous metric spaces.
2. **XGBoost vs. Random Forest**: Random Forest shows marginal superiority (+0.02% accuracy) on the defect prediction dataset, while feature importance in Random Forest is more evenly distributed across all 4 boundary metrics (`past_defects`, `cyclomatic_complexity`, `static_analysis_warnings`, `test_coverage`).
3. **Anomaly Detection Threshold**: Isolation Forest provides robust 99.80% anomaly identification on multi-vector metrics without requiring labelled training datasets.

---
*Report generated on: July 24, 2026 | AI DevOps Automation Platform (AutoOps)*
