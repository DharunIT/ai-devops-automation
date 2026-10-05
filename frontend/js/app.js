/** @jsxRuntime classic */
/**
 * AutoOps AI - Master Application Shell
 * AI-Powered Infrastructure Monitoring, Failure Prediction & Self-Healing Platform
 */

const { useState, useEffect, useRef } = React;

function AutoOpsApp() {
    // Current Active View State
    const [currentView, setCurrentView] = useState('overview');

    // Sidebar Category Accordion State
    const [openCategories, setOpenCategories] = useState({
        infrastructure: true,
        ai_intelligence: true,
        self_healing: true,
        ml_lab: true,
        cicd: true
    });

    // Mobile Sidebar Drawer State
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    // Global Telemetry & Status State
    const [status, setStatus] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [anomalies, setAnomalies] = useState([]);
    const [failures, setFailures] = useState(null);
    const [incidents, setIncidents] = useState([]);
    const [healing, setHealing] = useState(null);
    const [pipeline, setPipeline] = useState(null);
    const [agentLogs, setAgentLogs] = useState([]);
    const [activeAgent, setActiveAgent] = useState('MonitoringAgent');
    const [websites, setWebsites] = useState([]);

    // Connection & Settings State
    const [connected, setConnected] = useState(true);
    const [connectionError, setConnectionError] = useState(null);
    const [simSpeed, setSimSpeed] = useState(1.0);
    const [pollingInterval, setPollingInterval] = useState(2500);

    // Fault Simulation Modal State
    const [faultModalOpen, setFaultModalOpen] = useState(false);
    const [faultModalServer, setFaultModalServer] = useState('Server-01');

    // Notifications State
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    // ==========================================
    // AUTOMATED AI INCIDENT WORKFLOW STATE
    // ==========================================
    const initialStages = [
        { id: 'simulate', title: 'Failure Simulated', subtitle: 'Target Server-01 • Telemetry Spike Injected', model: 'Chaos Injection', status: 'WAITING', details: '' },
        { id: 'anomaly', title: 'Anomaly Detected', subtitle: 'Isolation Forest Outlier Scoring', model: 'Isolation Forest', status: 'WAITING', details: '' },
        { id: 'prediction', title: 'Failure Predicted', subtitle: 'Classification & Probability Scoring', model: 'Random Forest', status: 'WAITING', details: '' },
        { id: 'rca', title: 'Root Cause Identified', subtitle: 'Diagnostic Feature Attribution', model: 'RCA Agent', status: 'WAITING', details: '' },
        { id: 'incident', title: 'Active Incident Created', subtitle: 'State Progression & Alert Dispatch', model: 'Incident Registry', status: 'WAITING', details: '' },
        { id: 'healing', title: 'Healing Action Executed', subtitle: 'Autonomous Orchestration Remediation', model: 'Kubernetes HPA', status: 'WAITING', details: '' },
        { id: 'recovery', title: 'Recovery Verified', subtitle: 'Telemetry Stabilization & Verification', model: 'Health Verifier', status: 'WAITING', details: '' },
        { id: 'history', title: 'Recovery History Updated', subtitle: 'Audit Ledger & Incident Archival', model: 'Recovery Archive', status: 'WAITING', details: '' }
    ];

    const [workflow, setWorkflow] = useState({
        active: false,
        completed: false,
        stageIndex: 0,
        progress: 0,
        timer: 0,
        serverId: 'Server-01',
        faultType: 'cpu_spike',
        error: null,
        failedStage: null,
        incidentId: null,
        notification: null,
        stages: initialStages
    });

    const workflowTimersRef = useRef([]);
    const tickerRef = useRef(null);

    const clearAllWorkflowTimers = () => {
        workflowTimersRef.current.forEach(t => clearTimeout(t));
        workflowTimersRef.current = [];
        if (tickerRef.current) {
            clearInterval(tickerRef.current);
            tickerRef.current = null;
        }
    };

    useEffect(() => {
        return () => clearAllWorkflowTimers();
    }, []);

    // Automated 8-Stage Demonstration Workflow Execution
    const handleStartAutomatedWorkflow = async (targetServer = 'Server-01', fault = 'cpu_spike') => {
        clearAllWorkflowTimers();

        const freshStages = initialStages.map(s => ({ ...s, status: 'WAITING', details: '' }));
        freshStages[0].status = 'RUNNING';

        setWorkflow({
            active: true,
            completed: false,
            stageIndex: 0,
            progress: 5,
            timer: 0.0,
            serverId: targetServer,
            faultType: fault,
            error: null,
            failedStage: null,
            incidentId: null,
            notification: {
                title: 'Infrastructure Anomaly Injected',
                message: `⚠ Failure simulated on ${targetServer}: Critical CPU & latency degradation spike injected.`,
                type: 'warning'
            },
            stages: freshStages
        });

        const startTime = Date.now();
        tickerRef.current = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            setWorkflow(prev => prev.active ? ({ ...prev, timer: Math.min(16.0, elapsed) }) : prev);
        }, 100);

        try {
            // Stage 0: Simulate Failure at t = 0s
            const simRes = await window.AutoOpsAPI.simulation.startWorkflow(targetServer, fault);
            await fetchTelemetry();

            setWorkflow(prev => {
                const s = [...prev.stages];
                s[0] = { ...s[0], status: 'COMPLETED', details: `CPU: ${simRes.metrics.cpu}%, Resp: ${simRes.metrics.resp}ms (Spike Injected)` };
                s[1] = { ...s[1], status: 'RUNNING' };
                return { ...prev, stageIndex: 1, progress: 15, stages: s };
            });

            let currentIncidentId = null;
            let currentHealingLogId = null;
            let currentRcaResult = null;

            // Stage 1: Anomaly Detection (Isolation Forest) at t = 1.8s
            const t1 = setTimeout(async () => {
                try {
                    const anomRes = await window.AutoOpsAPI.simulation.stepWorkflow('anomaly', { server_id: targetServer });
                    await fetchTelemetry();

                    setWorkflow(prev => {
                        const s = [...prev.stages];
                        s[1] = { ...s[1], status: 'COMPLETED', details: `Isolation Score: ${anomRes.anomaly_score} • Contamination: 0.05 • Anomaly Verified` };
                        s[2] = { ...s[2], status: 'RUNNING' };
                        return { ...prev, stageIndex: 2, progress: 28, stages: s };
                    });

                    // Stage 2: Failure Prediction (Random Forest) at t = 3.8s
                    const t2 = setTimeout(async () => {
                        try {
                            const predRes = await window.AutoOpsAPI.simulation.stepWorkflow('prediction', { server_id: targetServer });
                            await fetchTelemetry();

                            setWorkflow(prev => {
                                const s = [...prev.stages];
                                s[2] = { ...s[2], status: 'COMPLETED', details: `Mode: ${predRes.predicted_failure_mode} • Prob: ${predRes.failure_probability}% (${predRes.risk_level})` };
                                s[3] = { ...s[3], status: 'RUNNING' };
                                return { ...prev, stageIndex: 3, progress: 42, stages: s };
                            });

                            // Stage 3: Root Cause Analysis (RCA) at t = 5.8s
                            const t3 = setTimeout(async () => {
                                try {
                                    const rcaRes = await window.AutoOpsAPI.simulation.stepWorkflow('rca', { server_id: targetServer });
                                    currentRcaResult = rcaRes;
                                    await fetchTelemetry();

                                    setWorkflow(prev => {
                                        const s = [...prev.stages];
                                        s[3] = { ...s[3], status: 'COMPLETED', details: `${rcaRes.root_cause} (Confidence: ${rcaRes.confidence}%)` };
                                        s[4] = { ...s[4], status: 'RUNNING' };
                                        return { ...prev, stageIndex: 4, progress: 55, stages: s };
                                    });

                                    // Stage 4: Incident Creation at t = 7.8s
                                    const t4 = setTimeout(async () => {
                                        try {
                                            const incRes = await window.AutoOpsAPI.simulation.stepWorkflow('incident', {
                                                server_id: targetServer,
                                                root_cause: currentRcaResult ? currentRcaResult.root_cause : null
                                            });
                                            currentIncidentId = incRes.incident.id;
                                            await fetchTelemetry();

                                            setWorkflow(prev => {
                                                const s = [...prev.stages];
                                                s[4] = { ...s[4], status: 'COMPLETED', details: `Registered ID: ${incRes.incident.id} [CRITICAL] • State: RCA IDENTIFIED` };
                                                s[5] = { ...s[5], status: 'RUNNING' };
                                                return { ...prev, stageIndex: 5, progress: 70, incidentId: incRes.incident.id, stages: s };
                                            });

                                            // Stage 5: Healing Action at t = 10.5s
                                            const t5 = setTimeout(async () => {
                                                try {
                                                    const healRes = await window.AutoOpsAPI.simulation.stepWorkflow('healing', {
                                                        server_id: targetServer,
                                                        incident_id: currentIncidentId
                                                    });
                                                    currentHealingLogId = healRes.healing_log_id;
                                                    await fetchTelemetry();

                                                    setWorkflow(prev => {
                                                        const s = [...prev.stages];
                                                        s[5] = { ...s[5], status: 'COMPLETED', details: `${healRes.selected_action}: ${healRes.details}` };
                                                        s[6] = { ...s[6], status: 'RUNNING' };
                                                        return { ...prev, stageIndex: 6, progress: 84, stages: s };
                                                    });

                                                    // Stage 6: Recovery Verification at t = 13.5s
                                                    const t6 = setTimeout(async () => {
                                                        try {
                                                            const recRes = await window.AutoOpsAPI.simulation.stepWorkflow('recovery', {
                                                                server_id: targetServer,
                                                                incident_id: currentIncidentId,
                                                                healing_log_id: currentHealingLogId
                                                            });
                                                            await fetchTelemetry();

                                                            setWorkflow(prev => {
                                                                const s = [...prev.stages];
                                                                s[6] = { ...s[6], status: 'COMPLETED', details: `CPU: ${recRes.restored_metrics.cpu}%, Resp: ${recRes.restored_metrics.resp}ms • 0 Anomalies Verified` };
                                                                s[7] = { ...s[7], status: 'RUNNING' };
                                                                return {
                                                                    ...prev,
                                                                    stageIndex: 7,
                                                                    progress: 95,
                                                                    notification: {
                                                                        title: 'Infrastructure Recovered',
                                                                        message: `✓ Incident ${currentIncidentId} recovered on ${targetServer}. Telemetry restored to baseline.`,
                                                                        type: 'success'
                                                                    },
                                                                    stages: s
                                                                };
                                                            });

                                                            // Stage 7: Recovery History Updated at t = 15.5s
                                                            const t7 = setTimeout(async () => {
                                                                if (tickerRef.current) {
                                                                    clearInterval(tickerRef.current);
                                                                    tickerRef.current = null;
                                                                }
                                                                await fetchTelemetry();

                                                                setWorkflow(prev => {
                                                                    const s = [...prev.stages];
                                                                    s[7] = { ...s[7], status: 'COMPLETED', details: `Incident ${currentIncidentId} archived to Incident Log Archive with audit ledger` };
                                                                    return {
                                                                        ...prev,
                                                                        active: false,
                                                                        completed: true,
                                                                        progress: 100,
                                                                        timer: 15.5,
                                                                        stages: s
                                                                    };
                                                                });

                                                                setTimeout(() => {
                                                                    setWorkflow(prev => ({ ...prev, notification: null }));
                                                                }, 5000);

                                                            }, 2000);
                                                            workflowTimersRef.current.push(t7);

                                                        } catch (err6) {
                                                            handleWorkflowError('Recovery Verification', 6, err6);
                                                        }
                                                    }, 3000);
                                                    workflowTimersRef.current.push(t6);

                                                } catch (err5) {
                                                    handleWorkflowError('Healing Action', 5, err5);
                                                }
                                            }, 2700);
                                            workflowTimersRef.current.push(t5);

                                        } catch (err4) {
                                            handleWorkflowError('Incident Creation', 4, err4);
                                        }
                                    }, 2000);
                                    workflowTimersRef.current.push(t4);

                                } catch (err3) {
                                    handleWorkflowError('Root Cause Analysis', 3, err3);
                                }
                            }, 2000);
                            workflowTimersRef.current.push(t3);

                        } catch (err2) {
                            handleWorkflowError('Failure Prediction', 2, err2);
                        }
                    }, 2000);
                    workflowTimersRef.current.push(t2);

                } catch (err1) {
                    handleWorkflowError('Anomaly Detection', 1, err1);
                }
            }, 1800);
            workflowTimersRef.current.push(t1);

        } catch (err0) {
            handleWorkflowError('Simulate Failure', 0, err0);
        }
    };

    const handleWorkflowError = (stageName, stageIdx, err) => {
        clearAllWorkflowTimers();
        console.error(`Workflow failed at stage ${stageName}:`, err);
        setWorkflow(prev => {
            const s = [...prev.stages];
            if (s[stageIdx]) {
                s[stageIdx] = { ...s[stageIdx], status: 'FAILED', details: err.message || 'Execution error' };
            }
            return {
                ...prev,
                active: false,
                error: err.message || 'Stage execution failed',
                failedStage: stageName,
                stages: s
            };
        });
    };

    const handleResetDemo = async () => {
        clearAllWorkflowTimers();
        try {
            await window.AutoOpsAPI.simulation.resetWorkflow();
        } catch (e) {
            console.warn('Reset API warning:', e);
        }
        await fetchTelemetry();
        setWorkflow({
            active: false,
            completed: false,
            stageIndex: 0,
            progress: 0,
            timer: 0,
            serverId: 'Server-01',
            faultType: 'cpu_spike',
            error: null,
            failedStage: null,
            incidentId: null,
            notification: {
                title: 'System Reset',
                message: 'All simulated faults cleared. Telemetry and active incidents restored to baseline normal.',
                type: 'success'
            },
            stages: initialStages.map(s => ({ ...s, status: 'WAITING', details: '' }))
        });

        setTimeout(() => {
            setWorkflow(prev => ({ ...prev, notification: null }));
        }, 4000);
    };

    // Toggle Sidebar Category Accordion
    const toggleCategory = (cat) => {
        setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    // Central Data Polling Function
    const fetchTelemetry = async () => {
        try {
            const [
                statusData,
                metricsData,
                anomaliesData,
                failuresData,
                incidentsData,
                healingData,
                pipelineData,
                agentsData,
                websitesData
            ] = await Promise.all([
                window.AutoOpsAPI.status.get(),
                window.AutoOpsAPI.monitoring.getMetrics(25),
                window.AutoOpsAPI.monitoring.getAnomalies(30),
                window.AutoOpsAPI.models.getFailures(),
                window.AutoOpsAPI.incidents.getAll(),
                window.AutoOpsAPI.selfHealing.get(),
                window.AutoOpsAPI.pipeline.get(),
                window.AutoOpsAPI.agents.get(),
                window.AutoOpsAPI.websites.getAll()
            ]);

            setStatus(statusData);
            setMetrics(metricsData);
            setAnomalies(anomaliesData || []);
            setFailures(failuresData);
            setIncidents(incidentsData || []);
            setHealing(healingData);
            setPipeline(pipelineData);
            setAgentLogs(agentsData.logs || []);
            setActiveAgent(agentsData.active_agent || 'MonitoringAgent');
            setWebsites(websitesData || []);
            setConnected(true);
            setConnectionError(null);

            if (pipelineData && pipelineData.simulation_speed) {
                setSimSpeed(pipelineData.simulation_speed);
            }
        } catch (err) {
            console.warn('Telemetry fetch warning:', err);
            setConnected(false);
            setConnectionError(err.message || 'Backend connection unavailable');
        }
    };

    // Periodic Polling Interval
    useEffect(() => {
        fetchTelemetry();
        const timer = setInterval(fetchTelemetry, pollingInterval);
        return () => clearInterval(timer);
    }, [pollingInterval]);

    // Handle Fault Injection
    const handleInjectFault = async (server, fault) => {
        handleStartAutomatedWorkflow(server, fault);
    };

    // Handle Speed Update
    const handleUpdateSpeed = async (newSpeed) => {
        setSimSpeed(newSpeed);
        try {
            await window.AutoOpsAPI.simulation.setSpeed(newSpeed);
        } catch (e) {
            console.error('Speed update error', e);
        }
    };

    // Handle Manual Incident Resolution
    const handleResolveIncident = async (id) => {
        try {
            await window.AutoOpsAPI.incidents.resolve(id);
            fetchTelemetry();
        } catch (e) {
            alert('Resolution failed: ' + e.message);
        }
    };

    // Handle CI/CD Trigger
    const handleTriggerPipeline = async () => {
        try {
            await window.AutoOpsAPI.pipeline.run();
            fetchTelemetry();
        } catch (e) {
            alert('Pipeline trigger error: ' + e.message);
        }
    };

    // Handle Website Management
    const handleAddWebsite = async (name, url) => {
        await window.AutoOpsAPI.websites.add(name, url);
        fetchTelemetry();
    };

    const handleDeleteWebsite = async (id) => {
        await window.AutoOpsAPI.websites.delete(id);
        fetchTelemetry();
    };

    // Open Fault Modal for specific server
    const openFaultForServer = (sId = 'Server-01') => {
        setFaultModalServer(sId);
        setFaultModalOpen(true);
    };

    // Global Health State
    const hasOpenIncident = incidents.some(i => i.resolution_status !== 'Resolved');
    const isHealthy = !hasOpenIncident && (status ? status.app_status === 'Healthy' : true);

    // Navigation Structure Specification
    const navItems = [
        {
            type: 'single',
            id: 'overview',
            label: 'Overview',
            icon: 'fa-compass'
        },
        {
            type: 'group',
            id: 'infrastructure',
            label: 'Infrastructure',
            icon: 'fa-server',
            children: [
                { id: 'live_monitoring', label: 'Live Monitoring', icon: 'fa-chart-area' },
                { id: 'servers', label: 'Servers', icon: 'fa-network-wired' },
                { id: 'website_monitor', label: 'Website Monitor', icon: 'fa-globe' }
            ]
        },
        {
            type: 'group',
            id: 'ai_intelligence',
            label: 'AI Intelligence',
            icon: 'fa-brain',
            children: [
                { id: 'anomalies', label: 'Anomaly Detection', icon: 'fa-shield-virus' },
                { id: 'failures', label: 'Failure Prediction', icon: 'fa-stethoscope' },
                { id: 'rca', label: 'Root Cause Analysis', icon: 'fa-project-diagram' }
            ]
        },
        {
            type: 'group',
            id: 'self_healing',
            label: 'Self Healing',
            icon: 'fa-heartbeat',
            children: [
                { id: 'active_incidents', label: 'Active Incidents', icon: 'fa-fire' },
                { id: 'healing_actions', label: 'Healing Actions', icon: 'fa-magic' },
                { id: 'recovery_history', label: 'Recovery History', icon: 'fa-history' }
            ]
        },
        {
            type: 'group',
            id: 'ml_lab',
            label: 'ML Lab',
            icon: 'fa-flask',
            children: [
                { id: 'defect_prediction', label: 'Software Defect Prediction', icon: 'fa-bug' },
                { id: 'model_comparison', label: 'Model Comparison', icon: 'fa-balance-scale' },
                { id: 'mlflow_experiments', label: 'MLflow Experiments', icon: 'fa-layer-group' }
            ]
        },
        {
            type: 'group',
            id: 'cicd',
            label: 'CI/CD',
            icon: 'fa-code-branch',
            children: [
                { id: 'pipeline', label: 'Pipeline', icon: 'fa-rocket' }
            ]
        },
        {
            type: 'single',
            id: 'settings',
            label: 'Settings',
            icon: 'fa-sliders-h'
        }
    ];

    // Module status badge helper for college presentation demo
    const getModuleBadge = (moduleId) => {
        if (workflow.active || workflow.completed) {
            if (moduleId === 'live_monitoring') {
                if (workflow.stageIndex >= 6) return { text: '● Recovered', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
                if (workflow.stageIndex >= 0) return { text: '⚠ Elevated', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse' };
                return { text: '● Live', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
            }
            if (moduleId === 'anomalies') {
                if (workflow.stages[1].status === 'RUNNING') return { text: '⚠ Detecting...', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse' };
                if (workflow.stages[1].status === 'COMPLETED') return { text: '⚠ Anomaly', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
            }
            if (moduleId === 'failures') {
                if (workflow.stages[2].status === 'RUNNING') return { text: '🔮 Predicting...', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30 animate-pulse' };
                if (workflow.stages[2].status === 'COMPLETED') return { text: '🔮 Prediction', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
            }
            if (moduleId === 'rca') {
                if (workflow.stages[3].status === 'RUNNING') return { text: '🔍 Analyzing...', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse' };
                if (workflow.stages[3].status === 'COMPLETED') return { text: '🔍 RCA', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
            }
            if (moduleId === 'active_incidents') {
                if (workflow.stages[4].status === 'RUNNING') return { text: '🚨 Registering...', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse' };
                if (workflow.stages[6].status === 'COMPLETED' || workflow.stages[7].status === 'COMPLETED') return { text: '✓ Recovered', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
                if (workflow.stages[4].status === 'COMPLETED') return { text: '🚨 Incident', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse' };
            }
            if (moduleId === 'healing_actions') {
                if (workflow.stages[5].status === 'RUNNING') return { text: '🛠 Healing...', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse' };
                if (workflow.stages[5].status === 'COMPLETED') return { text: '🛠 Healing', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
            }
            if (moduleId === 'recovery_history') {
                if (workflow.stages[7].status === 'RUNNING') return { text: 'Archiving...', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 animate-pulse' };
                if (workflow.stages[7].status === 'COMPLETED') return { text: '✓ Recovered', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
            }
        }

        if (moduleId === 'live_monitoring') {
            return { text: '● Monitoring', color: 'bg-emerald-500/10 text-emerald-400/80 border-emerald-500/20' };
        }
        const hasUnresolved = incidents.some(i => i.resolution_status !== 'Resolved');
        if (hasUnresolved && moduleId === 'active_incidents') {
            return { text: '🚨 Incident', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse' };
        }
        return null;
    };

    // Notification Items
    const unreadNotifications = incidents.filter(i => i.resolution_status !== 'Resolved');

    return (
        <div className="flex h-screen overflow-hidden bg-[#070b13] text-slate-100 font-sans">
            {/* 1. PERSISTENT SIDEBAR NAVIGATION (Desktop & Collapsible Mobile Drawer) */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r border-slate-800/80 flex flex-col justify-between p-4 transition-transform duration-300
                lg:static lg:translate-x-0
                ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="overflow-y-auto">
                    {/* Brand Header */}
                    <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-800 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
                            <i className="fas fa-microchip text-lg" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <h1 className="font-extrabold text-base tracking-wide text-white leading-tight">AUTOOPS AI</h1>
                                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-mono font-bold">PRO</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium tracking-wide">Infrastructure Intelligence</p>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="space-y-1 text-xs">
                        {navItems.map((item) => {
                            if (item.type === 'single') {
                                const isActive = currentView === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setCurrentView(item.id);
                                            setMobileDrawerOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all ${
                                            isActive
                                                ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/10 text-white border-l-2 border-cyan-500 shadow-inner'
                                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                                        }`}
                                    >
                                        <i className={`fas ${item.icon} w-4 text-center ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            }

                            // Group with children
                            const isOpen = openCategories[item.id] !== false;
                            const isGroupActive = item.children.some(c => c.id === currentView);

                            return (
                                <div key={item.id} className="pt-2">
                                    <button
                                        onClick={() => toggleCategory(item.id)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-bold uppercase tracking-wider text-[10px] transition-all ${
                                            isGroupActive ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <i className={`fas ${item.icon} text-xs`} />
                                            {item.label}
                                        </span>
                                        <i className={`fas fa-chevron-down text-[9px] transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
                                    </button>

                                    {isOpen && (
                                        <div className="pl-3 mt-1 space-y-0.5 border-l border-slate-800/80 ml-3">
                                            {item.children.map((child) => {
                                                const isActive = currentView === child.id;
                                                const badge = getModuleBadge(child.id);
                                                return (
                                                    <button
                                                        key={child.id}
                                                        onClick={() => {
                                                            setCurrentView(child.id);
                                                            setMobileDrawerOpen(false);
                                                        }}
                                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs transition-all ${
                                                            isActive
                                                                ? 'bg-cyan-500/15 text-cyan-300 font-semibold border-l-2 border-cyan-400'
                                                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5 truncate">
                                                            <i className={`fas ${child.icon} text-[11px] w-3.5 text-center ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                                                            <span className="truncate">{child.label}</span>
                                                        </div>
                                                        {badge && (
                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border shrink-0 ${badge.color}`}>
                                                                {badge.text}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>

                {/* Sidebar Footer Simulation Control */}
                <div className="pt-3 border-t border-slate-800/80 mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sim Speed</span>
                        <span className="text-xs font-mono text-cyan-400 font-bold">{simSpeed}x</span>
                    </div>
                    <input
                        type="range"
                        min="0.2"
                        max="5.0"
                        step="0.2"
                        value={simSpeed}
                        onChange={(e) => handleUpdateSpeed(e.target.value)}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />

                    <div className="mt-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${isHealthy ? 'bg-emerald-400 glow-pulse-cyan' : 'bg-rose-500 glow-pulse-red'}`} />
                            <span className="text-slate-300 font-semibold text-[11px]">
                                {isHealthy ? 'Cluster Healthy' : 'Incident Active'}
                            </span>
                        </div>
                        <button
                            onClick={() => handleStartAutomatedWorkflow('Server-01', 'cpu_spike')}
                            disabled={workflow.active}
                            className={`p-1 rounded font-bold text-xs transition-colors ${
                                workflow.active ? 'text-amber-400 cursor-wait' : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                            }`}
                            title="Simulate Failure (Automated AI Demo)"
                        >
                            <i className={`fas ${workflow.active ? 'fa-spinner fa-spin' : 'fa-bolt'}`} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Backdrop Overlay */}
            {mobileDrawerOpen && (
                <div
                    onClick={() => setMobileDrawerOpen(false)}
                    className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
                />
            )}

            {/* 2. MAIN APPLICATION WORKSPACE */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* GLOBAL TOP HEADER */}
                <header className="h-16 border-b border-slate-800/80 glass-panel flex items-center justify-between px-4 lg:px-8 z-20 shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
                            className="lg:hidden w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white"
                        >
                            <i className="fas fa-bars" />
                        </button>

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm tracking-wide text-white">AUTOOPS AI</span>
                                <span className="text-slate-600 text-xs hidden sm:inline">&bull;</span>
                                <span className="text-xs text-slate-400 font-medium hidden sm:inline">Infrastructure Intelligence Center</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side Status & Actions */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Global Health Indicator */}
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800">
                            <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500 animate-ping'}`} />
                            <span className={`text-xs font-bold font-mono tracking-tight ${isHealthy ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isHealthy ? 'ALL SYSTEMS OPERATIONAL' : 'INCIDENT DETECTED'}
                            </span>
                        </div>

                        {/* Simulate Failure Quick Action Button (Automated Demo) */}
                        <button
                            id="header-simulate-failure-btn"
                            onClick={() => handleStartAutomatedWorkflow('Server-01', 'cpu_spike')}
                            disabled={workflow.active}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                                workflow.active
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 cursor-wait'
                                    : 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border-rose-500/30 hover:scale-[1.02] shadow-rose-500/10'
                            }`}
                            title="Trigger 8-Stage Automated AI Incident Workflow"
                        >
                            <i className={`fas ${workflow.active ? 'fa-spinner fa-spin' : 'fa-bolt'} text-rose-400`} />
                            <span className="hidden md:inline">{workflow.active ? 'Executing Workflow...' : 'Simulate Failure'}</span>
                        </button>

                        {/* Reset Demo Button */}
                        <button
                            id="header-reset-demo-btn"
                            onClick={handleResetDemo}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
                            title="Reset Infrastructure Telemetry and Workflow state"
                        >
                            <i className="fas fa-undo-alt text-slate-400 text-xs" />
                            <span className="hidden lg:inline">Reset Demo</span>
                        </button>

                        {/* Notifications Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setNotificationsOpen(!notificationsOpen)}
                                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white relative transition-colors"
                            >
                                <i className="fas fa-bell text-xs" />
                                {unreadNotifications.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center animate-bounce">
                                        {unreadNotifications.length}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {notificationsOpen && (
                                <div className="absolute right-0 mt-2 w-80 glass-panel rounded-2xl border border-slate-700 p-4 shadow-2xl z-50 animate-fade-in">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                                        <h4 className="font-bold text-xs text-white">System Notifications</h4>
                                        <span className="text-[10px] text-cyan-400">{unreadNotifications.length} Active</span>
                                    </div>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {unreadNotifications.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic text-center py-3">No active incident alerts.</p>
                                        ) : (
                                            unreadNotifications.map((n) => (
                                                <div key={n.id} className="p-2.5 rounded-xl bg-slate-900/80 border border-rose-500/30 text-xs">
                                                    <div className="flex justify-between items-center text-[10px] mb-1">
                                                        <span className="font-bold text-rose-400">{n.id}</span>
                                                        <span className="text-slate-400">{n.affected_component}</span>
                                                    </div>
                                                    <p className="text-slate-200 text-[11px] leading-tight">{n.root_cause}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Settings button */}
                        <button
                            onClick={() => setCurrentView('settings')}
                            className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                            title="Platform Settings"
                        >
                            <i className="fas fa-cog text-xs" />
                        </button>

                        {/* User Profile Indicator */}
                        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                                SRE
                            </div>
                            <div className="hidden xl:block">
                                <span className="text-xs font-semibold text-white block leading-tight">DevOps Admin</span>
                                <span className="text-[10px] text-emerald-400 block font-mono">Autonomous Mode</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Connection Error Banner */}
                {!connected && (
                    <div className="bg-rose-500/15 border-b border-rose-500/40 px-6 py-2 flex items-center justify-between text-xs text-rose-300">
                        <div className="flex items-center gap-2">
                            <i className="fas fa-exclamation-triangle animate-pulse" />
                            <span>Backend connection disrupted: {connectionError || 'Unable to reach Flask server.'}</span>
                        </div>
                        <button
                            onClick={fetchTelemetry}
                            className="underline font-bold hover:text-white"
                        >
                            Retry Now
                        </button>
                    </div>
                )}

                {/* MAIN CONTENT ROUTER */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    {/* Persistent Mini Workflow Banner for non-overview pages during demo */}
                    {currentView !== 'overview' && (workflow.active || workflow.completed) && (
                        <div className="mb-6">
                            <window.AutoOpsComponents.AutomatedWorkflowPanel
                                workflow={workflow}
                                onReset={handleResetDemo}
                                onRetry={() => handleStartAutomatedWorkflow('Server-01', 'cpu_spike')}
                            />
                        </div>
                    )}

                    {/* 1. Overview */}
                    {currentView === 'overview' && (
                        <window.AutoOpsOverview.OverviewPage
                            status={status}
                            metrics={metrics}
                            failures={failures}
                            incidents={incidents}
                            agentLogs={agentLogs}
                            activeAgent={activeAgent}
                            workflow={workflow}
                            onStartWorkflow={handleStartAutomatedWorkflow}
                            onResetWorkflow={handleResetDemo}
                            onRetryWorkflow={() => handleStartAutomatedWorkflow('Server-01', 'cpu_spike')}
                            onNavigate={(viewId) => setCurrentView(viewId)}
                            onOpenFaultModal={() => openFaultForServer('Server-01')}
                            onResolveIncident={handleResolveIncident}
                            onTriggerPipeline={handleTriggerPipeline}
                        />
                    )}

                    {/* 2. Infrastructure: Live Monitoring */}
                    {currentView === 'live_monitoring' && (
                        <window.AutoOpsInfrastructure.LiveMonitoringView
                            metrics={metrics}
                            onOpenFaultModal={() => openFaultForServer('Server-01')}
                        />
                    )}

                    {/* 2. Infrastructure: Servers */}
                    {currentView === 'servers' && (
                        <window.AutoOpsInfrastructure.ServersView
                            metrics={metrics}
                            k8sPods={healing ? healing.k8s_pods : []}
                            onOpenFaultModal={openFaultForServer}
                        />
                    )}

                    {/* 2. Infrastructure: Website Monitor */}
                    {currentView === 'website_monitor' && (
                        <window.AutoOpsInfrastructure.WebsiteMonitorView
                            websites={websites}
                            onAddWebsite={handleAddWebsite}
                            onDeleteWebsite={handleDeleteWebsite}
                            metrics={metrics}
                        />
                    )}

                    {/* 3. AI Intelligence: Anomaly Detection */}
                    {currentView === 'anomalies' && (
                        <window.AutoOpsAIIntelligence.AnomalyDetectionView
                            anomalies={anomalies}
                            metrics={metrics}
                            status={status}
                            onOpenFaultModal={() => openFaultForServer('Server-01')}
                        />
                    )}

                    {/* 3. AI Intelligence: Failure Prediction */}
                    {currentView === 'failures' && (
                        <window.AutoOpsAIIntelligence.FailurePredictionView
                            failures={failures}
                            onOpenFaultModal={() => openFaultForServer('Server-01')}
                        />
                    )}

                    {/* 3. AI Intelligence: Root Cause Analysis */}
                    {currentView === 'rca' && (
                        <window.AutoOpsAIIntelligence.RootCauseAnalysisView
                            failures={failures}
                            incidents={incidents}
                            agentLogs={agentLogs}
                        />
                    )}

                    {/* 4. Self Healing: Active Incidents */}
                    {currentView === 'active_incidents' && (
                        <window.AutoOpsSelfHealing.ActiveIncidentsView
                            incidents={incidents}
                            onResolveIncident={handleResolveIncident}
                            onOpenFaultModal={() => openFaultForServer('Server-01')}
                        />
                    )}

                    {/* 4. Self Healing: Healing Actions */}
                    {currentView === 'healing_actions' && (
                        <window.AutoOpsSelfHealing.HealingActionsView
                            healing={healing}
                            agentLogs={agentLogs}
                        />
                    )}

                    {/* 4. Self Healing: Recovery History */}
                    {currentView === 'recovery_history' && (
                        <window.AutoOpsSelfHealing.RecoveryHistoryView
                            incidents={incidents}
                            healing={healing}
                        />
                    )}

                    {/* 5. ML Lab: Software Defect Prediction */}
                    {currentView === 'defect_prediction' && (
                        <window.AutoOpsMLLab.SoftwareDefectPredictionView
                            onNavigate={(viewId) => setCurrentView(viewId)}
                        />
                    )}

                    {/* 5. ML Lab: Model Comparison */}
                    {currentView === 'model_comparison' && (
                        <window.AutoOpsMLLab.ModelComparisonView />
                    )}

                    {/* 5. ML Lab: MLflow Experiments */}
                    {currentView === 'mlflow_experiments' && (
                        <window.AutoOpsMLLab.MLflowExperimentsView />
                    )}

                    {/* 6. CI/CD: Pipeline */}
                    {currentView === 'pipeline' && (
                        <window.AutoOpsCICD.CICDPipelineView
                            pipeline={pipeline}
                            onTriggerPipeline={handleTriggerPipeline}
                        />
                    )}

                    {/* 7. Settings & Presentation Mode */}
                    {currentView === 'settings' && (
                        <window.AutoOpsSettings.SettingsView
                            simSpeed={simSpeed}
                            onUpdateSpeed={handleUpdateSpeed}
                            pollingInterval={pollingInterval}
                            onUpdatePolling={setPollingInterval}
                            onNavigate={(viewId) => setCurrentView(viewId)}
                            onOpenFaultModal={openFaultForServer}
                        />
                    )}
                </main>
            </div>

            {/* GLOBAL FAULT SIMULATION MODAL */}
            <window.AutoOpsComponents.FaultModal
                isOpen={faultModalOpen}
                onClose={() => setFaultModalOpen(false)}
                onInject={handleInjectFault}
                defaultServer={faultModalServer}
            />

            {/* TOAST NOTIFICATION POPUP */}
            {workflow.notification && (
                <window.AutoOpsComponents.ToastNotification
                    title={workflow.notification.title}
                    message={workflow.notification.message}
                    type={workflow.notification.type}
                    onClose={() => setWorkflow(prev => ({ ...prev, notification: null }))}
                />
            )}
        </div>
    );
}

// Mount AutoOps AI React Application
ReactDOM.render(<AutoOpsApp />, document.getElementById('root'));
