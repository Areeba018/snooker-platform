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

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    // Handle different date formats from the database
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Date formatting error:', error, 'for date:', dateString);
    return 'Invalid Date';
  }
};

// --- Member Management Component (Registration + List) ---
const MemberManagement = () => {
  // Registration form state
  const [formData, setFormData] = useState({
    name: '',
    contact_number: '',
    customer_type: 'member',
    rate_type: '',
    rate_amount: '',
    discount: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Members list state
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState('');
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [rateTypeFilter, setRateTypeFilter] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Fetch members
  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:8000/customers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      const data = await response.json();
      setMembers(data);
      setFilteredMembers(data);
    } catch (err) {
      setMembersError(err.message);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Filter and sort members
  useEffect(() => {
    let filtered = members.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           member.contact_number.includes(searchTerm);
      const matchesRateType = !rateTypeFilter || member.rate_type === rateTypeFilter;
      const matchesCustomerType = !customerTypeFilter || member.customer_type === customerTypeFilter;
      return matchesSearch && matchesRateType && matchesCustomerType;
    });

    // Sort members
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredMembers(filtered);
  }, [members, searchTerm, rateTypeFilter, customerTypeFilter, sortBy, sortOrder]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          rate_amount: parseFloat(formData.rate_amount) || 0,
          discount: parseFloat(formData.discount) || 0,
        })
      });

      if (response.status === 201) {
        const result = await response.json();
        setMessage(`Member ${result.name} registered successfully!`);
        setFormData({ name: '', contact_number: '', customer_type: 'member', rate_type: '', rate_amount: '', discount: '' });
        // Refresh the members list
        fetchMembers();
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

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="member-management-page">
      {/* Registration Form Section */}
      <div className="registration-section">
        <div className="registration-card">
          <div className="card-header">
            <h2>Register New Member</h2>
            <p>Add a new member to the snooker club</p>
          </div>
          
          <form className="clean-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field full-width">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="Enter member's full name" 
                  required 
                />
              </div>
              
              <div className="form-field full-width">
                <label>Contact Number *</label>
                <input 
                  type="text" 
                  name="contact_number" 
                  value={formData.contact_number} 
                  onChange={handleChange} 
                  placeholder="Enter contact number" 
                  required 
                />
              </div>
              
              <div className="form-field">
                <label>Rate Type *</label>
                <select name="rate_type" value={formData.rate_type} onChange={handleChange} required>
                  <option value="">Select Rate Type</option>
                  <option value="hourly">Hourly</option>
                  <option value="30min">30 Minutes</option>
                  <option value="time played">Time Played</option>
                </select>
              </div>
              
              <div className="form-field">
                <label>Rate Amount *</label>
                <input 
                  type="number" 
                  name="rate_amount" 
                  value={formData.rate_amount} 
                  onChange={handleChange} 
                  placeholder="0.00" 
                  min="0" 
                  step="0.01" 
                  required 
                />
              </div>
              
              <div className="form-field full-width">
                <label>Discount (%)</label>
                <input 
                  type="number" 
                  name="discount" 
                  value={formData.discount} 
                  onChange={handleChange} 
                  placeholder="0.0" 
                  min="0" 
                  max="100" 
                  step="0.1" 
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button className="register-btn" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Registering...
                  </>
                ) : (
                  'Register Member'
                )}
              </button>
            </div>
          </form>
          
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}
        </div>
      </div>

      {/* Members List Section */}
      <div className="members-list-section">
        <div className="members-card">
          <div className="card-header">
            <div className="header-content">
              <h2>Members Directory</h2>
              <span className="member-count">{filteredMembers.length} members</span>
            </div>
            
            <div className="filters-row">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="filter-controls">
                
                
                <select
                  value={rateTypeFilter}
                  onChange={(e) => setRateTypeFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Rates</option>
                  <option value="hourly">Hourly</option>
                  <option value="30min">30 Minutes</option>
                  <option value="time played">Time Played</option>
                </select>
              </div>
            </div>
          </div>

          <div className="table-wrapper">
            {membersLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <span>Loading members...</span>
              </div>
            ) : membersError ? (
              <div className="alert alert-error">{membersError}</div>
            ) : (
              <div className="table-container">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('name')} className="sortable">
                        Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('contact_number')} className="sortable">
                        Contact {sortBy === 'contact_number' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('customer_type')} className="sortable">
                        Type {sortBy === 'customer_type' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('rate_type')} className="sortable">
                        Rate Type {sortBy === 'rate_type' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('rate_amount')} className="sortable">
                        Rate {sortBy === 'rate_amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('discount')} className="sortable">
                        Discount {sortBy === 'discount' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="empty-state">
                          <div className="empty-content">
                            <span className="empty-icon">👥</span>
                            <h3>No members found</h3>
                            <p>{searchTerm || rateTypeFilter || customerTypeFilter ? 'Try adjusting your filters' : 'Start by registering your first member'}</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map(member => (
                        <tr key={member.id}>
                          <td className="name-cell">
                            <div className="member-info">
                              <span className="member-name">{member.name}</span>
                            </div>
                          </td>
                          <td className="contact-cell">{member.contact_number}</td>
                          <td>
                            <span className={`type-badge ${member.customer_type}`}>
                              {member.customer_type === 'member' ? 'Member' : 'Guest'}
                            </span>
                          </td>
                          <td>
                            <span className={`rate-badge ${member.rate_type === '30min' ? 'min30' : member.rate_type === 'time played' ? 'time-played' : member.rate_type}`}>
                              {member.rate_type === '30min' ? '30 Min' : 
                               member.rate_type === 'hourly' ? 'Hourly' : 
                               member.rate_type === 'time played' ? 'Time Played' : member.rate_type}
                            </span>
                          </td>
                          <td className="amount-cell">${member.rate_amount.toFixed(2)}</td>
                          <td className="discount-cell">{member.discount.toFixed(1)}%</td>
                          <td className="date-cell">
                            {formatDate(member.created_at)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
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
        const token = localStorage.getItem('adminToken');
        const response = await fetch('http://localhost:8000/customers', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('adminToken');
      if (token) {
        try {
          const response = await fetch('http://localhost:8000/admin/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            setIsAdmin(true);
          } else {
            localStorage.removeItem('adminToken');
          }
        } catch (error) {
          localStorage.removeItem('adminToken');
        }
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  // Admin login handler
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminLoginError('');

    const formData = new FormData();
    formData.append('username', 'admin');
    formData.append('password', 'admin123');

    try {
      const response = await fetch('http://localhost:8000/admin/login', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('adminToken', data.access_token);
        setIsAdmin(true);
      } else {
        const errorData = await response.json();
        setAdminLoginError(errorData.detail || 'Login failed');
      }
    } catch (error) {
      setAdminLoginError('Connection error. Please check if the server is running.');
    } finally {
      setAdminLoading(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAdmin(false);
    setDashboardView('home');
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
          {dashboardView === 'register' && <MemberManagement />}
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

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {isAdmin ? renderDashboard() : renderLogin()}
    </div>
  );
}

export default App;
