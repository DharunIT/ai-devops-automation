/** @jsxRuntime classic */
/**
 * AutoOps AI - Settings & Presentation Mode
 */

window.AutoOpsSettings = (() => {
    const { StatusBadge } = window.AutoOpsComponents;

    function SettingsView({
        simSpeed,
        onUpdateSpeed,
        pollingInterval,
        onUpdatePolling,
        onNavigate,
        onOpenFaultModal
    }) {
        const [activeStep, setActiveStep] = React.useState(1);

        const presentationSteps = [
            {
                step: 1,
                title: 'Open Overview & Baseline Health',
                desc: 'Present the Command Center showing all 6 key telemetry cards (Status, CPU, Memory, Disk, Network, Latency) operating at healthy baselines.',
                actionText: 'Go to Overview',
                action: () => onNavigate('overview')
            },
            {
                step: 2,
                title: 'Simulate Infrastructure Fault',
                desc: 'Click "Simulate Failure" and inject a CPU Spike or Memory Leak on Server-01 to demonstrate real-time telemetry degradation.',
                actionText: 'Inject CPU Spike',
                action: () => onOpenFaultModal && onOpenFaultModal('Server-01')
            },
            {
                step: 3,
                title: 'Inspect Unsupervised Anomaly Detection',
                desc: 'Navigate to AI Intelligence -> Anomaly Detection. Observe how the Isolation Forest algorithm calculates outlier scores from multidimensional telemetry.',
                actionText: 'View Anomaly Detection',
                action: () => onNavigate('anomalies')
            },
            {
                step: 4,
                title: 'Examine Failure Prediction & RCA',
                desc: 'Navigate to Failure Prediction & Root Cause Analysis. Show how Random Forest classifies CPU Saturation and correlates observed metrics with recommended actions.',
                actionText: 'View RCA Pipeline',
                action: () => onNavigate('rca')
            },
            {
                step: 5,
                title: 'Watch Automated Self-Healing & Recovery',
                desc: 'Open Self-Healing -> Active Incidents. Watch the autonomous lifecycle progress: DETECTED -> ANALYZING -> RCA IDENTIFIED -> HEALING -> RECOVERED.',
                actionText: 'View Self-Healing',
                action: () => onNavigate('active_incidents')
            },
            {
                step: 6,
                title: 'Explore ML Lab: Software Defect Prediction',
                desc: 'Showcase the distinct Software Defect Prediction module. Compare Random Forest vs XGBoost on 60,000 code samples, and test pull request metrics on the playground.',
                actionText: 'Open Defect Lab',
                action: () => onNavigate('defect_prediction')
            },
            {
                step: 7,
                title: 'MLflow Experiment Tracking',
                desc: 'Open MLflow Experiments to demonstrate enterprise model lifecycle tracking with SQLite backend store and logged metrics/artifacts.',
                actionText: 'View MLflow Runs',
                action: () => onNavigate('mlflow_experiments')
            },
            {
                step: 8,
                title: 'Return to Operational Baseline',
                desc: 'Return to the Overview dashboard showing all systems stabilized and recovered by the autonomous agent loop.',
                actionText: 'Return to Overview',
                action: () => onNavigate('overview')
            }
        ];

        return (
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Platform Settings & Presentation Mode</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Presentation walk-through guide, simulation configuration, and environment metadata</p>
                </div>

                {/* Presentation Walkthrough Card */}
                <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                            DEMONSTRATION GUIDE
                        </span>
                        <span className="text-slate-500 text-xs">&bull;</span>
                        <span className="text-xs text-slate-400">Step-by-step viva & demo flow</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Guided Project Presentation Mode</h3>
                    <p className="text-xs text-slate-300 max-w-2xl mb-6 leading-relaxed">
                        Use this interactive 8-step sequence to demonstrate the complete AutoOps AI story to professors, reviewers, and team members.
                    </p>

                    <div className="space-y-3">
                        {presentationSteps.map((s) => (
                            <div
                                key={s.step}
                                className={`p-4 rounded-xl border transition-all ${
                                    activeStep === s.step
                                        ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                                }`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                            activeStep === s.step ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                            {s.step}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-white">{s.title}</h4>
                                            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{s.desc}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                        <button
                                            onClick={() => {
                                                setActiveStep(s.step);
                                                s.action();
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-all flex items-center gap-1.5"
                                        >
                                            <span>{s.actionText}</span>
                                            <i className="fas fa-arrow-right text-[10px]" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Simulation & Telemetry Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
                        <h3 className="font-semibold text-sm text-white mb-1 flex items-center gap-2">
                            <i className="fas fa-tachometer-alt text-cyan-400" />
                            Simulation Acceleration
                        </h3>
                        <p className="text-xs text-slate-400 mb-4">Adjust the internal tick frequency of the backend simulation loop:</p>

                        <div className="space-y-3">
                            <div className="flex justify-between items-baseline text-xs font-mono">
                                <span className="text-slate-400">Current Speed:</span>
                                <span className="text-cyan-400 font-bold text-sm">{simSpeed}x</span>
                            </div>
                            <input
                                type="range"
                                min="0.2"
                                max="5.0"
                                step="0.2"
                                value={simSpeed}
                                onChange={(e) => onUpdateSpeed(e.target.value)}
                                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />
                            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                                <span>0.2x (Slow & Detailed)</span>
                                <span>1.0x (Default)</span>
                                <span>5.0x (Rapid Recovery)</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
                        <h3 className="font-semibold text-sm text-white mb-1 flex items-center gap-2">
                            <i className="fas fa-sync text-purple-400" />
                            Dashboard Polling Interval
                        </h3>
                        <p className="text-xs text-slate-400 mb-4">Set background telemetry synchronization frequency:</p>

                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Fast (2s)', val: 2000 },
                                { label: 'Normal (3s)', val: 3000 },
                                { label: 'Relaxed (5s)', val: 5000 }
                            ].map((opt) => (
                                <button
                                    key={opt.val}
                                    onClick={() => onUpdatePolling(opt.val)}
                                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                                        pollingInterval === opt.val
                                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Architecture & Disclaimer */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 bg-slate-900/40">
                    <h3 className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <i className="fas fa-info-circle text-cyan-400" />
                        Simulation Environment Notice
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        This platform operates with simulated infrastructure nodes, Docker microservices, and Kubernetes orchestration state machines in parallel with genuine machine learning models (scikit-learn Isolation Forest, Random Forest classifiers, XGBoost) and MLflow tracking. It accurately models autonomous SRE failure detection and remediation workflows.
                    </p>
                </div>
            </div>
        );
    }

    return { SettingsView };
})();
