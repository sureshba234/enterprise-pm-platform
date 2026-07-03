import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useGetProjectStatsQuery } from '../app/api';

const STATUS_COLORS: Record<string, string> = {
  TODO: '#64748b',
  IN_PROGRESS: '#3b82f6',
  REVIEW: '#f59e0b',
  DONE: '#22c55e',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#64748b',
  MEDIUM: '#3b82f6',
  HIGH: '#f59e0b',
  URGENT: '#ef4444',
};

export default function StatsPanel({ projectId }: { projectId: number }) {
  const { data: stats, isLoading } = useGetProjectStatsQuery(projectId);

  if (isLoading) return <p className="text-slate-500 text-sm">Loading stats...</p>;
  if (!stats) return null;

  const statusData = Object.entries(stats.status_counts).map(([name, value]) => ({ name, value }));
  const priorityData = Object.entries(stats.priority_counts).map(([name, value]) => ({ name, value }));

  return (
    <div className="mb-8">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-slate-400 mt-1">Total Tasks</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{stats.completion_rate}%</p>
          <p className="text-xs text-slate-400 mt-1">Completion Rate</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-red-400">{stats.overdue}</p>
          <p className="text-xs text-slate-400 mt-1">Overdue</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Status bar chart */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={statusData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#64748b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority pie chart */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={priorityData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={65}
                label={({ name, percent }) =>
                  percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                }
                labelLine={false}
              >
                {priorityData.map((entry) => (
                  <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#64748b'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}