import { useEffect, useState } from "react";
import api from "./api";
import "./index.css";

export default function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("token")
  );
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    dueDate: ""
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!token) return;

    async function loadDashboard() {
      try {
        const [profileResponse, taskResponse] = await Promise.all([
          api.get("/auth/me"),
          api.get("/tasks")
        ]);

        setUser(profileResponse.data);
        setTasks(taskResponse.data);
      } catch (err) {
        if (err.response?.status === 401 ||
            err.response?.status === 404) {
          logout();
        } else {
          setError("Could not load dashboard. Check the server.");
        }
      }
    }

    loadDashboard();
  }, [token]);

 
async function handleAuth(event) {
  event.preventDefault();

  setError("");
  setNotice("");
  setLoading(true);

  try {
    const endpoint =
      mode === "login"
        ? "/auth/login"
        : "/auth/register";

    const payload = {
      email: form.email.trim().toLowerCase(),
      password: form.password
    };

    if (mode === "register") {
      payload.name = form.name.trim();
    }

    const response = await api.post(endpoint, payload);

    if (!response.data.token) {
      throw new Error("Token not received from server");
    }

    localStorage.setItem("token", response.data.token);

    setUser(response.data.user);
    setToken(response.data.token);

    setForm({
      name: "",
      email: "",
      password: ""
    });

    setNotice(response.data.message || "Authentication successful");

  } catch (err) {
    console.error("Authentication error:", err);

    if (err.response) {
      setError(
        err.response.data?.message ||
        `Server error: ${err.response.status}`
      );
    } else if (err.request) {
      setError(
        "Cannot connect to backend. Check your backend server and CORS settings."
      );
    } else {
      setError(err.message || "Something went wrong");
    }

  } finally {
    setLoading(false);
  }
}


  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setTasks([]);
    setEditingId(null);
    setError("");
    setNotice("");
  }

  async function refreshTasks() {
    const response = await api.get("/tasks");
    setTasks(response.data);
  }

  async function saveTask(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    try {
      const payload = {
        ...taskForm,
        dueDate: taskForm.dueDate || null
      };

      if (editingId) {
        await api.put(`/tasks/${editingId}`, payload);
        setNotice("Task updated successfully");
      } else {
        await api.post("/tasks", payload);
        setNotice("Task created successfully");
      }

      setTaskForm({
        title: "",
        description: "",
        priority: "Medium",
        dueDate: ""
      });
      setEditingId(null);
      await refreshTasks();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save task");
    }
  }

  function startEdit(task) {
    setEditingId(task._id);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      dueDate: task.dueDate
        ? task.dueDate.slice(0, 10)
        : ""
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setTaskForm({
      title: "",
      description: "",
      priority: "Medium",
      dueDate: ""
    });
  }

  async function toggleTask(task) {
    try {
      await api.put(`/tasks/${task._id}`, {
        status: task.status === "Completed"
          ? "Pending"
          : "Completed"
      });
      await refreshTasks();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update task");
    }
  }

  async function deleteTask(id) {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      await api.delete(`/tasks/${id}`);
      setTasks((current) => current.filter((task) => task._id !== id));
      setNotice("Task deleted successfully");

      if (editingId === id) cancelEdit();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete task");
    }
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      `${task.title} ${task.description}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus =
      status === "All" || task.status === status;

    return matchesSearch && matchesStatus;
  });

  const completedCount = tasks.filter(
    (task) => task.status === "Completed"
  ).length;

  const pendingCount = tasks.length - completedCount;

  if (!token) {
    return (
      <main className="auth-page">
        <form className="auth-card" onSubmit={handleAuth}>
          <div className="brand">TaskFlow</div>
          <h1>{mode === "login" ? "Welcome back" : "Create account"}</h1>
          <p className="muted">
            {mode === "login"
              ? "Log in to manage your tasks."
              : "Create your account to get started."}
          </p>

          {mode === "register" && (
            <label>
              Full name
              <input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                required
                minLength={2}
                autoComplete="name"
                placeholder="Your name"
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              required
              minLength={mode === "register" ? 8 : undefined}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              placeholder="At least 8 characters"
            />
          </label>

          {error && <p className="message error">{error}</p>}
          {notice && <p className="message success">{notice}</p>}

          <button className="primary full" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login" ? "Log in" : "Register"}
          </button>

          <p className="switch-text">
            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}
            {" "}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
                setNotice("");
              }}
            >
              {mode === "login" ? "Register" : "Log in"}
            </button>
          </p>
        </form>
      </main>
    );
  }

  return (
    <main className="app-page">
      <header className="topbar">
        <div className="brand">TaskFlow</div>
        <div className="user-area">
          <span>{user?.name || "My account"}</span>
          <button className="secondary" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <section className="dashboard">
        <div className="welcome">
          <div>
            <p className="eyebrow">YOUR WORKSPACE</p>
            <h1>My Tasks</h1>
            <p className="muted">Plan your day. Get things done.</p>
          </div>
        </div>

        <div className="stats">
          <article className="stat-card">
            <span>Total tasks</span>
            <strong>{tasks.length}</strong>
          </article>
          <article className="stat-card">
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </article>
          <article className="stat-card">
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </article>
        </div>

        <section className="panel">
          <h2>{editingId ? "Edit task" : "Create a task"}</h2>

          <form className="task-form" onSubmit={saveTask}>
            <label>
              Task title
              <input
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, title: e.target.value })
                }
                maxLength={120}
                placeholder="e.g. Practice React hooks"
                required
              />
            </label>

            <label>
              Description
              <textarea
                value={taskForm.description}
                onChange={(e) =>
                  setTaskForm({
                    ...taskForm,
                    description: e.target.value
                  })
                }
                maxLength={1000}
                placeholder="Add some details..."
                rows={3}
              />
            </label>

            <div className="form-row">
              <label>
                Priority
                <select
                  value={taskForm.priority}
                  onChange={(e) =>
                    setTaskForm({
                      ...taskForm,
                      priority: e.target.value
                    })
                  }
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </label>

              <label>
                Due date
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) =>
                    setTaskForm({
                      ...taskForm,
                      dueDate: e.target.value
                    })
                  }
                />
              </label>
            </div>

            <div className="form-actions">
              <button className="primary">
                {editingId ? "Save changes" : "Add task"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {error && <p className="message error">{error}</p>}
        {notice && <p className="message success">{notice}</p>}

        <section className="list-section">
          <div className="list-heading">
            <div>
              <h2>My task list</h2>
              <p className="muted">{filteredTasks.length} tasks shown</p>
            </div>
          </div>

          <div className="filters">
            <input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option>All</option>
              <option>Pending</option>
              <option>Completed</option>
            </select>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="empty">
              <h3>No tasks found</h3>
              <p>Create a task or change your search filters.</p>
            </div>
          ) : (
            <div className="task-list">
              {filteredTasks.map((task) => (
                <article className="task-card" key={task._id}>
                  <div className="task-main">
                    <label className="task-check">
                      <input
                        type="checkbox"
                        checked={task.status === "Completed"}
                        onChange={() => toggleTask(task)}
                      />
                      <span className={
                        task.status === "Completed" ? "done" : ""
                      }>
                        {task.title}
                      </span>
                    </label>

                    {task.description && (
                      <p className="task-description">
                        {task.description}
                      </p>
                    )}

                    <div className="task-meta">
                      <span className={`priority ${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                      <span className={`status ${task.status.toLowerCase()}`}>
                        {task.status}
                      </span>
                      {task.dueDate && (
                        <span>
                          Due: {task.dueDate.slice(0, 10)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="task-actions">
                    <button
                      className="secondary"
                      onClick={() => startEdit(task)}
                    >
                      Edit
                    </button>
                    <button
                      className="danger"
                      onClick={() => deleteTask(task._id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

