/** @jsxRuntime classic */
/**
 * AutoOps AI - AI Intelligence Section Pages:
 * 1. Anomaly Detection (Isolation Forest)
 * 2. Failure Prediction (Random Forest)
 * 3. Root Cause Analysis (RCA)
 */

window.AutoOpsAIIntelligence = (() => {
    const { StatusBadge, ChartCard, EmptyState, LoadingState } = window.AutoOpsComponents;

    // 1. Anomaly Detection View
    function AnomalyDetectionView({ anomalies = [], metrics, status, onOpenFaultModal }) {
        const latestAnomaly = anomalies.length > 0 ? anomalies[0] : null;

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Unsupervised Anomaly Detection</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Continuous multidimensional outlier scoring powered by scikit-learn Isolation Forest</p>
                    </div>
                    <button
                        onClick={() => onOpenFaultModal && onOpenFaultModal()}
                        className="px-3.5 py-2 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/25 transition-all flex items-center gap-2 self-start"
                    >
                        <i className="fas fa-radiation" />
                        Simulate Anomaly
                    </button>
                </div>

                {/* Model Architecture & Current Status Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Status Overview */}
                    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detector Engine</span>
                            <StatusBadge status="Deployed & Active" size="xs" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Isolation Forest</h3>
                        <p className="text-xs text-slate-400 mt-1">Multi-vector continuous isolation trees partitioning 5 telemetry dimensions</p>
                        
                        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                            <div className="flex justify-between text-slate-400">
                                <span>Contamination Rate:</span>
                                <span className="font-mono text-white">0.05 (5%)</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Decision Threshold:</span>
                                <span className="font-mono text-cyan-400">&lt; 0.00 score</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Monitored Vectors:</span>
                                <span className="font-mono text-white">CPU, Mem, Disk, Net, Resp</span>
                            </div>
                        </div>
                    </div>

                    {/* Current Anomaly Status */}
                    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cluster State</span>
                            <StatusBadge status={latestAnomaly ? 'Anomaly Detected' : 'Baseline Normal'} size="xs" />
                        </div>
                        <h3 className="text-lg font-bold text-white">
                            {latestAnomaly ? (
                                <span className="text-rose-400 flex items-center gap-2">
                                    <i className="fas fa-exclamation-triangle animate-pulse" />
                                    Active Outlier
                                </span>
                            ) : (
                                <span className="text-emerald-400 flex items-center gap-2">
                                    <i className="fas fa-check-circle" />
                                    Normal Telemetry
                                </span>
                            )}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                            {latestAnomaly ? `Anomalous pattern on ${latestAnomaly.server_id}` : 'All telemetry points reside inside normal distribution boundary.'}
                        </p>

                        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                            <div className="flex justify-between text-slate-400">
                                <span>Total Logged Anomalies:</span>
                                <span className="font-mono text-white font-bold">{anomalies.length} records</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>Last Verified Score:</span>
                                <span className="font-mono text-cyan-400">
                                    {latestAnomaly ? latestAnomaly.anomaly_score : '0.1245'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Simulation Trigger */}
                    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900 to-indigo-950/30 flex flex-col justify-between">
                        <div>
                            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                <i className="fas fa-magic" /> Demo Workflow
                            </span>
                            <h4 className="text-sm font-bold text-white">Test Isolation Forest Scorer</h4>
                            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                Inject a simulated anomaly spike. The Isolation Forest algorithm will immediately calculate a negative anomaly score and dispatch to the RCA Agent.
                            </p>
                        </div>
                        <button
                            onClick={() => onOpenFaultModal && onOpenFaultModal()}
                            className="mt-4 w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-play" />
                            Trigger Anomaly Spike
                        </button>
                    </div>
                </div>

                {/* Anomalies Log Table */}
                <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
                    <h3 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
                        <i className="fas fa-shield-virus text-cyan-400" />
                        Historical Anomaly Detections Log
                    </h3>

                    {anomalies.length === 0 ? (
                        <EmptyState
                            icon="fa-shield-alt"
                            title="No anomalies detected"
                            description="All system metrics are currently within the baseline Isolation Forest bounds. Inject a fault to test detection."
                            actionText="Inject Test Fault"
                            onAction={onOpenFaultModal}
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                                        <th className="py-2.5 px-3">Timestamp</th>
                                        <th className="py-2.5 px-3">Affected Node</th>
                                        <th className="py-2.5 px-3">CPU %</th>
                                        <th className="py-2.5 px-3">Memory %</th>
                                        <th className="py-2.5 px-3">Disk %</th>
                                        <th className="py-2.5 px-3">Net (MB/s)</th>
                                        <th className="py-2.5 px-3">Resp (ms)</th>
                                        <th className="py-2.5 px-3">Anomaly Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                    {anomalies.slice(0, 20).map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="py-2.5 px-3 text-slate-300">
                                                {row.timestamp ? new Date(row.timestamp).toLocaleTimeString() : '--'}
                                            </td>
                                            <td className="py-2.5 px-3 text-white font-semibold flex items-center gap-1.5">
                                                <i className="fas fa-server text-slate-500 text-[10px]" />
                                                {row.server_id}
                                            </td>
                                            <td className={`py-2.5 px-3 ${row.cpu_usage > 85 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                                                {row.cpu_usage?.toFixed(1)}%
                                            </td>
                                            <td className={`py-2.5 px-3 ${row.memory_usage > 85 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                                                {row.memory_usage?.toFixed(1)}%
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-300">{row.disk_usage?.toFixed(1)}%</td>
                                            <td className="py-2.5 px-3 text-slate-300">{row.network_traffic?.toFixed(1)}</td>
                                            <td className={`py-2.5 px-3 ${row.response_time > 500 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                                                {row.response_time?.toFixed(0)} ms
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                                    {row.anomaly_score}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 2. Failure Prediction View
    function FailurePredictionView({ failures, onOpenFaultModal }) {
        if (!failures) {
            return <LoadingState message="Querying failure prediction models..." />;
        }

        const failureEntries = Object.entries(failures);

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">AI Failure Prediction</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Supervised Random Forest classification predicting failure probability and specific failure modes</p>
                    </div>
                    <button
                        onClick={() => onOpenFaultModal && onOpenFaultModal()}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 text-white font-semibold text-xs flex items-center gap-2 self-start shadow-lg shadow-rose-500/20"
                    >
                        <i className="fas fa-bolt" />
                        Simulate Failure
                    </button>
                </div>

                {/* Server-by-Server Prediction Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {failureEntries.map(([sName, pred]) => {
                        const prob = pred.failure_probability || 0;
                        const risk = pred.risk_level || 'Healthy';
                        const failType = pred.predicted_failure_type || 'Healthy';
                        const actions = pred.recommended_actions || [];

                        return (
                            <div
                                key={sName}
                                className={`glass-panel p-5 rounded-2xl border transition-all duration-300 ${
                                    risk === 'Critical' ? 'border-rose-500/50 glow-pulse-red' : risk === 'Warning' ? 'border-amber-500/40' : 'border-slate-800/80'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                                            risk === 'Critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                            <i className="fas fa-stethoscope" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm text-white">{sName}</h3>
                                            <p className="text-[11px] text-slate-400">Node Component</p>
                                        </div>
                                    </div>
                                    <StatusBadge status={risk} size="xs" />
                                </div>

                                {/* Probability Gauge */}
                                <div className="my-4 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                                    <div className="flex justify-between items-baseline text-xs mb-1.5">
                                        <span className="text-slate-400">Failure Probability:</span>
                                        <span className={`font-mono text-base font-bold ${
                                            prob > 80 ? 'text-rose-400' : prob > 40 ? 'text-amber-400' : 'text-emerald-400'
                                        }`}>
                                            {prob.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${
                                                prob > 80 ? 'bg-rose-500' : prob > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`}
                                            style={{ width: `${prob}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Predicted Mode */}
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                                        <span className="text-slate-400">Predicted Mode:</span>
                                        <span className="font-semibold text-white">{failType}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                                        <span className="text-slate-400">Algorithm:</span>
                                        <span className="font-mono text-cyan-400">Random Forest (100 Trees)</span>
                                    </div>
                                </div>

                                {/* Recommended Remediation Actions */}
                                <div className="mt-4 pt-3 border-t border-slate-800/80">
                                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        Recommended Playbook:
                                    </h4>
                                    <ul className="space-y-1.5 text-xs text-slate-300">
                                        {actions.map((act, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <i className="fas fa-check text-cyan-400 text-[10px] mt-1" />
                                                <span>{act}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // 3. Root Cause Analysis View
    function RootCauseAnalysisView({ failures, incidents, agentLogs }) {
        const activeIncidents = (incidents || []).filter(i => i.resolution_status !== 'Resolved');
        const rcaLogs = (agentLogs || []).filter(l => l.agent === 'RCAAgent' || l.agent === 'AnalysisAgent');

        return (
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Root Cause Analysis (RCA)</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Automated causal correlation bridging multi-dimensional metrics, anomaly detection, and remediation</p>
                </div>

                {/* Visual 5-Stage RCA Workflow Pipeline */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-800/80">
                    <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                        <i className="fas fa-project-diagram text-cyan-400" />
                        Root Cause Inference Pipeline
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
                        {/* Step 1 */}
                        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-base mx-auto mb-2">
                                    <i className="fas fa-tachometer-alt" />
                                </div>
                                <h4 className="font-bold text-xs text-white">1. Observed Metrics</h4>
                                <p className="text-[10px] text-slate-400 mt-1">Continuous ingestion of CPU, RAM, Disk, Net & Latency</p>
                            </div>
                            <span className="text-[9px] uppercase font-bold text-blue-400 bg-blue-500/10 py-0.5 rounded mt-3">Ingested</span>
                        </div>

                        {/* Step 2 */}
                        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-base mx-auto mb-2">
                                    <i className="fas fa-brain" />
                                </div>
                                <h4 className="font-bold text-xs text-white">2. Anomaly Scoring</h4>
                                <p className="text-[10px] text-slate-400 mt-1">Isolation Forest flags multidimensional outlier threshold</p>
                            </div>
                            <span className="text-[9px] uppercase font-bold text-purple-400 bg-purple-500/10 py-0.5 rounded mt-3">Scored</span>
                        </div>

                        {/* Step 3 */}
                        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-base mx-auto mb-2">
                                    <i className="fas fa-stethoscope" />
                                </div>
                                <h4 className="font-bold text-xs text-white">3. Failure Prediction</h4>
                                <p className="text-[10px] text-slate-400 mt-1">Random Forest classifies fault category (e.g. CPU Saturation)</p>
                            </div>
                            <span className="text-[9px] uppercase font-bold text-amber-400 bg-amber-500/10 py-0.5 rounded mt-3">Classified</span>
                        </div>

                        {/* Step 4 */}
                        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-base mx-auto mb-2">
                                    <i className="fas fa-search" />
                                </div>
                                <h4 className="font-bold text-xs text-white">4. Root Cause</h4>
                                <p className="text-[10px] text-slate-400 mt-1">RCA Agent correlates metric delta against component logs</p>
                            </div>
                            <span className="text-[9px] uppercase font-bold text-rose-400 bg-rose-500/10 py-0.5 rounded mt-3">Identified</span>
                        </div>

                        {/* Step 5 */}
                        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                            <div>
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-base mx-auto mb-2">
                                    <i className="fas fa-heartbeat" />
                                </div>
                                <h4 className="font-bold text-xs text-white">5. Recommended Action</h4>
                                <p className="text-[10px] text-slate-400 mt-1">Autonomous Kubernetes scaling, rollout restart, or cache purge</p>
                            </div>
                            <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 py-0.5 rounded mt-3">Self-Healing</span>
                        </div>
                    </div>
                </div>

                {/* Active RCA Findings & Correlated Agent Reasoning */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Active RCA Cards */}
                    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
                        <h3 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
                            <i className="fas fa-diagnoses text-cyan-400" />
                            Current Root Cause Diagnoses
                        </h3>

                        {activeIncidents.length === 0 ? (
                            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                                <i className="fas fa-check-double text-emerald-400 text-2xl mb-2" />
                                <p className="text-xs font-semibold text-white">No Active Anomalies Identified</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">All monitored metrics correlate with healthy operational baselines.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activeIncidents.map((inc) => (
                                    <div key={inc.id} className="p-4 rounded-xl bg-slate-900/80 border border-rose-500/30">
                                        <div className="flex items-center justify-between text-xs mb-2">
                                            <span className="font-mono text-cyan-400 font-bold">{inc.id} &bull; {inc.affected_component}</span>
                                            <StatusBadge status={inc.severity} size="xs" />
                                        </div>
                                        <h4 className="text-xs font-bold text-white mb-1">
                                            Root Cause Analysis:
                                        </h4>
                                        <p className="text-xs text-rose-300 leading-relaxed font-mono">
                                            {inc.root_cause}
                                        </p>
                                        <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                                            <span>Resolution State: <strong>{inc.resolution_status}</strong></span>
                                            <span>Action: Autonomous Playbook Dispatched</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Agent Causal Reasoning Logs */}
                    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
                        <h3 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
                            <i className="fas fa-comments text-cyan-400" />
                            Agent Diagnostic Logs (AnalysisAgent & RCAAgent)
                        </h3>

                        <div className="terminal-screen p-3 rounded-xl h-64 overflow-y-auto font-mono text-[11px] space-y-2 border border-slate-800">
                            {rcaLogs.length === 0 ? (
                                <p className="text-slate-500 italic">No diagnostic events triggered yet.</p>
                            ) : (
                                rcaLogs.slice(-20).map((log, idx) => (
                                    <div key={idx} className="leading-tight text-slate-300">
                                        <span className="text-slate-500 text-[10px] mr-1.5">
                                            [{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}]
                                        </span>
                                        <strong className={log.agent === 'RCAAgent' ? 'text-amber-400 mr-1.5' : 'text-purple-400 mr-1.5'}>
                                            [{log.agent}]
                                        </strong>
                                        <span>{log.message}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return {
        AnomalyDetectionView,
        FailurePredictionView,
        RootCauseAnalysisView
    };
})();
