# Software Defect Prediction Pipeline Audit & Performance Report

## Executive Summary

### Audit Explanation for 100% Accuracy Findings:
1. **Synthetic Rule Boundary**: The input dataset (`software_defect_prediction_dataset.csv`) contains 60,000 synthetic software metric samples created using deterministic decision logic:
   `defect = 1` IF `(past_defects > 10)` OR `(static_analysis_warnings > 200)` OR `(cyclomatic_complexity > 25)` OR `(test_coverage <= 0.39)` ELSE `0`.
   This rule matches **100.00%** of rows in the dataset. Because tree-based models (Decision Trees, Random Forests, XGBoost) recursively partition continuous metric spaces, they discover this exact 4-rule boundary with zero classification entropy.
2. **StandardScaler Leakage Fixed**: Previously, `StandardScaler.fit_transform()` was called on the whole dataset before train-test split. In this refactored pipeline, scaling parameters ($\mu, \sigma$) are computed **strictly on the training set** and applied to the test set using `.transform()`.
3. **Target Leakage Removed**: Engineered features no longer include target-derived interaction features. All feature transformations rely strictly on independent variables.

---

## 1. Data Audit & Leakage Audit Findings

- **Total Rows:** 60000
- **Total Features:** 22
- **Missing Values:** 0
- **Duplicate Rows:** 0
- **Class Distribution:** Defect (1): 58223, Non-Defect (0): 1777
- **Synthetic Rule Detected:** `(past_defects > 10) | (static_analysis_warnings > 200) | (cyclomatic_complexity > 25) | (test_coverage <= 0.39)`
- **Rule Match Accuracy:** 100.00%

## 2. Model Performance Comparison

| Metric | Random Forest | XGBoost |
|---|---|---|
| **Accuracy** | 1.0000 | 0.9998 |
| **Precision** | 1.0000 | 1.0000 |
| **Recall** | 1.0000 | 0.9998 |
| **F1 Score** | 1.0000 | 0.9999 |
| **Roc Auc** | 1.0000 | 1.0000 |
| **Cv Mean Acc** | 1.0000 | 0.9999 |
| **Cv Std Acc** | 0.0000 | 0.0001 |
| **Train Acc** | 1.0000 | 0.9999 |

---

## 3. Top 10 Feature Importances

### Random Forest
- **past_defects**: 0.3815
- **cyclomatic_complexity**: 0.1493
- **log_static_analysis_warnings**: 0.1474
- **static_analysis_warnings**: 0.1342
- **test_coverage**: 0.0827
- **complexity_coupling_interaction**: 0.0230
- **warning_density**: 0.0223
- **complexity_density**: 0.0126
- **security_risk_factor**: 0.0095
- **complexity_per_function**: 0.0082

### XGBoost
- **past_defects**: 0.6771
- **static_analysis_warnings**: 0.2088
- **cyclomatic_complexity**: 0.0825
- **test_coverage**: 0.0311
- **warning_density**: 0.0003
- **complexity_per_function**: 0.0002
- **code_churn**: 0.0000
- **comment_density**: 0.0000
- **num_classes**: 0.0000
- **num_functions**: 0.0000