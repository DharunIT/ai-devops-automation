/** @jsxRuntime classic */
/**
 * AutoOps AI - Infrastructure Section Pages:
 * 1. Live Monitoring
 * 2. Servers
 * 3. Website Monitor
 */

window.AutoOpsInfrastructure = (() => {
    const { StatusBadge, ServerCard, ChartCard, EmptyState, LoadingState } = window.AutoOpsComponents;

    // 1. Live Monitoring Page
    function LiveMonitoringView({ metrics, onOpenFaultModal }) {
        const cpuChartRef = React.useRef(null);
        const memChartRef = React.useRef(null);
        const netChartRef = React.useRef(null);

        const cpuInst = React.useRef(null);
        const memInst = React.useRef(null);
        const netInst = React.useRef(null);

        React.useEffect(() => {
            if (!metrics || !metrics.historical) return;

            const servers = Object.keys(metrics.historical);
            if (servers.length === 0 || !metrics.historical[servers[0]]) return;

            const labels = metrics.historical[servers[0]].map(h => {
                const d = new Date(h.timestamp);
                return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            });

            const serverColors = {
                'Server-01': '#06b6d4',
                'Server-02': '#a855f7',
                'Server-03': '#10b981'
            };

            // CPU Chart
            if (cpuChartRef.current) {
                if (cpuInst.current) cpuInst.current.destroy();
                cpuInst.current = new Chart(cpuChartRef.current.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels,
                        datasets: servers.map(s => ({
                            label: s,
                            data: metrics.historical[s].map(r => r.cpu_usage),
                            borderColor: serverColors[s] || '#38bdf8',
                            tension: 0.3,
                            borderWidth: 2,
                            pointRadius: 1
                        }))
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.03)' } },
                            y: { min: 0, max: 100, ticks: { color: '#94a3b8', font: { size: 10 }, callback: v => `${v}%` }, grid: { color: 'rgba(255,255,255,0.03)' } }
                        },
                        plugins: { legend: { labels: { color: '#f8fafc', font: { size: 11 } } } }
                    }
                });
            }

            // Memory Chart
            if (memChartRef.current) {
                if (memInst.current) memInst.current.destroy();
                memInst.current = new Chart(memChartRef.current.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels,
                        datasets: servers.map(s => ({
                            label: s,
                            data: metrics.historical[s].map(r => r.memory_usage),
                            borderColor: serverColors[s] || '#a855f7',
                            tension: 0.3,
                            borderWidth: 2,
                            pointRadius: 1
                        }))
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.03)' } },
                            y: { min: 0, max: 100, ticks: { color: '#94a3b8', font: { size: 10 }, callback: v => `${v}%` }, grid: { color: 'rgba(255,255,255,0.03)' } }
                        },
                        plugins: { legend: { labels: { color: '#f8fafc', font: { size: 11 } } } }
                    }
                });
            }

            // Network Chart
            if (netChartRef.current) {
                if (netInst.current) netInst.current.destroy();
                netInst.current = new Chart(netChartRef.current.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels,
                        datasets: servers.map(s => ({
                            label: s,
                            data: metrics.historical[s].map(r => r.network_traffic),
                            borderColor: serverColors[s] || '#10b981',
                            tension: 0.3,
                            borderWidth: 2,
                            pointRadius: 1
                        }))
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.03)' } },
                            y: { ticks: { color: '#94a3b8', font: { size: 10 }, callback: v => `${v}MB/s` }, grid: { color: 'rgba(255,255,255,0.03)' } }
                        },
                        plugins: { legend: { labels: { color: '#f8fafc', font: { size: 11 } } } }
                    }
                });
            }
        }, [metrics]);

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Live Telemetry & Infrastructure Monitoring</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Real-time resource metrics across virtual nodes and network gateways</p>
                    </div>
                    <button
                        onClick={() => onOpenFaultModal && onOpenFaultModal()}
                        className="px-3.5 py-2 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/25 transition-all flex items-center gap-2 self-start"
                    >
                        <i className="fas fa-bolt" />
                        Simulate Failure
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="CPU Utilization (%)" subtitle="Per-node processor consumption over time" icon="fa-microchip">
                        <div className="h-60 w-full">
                            <canvas ref={cpuChartRef} />
                        </div>
                    </ChartCard>

                    <ChartCard title="Memory Usage (%)" subtitle="Active RAM heap allocated across clusters" icon="fa-memory">
                        <div className="h-60 w-full">
                            <canvas ref={memChartRef} />
                        </div>
                    </ChartCard>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <ChartCard title="Network Ingress / Egress Traffic (MB/s)" subtitle="Bandwidth throughput across cluster interfaces" icon="fa-network-wired">
                        <div className="h-56 w-full">
                            <canvas ref={netChartRef} />
                        </div>
                    </ChartCard>
                </div>
            </div>
        );
    }

    // 2. Servers Page
    function ServersView({ metrics, k8sPods = [], onOpenFaultModal }) {
        if (!metrics || !metrics.current) {
            return <LoadingState message="Loading server topology..." />;
        }

        const servers = Object.entries(metrics.current);

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Infrastructure Server Nodes</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Hardware resource telemetry, container health, and Kubernetes pod placements</p>
                    </div>
                    <button
                        onClick={() => onOpenFaultModal && onOpenFaultModal()}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 text-white font-semibold text-xs flex items-center gap-2 self-start shadow-lg shadow-rose-500/20"
                    >
                        <i className="fas fa-bolt" />
                        Inject Node Fault
                    </button>
                </div>

                {/* Server Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {servers.map(([sName, sMetrics]) => {
                        const pods = k8sPods.filter(p => p.server === sName);
                        const containers = (metrics.containers && metrics.containers[sName]) || [];

                        return (
                            <ServerCard
                                key={sName}
                                serverId={sName}
                                metrics={sMetrics}
                                pods={pods}
                                containers={containers}
                                onInjectFault={(sId) => onOpenFaultModal && onOpenFaultModal(sId)}
                            />
                        );
                    })}
                </div>

                {/* Pods and Containers Detailed Table */}
                <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
                    <h3 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
                        <i className="fas fa-cubes text-cyan-400" />
                        Kubernetes Pod Inventory & Allocation
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                                    <th className="py-2.5 px-3">Pod Identifier</th>
                                    <th className="py-2.5 px-3">Assigned Node</th>
                                    <th className="py-2.5 px-3">Health Status</th>
                                    <th className="py-2.5 px-3">Restarts</th>
                                    <th className="py-2.5 px-3">Age</th>
                                    <th className="py-2.5 px-3">CPU / Memory</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                {k8sPods.map((pod, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="py-2.5 px-3 text-white font-semibold flex items-center gap-2">
                                            <i className="fas fa-circle-notch text-cyan-500 text-[10px]" />
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
            </div>
        );
    }

    // 3. Website Monitor Page
    function WebsiteMonitorView({ websites, onAddWebsite, onDeleteWebsite, metrics }) {
        const [name, setName] = React.useState('');
        const [url, setUrl] = React.useState('');
        const [submitting, setSubmitting] = React.useState(false);
        const [error, setError] = React.useState('');

        const handleAdd = async (e) => {
            e.preventDefault();
            if (!name.trim() || !url.trim()) return;
            setError('');
            setSubmitting(true);
            try {
                await onAddWebsite(name.trim(), url.trim());
                setName('');
                setUrl('');
            } catch (err) {
                setError(err.message || 'Failed to add website monitor');
            } finally {
                setSubmitting(false);
            }
        };

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">External Website & Endpoint Monitor</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Real-time HTTP health check, latency benchmarking, and uptime tracking</p>
                    </div>
                    <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700">
                        <strong>{websites.length}</strong> Endpoints Monitored
                    </span>
                </div>

                {/* Add Website Form */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
                    <h3 className="font-semibold text-sm text-white mb-1 flex items-center gap-2">
                        <i className="fas fa-plus-circle text-cyan-400" />
                        Add New Website Endpoint
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">The backend simulation thread pings this endpoint in parallel via HTTP.</p>

                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Website Name</label>
                            <input
                                type="text"
                                placeholder="e.g. BookMyShow"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Target URL</label>
                            <input
                                type="text"
                                placeholder="https://www.bookmyshow.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                                required
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                            >
                                {submitting ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-plus" />}
                                Start Monitoring
                            </button>
                        </div>
                    </form>
                </div>

                {/* Monitored Websites Table */}
                <div className="glass-panel rounded-2xl p-5 border border-slate-800/80">
                    <h3 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
                        <i className="fas fa-globe text-cyan-400" />
                        Monitored Endpoint Status
                    </h3>

                    {websites.length === 0 ? (
                        <EmptyState
                            icon="fa-globe"
                            title="No websites configured"
                            description="Add an external URL above (e.g. BookMyShow, GitHub) to begin real HTTP latency and uptime tracking."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                                        <th className="py-2.5 px-3">Service Name</th>
                                        <th className="py-2.5 px-3">Target URL</th>
                                        <th className="py-2.5 px-3">Health Status</th>
                                        <th className="py-2.5 px-3">Response Latency</th>
                                        <th className="py-2.5 px-3">Added Date</th>
                                        <th className="py-2.5 px-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                    {websites.map((web) => {
                                        const sKey = `Web-${web.name}`;
                                        const sMetrics = (metrics && metrics.current && metrics.current[sKey]) || {};
                                        const latency = sMetrics.resp !== undefined ? sMetrics.resp.toFixed(0) : '--';
                                        const isHealthy = sMetrics.status === 'Healthy';

                                        return (
                                            <tr key={web.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="py-3 px-3 text-white font-semibold flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-400' : 'bg-rose-400 animate-ping'}`} />
                                                    {web.name}
                                                </td>
                                                <td className="py-3 px-3 text-slate-300">
                                                    <a href={web.url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
                                                        {web.url}
                                                    </a>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <StatusBadge status={isHealthy ? '200 OK' : 'Degraded'} size="xs" />
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className={`font-bold ${Number(latency) > 800 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                        {latency} ms
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-slate-400">
                                                    {web.added_at ? new Date(web.added_at).toLocaleDateString() : 'Active'}
                                                </td>
                                                <td className="py-3 px-3 text-right">
                                                    <button
                                                        onClick={() => onDeleteWebsite(web.id)}
                                                        className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] transition-all"
                                                        title="Delete monitor"
                                                    >
                                                        <i className="fas fa-trash-alt" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return {
        LiveMonitoringView,
        ServersView,
        WebsiteMonitorView
    };
})();
