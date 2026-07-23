import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from defect_prediction.config import RF_PARAMS, RF_MODEL_PATH
from defect_prediction.utils import logger, save_artifact

def train_random_forest_model(X_train: pd.DataFrame, y_train: pd.Series):
    """
    Trains Random Forest classifier handling class imbalance via balanced class weights.
    
    Returns:
    - Trained RandomForestClassifier instance
    - Top feature importances DataFrame
    """
    logger.info(f"Training Random Forest Classifier with parameters: {RF_PARAMS}")
    model = RandomForestClassifier(**RF_PARAMS)
    model.fit(X_train, y_train)
    logger.info("Random Forest training completed successfully.")

    # Save model artifact
    save_artifact(model, RF_MODEL_PATH)

    # Feature Importance Extraction
    importances = model.feature_importances_
    feature_names = X_train.columns
    fi_df = pd.DataFrame({
        'feature': feature_names,
        'importance': importances
    }).sort_values(by='importance', ascending=False).reset_index(drop=True)

    logger.info(f"Top 5 Random Forest Features:\n{fi_df.head(5).to_string(index=False)}")
    return model, fi_df
