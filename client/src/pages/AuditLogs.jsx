import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield, Filter, Search, Activity, AlertTriangle, User, Clock3 } from 'lucide-react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import PageHero from '../components/PageHero';
import ChartPanel from '../components/ChartPanel';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filterAction, setFilterAction] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data } = await adminAPI.getAuditLogs();
      setLogs(data);
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const actions = [...new Set(logs.map((log) => log.action))];

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesAction = !filterAction || log.action === filterAction;
      const matchesUser =
        !filterUser ||
        (log.userId?.name || '').toLowerCase().includes(filterUser.toLowerCase()) ||
        (log.userId?.role || '').toLowerCase().includes(filterUser.toLowerCase());

      return matchesAction && matchesUser;
    });
  }, [filterAction, filterUser, logs]);

  const destructiveActions = logs.filter((log) => log.action?.includes('DELETE')).length;
  const resetActions = logs.filter((log) => log.action?.includes('RESET')).length;
  const recentActor = logs[0]?.userId?.name || 'No recent user';
  const recentTimestamp = logs[0]?.timestamp;

  const getActionColor = (action = '') => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (action.includes('UPDATE') || action.includes('RESET')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Audit Command"
        title="Monitor admin activity from a cleaner and more actionable audit workspace."
        description="Track system events, isolate risky actions, and review recent operators with a stronger 2026-style admin layout."
        highlights={[
          { label: 'Total Logs', value: logs.length },
          { label: 'Filtered', value: filteredLogs.length },
          { label: 'Delete Events', value: destructiveActions },
          { label: 'Recent Actor', value: recentActor },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card bg-gradient-to-br from-blue-50/80 to-white p-5 dark:from-blue-900/10 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Activity Volume</p>
              <p className="mt-2 text-3xl font-black text-blue-600">{logs.length}</p>
            </div>
            <Activity className="h-5 w-5 text-blue-500" />
          </div>
        </div>
        <div className="glass-card bg-gradient-to-br from-amber-50/80 to-white p-5 dark:from-amber-900/10 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Delete Events</p>
              <p className="mt-2 text-3xl font-black text-amber-600">{destructiveActions}</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
        </div>
        <div className="glass-card bg-gradient-to-br from-violet-50/80 to-white p-5 dark:from-violet-900/10 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Reset Actions</p>
              <p className="mt-2 text-3xl font-black text-violet-600">{resetActions}</p>
            </div>
            <Shield className="h-5 w-5 text-violet-500" />
          </div>
        </div>
        <div className="glass-card bg-gradient-to-br from-emerald-50/80 to-white p-5 dark:from-emerald-900/10 dark:to-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Latest Event</p>
              <p className="mt-2 text-sm font-bold text-emerald-600">
                {recentTimestamp ? new Date(recentTimestamp).toLocaleString() : 'No recent activity'}
              </p>
            </div>
            <Clock3 className="h-5 w-5 text-emerald-500" />
          </div>
        </div>
      </div>

      <ChartPanel title="Audit Filters" subtitle="Narrow the event stream by action type or actor for faster review.">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
          <div>
            <label className="mb-2 block text-sm font-medium">Action Type</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full rounded-lg bg-gray-100 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
            >
              <option value="">All Actions</option>
              {actions.map((action) => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Actor Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                placeholder="Search by user name or role..."
                className="w-full rounded-lg bg-gray-100 py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              />
            </div>
          </div>
        </div>
      </ChartPanel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ChartPanel title="Audit Signals" subtitle="Quick readings to help identify where closer review may be needed.">
          <div className="grid gap-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">Activity Focus</p>
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                {filteredLogs.length ? `${filteredLogs.length} logs currently match your filters.` : 'No logs match the current filters.'}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Use this view to isolate operational bursts or role-specific activity.</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 dark:border-amber-900/30 dark:bg-amber-900/10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">Risk Signal</p>
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                {destructiveActions > 0 ? `${destructiveActions} delete events recorded.` : 'No delete events recorded.'}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Delete activity is worth checking when system configuration changes feel unexpected.</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">Recent Operator</p>
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{recentActor}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {recentTimestamp ? `Most recent action at ${new Date(recentTimestamp).toLocaleString()}.` : 'No recent action available.'}
              </p>
            </div>
          </div>
        </ChartPanel>

        <ChartPanel title="Review Hints" subtitle="Simple reminders for stronger audit analysis.">
          <div className="grid gap-4">
            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60">
              <div className="flex items-start gap-3">
                <Filter className="mt-0.5 h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Filter first</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Start with `DELETE`, `RESET`, or `UPDATE` when investigating sensitive system changes.</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-5 w-5 text-violet-500" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Trace user patterns</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Search by actor name to reconstruct change sequences during incident review.</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/60">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 text-emerald-500" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Validate details</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">The details column surfaces the exact payload snapshot that was recorded for each event.</p>
                </div>
              </div>
            </div>
          </div>
        </ChartPanel>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold">Activity Logs ({filteredLogs.length})</h3>
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left">Timestamp</th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => (
                <motion.tr
                  key={log._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-semibold">{log.userId?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{log.userId?.role}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                    <code className="rounded bg-gray-100 px-2 py-1 dark:bg-gray-800">{JSON.stringify(log.details)}</code>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredLogs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500 dark:border-gray-700">
            No audit logs match the current filters.
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AuditLogs;
