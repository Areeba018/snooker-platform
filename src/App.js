import React, { useState, useEffect } from 'react';
import './App.css';
import {
  FiGrid,
  FiUserPlus,
  FiUsers,
  FiPlayCircle,
  FiTable,
  FiFileText,
  FiDollarSign,
  FiLogOut,
  FiMenu,
  FiX
} from 'react-icons/fi';

// --- Reusable Form Component for Registration ---
const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    contact_number: '',
    rate_type: '',
    rate_amount: '',
    discount: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...formData,
            rate_amount: parseFloat(formData.rate_amount) || 0,
            discount: parseFloat(formData.discount) || 0,
        })
      });

      if (response.status === 201) {
        const result = await response.json();
        setMessage(`Member ${result.name} registered successfully!`);
        setFormData({ name: '', contact_number: '', rate_type: '', rate_amount: '', discount: '' });
      } else if (response.status === 409) {
        const errorData = await response.json();
        setError(errorData.detail || 'This member already exists.');
      } else {
        const errorData = await response.json();
        setError(`Failed to register member: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      setError('An error occurred. Please check the server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>Member Registration</h2>
      <form className="form-layout" onSubmit={handleSubmit}>
        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" required />
        <input type="text" name="contact_number" value={formData.contact_number} onChange={handleChange} placeholder="Contact Number" required />
        <select name="rate_type" value={formData.rate_type} onChange={handleChange} required>
          <option value="">Select Rate Type</option>
          <option value="hourly">Hourly</option>
          <option value="30min">30 Minutes</option>
          <option value="custom">Time Played</option>
        </select>
        <input type="number" name="rate_amount" value={formData.rate_amount} onChange={handleChange} placeholder="Rate Amount" min="0" step="0.01" required />
        <input type="number" name="discount" value={formData.discount} onChange={handleChange} placeholder="Discount (%)" min="0" max="100" step="0.01" />
        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register Member'}
        </button>
      </form>
      {message && <div className="success-msg">{message}</div>}
      {error && <div className="error-msg">{error}</div>}
    </section>
  );
};

// --- New Component for Displaying Players ---
const PlayersList = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
  
    useEffect(() => {
      const fetchPlayers = async () => {
        try {
          const response = await fetch('http://localhost:8000/customers');
          if (!response.ok) {
            throw new Error('Failed to fetch players');
          }
          const data = await response.json();
          setPlayers(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
  
      fetchPlayers();
    }, []);
  
    if (loading) return <p>Loading players...</p>;
    if (error) return <p className="error-msg">{error}</p>;
  
    return (
      <section className="card">
        <h2>Registered Players</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact Number</th>
                <th>Rate Type</th>
                <th>Rate Amount</th>
                <th>Discount (%)</th>
              </tr>
            </thead>
            <tbody>
              {players.map(player => (
                <tr key={player.id}>
                  <td>{player.name}</td>
                  <td>{player.contact_number}</td>
                  <td>{player.rate_type}</td>
                  <td>{player.rate_amount.toFixed(2)}</td>
                  <td>{player.discount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  };
  

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [dashboardView, setDashboardView] = useState('home');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Admin login handler
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminLoginError('');
    setAdminLoading(true);
    setTimeout(() => {
      const username = e.target.elements[0].value;
      const password = e.target.elements[1].value;
      if (username === 'admin' && password === 'admin123') {
        setIsAdmin(true);
        setDashboardView('home');
      } else {
        setAdminLoginError('Invalid credentials. Please try again.');
      }
      setAdminLoading(false);
    }, 1000);
  };

  // Logout handler
  const handleLogout = () => {
    setIsAdmin(false);
    setAdminLoginError('');
  };

  // --- Dashboard ---
  const renderDashboard = () => (
    <div className={`dashboard-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Snooker Admin</h2>
        </div>
        <nav className="sidebar-nav">
          <button onClick={() => setDashboardView('home')} className={dashboardView === 'home' ? 'active' : ''}>
            <FiGrid /><span>Dashboard</span>
          </button>
          <button onClick={() => setDashboardView('register')} className={dashboardView === 'register' ? 'active' : ''}>
            <FiUserPlus /><span>Member Registration</span>
          </button>
          <button onClick={() => setDashboardView('startSession')} className={dashboardView === 'startSession' ? 'active' : ''}>
            <FiPlayCircle /><span>Start Session</span>
          </button>
          <button onClick={() => setDashboardView('customers')} className={dashboardView === 'customers' ? 'active' : ''}>
            <FiUsers /><span>players</span>
          </button>

          <button onClick={() => setDashboardView('tables')} className={dashboardView === 'tables' ? 'active' : ''}>
            <FiTable /><span>Snooker Tables</span>
          </button>
          <button onClick={() => setDashboardView('sessions')} className={dashboardView === 'sessions' ? 'active' : ''}>
            <FiDollarSign /><span>Billing</span>
          </button>
          <button onClick={() => setDashboardView('reports')} className={dashboardView === 'reports' ? 'active' : ''}>
            <FiFileText /><span>Reports</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout}><FiLogOut /><span>Logout</span></button>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
            <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                {isSidebarOpen ? <FiX /> : <FiMenu />}
            </button>
        </header>

        <div className="content-area">
          {dashboardView === 'home' && (
            <section className="card">
              <h2>Welcome, Admin!</h2>
              <p>Manage your snooker club using the menu on the left.</p>
            </section>
          )}
          {dashboardView === 'register' && <RegistrationForm />}
          {dashboardView === 'customers' && <PlayersList />}
          {dashboardView === 'startSession' && (
            <section className="card">
              <h2>Start Session</h2>
              <form className="form-layout">
                <div className="radio-group">
                    <label><input type="radio" name="sessionType" value="guest" defaultChecked /> Guest</label>
                    <label><input type="radio" name="sessionType" value="member" /> Member</label>
                </div>
                <input type="text" placeholder="Member Name (if applicable)" />
                <input type="text" placeholder="Table Number" required />
                <button className="primary-btn" type="submit">Start Session</button>
              </form>
            </section>
          )}
          {dashboardView === 'tables' && (
            <section className="card">
              <h2>Snooker Tables</h2>
              <p>Manage snooker table details here.</p>
            </section>
          )}
          {dashboardView === 'sessions' && (
            <section className="card">
              <h2>Sessions / Billing</h2>
              <p>Manage sessions and invoices here.</p>
            </section>
          )}
          {dashboardView === 'reports' && (
            <section className="card">
              <h2>Reports</h2>
              <p>View reports with filters (e.g., today’s players, total cost, etc.).</p>
            </section>
          )}
        </div>
      </main>
    </div>
  );

  // --- Login Page ---
  const renderLogin = () => (
    <div className="login-page-wrapper">
      <div className="login-content">
        <h1 className="login-page-title">Snooker Club Billing System</h1>
        <div className="login-card">
          <img src="/dashboard-img.jpg" alt="Snooker illustration" className="login-card-img" />
          <h2>Admin Login</h2>
          <p>Please sign in to continue</p>
          <form className="form-layout" onSubmit={handleAdminLogin}>
            <input type="text" placeholder="Username (admin)" required />
            <input type="password" placeholder="Password (admin123)" required />
            <button className="primary-btn" type="submit" disabled={adminLoading}>
              {adminLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          {adminLoginError && <div className="error-msg">{adminLoginError}</div>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      {isAdmin ? renderDashboard() : renderLogin()}
    </div>
  );
}

export default App;
