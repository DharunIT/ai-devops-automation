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
        ErrorState
    };
})();
