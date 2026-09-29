/**
 * AutoOps AI - Central Frontend API Service Layer
 * Reusable, clean client for all backend Flask endpoints.
 */

const API_BASE = '';

const handleResponse = async (res) => {
    if (!res.ok) {
        let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
        try {
            const data = await res.json();
            if (data && (data.error || data.message)) {
                errorMsg = data.error || data.message;
            }
        } catch (_) {}
        throw new Error(errorMsg);
    }
    return res.json();
};

window.AutoOpsAPI = {
    // 1. Status & Overview
    status: {
        get: () => fetch(`${API_BASE}/api/status`).then(handleResponse)
    },

    // 2. Telemetry & Live Monitoring
    monitoring: {
        getMetrics: (limit = 30) => fetch(`${API_BASE}/api/metrics?limit=${limit}`).then(handleResponse),
        getAnomalies: (limit = 50) => fetch(`${API_BASE}/api/anomalies?limit=${limit}`).then(handleResponse)
    },

    // 3. AI Models & Failure Prediction
    models: {
        getFailures: () => fetch(`${API_BASE}/api/failures`).then(handleResponse),
        getMLOps: () => fetch(`${API_BASE}/api/mlops`).then(handleResponse),
        train: () => fetch(`${API_BASE}/api/mlops/train`, { method: 'POST' }).then(handleResponse),
        evaluate: () => fetch(`${API_BASE}/api/mlops/evaluate`, { method: 'POST' }).then(handleResponse),
        getComparison: () => fetch(`${API_BASE}/api/models/comparison`).then(handleResponse)
    },

    // 4. Incidents & RCA
    incidents: {
        getAll: (severity = '', status = '') => {
            const params = new URLSearchParams();
            if (severity) params.append('severity', severity);
            if (status) params.append('status', status);
            const query = params.toString() ? `?${params.toString()}` : '';
            return fetch(`${API_BASE}/api/incidents${query}`).then(handleResponse);
        },
        resolve: (id) => fetch(`${API_BASE}/api/incidents/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolution_status: 'Resolved' })
        }).then(handleResponse)
    },

    // 5. Self-Healing Hub
    selfHealing: {
        get: () => fetch(`${API_BASE}/api/self-healing`).then(handleResponse)
    },

    // 6. Simulation Controls
    simulation: {
        injectFault: (serverId, faultType) => fetch(`${API_BASE}/api/simulation/fault`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ server_id: serverId, fault_type: faultType })
        }).then(handleResponse),
        setSpeed: (speed) => fetch(`${API_BASE}/api/simulation/speed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ speed: parseFloat(speed) })
        }).then(handleResponse)
    },

    // 7. Monitored Websites
    websites: {
        getAll: () => fetch(`${API_BASE}/api/websites`).then(handleResponse),
        add: (name, url) => fetch(`${API_BASE}/api/websites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, url })
        }).then(handleResponse),
        delete: (id) => fetch(`${API_BASE}/api/websites/${id}`, { method: 'DELETE' }).then(handleResponse)
    },

    // 8. MLflow Experiment Tracking
    mlflow: {
        getRuns: () => fetch(`${API_BASE}/api/mlflow/runs`).then(handleResponse),
        trainAll: () => fetch(`${API_BASE}/api/mlflow/train_all`, { method: 'POST' }).then(handleResponse)
    },

    // 9. Software Defect Prediction
    defect: {
        getMetrics: () => fetch(`${API_BASE}/api/defect/metrics`).then(handleResponse),
        predict: (features) => fetch(`${API_BASE}/api/defect/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(features)
        }).then(handleResponse)
    },

    // 10. CI/CD Pipeline
    pipeline: {
        get: () => fetch(`${API_BASE}/api/pipeline`).then(handleResponse),
        run: () => fetch(`${API_BASE}/api/pipeline/run`, { method: 'POST' }).then(handleResponse)
    },

    // 11. AI Agents & Logs
    agents: {
        get: () => fetch(`${API_BASE}/api/agents`).then(handleResponse)
    },

    // 12. Dataset Management
    dataset: {
        preview: () => fetch(`${API_BASE}/api/dataset/preview`).then(handleResponse),
        clear: () => fetch(`${API_BASE}/api/dataset/clear`, { method: 'POST' }).then(handleResponse),
        upload: (file) => {
            const formData = new FormData();
            formData.append('file', file);
            return fetch(`${API_BASE}/api/dataset/upload`, {
                method: 'POST',
                body: formData
            }).then(handleResponse);
        }
    }
};
