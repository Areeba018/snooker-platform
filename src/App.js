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

      if (response.status === 200) {
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

// --- Active Sessions Component (Players Section) ---
const PlayersList = () => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [endingSession, setEndingSession] = useState(null);

  // Auto-hide success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchActiveSessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://127.0.0.1:8000/sessions/active', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setActiveSessions(data);
        setError('');
      } else {
        setError('Failed to fetch active sessions');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSessions();
  }, []);

  const getSessionDuration = (startTime) => {
    // Simple: just use start time and current time
    const start = new Date(startTime);
    const now = new Date();
    
    // Calculate duration
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    
    // Format times for display
    const startTimeStr = start.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const currentTimeStr = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    return `${durationStr} (${startTimeStr} → ${currentTimeStr})`;
  };

  // Auto-refresh duration every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update durations in real-time
      setActiveSessions(prev => [...prev]);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const formatStartTime = (startTime) => {
    const date = new Date(startTime);
    
    // The database now stores Pakistani time directly, so no conversion needed
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ', ' + date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Simple duration calculation for debugging
  const getSimpleDuration = (startTime) => {
    let start = new Date(startTime);
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Check if the year is wrong (2025 instead of current year)
    if (start.getFullYear() === 2025) {
      // Fix the year to current year
      start.setFullYear(currentYear);
    }
    
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);
    
    // If duration is negative or very large, there's a date parsing issue
    if (diffMins < 0 || diffMins > 1440) {
      return 'Error';
    }
    
    return diffMins;
  };

  const getPlayerName = (session) => {
    // If we have all players data, show all player names
    if (session.all_players && session.all_players.length > 0) {
      const playerNames = session.all_players.map(player => player.name).join(', ');
      return playerNames;
    }
    
    // Fallback to original logic
    const name = session.customer_name || session.guest_name || `Member ID: ${session.customer_id}`;
    
    // Check if this customer has multiple active sessions
    const customerKey = session.customer_id || `${session.guest_name}-${session.guest_contact}`;
    const sessionCount = activeSessions.filter(s => {
      const sKey = s.customer_id || `${s.guest_name}-${s.guest_contact}`;
      return sKey === customerKey;
    }).length;
    
    if (sessionCount > 1) {
      return `${name} ⚠️ (${sessionCount} sessions)`;
    }
    
    return name;
  };

  const getPlayerContact = (session) => {
    // If we have all players data, show all contacts
    if (session.all_players && session.all_players.length > 0) {
      const contacts = session.all_players.map(player => player.contact || 'N/A').join(', ');
      return contacts;
    }
    
    // Fallback to original logic
    return session.customer_contact || session.guest_contact || 'N/A';
  };

  const getRateDisplay = (session) => {
    if (session.rate_type) {
      const rateType = session.rate_type === '30min' ? '30 Min' : 
                      session.rate_type === 'hourly' ? 'Hourly' : 
                      session.rate_type === 'time played' ? 'Time Played' : 
                      session.rate_type;
      return rateType;
    }
    return 'Guest';
  };

  const getRateAmount = (session) => {
    if (session.rate_amount && session.rate_amount > 0) {
      return `$${session.rate_amount.toFixed(2)}`;
    }
    return 'N/A';
  };

  const handleEndSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to end this session?')) {
      return;
    }

    setEndingSession(sessionId);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://127.0.0.1:8000/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setSuccessMessage(`Session ended successfully! Duration: ${result.duration_formatted}, Total Cost: $${result.total_cost.toFixed(2)}`);
        fetchActiveSessions(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to end session');
      }
    } catch (err) {
      setError('Error ending session. Please try again.');
    } finally {
      setEndingSession(null);
    }
  };

  return (
    <div className="active-sessions-container">
      <div className="sessions-header">
        <div className="header-content">
          <h2><FiPlayCircle /> Active Sessions</h2>
          <div className="session-count-badge">
            {activeSessions.length} active
          </div>
        </div>
        <div className="filters-row">
          <button className="btn-refresh" onClick={fetchActiveSessions} disabled={loading} title="Refresh Active Sessions">
            <BiSync className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}
      
      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      <div className="sessions-content">
        {loading ? (
          <div className="loading-state">
            <BiSync className="spinning" /> Loading active sessions...
          </div>
        ) : activeSessions.length > 0 ? (
          <div className="table-container">
            <table className="sessions-table">
              <thead>
                <tr>
                  <th>Table</th>
                  <th>Game Type</th>
                  <th>Players</th>
                  <th>Player Name</th>
                  <th>Contact</th>
                  <th>Rate Type</th>
                  <th>Rate</th>
                  <th>Duration</th>
                  <th>Start Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeSessions.map(session => (
                  <tr key={session.id}>
                    <td>{session.table_name || `Table ${session.table_id}`}</td>
                    <td>
                      <span className={`game-type-badge ${session.game_type || 'snooker'}`}>
                        {session.game_type ? session.game_type.charAt(0).toUpperCase() + session.game_type.slice(1) : 'Snooker'}
                      </span>
                    </td>
                    <td>
                      <span className="player-count">
                        {session.current_players || 1} of {session.total_players || 1}
                      </span>
                    </td>
                    <td>{getPlayerName(session)}</td>
                    <td>{getPlayerContact(session)}</td>
                    <td>{getRateDisplay(session)}</td>
                    <td>{getRateAmount(session)}</td>
                    <td>{getSessionDuration(session.start_time)}</td>
                    <td>{formatStartTime(session.start_time)}</td>
                    <td>
                      <button 
                        className="btn-end-session"
                        onClick={() => handleEndSession(session.id)}
                        disabled={endingSession === session.id}
                        title="End Session"
                      >
                        {endingSession === session.id ? (
                          <>
                            <span className="spinner"></span>
                            Ending...
                          </>
                        ) : (
                          <>
                            <FiX />
                            End Session
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <FiPlayCircle size={48} />
            <h3>No Active Sessions</h3>
            <p>No sessions are currently active. Start a new session to see it here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Start Session Component ---
const StartSessionForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [sessionType, setSessionType] = useState('guest');
  const [gameType, setGameType] = useState('snooker');
  const [totalPlayers, setTotalPlayers] = useState(1);
  const [currentPlayers, setCurrentPlayers] = useState(1);
  const [players, setPlayers] = useState([{
    id: 1,
    type: 'guest',
    guestName: '',
    guestContact: '',
    memberId: null,
    memberName: '',
    rateType: '',
    rateAmount: ''
  }]);

  // Update players array when currentPlayers changes
  useEffect(() => {
    const newPlayers = [];
    for (let i = 1; i <= Math.max(currentPlayers, 6); i++) {
      const existingPlayer = players.find(p => p.id === i);
      if (existingPlayer) {
        newPlayers.push(existingPlayer);
      } else {
        newPlayers.push({
          id: i,
          type: 'guest',
          guestName: '',
          guestContact: '',
          memberId: null,
          memberName: '',
          rateType: '',
          rateAmount: ''
        });
      }
    }
    setPlayers(newPlayers);
  }, [currentPlayers]);
  const [formData, setFormData] = useState({
    tableId: ''
  });
  const [selectedMember, setSelectedMember] = useState(null);
  const [members, setMembers] = useState([]);
  const [tables, setTables] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [activeMemberSearch, setActiveMemberSearch] = useState(null);
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

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainers = document.querySelectorAll('.search-container');
      let clickedInside = false;
      
      searchContainers.forEach(container => {
        if (container.contains(event.target)) {
          clickedInside = true;
        }
      });
      
      if (!clickedInside) {
        setShowMemberDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter members based on name input for any player
  useEffect(() => {
    if (activeMemberSearch) {
      const filtered = members.filter(member => 
        member.name.toLowerCase().includes(activeMemberSearch.memberName.toLowerCase())
      );
      setFilteredMembers(filtered);
      setShowMemberDropdown(filtered.length > 0);
    } else {
      setFilteredMembers([]);
      setShowMemberDropdown(false);
    }
  }, [activeMemberSearch, members]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlayerInputChange = (playerId, field, value) => {
    setPlayers(prev => prev.map(player => 
      player.id === playerId 
        ? { ...player, [field]: value }
        : player
    ));
    
    // Handle member name input
    if (field === 'memberName') {
      setPlayers(prev => prev.map(player => 
        player.id === playerId 
          ? { ...player, memberId: null }
          : player
      ));
      
      // Set active member search for dropdown
      if (value.length > 0) {
        setActiveMemberSearch({ playerId, memberName: value });
      } else {
        setActiveMemberSearch(null);
      }
    }
  };

  const handlePlayerTypeChange = (playerId, type) => {
    setPlayers(prev => prev.map(player => 
      player.id === playerId 
        ? { 
            ...player, 
            type,
            guestName: '',
            guestContact: '',
            memberId: null,
            memberName: '',
            rateType: '',
            rateAmount: ''
          }
        : player
    ));
  };

  const handlePlayerMemberSelect = (playerId, member) => {
    setPlayers(prev => prev.map(player => 
      player.id === playerId 
        ? { 
            ...player, 
            memberId: member.id,
            memberName: member.name,
            rateType: member.rate_type,
            rateAmount: member.rate_amount
          }
        : player
    ));
    
    // Clear active member search and dropdown
    setActiveMemberSearch(null);
    setShowMemberDropdown(false);
  };

  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setFormData(prev => ({ ...prev, memberName: member.name }));
    setShowMemberDropdown(false);
    setFilteredMembers([]); // Clear filtered members
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      // Validate that all players have required data
      const validPlayers = players.slice(0, currentPlayers);
      const invalidPlayers = validPlayers.filter(player => {
        if (player.type === 'guest') {
          return !player.guestName || !player.guestContact || !player.rateType || !player.rateAmount;
        } else {
          return !player.memberId;
        }
      });

      if (invalidPlayers.length > 0) {
        setError('Please fill in all required details for all players.');
        setLoading(false);
        return;
      }

      // Create a session with the first player as the primary player
      // The session will represent the group session with all player details
      const firstPlayer = validPlayers[0];
      
      const sessionData = {
        session_type: firstPlayer.type,
        table_id: parseInt(formData.tableId),
        game_type: gameType,
        total_players: totalPlayers,
        current_players: currentPlayers
      };

      if (firstPlayer.type === 'guest') {
        sessionData.guest_name = firstPlayer.guestName;
        sessionData.guest_contact = firstPlayer.guestContact;
        sessionData.rate_type = firstPlayer.rateType;
        sessionData.rate_amount = parseFloat(firstPlayer.rateAmount) || 0;
      } else {
        sessionData.customer_id = firstPlayer.memberId;
        sessionData.rate_type = firstPlayer.rateType;
        sessionData.rate_amount = firstPlayer.rateAmount;
      }

      // Add all player information to the session data
      sessionData.all_players = validPlayers.map(player => ({
        type: player.type,
        name: player.type === 'guest' ? player.guestName : player.memberName,
        contact: player.type === 'guest' ? player.guestContact : '',
        memberId: player.memberId,
        rateType: player.rateType,
        rateAmount: player.rateAmount
      }));

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
        setPlayers([{
          id: 1,
          type: 'guest',
          guestName: '',
          guestContact: '',
          memberId: null,
          memberName: '',
          rateType: '',
          rateAmount: ''
        }]);
        setFormData({
          tableId: ''
        });
        setSelectedMember(null);
        setGameType('snooker');
        setTotalPlayers(1);
        setCurrentPlayers(1);
        setCurrentStep(1);
        
        // Refresh available tables
        const tablesResponse = await fetch('http://localhost:8000/tables/available', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (tablesResponse.ok) {
          const tablesData = await tablesResponse.json();
          setTables(tablesData);
        }
      } else if (response.status === 409) {
        const errorData = await response.json();
        setError(`❌ ${errorData.detail} - Please end the existing session first.`);
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
          <h2>Start New Game</h2>
          <p>Begin a snooker session for a member or guest</p>
        </div>

        {/* Step Progress Bar */}
        <div className="step-progress">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Game Setup</div>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Player Details</div>
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Start Game</div>
          </div>
        </div>

        <form className="session-form" onSubmit={handleSubmit}>
          {/* Step 1: Game Setup */}
          {currentStep === 1 && (
            <div className="step-content">
              <div className="step-header">
                <h3>Step 1: Game Setup</h3>
                <p>Choose your game type and player count</p>
              </div>
              
              <div className="form-fields">
                {/* Game Type Selection */}
                <div className="form-section">
                  <label className="section-label">Game Type</label>
                  <div className="radio-group">
                    <label className={`radio-option ${gameType === 'snooker' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="gameType"
                        value="snooker"
                        checked={gameType === 'snooker'}
                        onChange={(e) => setGameType(e.target.value)}
                      />
                      <span className="radio-label">Snooker</span>
                    </label>
                    <label className={`radio-option ${gameType === 'pool' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="gameType"
                        value="pool"
                        checked={gameType === 'pool'}
                        onChange={(e) => setGameType(e.target.value)}
                      />
                      <span className="radio-label">Pool</span>
                    </label>
                    <label className={`radio-option ${gameType === 'billiards' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="gameType"
                        value="billiards"
                        checked={gameType === 'billiards'}
                        onChange={(e) => setGameType(e.target.value)}
                      />
                      <span className="radio-label">Billiards</span>
                    </label>
                  </div>
                </div>

                {/* Number of Players */}
                <div className="form-section">
                  <div className="form-field">
                    <label>Total Players Expected *</label>
                    <select
                      value={totalPlayers}
                      onChange={(e) => {
                        setTotalPlayers(parseInt(e.target.value));
                        setCurrentPlayers(1);
                      }}
                      required
                    >
                      <option value={1}>1 Player</option>
                      <option value={2}>2 Players</option>
                      <option value={3}>3 Players</option>
                      <option value={4}>4 Players</option>
                      <option value={5}>5 Players</option>
                      <option value={6}>6 Players</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Current Players Starting *</label>
                    <select
                      value={currentPlayers}
                      onChange={(e) => setCurrentPlayers(parseInt(e.target.value))}
                      required
                    >
                      {Array.from({ length: totalPlayers }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>{num} Player{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="step-actions">
                <button 
                  type="button" 
                  className="btn-next"
                  onClick={() => setCurrentStep(2)}
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Player Details */}
          {currentStep === 2 && (
            <div className="step-content">
              <div className="step-header">
                <h3>Step 2: Player Details</h3>
                <p>Enter details for {currentPlayers} player{currentPlayers > 1 ? 's' : ''}</p>
              </div>
              
              <div className="form-fields">
                {players.slice(0, currentPlayers).map((player, index) => (
                  <div key={player.id} className="player-card">
                    <div className="player-header">
                      <h4>Player {index + 1}</h4>
                    </div>
                    
                    {/* Player Type Selection */}
                    <div className="form-section">
                      <label className="section-label">Player Type</label>
                      <div className="radio-group">
                        <label className={`radio-option ${player.type === 'guest' ? 'active' : ''}`}>
                          <input
                            type="radio"
                            name={`playerType-${player.id}`}
                            value="guest"
                            checked={player.type === 'guest'}
                            onChange={(e) => handlePlayerTypeChange(player.id, e.target.value)}
                          />
                          <span className="radio-label">Guest</span>
                        </label>
                        <label className={`radio-option ${player.type === 'member' ? 'active' : ''}`}>
                          <input
                            type="radio"
                            name={`playerType-${player.id}`}
                            value="member"
                            checked={player.type === 'member'}
                            onChange={(e) => handlePlayerTypeChange(player.id, e.target.value)}
                          />
                          <span className="radio-label">Member</span>
                        </label>
                      </div>
                    </div>

                    {/* Dynamic Form Fields */}
                    {player.type === 'guest' ? (
                      // Guest Form Fields
                      <div className="form-section">
                        <div className="form-field">
                          <label>Guest Name *</label>
                          <input
                            type="text"
                            value={player.guestName}
                            onChange={(e) => handlePlayerInputChange(player.id, 'guestName', e.target.value)}
                            placeholder="Enter guest name"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label>Contact Number *</label>
                          <input
                            type="text"
                            value={player.guestContact}
                            onChange={(e) => handlePlayerInputChange(player.id, 'guestContact', e.target.value)}
                            placeholder="Enter contact number"
                            required
                          />
                        </div>
                        
                        {/* Rate Type and Amount for Guest Sessions */}
                        <div className="form-field">
                          <label>Rate Type *</label>
                          <select
                            value={player.rateType}
                            onChange={(e) => handlePlayerInputChange(player.id, 'rateType', e.target.value)}
                            required
                          >
                            <option value="">Select Rate Type</option>
                            <option value="hourly">Hourly</option>
                            <option value="30min">30 Minutes</option>
                            <option value="time played">Time Played (per minute)</option>
                          </select>
                        </div>
                        
                        <div className="form-field">
                          <label>Rate Amount *</label>
                          <input
                            type="number"
                            value={player.rateAmount}
                            onChange={(e) => handlePlayerInputChange(player.id, 'rateAmount', e.target.value)}
                            placeholder={player.rateType === 'time played' ? '0.00 per minute' : '0.00'}
                            min="0"
                            step="0.01"
                            required
                          />
                          <small className="rate-hint">
                            {player.rateType === 'hourly' && 'Amount per hour'}
                            {player.rateType === '30min' && 'Amount per 30 minutes'}
                            {player.rateType === 'time played' && 'Amount per minute'}
                          </small>
                        </div>
                      </div>
                    ) : (
                      // Member Form Fields
                      <div className="form-section">
                        <div className="form-field member-search">
                          <label>Member Name *</label>
                          <div className="search-container">
                            <input
                              type="text"
                              value={player.memberName}
                              onChange={(e) => handlePlayerInputChange(player.id, 'memberName', e.target.value)}
                              placeholder="Start typing member name..."
                              required
                              autoComplete="off"
                            />
                            {showMemberDropdown && activeMemberSearch && activeMemberSearch.playerId === player.id && (
                              <div className="member-dropdown">
                                {filteredMembers.map(member => (
                                  <div
                                    key={member.id}
                                    className="member-option"
                                    onClick={() => handlePlayerMemberSelect(player.id, member)}
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
                        {player.memberId && (
                          <div className="member-details">
                            <div className="details-grid">
                              <div className="detail-field">
                                <label>Contact Number</label>
                                <input type="text" value={members.find(m => m.id === player.memberId)?.contact_number || ''} readOnly />
                              </div>
                              <div className="detail-field">
                                <label>Rate Type</label>
                                <input type="text" value={player.rateType} readOnly />
                              </div>
                              <div className="detail-field">
                                <label>Rate Amount</label>
                                <input type="text" value={`$${player.rateAmount?.toFixed(2) || '0.00'}`} readOnly />
                              </div>
                              <div className="detail-field">
                                <label>Discount</label>
                                <input type="text" value={`${members.find(m => m.id === player.memberId)?.discount?.toFixed(1) || '0.0'}%`} readOnly />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="step-actions">
                <button 
                  type="button" 
                  className="btn-prev"
                  onClick={() => setCurrentStep(1)}
                >
                  Previous
                </button>
                <button 
                  type="button" 
                  className="btn-next"
                  onClick={() => setCurrentStep(3)}
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Start Session */}
          {currentStep === 3 && (
            <div className="step-content">
              <div className="step-header">
                <h3>Step 3: Start Session</h3>
                <p>Review details and select table to start</p>
              </div>
              
              {/* Session Summary */}
              <div className="session-summary">
                <div className="summary-card">
                  <h4>Session Summary</h4>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span className="summary-label">Game Type:</span>
                      <span className="summary-value">{gameType.charAt(0).toUpperCase() + gameType.slice(1)}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Players:</span>
                      <span className="summary-value">{currentPlayers} of {totalPlayers}</span>
                    </div>
                  </div>
                  
                  {/* Players Summary */}
                  <div className="players-summary">
                    <h5>Player Details</h5>
                    {players.slice(0, currentPlayers).map((player, index) => (
                      <div key={player.id} className="player-summary-item">
                        <div className="player-summary-header">
                          <span className="player-number">Player {index + 1}</span>
                          <span className={`player-type-badge ${player.type}`}>
                            {player.type === 'guest' ? 'Guest' : 'Member'}
                          </span>
                        </div>
                        <div className="player-summary-details">
                          {player.type === 'guest' ? (
                            <>
                              <div className="summary-detail">
                                <span>Name:</span>
                                <span>{player.guestName || 'Not entered'}</span>
                              </div>
                              <div className="summary-detail">
                                <span>Contact:</span>
                                <span>{player.guestContact || 'Not entered'}</span>
                              </div>
                              <div className="summary-detail">
                                <span>Rate:</span>
                                <span>{player.rateType || 'Not selected'} - ${player.rateAmount || '0.00'}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="summary-detail">
                                <span>Member:</span>
                                <span>{player.memberName || 'Not selected'}</span>
                              </div>
                              <div className="summary-detail">
                                <span>Rate:</span>
                                <span>{player.rateType || 'N/A'} - ${player.rateAmount?.toFixed(2) || '0.00'}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table Selection */}
              <div className="form-section">
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

              <div className="step-actions">
                <button 
                  type="button" 
                  className="btn-prev"
                  onClick={() => setCurrentStep(2)}
                >
                  Previous
                </button>
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
            </div>
          )}
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
          <button onClick={() => setDashboardView('tables')} className={dashboardView === 'tables' ? 'active' : ''}>
            <FiTable /><span>Snooker Tables</span>
          </button>
          <button onClick={() => setDashboardView('startSession')} className={dashboardView === 'startSession' ? 'active' : ''}>
            <FiPlayCircle /><span>Start Session</span>
          </button>
          <button onClick={() => setDashboardView('customers')} className={dashboardView === 'customers' ? 'active' : ''}>
            <FiUsers /><span>players</span>
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