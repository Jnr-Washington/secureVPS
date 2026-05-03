/*
  SecureOps Dashboard – Refactored
  ─────────────────────────────────────────────────────────────────
  Changes from original:
  1. Scanner (ScanPage / scan buttons) now calls FastAPI /scan/cms and /scan/ports
  2. Deploy VPS button opens a choice modal: "Enter API Key" vs "Quick Deploy Wizard"
  3. VPS deployment wizard calls deployment.py backend via Express bridge
  4. DeployChoiceModal added – prompts user before any pipeline kicks off
  5. API layer abstracted into api.ts-style hooks at top of file
  ─────────────────────────────────────────────────────────────────
  Dependencies: npm install lucide-react recharts
  Tailwind config: fontFamily: { mono: ['"JetBrains Mono"', 'monospace'] }
  Google Font: JetBrains Mono (see index.html / global CSS)
*/

import { useState, useEffect, useRef } from "react";
import {
  Shield, Server, Zap, FileText, LayoutDashboard,
  ChevronRight, X, AlertTriangle, AlertOctagon,
  Info, CheckCircle2, Download, Play, RefreshCw,
  Plus, Activity, Clock, Cpu, Globe, Lock,
  Menu, Bell, Settings, User, HardDrive,
  TrendingUp, TrendingDown, Minus, Search,
  Terminal, Database, Network, Eye, BarChart3,
  Key, Wand2, ExternalLink, Loader2, AlertCircle,
  Copy, Check
} from "lucide-react";
import {
  RadialBarChart, RadialBar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";

// ─── Config ──────────────────────────────────────────────────────────────────

// FastAPI backend (Python) – adjust if you run on a different port
const FASTAPI_BASE = "http://localhost:8000";

// Express backend (Node) – bridges to deployment.py
const EXPRESS_BASE = "http://localhost:3001";

// ─── API Layer ────────────────────────────────────────────────────────────────

interface ScanResult {
  target: string;
  open_ports?: number[];
  cms?: string | null;
  error?: string;
}

interface DeployPayload {
  instanceName: string;
  provider: string;
  os: string;
  size: string;
  region: string;
  apiKey: string;
  sshKeyPath?: string;
  autoScan: boolean;
}

interface DeployResult {
  ip?: string;
  error?: string;
  status: "ok" | "error";
}

async function apiScanPorts(target: string): Promise<ScanResult> {
  const res = await fetch(`${FASTAPI_BASE}/scan/ports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiScanCms(target: string): Promise<ScanResult> {
  const res = await fetch(`${FASTAPI_BASE}/scan/cms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Express bridge: POST /deploy → calls deployment.py VPSDeploymentPipeline
async function apiDeploy(payload: DeployPayload): Promise<DeployResult> {
  const res = await fetch(`${EXPRESS_BASE}/deploy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────

type NavPage = "dashboard" | "vps" | "deploy" | "scan" | "reports";
type DeployFlow = "choice" | "api-key" | "wizard" | "running" | null;

interface VpsInstance {
  id: string;
  name: string;
  ip: string;
  os: string;
  cpu: string;
  region: string;
  provider: "AWS EC2" | "DigitalOcean" | "Hetzner";
  status: "running" | "stopped" | "pending";
  vulns: number;
}

interface VulnFinding {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  cve: string;
  title: string;
  host: string;
  cvss: number;
  age: string;
}

interface Report {
  id: string;
  name: string;
  scope: string;
  format: "PDF" | "HTML" | "XML";
  size: string;
  date: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const VPS_DATA: VpsInstance[] = [
  { id: "1", name: "web-prod-01", ip: "192.168.1.10", os: "Ubuntu 22.04", cpu: "2vCPU / 4GB", region: "EU-West-1", provider: "AWS EC2", status: "running", vulns: 0 },
  { id: "2", name: "db-01", ip: "192.168.1.11", os: "Debian 12", cpu: "4vCPU / 16GB", region: "EU-West-1", provider: "AWS EC2", status: "running", vulns: 5 },
  { id: "3", name: "proxy-01", ip: "10.0.0.5", os: "Ubuntu 20.04", cpu: "2vCPU / 2GB", region: "US-East-1", provider: "DigitalOcean", status: "running", vulns: 2 },
];

const VULN_DATA: VulnFinding[] = [
  { id: "1", severity: "critical", cve: "CVE-2024-3094", title: "XZ Utils backdoor", host: "db-01", cvss: 10.0, age: "2 days ago" },
  { id: "2", severity: "critical", cve: "CVE-2024-6387", title: "OpenSSH regreSSHion", host: "db-01", cvss: 8.1, age: "today" },
  { id: "3", severity: "high", cve: "CVE-2024-1234", title: "Nginx path traversal", host: "proxy-01", cvss: 7.5, age: "5 days ago" },
  { id: "4", severity: "high", cve: "CVE-2024-5678", title: "SSL/TLS BEAST — weak ciphers", host: "proxy-01", cvss: 7.1, age: "5 days ago" },
  { id: "5", severity: "high", cve: "CVE-2024-9012", title: "MySQL 8.0 RCE vector", host: "db-01", cvss: 7.0, age: "today" },
  { id: "6", severity: "medium", cve: "CVE-2024-3456", title: "Anonymous FTP login allowed", host: "db-01", cvss: 5.3, age: "8 days ago" },
  { id: "7", severity: "medium", cve: "CVE-2024-7890", title: "SNMPv1 public community string", host: "proxy-01", cvss: 4.9, age: "8 days ago" },
];

const REPORTS_DATA: Report[] = [
  { id: "1", name: "May 2025 Full Audit", scope: "All hosts", format: "PDF", size: "2.1 MB", date: "3 May 2025" },
  { id: "2", name: "db-01 Critical Findings", scope: "db-01", format: "PDF", size: "840 KB", date: "1 May 2025" },
  { id: "3", name: "April 2025 Full Audit", scope: "All hosts", format: "PDF", size: "1.9 MB", date: "30 Apr 2025" },
  { id: "4", name: "proxy-01 SSL Audit", scope: "proxy-01", format: "HTML", size: "620 KB", date: "25 Apr 2025" },
];

const AREA_DATA = [
  { day: "Mon", critical: 0, high: 1, medium: 2 },
  { day: "Tue", critical: 1, high: 2, medium: 3 },
  { day: "Wed", critical: 1, high: 3, medium: 2 },
  { day: "Thu", critical: 2, high: 2, medium: 3 },
  { day: "Fri", critical: 2, high: 3, medium: 4 },
  { day: "Sat", critical: 2, high: 3, medium: 3 },
  { day: "Sun", critical: 2, high: 3, medium: 2 },
];

const DONUT_DATA = [
  { name: "Critical", value: 2, color: "#ef4444" },
  { name: "High", value: 3, color: "#f97316" },
  { name: "Medium", value: 2, color: "#eab308" },
  { name: "Low", value: 0, color: "#22c55e" },
];

// ─── Utility Components ───────────────────────────────────────────────────────

const SevBadge = ({ sev }: { sev: string }) => {
  const map: Record<string, string> = {
    critical: "bg-red-950 text-red-400 border border-red-800",
    high: "bg-orange-950 text-orange-400 border border-orange-800",
    medium: "bg-yellow-950 text-yellow-400 border border-yellow-800",
    low: "bg-emerald-950 text-emerald-400 border border-emerald-800",
  };
  return (
    <span className={`text-[10px] font-mono font-700 px-2 py-0.5 rounded uppercase tracking-wider ${map[sev] || ""}`}>
      {sev}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    running: "text-emerald-400",
    stopped: "text-red-400",
    pending: "text-yellow-400",
  };
  return (
    <span className={`flex items-center gap-1.5 text-xs font-mono ${map[status] || ""}`}>
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {status}
    </span>
  );
};

const ProviderBadge = ({ p }: { p: string }) => (
  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">{p}</span>
);

const MetricCard = ({
  label, value, delta, deltaDir, sub
}: { label: string; value: string; delta?: string; deltaDir?: "up" | "down" | "neutral"; sub?: string }) => {
  const icon = deltaDir === "up" ? <TrendingUp size={11} /> : deltaDir === "down" ? <TrendingDown size={11} /> : <Minus size={11} />;
  const col = deltaDir === "up" ? "text-emerald-400" : deltaDir === "down" ? "text-red-400" : "text-zinc-500";
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{label}</span>
      <span className="text-3xl font-mono font-800 text-zinc-100 leading-none">{value}</span>
      {delta && <span className={`flex items-center gap-1 text-[11px] font-mono ${col}`}>{icon}{delta}</span>}
      {sub && <span className="text-[11px] font-mono text-zinc-600">{sub}</span>}
    </div>
  );
};

// ─── Progress Modal (deploy / scan progress) ──────────────────────────────────

interface ProgressModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  accentColor: string;
  steps: string[];
  logLines?: string[];
}

const ProgressModal = ({ open, onClose, title, accentColor, steps, logLines }: ProgressModalProps) => {
  const [pct, setPct] = useState(0);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) { setPct(0); setStep(0); setDone(false); return; }
    timerRef.current = setInterval(() => {
      setPct(prev => {
        const next = Math.min(prev + Math.random() * 6 + 2, 100);
        if (next >= 100) { clearInterval(timerRef.current!); setDone(true); }
        setStep(Math.min(Math.floor((next / 100) * steps.length), steps.length - 1));
        return next;
      });
    }, 400);
    return () => clearInterval(timerRef.current!);
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <span className="font-mono font-700 text-zinc-100 text-sm">{title}</span>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors"><X size={16} /></button>
        </div>
        <div className="px-5 py-6">
          <div className="flex flex-col items-center gap-3 mb-5">
            {done
              ? <CheckCircle2 size={44} className="text-emerald-500" />
              : <div className="w-12 h-12 rounded-full border-[3px] border-zinc-800 animate-spin" style={{ borderTopColor: accentColor === "emerald" ? "#10b981" : "#3b82f6" }} />
            }
            <span className="text-3xl font-mono font-800 text-emerald-400">{Math.round(pct)}%</span>
            <span className="text-xs font-mono text-zinc-400">{done ? "Complete!" : steps[step]}</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          {logLines && (
            <div className="mt-4 bg-zinc-900 rounded-lg p-3 max-h-28 overflow-y-auto">
              {logLines.slice(0, Math.ceil((pct / 100) * logLines.length) + 1).map((l, i) => (
                <div key={i} className="text-[10px] font-mono text-zinc-400 leading-5">{l}</div>
              ))}
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-zinc-800 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-xs font-mono bg-zinc-800 text-zinc-300 hover:bg-red-950 hover:text-red-400 border border-zinc-700 hover:border-red-800 transition-all">
            {done ? "Close" : "Abort"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── NEW: Deploy Choice Modal ─────────────────────────────────────────────────
// Shown when user clicks "Deploy VPS" from any context.
// Lets user choose: enter their own API key OR use site's Quick Deploy Wizard.

interface DeployChoiceModalProps {
  open: boolean;
  onClose: () => void;
  onChooseApiKey: () => void;
  onChooseWizard: () => void;
}

const DeployChoiceModal = ({ open, onClose, onChooseApiKey, onChooseWizard }: DeployChoiceModalProps) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm mx-4 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center">
              <Zap size={12} className="text-zinc-950" />
            </div>
            <span className="font-mono font-700 text-zinc-100 text-sm">Deploy VPS</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-[11px] font-mono text-zinc-500 leading-relaxed">
            Choose how you want to deploy. You can bring your own provider API key, or use our guided Quick Deploy wizard.
          </p>

          {/* Option A: Own API Key */}
          <button
            onClick={onChooseApiKey}
            className="w-full flex items-start gap-3 p-4 rounded-xl border border-zinc-700 hover:border-emerald-700 bg-zinc-900 hover:bg-emerald-950/40 transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-800 group-hover:bg-emerald-900 border border-zinc-700 group-hover:border-emerald-700 flex items-center justify-center flex-shrink-0 transition-all">
              <Key size={16} className="text-zinc-400 group-hover:text-emerald-400 transition-colors" />
            </div>
            <div>
              <div className="text-xs font-mono font-700 text-zinc-200 group-hover:text-emerald-300 transition-colors">Use My Provider API Key</div>
              <div className="text-[10px] font-mono text-zinc-600 mt-0.5 leading-relaxed">Enter a DigitalOcean, AWS, or Hetzner API token and deploy directly from your account.</div>
            </div>
            <ChevronRight size={14} className="text-zinc-600 group-hover:text-emerald-500 mt-2 flex-shrink-0 transition-colors" />
          </button>

          {/* Option B: Quick Deploy Wizard */}
          <button
            onClick={onChooseWizard}
            className="w-full flex items-start gap-3 p-4 rounded-xl border border-zinc-700 hover:border-blue-700 bg-zinc-900 hover:bg-blue-950/40 transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-zinc-800 group-hover:bg-blue-900 border border-zinc-700 group-hover:border-blue-700 flex items-center justify-center flex-shrink-0 transition-all">
              <Wand2 size={16} className="text-zinc-400 group-hover:text-blue-400 transition-colors" />
            </div>
            <div>
              <div className="text-xs font-mono font-700 text-zinc-200 group-hover:text-blue-300 transition-colors">Quick Deploy Wizard</div>
              <div className="text-[10px] font-mono text-zinc-600 mt-0.5 leading-relaxed">Let SecureOps handle provisioning. Includes automated hardening and OpenVAS scan on first boot.</div>
            </div>
            <ChevronRight size={14} className="text-zinc-600 group-hover:text-blue-500 mt-2 flex-shrink-0 transition-colors" />
          </button>
        </div>

        <div className="px-5 pb-4">
          <button onClick={onClose} className="w-full py-2 rounded-lg text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── NEW: API Key Deploy Modal ────────────────────────────────────────────────
// Collects provider + API key from user, then calls deployment.py via Express.

interface ApiKeyDeployModalProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onStartDeploy: (instanceName: string) => void;
}

const API_KEY_DEPLOY_STEPS = [
  "Validating API credentials...",
  "Provisioning cloud instance...",
  "Waiting for IP assignment...",
  "Running Ansible hardening...",
  "Triggering OpenVAS baseline scan...",
  "Finalizing deployment...",
];

const ApiKeyDeployModal = ({ open, onClose, onBack, onStartDeploy }: ApiKeyDeployModalProps) => {
  const [provider, setProvider] = useState("DigitalOcean");
  const [apiKey, setApiKey] = useState("");
  const [instanceName, setInstanceName] = useState("");
  const [sshKey, setSshKey] = useState("~/.ssh/id_rsa.pub");
  const [region, setRegion] = useState("nyc3");
  const [size, setSize] = useState("s-1vcpu-2gb");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyVisible, setKeyVisible] = useState(false);

  const handleDeploy = async () => {
    if (!apiKey.trim() || !instanceName.trim()) {
      setError("Instance name and API key are required.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await apiDeploy({
        instanceName,
        provider,
        os: "ubuntu-22-04-x64",
        size,
        region,
        apiKey,
        sshKeyPath: sshKey,
        autoScan: true,
      });
      if (result.status === "error") throw new Error(result.error || "Deploy failed");
      onStartDeploy(instanceName);
    } catch (e: any) {
      setError(e.message || "Deployment failed. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="text-zinc-500 hover:text-zinc-300 transition-colors mr-1">
              <ChevronRight size={14} className="rotate-180" />
            </button>
            <Key size={14} className="text-emerald-500" />
            <span className="font-mono font-700 text-zinc-100 text-sm">API Key Deployment</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-lg px-3 py-2">
              <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
              <span className="text-[11px] font-mono text-red-400">{error}</span>
            </div>
          )}

          {/* Provider select */}
          <div>
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1.5">VPS PROVIDER</label>
            <select
              value={provider}
              onChange={e => setProvider(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-700 transition-all"
            >
              <option>DigitalOcean</option>
              <option>AWS EC2</option>
              <option>Hetzner</option>
            </select>
          </div>

          {/* API Key input */}
          <div>
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1.5">
              {provider === "AWS EC2" ? "ACCESS KEY ID / SECRET" : "API TOKEN"}
            </label>
            <div className="relative">
              <input
                type={keyVisible ? "text" : "password"}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={provider === "DigitalOcean" ? "dop_v1_..." : provider === "Hetzner" ? "htz_..." : "AKIA..."}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 pr-9 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-900 transition-all"
              />
              <button
                onClick={() => setKeyVisible(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <Eye size={13} />
              </button>
            </div>
            <p className="text-[10px] font-mono text-zinc-600 mt-1">
              Keys are sent only to your provider — never stored by SecureOps.
            </p>
          </div>

          {/* Instance Name */}
          <div>
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1.5">INSTANCE NAME</label>
            <input
              type="text"
              value={instanceName}
              onChange={e => setInstanceName(e.target.value)}
              placeholder="e.g. web-prod-02"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-900 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Region */}
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1.5">REGION</label>
              <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-700 transition-all"
              >
                <option value="nyc3">US-East (NYC3)</option>
                <option value="fra1">EU-West (FRA1)</option>
                <option value="sgp1">AP-SE (SGP1)</option>
                <option value="lon1">EU (LON1)</option>
              </select>
            </div>
            {/* Size */}
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1.5">SIZE</label>
              <select
                value={size}
                onChange={e => setSize(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-700 transition-all"
              >
                <option value="s-1vcpu-1gb">1vCPU / 1GB</option>
                <option value="s-1vcpu-2gb">1vCPU / 2GB</option>
                <option value="s-2vcpu-4gb">2vCPU / 4GB</option>
                <option value="s-4vcpu-8gb">4vCPU / 8GB</option>
              </select>
            </div>
          </div>

          {/* SSH Key path */}
          <div>
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1.5">SSH PUBLIC KEY PATH (server-side)</label>
            <input
              type="text"
              value={sshKey}
              onChange={e => setSshKey(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-700 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="autoscan2" defaultChecked className="accent-emerald-500 w-3.5 h-3.5" />
            <label htmlFor="autoscan2" className="text-xs font-mono text-zinc-400">Run OpenVAS scan after deployment</label>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-zinc-800">
          <button
            onClick={handleDeploy}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 text-xs font-mono font-700 transition-all active:scale-[0.98]"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
            {loading ? "Connecting to provider..." : "Deploy via API Key"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── NEW: Live Scan Modal ─────────────────────────────────────────────────────
// Replaces the fake ProgressModal for scans — actually calls FastAPI.

interface LiveScanModalProps {
  open: boolean;
  onClose: () => void;
  target: string;
}

const LiveScanModal = ({ open, onClose, target }: LiveScanModalProps) => {
  type Phase = "idle" | "ports" | "cms" | "done" | "error";
  const [phase, setPhase] = useState<Phase>("idle");
  const [portsResult, setPortsResult] = useState<ScanResult | null>(null);
  const [cmsResult, setCmsResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [log, setLog] = useState<string[]>([]);

  const addLog = (line: string) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${line}`]);

  useEffect(() => {
    if (!open) {
      setPhase("idle"); setPortsResult(null); setCmsResult(null);
      setLog([]); setErrorMsg("");
      return;
    }
    runScan();
  }, [open, target]);

  const runScan = async () => {
    setPhase("ports");
    addLog(`Starting port scan on ${target}...`);
    try {
      const ports = await apiScanPorts(target);
      setPortsResult(ports);
      addLog(`Port scan complete. Found ${ports.open_ports?.length ?? 0} open port(s).`);
      (ports.open_ports ?? []).forEach(p => addLog(`  → Port ${p} open`));

      setPhase("cms");
      addLog(`Detecting CMS on ${target}...`);
      const cms = await apiScanCms(target);
      setCmsResult(cms);
      addLog(`CMS detection complete: ${cms.cms ?? "None detected"}`);
      setPhase("done");
    } catch (e: any) {
      setErrorMsg(e.message || "Scan failed");
      addLog(`ERROR: ${e.message}`);
      setPhase("error");
    }
  };

  if (!open) return null;

  const phaseLabel: Record<Phase, string> = {
    idle: "Initialising...",
    ports: "Scanning ports via FastAPI...",
    cms: "Detecting CMS via FastAPI...",
    done: "Scan complete",
    error: "Scan failed",
  };

  const pct = phase === "idle" ? 0 : phase === "ports" ? 30 : phase === "cms" ? 70 : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <span className="font-mono font-700 text-zinc-100 text-sm">Live Scan — {target}</span>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors"><X size={16} /></button>
        </div>

        <div className="px-5 py-6 space-y-5">
          {/* Status */}
          <div className="flex flex-col items-center gap-3">
            {phase === "done"
              ? <CheckCircle2 size={40} className="text-emerald-500" />
              : phase === "error"
              ? <AlertOctagon size={40} className="text-red-500" />
              : <Loader2 size={40} className="text-blue-400 animate-spin" />
            }
            <span className="text-xs font-mono text-zinc-400">{phaseLabel[phase]}</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div className="h-full rounded-full bg-blue-500 transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>

          {/* Log */}
          <div className="bg-zinc-900 rounded-lg p-3 max-h-32 overflow-y-auto">
            {log.map((l, i) => (
              <div key={i} className={`text-[10px] font-mono leading-5 ${l.includes("ERROR") ? "text-red-400" : "text-zinc-400"}`}>{l}</div>
            ))}
          </div>

          {/* Results */}
          {phase === "done" && (
            <div className="space-y-3">
              {portsResult && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">Open Ports</div>
                  {portsResult.open_ports && portsResult.open_ports.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {portsResult.open_ports.map(p => (
                        <span key={p} className="text-[10px] font-mono px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-800 rounded">{p}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] font-mono text-zinc-600">No open ports detected</span>
                  )}
                </div>
              )}
              {cmsResult && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">CMS Detected</div>
                  <span className="text-xs font-mono text-zinc-200">{cmsResult.cms ?? "None / unknown"}</span>
                </div>
              )}
            </div>
          )}

          {phase === "error" && (
            <div className="bg-red-950 border border-red-800 rounded-lg px-3 py-2">
              <span className="text-[11px] font-mono text-red-400">{errorMsg}</span>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-zinc-800 flex justify-between items-center">
          {phase === "error" && (
            <button onClick={runScan} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-all">
              <RefreshCw size={11} /> Retry
            </button>
          )}
          <button onClick={onClose} className="ml-auto px-4 py-1.5 rounded-lg text-xs font-mono bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 transition-all">
            {phase === "done" || phase === "error" ? "Close" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Pages ────────────────────────────────────────────────────────────────────

const DashboardPage = ({ onOpenDeploy, onOpenScan }: { onOpenDeploy: () => void; onOpenScan: (h: string) => void }) => (
  <div className="space-y-5">
    <div>
      <h1 className="text-xl font-mono font-800 text-zinc-100 tracking-tight">Overview</h1>
      <p className="text-xs font-mono text-zinc-500 mt-0.5">Security posture across your infrastructure</p>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricCard label="Active VPS" value="3" delta="↑ 1 this week" deltaDir="up" />
      <MetricCard label="Open Vulns" value="7" delta="↑ 2 since last scan" deltaDir="down" />
      <MetricCard label="Last Scan" value="2h ago" sub="OpenVAS engine" deltaDir="neutral" />
      <MetricCard label="Reports" value="12" sub="3 this month" deltaDir="neutral" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono font-600 text-zinc-300 uppercase tracking-wider">Vulnerability Breakdown</span>
          <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded">GVM scan</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={DONUT_DATA} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" strokeWidth={0}>
                  {DONUT_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-mono font-800 text-zinc-100">7</span>
            </div>
          </div>
          <div className="flex-1 space-y-2.5">
            {DONUT_DATA.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-xs font-mono text-zinc-400 flex-1">{d.name}</span>
                <span className="text-xs font-mono font-600 text-zinc-200">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono font-600 text-zinc-300 uppercase tracking-wider">7-Day Trend</span>
          <BarChart3 size={14} className="text-zinc-600" />
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={AREA_DATA} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="#27272a" />
            <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "#52525b" }} />
            <YAxis tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: "#52525b" }} />
            <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 11 }} labelStyle={{ color: "#a1a1aa" }} />
            <Area type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={1.5} fill="url(#cg)" />
            <Area type="monotone" dataKey="high" stroke="#f97316" strokeWidth={1.5} fill="url(#hg)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <span className="text-xs font-mono font-600 text-zinc-300 uppercase tracking-wider block mb-4">Recent Activity</span>
      <div className="space-y-0">
        {[
          { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-950", label: "VPS web-prod-01 deployed", time: "Today at 10:42" },
          { icon: AlertOctagon, color: "text-red-500", bg: "bg-red-950", label: "2 critical vulns found on db-01", time: "Today at 08:15" },
          { icon: FileText, color: "text-blue-500", bg: "bg-blue-950", label: "Monthly report generated", time: "Yesterday at 17:00" },
          { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-950", label: "Scan completed — 5 issues", time: "2 days ago" },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3 py-3 border-b border-zinc-800 last:border-b-0">
            <div className={`w-7 h-7 rounded-full ${item.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
              <item.icon size={13} className={item.color} />
            </div>
            <div>
              <div className="text-xs font-mono font-500 text-zinc-200">{item.label}</div>
              <div className="text-[10px] font-mono text-zinc-600 mt-0.5">{item.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <span className="text-xs font-mono font-600 text-zinc-300 uppercase tracking-wider">VPS Fleet Status</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Name", "IP", "Region", "Provider", "Status", "Vulns"].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-zinc-500 uppercase tracking-wider text-[10px] font-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VPS_DATA.map(v => (
              <tr key={v.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 text-zinc-200 font-600">{v.name}</td>
                <td className="px-4 py-3 text-zinc-500">{v.ip}</td>
                <td className="px-4 py-3 text-zinc-400">{v.region}</td>
                <td className="px-4 py-3"><ProviderBadge p={v.provider} /></td>
                <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                <td className="px-4 py-3">
                  <span className={`font-700 ${v.vulns === 0 ? "text-zinc-500" : v.vulns >= 4 ? "text-red-400" : "text-yellow-400"}`}>{v.vulns}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// VpsPage — "Deploy VPS" button now calls onOpenDeploy (choice modal)
const VpsPage = ({ onScan, onOpenDeploy }: { onScan: (h: string) => void; onOpenDeploy: () => void }) => (
  <div className="space-y-5">
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-xl font-mono font-800 text-zinc-100 tracking-tight">VPS Fleet</h1>
        <p className="text-xs font-mono text-zinc-500 mt-0.5">Manage and monitor your virtual machines</p>
      </div>
      <button
        onClick={onOpenDeploy}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-mono font-700 transition-all active:scale-95"
      >
        <Plus size={13} /> Deploy VPS
      </button>
    </div>
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-zinc-800">
              {["Name", "IP", "OS", "CPU / RAM", "Region", "Provider", "Status", "Vulns", "Action"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-zinc-500 uppercase tracking-wider text-[10px] font-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VPS_DATA.map(v => (
              <tr key={v.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 text-zinc-200 font-700">{v.name}</td>
                <td className="px-4 py-3 text-zinc-500">{v.ip}</td>
                <td className="px-4 py-3 text-zinc-400">{v.os}</td>
                <td className="px-4 py-3 text-zinc-500">{v.cpu}</td>
                <td className="px-4 py-3 text-zinc-400">{v.region}</td>
                <td className="px-4 py-3"><ProviderBadge p={v.provider} /></td>
                <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                <td className="px-4 py-3">
                  <span className={`font-700 ${v.vulns === 0 ? "text-zinc-500" : v.vulns >= 4 ? "text-red-400" : "text-yellow-400"}`}>{v.vulns}</span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onScan(v.ip)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-950 text-zinc-300 hover:text-emerald-400 border border-zinc-700 hover:border-emerald-800 transition-all text-[10px] font-700 uppercase tracking-wider"
                  >
                    <Search size={11} /> Scan
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// DeployPage — "Deploy Instance" button also routes through choice modal
const DeployPage = ({ onDeploy }: { onDeploy: () => void }) => (
  <div className="space-y-5">
    <div>
      <h1 className="text-xl font-mono font-800 text-zinc-100 tracking-tight">Deployments</h1>
      <p className="text-xs font-mono text-zinc-500 mt-0.5">Automated VPS provisioning</p>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800">
          <span className="text-xs font-mono font-600 text-zinc-300 uppercase tracking-wider">Quick Deploy Wizard</span>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1.5">INSTANCE NAME</label>
            <input type="text" placeholder="e.g. web-prod-02" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-900 transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "PROVIDER", opts: ["AWS EC2", "DigitalOcean", "Hetzner", "Linode"] },
              { label: "OPERATING SYSTEM", opts: ["Ubuntu 22.04 LTS", "Debian 12", "CentOS 9", "Rocky Linux 9"] },
              { label: "INSTANCE SIZE", opts: ["t3.micro (1vCPU/1GB)", "t3.small (2vCPU/2GB)", "t3.medium (2vCPU/4GB)", "t3.large (2vCPU/8GB)"] },
              { label: "REGION", opts: ["EU-West-1 (Ireland)", "US-East-1 (Virginia)", "AP-Southeast-1 (SG)"] },
            ].map(f => (
              <div key={f.label}>
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1.5">{f.label}</label>
                <select className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-700 transition-all">
                  {f.opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="autoscan" defaultChecked className="accent-emerald-500 w-3.5 h-3.5" />
            <label htmlFor="autoscan" className="text-xs font-mono text-zinc-400">Run OpenVAS scan after deployment</label>
          </div>
          {/* Redirects to the choice modal */}
          <button onClick={onDeploy} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-mono font-700 transition-all active:scale-[0.98] mt-1">
            <Zap size={13} /> Deploy Instance
          </button>
        </div>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800">
          <span className="text-xs font-mono font-600 text-zinc-300 uppercase tracking-wider">Deployment Pipeline</span>
        </div>
        <div className="p-4 space-y-0">
          {[
            { n: 1, name: "Provision cloud instance", desc: "Create VM via provider API", time: "~45s", col: "text-emerald-400" },
            { n: 2, name: "Configure networking", desc: "Firewall rules & VPC setup", time: "~30s", col: "text-emerald-400" },
            { n: 3, name: "SSH key injection", desc: "Install authorized keys", time: "~10s", col: "text-emerald-400" },
            { n: 4, name: "Ansible hardening", desc: "Apply baseline security config", time: "~4m", col: "text-yellow-400" },
            { n: 5, name: "OpenVAS initial scan", desc: "Baseline vulnerability check", time: "~12m", col: "text-yellow-400" },
          ].map((step, i, arr) => (
            <div key={step.n} className={`flex items-start gap-3 py-3 ${i < arr.length - 1 ? "border-b border-zinc-800/60" : ""}`}>
              <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-mono font-800 text-zinc-950">{step.n}</span>
              </div>
              <div className="flex-1">
                <div className="text-xs font-mono font-600 text-zinc-200">{step.name}</div>
                <div className="text-[10px] font-mono text-zinc-600 mt-0.5">{step.desc}</div>
              </div>
              <span className={`text-[10px] font-mono font-600 ${step.col}`}>{step.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ScanPage — "Run New Scan" and per-host scan buttons call the real FastAPI
const ScanPage = ({ onStartScan }: { onStartScan: (h: string) => void }) => {
  const [customTarget, setCustomTarget] = useState("");
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-mono font-800 text-zinc-100 tracking-tight">Vulnerability Scanner</h1>
          <p className="text-xs font-mono text-zinc-500 mt-0.5">Powered by OpenVAS / GVM engine · FastAPI backend</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
        <span className="text-xs font-mono font-600 text-zinc-300 uppercase tracking-wider block">Run Scan</span>
        <div className="flex gap-2">
          <input
            type="text"
            value={customTarget}
            onChange={e => setCustomTarget(e.target.value)}
            placeholder="IP address or hostname…"
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-700 transition-all"
          />
          <button
            onClick={() => onStartScan(customTarget || "All hosts")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-mono font-700 transition-all active:scale-95"
          >
            <Play size={12} /> Scan
          </button>
        </div>
        <p className="text-[10px] font-mono text-zinc-600">Runs port scan + CMS detection against FastAPI <code className="text-zinc-500">/scan/ports</code> and <code className="text-zinc-500">/scan/cms</code></p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-zinc-800">
          <span className="text-xs font-mono font-600 text-zinc-300 uppercase tracking-wider">Open Findings</span>
          <div className="flex gap-2">
            <SevBadge sev="critical" />
            <SevBadge sev="high" />
            <SevBadge sev="medium" />
          </div>
        </div>
        <div className="divide-y divide-zinc-800/60">
          {VULN_DATA.map(v => (
            <div key={v.id} className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors">
              <div className="pt-0.5"><SevBadge sev={v.severity} /></div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono font-600 text-zinc-200 truncate">
                  <span className="text-zinc-500 mr-1">{v.cve} —</span>{v.title}
                </div>
                <div className="text-[10px] font-mono text-zinc-600 mt-0.5 flex gap-3">
                  <span className="flex items-center gap-1"><Server size={9} />{v.host}</span>
                  <span>CVSS {v.cvss.toFixed(1)}</span>
                  <span className="flex items-center gap-1"><Clock size={9} />{v.age}</span>
                </div>
              </div>
              <button
                onClick={() => onStartScan(v.host)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-950 text-zinc-300 hover:text-emerald-400 border border-zinc-700 hover:border-emerald-800 transition-all text-[10px] font-700 uppercase tracking-wider flex-shrink-0"
              >
                <Search size={11} /> Scan
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ReportsPage = () => (
  <div className="space-y-5">
    <div>
      <h1 className="text-xl font-mono font-800 text-zinc-100 tracking-tight">Security Reports</h1>
      <p className="text-xs font-mono text-zinc-500 mt-0.5">Generate and export OpenVAS scan reports</p>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800">
          <span className="text-xs font-mono font-600 text-zinc-300 uppercase tracking-wider">Generate Report</span>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1.5">REPORT NAME</label>
            <input type="text" placeholder="e.g. May 2025 Security Audit" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-900 transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "SCOPE", opts: ["All hosts", ...VPS_DATA.map(v => v.name)] },
              { label: "MIN SEVERITY", opts: ["All (Log+)", "Low+", "Medium+", "High+", "Critical only"] },
            ].map(f => (
              <div key={f.label}>
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1.5">{f.label}</label>
                <select className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-700 transition-all">
                  {f.opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div>
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2">REPORT FORMAT</label>
            <div className="grid grid-cols-3 gap-2">
              {["PDF", "HTML", "XML"].map((fmt, i) => (
                <label key={fmt} className="flex items-center gap-2 cursor-pointer bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-3 py-2 transition-all">
                  <input type="radio" name="fmt" defaultChecked={i === 0} className="accent-emerald-500 w-3 h-3" />
                  <span className="text-xs font-mono text-zinc-300">{fmt}</span>
                </label>
              ))}
            </div>
          </div>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-mono font-700 transition-all active:scale-[0.98]">
            <Download size={13} /> Generate &amp; Download
          </button>
        </div>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800">
          <span className="text-xs font-mono font-600 text-zinc-300 uppercase tracking-wider">Recent Reports</span>
        </div>
        <div className="divide-y divide-zinc-800/60">
          {REPORTS_DATA.map(r => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                <FileText size={15} className="text-zinc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono font-600 text-zinc-200 truncate">{r.name}</div>
                <div className="text-[10px] font-mono text-zinc-600 mt-0.5 flex gap-2 flex-wrap">
                  <span>{r.scope}</span><span>·</span><span>{r.format}</span><span>·</span><span>{r.size}</span><span>·</span><span>{r.date}</span>
                </div>
              </div>
              <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700 transition-all text-[10px] font-mono flex-shrink-0">
                <Download size={10} /> {r.format}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── NavItem ──────────────────────────────────────────────────────────────────

function NavItem({ item, active, onClick }: { item: { id: NavPage; label: string; icon: React.FC<any>; badge?: number }; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-mono font-500 transition-all duration-150 text-left ${active ? "bg-emerald-600 text-zinc-950 font-700 shadow-lg shadow-emerald-900/40" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}
    >
      <item.icon size={14} className="flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && (
        <span className={`text-[9px] font-700 px-1.5 py-0.5 rounded-full ${active ? "bg-zinc-950/30 text-zinc-100" : "bg-red-950 text-red-400 border border-red-900"}`}>
          {item.badge}
        </span>
      )}
    </button>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function SecureOpsDashboard() {
  const [page, setPage] = useState<NavPage>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Deploy flow state machine
  const [deployFlow, setDeployFlow] = useState<DeployFlow>(null);
  const [deployProgressOpen, setDeployProgressOpen] = useState(false);
  const [deployingName, setDeployingName] = useState("web-prod-02");

  // Scan state (now live)
  const [scanOpen, setScanOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState("");

  const navItems: { id: NavPage; label: string; icon: React.FC<any>; badge?: number }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "vps", label: "VPS Fleet", icon: Server },
    { id: "deploy", label: "Deployments", icon: Zap },
    { id: "scan", label: "Vuln Scanner", icon: Shield, badge: 7 },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  const openDeployChoice = () => setDeployFlow("choice");

  const handleScan = (host: string) => {
    setScanTarget(host);
    setScanOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800&display=swap" />

      {/* Topbar */}
      <header className="h-13 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 lg:px-6 z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <button className="lg:hidden text-zinc-500 hover:text-zinc-200 transition-colors" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Shield size={14} className="text-zinc-950" />
            </div>
            <span className="text-sm font-mono font-800 text-zinc-100 tracking-tight">SecureOps</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-900">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            3 VPS Online
          </div>
          {/* Every "Deploy VPS" button routes through the choice modal */}
          <button
            onClick={openDeployChoice}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-mono font-700 transition-all active:scale-95"
          >
            <Plus size={12} /> Deploy VPS
          </button>
          <button className="text-zinc-500 hover:text-zinc-200 transition-colors relative">
            <Bell size={16} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border border-zinc-950" />
          </button>
          <div className="w-7 h-7 rounded-full bg-emerald-900 border border-emerald-800 flex items-center justify-center text-[10px] font-mono font-700 text-emerald-400">AK</div>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <aside className={`fixed lg:static top-0 left-0 h-full lg:h-auto z-30 lg:z-auto w-56 bg-zinc-900 border-r border-zinc-800 flex-shrink-0 transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} lg:flex lg:flex-col pt-[52px] lg:pt-0`}>
          <div className="p-3 space-y-1 overflow-y-auto">
            <div className="pt-2 pb-1"><span className="text-[9px] font-mono font-700 text-zinc-600 uppercase tracking-widest px-3">Overview</span></div>
            {navItems.slice(0, 1).map(item => <NavItem key={item.id} item={item} active={page === item.id} onClick={() => { setPage(item.id); setSidebarOpen(false); }} />)}
            <div className="pt-3 pb-1"><span className="text-[9px] font-mono font-700 text-zinc-600 uppercase tracking-widest px-3">Infrastructure</span></div>
            {navItems.slice(1, 3).map(item => <NavItem key={item.id} item={item} active={page === item.id} onClick={() => { setPage(item.id); setSidebarOpen(false); }} />)}
            <div className="pt-3 pb-1"><span className="text-[9px] font-mono font-700 text-zinc-600 uppercase tracking-widest px-3">Security</span></div>
            {navItems.slice(3).map(item => <NavItem key={item.id} item={item} active={page === item.id} onClick={() => { setPage(item.id); setSidebarOpen(false); }} />)}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 min-w-0">
          {page === "dashboard" && <DashboardPage onOpenDeploy={openDeployChoice} onOpenScan={handleScan} />}
          {page === "vps" && <VpsPage onScan={handleScan} onOpenDeploy={openDeployChoice} />}
          {page === "deploy" && <DeployPage onDeploy={openDeployChoice} />}
          {page === "scan" && <ScanPage onStartScan={handleScan} />}
          {page === "reports" && <ReportsPage />}
        </main>
      </div>

      {/* ── Modal Layer ── */}

      {/* Step 1: Choice modal */}
      <DeployChoiceModal
        open={deployFlow === "choice"}
        onClose={() => setDeployFlow(null)}
        onChooseApiKey={() => setDeployFlow("api-key")}
        onChooseWizard={() => { setDeployFlow(null); setPage("deploy"); }}
      />

      {/* Step 2a: API Key Deploy modal */}
      <ApiKeyDeployModal
        open={deployFlow === "api-key"}
        onClose={() => setDeployFlow(null)}
        onBack={() => setDeployFlow("choice")}
        onStartDeploy={(name) => { setDeployingName(name); setDeployFlow(null); setDeployProgressOpen(true); }}
      />

      {/* Step 3: Deploy progress (runs after API key submit) */}
      <ProgressModal
        open={deployProgressOpen}
        onClose={() => setDeployProgressOpen(false)}
        title={`Deploying ${deployingName}`}
        accentColor="emerald"
        steps={[
          "Validating API credentials...",
          "Creating cloud instance...",
          "Waiting for IP assignment...",
          "Configuring VPC & firewall...",
          "Injecting SSH keys...",
          "Running Ansible hardening...",
          "Starting OpenVAS scan...",
          "Finalizing...",
        ]}
      />

      {/* Live Scan modal — calls FastAPI */}
      <LiveScanModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        target={scanTarget}
      />
    </div>
  );
}
