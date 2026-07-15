import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

MODELS_DIR = os.path.join(os.path.dirname(__file__), 'saved_models')
os.makedirs(MODELS_DIR, exist_ok=True)

ANOMALY_MODEL_PATH = os.path.join(MODELS_DIR, 'anomaly_detector.joblib')
FAILURE_MODEL_PATH = os.path.join(MODELS_DIR, 'failure_predictor.joblib')

def generate_synthetic_data(num_samples=1000):
    """
    Generates synthetic DevOps metrics dataset.
    Columns: CPU_Usage, Memory_Usage, Disk_Usage, Network_Traffic, Response_Time, Failure
    """
    np.random.seed(42)
    
    # 85% normal data
    num_normal = int(num_samples * 0.85)
    num_anomalous = num_samples - num_normal
    
    # Normal metrics
    cpu_normal = np.random.uniform(15, 60, num_normal)
    mem_normal = np.random.uniform(30, 70, num_normal)
    disk_normal = np.random.uniform(20, 65, num_normal)
    net_normal = np.random.uniform(2, 30, num_normal)
    resp_normal = np.random.uniform(40, 250, num_normal)
    failure_normal = np.zeros(num_normal)
    
    # Anomaly/Failure metrics
    # Case 1: CPU Saturation
    cpu_cpu = np.random.uniform(90, 100, num_anomalous // 4)
    mem_cpu = np.random.uniform(50, 80, num_anomalous // 4)
    disk_cpu = np.random.uniform(40, 70, num_anomalous // 4)
    net_cpu = np.random.uniform(10, 40, num_anomalous // 4)
    resp_cpu = np.random.uniform(1000, 2500, num_anomalous // 4)
    
    # Case 2: Memory Leak / Out of Memory
    cpu_mem = np.random.uniform(40, 75, num_anomalous // 4)
    mem_mem = np.random.uniform(92, 100, num_anomalous // 4)
    disk_mem = np.random.uniform(30, 60, num_anomalous // 4)
    net_mem = np.random.uniform(5, 25, num_anomalous // 4)
    resp_mem = np.random.uniform(300, 1200, num_anomalous // 4)
    
    # Case 3: Disk Full
    cpu_disk = np.random.uniform(20, 50, num_anomalous // 4)
    mem_disk = np.random.uniform(40, 70, num_anomalous // 4)
    disk_disk = np.random.uniform(95, 100, num_anomalous // 4)
    net_disk = np.random.uniform(5, 20, num_anomalous // 4)
    resp_disk = np.random.uniform(100, 400, num_anomalous // 4)
    
    # Case 4: Network Bottleneck / High Traffic Spike
    cpu_net = np.random.uniform(60, 90, num_anomalous - 3 * (num_anomalous // 4))
    mem_net = np.random.uniform(50, 85, num_anomalous - 3 * (num_anomalous // 4))
    disk_net = np.random.uniform(30, 60, num_anomalous - 3 * (num_anomalous // 4))
    net_net = np.random.uniform(85, 120, num_anomalous - 3 * (num_anomalous // 4))
    resp_net = np.random.uniform(800, 3000, num_anomalous - 3 * (num_anomalous // 4))
    
    cpu_anom = np.concatenate([cpu_cpu, cpu_mem, cpu_disk, cpu_net])
    mem_anom = np.concatenate([mem_cpu, mem_mem, mem_disk, mem_net])
    disk_anom = np.concatenate([disk_cpu, disk_mem, disk_disk, disk_net])
    net_anom = np.concatenate([net_cpu, net_mem, net_disk, net_net])
    resp_anom = np.concatenate([resp_cpu, resp_mem, resp_disk, resp_net])
    failure_anom = np.ones(num_anomalous)
    
    # Combine
    df = pd.DataFrame({
        'CPU_Usage': np.concatenate([cpu_normal, cpu_anom]),
        'Memory_Usage': np.concatenate([mem_normal, mem_anom]),
        'Disk_Usage': np.concatenate([disk_normal, disk_anom]),
        'Network_Traffic': np.concatenate([net_normal, net_anom]),
        'Response_Time': np.concatenate([resp_normal, resp_anom]),
        'Failure': np.concatenate([failure_normal, failure_anom])
    })
    
    # Shuffle
    return df.sample(frac=1).reset_index(drop=True)

class MLManager:
    @staticmethod
    def train_models(df):
        """
        Trains both Isolation Forest (anomaly detection) and Random Forest (failure prediction).
        """
        features = ['CPU_Usage', 'Memory_Usage', 'Disk_Usage', 'Network_Traffic', 'Response_Time']
        X = df[features]
        y = df['Failure']
        
        # 1. Train Isolation Forest (Unsupervised, but we fit on normal-ish data or entire data)
        # We train on full dataset assuming contamination of ~15%
        iso_forest = IsolationForest(n_estimators=100, contamination=0.15, random_state=42)
        iso_forest.fit(X)
        joblib.dump(iso_forest, ANOMALY_MODEL_PATH)
        
        # Predict anomalies (-1 = anomaly, 1 = normal)
        anom_preds = iso_forest.predict(X)
        anom_binary = np.where(anom_preds == -1, 1, 0)
        
        # Anomaly Detection performance (using 'Failure' label as pseudo-ground truth)
        anom_accuracy = accuracy_score(y, anom_binary)
        anom_f1 = f1_score(y, anom_binary)
        
        # 2. Train Random Forest Classifier
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        rf_classifier = RandomForestClassifier(n_estimators=50, random_state=42)
        rf_classifier.fit(X_train, y_train)
        joblib.dump(rf_classifier, FAILURE_MODEL_PATH)
        
        # Evaluate RF
        rf_preds = rf_classifier.predict(X_test)
        rf_accuracy = accuracy_score(y_test, rf_preds)
        rf_precision = precision_score(y_test, rf_preds)
        rf_recall = recall_score(y_test, rf_preds)
        rf_f1 = f1_score(y_test, rf_preds)
        
        return {
            'anomaly': {
                'accuracy': float(anom_accuracy),
                'f1_score': float(anom_f1),
                'dataset_size': len(df)
            },
            'failure': {
                'accuracy': float(rf_accuracy),
                'precision': float(rf_precision),
                'recall': float(rf_recall),
                'f1_score': float(rf_f1),
                'dataset_size': len(df)
            }
        }
        
    @staticmethod
    def load_anomaly_model():
        if os.path.exists(ANOMALY_MODEL_PATH):
            return joblib.load(ANOMALY_MODEL_PATH)
        return None

    @staticmethod
    def load_failure_model():
        if os.path.exists(FAILURE_MODEL_PATH):
            return joblib.load(FAILURE_MODEL_PATH)
        return None

    @staticmethod
    def detect_anomaly(metrics):
        """
        metrics: list/numpy array of shape (5,) -> [CPU, Memory, Disk, Network, Response_Time]
        Returns: is_anomaly (bool), anomaly_score (float)
        """
        model = MLManager.load_anomaly_model()
        if not model:
            # Fallback if no model is trained
            cpu, mem, disk, net, resp = metrics
            score = 0.0
            is_anom = False
            if cpu > 85 or mem > 85 or disk > 90 or net > 80 or resp > 1000:
                is_anom = True
                score = 0.6
            return is_anom, score
            
        metrics_df = pd.DataFrame([metrics], columns=['CPU_Usage', 'Memory_Usage', 'Disk_Usage', 'Network_Traffic', 'Response_Time'])
        pred = model.predict(metrics_df)[0]
        # decision_function returns negative values for anomalies, positive for normal
        decision_score = model.decision_function(metrics_df)[0]
        # Normalize decision score to [0, 1] range (higher means more anomalous)
        # Decision function is typically in range [-0.5, 0.5]
        normalized_score = float(max(0, min(1, -decision_score + 0.5)))
        return bool(pred == -1), normalized_score

    @staticmethod
    def predict_failure(metrics):
        """
        metrics: list/numpy array of shape (5,)
        Returns: failure_probability (float), risk_level (str), failure_type (str)
        """
        model = MLManager.load_failure_model()
        if not model:
            # Fallback logic
            cpu, mem, disk, net, resp = metrics
            prob = 0.05
            if cpu > 85: prob = 0.90
            elif mem > 85: prob = 0.95
            elif disk > 90: prob = 0.99
            elif net > 80: prob = 0.85
            elif resp > 1000: prob = 0.80
            
            risk = 'Low'
            if prob > 0.8: risk = 'Critical'
            elif prob > 0.5: risk = 'Warning'
            
            fail_type = 'Healthy'
            if prob > 0.5:
                if disk > 90: fail_type = 'Disk Full'
                elif mem > 85: fail_type = 'Out of Memory'
                elif cpu > 85: fail_type = 'CPU Saturation'
                elif net > 80: fail_type = 'Network Bottleneck'
                else: fail_type = 'Unspecified Failure'
                
            return prob, risk, fail_type
            
        metrics_df = pd.DataFrame([metrics], columns=['CPU_Usage', 'Memory_Usage', 'Disk_Usage', 'Network_Traffic', 'Response_Time'])
        prob = float(model.predict_proba(metrics_df)[0][1])
        
        risk = 'Low'
        if prob > 0.8: risk = 'Critical'
        elif prob > 0.4: risk = 'Warning'
        
        # Determine specific failure type by checking feature thresholds if prediction is positive
        cpu, mem, disk, net, resp = metrics
        fail_type = 'Healthy'
        if prob > 0.4:
            if disk > 85: fail_type = 'Disk Full'
            elif mem > 85: fail_type = 'Out of Memory'
            elif cpu > 85: fail_type = 'CPU Saturation'
            elif net > 75: fail_type = 'Network Bottleneck'
            else: fail_type = 'Application Response Timeout'
            
        return prob, risk, fail_type
