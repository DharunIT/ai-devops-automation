# AutoOps AI
### AI-Powered Infrastructure Monitoring, Failure Prediction & Self-Healing Platform

[![Platform: Python 3.10+](https://img.shields.io/badge/Platform-Python_3.10+-3776AB.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Backend: Flask & SQLAlchemy](https://img.shields.io/badge/Backend-Flask_REST_API-000000.svg?style=flat&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![ML: scikit--learn & XGBoost](https://img.shields.io/badge/Machine_Learning-scikit--learn_%7C_XGBoost-F7931E.svg?style=flat&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Tracking: MLflow](https://img.shields.io/badge/Tracking-MLflow_v3-0194E2.svg?style=flat&logo=mlflow&logoColor=white)](https://mlflow.org/)
[![Deployment: Render Ready](https://img.shields.io/badge/Deployment-Render_Ready-46E3B7.svg?style=flat&logo=render&logoColor=white)](https://render.com/)

---

## 1. Problem Statement
In enterprise cloud environments, site reliability engineering (SRE) and DevOps teams face severe challenges:
- **Alert Fatigue & Delayed MTTR**: Static metric thresholds generate noisy false alarms, while genuine cascading outages take 30–90 minutes to diagnose manually.
- **Disconnected Observability**: Metrics, incident ticketing, failure prediction, and code quality audits exist in isolated silos across multiple tools.
- **Manual Incident Triage**: Infrastructure failures (CPU spikes, memory leaks, disk exhaustion, pod crashes) require manual engineer intervention rather than autonomous, closed-loop remediation.
- **Defect Leakage**: Defective code modules with high cyclomatic complexity and unaddressed static warnings slip through CI/CD pipelines, triggering runtime outages.

---

## 2. The Solution: AutoOps AI
**AutoOps AI** is an autonomous AI-driven infrastructure intelligence platform that:
1. **Continuously ingests multi-dimensional cluster telemetry** (CPU, RAM, Disk, Network throughput, API response latency).
2. **Detects anomalous telemetry patterns** using an unsupervised **Isolation Forest** outlier scoring engine.
3. **Classifies failure modes and predicts outage probabilities** via a supervised **Random Forest** classification model.
4. **Performs automated Root Cause Analysis (RCA)** to correlate breaching metrics with specific system components.
5. **Executes autonomous self-healing remediation playbooks** (Kubernetes pod rollout restart, horizontal pod scaling, disk log rotation, ingress throttling).
6. **Audits code-level defect vulnerabilities** using a dual **Random Forest & XGBoost** benchmark trained on 60,000 software metric samples.
7. **Tracks enterprise model lineage and evaluation parameters** in a centralized **MLflow** tracking registry.

> [!IMPORTANT]
> **Prototype & Simulation Notice**: AutoOps AI simulates multi-node cluster topology, container runtimes, and Kubernetes orchestration state machines in parallel with genuine machine learning inference and MLflow tracking. It does not directly manage a physical production Kubernetes cluster.

---

## 3. High-Level Architecture

```
                                 ┌────────────────────────────────────────────────────────┐
                                 │                   AutoOps AI Dashboard                  │
                                 │         Unified Single-Page Observability Interface     │
                                 └───────────────────────────┬────────────────────────────┘
                                                             │ REST API / Polling (2-3s)
                                                             ▼
                                 ┌────────────────────────────────────────────────────────┐
                                 │                 Flask Web Application                  │
                                 │            (backend/app.py & SQLAlchemy)               │
                                 └──────────┬─────────────────────────────┬───────────────┘
                                            │                             │
                     ┌──────────────────────┴───────┐             ┌───────┴──────────────────────┐
                     ▼                              ▼             ▼                              ▼
          ┌────────────────────┐         ┌────────────────────┐┌────────────────────┐┌────────────────────┐
          │ DevOps Simulator   │         │ ML Inference Engine││ MLflow Registry    ││ Defect Prediction  │
          │ (simulation.py)    │         │ (backend/models.py)││ (sqlite:///mlflow) ││ (defect_prediction)│
          ├────────────────────┤         ├────────────────────┤├────────────────────┤├────────────────────┤
          │ • Virtual Nodes    │         │ • Isolation Forest ││ • devops-infra     ││ • Random Forest    │
          │ • Containers & Pods│         │ • Random Forest    ││ • defect-prediction││ • XGBoost (99.98%) │
          │ • Web Latency Ping │         │ • Anomaly Scoring  ││ • jm1-benchmark    ││ • 60k Sample Audit │
          └──────────┬─────────┘         └──────────┬─────────┘└────────────────────┘└────────────────────┘
                     │                              │
                     └──────────────────────┬───────┘
                                            ▼
                           ┌───────────────────────────────────┐
                           │      Autonomous Self-Healing      │
                           │   DETECTED ➔ ANALYZING ➔ RCA      │
                           │   ➔ HEALING ➔ RECOVERED           │
                           └───────────────────────────────────┘
```

---

## 4. Key Application Features

### 🖥️ Persistent Navigation & Command Center
- **Unified Sidebar Navigation**: Organized by functional domains:
  - **Overview**: Real-time cluster health score, top 6 metric cards, streaming agent terminal, and timeline chart.
  - **Infrastructure**: Live Telemetry Monitoring, Server Nodes Inventory, and Real HTTP Website Latency Tracking.
  - **AI Intelligence**: Unsupervised Anomaly Detection, Failure Prediction, and 5-stage Root Cause Analysis.
  - **Self-Healing**: Active Incident lifecycle tracker, Autonomous Healing Actions, and Recovery History archive.
  - **ML Lab**: Software Defect Prediction Lab, Cross-Model Benchmark Matrix, and MLflow Experiment Tracking.
  - **CI/CD**: Visual 6-stage continuous delivery pipeline with automated model validation gates.
  - **Settings**: Simulation speed accelerator, polling interval selector, and interactive Presentation Mode.

### ⚡ Failure Simulation Engine
Supports real-time fault injection on target nodes:
- **CPU Spike** (utilization hits 95–100%)
- **Memory Leak** (RAM allocation climbs to 98% OOM boundary)
- **Disk Full** (root file system saturation at 99%)
- **Network Bottleneck** (traffic spike to 110 MB/s, latency to 2000 ms)
- **Kubernetes Pod Crash** (replica failure triggering automated restart)

### 🧪 ML Lab & Software Defect Prediction
- **Distinct from Infrastructure Failure Prediction**: Analyzes continuous software engineering code telemetry (lines of code, cyclomatic complexity, static analysis warnings, test coverage, code churn).
- **Benchmarked Models**:
  - **Random Forest Classifier**: **100.00%** Test Accuracy, 1.0000 F1 Score.
  - **XGBoost Classifier**: **99.98%** Test Accuracy, 0.9999 F1 Score.
- **Interactive Defect Playground**: Test pull request code metrics in real time to evaluate defect vulnerability and risk scores.

### 🔬 Enterprise MLflow Tracking
- Integrated with SQLite backend store (`mlflow.db`) and local artifact store (`./mlruns`).
- Experiment suites: `devops-infrastructure`, `defect-prediction`, `jm1-benchmark`.
- Embedded direct link to launch the standalone MLflow Tracking UI on Port 5001.

---

## 5. Machine Learning Models Summary

| Model Identifier | Task Domain | Algorithm | Accuracy | Precision | Recall | F1 Score | Dataset Size | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Defect Classifier (RF)** | Software Defect Prediction | Random Forest | **100.00%** | 1.0000 | 1.0000 | 1.0000 | 60,000 samples | Deployed |
| **Defect Classifier (XGB)** | Software Defect Prediction | XGBoost | **99.98%** | 1.0000 | 0.9998 | 0.9999 | 60,000 samples | Deployed |
| **System Failure Predictor** | DevOps Infrastructure | Random Forest | **100.00%** | 1.0000 | 1.0000 | 1.0000 | 1,000 samples | Deployed |
| **Telemetry Anomaly Detector**| DevOps Infrastructure | Isolation Forest | **99.80%** | 0.9933 | 1.0000 | 0.9933 | 1,000 samples | Deployed |

---

## 6. How Self-Healing Works

The platform implements an autonomous closed-loop agent swarm:
```
1. MonitoringAgent: Ingests telemetry every 2 seconds. Identifies metrics breaching baseline thresholds.
                    Creates a persistent Incident ticket (INC-XXXXX) in SQLite.
2. AnalysisAgent:   Feeds normalized 5-dimensional metrics to the Isolation Forest model.
                    Calculates negative anomaly score and confirms anomalous telemetry pattern.
3. RCAAgent:        Invokes Random Forest classification model to determine root cause failure mode
                    (e.g., "CPU Saturation", "Out of Memory", "Disk Full").
4. HealingAgent:    Dispatches and executes the corresponding Kubernetes remediation playbook:
                    • CPU Saturation  ➔ Scale Kubernetes pod replicas (HPA) from 2 to 4
                    • Memory Leak     ➔ Trigger rolling container restart (kubectl rollout restart)
                    • Disk Full       ➔ Execute log rotation cron and purge build caches
                    • Network Spike   ➔ Scale ingress bandwidth gates and proxy rate-limiters
5. MonitoringAgent: Verifies stabilized telemetry parameters. Marks incident as RESOLVED.
```

---

## 7. Technology Stack
- **Backend**: Python 3.10+, Flask, Flask-CORS, Flask-SQLAlchemy, SQLite.
- **Machine Learning**: scikit-learn, XGBoost, pandas, NumPy, joblib.
- **MLOps & Tracking**: MLflow v3 (SQLite backend store).
- **Frontend Architecture**: Modern Vanilla JavaScript, React 17 (Babel Standalone), Tailwind CSS, Chart.js, FontAwesome 6, Inter & Fira Code typography.
- **Production Server**: Gunicorn (WSGI).

---

## 8. Local Setup & Execution

### Prerequisites
- Python 3.10, 3.11, or 3.12 installed.
- Git installed.

### 1. Clone & Set Up Environment
```bash
git clone https://github.com/DharunIT/ai-devops-automation.git
cd ai-devops-automation

# Optional: Create virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Launch the Application
Run the startup script:
```bash
python run.py
```
The application will start on **http://localhost:5000** and automatically launch your browser.

### 3. Launch MLflow Tracking UI (Optional)
To view raw experiment tracking and artifacts in the official MLflow web interface:
```bash
python -m mlflow ui --backend-store-uri sqlite:///mlflow.db --port 5001
```
Open **http://localhost:5001** in your browser.

---

## 9. How to Run the ML Pipelines

To retrain the software defect prediction models and log fresh runs to MLflow:
```bash
# Execute end-to-end defect prediction pipeline
python run_defect_pipeline.py

# Execute NASA JM1 benchmark training
python jm1_model_training.py

# Seed MLflow experiment runs
python seed_mlflow_runs.py
```
Alternatively, navigate to **ML Lab ➔ MLflow Experiments** on the dashboard and click **"Train & Log All Pipelines"**.

---

## 10. Cloud Deployment (Render / Container PaaS)

AutoOps AI is configured for one-click deployment on **Render**:

1. **Create Web Service** on Render connected to this repository.
2. **Environment**: `Python 3`
3. **Build Command**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Start Command**:
   ```bash
   gunicorn backend.app:app --bind 0.0.0.0:$PORT --workers 1 --threads 4
   ```
5. **Environment Variables**:
   - `PORT`: Automatically set by Render.
   - `AUTO_OPEN_BROWSER`: `false`

The application binds dynamically to `0.0.0.0:$PORT` and starts the background simulation loop during module initialization.

---

## 11. Presentation & Demo Guide

For project reviews, college vivas, or client demonstrations, use the built-in **Settings ➔ Presentation Mode**:
1. **Overview**: Demonstrate the healthy operational baseline across all 6 telemetry cards.
2. **Simulation**: Click **"Simulate Failure"** and inject a **CPU Spike** on Server-01.
3. **Anomaly Detection**: Show Isolation Forest calculating an outlier score.
4. **RCA Pipeline**: Show Random Forest diagnosing **CPU Saturation**.
5. **Self-Healing**: Watch the active incident progress from `DETECTED ➔ HEALING ➔ RECOVERED`.
6. **Defect Lab**: Demonstrate the pull request defect playground.
7. **MLflow**: Open MLflow tracking to show model lineage and parameter storage.
8. **Overview**: Return to the overview showing 100% recovered cluster telemetry.

---

## 12. Limitations
- **Simulated Infrastructure Runtimes**: The telemetry streams and Kubernetes pods are managed by an asynchronous background daemon thread (`backend/simulation.py`) rather than a live AWS/GCP cluster.
- **External Website Ping**: Website monitoring relies on direct HTTP GET pinging via Python urllib; firewalls or rate-limited targets may report high latency.
- **Single-Node SQLite**: SQLite is used for lightweight local and prototype persistence; production scaling would transition to PostgreSQL and Redis.

---

## 13. License & Authors
Developed as part of the **AI DevOps Automation Platform (AutoOps)** project.
Author: **DharunIT** ([GitHub Profile](https://github.com/DharunIT))
Licensed under the [MIT License](LICENSE).