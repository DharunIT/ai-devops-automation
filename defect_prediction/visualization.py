import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd
from sklearn.metrics import roc_curve, precision_recall_curve
from defect_prediction.config import PLOTS_DIR, TARGET_COLUMN
from defect_prediction.utils import logger

# Set style for publication quality graphics
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
plt.rcParams.update({'font.sans-serif': 'DejaVu Sans', 'font.size': 10, 'figure.autolayout': True})

def plot_class_distribution(y, output_dir=PLOTS_DIR):
    """Plots target class distribution."""
    plt.figure(figsize=(7, 5))
    counts = pd.Series(y).value_counts()
    ax = sns.barplot(x=counts.index.astype(str), y=counts.values, hue=counts.index.astype(str), palette=['#2b5c8f', '#d9534f'], legend=False)
    plt.title('Software Defect Class Distribution (0: No Defect, 1: Defect)', fontsize=12, fontweight='bold')
    plt.xlabel('Class Label')
    plt.ylabel('Count')
    for p in ax.patches:
        ax.annotate(f'{int(p.get_height()):,}', (p.get_x() + p.get_width() / 2., p.get_height()),
                    ha='center', va='center', xytext=(0, 5), textcoords='offset points', fontweight='bold')
    filepath = os.path.join(output_dir, 'class_distribution.png')
    plt.savefig(filepath, dpi=300)
    plt.close()
    logger.info(f"Saved class distribution plot: {filepath}")

def plot_correlation_heatmap(df, top_n=15, output_dir=PLOTS_DIR):
    """Plots correlation heatmap of top correlated features with target."""
    plt.figure(figsize=(12, 10))
    numeric_df = df.select_dtypes(include=[np.number])
    if TARGET_COLUMN in numeric_df.columns:
        corrs = numeric_df.corr()[TARGET_COLUMN].abs().sort_values(ascending=False)
        top_cols = corrs.head(top_n).index
        corr_matrix = numeric_df[top_cols].corr()
    else:
        corr_matrix = numeric_df.iloc[:, :top_n].corr()

    sns.heatmap(corr_matrix, annot=True, fmt='.2f', cmap='coolwarm', vmin=-1, vmax=1, linewidths=0.5)
    plt.title(f'Feature Correlation Heatmap (Top {top_n} Features)', fontsize=12, fontweight='bold')
    filepath = os.path.join(output_dir, 'correlation_heatmap.png')
    plt.savefig(filepath, dpi=300)
    plt.close()
    logger.info(f"Saved correlation heatmap: {filepath}")

def plot_confusion_matrices(rf_eval, xgb_eval, output_dir=PLOTS_DIR):
    """Plots side-by-side confusion matrices for Random Forest and XGBoost."""
    fig, axes = plt.subplots(1, 2, figsize=(13, 5))

    cm_rf = np.array(rf_eval['confusion_matrix'])
    sns.heatmap(cm_rf, annot=True, fmt='d', cmap='Blues', ax=axes[0],
                xticklabels=['No Defect', 'Defect'], yticklabels=['No Defect', 'Defect'])
    axes[0].set_title(f"Random Forest (Acc: {rf_eval['accuracy']:.4f})", fontweight='bold')
    axes[0].set_xlabel('Predicted Label')
    axes[0].set_ylabel('True Label')

    cm_xgb = np.array(xgb_eval['confusion_matrix'])
    sns.heatmap(cm_xgb, annot=True, fmt='d', cmap='Greens', ax=axes[1],
                xticklabels=['No Defect', 'Defect'], yticklabels=['No Defect', 'Defect'])
    axes[1].set_title(f"XGBoost (Acc: {xgb_eval['accuracy']:.4f})", fontweight='bold')
    axes[1].set_xlabel('Predicted Label')
    axes[1].set_ylabel('True Label')

    plt.suptitle('Confusion Matrix Comparison', fontsize=14, fontweight='bold')
    filepath = os.path.join(output_dir, 'confusion_matrices.png')
    plt.savefig(filepath, dpi=300)
    plt.close()
    logger.info(f"Saved confusion matrices plot: {filepath}")

def plot_roc_curves(y_test, rf_eval, xgb_eval, output_dir=PLOTS_DIR):
    """Plots ROC curves comparing Random Forest vs XGBoost."""
    plt.figure(figsize=(8, 6))

    fpr_rf, tpr_rf, _ = roc_curve(y_test, rf_eval['y_prob'])
    plt.plot(fpr_rf, tpr_rf, label=f"Random Forest (AUC = {rf_eval['roc_auc']:.4f})", color='#2b5c8f', lw=2)

    fpr_xgb, tpr_xgb, _ = roc_curve(y_test, xgb_eval['y_prob'])
    plt.plot(fpr_xgb, tpr_xgb, label=f"XGBoost (AUC = {xgb_eval['roc_auc']:.4f})", color='#2ca02c', lw=2)

    plt.plot([0, 1], [0, 1], 'k--', lw=1.5, label='Random Chance')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('Receiver Operating Characteristic (ROC) Curve Overlay', fontsize=12, fontweight='bold')
    plt.legend(loc="lower right")
    filepath = os.path.join(output_dir, 'roc_curves.png')
    plt.savefig(filepath, dpi=300)
    plt.close()
    logger.info(f"Saved ROC curves plot: {filepath}")

def plot_pr_curves(y_test, rf_eval, xgb_eval, output_dir=PLOTS_DIR):
    """Plots Precision-Recall curves comparing Random Forest vs XGBoost."""
    plt.figure(figsize=(8, 6))

    p_rf, r_rf, _ = precision_recall_curve(y_test, rf_eval['y_prob'])
    plt.plot(r_rf, p_rf, label=f"Random Forest (AP = {rf_eval['precision']:.4f})", color='#2b5c8f', lw=2)

    p_xgb, r_xgb, _ = precision_recall_curve(y_test, xgb_eval['y_prob'])
    plt.plot(r_xgb, p_xgb, label=f"XGBoost (AP = {xgb_eval['precision']:.4f})", color='#2ca02c', lw=2)

    plt.xlabel('Recall')
    plt.ylabel('Precision')
    plt.title('Precision-Recall Curve Overlay', fontsize=12, fontweight='bold')
    plt.legend(loc="lower left")
    filepath = os.path.join(output_dir, 'precision_recall_curves.png')
    plt.savefig(filepath, dpi=300)
    plt.close()
    logger.info(f"Saved Precision-Recall curves plot: {filepath}")

def plot_feature_importances(rf_fi, xgb_fi, top_n=20, output_dir=PLOTS_DIR):
    """Plots top 20 feature importances for RF and XGBoost."""
    fig, axes = plt.subplots(1, 2, figsize=(16, 8))

    top_rf = rf_fi.head(top_n)
    sns.barplot(x='importance', y='feature', data=top_rf, ax=axes[0], hue='feature', palette='Blues_r', legend=False)
    axes[0].set_title(f'Random Forest - Top {top_n} Features', fontweight='bold')
    axes[0].set_xlabel('Importance')

    top_xgb = xgb_fi.head(top_n)
    sns.barplot(x='importance', y='feature', data=top_xgb, ax=axes[1], hue='feature', palette='Greens_r', legend=False)
    axes[1].set_title(f'XGBoost - Top {top_n} Features', fontweight='bold')
    axes[1].set_xlabel('Importance')

    plt.suptitle('Model Feature Importance Comparison', fontsize=14, fontweight='bold')
    filepath = os.path.join(output_dir, 'feature_importances.png')
    plt.savefig(filepath, dpi=300)
    plt.close()
    logger.info(f"Saved feature importances plot: {filepath}")

def generate_all_visualizations(y_test, rf_eval, xgb_eval, rf_fi, xgb_fi, raw_df):
    """Orchestrates generation of all required audit plots."""
    logger.info("Generating publication-quality visualization figures...")
    plot_class_distribution(raw_df[TARGET_COLUMN])
    plot_correlation_heatmap(raw_df)
    plot_confusion_matrices(rf_eval, xgb_eval)
    plot_roc_curves(y_test, rf_eval, xgb_eval)
    plot_pr_curves(y_test, rf_eval, xgb_eval)
    plot_feature_importances(rf_fi, xgb_fi)
    logger.info("All plots generated successfully.")
