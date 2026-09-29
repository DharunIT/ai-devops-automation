/** @jsxRuntime classic */
/**
 * AutoOps AI - Self-Healing Section Pages:
 * 1. Active Incidents
 * 2. Healing Actions
 * 3. Recovery History
 */

window.AutoOpsSelfHealing = (() => {
    const { StatusBadge, IncidentCard, EmptyState, LoadingState } = window.AutoOpsComponents;

    // 1. Active Incidents Page
    function ActiveIncidentsView({ incidents = [], onResolveIncident, onOpenFaultModal }) {
        const activeList = incidents.filter(i => i.resolution_status !== 'Resolved');

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Active Incident Center</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Automated detection, severity classification, and automated healing state transitions</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700">
                            <strong>{activeList.length}</strong> Open Incidents
                        </span>
                        <button
                            onClick={() => onOpenFaultModal && onOpenFaultModal()}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/25 transition-all flex items-center gap-1.5"
                        >
                            <i className="fas fa-bolt" />
                            Simulate Incident
                        </button>
                    </div>
                </div>

                {/* Visual Healing Workflow Banner */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <i className="fas fa-stream text-cyan-400" />
                        Automated Incident Lifecycle
                    </h3>
                    <div className="flex flex-wrap items-center justify-between gap-2 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs">
                                <i className="fas fa-exclamation-triangle" />
                            </div>
                            <div>
                                <h5 className="font-bold text-xs text-white">1. DETECTED</h5>
                                <p className="text-[10px] text-slate-400">Telemetry spike</p>
                            </div>
                        </div>
                        <i className="fas fa-arrow-right text-slate-600 hidden sm:block" />

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs">
                                <i className="fas fa-brain" />
                            </div>
                            <div>
                                <h5 className="font-bold text-xs text-white">2. ANALYZING</h5>
                                <p className="text-[10px] text-slate-400">Isolation Forest</p>
                            </div>
                        </div>
                        <i className="fas fa-arrow-right text-slate-600 hidden sm:block" />

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">
                                <i className="fas fa-search" />
                            </div>
                            <div>
                                <h5 className="font-bold text-xs text-white">3. RCA IDENTIFIED</h5>
                                <p className="text-[10px] text-slate-400">Random Forest</p>
                            </div>
                        </div>
                        <i className="fas fa-arrow-right text-slate-600 hidden sm:block" />

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">
                                <i className="fas fa-tools animate-spin" />
                            </div>
                            <div>
                                <h5 className="font-bold text-xs text-white">4. HEALING</h5>
                                <p className="text-[10px] text-slate-400">K8s remediation</p>
                            </div>
                        </div>
                        <i className="fas fa-arrow-right text-slate-600 hidden sm:block" />

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                                <i className="fas fa-check-circle" />
                            </div>
                            <div>
                                <h5 className="font-bold text-xs text-white">5. RECOVERED</h5>
                                <p className="text-[10px] text-slate-400">Auto-stabilized</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Incidents List */}
                <div className="space-y-4">
                    {activeList.length === 0 ? (
                        <EmptyState
                            icon="fa-shield-check"
                            title="No Active Incidents"
                            description="All monitored nodes and container microservices are operating inside normal parameters. Use the simulation panel to inject a fault."
                            actionText="Inject Failure Simulation"
                            onAction={onOpenFaultModal}
                        />
                    ) : (
                        activeList.map((inc) => (
                            <IncidentCard
                                key={inc.id}
                                incident={inc}
                                onResolve={onResolveIncident}
                            />
                        ))
                    )}
                </div>
            </div>
        );
    }

    // 2. Healing Actions Page
    function HealingActionsView({ healing, agentLogs = [] }) {
        if (!healing) {
            return <LoadingState message="Loading self-healing execution logs..." />;
        }

        const logs = healing.logs || [];
        const pods = healing.k8s_pods || [];
        const healingAgentLogs = agentLogs.filter(l => l.agent === 'HealingAgent');

        return (
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Self-Healing Control Center</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Automated Kubernetes orchestrations: rollout restarts, auto-scaling, and resource cleanup</p>
                </div>

                {/* Available Playbooks Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { title: 'Container Restart', icon: 'fa-redo', desc: 'kubectl rollout restart deployment for crashed microservices', status: 'Ready' },
                        { title: 'Horizontal Pod Auto-scaler', icon: 'fa-expand-arrows-alt', desc: 'Dynamically scale replicas from 2 to 4 upon CPU saturation', status: 'Ready' },
                        { title: 'Cache & Log Flush', icon: 'fa-broom', desc: 'Purge temp log directories and rotate journal logs when disk > 95%', status: 'Ready' },
                        { title: 'Ingress Re-routing', icon: 'fa-route', desc: 'Rate-limit and reroute edge proxy gateway on network saturation', status: 'Ready' }
                    ].map((p, idx) => (
                        <div key={idx} className="glass-panel p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                            <div>
                                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs mb-2.5">
                                    <i className={`fas ${p.icon}`} />
                                </div>
                                <h4 className="font-semibold text-xs text-white">{p.title}</h4>
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{p.desc}</p>
                            </div>
                            <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px]">
                                <span className="text-slate-500">Playbook Engine</span>
                                <span className="text-emerald-400 font-bold">&bull; {p.status}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Real-time Simulated Kubernetes Pod Allocation */}
                <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
                    <h3 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
                        <i className="fas fa-circle-notch text-cyan-400" />
                        Kubernetes Pod Dynamic State (Simulated Cluster)
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                                    <th className="py-2.5 px-3">Pod Name</th>
                                    <th className="py-2.5 px-3">Host Node</th>
                                    <th className="py-2.5 px-3">Status</th>
                                    <th className="py-2.5 px-3">Restarts</th>
                                    <th className="py-2.5 px-3">Age</th>
                                    <th className="py-2.5 px-3">CPU / Memory</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                {pods.map((pod, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="py-2.5 px-3 text-white font-semibold flex items-center gap-2">
                                            <i className="fas fa-cube text-slate-500 text-[10px]" />
                                            {pod.name}
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-300">{pod.server}</td>
                                        <td className="py-2.5 px-3"><StatusBadge status={pod.status} size="xs" /></td>
                                        <td className="py-2.5 px-3 text-slate-300">{pod.restarts}</td>
                                        <td className="py-2.5 px-3 text-slate-400">{pod.age}</td>
                                        <td className="py-2.5 px-3 text-slate-300">{pod.cpu} / {pod.mem}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Healing Agent Terminal Stream */}
                <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
                    <h3 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
                        <i className="fas fa-terminal text-emerald-400" />
                        HealingAgent Orchestration Logs
                    </h3>
                    <div className="terminal-screen p-3 rounded-xl h-48 overflow-y-auto font-mono text-[11px] space-y-1.5 border border-slate-800">
                        {healingAgentLogs.length === 0 ? (
                            <p className="text-slate-500 italic">Self-Healing agent standing by on monitoring bus...</p>
                        ) : (
                            healingAgentLogs.map((log, idx) => (
                                <div key={idx} className="text-slate-300">
                                    <span className="text-slate-500 mr-1.5">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                    <span className="text-emerald-400 font-bold mr-1.5">[HealingAgent]</span>
                                    <span>{log.message}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // 3. Recovery History Page
    function RecoveryHistoryView({ incidents = [], healing }) {
        const [filter, setFilter] = React.useState('All');

        const filteredIncidents = incidents.filter(i => {
            if (filter === 'All') return true;
            if (filter === 'Critical') return i.severity === 'critical';
            if (filter === 'Warning') return i.severity === 'warning';
            if (filter === 'Resolved') return i.resolution_status === 'Resolved';
            return true;
        });

        const healingLogs = (healing && healing.logs) || [];

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Recovery & Incident History</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Audit log of detected infrastructure faults, executed healing playbooks, and stabilization duration</p>
                    </div>

                    {/* Filter buttons */}
                    <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start">
                        {['All', 'Critical', 'Warning', 'Resolved'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                    filter === f ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Incident History Table */}
                <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
                    <h3 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
                        <i className="fas fa-history text-cyan-400" />
                        Incident Log Archive
                    </h3>

                    {filteredIncidents.length === 0 ? (
                        <EmptyState
                            icon="fa-clipboard-check"
                            title="No records matching filter"
                            description="No incidents match the selected filter category."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                                        <th className="py-2.5 px-3">Incident ID</th>
                                        <th className="py-2.5 px-3">Detected At</th>
                                        <th className="py-2.5 px-3">Node</th>
                                        <th className="py-2.5 px-3">Severity</th>
                                        <th className="py-2.5 px-3">Root Cause Diagnosis</th>
                                        <th className="py-2.5 px-3">Status</th>
                                        <th className="py-2.5 px-3">Resolved At</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                    {filteredIncidents.map((inc) => (
                                        <tr key={inc.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 px-3 text-cyan-400 font-bold">{inc.id}</td>
                                            <td className="py-3 px-3 text-slate-300">
                                                {inc.timestamp ? new Date(inc.timestamp).toLocaleTimeString() : '--'}
                                            </td>
                                            <td className="py-3 px-3 text-white font-semibold">{inc.affected_component}</td>
                                            <td className="py-3 px-3"><StatusBadge status={inc.severity} size="xs" /></td>
                                            <td className="py-3 px-3 text-slate-300 max-w-xs truncate font-sans text-xs">
                                                {inc.root_cause || 'Under investigation'}
                                            </td>
                                            <td className="py-3 px-3"><StatusBadge status={inc.resolution_status} size="xs" /></td>
                                            <td className="py-3 px-3 text-slate-400">
                                                {inc.resolved_at ? new Date(inc.resolved_at).toLocaleTimeString() : 'In Progress'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Executed Remediation Actions Log */}
                <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
                    <h3 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
                        <i className="fas fa-magic text-emerald-400" />
                        Executed Self-Healing Actions Log
                    </h3>

                    {healingLogs.length === 0 ? (
                        <p className="text-xs text-slate-500 italic p-4 text-center">No self-healing scripts triggered yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                                        <th className="py-2 px-3">Timestamp</th>
                                        <th className="py-2 px-3">Incident ID</th>
                                        <th className="py-2 px-3">Action Type</th>
                                        <th className="py-2 px-3">Remediation Details</th>
                                        <th className="py-2 px-3">Result</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                    {healingLogs.map((l) => (
                                        <tr key={l.id} className="hover:bg-slate-800/30">
                                            <td className="py-2.5 px-3 text-slate-400">{new Date(l.timestamp).toLocaleTimeString()}</td>
                                            <td className="py-2.5 px-3 text-cyan-400 font-bold">{l.incident_id}</td>
                                            <td className="py-2.5 px-3 text-white uppercase text-[10px]">{l.action_type}</td>
                                            <td className="py-2.5 px-3 text-slate-300 font-sans text-xs">{l.details}</td>
                                            <td className="py-2.5 px-3"><StatusBadge status={l.status} size="xs" /></td>
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

    return {
        ActiveIncidentsView,
        HealingActionsView,
        RecoveryHistoryView
    };
})();
