import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
import joblib
def engineer_features(df):
    """
    Applies feature engineering to the defect dataset.
    Extracts metrics relating to size, complexity, developers, process, OOP, and testing.
    """
    print("\n--- Engineering Features ---")
    df_feat = df.copy()
    
    # 1. Size & Complexity ratios
    df_feat['loc_per_function'] = df_feat['lines_of_code'] / (df_feat['num_functions'] + 1e-5)
    df_feat['loc_per_class'] = df_feat['lines_of_code'] / (df_feat['num_classes'] + 1e-5)
    df_feat['complexity_density'] = df_feat['cyclomatic_complexity'] / (df_feat['lines_of_code'] + 1e-5)
    df_feat['complexity_per_function'] = df_feat['cyclomatic_complexity'] / (df_feat['num_functions'] + 1e-5)
    
    # 2. Process & Developer ratios
    df_feat['bug_fix_ratio'] = df_feat['bug_fix_commits'] / (df_feat['commit_frequency'] + 1e-5)
    df_feat['churn_per_commit'] = df_feat['code_churn'] / (df_feat['commit_frequency'] + 1e-5)
    df_feat['churn_per_developer'] = df_feat['code_churn'] / (df_feat['num_developers'] + 1e-5)
    df_feat['dev_experience_total'] = df_feat['num_developers'] * df_feat['developer_experience_years']
    
    # 3. Quality & Testing ratios
    df_feat['warning_density'] = df_feat['static_analysis_warnings'] / (df_feat['lines_of_code'] + 1e-5)
    df_feat['security_risk_factor'] = df_feat['security_vulnerabilities'] * (1.0 - df_feat['test_coverage'])
    df_feat['defect_density'] = df_feat['past_defects'] / (df_feat['lines_of_code'] + 1e-5)
    df_feat['build_failure_rate'] = df_feat['build_failures'] / (df_feat['commit_frequency'] + 1e-5)
    
    # 4. OOP Interactions
    df_feat['coupling_cohesion_interaction'] = df_feat['coupling_between_objects'] * df_feat['lack_of_cohesion']
    df_feat['complexity_coupling_interaction'] = df_feat['cyclomatic_complexity'] * df_feat['coupling_between_objects']
    
    # 5. Non-linear transforms for highly skewed/broad distribution features
    df_feat['log_lines_of_code'] = np.log1p(df_feat['lines_of_code'])
    df_feat['log_code_churn'] = np.log1p(df_feat['code_churn'])
    df_feat['log_static_analysis_warnings'] = np.log1p(df_feat['static_analysis_warnings'])
    
    print(f"Feature engineering completed. New columns count: {len(df_feat.columns)}")
    return df_feat

def preprocess_dataset(file_path):
    print(f"Loading dataset from: {file_path}")
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return
        
    df = pd.read_csv(file_path)
    print(f"Loaded dataset with shape: {df.shape}")
    
    # 1. Print Basic Info
    print("\n--- Initial Dataset Statistics ---")
    print(f"Total Rows: {len(df)}")
    print(f"Total Columns: {len(df.columns)}")
    print(f"Label distribution ('defect'):")
    print(df['defect'].value_counts(normalize=True))
    
    # 2. Check for missing values
    missing_vals = df.isnull().sum()
    total_missing = missing_vals.sum()
    print(f"\nTotal missing values: {total_missing}")
    if total_missing > 0:
        print("Missing values per column:")
        print(missing_vals[missing_vals > 0])
        # Impute missing values with median
        for col in df.columns:
            if df[col].isnull().sum() > 0:
                median_val = df[col].median()
                df[col] = df[col].fillna(median_val)
        print("Imputed missing values with median.")
        
    # 3. Check for duplicates
    duplicates_count = df.duplicated().sum()
    print(f"Duplicate rows count: {duplicates_count}")
    if duplicates_count > 0:
        df = df.drop_duplicates().reset_index(drop=True)
        print(f"Removed duplicates. New shape: {df.shape}")
        
    # 3.5 Feature Engineering
    df = engineer_features(df)
        
    # 4. Standardize numeric features (everything except 'defect')
    feature_cols = [col for col in df.columns if col != 'defect']
    X = df[feature_cols]
    y = df['defect']
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    X_scaled_df = pd.DataFrame(X_scaled, columns=feature_cols)
    
    # 5. Split into train and test sets (80/20)
    X_train, X_test, y_train, y_test = train_test_split(X_scaled_df, y, test_size=0.2, random_state=42, stratify=y)
    print(f"\nSplit dataset into Train and Test sets:")
    print(f"Train set shape: {X_train.shape}")
    print(f"Test set shape: {X_test.shape}")
    
    # Save files in the same directory as the dataset
    dir_path = os.path.dirname(file_path)
    
    preprocessed_df = pd.concat([X_scaled_df, y], axis=1)
    preprocessed_path = os.path.join(dir_path, 'software_defect_prediction_preprocessed.csv')
    preprocessed_df.to_csv(preprocessed_path, index=False)
    print(f"Saved complete preprocessed dataset to: {preprocessed_path}")
    
    train_df = pd.concat([X_train.reset_index(drop=True), y_train.reset_index(drop=True)], axis=1)
    train_path = os.path.join(dir_path, 'defect_train.csv')
    train_df.to_csv(train_path, index=False)
    print(f"Saved training dataset to: {train_path}")
    
    test_df = pd.concat([X_test.reset_index(drop=True), y_test.reset_index(drop=True)], axis=1)
    test_path = os.path.join(dir_path, 'defect_test.csv')
    test_df.to_csv(test_path, index=False)
    print(f"Saved test dataset to: {test_path}")
    
    scaler_path = os.path.join(dir_path, 'defect_scaler.joblib')
    joblib.dump(scaler, scaler_path)
    print(f"Saved scaler object to: {scaler_path}")
    
    # 6. Train defect prediction model
    model_path = os.path.join(dir_path, 'defect_model.joblib')
    train_defect_model(train_path, test_path, model_path)
    
    print("\nPreprocessing and training pipeline completed successfully!")

def train_defect_model(train_path, test_path, model_path):
    print("\n--- Training Software Defect Prediction Model ---")
    if not os.path.exists(train_path) or not os.path.exists(test_path):
        print("Error: Train or test dataset not found.")
        return
        
    print(f"Loading training data from: {train_path}")
    train_df = pd.read_csv(train_path)
    print(f"Loading test data from: {test_path}")
    test_df = pd.read_csv(test_path)
    
    # Separate features and target
    X_train = train_df.drop(columns=['defect'])
    y_train = train_df['defect']
    X_test = test_df.drop(columns=['defect'])
    y_test = test_df['defect']
    
    print(f"Training Random Forest Classifier on {X_train.shape[0]} samples with {X_train.shape[1]} features...")
    # Initialize Random Forest Classifier
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    rf_model.fit(X_train, y_train)
    
    # Predict and evaluate
    y_pred = rf_model.predict(X_test)
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    
    print("\n--- Evaluation Metrics ---")
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, zero_division=0))
    
    # Save model
    joblib.dump(rf_model, model_path)
    print(f"Saved trained model to: {model_path}")

if __name__ == '__main__':
    dataset_path = r"c:\Users\dharu\OneDrive\Desktop\software_defect_prediction_dataset.csv"
    preprocess_dataset(dataset_path)
