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
  FiX,
  FiRefreshCw
} from 'react-icons/fi';
import { BiSync } from 'react-icons/bi';

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

  // Auto-hide success messages after 3 seconds
  useEffect(() => {
    if (message && message.includes('successfully')) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

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
              <div className="header-left">
                <h2>Members Directory</h2>
                <span className="member-count">{filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}</span>
              </div>
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
                
                <button className="btn-card-refresh" onClick={fetchMembers} disabled={membersLoading} title="Refresh Members">
                  <BiSync className={membersLoading ? 'spinning' : ''} />
                </button>
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

// --- Start Session Component ---
const StartSessionForm = () => {
  const [sessionType, setSessionType] = useState('guest');
  const [formData, setFormData] = useState({
    guestName: '',
    guestContact: '',
    memberName: '',
    tableId: ''
  });
  const [selectedMember, setSelectedMember] = useState(null);
  const [members, setMembers] = useState([]);
  const [tables, setTables] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch members and tables on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const headers = {
          'Authorization': `Bearer ${token}`
        };

        // Fetch members
        const membersResponse = await fetch('http://localhost:8000/customers', { headers });
        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          setMembers(membersData);
        }

        // Fetch available tables
        const tablesResponse = await fetch('http://localhost:8000/tables/available', { headers });
        if (tablesResponse.ok) {
          const tablesData = await tablesResponse.json();
          setTables(tablesData);
        } else {
          // If no tables exist, create sample tables
          const createResponse = await fetch('http://localhost:8000/tables/create-sample', {
            method: 'POST',
            headers
          });
          if (createResponse.ok) {
            // Fetch tables again after creating
            const newTablesResponse = await fetch('http://localhost:8000/tables/available', { headers });
            if (newTablesResponse.ok) {
              const newTablesData = await newTablesResponse.json();
              setTables(newTablesData);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please check server connection.');
      }
    };

    fetchData();
  }, []);

  // Filter members based on name input
  useEffect(() => {
    if (formData.memberName && sessionType === 'member') {
      const filtered = members.filter(member => 
        member.name.toLowerCase().includes(formData.memberName.toLowerCase())
      );
      setFilteredMembers(filtered);
      setShowMemberDropdown(filtered.length > 0 && formData.memberName.length > 0);
    } else {
      setFilteredMembers([]);
      setShowMemberDropdown(false);
    }
  }, [formData.memberName, members, sessionType]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear selected member if member name is changed
    if (name === 'memberName' && selectedMember) {
      setSelectedMember(null);
    }
  };

  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setFormData(prev => ({ ...prev, memberName: member.name }));
    setShowMemberDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const sessionData = {
        session_type: sessionType,
        table_id: parseInt(formData.tableId)
      };

      if (sessionType === 'guest') {
        sessionData.guest_name = formData.guestName;
        sessionData.guest_contact = formData.guestContact;
      } else {
        if (!selectedMember) {
          setError('Please select a valid member from the dropdown.');
          setLoading(false);
          return;
        }
        sessionData.customer_id = selectedMember.id;
      }

      const response = await fetch('http://localhost:8000/sessions/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sessionData)
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(`Session started successfully! Session ID: ${result.id}`);
        // Reset form
        setFormData({
          guestName: '',
          guestContact: '',
          memberName: '',
          tableId: ''
        });
        setSelectedMember(null);
        
        // Refresh available tables
        const tablesResponse = await fetch('http://localhost:8000/tables/available', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (tablesResponse.ok) {
          const tablesData = await tablesResponse.json();
          setTables(tablesData);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to start session');
      }
    } catch (err) {
      setError('An error occurred. Please check the server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="start-session-container">
      <div className="session-card">
        <div className="card-header">
          <h2>Start New Session</h2>
          <p>Begin a snooker session for a member or guest</p>
        </div>

        <form className="session-form" onSubmit={handleSubmit}>
          {/* Session Type Selection */}
          <div className="session-type-section">
            <label className="section-label">Session Type</label>
            <div className="radio-group">
              <label className={`radio-option ${sessionType === 'guest' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="sessionType"
                  value="guest"
                  checked={sessionType === 'guest'}
                  onChange={(e) => setSessionType(e.target.value)}
                />
                <span className="radio-label">Guest</span>
              </label>
              <label className={`radio-option ${sessionType === 'member' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="sessionType"
                  value="member"
                  checked={sessionType === 'member'}
                  onChange={(e) => setSessionType(e.target.value)}
                />
                <span className="radio-label">Member</span>
              </label>
            </div>
          </div>

          {/* Dynamic Form Fields */}
          <div className="form-fields">
            {sessionType === 'guest' ? (
              // Guest Form Fields
              <>
                <div className="form-field">
                  <label>Guest Name *</label>
                  <input
                    type="text"
                    name="guestName"
                    value={formData.guestName}
                    onChange={handleInputChange}
                    placeholder="Enter guest name"
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Contact Number *</label>
                  <input
                    type="text"
                    name="guestContact"
                    value={formData.guestContact}
                    onChange={handleInputChange}
                    placeholder="Enter contact number"
                    required
                  />
                </div>
              </>
            ) : (
              // Member Form Fields
              <>
                <div className="form-field member-search">
                  <label>Member Name *</label>
                  <div className="search-container">
                    <input
                      type="text"
                      name="memberName"
                      value={formData.memberName}
                      onChange={handleInputChange}
                      placeholder="Start typing member name..."
                      required
                      autoComplete="off"
                    />
                    {showMemberDropdown && (
                      <div className="member-dropdown">
                        {filteredMembers.map(member => (
                          <div
                            key={member.id}
                            className="member-option"
                            onClick={() => handleMemberSelect(member)}
                          >
                            <div className="member-name">{member.name}</div>
                            <div className="member-contact">{member.contact_number}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Member Details (Read-only when member is selected) */}
                {selectedMember && (
                  <div className="member-details">
                    <div className="details-grid">
                      <div className="detail-field">
                        <label>Contact Number</label>
                        <input type="text" value={selectedMember.contact_number} readOnly />
                      </div>
                      <div className="detail-field">
                        <label>Rate Type</label>
                        <input type="text" value={selectedMember.rate_type} readOnly />
                      </div>
                      <div className="detail-field">
                        <label>Rate Amount</label>
                        <input type="text" value={`$${selectedMember.rate_amount.toFixed(2)}`} readOnly />
                      </div>
                      <div className="detail-field">
                        <label>Discount</label>
                        <input type="text" value={`${selectedMember.discount.toFixed(1)}%`} readOnly />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Table Selection */}
            <div className="form-field">
              <label>Select Table *</label>
              <select
                name="tableId"
                value={formData.tableId}
                onChange={handleInputChange}
                required
              >
                <option value="">Choose an available table</option>
                {tables.map(table => (
                  <option key={table.id} value={table.id}>
                    {table.table_name} - {table.status}
                  </option>
                ))}
              </select>
              {tables.length === 0 && (
                <p className="no-tables-msg">No tables available. All tables are currently occupied.</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button 
              type="submit" 
              className="start-session-btn" 
              disabled={loading || tables.length === 0}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Starting Session...
                </>
              ) : (
                'Start Session'
              )}
            </button>
          </div>
        </form>

        {/* Messages */}
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}
      </div>
    </div>
  );
};

// Table Management Component
const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({ table_name: '', status: 'vacant' });
  const [message, setMessage] = useState('');

  // Fetch tables
  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8000/tables');
      if (response.ok) {
        const data = await response.json();
        setTables(data);
        setError('');
      } else {
        setError('Failed to fetch tables');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // Auto-hide success messages after 3 seconds
  useEffect(() => {
    if (message && (message.includes('successfully') || message.includes('created'))) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Handle form submission (add/edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
      const url = editingTable 
        ? `http://127.0.0.1:8000/tables/${editingTable.id}`
        : 'http://127.0.0.1:8000/tables/create';
      
      const method = editingTable ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const action = editingTable ? 'updated' : 'created';
        setMessage(`Table ${action} successfully!`);
        setFormData({ table_name: '', status: 'vacant' });
        setShowAddForm(false);
        setEditingTable(null);
        fetchTables();
      } else {
        const errorData = await response.json();
        setMessage(errorData.detail || `Failed to ${editingTable ? 'update' : 'create'} table`);
      }
    } catch (err) {
      setMessage('Error connecting to server');
    }
  };

  // Handle delete
  const handleDelete = async (tableId, tableName) => {
    if (!window.confirm(`Are you sure you want to delete "${tableName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/tables/${tableId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage('Table deleted successfully!');
        fetchTables();
      } else {
        const errorData = await response.json();
        setMessage(errorData.detail || 'Failed to delete table');
      }
    } catch (err) {
      setMessage('Error connecting to server');
    }
  };

  // Handle edit
  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({ table_name: table.table_name, status: table.status });
    setShowAddForm(true);
  };

  // Cancel form
  const handleCancel = () => {
    setShowAddForm(false);
    setEditingTable(null);
    setFormData({ table_name: '', status: 'vacant' });
    setMessage('');
  };

  // Create sample tables
  const createSampleTables = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/tables/create-sample', {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        setMessage(result.message);
        fetchTables();
      } else {
        setMessage('Failed to create sample tables');
      }
    } catch (err) {
      setMessage('Error connecting to server');
    }
  };

  const getStatusBadge = (status) => {
    const statusClass = status === 'vacant' ? 'status-vacant' : 
                       status === 'occupied' ? 'status-occupied' : 
                       status === 'reserved' ? 'status-reserved' : 'status-maintenance';
    return <span className={`status-badge ${statusClass}`}>{status.toUpperCase()}</span>;
  };

  return (
    <div className="table-management-container">
      <div className="management-header">
        <h2><FiTable /> Table Management</h2>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => setShowAddForm(true)}
            disabled={showAddForm}
          >
            <FiUserPlus /> Add Table
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('successfully') || message.includes('created') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="form-card">
          <h3>{editingTable ? 'Edit Table' : 'Add New Table'}</h3>
          <form onSubmit={handleSubmit} className="table-form">
            <div className="form-group">
              <label htmlFor="table_name">Table Name *</label>
              <input
                type="text"
                id="table_name"
                value={formData.table_name}
                onChange={(e) => setFormData({...formData, table_name: e.target.value})}
                placeholder="Enter table name (e.g., Table 1, VIP Table)"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                <FiFileText /> {editingTable ? 'Update Table' : 'Add Table'}
              </button>
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                <FiX /> Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tables List */}
      <div className="tables-card">
        <div className="card-header">
          <h3>All Tables ({tables.length})</h3>
          <button className="btn-refresh" onClick={fetchTables} disabled={loading} title="Refresh Tables">
            <BiSync className={loading ? 'spinning' : ''} />
          </button>
        </div>
        
        {loading ? (
          <div className="loading-state">
            <FiGrid className="spinning" /> Loading tables...
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button className="btn-primary" onClick={fetchTables}>
              <FiGrid /> Retry
            </button>
          </div>
        ) : tables.length === 0 ? (
          <div className="empty-state">
            <FiTable size={48} />
            <h3>No Tables Found</h3>
            <p>Click "Add Table" above to create your first table.</p>
          </div>
        ) : (
          <div className="tables-grid">
            {tables.map((table) => (
              <div key={table.id} className="table-card">
                <div className="table-info">
                  <h4>{table.table_name}</h4>
                  {getStatusBadge(table.status)}
                </div>
                <div className="table-actions">
                  <button 
                    className="btn-edit"
                    onClick={() => handleEdit(table)}
                    title="Edit Table"
                  >
                    <FiFileText />
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDelete(table.id, table.table_name)}
                    title="Delete Table"
                  >
                    <FiX />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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
          {dashboardView === 'startSession' && <StartSessionForm />}
          {dashboardView === 'tables' && <TableManagement />}
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
          <img src="/dashboard-img.png" alt="Snooker illustration" className="login-card-img" />
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