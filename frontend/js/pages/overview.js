/** @jsxRuntime classic */
/**
 * AutoOps AI - Overview / Command Center Page
 */

window.AutoOpsOverview = (() => {
    const { MetricCard, StatusBadge, ServerCard, IncidentCard, ChartCard, AgentVisualization } = window.AutoOpsComponents;

    function OverviewPage({
        status,
        metrics,
        failures,
        incidents,
        agentLogs,
        activeAgent,
        onNavigate,
        onOpenFaultModal,
        onResolveIncident,
        onTriggerPipeline
    }) {
        const chartRef = React.useRef(null);
        const chartInstance = React.useRef(null);
        const terminalBottomRef = React.useRef(null);

        // Auto-scroll terminal logs
        React.useEffect(() => {
            if (terminalBottomRef.current) {
                terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }, [agentLogs]);

        // Render Telemetry Line Chart
        React.useEffect(() => {
            if (!chartRef.current || !metrics || !metrics.historical) return;

            const servers = Object.keys(metrics.historical);
            if (servers.length === 0 || !metrics.historical[servers[0]] || metrics.historical[servers[0]].length === 0) return;

            const firstHistory = metrics.historical[servers[0]];
            const labels = firstHistory.map(h => {
                if (!h.timestamp) return '';
                const d = new Date(h.timestamp);
                return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            });

            const cpuPoints = [];
            const memPoints = [];
            const respPoints = [];

            for (let i = 0; i < firstHistory.length; i++) {
                let cpuSum = 0, memSum = 0, respSum = 0, count = 0;
                servers.forEach(s => {
                    const row = metrics.historical[s][i];
                    if (row) {
                        cpuSum += row.cpu_usage || 0;
                        memSum += row.memory_usage || 0;
                        respSum += row.response_time || 0;
                        count++;
                    }
                });
                cpuPoints.push(count > 0 ? Number((cpuSum / count).toFixed(1)) : 0);
                memPoints.push(count > 0 ? Number((memSum / count).toFixed(1)) : 0);
                respPoints.push(count > 0 ? Number((respSum / count).toFixed(0)) : 0);
            }

            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const ctx = chartRef.current.getContext('2d');
            chartInstance.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Avg CPU Load (%)',
                            data: cpuPoints,
                            borderColor: '#06b6d4',
                            backgroundColor: 'rgba(6, 182, 212, 0.08)',
                            fill: true,
                            tension: 0.35,
                            borderWidth: 2,
                            pointRadius: 2,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Avg Memory (%)',
                            data: memPoints,
                            borderColor: '#a855f7',
                            backgroundColor: 'rgba(168, 85, 247, 0.05)',
                            fill: true,
                            tension: 0.35,
                            borderWidth: 2,
                            pointRadius: 2,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Avg Latency (ms)',
                            data: respPoints,
                            borderColor: '#10b981',
                            backgroundColor: 'transparent',
                            borderDash: [4, 4],
                            tension: 0.35,
                            borderWidth: 1.5,
                            pointRadius: 0,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.04)' },
                            ticks: { color: '#94a3b8', font: { size: 10 } }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            min: 0,
                            max: 100,
                            grid: { color: 'rgba(255, 255, 255, 0.04)' },
                            ticks: { color: '#94a3b8', font: { size: 10 }, callback: v => `${v}%` }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            min: 0,
                            grid: { drawOnChartArea: false },
                            ticks: { color: '#10b981', font: { size: 10 }, callback: v => `${v}ms` }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: { color: '#f8fafc', font: { size: 11 }, boxWidth: 12 }
                        }
                    }
                }
            });
        }, [metrics]);

        // Compute overall real-time metrics
        const avgCpu = status ? status.avg_cpu_usage : 0;
        const avgMem = status ? status.avg_mem_usage : 0;
        const avgDisk = status ? status.avg_disk_usage : 0;
        const appStatus = status ? status.app_status : 'Healthy';
        const openIncidents = status ? status.open_incidents : 0;

        // Approximate average network and latency from current servers
        let avgNet = 0;
        let avgResp = 0;
        let serverList = [];
        if (metrics && metrics.current) {
            serverList = Object.entries(metrics.current);
            if (serverList.length > 0) {
                avgNet = serverList.reduce((acc, [_, m]) => acc + (m.net || 0), 0) / serverList.length;
                avgResp = serverList.reduce((acc, [_, m]) => acc + (m.resp || 0), 0) / serverList.length;
            }
        }

        const activeIncidentsList = (incidents || []).filter(i => i.resolution_status !== 'Resolved');

        return (
            <div className="space-y-6 animate-fade-in">
                {/* 1. Top Section Banner */}
                <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-[#0a1120] to-indigo-950/40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                                    AUTOOPS AI PLATFORM
                                </span>
                                <span className="text-slate-500 text-xs">&bull;</span>
                                <span className="text-xs text-slate-400">Autonomous Infrastructure Resilience</span>
                            </div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                                Infrastructure Intelligence Center
                            </h1>
                            <p className="text-xs text-slate-400 max-w-xl mt-1 leading-relaxed">
                                Continuous telemetry monitoring, unsupervised Isolation Forest anomaly scoring, Random Forest failure categorization, and automated self-healing playbooks.
                            </p>
                        </div>

                        {/* Quick action buttons */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            <button
                                onClick={onOpenFaultModal}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 text-white font-semibold text-xs transition-all flex items-center gap-2 shadow-lg shadow-rose-500/20"
                            >
                                <i className="fas fa-bolt" />
                                Simulate Failure
                            </button>
                            <button
                                onClick={() => onNavigate('defect_prediction')}
                                className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all flex items-center gap-2"
                            >
                                <i className="fas fa-bug text-indigo-400" />
                                Defect Lab
                            </button>
                            <button
                                onClick={onTriggerPipeline}
                                className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all flex items-center gap-2"
                            >
                                <i className="fas fa-rocket text-cyan-400" />
                                Trigger CI/CD
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Command Center 6 Key Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                    {/* System Status */}
                    <MetricCard
                        title="SYSTEM STATUS"
                        value={appStatus.toUpperCase()}
                        color={appStatus === 'Healthy' ? 'emerald' : 'rose'}
                        icon="fa-shield-alt"
                        desc={`${status ? status.servers_count : 3} Nodes Active`}
                        statusBadge={appStatus}
                    />

                    {/* CPU Usage */}
                    <MetricCard
                        title="CPU USAGE"
                        value={avgCpu.toFixed(1)}
                        unit="%"
                        color={avgCpu > 85 ? 'rose' : avgCpu > 60 ? 'amber' : 'cyan'}
                        icon="fa-microchip"
                        desc="Across clusters"
                        trend={avgCpu > 80 ? '+14% spike' : 'normal'}
                    />

                    {/* Memory Usage */}
                    <MetricCard
                        title="MEMORY USAGE"
                        value={avgMem.toFixed(1)}
                        unit="%"
                        color={avgMem > 85 ? 'rose' : avgMem > 60 ? 'amber' : 'purple'}
                        icon="fa-memory"
                        desc="Allocated heap"
                        trend={avgMem > 85 ? 'OOM Warning' : 'stable'}
                    />

                    {/* Disk Usage */}
                    <MetricCard
                        title="DISK USAGE"
                        value={avgDisk.toFixed(1)}
                        unit="%"
                        color={avgDisk > 90 ? 'rose' : 'blue'}
                        icon="fa-hdd"
                        desc="Root mount volumes"
                    />

                    {/* Network Traffic */}
                    <MetricCard
                        title="NETWORK"
                        value={avgNet.toFixed(1)}
                        unit="MB/s"
                        color="cyan"
                        icon="fa-network-wired"
                        desc="Ingress / Egress"
                    />

                    {/* Response Time */}
                    <MetricCard
                        title="RESPONSE TIME"
                        value={avgResp.toFixed(0)}
                        unit="ms"
                        color={avgResp > 500 ? 'rose' : avgResp > 200 ? 'amber' : 'emerald'}
                        icon="fa-tachometer-alt"
                        desc="Avg API latency"
                    />
                </div>

                {/* 3. AI Agent Swarm Visualization */}
                <div className="glass-panel p-4 rounded-2xl border border-slate-800/80">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <i className="fas fa-robot text-cyan-400" />
                            Autonomous AI Agent Swarm
                        </span>
                        <span className="text-[11px] text-cyan-400 font-mono">
                            Active Agent: <strong>{activeAgent}</strong>
                        </span>
                    </div>
                    <AgentVisualization activeAgent={activeAgent} />
                </div>

                {/* 4. Telemetry Time-Series & Infrastructure Topology */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Telemetry Chart */}
                    <div className="lg:col-span-2">
                        <ChartCard
                            title="Live Cluster Telemetry Stream"
                            subtitle="Synchronized CPU, Memory, and Latency trend across all virtual nodes"
                            icon="fa-chart-area"
                            actions={
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                    <span className="text-[11px] text-emerald-400 font-mono">Live (2s ticks)</span>
                                </div>
                            }
                        >
                            <div className="h-64 w-full">
                                <canvas ref={chartRef} />
                            </div>
                        </ChartCard>
                    </div>

                    {/* Right: Quick Nodes Overview */}
                    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs">
                                        <i className="fas fa-server" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm text-white">Cluster Nodes</h3>
                                        <p className="text-xs text-slate-400">{serverList.length} Monitored Hosts</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onNavigate('servers')}
                                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                                >
                                    View All &rarr;
                                </button>
                            </div>

                            <div className="space-y-3">
                                {serverList.slice(0, 3).map(([sName, sMetrics]) => (
                                    <div key={sName} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all">
                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                            <span className="font-semibold text-white flex items-center gap-1.5">
                                                <i className="fas fa-desktop text-slate-500 text-[10px]" />
                                                {sName}
                                            </span>
                                            <StatusBadge status={sMetrics.status} size="xs" />
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 font-mono mt-2">
                                            <div>CPU: <strong className="text-slate-200">{sMetrics.cpu?.toFixed(0)}%</strong></div>
                                            <div>MEM: <strong className="text-slate-200">{sMetrics.mem?.toFixed(0)}%</strong></div>
                                            <div>LAT: <strong className="text-slate-200">{sMetrics.resp?.toFixed(0)}ms</strong></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                            <span className="text-slate-400">Total K8s Pods:</span>
                            <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                                {status ? status.k8s_pods_count : 6} Pods
                            </span>
                        </div>
                    </div>
                </div>

                {/* 5. Bottom Split: Self-Healing Workflow & Live Agent Terminal */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Active Incidents & Remediation Pipeline */}
                    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs">
                                        <i className="fas fa-heartbeat" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm text-white">Autonomous Remediation Loop</h3>
                                        <p className="text-xs text-slate-400">Automated incident detection and self-healing workflow</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onNavigate('active_incidents')}
                                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                                >
                                    Incidents ({openIncidents}) &rarr;
                                </button>
                            </div>

                            {/* Self-Healing Workflow Banner */}
                            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 mb-4">
                                <div className="flex items-center justify-between text-[11px] font-bold text-center">
                                    <span className="text-rose-400 flex-1">
                                        <i className="fas fa-exclamation-triangle block mb-1 text-sm" /> DETECTED
                                    </span>
                                    <i className="fas fa-chevron-right text-slate-600 text-xs mx-1" />
                                    <span className="text-purple-400 flex-1">
                                        <i className="fas fa-brain block mb-1 text-sm" /> ANALYZING
                                    </span>
                                    <i className="fas fa-chevron-right text-slate-600 text-xs mx-1" />
                                    <span className="text-amber-400 flex-1">
                                        <i className="fas fa-search block mb-1 text-sm" /> RCA IDENTIFIED
                                    </span>
                                    <i className="fas fa-chevron-right text-slate-600 text-xs mx-1" />
                                    <span className="text-cyan-400 flex-1">
                                        <i className="fas fa-tools block mb-1 text-sm" /> HEALING
                                    </span>
                                    <i className="fas fa-chevron-right text-slate-600 text-xs mx-1" />
                                    <span className="text-emerald-400 flex-1">
                                        <i className="fas fa-check-circle block mb-1 text-sm" /> RECOVERED
                                    </span>
                                </div>
                            </div>

                            {/* Active Incident List */}
                            <div className="space-y-3">
                                {activeIncidentsList.length === 0 ? (
                                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                                        <i className="fas fa-check-circle text-emerald-400 text-xl mb-1.5" />
                                        <p className="text-xs font-semibold text-emerald-300">All Systems Operational</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">No open telemetry incidents detected across nodes.</p>
                                    </div>
                                ) : (
                                    activeIncidentsList.slice(0, 2).map((inc) => (
                                        <IncidentCard
                                            key={inc.id}
                                            incident={inc}
                                            onResolve={onResolveIncident}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                            <span>Success Rate:</span>
                            <span className="font-mono text-emerald-400 font-bold">
                                {status ? `${status.success_healing_actions} / ${status.total_healing_actions} Recovered` : '100%'}
                            </span>
                        </div>
                    </div>

                    {/* Right: Live AI Agent Terminal Feed */}
                    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs">
                                    <i className="fas fa-terminal" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm text-white">AI Agent Activity Stream</h3>
                                    <p className="text-xs text-slate-400">Real-time telemetry analysis and execution logs</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                                LIVE STREAM
                            </span>
                        </div>

                        <div className="terminal-screen p-3 rounded-xl h-64 overflow-y-auto font-mono text-[11px] space-y-2 border border-slate-800">
                            {agentLogs.length === 0 ? (
                                <p className="text-slate-500 italic">Connecting to agent daemon event stream...</p>
                            ) : (
                                agentLogs.slice(-25).map((log, idx) => {
                                    let agentColor = 'text-cyan-400';
                                    if (log.agent === 'AnalysisAgent') agentColor = 'text-purple-400';
                                    if (log.agent === 'RCAAgent') agentColor = 'text-amber-400';
                                    if (log.agent === 'HealingAgent') agentColor = 'text-emerald-400';

                                    const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '';

                                    return (
                                        <div key={idx} className="leading-tight text-slate-300">
                                            <span className="text-slate-500 text-[10px] mr-1.5">[{timeStr}]</span>
                                            <strong className={`${agentColor} mr-1.5`}>[{log.agent}]</strong>
                                            <span>{log.message}</span>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={terminalBottomRef} />
                        </div>

                        <div className="mt-3 pt-2 text-[10px] text-slate-500 font-mono flex justify-between">
                            <span>Active Agents: 4 Autonomous Daemons</span>
                            <span>Daemon Status: Online</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return { OverviewPage };
})();
