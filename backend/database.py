from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class MetricRecord(db.Model):
    __tablename__ = 'metric_records'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    server_id = db.Column(db.String(50), nullable=False)
    cpu_usage = db.Column(db.Float, nullable=False)
    memory_usage = db.Column(db.Float, nullable=False)
    disk_usage = db.Column(db.Float, nullable=False)
    network_traffic = db.Column(db.Float, nullable=False)
    response_time = db.Column(db.Float, nullable=False)
    is_anomaly = db.Column(db.Boolean, default=False)
    anomaly_score = db.Column(db.Float, default=0.0)

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'server_id': self.server_id,
            'cpu_usage': self.cpu_usage,
            'memory_usage': self.memory_usage,
            'disk_usage': self.disk_usage,
            'network_traffic': self.network_traffic,
            'response_time': self.response_time,
            'is_anomaly': self.is_anomaly,
            'anomaly_score': self.anomaly_score
        }

class Incident(db.Model):
    __tablename__ = 'incidents'
    
    id = db.Column(db.String(50), primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    severity = db.Column(db.String(20), nullable=False)  # 'info', 'warning', 'critical'
    affected_component = db.Column(db.String(100), nullable=False)
    root_cause = db.Column(db.String(255), nullable=True)
    resolution_status = db.Column(db.String(50), default='Open', nullable=False)  # 'Open', 'Investigating', 'Resolving', 'Resolved'
    resolved_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'severity': self.severity,
            'affected_component': self.affected_component,
            'root_cause': self.root_cause,
            'resolution_status': self.resolution_status,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }

class SelfHealingLog(db.Model):
    __tablename__ = 'self_healing_logs'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    incident_id = db.Column(db.String(50), nullable=True)
    action_type = db.Column(db.String(50), nullable=False)  # 'restart', 'scale', 'redeploy'
    details = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), nullable=False)  # 'Triggered', 'In Progress', 'Success', 'Failed'

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'incident_id': self.incident_id,
            'action_type': self.action_type,
            'details': self.details,
            'status': self.status
        }

class MLModelStatus(db.Model):
    __tablename__ = 'ml_model_status'
    
    model_name = db.Column(db.String(100), primary_key=True)  # 'anomaly_detection', 'failure_prediction'
    accuracy = db.Column(db.Float, nullable=True)
    training_status = db.Column(db.String(50), nullable=False)  # 'Untrained', 'Training', 'Deployed'
    last_trained_at = db.Column(db.DateTime, nullable=True)
    dataset_size = db.Column(db.Integer, nullable=True)

    def to_dict(self):
        return {
            'model_name': self.model_name,
            'accuracy': self.accuracy,
            'training_status': self.training_status,
            'last_trained_at': self.last_trained_at.isoformat() if self.last_trained_at else None,
            'dataset_size': self.dataset_size
        }

class MonitoredWebsite(db.Model):
    __tablename__ = 'monitored_websites'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    url = db.Column(db.String(255), unique=True, nullable=False)
    name = db.Column(db.String(100), unique=True, nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'url': self.url,
            'name': self.name,
            'added_at': self.added_at.isoformat() if self.added_at else None
        }

