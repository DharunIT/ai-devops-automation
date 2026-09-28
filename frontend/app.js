/** @jsxRuntime classic */
const { useState, useEffect, useRef } = React;

// Helper to format ISO Timestamp
const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// Component: Active Agent Node Visualization
function AgentVisualization({ activeAgent }) {
    const agents = [
        { id: 'MonitoringAgent', label: 'Monitoring Agent', icon: 'fa-desktop', desc: 'Telemetry Scanner' },
        { id: 'AnalysisAgent', label: 'Analysis Agent', icon: 'fa-brain', desc: 'Anomaly Detector' },
        { id: 'RCAAgent', label: 'RCA Agent', icon: 'fa-search', desc: 'Root Cause Analyzer' },
        { id: 'HealingAgent', label: 'Self-Healing Agent', icon: 'fa-heart-beat', desc: 'Remediation Driver' }
    ];
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {agents.map((agent) => {
                const isActive = activeAgent === agent.id;
                return (
                    <div 
                        key={agent.id} 
                        className={`glass-panel p-4 rounded-xl relative transition-all duration-500 overflow-hidden ${
                            isActive ? 'border-cyan-500/50 glow-pulse-cyan' : 'opacity-60'
                        }`}
                    >
                        {isActive && (
                            <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-cyan-400 m-3 animate-ping" />
                        )}
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                                isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
                            }`}>
                                <i className={`fas ${agent.icon}`} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm">{agent.label}</h4>
                                <p className="text-xs text-slate-400">{agent.desc}</p>
                            </div>
                        </div>
                        <div className="mt-2 text-center">
                            <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                                isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'
                            }`}>
                                {isActive ? 'Active Processing' : 'Idle'}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Main App Container
function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [status, setStatus] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [anomalies, setAnomalies] = useState([]);
    const [failures, setFailures] = useState(null);
    const [agentLogs, setAgentLogs] = useState([]);
    const [activeAgent, setActiveAgent] = useState('MonitoringAgent');
    const [healing, setHealing] = useState(null);
    const [incidents, setIncidents] = useState([]);
    const [mlops, setMlops] = useState(null);
    const [pipeline, setPipeline] = useState(null);
    const [dataset, setDataset] = useState(null);
    const [simSpeed, setSimSpeed] = useState(1.0);
    const [uploading, setUploading] = useState(false);
    
    // Website monitoring state
    const [websites, setWebsites] = useState([]);
    const [newWebName, setNewWebName] = useState('');
    const [newWebUrl, setNewWebUrl] = useState('');
    const [addingWebsite, setAddingWebsite] = useState(false);
    
    // MLflow tracking state
    const [mlflowRuns, setMlflowRuns] = useState(null);
    
    // Dropdown filters for Incidents
    const [incSeverity, setIncSeverity] = useState('');
    const [incStatus, setIncStatus] = useState('');
    
    // Fault injection UI state
    const [faultServer, setFaultServer] = useState('Server-01');
    const [faultType, setFaultType] = useState('cpu_spike');
    
    // References for charts
    const mainChartRef = useRef(null);
    const mainChartInst = useRef(null);
    
    // Auto-scroll agent terminal logs
    const terminalEndRef = useRef(null);
    
    // Periodic fetching helper
    const fetchData = async () => {
        try {
            const [statusRes, metricsRes, failuresRes, agentsRes, healingRes, incidentsRes, pipelineRes] = await Promise.all([
                fetch('/api/status').then(r => r.json()),
                fetch('/api/metrics').then(r => r.json()),
                fetch('/api/failures').then(r => r.json()),
                fetch('/api/agents').then(r => r.json()),
                fetch('/api/self-healing').then(r => r.json()),
                fetch(`/api/incidents?severity=${incSeverity}&status=${incStatus}`).then(r => r.json()),
                fetch('/api/pipeline').then(r => r.json())
            ]);
            
            setStatus(statusRes);
            setMetrics(metricsRes);
            setFailures(failuresRes);
            setAgentLogs(agentsRes.logs);
            setActiveAgent(agentsRes.active_agent || 'MonitoringAgent');
            setHealing(healingRes);
            setIncidents(incidentsRes);
            setPipeline(pipelineRes);
            setSimSpeed(pipelineRes.simulation_speed || 1.0);
        } catch (e) {
            console.error("Failed to fetch dashboard updates", e);
        }
    };
    
    // Initial and periodic update
    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, [incSeverity, incStatus]);
    
    // Trigger terminal scroll
    useEffect(() => {
        if (terminalEndRef.current) {
            terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [agentLogs]);
    
    // Fetch tab-specific data
    useEffect(() => {
        if (activeTab === 'mlops') {
            fetch('/api/mlops').then(r => r.json()).then(setMlops);
            fetch('/api/mlflow/runs').then(r => r.json()).then(setMlflowRuns).catch(() => {});
        } else if (activeTab === 'datasets') {
            fetch('/api/dataset/preview').then(r => r.json()).then(setDataset);
        } else if (activeTab === 'websites') {
            fetch('/api/websites').then(r => r.json()).then(setWebsites);
        }
    }, [activeTab]);

    // Handle dashboard summary charts (CPU/Mem/Disk averages over time)
    useEffect(() => {
        if (activeTab === 'dashboard' && metrics && metrics.historical && mainChartRef.current) {
            const ctx = mainChartRef.current.getContext('2d');
            
            // Extract unique timestamps and compute averages
            const servers = Object.keys(metrics.historical);
            if (servers.length === 0 || metrics.historical[servers[0]].length === 0) return;
            
            const firstServerHistory = metrics.historical[servers[0]];
            const labels = firstServerHistory.map(h => formatTime(h.timestamp));
            
            const cpuData = [];
            const memData = [];
            const respData = [];
            
            const historyLength = firstServerHistory.length;
            for (let i = 0; i < historyLength; i++) {
                let cpuSum = 0, memSum = 0, respSum = 0;
                let count = 0;
                
                servers.forEach(s => {
                    const h = metrics.historical[s][i];
                    if (h) {
                        cpuSum += h.cpu_usage;
                        memSum += h.memory_usage;
                        respSum += h.response_time;
                        count++;
                    }
                });
                
                cpuData.push(count > 0 ? cpuSum / count : 0);
                memData.push(count > 0 ? memSum / count : 0);
                respData.push(count > 0 ? respSum / count : 0);
            }
            
            if (mainChartInst.current) {
                mainChartInst.current.destroy();
            }
            
            mainChartInst.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Avg CPU %',
                            data: cpuData,
                            borderColor: '#06b6d4',
                            backgroundColor: 'rgba(6, 182, 212, 0.05)',
                            fill: true,
                            tension: 0.3,
                            borderWidth: 2
                        },
                        {
                            label: 'Avg Memory %',
                            data: memData,
                            borderColor: '#a855f7',
                            backgroundColor: 'rgba(168, 85, 247, 0.05)',
                            fill: true,
                            tension: 0.3,
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
                        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } }, min: 0, max: 100 }
                    },
                    plugins: {
                        legend: { labels: { color: '#f8fafc', font: { size: 11 } } }
                    }
                }
            });
        }
    }, [activeTab, metrics]);

    // Handle UI actions
    const handleInjectFault = async () => {
        try {
            await fetch('/api/simulation/fault', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ server_id: faultServer, fault_type: faultType })
            });
            fetchData();
        } catch (e) {
            console.error("Fault injection failed", e);
        }
    };
    
    const handleSimulationSpeed = async (e) => {
        const speed = parseFloat(e.target.value);
        setSimSpeed(speed);
        try {
            await fetch('/api/simulation/speed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ speed })
            });
        } catch (e) {
            console.error("Failed updating speed", e);
        }
    };
    
    const handleTriggerPipeline = async () => {
        try {
            await fetch('/api/pipeline/run', { method: 'POST' });
            fetchData();
        } catch (e) {
            console.error("Trigger pipeline failed", e);
        }
    };
    
    const handleManualResolve = async (id) => {
        try {
            await fetch(`/api/incidents/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resolution_status: 'Resolved' })
            });
            fetchData();
        } catch (e) {
            console.error("Manual resolution failed", e);
        }
    };
    
    const handleTrainModels = async () => {
        if (!mlops) return;
        setMlops({
            ...mlops,
            models: {
                anomaly_detection: { ...mlops.models.anomaly_detection, training_status: 'Training' },
                failure_prediction: { ...mlops.models.failure_prediction, training_status: 'Training' }
            }
        });
        
        try {
            const res = await fetch('/api/mlops/train', { method: 'POST' }).then(r => r.json());
            if (res.status === 'success') {
                const mlopsRes = await fetch('/api/mlops').then(r => r.json());
                setMlops(mlopsRes);
                alert("ML Models retrained and deployed successfully!");
            }
        } catch (e) {
            console.error("Model training failed", e);
        }
    };
    
    const handleEvaluateModels = async () => {
        try {
            const res = await fetch('/api/mlops/evaluate', { method: 'POST' }).then(r => r.json());
            alert(`Evaluation Results:\nAnomaly model Accuracy: ${res.anomaly.accuracy*100}%\nFailure classification Accuracy: ${res.failure.accuracy*100}%`);
        } catch (e) {
            console.error("Model evaluation failed", e);
        }
    };
    
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const res = await fetch('/api/dataset/upload', {
                method: 'POST',
                body: formData
            }).then(r => r.json());
            
            if (res.error) {
                alert(`Error: ${res.error}`);
            } else {
                alert(res.message);
                const previewRes = await fetch('/api/dataset/preview').then(r => r.json());
                setDataset(previewRes);
            }
        } catch (err) {
            console.error("Upload error", err);
        } finally {
            setUploading(false);
        }
    };
    
    const handleClearDataset = async () => {
        if (!confirm("Are you sure you want to revert to the default training dataset?")) return;
        try {
            await fetch('/api/dataset/clear', { method: 'POST' });
            const previewRes = await fetch('/api/dataset/preview').then(r => r.json());
            setDataset(previewRes);
        } catch (e) {
            console.error("Dataset clear failed", e);
        }
    };
    
    const handleAddWebsite = async () => {
        if (!newWebName.trim() || !newWebUrl.trim()) return;
        setAddingWebsite(true);
        try {
            const res = await fetch('/api/websites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newWebName.trim(), url: newWebUrl.trim() })
            }).then(r => r.json());
            if (res.error) {
                alert('Error: ' + res.error);
            } else {
                setNewWebName('');
                setNewWebUrl('');
                const updated = await fetch('/api/websites').then(r => r.json());
                setWebsites(updated);
            }
        } catch (e) {
            console.error('Add website failed', e);
        } finally {
            setAddingWebsite(false);
        }
    };
    
    const handleDeleteWebsite = async (id) => {
        if (!confirm('Remove this monitored website?')) return;
        try {
            await fetch(`/api/websites/${id}`, { method: 'DELETE' });
            const updated = await fetch('/api/websites').then(r => r.json());
            setWebsites(updated);
        } catch (e) {
            console.error('Delete website failed', e);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-64 glass-panel border-r border-slate-800 flex flex-col justify-between p-4 z-10">
                <div>
                    {/* Header Title */}
                    <div className="flex items-center gap-3 px-2 py-4 border-b border-slate-800/80 mb-6">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                            <i className="fas fa-microchip-adaptive text-lg" />
                        </div>
                        <div>
                            <h1 className="font-bold text-sm tracking-wide text-white leading-tight">AutoOps AI</h1>
                            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">MLOps & Self-Healing</p>
                        </div>
                    </div>
                    
                    {/* Menu links */}
                    <nav className="space-y-1.5">
                        {[
                            { id: 'dashboard', label: 'Dashboard', icon: 'fa-th-large' },
                            { id: 'monitoring', label: 'Infrastructure Metrics', icon: 'fa-chart-area' },
                            { id: 'anomalies', label: 'Anomaly Detection', icon: 'fa-shield-virus' },
                            { id: 'failures', label: 'Failure Prediction', icon: 'fa-stethoscope' },
                            { id: 'agents', label: 'AI Agent Lounge', icon: 'fa-robot' },
                            { id: 'selfhealing', label: 'Self-Healing Hub', icon: 'fa-heartbeat' },
                            { id: 'incidents', label: 'Incidents Center', icon: 'fa-briefcase' },
                            { id: 'mlops', label: 'MLOps Dashboard', icon: 'fa-cogs' },
                            { id: 'cicd', label: 'CI/CD Pipeline', icon: 'fa-code-branch' },
                            { id: 'datasets', label: 'Dataset Manager', icon: 'fa-database' },
                            { id: 'websites', label: 'Website Monitor', icon: 'fa-globe' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                                    activeTab === tab.id 
                                    ? 'bg-gradient-to-r from-cyan-600/20 to-indigo-600/25 border-l-2 border-cyan-500 text-white shadow-inner' 
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                                }`}
                            >
                                <i className={`fas ${tab.icon} w-4 text-center`} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                
                {/* Simulation Control panel in Sidebar */}
                <div className="pt-4 border-t border-slate-800/80">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sim Acceleration</span>
                        <span className="text-xs font-mono text-cyan-400 font-bold">{simSpeed}x</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.2" 
                        max="5.0" 
                        step="0.2" 
                        value={simSpeed}
                        onChange={handleSimulationSpeed}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500" 
                    />
                    <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1">
                        <span>0.2x (Slow)</span>
                        <span>5.0x (Fast)</span>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${status && status.app_status === 'Healthy' ? 'bg-emerald-500 glow-pulse-cyan' : 'bg-rose-500 glow-pulse-red'}`} />
                        <span className="text-xs font-semibold text-slate-300">
                            System: {status ? status.app_status : 'Loading...'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Dashboard Workspace */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#070b13]">
                {/* Header Navbar */}
                <header className="h-16 border-b border-slate-800/60 glass-panel flex items-center justify-between px-6 z-10">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Environment:</span>
                        <span className="text-xs font-mono font-bold bg-slate-800 text-cyan-400 px-2 py-0.5 rounded border border-slate-700/60">SIMULATION-CLUSTER-01</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Agent Focus:</span>
                            <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                                <i className="fas fa-robot animate-bounce" />
                                {status && status.active_agent ? status.active_agent.replace('Agent', ' Agent') : 'Loading...'}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Sub-panels container */}
                <main className="flex-1 overflow-y-auto p-6 relative">
                    
                    {/* 1. DASHBOARD TAB */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            {/* Summary stat cards grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { title: "Total Infrastructure Nodes", value: status ? status.servers_count : '-', desc: "Virtual Servers Active", icon: "fa-server", color: "text-blue-400" },
                                    { title: "Container Microservices", value: status ? status.containers_count : '-', desc: "Docker Containers Running", icon: "fa-cubes", color: "text-purple-400" },
                                    { title: "Kubernetes Orchestrated Pods", value: status ? status.k8s_pods_count : '-', desc: "Replicated Pod Instances", icon: "fa-circle-notch", color: "text-indigo-400" },
                                    { title: "Incident Recovery Loop", value: status ? `${status.success_healing_actions}/${status.total_healing_actions}` : '-', desc: "Successful Healing Tasks", icon: "fa-magic", color: "text-emerald-400" }
                                ].map((stat, idx) => (
                                    <div key={idx} className="glass-panel p-5 rounded-xl glass-panel-hover flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{stat.title}</p>
                                            <p className="text-2xl font-bold mt-1 text-white font-mono">{stat.value}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{stat.desc}</p>
                                        </div>
                                        <div className={`w-10 h-10 rounded-lg bg-slate-900/60 flex items-center justify-center text-sm ${stat.color} border border-slate-800`}>
                                            <i className={`fas ${stat.icon}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Average telemetry utilization metrics cards grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {[
                                    { label: "CPU Cluster Loading", value: status ? `${status.avg_cpu_usage}%` : '-', glow: status && status.avg_cpu_usage > 75 ? 'glow-pulse-red' : 'glow-pulse-cyan', colorClass: status && status.avg_cpu_usage > 75 ? 'text-red-400' : 'text-cyan-400' },
                                    { label: "Memory Allocated", value: status ? `${status.avg_mem_usage}%` : '-', glow: status && status.avg_mem_usage > 75 ? 'glow-pulse-red' : 'glow-pulse-cyan', colorClass: status && status.avg_mem_usage > 75 ? 'text-red-400' : 'text-cyan-400' },
                                    { label: "Volume Storage Utilized", value: status ? `${status.avg_disk_usage}%` : '-', glow: 'glow-pulse-cyan', colorClass: 'text-cyan-400' },
                                    { label: "Failure Prediction Risk", value: status ? status.failure_prediction_status : '-', glow: status && status.failure_prediction_status.includes('Critical') ? 'glow-pulse-red' : status && status.failure_prediction_status.includes('Warning') ? 'glow-pulse-amber' : 'glow-pulse-cyan', colorClass: status && status.failure_prediction_status.includes('Critical') ? 'text-red-400' : status && status.failure_prediction_status.includes('Warning') ? 'text-amber-400' : 'text-emerald-400' }
                                ].map((stat, idx) => (
                                    <div key={idx} className="glass-panel p-4 rounded-xl flex items-center gap-4">
                                        <div className={`w-3.5 h-3.5 rounded-full ${stat.glow}`} />
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                            <p className={`text-lg font-bold font-mono ${stat.colorClass}`}>{stat.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Dynamic Charting and Fault Injector panels */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Historical Line Chart */}
                                <div className="glass-panel p-5 rounded-xl lg:col-span-2">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Cluster Telemetry History</h3>
                                        <span className="text-[10px] font-semibold text-slate-500 font-mono">Live updates polling (2s)</span>
                                    </div>
                                    <div className="h-64 relative">
                                        <canvas ref={mainChartRef} />
                                    </div>
                                </div>
                                
                                {/* Fault Injection Console */}
                                <div className="glass-panel p-5 rounded-xl flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-3">Fault Injection Module</h3>
                                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                                            Simulate severe environment faults to evaluate the autonomous monitoring, anomaly scoring, root cause classifier, and self-healing systems.
                                        </p>
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-slate-400">Target Node</label>
                                                <select 
                                                    value={faultServer} 
                                                    onChange={(e) => setFaultServer(e.target.value)}
                                                    className="w-full mt-1 bg-slate-900 border border-slate-800 text-xs text-white rounded-lg p-2.5 focus:border-cyan-500 focus:outline-none"
                                                >
                                                    <option value="Server-01">Server-01 (Frontend Load)</option>
                                                    <option value="Server-02">Server-02 (API Services)</option>
                                                    <option value="Server-03">Server-03 (Database Cluster)</option>
                                                </select>
                                            </div>
                                            
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-slate-400">Failure Signature Mode</label>
                                                <select 
                                                    value={faultType} 
                                                    onChange={(e) => setFaultType(e.target.value)}
                                                    className="w-full mt-1 bg-slate-900 border border-slate-800 text-xs text-white rounded-lg p-2.5 focus:border-cyan-500 focus:outline-none"
                                                >
                                                    <option value="cpu_spike">CPU Spike (Resource Saturation)</option>
                                                    <option value="memory_leak">Memory Leak (Out of Memory Threat)</option>
                                                    <option value="disk_full">Disk Space Full (Volume Warning)</option>
                                                    <option value="network_bottleneck">Network Saturation (Traffic Spike)</option>
                                                    <option value="k8s_pod_crash">Kubernetes Application Pod Crash</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={handleInjectFault}
                                        className="w-full mt-5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold py-2.5 rounded-lg transition shadow-lg shadow-red-600/10"
                                    >
                                        <i className="fas fa-biohazard mr-2" />
                                        Inject Failure Trigger
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. INFRASTRUCTURE METRICS TAB */}
                    {activeTab === 'monitoring' && metrics && (
                        <div className="space-y-6">
                            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Node Telemetry Inspector</h3>
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                {Object.keys(metrics.current).map((serverName) => {
                                    const m = metrics.current[serverName];
                                    const conts = metrics.containers[serverName] || [];
                                    const isDegraded = m.status !== 'Healthy';
                                    
                                    return (
                                        <div key={serverName} className={`glass-panel p-5 rounded-xl border ${isDegraded ? 'border-red-500/30' : 'border-slate-800'}`}>
                                            {/* Header */}
                                            <div className="flex justify-between items-center pb-3 border-b border-slate-800/80 mb-4">
                                                <div>
                                                    <h4 className="font-bold text-white text-sm">{serverName}</h4>
                                                    <span className="text-[10px] text-slate-400 font-mono">Location: US-EAST-1</span>
                                                </div>
                                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                                                    isDegraded ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                }`}>
                                                    {m.status}
                                                </span>
                                            </div>
                                            
                                            {/* Metrics list */}
                                            <div className="space-y-3.5 mb-5">
                                                {[
                                                    { label: 'CPU Usage', val: m.cpu, unit: '%', icon: 'fa-microchip', color: m.cpu > 80 ? 'bg-red-500' : 'bg-cyan-500' },
                                                    { label: 'Memory Allocated', val: m.mem, unit: '%', icon: 'fa-memory', color: m.mem > 80 ? 'bg-red-500' : 'bg-purple-500' },
                                                    { label: 'Disk Space', val: m.disk, unit: '%', icon: 'fa-hdd', color: m.disk > 90 ? 'bg-red-500' : 'bg-indigo-500' },
                                                    { label: 'Network Throughput', val: m.net, unit: ' MB/s', icon: 'fa-exchange-alt', color: 'bg-emerald-500' },
                                                    { label: 'Latency / Response', val: m.resp, unit: ' ms', icon: 'fa-clock', color: m.resp > 500 ? 'bg-red-500' : 'bg-blue-500' }
                                                ].map((item, idx) => (
                                                    <div key={idx}>
                                                        <div className="flex justify-between text-xs mb-1 font-semibold text-slate-300">
                                                            <span className="flex items-center gap-2">
                                                                <i className={`fas ${item.icon} text-slate-400 w-4 text-center`} />
                                                                {item.label}
                                                            </span>
                                                            <span className="font-mono">{item.val.toFixed(1)}{item.unit}</span>
                                                        </div>
                                                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                                            <div className={`h-full ${item.color} rounded-full`} style={{ width: `${Math.min(100, item.val)}%` }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Microservice Containers nested */}
                                            <div>
                                                <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Docker Container Daemons</h5>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {conts.map((c) => (
                                                        <div key={c.id} className="bg-slate-900/60 rounded-lg p-2 border border-slate-800 text-[10px]">
                                                            <div className="flex justify-between font-semibold">
                                                                <span className="text-white truncate pr-1">{c.name}</span>
                                                                <span className={c.status === 'Running' ? 'text-emerald-400' : 'text-amber-400'}>
                                                                    {c.status}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between text-slate-500 mt-1 font-mono">
                                                                <span>CPU: {c.cpu}%</span>
                                                                <span>{c.mem}Mi</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 3. ANOMALY DETECTION TAB */}
                    {activeTab === 'anomalies' && (
                        <div className="space-y-6">
                            <div className="glass-panel p-5 rounded-xl">
                                <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider mb-4">Isolation Forest Anomaly Inspector</h3>
                                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                                    The **Monitoring Agent** streams active telemetry vectors into the unsupervised **Isolation Forest Machine Learning model**. Multi-dimensional telemetry anomalies (e.g. correlated CPU + Latency shifts) trigger instant alert records with computed Contamination anomaly scores.
                                </p>
                            </div>
                            
                            <div className="glass-panel rounded-xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/40 flex justify-between items-center">
                                    <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Historical Anomalies Log</h4>
                                    <button 
                                        onClick={async () => {
                                            const res = await fetch('/api/anomalies').then(r => r.json());
                                            setAnomalies(res);
                                        }}
                                        className="bg-slate-800 text-slate-300 hover:text-white px-3 py-1 rounded text-xs border border-slate-700/60"
                                    >
                                        Refresh Log
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold">
                                                <th className="p-4">Timestamp</th>
                                                <th className="p-4">Affected Server</th>
                                                <th className="p-4">CPU %</th>
                                                <th className="p-4">Memory %</th>
                                                <th className="p-4">Latency (ms)</th>
                                                <th className="p-4">Anomaly Score</th>
                                                <th className="p-4 text-center">Alert Classification</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {anomalies.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" className="p-6 text-center text-slate-500">
                                                        No anomalies detected within current data buffer. (Click Refresh to load DB logs)
                                                    </td>
                                                </tr>
                                            ) : (
                                                anomalies.map((anom) => (
                                                    <tr key={anom.id} className="hover:bg-slate-900/30 text-slate-300">
                                                        <td className="p-4 font-mono">{formatTime(anom.timestamp)}</td>
                                                        <td className="p-4 font-semibold text-white">{anom.server_id}</td>
                                                        <td className="p-4 font-mono">{anom.cpu_usage}%</td>
                                                        <td className="p-4 font-mono">{anom.memory_usage}%</td>
                                                        <td className="p-4 font-mono">{anom.response_time}ms</td>
                                                        <td className="p-4 font-mono text-cyan-400">{anom.anomaly_score.toFixed(4)}</td>
                                                        <td className="p-4 text-center">
                                                            <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                                                Anomaly Verified
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. FAILURE PREDICTION TAB */}
                    {activeTab === 'failures' && failures && (
                        <div className="space-y-6">
                            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Supervised Failure Risk analysis</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {Object.keys(failures).map((serverName) => {
                                    const data = failures[serverName];
                                    const riskColor = data.risk_level === 'Critical' ? 'text-red-400 border-red-500/30 bg-red-500/10' : data.risk_level === 'Warning' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
                                    
                                    return (
                                        <div key={serverName} className="glass-panel p-5 rounded-xl flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-center pb-3 border-b border-slate-800/80 mb-4">
                                                    <h4 className="font-bold text-white text-sm">{serverName}</h4>
                                                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 border rounded-full ${riskColor}`}>
                                                        {data.risk_level} Risk
                                                    </span>
                                                </div>
                                                
                                                <div className="text-center py-4 bg-slate-900/40 rounded-xl border border-slate-800/60 mb-5">
                                                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Failure Probability</span>
                                                    <p className={`text-4xl font-mono font-bold mt-1 ${data.failure_probability > 80 ? 'text-red-400' : data.failure_probability > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                        {data.failure_probability}%
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-semibold mt-1 uppercase">
                                                        Signature: {data.predicted_failure_type}
                                                    </p>
                                                </div>
                                                
                                                <div>
                                                    <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2.5">AI Recommended Corrective Remediation</h5>
                                                    <ul className="space-y-1.5">
                                                        {data.recommended_actions.map((act, i) => (
                                                            <li key={i} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-900/20 p-2 rounded border border-slate-800/40">
                                                                <i className="fas fa-chevron-right text-[8px] text-cyan-400 mt-1.5" />
                                                                <span>{act}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 5. AI AGENTS LOUNGE TAB */}
                    {activeTab === 'agents' && (
                        <div className="space-y-6">
                            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">AI Operations Command Lounge</h3>
                            
                            {/* Agent Node visualization state */}
                            <AgentVisualization activeAgent={activeAgent} />
                            
                            {/* Terminal screen */}
                            <div className="terminal-screen rounded-xl flex flex-col h-[400px] border relative overflow-hidden shadow-2xl">
                                <div className="px-4 py-2 bg-slate-900/90 border-b border-emerald-500/20 flex justify-between items-center text-[10px] text-emerald-400 font-mono">
                                    <span className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                        AUTOOPS-AGENT-BUS-STREAM
                                    </span>
                                    <span>LOGGER CORE v2.4</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-2 scanline text-xs">
                                    {agentLogs.length === 0 ? (
                                        <p className="text-slate-600 font-mono">Initializing Agent Command Bus listener...</p>
                                    ) : (
                                        agentLogs.map((log, idx) => {
                                            const agentClass = log.agent.toLowerCase().replace('agent', '');
                                            return (
                                                <div key={idx} className={`terminal-line ${agentClass} pl-3 py-1 font-mono text-emerald-400/90`}>
                                                    <span className="text-[10px] text-slate-500 font-mono mr-2">[{formatTime(log.timestamp)}]</span>
                                                    <span className="font-semibold text-cyan-400 mr-2">@{log.agent}:</span>
                                                    <span className="text-slate-300">{log.message}</span>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={terminalEndRef} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 6. SELF-HEALING & KUBERNETES SIM TAB */}
                    {activeTab === 'selfhealing' && healing && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* K8s cluster visualizer */}
                                <div className="glass-panel p-5 rounded-xl lg:col-span-2">
                                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-4">Kubernetes ReplicaSet Simulation</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {healing.k8s_pods.map((pod, i) => {
                                            const pStatus = pod.status;
                                            const statusClass = pStatus === 'Running' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : pStatus === 'ContainerCreating' || pStatus === 'Pending' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-red-500/20 border-red-500/40 text-red-400';
                                            return (
                                                <div key={i} className={`pod-scale-in p-4 rounded-xl border flex flex-col justify-between ${statusClass}`}>
                                                    <div>
                                                        <div className="flex justify-between items-center text-[10px] font-bold">
                                                            <span className="truncate pr-1">{pod.name}</span>
                                                            <i className="fas fa-cube" />
                                                        </div>
                                                        <p className="text-[9px] text-slate-400 font-mono mt-1">Host: {pod.server}</p>
                                                    </div>
                                                    
                                                    <div className="mt-4">
                                                        <div className="flex justify-between items-center mb-1 text-[9px]">
                                                            <span>Status</span>
                                                            <span className="font-semibold">{pStatus}</span>
                                                        </div>
                                                        <div className="flex justify-between text-[8px] font-mono text-slate-400 border-t border-slate-800/40 pt-1.5">
                                                            <span>Restarts: {pod.restarts}</span>
                                                            <span>Age: {pod.age}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                
                                {/* Self-Healing Operations details list */}
                                <div className="glass-panel p-5 rounded-xl flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-4">Remediation Log</h3>
                                        <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                                            {healing.logs.length === 0 ? (
                                                <p className="text-xs text-slate-500 text-center py-8">No self-healing events triggered yet.</p>
                                            ) : (
                                                healing.logs.map((log) => {
                                                    const sColor = log.status === 'Success' ? 'bg-emerald-500/20 text-emerald-400' : log.status === 'Triggered' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400';
                                                    return (
                                                        <div key={log.id} className="bg-slate-900/40 border border-slate-800 p-3 rounded-lg text-xs">
                                                            <div className="flex justify-between items-center font-bold">
                                                                <span className="text-white text-[10px] tracking-wide uppercase font-mono">ID: SH-{log.id}</span>
                                                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${sColor}`}>
                                                                    {log.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-slate-400 text-[10px] mt-1 font-mono">Timestamp: {formatTime(log.timestamp)}</p>
                                                            <p className="text-slate-300 mt-2 leading-relaxed">{log.details}</p>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 7. INCIDENTS MANAGEMENT TAB */}
                    {activeTab === 'incidents' && (
                        <div className="space-y-6">
                            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Incident Action Center</h3>
                            
                            {/* Incident Filters panel */}
                            <div className="glass-panel p-4 rounded-xl flex flex-wrap gap-4 items-end">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Filter Severity</label>
                                    <select 
                                        value={incSeverity} 
                                        onChange={(e) => setIncSeverity(e.target.value)}
                                        className="bg-slate-900 border border-slate-800 text-xs text-white rounded-lg p-2.5 w-40 focus:border-cyan-500 focus:outline-none"
                                    >
                                        <option value="">All Severities</option>
                                        <option value="info">Info</option>
                                        <option value="warning">Warning</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Filter Status</label>
                                    <select 
                                        value={incStatus} 
                                        onChange={(e) => setIncStatus(e.target.value)}
                                        className="bg-slate-900 border border-slate-800 text-xs text-white rounded-lg p-2.5 w-40 focus:border-cyan-500 focus:outline-none"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="Open">Open</option>
                                        <option value="Investigating">Investigating</option>
                                        <option value="Resolving">Resolving</option>
                                        <option value="Resolved">Resolved</option>
                                    </select>
                                </div>
                            </div>

                            {/* Incidents Table */}
                            <div className="glass-panel rounded-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold">
                                                <th className="p-4">Incident ID</th>
                                                <th className="p-4">Timestamp</th>
                                                <th className="p-4">Affected Node</th>
                                                <th className="p-4">Severity</th>
                                                <th className="p-4">RCA Classifier Root Cause</th>
                                                <th className="p-4">Workflow Status</th>
                                                <th className="p-4 text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {incidents.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" className="p-6 text-center text-slate-500">
                                                        No incident records matched your query filters.
                                                    </td>
                                                </tr>
                                            ) : (
                                                incidents.map((inc) => {
                                                    const sevColor = inc.severity === 'critical' ? 'bg-red-500/15 text-red-400 border border-red-500/25' : inc.severity === 'warning' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' : 'bg-blue-500/15 text-blue-400 border border-blue-500/25';
                                                    const statColor = inc.resolution_status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : inc.resolution_status === 'Resolving' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : inc.resolution_status === 'Investigating' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20';
                                                    return (
                                                        <tr key={inc.id} className="hover:bg-slate-900/20 text-slate-300">
                                                            <td className="p-4 font-mono font-bold text-white">{inc.id}</td>
                                                            <td className="p-4 font-mono text-[10px]">{formatTime(inc.timestamp)}</td>
                                                            <td className="p-4 font-semibold text-slate-200">{inc.affected_component}</td>
                                                            <td className="p-4">
                                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${sevColor}`}>
                                                                    {inc.severity}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 leading-normal max-w-xs truncate" title={inc.root_cause}>
                                                                {inc.root_cause || 'Analyzing metrics...'}
                                                            </td>
                                                            <td className="p-4">
                                                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-semibold ${statColor}`}>
                                                                    {inc.resolution_status}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                {inc.resolution_status !== 'Resolved' ? (
                                                                    <button 
                                                                        onClick={() => handleManualResolve(inc.id)}
                                                                        className="bg-emerald-600/80 hover:bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded transition"
                                                                    >
                                                                        Resolve
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-slate-500 text-[10px] font-mono">Closed</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 8. MLOPS DASHBOARD TAB */}
                    {activeTab === 'mlops' && mlops && (
                        <div className="space-y-6">
                            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">MLOps Control Center</h3>
                            
                            {/* Models grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { name: "Isolation Forest (Anomaly Detection)", id: "anomaly_detection", val: mlops.models.anomaly_detection, desc: "Unsupervised algorithm mapping telemetry variables to isolate normal thresholds. Trained periodically or on new dataset upload." },
                                    { name: "Random Forest (Failure Classifier)", id: "failure_prediction", val: mlops.models.failure_prediction, desc: "Supervised classification model analyzing feature weights to predict failure risk score & category." }
                                ].map((modelCard) => {
                                    const isTraining = modelCard.val && modelCard.val.training_status === 'Training';
                                    return (
                                        <div key={modelCard.id} className="glass-panel p-5 rounded-xl flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start pb-3 border-b border-slate-800/80 mb-4">
                                                    <h4 className="font-bold text-white text-sm">{modelCard.name}</h4>
                                                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                                                        isTraining ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                    }`}>
                                                        {modelCard.val ? modelCard.val.training_status : 'Untrained'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 leading-relaxed mb-5">{modelCard.desc}</p>
                                                
                                                <div className="grid grid-cols-2 gap-4 mb-4 text-xs font-mono">
                                                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                                                        <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Model Accuracy / Score</span>
                                                        <span className="text-lg font-bold text-white">
                                                            {modelCard.val && modelCard.val.accuracy ? `${(modelCard.val.accuracy * 100).toFixed(2)}%` : 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                                                        <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Training Dataset Size</span>
                                                        <span className="text-lg font-bold text-white">
                                                            {modelCard.val && modelCard.val.dataset_size ? `${modelCard.val.dataset_size} rows` : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <p className="text-[10px] text-slate-500 font-mono">
                                                    Last trained: {modelCard.val && modelCard.val.last_trained_at ? formatTime(modelCard.val.last_trained_at) : 'Never'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* MLOps Actions bar */}
                            <div className="glass-panel p-5 rounded-xl flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-1">Interactive ML Pipeline Actions</h4>
                                    <p className="text-xs text-slate-500">
                                        Trigger automated training batches, evaluate model weights on test matrices, or hot-deploy new models.
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={handleEvaluateModels}
                                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold px-4 py-2 rounded-lg border border-slate-700/60 transition"
                                    >
                                        Evaluate Models
                                    </button>
                                    <button 
                                        onClick={handleTrainModels}
                                        className="bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold px-5 py-2 rounded-lg transition shadow-lg shadow-cyan-600/10"
                                    >
                                        Train & Deploy Models
                                    </button>
                                </div>
                            </div>

                            {/* MLflow Experiment Tracker */}
                            <div className="glass-panel p-5 rounded-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-1 flex items-center gap-2">
                                            <i className="fas fa-flask text-indigo-400" /> MLflow Experiment Tracker
                                        </h4>
                                        <p className="text-xs text-slate-500">All training runs tracked with hyperparameters, metrics, and model artifacts.</p>
                                    </div>
                                    <button 
                                        onClick={() => fetch('/api/mlflow/runs').then(r => r.json()).then(setMlflowRuns).catch(() => {})}
                                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700/60 transition flex items-center gap-1.5"
                                    >
                                        <i className="fas fa-sync-alt" /> Refresh
                                    </button>
                                </div>

                                {!mlflowRuns || !mlflowRuns.experiments || mlflowRuns.experiments.length === 0 ? (
                                    <div className="text-center py-8">
                                        <i className="fas fa-flask text-3xl text-slate-600 mb-3" />
                                        <p className="text-slate-400 text-sm">No MLflow experiments found.</p>
                                        <p className="text-slate-500 text-xs mt-1">Train models using the buttons above to create experiment runs.</p>
                                        {mlflowRuns && mlflowRuns.error && (
                                            <p className="text-amber-400/70 text-[10px] mt-2 font-mono">{mlflowRuns.error}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {mlflowRuns.experiments.map((exp) => (
                                            <div key={exp.experiment_id} className="border border-slate-700/50 rounded-lg overflow-hidden">
                                                <div className="bg-slate-900/60 px-4 py-2.5 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <i className="fas fa-folder-open text-indigo-400 text-xs" />
                                                        <span className="text-xs font-bold text-white">{exp.experiment_name}</span>
                                                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                                                            {exp.runs_count} run{exp.runs_count !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                    <span className="text-[9px] text-slate-500 font-mono">ID: {exp.experiment_id}</span>
                                                </div>
                                                
                                                {exp.runs.length > 0 ? (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-left text-[10px]">
                                                            <thead>
                                                                <tr className="border-b border-slate-800 text-slate-500 uppercase">
                                                                    <th className="px-4 py-2 font-bold">Run Name</th>
                                                                    <th className="px-4 py-2 font-bold">Status</th>
                                                                    <th className="px-4 py-2 font-bold">Metrics</th>
                                                                    <th className="px-4 py-2 font-bold">Params</th>
                                                                    <th className="px-4 py-2 font-bold">Duration</th>
                                                                    <th className="px-4 py-2 font-bold">Started</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {exp.runs.map((run) => (
                                                                    <tr key={run.run_id} className="border-b border-slate-800/40 hover:bg-slate-800/30 transition-colors">
                                                                        <td className="px-4 py-2.5">
                                                                            <div className="font-semibold text-white text-xs">{run.run_name}</div>
                                                                            <div className="text-[8px] text-slate-500 font-mono mt-0.5">{run.run_id.slice(0, 12)}...</div>
                                                                        </td>
                                                                        <td className="px-4 py-2.5">
                                                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                                                run.status === 'FINISHED' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                                run.status === 'RUNNING' ? 'bg-cyan-500/20 text-cyan-400' :
                                                                                run.status === 'FAILED' ? 'bg-rose-500/20 text-rose-400' :
                                                                                'bg-slate-700 text-slate-400'
                                                                            }`}>{run.status}</span>
                                                                        </td>
                                                                        <td className="px-4 py-2.5">
                                                                            <div className="space-y-0.5 font-mono">
                                                                                {Object.entries(run.metrics).slice(0, 4).map(([k, v]) => (
                                                                                    <div key={k} className="flex items-center gap-1">
                                                                                        <span className="text-slate-500">{k}:</span>
                                                                                        <span className="text-cyan-300 font-bold">{typeof v === 'number' ? (v < 1 ? (v * 100).toFixed(2) + '%' : v.toFixed(4)) : v}</span>
                                                                                    </div>
                                                                                ))}
                                                                                {Object.keys(run.metrics).length > 4 && (
                                                                                    <span className="text-slate-500">+{Object.keys(run.metrics).length - 4} more</span>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-2.5">
                                                                            <div className="space-y-0.5 font-mono">
                                                                                {Object.entries(run.params).slice(0, 3).map(([k, v]) => (
                                                                                    <div key={k} className="flex items-center gap-1">
                                                                                        <span className="text-slate-500">{k}:</span>
                                                                                        <span className="text-amber-300">{v}</span>
                                                                                    </div>
                                                                                ))}
                                                                                {Object.keys(run.params).length > 3 && (
                                                                                    <span className="text-slate-500">+{Object.keys(run.params).length - 3} more</span>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-2.5 text-slate-300 font-mono">
                                                                            {run.duration_ms ? (run.duration_ms / 1000).toFixed(1) + 's' : '\u2014'}
                                                                        </td>
                                                                        <td className="px-4 py-2.5 text-slate-400 font-mono">
                                                                            {run.start_time ? formatTime(run.start_time) : '\u2014'}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="px-4 py-4 text-xs text-slate-500">No runs recorded yet.</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 9. CI/CD PIPELINE VISUALIZATION TAB */}
                    {activeTab === 'cicd' && pipeline && (
                        <div className="space-y-6">
                            <div className="glass-panel p-5 rounded-xl">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider mb-1">Active CI/CD Deployment Flow</h3>
                                        <p className="text-xs text-slate-400">
                                            Visualizing commit delivery and container staging. Self-healing logs trigger redeployment runs in response to heap overflow failures.
                                        </p>
                                    </div>
                                    
                                    <button 
                                        onClick={handleTriggerPipeline}
                                        disabled={pipeline.status === 'Running'}
                                        className="bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
                                    >
                                        Trigger Pipeline Run
                                    </button>
                                </div>

                                {/* CI/CD Animated Map */}
                                <div className="relative py-12 px-4 bg-slate-950/60 rounded-2xl border border-slate-900 flex justify-between items-center overflow-x-auto min-w-[700px]">
                                    {[
                                        { id: 'developer', label: 'Developer', icon: 'fa-code' },
                                        { id: 'github', label: 'GitHub', icon: 'fa-github' },
                                        { id: 'build', label: 'Build Staging', icon: 'fa-tools' },
                                        { id: 'test', label: 'Automated Tests', icon: 'fa-vial' },
                                        { id: 'docker', label: 'Docker Build', icon: 'fa-docker' },
                                        { id: 'k8s', label: 'Kubernetes Rollout', icon: 'fa-dharmachakra' },
                                        { id: 'prod', label: 'Production', icon: 'fa-rocket' }
                                    ].map((stage, idx, arr) => {
                                        const stageStatus = pipeline.stages[stage.id];
                                        const isRunning = pipeline.status === 'Running' && pipeline.active_stage === stage.id;
                                        
                                        // Colors
                                        let borderClass = 'border-slate-800 text-slate-500';
                                        let glowClass = '';
                                        if (stageStatus === 'Success') {
                                            borderClass = 'border-emerald-500 text-emerald-400 bg-emerald-500/10';
                                        } else if (isRunning) {
                                            borderClass = 'border-amber-500 text-amber-400 bg-amber-500/15 pulse-node';
                                            glowClass = 'glow-pulse-amber';
                                        }
                                        
                                        return (
                                            <div key={stage.id} className="flex items-center flex-1 last:flex-initial">
                                                {/* Node */}
                                                <div className="flex flex-col items-center z-10 w-24">
                                                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg ${borderClass} ${glowClass} shadow-md`}>
                                                        <i className={`fab ${stage.icon.startsWith('fa-') ? '' : 'fab'} ${stage.icon}`} />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400 mt-2 truncate w-full text-center">{stage.label}</span>
                                                    <span className={`text-[8px] uppercase mt-0.5 font-semibold font-mono ${
                                                        stageStatus === 'Success' ? 'text-emerald-400' : isRunning ? 'text-amber-400' : 'text-slate-600'
                                                    }`}>
                                                        {isRunning ? 'RUNNING' : stageStatus || 'PENDING'}
                                                    </span>
                                                </div>
                                                
                                                {/* Connecting line */}
                                                {idx < arr.length - 1 && (
                                                    <div className="flex-1 h-[2px] bg-slate-900 mx-2 relative min-w-[20px]">
                                                        <div className={`absolute inset-0 transition-all duration-500 ${
                                                            stageStatus === 'Success' ? 'bg-emerald-500' : isRunning ? 'bg-amber-500 animate-pulse' : 'bg-slate-900'
                                                        }`} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {/* Progress slider during active pipelines */}
                                {pipeline.status === 'Running' && (
                                    <div className="mt-6 font-mono text-xs">
                                        <div className="flex justify-between mb-1 font-semibold text-slate-400">
                                            <span>Deploying updates to cluster...</span>
                                            <span>{pipeline.progress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                            <div className="h-full bg-cyan-500 rounded-full transition-all duration-300" style={{ width: `${pipeline.progress}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 10. DATASET MANAGEMENT TAB */}
                    {activeTab === 'datasets' && dataset && (
                        <div className="space-y-6">
                            <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Dataset Operations Manager</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Details and actions */}
                                <div className="glass-panel p-5 rounded-xl flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-2">Metrics Training Matrix</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed mb-4">
                                            Manage your telemetry matrices. You can generate and download our synthetic metric benchmark CSV, edit parameters, and upload it back here.
                                        </p>
                                        
                                        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 space-y-3.5 mb-5 font-mono text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Dataset Source:</span>
                                                <span className="text-white font-bold">{dataset.is_custom ? 'Custom CSV Upload' : 'Default Benchmark'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Record Rows:</span>
                                                <span className="text-white font-bold">{dataset.rows_count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Anomalous / Failures:</span>
                                                <span className="text-red-400 font-bold">{dataset.failures_count}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Normal Records:</span>
                                                <span className="text-emerald-400 font-bold">{dataset.healthy_count}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <a 
                                            href="/api/dataset/generate" 
                                            download
                                            className="w-full text-center block bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold py-2.5 rounded-lg border border-slate-700/60 transition"
                                        >
                                            <i className="fas fa-download mr-2" />
                                            Download Base Dataset (.CSV)
                                        </a>
                                        
                                        <div className="relative">
                                            <input 
                                                type="file" 
                                                accept=".csv"
                                                onChange={handleFileUpload}
                                                disabled={uploading}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <button 
                                                disabled={uploading}
                                                className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 rounded-lg transition"
                                            >
                                                <i className="fas fa-upload mr-2" />
                                                {uploading ? 'Processing File...' : 'Upload Custom CSV'}
                                            </button>
                                        </div>
                                        
                                        {dataset.is_custom && (
                                            <button 
                                                onClick={handleClearDataset}
                                                className="w-full bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-xs font-semibold py-2 rounded-lg transition border border-rose-500/20"
                                            >
                                                Clear Custom Dataset
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Metrics stats and data preview */}
                                <div className="glass-panel p-5 rounded-xl lg:col-span-2 space-y-6">
                                    {/* Stats preview */}
                                    <div>
                                        <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-3">Feature Averages Summary</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                                            {Object.keys(dataset.stats).map((featureName) => (
                                                <div key={featureName} className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs">
                                                    <span className="text-[8px] uppercase text-slate-500 font-bold block truncate" title={featureName}>
                                                        {featureName.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-white font-mono font-bold mt-1 block">
                                                        {dataset.stats[featureName].mean.toFixed(1)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Row matrix preview */}
                                    <div>
                                        <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-2">Matrix File Preview (First 10 records)</h4>
                                        <div className="overflow-x-auto rounded-lg border border-slate-800">
                                            <table className="w-full text-left text-[10px] font-mono">
                                                <thead>
                                                    <tr className="bg-slate-900 text-slate-500 border-b border-slate-800">
                                                        <th className="p-2">CPU%</th>
                                                        <th className="p-2">Memory%</th>
                                                        <th className="p-2">Disk%</th>
                                                        <th className="p-2">Network (MB/s)</th>
                                                        <th className="p-2">Latency (ms)</th>
                                                        <th className="p-2 text-center">Failure Flag</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                                                    {dataset.preview.map((row, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-900/20">
                                                            <td className="p-2">{row.CPU_Usage.toFixed(1)}%</td>
                                                            <td className="p-2">{row.Memory_Usage.toFixed(1)}%</td>
                                                            <td className="p-2">{row.Disk_Usage.toFixed(1)}%</td>
                                                            <td className="p-2">{row.Network_Traffic.toFixed(1)} MB/s</td>
                                                            <td className="p-2">{row.Response_Time.toFixed(0)}ms</td>
                                                            <td className="p-2 text-center font-bold">
                                                                <span className={row.Failure === 1 ? 'text-red-400' : 'text-slate-500'}>
                                                                    {row.Failure}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* 11. WEBSITE MONITORING TAB */}
                    {activeTab === 'websites' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <i className="fas fa-globe text-cyan-400" /> Website Monitoring
                                </h2>
                                <span className="text-xs text-slate-400">
                                    {websites.length} site{websites.length !== 1 ? 's' : ''} monitored
                                </span>
                            </div>

                            {/* Add Website Form */}
                            <div className="glass-panel p-5 rounded-xl border border-slate-700/50">
                                <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                                    <i className="fas fa-plus-circle text-cyan-400" /> Add Website to Monitor
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Display Name</label>
                                        <input 
                                            type="text" 
                                            value={newWebName} 
                                            onChange={(e) => setNewWebName(e.target.value)} 
                                            placeholder="e.g. Google"
                                            className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">URL</label>
                                        <input 
                                            type="text" 
                                            value={newWebUrl} 
                                            onChange={(e) => setNewWebUrl(e.target.value)} 
                                            placeholder="e.g. https://google.com"
                                            className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button 
                                            onClick={handleAddWebsite}
                                            disabled={addingWebsite || !newWebName.trim() || !newWebUrl.trim()}
                                            className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/10"
                                        >
                                            {addingWebsite ? (
                                                <span className="flex items-center justify-center gap-2"><i className="fas fa-spinner animate-spin" /> Adding...</span>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2"><i className="fas fa-satellite-dish" /> Start Monitoring</span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <p className="mt-2 text-[10px] text-slate-500">The simulator will ping this URL every 2 seconds and track response time, uptime status, and metrics.</p>
                            </div>

                            {/* Monitored Websites List */}
                            {websites.length === 0 ? (
                                <div className="glass-panel p-10 rounded-xl text-center">
                                    <i className="fas fa-globe text-4xl text-slate-600 mb-3" />
                                    <p className="text-slate-400 text-sm">No websites being monitored yet.</p>
                                    <p className="text-slate-500 text-xs mt-1">Add a URL above to start real-time monitoring.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {websites.map((w) => {
                                        const serverKey = `Web-${w.name}`;
                                        const serverMetrics = metrics && metrics.current ? metrics.current[serverKey] : null;
                                        const isHealthy = serverMetrics ? serverMetrics.status === 'Healthy' : false;
                                        
                                        return (
                                            <div key={w.id} className={`glass-panel p-4 rounded-xl border transition-all ${
                                                isHealthy ? 'border-emerald-500/30' : (serverMetrics ? 'border-rose-500/30' : 'border-slate-700/50')
                                            }`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${
                                                            isHealthy ? 'bg-emerald-500 animate-pulse' : (serverMetrics ? 'bg-rose-500 animate-pulse' : 'bg-slate-600')
                                                        }`} />
                                                        <h4 className="text-sm font-bold text-white">{w.name}</h4>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleDeleteWebsite(w.id)}
                                                        className="text-slate-500 hover:text-rose-400 transition-colors text-xs"
                                                        title="Remove monitor"
                                                    >
                                                        <i className="fas fa-trash" />
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-slate-400 truncate mb-3 font-mono" title={w.url}>{w.url}</p>
                                                
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                                        isHealthy 
                                                            ? 'bg-emerald-500/20 text-emerald-300' 
                                                            : (serverMetrics ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-700 text-slate-400')
                                                    }`}>
                                                        {isHealthy ? 'Online' : (serverMetrics ? 'Down / Degraded' : 'Initializing...')}
                                                    </span>
                                                </div>
                                                
                                                {serverMetrics && (
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-[10px]">
                                                            <span className="text-slate-400">Response Time</span>
                                                            <span className={`font-mono font-bold ${
                                                                serverMetrics.resp < 300 ? 'text-emerald-400' : 
                                                                serverMetrics.resp < 1000 ? 'text-amber-400' : 'text-rose-400'
                                                            }`}>{serverMetrics.resp.toFixed(0)}ms</span>
                                                        </div>
                                                        <div className="flex justify-between text-[10px]">
                                                            <span className="text-slate-400">CPU</span>
                                                            <span className="font-mono text-cyan-400">{serverMetrics.cpu.toFixed(1)}%</span>
                                                        </div>
                                                        <div className="flex justify-between text-[10px]">
                                                            <span className="text-slate-400">Memory</span>
                                                            <span className="font-mono text-indigo-400">{serverMetrics.mem.toFixed(1)}%</span>
                                                        </div>
                                                        <div className="flex justify-between text-[10px]">
                                                            <span className="text-slate-400">Network</span>
                                                            <span className="font-mono text-slate-300">{serverMetrics.net.toFixed(1)} MB/s</span>
                                                        </div>
                                                        <div className="text-[9px] text-slate-500 mt-1">
                                                            Added: {new Date(w.added_at).toLocaleString()}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

// Render Application
ReactDOM.render(<App />, document.getElementById('root'));
