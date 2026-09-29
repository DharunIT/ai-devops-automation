/** @jsxRuntime classic */
/**
 * AutoOps AI - CI/CD Section Pages:
 * CI/CD Pipeline
 */

window.AutoOpsCICD = (() => {
    const { StatusBadge, PipelineStep, LoadingState } = window.AutoOpsComponents;

    function CICDPipelineView({ pipeline, onTriggerPipeline }) {
        if (!pipeline) {
            return <LoadingState message="Connecting to CI/CD orchestrator..." />;
        }

        const stages = pipeline.stages || {};
        const isRunning = pipeline.status === 'Running';
        const progress = pipeline.progress || 0;

        const stagesList = [
            { key: 'developer', name: 'SOURCE', icon: 'fa-code', status: stages.developer || 'Success' },
            { key: 'build', name: 'BUILD', icon: 'fa-cubes', status: stages.build || 'Success' },
            { key: 'test', name: 'TEST', icon: 'fa-vial', status: stages.test || 'Success' },
            { key: 'docker', name: 'MODEL VALIDATION', icon: 'fa-brain', status: stages.docker || 'Success' },
            { key: 'k8s', name: 'DEPLOY', icon: 'fa-network-wired', status: stages.k8s || 'Success' },
            { key: 'prod', name: 'MONITOR', icon: 'fa-heartbeat', status: stages.prod || 'Success' }
        ];

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Automated CI/CD Delivery Pipeline</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Continuous integration, automated model artifact verification, and zero-downtime cluster rollout</p>
                    </div>

                    <div className="flex items-center gap-3 self-start">
                        <StatusBadge status={pipeline.status} size="sm" />
                        <button
                            onClick={onTriggerPipeline}
                            disabled={isRunning}
                            className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 ${
                                isRunning
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white shadow-lg shadow-cyan-500/20'
                            }`}
                        >
                            {isRunning ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-rocket" />}
                            {isRunning ? 'Pipeline Executing...' : 'Trigger Pipeline Run'}
                        </button>
                    </div>
                </div>

                {/* Progress Bar (Visible when running) */}
                {isRunning && (
                    <div className="glass-panel p-4 rounded-xl border border-amber-500/40 bg-amber-500/5 animate-pulse">
                        <div className="flex justify-between text-xs mb-1.5 font-mono">
                            <span className="text-amber-300 font-bold flex items-center gap-2">
                                <i className="fas fa-cog fa-spin" />
                                Active Stage: {pipeline.active_stage ? pipeline.active_stage.toUpperCase() : 'INITIALIZING'}
                            </span>
                            <span className="text-white font-bold">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-amber-500 to-cyan-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}

                {/* Visual Pipeline Flow */}
                <div className="glass-panel p-8 rounded-3xl border border-slate-800/80">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                        {stagesList.map((st, idx) => (
                            <PipelineStep
                                key={st.key}
                                name={st.name}
                                icon={st.icon}
                                status={st.status}
                                isCurrent={pipeline.active_stage === st.key}
                                isLast={idx === stagesList.length - 1}
                            />
                        ))}
                    </div>
                </div>

                {/* Pipeline Execution Details & Simulation Logs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
                        <h3 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
                            <i className="fas fa-shield-alt text-cyan-400" />
                            Model Validation & Automated Quality Gate
                        </h3>
                        <div className="space-y-3 text-xs">
                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                                <div>
                                    <span className="font-semibold text-white block">Isolation Forest Health Check</span>
                                    <span className="text-[11px] text-slate-400">Continuous anomaly scoring gate</span>
                                </div>
                                <StatusBadge status="Passed" size="xs" />
                            </div>
                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                                <div>
                                    <span className="font-semibold text-white block">Random Forest Failure Predictor</span>
                                    <span className="text-[11px] text-slate-400">Accuracy &gt; 98.0% requirement</span>
                                </div>
                                <StatusBadge status="Passed (100.0%)" size="xs" />
                            </div>
                            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                                <div>
                                    <span className="font-semibold text-white block">Software Defect Threshold Gate</span>
                                    <span className="text-[11px] text-slate-400">Zero unhandled static analysis warnings</span>
                                </div>
                                <StatusBadge status="Passed" size="xs" />
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
                        <div>
                            <h3 className="font-semibold text-sm text-white mb-3 flex items-center gap-2">
                                <i className="fas fa-terminal text-cyan-400" />
                                Deployment Terminal Console
                            </h3>
                            <div className="terminal-screen p-3 rounded-xl h-44 overflow-y-auto font-mono text-[11px] space-y-1.5 border border-slate-800">
                                <div className="text-slate-400">[CI/CD] Git Webhook verified: commit ref main#9a4df2c</div>
                                <div className="text-cyan-400">[BUILD] Container layers compiled via BuildKit. Image: autoops/core:latest</div>
                                <div className="text-purple-400">[TEST] 48 integration tests passed with 0 regressions.</div>
                                <div className="text-amber-400">[ML-GATE] Model artifact validated against hold-out test set.</div>
                                <div className="text-emerald-400">[DEPLOY] Rolling update applied to cluster nodes. Zero downtime confirmed.</div>
                                {isRunning && (
                                    <div className="text-cyan-300 animate-pulse font-bold">
                                        &gt; Executing live deployment step: {pipeline.active_stage}...
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-3 pt-2 text-[10px] text-slate-500 font-mono flex justify-between border-t border-slate-800">
                            <span>Last Execution: {pipeline.last_run ? new Date(pipeline.last_run).toLocaleTimeString() : 'Recent'}</span>
                            <span>Target: Cluster Simulation</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return { CICDPipelineView };
})();
