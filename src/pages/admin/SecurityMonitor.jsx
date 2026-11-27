import { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Search,
  AlertTriangle,
  Ban,
  KeyRound,
  Activity,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../../services/supabase";

const SEVERITY_BADGES = {
  CRITICAL: "bg-rose-500/15 text-rose-500 border-rose-500/30",
  HIGH: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  MEDIUM: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  LOW: "bg-sky-500/15 text-sky-500 border-sky-500/30",
  INFO: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

function SecurityMonitor() {
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    criticalHigh: 0,
    blocked: 0,
    failedLogins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tableReady, setTableReady] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [daysFilter, setDaysFilter] = useState(30);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalMatched, setTotalMatched] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const limit = 20;

  const fetchSecurityEvents = useCallback(async () => {
    setLoading(true);
    setStatusMessage("");
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess?.session?.access_token;
      if (!token) {
        setStatusMessage("Admin authentication session required.");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        days: String(daysFilter),
      });
      if (severityFilter !== "ALL") {
        params.set("severity", severityFilter);
      }

      const res = await fetch(`/api/security?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatusMessage(data?.error || `Failed to load security telemetry (${res.status}).`);
        setLoading(false);
        return;
      }

      setTableReady(data.tableReady !== false);
      if (data.message) setStatusMessage(data.message);
      setEvents(Array.isArray(data.events) ? data.events : []);
      setTotalMatched(Number(data.totalMatched || 0));
      if (data.summary) setSummary(data.summary);
    } catch (err) {
      setStatusMessage(err?.message || "Unable to reach /api/security.");
    } finally {
      setLoading(false);
    }
  }, [page, daysFilter, severityFilter]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (active) {
        await fetchSecurityEvents();
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [fetchSecurityEvents]);

  const filteredEvents = events.filter((ev) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      String(ev.event_type || "").toLowerCase().includes(q) ||
      String(ev.endpoint || "").toLowerCase().includes(q) ||
      String(ev.source_ip || "").toLowerCase().includes(q) ||
      String(ev.detection_reason || "").toLowerCase().includes(q) ||
      String(ev.correlation_id || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(totalMatched / limit));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-500 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Application Security Monitoring</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Security Events &amp; Threat Radar
          </h1>
          <p className="text-xs opacity-70 mt-1">
            Server-side audit logs for brute-force logins, sensitive-path probes, API abuse, and unauthorized admin attempts.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSecurityEvents}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D6FF00] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#c5eb00] transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Refreshing..." : "Refresh Logs"}</span>
        </button>
      </div>

      {!tableReady && (
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold uppercase tracking-wider">Database Migration Pending</p>
            <p className="mt-1 opacity-90">
              {statusMessage || "Run frontend/supabase_security_events.sql in your Supabase SQL Editor to enable persistent security event storage."}
            </p>
          </div>
        </div>
      )}

      {tableReady && statusMessage && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-semibold">
          {statusMessage}
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between text-xs opacity-70 font-semibold">
            <span>Total Security Events</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black mt-2">{summary.total}</p>
          <p className="text-[11px] opacity-60 mt-1">Last {daysFilter} days</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between text-xs opacity-70 font-semibold">
            <span>Critical &amp; High Severity</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black mt-2 text-rose-400">{summary.criticalHigh}</p>
          <p className="text-[11px] opacity-60 mt-1">Telegram alerts triggered</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between text-xs opacity-70 font-semibold">
            <span>Blocked / Rejected Requests</span>
            <Ban className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black mt-2 text-amber-400">{summary.blocked}</p>
          <p className="text-[11px] opacity-60 mt-1">401 / 403 / 404 / 429 actions</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between text-xs opacity-70 font-semibold">
            <span>Failed Login / Brute-Force</span>
            <KeyRound className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-2xl font-black mt-2 text-orange-400">{summary.failedLogins}</p>
          <p className="text-[11px] opacity-60 mt-1">Auth threshold monitoring</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by event type, endpoint, IP, correlation ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-xs focus:outline-none focus:border-[#D6FF00]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={severityFilter}
            onChange={(e) => {
              setPage(1);
              setSeverityFilter(e.target.value);
            }}
            className="px-3 py-2.5 rounded-xl bg-black/20 border border-white/10 text-xs font-semibold"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
            <option value="INFO">INFO</option>
          </select>

          <select
            value={daysFilter}
            onChange={(e) => {
              setPage(1);
              setDaysFilter(Number(e.target.value));
            }}
            className="px-3 py-2.5 rounded-xl bg-black/20 border border-white/10 text-xs font-semibold"
          >
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 uppercase tracking-wider text-[10px] opacity-60">
              <tr>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Event Type</th>
                <th className="py-3.5 px-4">Endpoint</th>
                <th className="py-3.5 px-4">Source IP</th>
                <th className="py-3.5 px-4">Action Taken</th>
                <th className="py-3.5 px-4">Time</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center opacity-60">
                    Loading security telemetry...
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center opacity-60">
                    No security events recorded for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-bold ${
                          SEVERITY_BADGES[ev.severity] || SEVERITY_BADGES.INFO
                        }`}
                      >
                        {ev.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold">{ev.event_type}</td>
                    <td className="py-3 px-4 font-mono opacity-80 max-w-[200px] truncate">
                      {ev.endpoint}
                    </td>
                    <td className="py-3 px-4 font-mono opacity-80">
                      {ev.source_ip || "unavailable"}
                    </td>
                    <td className="py-3 px-4 opacity-90">{ev.action_taken}</td>
                    <td className="py-3 px-4 opacity-70 whitespace-nowrap">
                      {ev.created_at ? new Date(ev.created_at).toLocaleString() : "-"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedEvent(ev)}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 text-xs">
          <span className="opacity-70">
            Page {page} of {totalPages} ({totalMatched} events)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-white/10 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-white/10 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sanitized Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#121215] text-white p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-mono">{selectedEvent.event_type}</h3>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <p><span className="opacity-60">Correlation ID:</span> <code>{selectedEvent.correlation_id}</code></p>
              <p><span className="opacity-60">Severity:</span> <b>{selectedEvent.severity}</b></p>
              <p><span className="opacity-60">Source IP:</span> <code>{selectedEvent.source_ip || "unavailable"}</code></p>
              <p><span className="opacity-60">Endpoint:</span> <code>{selectedEvent.endpoint}</code></p>
              <p><span className="opacity-60">Detection Reason:</span> {selectedEvent.detection_reason}</p>
              <p><span className="opacity-60">Action Taken:</span> {selectedEvent.action_taken}</p>
              <p><span className="opacity-60">Timestamp:</span> {new Date(selectedEvent.created_at).toISOString()}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider opacity-60 font-bold mb-1">
                Sanitized Metadata
              </p>
              <pre className="p-3 rounded-xl bg-black/50 border border-white/10 text-[11px] overflow-x-auto">
                {JSON.stringify(selectedEvent.event_details || {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SecurityMonitor;
