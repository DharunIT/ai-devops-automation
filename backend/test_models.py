import os
import pandas as pd
from backend.models import MLManager, ANOMALY_MODEL_PATH, FAILURE_MODEL_PATH, generate_synthetic_data

def test_model_pipeline():
    print("=== STARTING ML PIPELINE TEST ===")
    
    # 1. Test dataset generation
    print("Generating synthetic metrics dataset...")
    df = generate_synthetic_data(200)
    assert len(df) == 200, f"Expected 200 rows, got {len(df)}"
    required_cols = {'CPU_Usage', 'Memory_Usage', 'Disk_Usage', 'Network_Traffic', 'Response_Time', 'Failure'}
    assert required_cols.issubset(df.columns), f"Missing columns in synthetic dataset: {required_cols - set(df.columns)}"
    print("Dataset generation verified successfully.")
    
    # 2. Clean previous models if any to ensure fresh training
    if os.path.exists(ANOMALY_MODEL_PATH):
        os.remove(ANOMALY_MODEL_PATH)
    if os.path.exists(FAILURE_MODEL_PATH):
        os.remove(FAILURE_MODEL_PATH)
        
    # 3. Train models
    print("Training Isolation Forest & Random Forest models...")
    metrics = MLManager.train_models(df)
    
    assert os.path.exists(ANOMALY_MODEL_PATH), "Anomaly detection model file was not saved!"
    assert os.path.exists(FAILURE_MODEL_PATH), "Failure prediction model file was not saved!"
    print(f"Model files created. Training metrics: {metrics}")
    
    # 4. Test inference - Normal conditions
    normal_vector = [25.0, 45.0, 30.0, 10.0, 80.0]
    print(f"Testing normal metrics vector: {normal_vector}")
    is_anom, score = MLManager.detect_anomaly(normal_vector)
    prob, risk, fail_type = MLManager.predict_failure(normal_vector)
    
    print(f"Normal prediction -> Anomaly: {is_anom} (Score: {score:.3f}), Failure: {prob*100:.1f}% (Risk: {risk}, Type: {fail_type})")
    
    # Under typical Isolation Forest contamination, normal metrics should be classified as normal (False)
    # Failure risk should be low, failure type healthy
    assert not is_anom, f"Expected normal metrics to be normal, got is_anomaly={is_anom}"
    assert risk == 'Low', f"Expected risk to be 'Low', got '{risk}'"
    assert fail_type == 'Healthy', f"Expected type to be 'Healthy', got '{fail_type}'"
    
    # 5. Test inference - Anomaly/Failure (CPU Saturation)
    cpu_saturated = [98.0, 50.0, 35.0, 15.0, 1800.0]
    print(f"Testing CPU saturated metrics vector: {cpu_saturated}")
    is_anom_cpu, score_cpu = MLManager.detect_anomaly(cpu_saturated)
    prob_cpu, risk_cpu, fail_type_cpu = MLManager.predict_failure(cpu_saturated)
    
    print(f"CPU Spike prediction -> Anomaly: {is_anom_cpu} (Score: {score_cpu:.3f}), Failure: {prob_cpu*100:.1f}% (Risk: {risk_cpu}, Type: {fail_type_cpu})")
    
    assert is_anom_cpu, f"Expected CPU spike to be anomalous, got is_anomaly={is_anom_cpu}"
    assert risk_cpu in ['Warning', 'Critical'], f"Expected elevated risk, got '{risk_cpu}'"
    assert fail_type_cpu == 'CPU Saturation', f"Expected failure type 'CPU Saturation', got '{fail_type_cpu}'"
    
    # 6. Test inference - Anomaly/Failure (Memory Leak)
    memory_leaked = [35.0, 96.0, 40.0, 8.0, 950.0]
    print(f"Testing memory leak metrics vector: {memory_leaked}")
    is_anom_mem, score_mem = MLManager.detect_anomaly(memory_leaked)
    prob_mem, risk_mem, fail_type_mem = MLManager.predict_failure(memory_leaked)
    
    print(f"Memory Leak prediction -> Anomaly: {is_anom_mem} (Score: {score_mem:.3f}), Failure: {prob_mem*100:.1f}% (Risk: {risk_mem}, Type: {fail_type_mem})")
    
    assert is_anom_mem, f"Expected memory leak to be anomalous, got is_anomaly={is_anom_mem}"
    assert risk_mem in ['Warning', 'Critical'], f"Expected elevated risk, got '{risk_mem}'"
    assert fail_type_mem == 'Out of Memory', f"Expected failure type 'Out of Memory', got '{fail_type_mem}'"

    print("=== ALL ML PIPELINE TESTS COMPLETED SUCCESSFULLY ===")

if __name__ == '__main__':
    test_model_pipeline()
