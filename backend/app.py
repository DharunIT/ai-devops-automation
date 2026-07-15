import os
import io
import numpy as np
import pandas as pd
from datetime import datetime
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from sklearn.metrics import accuracy_score, f1_score
from backend.database import db, MetricRecord, Incident, SelfHealingLog, MLModelStatus, MonitoredWebsite
from backend.simulation import simulator
from backend.models import MLManager, generate_synthetic_data


app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Database Configuration
db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../devops.db'))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Track the current active training dataset name
UPLOADED_CSV_PATH = os.path.join(os.path.dirname(__file__), 'uploaded_dataset.csv')

# Core Routes
@app.route('/')
def index():
    return app.send_static_file('index.html')

# Endpoint to get overall status
@app.route('/api/status', methods=['GET'])
def get_status():
    state = simulator.get_simulation_state()
    
    # Calculate database metrics
    total_incidents = Incident.query.count()
    open_incidents = Incident.query.filter(Incident.resolution_status != 'Resolved').count()
    total_healing = SelfHealingLog.query.count()
    success_healing = SelfHealingLog.query.filter_by(status='Success').count()
    
    # Find latest metrics for average calculations
    latest_metrics = {}
    avg_cpu = 0
    avg_mem = 0
    avg_disk = 0
    
    for s_name in state["servers"]:
        record = MetricRecord.query.filter_by(server_id=s_name).order_by(MetricRecord.timestamp.desc()).first()
        if record:
            latest_metrics[s_name] = record.to_dict()
            
    if latest_metrics:
        avg_cpu = sum(r["cpu_usage"] for r in latest_metrics.values()) / len(latest_metrics)
        avg_mem = sum(r["memory_usage"] for r in latest_metrics.values()) / len(latest_metrics)
        avg_disk = sum(r["disk_usage"] for r in latest_metrics.values()) / len(latest_metrics)

    # Determine failures prediction status
    critical_predictions = 0
    warning_predictions = 0
    for s_name, metrics in state["servers"].items():
        metrics_vector = [metrics["cpu"], metrics["mem"], metrics["disk"], metrics["net"], metrics["resp"]]
        prob, risk, _ = MLManager.predict_failure(metrics_vector)
        if risk == 'Critical':
            critical_predictions += 1
        elif risk == 'Warning':
            warning_predictions += 1
            
    fail_prediction_status = "Healthy"
    if critical_predictions > 0:
        fail_prediction_status = "Critical Risk"
    elif warning_predictions > 0:
        fail_prediction_status = "Warning Risk"

    return jsonify({
        "servers_count": len(state["servers"]),
        "containers_count": sum(len(c) for c in state["containers"].values()),
        "k8s_pods_count": len(state["k8s_pods"]),
        "avg_cpu_usage": round(avg_cpu, 1),
        "avg_mem_usage": round(avg_mem, 1),
        "avg_disk_usage": round(avg_disk, 1),
        "app_status": "Degraded" if open_incidents > 0 else "Healthy",
        "failure_prediction_status": fail_prediction_status,
        "open_incidents": open_incidents,
        "total_incidents": total_incidents,
        "total_healing_actions": total_healing,
        "success_healing_actions": success_healing,
        "active_agent": state["active_agent"]
    })

# Endpoint for real-time and historical metrics
@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    state = simulator.get_simulation_state()
    limit = request.args.get('limit', default=30, type=int)
    
    historical = {}
    for s_name in state["servers"]:
        records = MetricRecord.query.filter_by(server_id=s_name)\
                              .order_by(MetricRecord.timestamp.desc())\
                              .limit(limit).all()
        # Return in chronological order
        historical[s_name] = [r.to_dict() for r in reversed(records)]
        
    return jsonify({
        "current": state["servers"],
        "containers": state["containers"],
        "historical": historical
    })

# Endpoint for anomalies log
@app.route('/api/anomalies', methods=['GET'])
def get_anomalies():
    limit = request.args.get('limit', default=50, type=int)
    records = MetricRecord.query.filter_by(is_anomaly=True)\
                          .order_by(MetricRecord.timestamp.desc())\
                          .limit(limit).all()
    return jsonify([r.to_dict() for r in records])

# Endpoint for failure prediction metrics
@app.route('/api/failures', methods=['GET'])
def get_failures():
    state = simulator.get_simulation_state()
    failures = {}
    
    for s_name, metrics in state["servers"].items():
        metrics_vector = [metrics["cpu"], metrics["mem"], metrics["disk"], metrics["net"], metrics["resp"]]
        prob, risk, fail_type = MLManager.predict_failure(metrics_vector)
        
        # Recommended corrective actions
        actions = []
        if fail_type == 'Out of Memory':
            actions = ["Recycle memory heaps", "Trigger Kubernetes auto-scaling", "Deploy hotfix release"]
        elif fail_type == 'CPU Saturation':
            actions = ["Scale out container replicas", "Enable rate-limiting gates", "Optimize application thread pool"]
        elif fail_type == 'Disk Full':
            actions = ["Trigger log rotation cron", "Purge localized container build-caches", "Scale persistent volume claim"]
        elif fail_type == 'Network Bottleneck':
            actions = ["Scale load balancer bandwidth", "Reroute cloud edge proxy CDN", "Apply circuit-breaker pattern"]
        else:
            actions = ["No action required. Telemetry within baseline parameters."]
            
        failures[s_name] = {
            "failure_probability": round(prob * 100, 1),
            "risk_level": risk,
            "predicted_failure_type": fail_type,
            "recommended_actions": actions,
            "metrics": {
                "cpu": round(metrics["cpu"], 1),
                "mem": round(metrics["mem"], 1),
                "disk": round(metrics["disk"], 1),
                "net": round(metrics["net"], 1),
                "resp": round(metrics["resp"], 1)
            }
        }
    return jsonify(failures)

# Endpoint for AI agent logs
@app.route('/api/agents', methods=['GET'])
def get_agents():
    state = simulator.get_simulation_state()
    return jsonify({
        "logs": simulator.agent_logs,
        "active_agent": state["active_agent"]
    })

# Endpoint for Self-Healing dashboard
@app.route('/api/self-healing', methods=['GET'])
def get_self_healing():
    state = simulator.get_simulation_state()
    logs = SelfHealingLog.query.order_by(SelfHealingLog.timestamp.desc()).all()
    return jsonify({
        "logs": [l.to_dict() for l in logs],
        "k8s_pods": state["k8s_pods"]
    })

# Endpoint for Incident Management
@app.route('/api/incidents', methods=['GET'])
def get_incidents():
    severity = request.args.get('severity')
    status = request.args.get('status')
    
    query = Incident.query
    if severity:
        query = query.filter_by(severity=severity)
    if status:
        query = query.filter_by(resolution_status=status)
        
    incidents = query.order_by(Incident.timestamp.desc()).all()
    return jsonify([i.to_dict() for i in incidents])

# Update incident resolution status manual override
@app.route('/api/incidents/<id>', methods=['POST'])
def update_incident(id):
    data = request.json
    status = data.get('resolution_status')
    
    incident = Incident.query.get(id)
    if not incident:
        return jsonify({"error": "Incident not found"}), 404
        
    incident.resolution_status = status
    if status == 'Resolved':
        incident.resolved_at = datetime.utcnow()
        # Restore server to healthy status if manually resolved
        server_id = incident.affected_component
        if server_id in simulator.injected_faults:
            del simulator.injected_faults[server_id]
        if server_id in simulator.servers:
            simulator.servers[server_id]["status"] = "Healthy"
            
    db.session.commit()
    return jsonify(incident.to_dict())

# Endpoint for MLOps details and training actions
@app.route('/api/mlops', methods=['GET'])
def get_mlops():
    models = MLModelStatus.query.all()
    model_dicts = {m.model_name: m.to_dict() for m in models}
    
    # If empty database, add default records
    if not model_dicts:
        init_ml_metadata()
        models = MLModelStatus.query.all()
        model_dicts = {m.model_name: m.to_dict() for m in models}
        
    return jsonify({
        "models": model_dicts,
        "has_uploaded_dataset": os.path.exists(UPLOADED_CSV_PATH)
    })

@app.route('/api/mlops/train', methods=['POST'])
def train_models():
    # If custom dataset uploaded, load it; else generate synthetic
    dataset_source = "synthetic"
    if os.path.exists(UPLOADED_CSV_PATH):
        try:
            df = pd.read_csv(UPLOADED_CSV_PATH)
            dataset_source = "uploaded"
        except Exception as e:
            df = generate_and_save_synthetic()
    else:
        df = generate_and_save_synthetic()
        
    # Mark as training
    for model_name in ['anomaly_detection', 'failure_prediction']:
        m = MLModelStatus.query.get(model_name)
        if m:
            m.training_status = 'Training'
    db.session.commit()
    
    # Train models
    try:
        metrics = MLManager.train_models(df)
        
        # Save updates to DB
        anom_meta = MLModelStatus.query.get('anomaly_detection')
        if anom_meta:
            anom_meta.accuracy = round(metrics['anomaly']['accuracy'], 4)
            anom_meta.training_status = 'Deployed'
            anom_meta.last_trained_at = datetime.utcnow()
            anom_meta.dataset_size = metrics['anomaly']['dataset_size']
            
        fail_meta = MLModelStatus.query.get('failure_prediction')
        if fail_meta:
            fail_meta.accuracy = round(metrics['failure']['accuracy'], 4)
            fail_meta.training_status = 'Deployed'
            fail_meta.last_trained_at = datetime.utcnow()
            fail_meta.dataset_size = metrics['failure']['dataset_size']
            
        db.session.commit()
        simulator.log_agent("AnalysisAgent", f"MLOps Pipeline: Model re-training completed successfully on '{dataset_source}' dataset. Accuracy: {metrics['failure']['accuracy']*100:.1f}%.")
        return jsonify({"status": "success", "metrics": metrics, "source": dataset_source})
    except Exception as e:
        for model_name in ['anomaly_detection', 'failure_prediction']:
            m = MLModelStatus.query.get(model_name)
            if m:
                m.training_status = 'Untrained'
        db.session.commit()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/mlops/evaluate', methods=['POST'])
def evaluate_models():
    # Evaluate models on fresh synthetic test batch
    df = generate_and_save_synthetic()
    features = ['CPU_Usage', 'Memory_Usage', 'Disk_Usage', 'Network_Traffic', 'Response_Time']
    X = df[features]
    y = df['Failure']
    
    rf = MLManager.load_failure_model()
    iso = MLManager.load_anomaly_model()
    
    if not rf or not iso:
        return jsonify({"error": "Models must be trained before evaluation"}), 400
        
    # Evaluate RF
    rf_preds = rf.predict(X)
    rf_acc = accuracy_score(y, rf_preds)
    rf_f1 = f1_score(y, rf_preds)
    
    # Evaluate ISO
    iso_preds = iso.predict(X)
    iso_binary = np.where(iso_preds == -1, 1, 0)
    iso_acc = accuracy_score(y, iso_binary)
    iso_f1 = f1_score(y, iso_binary)
    
    return jsonify({
        "anomaly": {"accuracy": round(iso_acc, 4), "f1_score": round(iso_f1, 4)},
        "failure": {"accuracy": round(rf_acc, 4), "f1_score": round(rf_f1, 4)},
        "evaluation_dataset_size": len(df)
    })

# Endpoint for CI/CD Pipeline
@app.route('/api/pipeline', methods=['GET'])
def get_pipeline():
    state = simulator.get_simulation_state()
    pipeline_data = state["pipeline"].copy()
    pipeline_data["simulation_speed"] = state["simulation_speed"]
    return jsonify(pipeline_data)


@app.route('/api/pipeline/run', methods=['POST'])
def run_pipeline():
    success = simulator.trigger_pipeline()
    if success:
        return jsonify({"status": "running"})
    return jsonify({"status": "already_running"}), 400

# Endpoint for Dataset Management
@app.route('/api/dataset/preview', methods=['GET'])
def preview_dataset():
    target_path = UPLOADED_CSV_PATH if os.path.exists(UPLOADED_CSV_PATH) else None
    
    if not target_path:
        # Load sample training dataset
        df = generate_and_save_synthetic()
    else:
        df = pd.read_csv(target_path)
        
    preview = df.head(15).to_dict(orient='records')
    
    # Calculate stats
    stats = {}
    for col in ['CPU_Usage', 'Memory_Usage', 'Disk_Usage', 'Network_Traffic', 'Response_Time']:
        stats[col] = {
            "mean": round(df[col].mean(), 2),
            "min": round(df[col].min(), 2),
            "max": round(df[col].max(), 2)
        }
        
    failures_count = int(df['Failure'].sum())
    healthy_count = len(df) - failures_count
    
    return jsonify({
        "preview": preview,
        "stats": stats,
        "rows_count": len(df),
        "failures_count": failures_count,
        "healthy_count": healthy_count,
        "is_custom": target_path is not None
    })

@app.route('/api/dataset/generate', methods=['GET'])
def download_dataset():
    df = generate_synthetic_data(1000)
    buffer = io.StringIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)
    
    mem_file = io.BytesIO()
    mem_file.write(buffer.getvalue().encode('utf-8'))
    mem_file.seek(0)
    
    return send_file(
        mem_file,
        as_attachment=True,
        download_name="devops_telemetry_training.csv",
        mimetype="text/csv"
    )

@app.route('/api/dataset/upload', methods=['POST'])
def upload_dataset():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file and file.filename.endswith('.csv'):
        try:
            df = pd.read_csv(file)
            required_cols = ['CPU_Usage', 'Memory_Usage', 'Disk_Usage', 'Network_Traffic', 'Response_Time', 'Failure']
            missing = [c for c in required_cols if c not in df.columns]
            if missing:
                return jsonify({"error": f"Missing columns in CSV: {', '.join(missing)}"}), 400
                
            df.to_csv(UPLOADED_CSV_PATH, index=False)
            
            preview = df.head(10).to_dict(orient='records')
            return jsonify({
                "status": "success",
                "rows_count": len(df),
                "preview": preview,
                "message": "Custom dataset uploaded successfully! You can now retrain models using this dataset."
            })
        except Exception as e:
            return jsonify({"error": f"Invalid CSV format: {str(e)}"}), 400
            
    return jsonify({"error": "Only CSV uploads are supported"}), 400

@app.route('/api/dataset/clear', methods=['POST'])
def clear_uploaded_dataset():
    if os.path.exists(UPLOADED_CSV_PATH):
        os.remove(UPLOADED_CSV_PATH)
    return jsonify({"status": "success"})

# Monitored Websites API Endpoints
@app.route('/api/websites', methods=['GET'])
def get_monitored_websites():
    websites = MonitoredWebsite.query.all()
    return jsonify([w.to_dict() for w in websites])

@app.route('/api/websites', methods=['POST'])
def add_monitored_website():
    data = request.json
    url = data.get('url')
    name = data.get('name')
    
    if not url or not name:
        return jsonify({"error": "Missing URL or name"}), 400
        
    import re
    # Clean name to contain only letters, numbers, and dashes (for safe server keys)
    clean_name = re.sub(r'[^a-zA-Z0-9\-]', '', name)
    if not clean_name:
        return jsonify({"error": "Invalid name. Name must contain letters or numbers."}), 400
        
    # Check for duplicate url or name
    existing = MonitoredWebsite.query.filter((MonitoredWebsite.url == url) | (MonitoredWebsite.name == clean_name)).first()
    if existing:
        return jsonify({"error": "Website with this URL or Name is already being monitored."}), 400
        
    try:
        new_web = MonitoredWebsite(url=url, name=clean_name)
        db.session.add(new_web)
        db.session.commit()
        
        # Log to simulator
        simulator.log_agent("MonitoringAgent", f"Configured external website monitor for '{clean_name}' at {url}.")
        return jsonify(new_web.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/websites/<int:id>', methods=['DELETE'])
def delete_monitored_website(id):
    web = MonitoredWebsite.query.get(id)
    if not web:
        return jsonify({"error": "Monitored website not found"}), 404
        
    try:
        name = web.name
        db.session.delete(web)
        db.session.commit()
        
        simulator.log_agent("MonitoringAgent", f"Removed external website monitor for '{name}'.")
        return jsonify({"status": "success"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Simulation Controls

@app.route('/api/simulation/fault', methods=['POST'])
def run_fault():
    data = request.json
    server_id = data.get('server_id')
    fault_type = data.get('fault_type')
    
    if not server_id or not fault_type:
        return jsonify({"error": "Missing server_id or fault_type"}), 400
        
    success = simulator.inject_fault(server_id, fault_type)
    if success:
        return jsonify({"status": "success"})
    return jsonify({"error": f"Server {server_id} not found"}), 404

@app.route('/api/simulation/speed', methods=['POST'])
def update_speed():
    data = request.json
    speed = data.get('speed')
    if speed is None:
        return jsonify({"error": "Missing speed value"}), 400
        
    new_speed = simulator.set_speed(speed)
    return jsonify({"status": "success", "speed": new_speed})


# Helper seeding logic
def init_ml_metadata():
    for name, acc in [('anomaly_detection', 0.925), ('failure_prediction', 0.984)]:
        m = MLModelStatus.query.get(name)
        if not m:
            m = MLModelStatus(
                model_name=name,
                accuracy=acc,
                training_status='Deployed',
                last_trained_at=datetime.utcnow(),
                dataset_size=1000
            )
            db.session.add(m)
    db.session.commit()

def generate_and_save_synthetic():
    df = generate_synthetic_data(1000)
    return df

# Database initialization before server starts
@app.before_request
def initial_db_creation():
    db.create_all()
    init_ml_metadata()
    # Generate initial models if not present
    if MLManager.load_anomaly_model() is None or MLManager.load_failure_model() is None:
        df = generate_and_save_synthetic()
        MLManager.train_models(df)
    # Remove before_request trigger once done
    app.before_request_funcs[None].remove(initial_db_creation)


# Run entry point
if __name__ == '__main__':
    # Initialize DB outside requests
    with app.app_context():
        db.create_all()
        init_ml_metadata()
        
    # Generate initial models if not present
    if MLManager.load_anomaly_model() is None or MLManager.load_failure_model() is None:
        with app.app_context():
            df = generate_and_save_synthetic()
            MLManager.train_models(df)

            
    simulator.set_app(app)
    simulator.start()
    
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
