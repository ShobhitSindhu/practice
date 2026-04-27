import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, CheckCircle, Clock, Code, TrendingUp, Users } from "lucide-react";

import { useApi } from "../hooks/useApi";
import type { DashboardOverview } from "../types/api";
import StatCard from "../components/StatCard";
import LoadingSpinner from "../components/LoadingSpinner";

const COLORS = ["#6366f1", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function Dashboard() {
  const { data, loading, error } = useApi<DashboardOverview>("/api/dashboard");

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-msg">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="dashboard">
      <h1 className="page-title">Copilot Usage Dashboard</h1>

      {/* KPI Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Employees"
          value={data.total_employees}
          subtitle={`${data.copilot_enabled_count} with Copilot enabled`}
          icon={<Users size={24} />}
          color="#6366f1"
        />
        <StatCard
          title="Suggestions Shown"
          value={data.total_suggestions_shown.toLocaleString()}
          icon={<Code size={24} />}
          color="#06b6d4"
        />
        <StatCard
          title="Suggestions Accepted"
          value={data.total_suggestions_accepted.toLocaleString()}
          icon={<CheckCircle size={24} />}
          color="#10b981"
        />
        <StatCard
          title="Acceptance Rate"
          value={`${data.overall_acceptance_rate}%`}
          icon={<TrendingUp size={24} />}
          color="#f59e0b"
        />
        <StatCard
          title="Active Hours"
          value={data.total_active_hours.toLocaleString()}
          icon={<Clock size={24} />}
          color="#8b5cf6"
        />
        <StatCard
          title="Lines Accepted"
          value={data.total_lines_accepted.toLocaleString()}
          icon={<Activity size={24} />}
          color="#ef4444"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="charts-row">
        <div className="chart-card wide">
          <h3>Daily Usage Trends</h3>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data.daily_trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="total_suggestions_shown"
                name="Shown"
                stroke="#6366f1"
                fill="#6366f180"
              />
              <Area
                type="monotone"
                dataKey="total_suggestions_accepted"
                name="Accepted"
                stroke="#10b981"
                fill="#10b98180"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-row">
        <div className="chart-card">
          <h3>Language Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.language_breakdown}
                dataKey="total_suggestions"
                nameKey="language"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ language, percent }) =>
                  `${language} ${(percent * 100).toFixed(0)}%`
                }
              >
                {data.language_breakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Department Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.department_summary}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="department" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="avg_acceptance_rate" name="Acceptance %" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="employee_count" name="Employees" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Employees Table */}
      <div className="chart-card wide">
        <h3>Employee Copilot Usage Summary</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Team</th>
                <th>Suggestions Shown</th>
                <th>Accepted</th>
                <th>Acceptance Rate</th>
                <th>Lines Accepted</th>
                <th>Active Hours</th>
              </tr>
            </thead>
            <tbody>
              {data.employee_summaries
                .sort((a, b) => b.avg_acceptance_rate - a.avg_acceptance_rate)
                .map((e) => (
                  <tr key={e.employee_id}>
                    <td className="font-medium">{e.employee_name}</td>
                    <td>{e.department}</td>
                    <td>{e.team}</td>
                    <td>{e.total_suggestions_shown.toLocaleString()}</td>
                    <td>{e.total_suggestions_accepted.toLocaleString()}</td>
                    <td>
                      <span
                        className={`badge ${
                          e.avg_acceptance_rate >= 60
                            ? "badge-green"
                            : e.avg_acceptance_rate >= 40
                            ? "badge-yellow"
                            : "badge-red"
                        }`}
                      >
                        {e.avg_acceptance_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td>{e.total_lines_accepted.toLocaleString()}</td>
                    <td>{(e.total_active_minutes / 60).toFixed(1)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
