import { useState } from "react";
import { Plus, Trash2, Edit, X, Check } from "lucide-react";

import { useApi, apiPost, apiPut, apiDelete } from "../hooks/useApi";
import type { Employee, EmployeeCreate } from "../types/api";
import LoadingSpinner from "../components/LoadingSpinner";

const EMPTY: EmployeeCreate = {
  name: "",
  email: "",
  department: "",
  team: "",
  role: "",
  copilot_enabled: true,
};

export default function Employees() {
  const { data: employees, loading, error, refetch } = useApi<Employee[]>("/api/employees");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<EmployeeCreate>({ ...EMPTY });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (editId) {
        await apiPut(`/api/employees/${editId}`, form);
      } else {
        await apiPost("/api/employees", form);
      }
      setShowForm(false);
      setEditId(null);
      setForm({ ...EMPTY });
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this employee and all their usage records?")) return;
    try {
      await apiDelete(`/api/employees/${id}`);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  };

  const startEdit = (emp: Employee) => {
    setForm({
      name: emp.name,
      email: emp.email,
      department: emp.department,
      team: emp.team,
      role: emp.role,
      copilot_enabled: emp.copilot_enabled,
    });
    setEditId(emp.id);
    setShowForm(true);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-msg">Error: {error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Employee Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            setForm({ ...EMPTY });
            setEditId(null);
            setShowForm(true);
          }}
        >
          <Plus size={18} /> Add Employee
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? "Edit Employee" : "Add Employee"}</h2>
              <button className="btn-icon" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@company.com"
                  type="email"
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="Engineering"
                />
              </div>
              <div className="form-group">
                <label>Team</label>
                <input
                  value={form.team}
                  onChange={(e) => setForm({ ...form, team: e.target.value })}
                  placeholder="Backend"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Software Engineer"
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.copilot_enabled}
                    onChange={(e) => setForm({ ...form, copilot_enabled: e.target.checked })}
                  />
                  Copilot Enabled
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                <Check size={18} /> {editId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Table */}
      <div className="chart-card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Team</th>
                <th>Role</th>
                <th>Copilot</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees?.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.id}</td>
                  <td className="font-medium">{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.department}</td>
                  <td>{emp.team}</td>
                  <td>{emp.role}</td>
                  <td>
                    <span className={`badge ${emp.copilot_enabled ? "badge-green" : "badge-red"}`}>
                      {emp.copilot_enabled ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon" onClick={() => startEdit(emp)} title="Edit">
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => handleDelete(emp.id)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
