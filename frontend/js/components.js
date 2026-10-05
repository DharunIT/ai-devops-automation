/** @jsxRuntime classic */
/**
 * AutoOps AI - Reusable UI Components
 */

window.AutoOpsComponents = (() => {
    const formatTime = (isoString) => {
        if (!isoString) return '--:--:--';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    // 1. StatusBadge
    function StatusBadge({ status, size = 'sm' }) {
        const s = (status || '').toLowerCase();
        let bg = 'bg-slate-800 text-slate-400 border-slate-700';
        let dot = 'bg-slate-400';

        if (s.includes('healthy') || s === 'success' || s === 'resolved' || s === 'clean' || s === 'deployed' || s === 'running') {
            bg = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
            dot = 'bg-emerald-400 animate-pulse';
        } else if (s.includes('critical') || s.includes('fail') || s.includes('error') || s.includes('defect') || s === 'down') {
            bg = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
            dot = 'bg-rose-400 animate-ping';
        } else if (s.includes('warning') || s.includes('degraded') || s.includes('investigating') || s.includes('progress') || s.includes('creating')) {
            bg = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
            dot = 'bg-amber-400 animate-pulse';
        } else if (s.includes('healing') || s.includes('resolving') || s.includes('training')) {
            bg = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
            dot = 'bg-cyan-400 animate-spin';
        }

        const textSize = size === 'xs' ? 'text-[10px] px-2 py-0.5' : size === 'lg' ? 'text-sm px-3.5 py-1.5' : 'text-xs px-2.5 py-1';

        return (
            <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${bg} ${textSize}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                {status || 'Unknown'}
            </span>
        );
    }

    // 2. MetricCard
    function MetricCard({ title, value, unit = '', desc, icon, color = 'cyan', trend, statusBadge }) {
        const colorMap = {
            cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
            emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
            amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
            rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
            purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
            blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' }
        };
        const c = colorMap[color] || colorMap.cyan;

        return (
            <div className={`glass-panel p-5 rounded-2xl glass-panel-hover flex flex-col justify-between transition-all duration-300 border ${c.border}`}>
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bg} ${c.text}`}>
                        <i className={`fas ${icon} text-sm`} />
                    </div>
                </div>
                <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-2xl lg:text-3xl font-bold font-mono text-white tracking-tight">{value}</span>
                    {unit && <span className="text-xs font-medium text-slate-400 font-mono">{unit}</span>}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 truncate text-[11px]">{desc}</span>
                    {statusBadge && <StatusBadge status={statusBadge} size="xs" />}
                    {trend && <span className={`font-mono text-[11px] ${trend.startsWith('+') ? 'text-rose-400' : 'text-emerald-400'}`}>{trend}</span>}
                </div>
            </div>
        );
    }

    // 3. ServerCard
    function ServerCard({ serverId, metrics, pods = [], containers = [], onInjectFault, onViewDetails }) {
        const isHealthy = metrics.status === 'Healthy';
        const cpu = metrics.cpu || 0;
        const mem = metrics.mem || 0;
        const disk = metrics.disk || 0;
        const net = metrics.net || 0;
        const resp = metrics.resp || 0;

        return (
            <div className={`glass-panel rounded-2xl p-5 border transition-all duration-300 ${
                isHealthy ? 'border-slate-800 hover:border-slate-700' : 'border-rose-500/50 glow-pulse-red'
            }`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                            isHealthy ? 'bg-cyan-500/10 text-cyan-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                            <i className="fas fa-server" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                                {serverId}
                                {!isHealthy && <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold">ALERT</span>}
                            </h3>
                            <p className="text-[11px] text-slate-400">Kubernetes Node &bull; {containers.length} Containers</p>
                        </div>
                    </div>
                    <StatusBadge status={metrics.status} size="sm" />
                </div>

                {/* Resource Gauges */}
                <div className="grid grid-cols-2 gap-3 my-4">
                    {/* CPU */}
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400 text-[11px]">CPU Load</span>
                            <span className={`font-mono font-bold ${cpu > 85 ? 'text-rose-400' : cpu > 60 ? 'text-amber-400' : 'text-cyan-400'}`}>{cpu.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-500 ${cpu > 85 ? 'bg-rose-500' : cpu > 60 ? 'bg-amber-500' : 'bg-cyan-500'}`} style={{ width: `${Math.min(100, cpu)}%` }} />
                        </div>
                    </div>

                    {/* Memory */}
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400 text-[11px]">Memory</span>
                            <span className={`font-mono font-bold ${mem > 85 ? 'text-rose-400' : mem > 60 ? 'text-amber-400' : 'text-purple-400'}`}>{mem.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-500 ${mem > 85 ? 'bg-rose-500' : mem > 60 ? 'bg-amber-500' : 'bg-purple-500'}`} style={{ width: `${Math.min(100, mem)}%` }} />
                        </div>
                    </div>

                    {/* Disk */}
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400 text-[11px]">Disk I/O</span>
                            <span className="font-mono text-slate-300 font-bold">{disk.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, disk)}%` }} />
                        </div>
                    </div>

                    {/* Latency */}
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400 text-[11px]">Latency</span>
                            <span className={`font-mono font-bold ${resp > 500 ? 'text-rose-400' : resp > 200 ? 'text-amber-400' : 'text-emerald-400'}`}>{resp.toFixed(0)} ms</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full ${resp > 500 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (resp / 1000) * 100)}%` }} />
                        </div>
                    </div>
                </div>

                {/* Pods count & quick actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                        <i className="fas fa-cubes text-slate-500" />
                        {pods.length} Active Pods
                    </span>
                    <button
                        onClick={() => onInjectFault && onInjectFault(serverId)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-medium transition-all flex items-center gap-1.5"
                    >
                        <i className="fas fa-bolt text-[10px]" />
                        Simulate Fault
                    </button>
                </div>
            </div>
        );
    }

    // 4. IncidentCard
    function IncidentCard({ incident, onResolve }) {
        const isResolved = incident.resolution_status === 'Resolved';
        const isCritical = incident.severity === 'critical';

        return (
            <div className={`glass-panel p-4 rounded-xl border transition-all duration-300 ${
                isResolved 
                    ? 'border-slate-800/60 opacity-80' 
                    : isCritical 
                    ? 'border-rose-500/40 glow-pulse-red' 
                    : 'border-amber-500/40'
            }`}>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                            {incident.id}
                        </span>
                        <StatusBadge status={incident.severity} size="xs" />
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                            <i className="fas fa-clock text-[10px]" />
                            {formatTime(incident.timestamp)}
                        </span>
                    </div>
                    <StatusBadge status={incident.resolution_status} size="xs" />
                </div>

                <div className="mt-3">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <i className="fas fa-server text-slate-400 text-xs" />
                        {incident.affected_component}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        <strong className="text-slate-400">Root Cause:</strong> {incident.root_cause || 'Telemetry anomaly under investigation'}
                    </p>
                </div>

                {/* Visible 5-Stage Incident Lifecycle */}
                {(() => {
                    const statusStr = (incident.resolution_status || '').toLowerCase();
                    let stepNum = 1;
                    if (statusStr.includes('resolved') || statusStr.includes('recovered')) stepNum = 5;
                    else if (statusStr.includes('resolving') || statusStr.includes('healing')) stepNum = 4;
                    else if (statusStr.includes('investigating') || statusStr.includes('rca')) stepNum = 3;
                    else if (statusStr.includes('analyzing') || statusStr.includes('open')) stepNum = 2;

                    return (
                        <div className="mt-3 py-2 px-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-[10px] font-bold">
                            <span className={stepNum >= 1 ? "text-rose-400 flex items-center gap-1" : "text-slate-500 flex items-center gap-1"}>
                                <i className={`fas ${stepNum >= 2 ? 'fa-check text-emerald-400' : 'fa-exclamation-circle text-rose-400 animate-pulse'} text-[9px]`} />
                                DETECTED
                            </span>
                            <i className="fas fa-chevron-right text-[8px] text-slate-600" />
                            <span className={stepNum >= 2 ? "text-purple-400 flex items-center gap-1" : "text-slate-500 flex items-center gap-1"}>
                                <i className={`fas ${stepNum >= 3 ? 'fa-check text-emerald-400' : stepNum === 2 ? 'fa-spinner fa-spin text-purple-400' : 'fa-circle'} text-[9px]`} />
                                ANALYZING
                            </span>
                            <i className="fas fa-chevron-right text-[8px] text-slate-600" />
                            <span className={stepNum >= 3 ? "text-amber-400 flex items-center gap-1" : "text-slate-500 flex items-center gap-1"}>
                                <i className={`fas ${stepNum >= 4 ? 'fa-check text-emerald-400' : stepNum === 3 ? 'fa-spinner fa-spin text-amber-400' : 'fa-circle'} text-[9px]`} />
                                RCA IDENTIFIED
                            </span>
                            <i className="fas fa-chevron-right text-[8px] text-slate-600" />
                            <span className={stepNum >= 4 ? "text-cyan-400 flex items-center gap-1" : "text-slate-500 flex items-center gap-1"}>
                                <i className={`fas ${stepNum >= 5 ? 'fa-check text-emerald-400' : stepNum === 4 ? 'fa-tools animate-spin text-cyan-400' : 'fa-circle'} text-[9px]`} />
                                HEALING
                            </span>
                            <i className="fas fa-chevron-right text-[8px] text-slate-600" />
                            <span className={stepNum >= 5 ? "text-emerald-400 flex items-center gap-1 font-extrabold" : "text-slate-500 flex items-center gap-1"}>
                                <i className={`fas ${stepNum >= 5 ? 'fa-check-circle text-emerald-400' : 'fa-circle'} text-[9px]`} />
                                RECOVERED
                            </span>
                        </div>
                    );
                })()}

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="text-[11px] text-slate-400">
                        {isResolved ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                                <i className="fas fa-check-circle" /> Resolved at {formatTime(incident.resolved_at)}
                            </span>
                        ) : (
                            <span className="text-cyan-400 flex items-center gap-1">
                                <i className="fas fa-microchip animate-spin" /> Autonomous remediation running
                            </span>
                        )}
                    </div>
                    {!isResolved && onResolve && (
                        <button
                            onClick={() => onResolve(incident.id)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] transition-all"
                        >
                            Resolve Override
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // 5. ChartCard
    function ChartCard({ title, subtitle, icon = 'fa-chart-line', children, actions }) {
        return (
            <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">
                            <i className={`fas ${icon}`} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-white">{title}</h3>
                            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
                        </div>
                    </div>
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>
                <div className="flex-1 w-full min-h-[220px]">
                    {children}
                </div>
            </div>
        );
    }

    // 6. PipelineStep
    function PipelineStep({ name, icon, status, isCurrent, isLast }) {
        const getStatusBadge = () => {
            switch (status) {
                case 'Success':
                    return { bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', icon: 'fa-check' };
                case 'Running':
                    return { bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40 pulse-node', icon: 'fa-spinner fa-spin' };
                case 'Failed':
                    return { bg: 'bg-rose-500/20 text-rose-400 border-rose-500/40', icon: 'fa-times' };
                default:
                    return { bg: 'bg-slate-800 text-slate-500 border-slate-700', icon: 'fa-hourglass-start' };
            }
        };
        const s = getStatusBadge();

        return (
            <div className="flex items-center flex-1">
                <div className="flex flex-col items-center text-center flex-1">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border text-lg transition-all ${s.bg}`}>
                        <i className={`fas ${icon}`} />
                    </div>
                    <span className="text-xs font-semibold text-white mt-2.5">{name}</span>
                    <span className={`text-[10px] uppercase font-bold mt-1 px-2 py-0.5 rounded-full border ${s.bg}`}>
                        <i className={`fas ${s.icon} mr-1`} />
                        {status}
                    </span>
                </div>
                {!isLast && (
                    <div className={`h-0.5 flex-1 mx-2 ${status === 'Success' ? 'bg-emerald-500/50' : status === 'Running' ? 'bg-amber-500/50' : 'bg-slate-800'}`} />
                )}
            </div>
        );
    }

    // 7. AgentVisualization
    function AgentVisualization({ activeAgent }) {
        const agents = [
            { id: 'MonitoringAgent', label: 'Monitoring Agent', icon: 'fa-desktop', desc: 'Telemetry Scanner' },
            { id: 'AnalysisAgent', label: 'Analysis Agent', icon: 'fa-brain', desc: 'Isolation Forest Anomaly Scorer' },
            { id: 'RCAAgent', label: 'RCA Agent', icon: 'fa-search', desc: 'Random Forest Root Cause Analyzer' },
            { id: 'HealingAgent', label: 'Self-Healing Agent', icon: 'fa-heartbeat', desc: 'Autonomous Kubernetes Remediation' }
        ];

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {agents.map((agent) => {
                    const isActive = activeAgent === agent.id;
                    return (
                        <div
                            key={agent.id}
                            className={`glass-panel p-3.5 rounded-xl relative transition-all duration-300 border ${
                                isActive ? 'border-cyan-500/60 glow-pulse-cyan' : 'border-slate-800/80 opacity-70'
                            }`}
                        >
                            {isActive && (
                                <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                            )}
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm ${
                                    isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
                                }`}>
                                    <i className={`fas ${agent.icon}`} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-xs text-white leading-tight">{agent.label}</h4>
                                    <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{agent.desc}</p>
                                </div>
                            </div>
                            <div className="mt-2 text-right">
                                <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                    isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'
                                }`}>
                                    {isActive ? '● Active Loop' : 'Standby'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // 8. FaultModal
    function FaultModal({ isOpen, onClose, onInject, defaultServer = 'Server-01' }) {
        if (!isOpen) return null;
        const [server, setServer] = React.useState(defaultServer);
        const [fault, setFault] = React.useState('cpu_spike');
        const [loading, setLoading] = React.useState(false);

        const faults = [
            { id: 'cpu_spike', label: 'CPU Spike (95-100%)', icon: 'fa-microchip', desc: 'Simulates excessive process utilization causing container throttling' },
            { id: 'memory_leak', label: 'Memory Leak (OOM Risk)', icon: 'fa-memory', desc: 'Continuous heap allocation climbing towards 98% memory limit' },
            { id: 'disk_full', label: 'Disk Space Exhaustion (99%)', icon: 'fa-hdd', desc: 'Simulates rapid log bloating saturating the root file system' },
            { id: 'network_bottleneck', label: 'Network Bottleneck', icon: 'fa-network-wired', desc: 'Simulates bandwidth flood and proxy edge latency spikes' },
            { id: 'k8s_pod_crash', label: 'Kubernetes Pod Crash', icon: 'fa-skull-crossbones', desc: 'Forces microservice pod failure triggering replica recovery' }
        ];

        const handleSubmit = async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
                await onInject(server, fault);
                onClose();
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700 p-6 shadow-2xl relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                    >
                        <i className="fas fa-times" />
                    </button>

                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-lg">
                            <i className="fas fa-bolt" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base text-white">Simulate Infrastructure Failure</h3>
                            <p className="text-xs text-slate-400">Trigger real backend telemetry degradation & watch self-healing</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Node / Server</label>
                            <select
                                value={server}
                                onChange={(e) => setServer(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                            >
                                <option value="Server-01">Server-01 (Gateway & Auth)</option>
                                <option value="Server-02">Server-02 (API & Payments)</option>
                                <option value="Server-03">Server-03 (Primary DB & Cache)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Failure Mode</label>
                            <div className="space-y-2">
                                {faults.map((f) => (
                                    <label
                                        key={f.id}
                                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                            fault === f.id
                                                ? 'bg-rose-500/10 border-rose-500/60 text-white'
                                                : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="fault"
                                            value={f.id}
                                            checked={fault === f.id}
                                            onChange={() => setFault(f.id)}
                                            className="mt-0.5 accent-rose-500"
                                        />
                                        <div>
                                            <div className="text-xs font-semibold flex items-center gap-1.5">
                                                <i className={`fas ${f.icon} text-rose-400 text-[11px]`} />
                                                {f.label}
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{f.desc}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-rose-500/20"
                            >
                                {loading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-radiation" />}
                                Inject Failure Now
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // 9. EmptyState
    function EmptyState({ icon = 'fa-inbox', title, description, actionText, onAction }) {
        return (
            <div className="glass-panel rounded-2xl p-8 text-center border border-slate-800/80 my-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center text-xl mx-auto mb-3">
                    <i className={`fas ${icon}`} />
                </div>
                <h4 className="text-sm font-semibold text-white">{title}</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">{description}</p>
                {actionText && onAction && (
                    <button
                        onClick={onAction}
                        className="mt-4 px-3.5 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-medium hover:bg-cyan-500/30 transition-all"
                    >
                        {actionText}
                    </button>
                )}
            </div>
        );
    }

    // 10. LoadingState
    function LoadingState({ message = 'Loading telemetry stream...' }) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs text-slate-400 font-medium animate-pulse">{message}</p>
            </div>
        );
    }

    // 11. ErrorState
    function ErrorState({ message = 'Backend connection unavailable', onRetry }) {
        return (
            <div className="glass-panel rounded-2xl p-6 border border-rose-500/40 bg-rose-500/5 my-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-lg mx-auto mb-2">
                    <i className="fas fa-exclamation-circle" />
                </div>
                <h4 className="text-sm font-semibold text-rose-300">Connection Disrupted</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">{message}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="mt-3 px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs transition-all inline-flex items-center gap-1.5"
                    >
                        <i className="fas fa-redo text-[10px]" />
                        Retry Connection
                    </button>
                )}
            </div>
        );
    }

    // 12. ToastNotification
    function ToastNotification({ notification, onClose }) {
        if (!notification) return null;
        const isError = notification.type === 'error';
        const isSuccess = notification.type === 'success';

        return (
            <div className="fixed top-20 right-6 z-50 animate-bounce-short max-w-md">
                <div className={`p-4 rounded-2xl glass-panel border shadow-2xl flex items-start gap-3 backdrop-blur-md ${
                    isError 
                        ? 'border-rose-500/50 bg-rose-950/80 text-rose-200' 
                        : isSuccess 
                        ? 'border-emerald-500/50 bg-emerald-950/80 text-emerald-200' 
                        : 'border-amber-500/50 bg-slate-950/90 text-amber-200'
                }`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isError ? 'bg-rose-500/20 text-rose-400' : isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                        <i className={`fas ${isError ? 'fa-exclamation-triangle' : isSuccess ? 'fa-check-circle' : 'fa-bolt'}`} />
                    </div>
                    <div className="flex-1 text-xs">
                        <div className="font-bold flex items-center justify-between">
                            <span>{notification.title || 'System Notification'}</span>
                            <span className="text-[10px] opacity-75 font-mono">NOW</span>
                        </div>
                        <p className="mt-0.5 text-slate-300 text-[11px] leading-relaxed">{notification.message}</p>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="text-slate-400 hover:text-white text-xs ml-1">
                            <i className="fas fa-times" />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // 13. AutomatedWorkflowPanel
    function AutomatedWorkflowPanel({
        workflow, // { active, stageIndex, progress, timer, serverId, faultType, error, stages }
        onStartWorkflow,
        onResetWorkflow,
        onRetryWorkflow
    }) {
        if (!workflow) return null;

        const isRunning = workflow.active;
        const isCompleted = workflow.completed;
        const progress = Math.min(100, Math.max(0, workflow.progress || 0));

        const stages = workflow.stages || [
            { id: 'simulate', title: 'Failure Simulated', subtitle: 'Target Server-01 &bull; Telemetry Spike Injected', model: 'Chaos Injection', status: 'WAITING' },
            { id: 'anomaly', title: 'Anomaly Detected', subtitle: 'Unsupervised Outlier Scoring', model: 'Isolation Forest', status: 'WAITING' },
            { id: 'prediction', title: 'Failure Predicted', subtitle: 'Classification & Probability Scoring', model: 'Random Forest', status: 'WAITING' },
            { id: 'rca', title: 'Root Cause Identified', subtitle: 'Diagnostic Feature Attribution', model: 'RCA Agent', status: 'WAITING' },
            { id: 'incident', title: 'Active Incident Created', subtitle: 'State Progression & Alert Dispatch', model: 'Incident Registry', status: 'WAITING' },
            { id: 'healing', title: 'Healing Action Executed', subtitle: 'Autonomous Orchestration Remediation', model: 'Kubernetes HPA', status: 'WAITING' },
            { id: 'recovery', title: 'Recovery Verified', subtitle: 'Telemetry Stabilization & Verification', model: 'Health Verifier', status: 'WAITING' },
            { id: 'history', title: 'Recovery History Updated', subtitle: 'Audit Ledger & Incident Archival', model: 'Recovery Archive', status: 'WAITING' }
        ];

        return (
            <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/95 via-[#081020] to-indigo-950/40 relative overflow-hidden shadow-2xl transition-all duration-300">
                {/* Background ambient glow */}
                <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ${
                    isCompleted ? 'bg-emerald-500/10' : isRunning ? 'bg-cyan-500/10' : 'bg-indigo-500/5'
                }`} />

                {/* Header Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10 pb-5 border-b border-slate-800/80">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                                <i className="fas fa-brain text-[10px]" />
                                AI INCIDENT RESPONSE WORKFLOW
                            </span>
                            
                            {isCompleted ? (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 animate-pulse">
                                    <i className="fas fa-check-circle" /> WORKFLOW COMPLETE &bull; 100% RECOVERED
                                </span>
                            ) : isRunning ? (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                                    <i className="fas fa-circle-notch fa-spin text-[10px]" />
                                    STAGE {(workflow.stageIndex || 0) + 1} OF {stages.length}: {stages[workflow.stageIndex]?.title?.toUpperCase() || 'RUNNING'}
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
                                    <i className="fas fa-pause text-[8px]" /> STANDBY &bull; READY FOR DEMO
                                </span>
                            )}

                            {isRunning && (
                                <span className="text-[10px] font-mono font-bold text-cyan-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                                    ⏱ {(workflow.timer || 0).toFixed(1)}s / ~15.5s
                                </span>
                            )}
                        </div>

                        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            Autonomous AI Incident Detection & Self-Healing Pipeline
                        </h2>
                        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                            Single automated demonstration: Injects failure on Server-01 &rarr; Isolation Forest detects anomaly &rarr; Random Forest predicts failure &rarr; RCA identifies root cause &rarr; Incident created &rarr; Autonomous healing executes &rarr; Telemetry normalizes &rarr; Recovery history logged.
                        </p>
                    </div>

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <button
                            onClick={onStartWorkflow}
                            disabled={isRunning}
                            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg ${
                                isRunning
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                    : 'bg-gradient-to-r from-rose-500 via-amber-600 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-rose-500/25 active:scale-95'
                            }`}
                        >
                            <i className={`fas ${isRunning ? 'fa-spinner fa-spin' : 'fa-bolt'}`} />
                            <span>{isRunning ? 'Demonstration Running...' : isCompleted ? 'Re-run Incident Demo' : 'Simulate Failure (Run Demo)'}</span>
                        </button>

                        <button
                            onClick={onResetWorkflow}
                            className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold text-xs transition-all flex items-center gap-1.5 active:scale-95"
                            title="Reset all failure states, incidents, and restore telemetry to healthy normal"
                        >
                            <i className="fas fa-undo-alt text-slate-400" />
                            <span>Reset Demo</span>
                        </button>
                    </div>
                </div>

                {/* Progress Bar & Percentage */}
                <div className="py-4">
                    <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                        <span className="text-slate-400 text-[11px] font-sans">
                            {isRunning ? 'Autonomous Pipeline Execution in Progress...' : isCompleted ? 'All 8 Response Stages Completed Successfully' : 'Awaiting Demonstration Trigger'}
                        </span>
                        <span className={`font-bold ${isCompleted ? 'text-emerald-400' : isRunning ? 'text-cyan-400' : 'text-slate-500'}`}>
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-900/90 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                isCompleted
                                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-sm shadow-emerald-500/50'
                                    : isRunning
                                    ? 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 shadow-sm shadow-cyan-500/50 animate-pulse'
                                    : 'bg-slate-700'
                            }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Stages Cards Grid (8 Sequential Stages) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                    {stages.map((stage, idx) => {
                        const status = stage.status || 'WAITING';
                        const isStageRunning = status === 'RUNNING';
                        const isStageDone = status === 'COMPLETED';
                        const isStageFailed = status === 'FAILED';

                        return (
                            <div
                                key={stage.id || idx}
                                className={`p-3.5 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between ${
                                    isStageDone
                                        ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-100 shadow-sm shadow-emerald-500/5'
                                        : isStageRunning
                                        ? 'bg-cyan-950/30 border-cyan-400 shadow-lg shadow-cyan-500/20 glow-pulse-cyan'
                                        : isStageFailed
                                        ? 'bg-rose-950/30 border-rose-500 text-rose-200'
                                        : 'bg-slate-900/50 border-slate-800/80 text-slate-400'
                                }`}
                            >
                                <div>
                                    {/* Stage Top Badge & Status Icon */}
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className="text-[10px] font-mono text-slate-500 font-bold">
                                            0{idx + 1}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            {stage.model && (
                                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                                                    isStageDone ? 'bg-emerald-500/15 text-emerald-300' : isStageRunning ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'
                                                }`}>
                                                    {stage.model}
                                                </span>
                                            )}
                                            {isStageDone ? (
                                                <i className="fas fa-check-circle text-emerald-400 text-xs" />
                                            ) : isStageRunning ? (
                                                <i className="fas fa-circle-notch fa-spin text-cyan-400 text-xs" />
                                            ) : isStageFailed ? (
                                                <i className="fas fa-times-circle text-rose-400 text-xs" />
                                            ) : (
                                                <i className="far fa-circle text-slate-700 text-xs" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Stage Title */}
                                    <h4 className={`text-xs font-bold ${
                                        isStageDone ? 'text-white' : isStageRunning ? 'text-cyan-300 font-extrabold' : 'text-slate-300'
                                    }`}>
                                        {stage.title}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                                        {stage.subtitle}
                                    </p>
                                </div>

                                {/* Dynamic Details Box */}
                                <div className="mt-3 pt-2 border-t border-slate-800/60">
                                    <div className="flex items-center justify-between text-[9px] font-mono">
                                        <span className="text-slate-500 uppercase tracking-wider">STATE</span>
                                        <span className={`font-bold ${
                                            isStageDone ? 'text-emerald-400' : isStageRunning ? 'text-cyan-400 animate-pulse' : isStageFailed ? 'text-rose-400' : 'text-slate-600'
                                        }`}>
                                            {status}
                                        </span>
                                    </div>
                                    {stage.details && (
                                        <div className={`mt-1.5 p-2 rounded-lg text-[10px] font-mono leading-tight ${
                                            isStageDone ? 'bg-slate-900/90 text-emerald-300 border border-emerald-500/20' : 'bg-slate-900/90 text-cyan-300 border border-cyan-500/20'
                                        }`}>
                                            {stage.details}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Error Banner & Retry Workflow Button */}
                {workflow.error && (
                    <div className="mt-4 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/60 flex items-center justify-between gap-4 animate-fade-in">
                        <div className="flex items-center gap-3 text-xs text-rose-200">
                            <i className="fas fa-exclamation-triangle text-rose-400 text-base" />
                            <div>
                                <span className="font-bold">Workflow Interrupted at Stage:</span> {workflow.failedStage || 'Unknown'}
                                <p className="text-[11px] text-rose-300/80 mt-0.5">{workflow.error}</p>
                            </div>
                        </div>
                        {onRetryWorkflow && (
                            <button
                                onClick={onRetryWorkflow}
                                className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 shrink-0"
                            >
                                <i className="fas fa-redo text-xs" />
                                Retry Workflow
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return {
        formatTime,
        StatusBadge,
        MetricCard,
        ServerCard,
        IncidentCard,
        ChartCard,
        PipelineStep,
        AgentVisualization,
        FaultModal,
        EmptyState,
        LoadingState,
        ErrorState,
        ToastNotification,
        AutomatedWorkflowPanel
    };
})();
