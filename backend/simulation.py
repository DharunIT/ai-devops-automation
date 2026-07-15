import time
import random
import threading
from datetime import datetime
from backend.database import db, MetricRecord, Incident, SelfHealingLog
from backend.models import MLManager

class DevOpsSimulator:
    def __init__(self):
        self.lock = threading.Lock()
        self.running = False
        self.thread = None
        self.simulation_speed = 1.0 # Ticks every 2 seconds
        
        # Server metrics states
        self.servers = {
            "Server-01": {"cpu": 35.0, "mem": 45.0, "disk": 40.0, "net": 12.0, "resp": 90.0, "status": "Healthy"},
            "Server-02": {"cpu": 28.0, "mem": 52.0, "disk": 48.0, "net": 15.0, "resp": 110.0, "status": "Healthy"},
            "Server-03": {"cpu": 42.0, "mem": 38.0, "disk": 32.0, "net": 10.0, "resp": 80.0, "status": "Healthy"}
        }
        
        # Active containers simulation
        self.containers = {
            "Server-01": [
                {"id": "c-01a", "name": "web-app-gateway", "status": "Running", "cpu": 5.0, "mem": 120},
                {"id": "c-01b", "name": "auth-service", "status": "Running", "cpu": 2.0, "mem": 80}
            ],
            "Server-02": [
                {"id": "c-02a", "name": "payment-api", "status": "Running", "cpu": 8.0, "mem": 250},
                {"id": "c-02b", "name": "notification-service", "status": "Running", "cpu": 1.0, "mem": 60}
            ],
            "Server-03": [
                {"id": "c-03a", "name": "db-primary", "status": "Running", "cpu": 12.0, "mem": 800},
                {"id": "c-03b", "name": "cache-redis", "status": "Running", "cpu": 4.0, "mem": 150}
            ]
        }
        
        # Kubernetes Pod simulation
        self.k8s_pods = [
            {"name": "frontend-pod-1", "server": "Server-01", "status": "Running", "restarts": 0, "age": "12d", "cpu": "1.2%", "mem": "128Mi"},
            {"name": "frontend-pod-2", "server": "Server-02", "status": "Running", "restarts": 0, "age": "12d", "cpu": "1.5%", "mem": "135Mi"},
            {"name": "auth-pod-1", "server": "Server-01", "status": "Running", "restarts": 2, "age": "5d", "cpu": "0.8%", "mem": "90Mi"},
            {"name": "api-pod-1", "server": "Server-02", "status": "Running", "restarts": 0, "age": "12d", "cpu": "3.1%", "mem": "210Mi"},
            {"name": "api-pod-2", "server": "Server-03", "status": "Running", "restarts": 1, "age": "8d", "cpu": "2.9%", "mem": "195Mi"},
            {"name": "db-pod-0", "server": "Server-03", "status": "Running", "restarts": 0, "age": "24d", "cpu": "5.4%", "mem": "820Mi"}
        ]
        
        # CI/CD Pipeline simulation
        self.pipeline = {
            "status": "Idle", # Idle, Running, Failed, Success
            "active_stage": None, # developer, github, build, test, docker, k8s, prod
            "stages": {
                "developer": "Success",
                "github": "Success",
                "build": "Success",
                "test": "Success",
                "docker": "Success",
                "k8s": "Success",
                "prod": "Success"
            },
            "last_run": None,
            "progress": 0
        }
        
        # Injected fault status
        self.injected_faults = {} # server_id -> fault_type
        
        # Agent status & Logs
        self.agent_logs = []
        self.active_agent = "MonitoringAgent" # 'MonitoringAgent', 'AnalysisAgent', 'RCAAgent', 'HealingAgent'

        
        # Active incident currently being healed
        self.current_healing_incident = None
        self.healing_step = 0
        self.healing_timer = 0
        
        # App context references (for db operations)
        self.app = None

    def set_app(self, app):
        self.app = app

    def start(self):
        with self.lock:
            if not self.running:
                self.running = True
                self.thread = threading.Thread(target=self._loop, daemon=True)
                self.thread.start()
                self.log_agent("MonitoringAgent", "Infrastructure Monitoring Agent initialized. Scanning telemetry...")

    def stop(self):
        with self.lock:
            self.running = False

    def log_agent(self, agent_name, message):
        timestamp = datetime.utcnow().isoformat()
        log_entry = {
            "timestamp": timestamp,
            "agent": agent_name,
            "message": message
        }
        self.agent_logs.append(log_entry)
        if len(self.agent_logs) > 100:
            self.agent_logs.pop(0)

    def inject_fault(self, server_id, fault_type):
        """
        Injects a failure mode:
        - cpu_spike: CPU hits 95-100%
        - memory_leak: Memory usage climbs to 98%
        - disk_full: Disk usage hits 99%
        - network_bottleneck: Net Traffic to 110MB/s, response time to 2000ms
        - k8s_pod_crash: App pod goes down, HTTP 500 response time spikes
        """
        with self.lock:
            if server_id in self.servers:
                self.injected_faults[server_id] = fault_type
                self.servers[server_id]["status"] = "Degraded"
                self.log_agent("MonitoringAgent", f"CRITICAL: User injected manual fault '{fault_type}' on {server_id}.")
                return True
        return False

    def trigger_pipeline(self):
        with self.lock:
            if self.pipeline["status"] == "Running":
                return False
            self.pipeline["status"] = "Running"
            self.pipeline["active_stage"] = "developer"
            self.pipeline["progress"] = 0
            for stage in self.pipeline["stages"]:
                self.pipeline["stages"][stage] = "Pending"
            self.pipeline["stages"]["developer"] = "Running"
            self.pipeline["last_run"] = datetime.utcnow().isoformat()
            self.log_agent("SelfHealingAgent", "Triggering pipeline redeployment from CI/CD pipeline manager.")
            return True

    def _update_pipeline(self):
        if self.pipeline["status"] != "Running":
            return
            
        stages_order = ["developer", "github", "build", "test", "docker", "k8s", "prod"]
        current_idx = stages_order.index(self.pipeline["active_stage"])
        
        self.pipeline["progress"] += 15 # Speed of progress
        
        if self.pipeline["progress"] >= 100:
            # Mark current stage as success
            self.pipeline["stages"][self.pipeline["active_stage"]] = "Success"
            self.pipeline["progress"] = 0
            
            if current_idx + 1 < len(stages_order):
                # Move to next stage
                next_stage = stages_order[current_idx + 1]
                self.pipeline["active_stage"] = next_stage
                self.pipeline["stages"][next_stage] = "Running"
            else:
                # Finished CI/CD
                self.pipeline["status"] = "Success"
                self.pipeline["active_stage"] = None
                self.log_agent("SelfHealingAgent", "CI/CD Deployment pipeline completed successfully. All environments updated.")

    def _loop(self):
        while self.running:
            try:
                time.sleep(2.0 / self.simulation_speed)
                with self.lock:
                    if self.app:
                        with self.app.app_context():
                            self._tick()
            except Exception as e:
                print(f"Simulation tick error: {e}")

    def _tick(self):
        # 1. Update Metrics
        timestamp = datetime.utcnow()
        
        # Synchronize MonitoredWebsite records with simulator servers
        from backend.database import MonitoredWebsite
        import threading
        
        websites = []
        try:
            websites = MonitoredWebsite.query.all()
            website_names = {f"Web-{w.name}" for w in websites}
            
            # Clean up deleted website servers
            keys_to_remove = [k for k in self.servers if k.startswith("Web-") and k not in website_names]
            for k in keys_to_remove:
                del self.servers[k]
                if k in self.containers:
                    del self.containers[k]
                self.k8s_pods = [p for p in self.k8s_pods if p["server"] != k]
                
            # Add or initialize website servers
            for w in websites:
                server_key = f"Web-{w.name}"
                if server_key not in self.servers:
                    self.servers[server_key] = {"cpu": 10.0, "mem": 15.0, "disk": 5.0, "net": 1.0, "resp": 100.0, "status": "Healthy"}
                    self.containers[server_key] = [
                        {"id": f"c-web-{w.id}", "name": "http-monitor", "status": "Running", "cpu": 0.5, "mem": 40}
                    ]
                    self.k8s_pods.append({
                        "name": f"web-pod-{w.id}",
                        "server": server_key,
                        "status": "Running",
                        "restarts": 0,
                        "age": "1h",
                        "cpu": "0.2%",
                        "mem": "40Mi"
                    })
        except Exception as e:
            print(f"Error syncing monitored websites: {e}")

        # Run latency checks in parallel
        web_results = {}
        if websites:
            threads = []
            def run_check(s_id, url):
                latency, status_str = self._measure_latency(url)
                web_results[s_id] = (latency, status_str)
                
            for w in websites:
                s_key = f"Web-{w.name}"
                t = threading.Thread(target=run_check, args=(s_key, w.url))
                threads.append(t)
                t.start()
                
            for t in threads:
                t.join(timeout=2.5)

        for server_id, metrics in self.servers.items():
            fault = self.injected_faults.get(server_id)
            
            if server_id.startswith("Web-"):
                # Handle real website response times
                res = web_results.get(server_id, (3000.0, "Down: Timeout"))
                latency, status_str = res
                
                # Slowly fluctuate simulated metrics slightly so the server is not totally static
                metrics["cpu"] = max(5.0, min(25.0, metrics["cpu"] + random.uniform(-1.0, 1.0)))
                metrics["mem"] = max(10.0, min(30.0, metrics["mem"] + random.uniform(-0.5, 0.5)))
                metrics["disk"] = max(2.0, min(10.0, metrics["disk"] + random.uniform(0.0001, 0.001)))
                metrics["net"] = max(0.5, min(5.0, metrics["net"] + random.uniform(-0.2, 0.2)))
                metrics["resp"] = latency
                metrics["status"] = "Healthy" if "Healthy" in status_str else "Degraded"
                
                # Update container status based on health
                if server_id in self.containers:
                    for c in self.containers[server_id]:
                        c["status"] = "Running" if "Healthy" in status_str else "Stopped"
                # Update K8s pod status
                for pod in self.k8s_pods:
                    if pod["server"] == server_id:
                        pod["status"] = "Running" if "Healthy" in status_str else "Error"
            else:
                # Regular server simulation
                if fault == "cpu_spike":
                    metrics["cpu"] = min(100.0, metrics["cpu"] + random.uniform(5.0, 15.0) if metrics["cpu"] < 90 else random.uniform(92.0, 99.0))
                    metrics["resp"] = min(3000.0, metrics["resp"] + random.uniform(100.0, 300.0) if metrics["resp"] < 500 else metrics["resp"] + random.uniform(10.0, 50.0))
                    metrics["mem"] = min(100.0, metrics["mem"] + random.uniform(-0.5, 0.5))
                    metrics["disk"] = min(100.0, metrics["disk"] + random.uniform(-0.1, 0.1))
                    metrics["net"] = max(5.0, metrics["net"] + random.uniform(-1, 1))
                elif fault == "memory_leak":
                    metrics["mem"] = min(100.0, metrics["mem"] + random.uniform(4.0, 8.0) if metrics["mem"] < 90 else random.uniform(95.0, 99.5))
                    metrics["cpu"] = min(100.0, metrics["cpu"] + random.uniform(1.0, 4.0))
                    metrics["resp"] = min(3000.0, metrics["resp"] + random.uniform(50.0, 150.0) if metrics["mem"] > 80 else metrics["resp"] + random.uniform(-5, 5))
                    metrics["disk"] = min(100.0, metrics["disk"] + random.uniform(-0.1, 0.1))
                    metrics["net"] = max(5.0, metrics["net"] + random.uniform(-1, 1))
                elif fault == "disk_full":
                    metrics["disk"] = min(100.0, metrics["disk"] + random.uniform(5.0, 10.0) if metrics["disk"] < 95 else random.uniform(98.5, 99.9))
                    metrics["cpu"] = min(100.0, metrics["cpu"] + random.uniform(-1, 1))
                    metrics["mem"] = min(100.0, metrics["mem"] + random.uniform(-0.2, 0.2))
                    metrics["resp"] = min(3000.0, metrics["resp"] + random.uniform(20.0, 80.0) if metrics["disk"] > 90 else metrics["resp"] + random.uniform(-2, 2))
                    metrics["net"] = max(5.0, metrics["net"] + random.uniform(-1, 1))
                elif fault == "network_bottleneck":
                    metrics["net"] = min(150.0, metrics["net"] + random.uniform(10.0, 20.0) if metrics["net"] < 90 else random.uniform(95.0, 115.0))
                    metrics["resp"] = min(3000.0, metrics["resp"] + random.uniform(150.0, 400.0) if metrics["net"] > 70 else metrics["resp"] + random.uniform(-5, 5))
                    metrics["cpu"] = min(100.0, metrics["cpu"] + random.uniform(2.0, 5.0))
                    metrics["mem"] = min(100.0, metrics["mem"] + random.uniform(-0.5, 0.5))
                    metrics["disk"] = min(100.0, metrics["disk"] + random.uniform(-0.1, 0.1))
                elif fault == "k8s_pod_crash":
                    metrics["resp"] = min(3000.0, metrics["resp"] + random.uniform(200.0, 500.0) if metrics["resp"] < 1000 else metrics["resp"] + random.uniform(10.0, 50.0))
                    metrics["cpu"] = max(5.0, metrics["cpu"] - random.uniform(2.0, 5.0))
                    metrics["mem"] = max(10.0, metrics["mem"] - random.uniform(1.0, 3.0))
                    metrics["disk"] = min(100.0, metrics["disk"] + random.uniform(-0.1, 0.1))
                    metrics["net"] = max(1.0, metrics["net"] - random.uniform(1.0, 3.0))
                else:
                    # Normal fluctuations
                    metrics["cpu"] = max(10.0, min(80.0, metrics["cpu"] + random.uniform(-3.0, 3.0)))
                    metrics["mem"] = max(20.0, min(80.0, metrics["mem"] + random.uniform(-1.5, 1.5)))
                    metrics["disk"] = max(10.0, min(85.0, metrics["disk"] + random.uniform(0.001, 0.005))) # Slow growth
                    metrics["net"] = max(1.0, min(50.0, metrics["net"] + random.uniform(-2.0, 2.0)))
                    metrics["resp"] = max(30.0, min(300.0, metrics["resp"] + random.uniform(-10.0, 10.0)))
                    metrics["status"] = "Healthy"

            
            # Predict anomalies & failures using models
            metrics_vector = [metrics["cpu"], metrics["mem"], metrics["disk"], metrics["net"], metrics["resp"]]
            is_anom, anom_score = MLManager.detect_anomaly(metrics_vector)
            fail_prob, risk_level, fail_type = MLManager.predict_failure(metrics_vector)
            
            # Commit metric to DB
            record = MetricRecord(
                server_id=server_id,
                cpu_usage=round(metrics["cpu"], 2),
                memory_usage=round(metrics["mem"], 2),
                disk_usage=round(metrics["disk"], 2),
                network_traffic=round(metrics["net"], 2),
                response_time=round(metrics["resp"], 2),
                is_anomaly=is_anom,
                anomaly_score=round(anom_score, 4)
            )
            db.session.add(record)
            
        db.session.commit()
        
        # 2. Update CI/CD Pipeline
        self._update_pipeline()
        
        # 3. AI Agents Loop
        self._run_agents_logic()

    def _run_agents_logic(self):
        # Check if we are currently handling an active healing plan
        if self.current_healing_incident:
            self._handle_healing_progress()
            return

        # Check if any server has anomalies
        unhealthy_server = None
        unhealthy_metrics = None
        unhealthy_fault = None
        
        for server_id, metrics in self.servers.items():
            metrics_vector = [metrics["cpu"], metrics["mem"], metrics["disk"], metrics["net"], metrics["resp"]]
            is_anom, _ = MLManager.detect_anomaly(metrics_vector)
            
            # Check thresholds manually as safety backup
            if is_anom or metrics["cpu"] > 85 or metrics["mem"] > 85 or metrics["disk"] > 90 or metrics["net"] > 80 or metrics["resp"] > 800:
                unhealthy_server = server_id
                unhealthy_metrics = metrics_vector
                unhealthy_fault = self.injected_faults.get(server_id)
                break
                
        if unhealthy_server:
            # Check if there is an active open incident for this server
            existing_incident = Incident.query.filter_by(
                affected_component=unhealthy_server,
                resolution_status='Open'
            ).first()
            
            if not existing_incident:
                # 1. Monitoring Agent detects
                self.active_agent = "MonitoringAgent"
                cpu, mem, disk, net, resp = unhealthy_metrics
                self.log_agent("MonitoringAgent", f"TELEMETRY ALERT: Anomalous metrics detected on {unhealthy_server}. CPU: {cpu:.1f}%, Mem: {mem:.1f}%, Disk: {disk:.1f}%, Network: {net:.1f}MB/s, Resp: {resp:.1f}ms. Creating Incident.")
                
                incident_id = f"INC-{random.randint(10000, 99999)}"
                new_incident = Incident(
                    id=incident_id,
                    timestamp=datetime.utcnow(),
                    severity="critical" if (cpu > 90 or mem > 90 or disk > 95 or resp > 1500) else "warning",
                    affected_component=unhealthy_server,
                    root_cause="Under Investigation",
                    resolution_status="Open"
                )
                db.session.add(new_incident)
                db.session.commit()
                
                # 2. Analysis Agent analyses
                self.active_agent = "AnalysisAgent"
                self.log_agent("AnalysisAgent", f"Evaluating telemetry dataset on {unhealthy_server}. Triggering Isolation Forest anomaly scorer.")
                _, score = MLManager.detect_anomaly(unhealthy_metrics)
                self.log_agent("AnalysisAgent", f"Anomaly verified. Isolation Forest score: {score:.4f}. Alert status changed to CRITICAL. Dispatching to RCA Agent.")
                
                # 3. RCA Agent determines cause
                self.active_agent = "RCAAgent"
                self.log_agent("RCAAgent", f"Correlating features for {unhealthy_server}. Invoking Random Forest classification model.")
                prob, risk, fail_type = MLManager.predict_failure(unhealthy_metrics)
                
                # Refine root cause
                root_cause = f"Model classified fault: {fail_type} (probability: {prob*100:.1f}%)"
                if unhealthy_fault == "k8s_pod_crash":
                    root_cause = "Kubernetes Pod Crash (Replica replica-set failure, HTTP 500 error)"
                
                new_incident.root_cause = root_cause
                new_incident.resolution_status = "Investigating"
                db.session.commit()
                self.log_agent("RCAAgent", f"Root Cause Analysis complete. Cause: '{root_cause}'. Recommendation: Initiate Self-Healing protocol.")
                
                # 4. Self-Healing Agent triggers
                self.active_agent = "HealingAgent"
                action_type = "restart"
                details = ""
                if fail_type == "Out of Memory" or unhealthy_fault == "memory_leak":
                    action_type = "redeploy"
                    details = f"Memory leak detected. Redeploying web services and recycling container logs on {unhealthy_server}."
                elif fail_type == "Disk Full" or unhealthy_fault == "disk_full":
                    action_type = "clean_disk"
                    details = f"Executing log rotation and clearing local temp dirs on {unhealthy_server}."
                elif fail_type == "CPU Saturation" or unhealthy_fault == "cpu_spike":
                    action_type = "scale"
                    details = f"CPU Saturation. Scaling Kubernetes replicas from 2 to 4 on cluster."
                elif fail_type == "Network Bottleneck" or unhealthy_fault == "network_bottleneck":
                    action_type = "scale"
                    details = f"Traffic spike. Scaling network ingress capacity and load-balancer pools."
                elif unhealthy_fault == "k8s_pod_crash":
                    action_type = "restart"
                    details = f"Pod crash. Simulating K8s replica recovery (kubectl rollout restart)."
                else:
                    action_type = "restart"
                    details = f"Restarting microservice containers on {unhealthy_server}."
                    
                healing_log = SelfHealingLog(
                    incident_id=incident_id,
                    action_type=action_type,
                    details=details,
                    status="Triggered"
                )
                db.session.add(healing_log)
                new_incident.resolution_status = "Resolving"
                db.session.commit()
                
                self.log_agent("HealingAgent", f"Self-Healing Plan selected: {action_type.upper()}. Details: {details}")
                self.log_agent("HealingAgent", f"Executing remediation script on target target server environment...")
                
                # Set up active healing progress
                self.current_healing_incident = {
                    "incident_id": incident_id,
                    "server_id": unhealthy_server,
                    "action_type": action_type,
                    "fault_type": unhealthy_fault,
                    "healing_log_id": healing_log.id
                }
                self.healing_step = 1
                self.healing_timer = 0
                
                # Visually update containers or pods
                self._set_components_status(unhealthy_server, "Pending/Restarting")
        else:
            self.active_agent = "MonitoringAgent"


    def _set_components_status(self, server_id, status):
        # Update container status in simulator
        if server_id in self.containers:
            for cont in self.containers[server_id]:
                cont["status"] = "Restarting" if "Restart" in status else "Scaling"
        # Update K8s pod status
        for pod in self.k8s_pods:
            if pod["server"] == server_id:
                pod["status"] = "Pending"

    def _handle_healing_progress(self):
        self.active_agent = "HealingAgent"
        self.healing_timer += 1
        
        incident_id = self.current_healing_incident["incident_id"]
        server_id = self.current_healing_incident["server_id"]
        action_type = self.current_healing_incident["action_type"]
        fault_type = self.current_healing_incident["fault_type"]
        h_log_id = self.current_healing_incident["healing_log_id"]
        
        healing_log = SelfHealingLog.query.get(h_log_id)
        incident = Incident.query.get(incident_id)
        
        if self.healing_step == 1:
            if self.healing_timer >= 2: # Wait 2 ticks (4s)
                # Next step
                if healing_log:
                    healing_log.status = "In Progress"
                self.log_agent("HealingAgent", f"Healing in progress. Applying remediation parameters to {server_id}...")
                
                # Adjust K8s pod simulation
                for pod in self.k8s_pods:
                    if pod["server"] == server_id:
                        pod["status"] = "ContainerCreating"
                        if action_type == "scale":
                            # Add an extra pod to simulate scaling
                            pass
                
                if action_type == "scale":
                    # Add pod
                    new_pod_name = f"api-pod-scaled-{random.randint(10,99)}"
                    self.k8s_pods.append({
                        "name": new_pod_name,
                        "server": server_id,
                        "status": "ContainerCreating",
                        "restarts": 0,
                        "age": "1m",
                        "cpu": "0.1%",
                        "mem": "10Mi"
                    })
                    self.log_agent("HealingAgent", f"Kubernetes Scheduler: Created new Pod replica '{new_pod_name}' on {server_id}.")
                
                db.session.commit()
                self.healing_step = 2
                self.healing_timer = 0
                
        elif self.healing_step == 2:
            if self.healing_timer >= 2: # Wait another 2 ticks (4s)
                # Remediation success
                # Remove the fault!
                if server_id in self.injected_faults:
                    del self.injected_faults[server_id]
                
                # Stabilize metrics instantly in simulator
                self.servers[server_id]["status"] = "Healthy"
                
                # Restore container/pod states to Healthy
                if server_id in self.containers:
                    for cont in self.containers[server_id]:
                        cont["status"] = "Running"
                for pod in self.k8s_pods:
                    if pod["server"] == server_id:
                        pod["status"] = "Running"
                        pod["restarts"] += 1 if "restart" in action_type else 0
                        pod["cpu"] = f"{random.uniform(1.0, 3.5):.1f}%"
                        pod["mem"] = f"{random.randint(100, 200)}Mi"
                
                if healing_log:
                    healing_log.status = "Success"
                if incident:
                    incident.resolution_status = "Resolved"
                    incident.resolved_at = datetime.utcnow()
                
                db.session.commit()
                
                self.log_agent("HealingAgent", f"Healing script execution SUCCESS on {server_id}. Services restarted/scaled and metrics returning to normal parameters.")
                self.log_agent("MonitoringAgent", f"Telemetry metrics stabilized on {server_id}. Incident {incident_id} marked as RESOLVED.")
                
                # Clear active incident
                self.current_healing_incident = None
                self.healing_step = 0
                self.healing_timer = 0
                self.active_agent = "MonitoringAgent"

    def _measure_latency(self, url):
        import urllib.request
        import time
        
        if not url.startswith("http://") and not url.startswith("https://"):
            url = "http://" + url
            
        start = time.time()
        try:
            req = urllib.request.Request(
                url, 
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AutoOpsMonitor/1.0'}
            )
            with urllib.request.urlopen(req, timeout=2.0) as response:
                response.read(1024)
            latency = (time.time() - start) * 1000
            return latency, "Healthy"
        except Exception as e:
            latency = (time.time() - start) * 1000
            return min(3000.0, latency), f"Down: {str(e)}"

    def get_simulation_state(self):

        with self.lock:
            return {
                "servers": self.servers,
                "containers": self.containers,
                "k8s_pods": self.k8s_pods,
                "pipeline": self.pipeline,
                "injected_faults": self.injected_faults,
                "active_agent": self.active_agent,
                "simulation_speed": self.simulation_speed
            }

    def set_speed(self, speed):
        with self.lock:
            self.simulation_speed = max(0.1, min(10.0, float(speed)))
            return self.simulation_speed

# Global simulator object
simulator = DevOpsSimulator()
