import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Students from './components/Students';
import Subjects from './components/Subjects';
import Marks from './components/Marks';
import Attendance from './components/Attendance';
import './styles.css';

function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('signin');
  const [form, setForm] = useState({ email: '', password: '', role: 'student' });
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // New state for active tab

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        await fetchUserRole(data.session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          await fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId) => {
    let { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setUserRole(data.role);
      setShowRoleSelector(false);
    } else {
      setShowRoleSelector(true);
    }
  };

  const setUserRoleInDB = async (role) => {
    if (!session?.user) return;
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        email: session.user.email,
        role: role,
      });

    if (error) {
      alert('Error setting role: ' + error.message);
      return;
    }

    setUserRole(role);
    setShowRoleSelector(false);
  };

  const handleAuth = async (e) => {
    e.preventDefault();

    if (authMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      if (data?.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: form.email,
          role: form.role,
        });
        setUserRole(form.role);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      if (data?.user) {
        await fetchUserRole(data.user.id);
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserRole(null);
    setShowRoleSelector(false);
    setActiveTab('dashboard'); // Reset to dashboard on logout
  };

  // Function to get welcome message based on role
  const getWelcomeInfo = () => {
    switch(userRole) {
      case 'student':
        return {
          title: 'Student Portal',
          message: 'View your academic records, marks, and attendance',
          color: '#16a34a'
        };
      case 'faculty':
        return {
          title: 'Faculty Dashboard',
          message: 'Manage student marks and attendance records',
          color: '#2563eb'
        };
      case 'admin':
        return {
          title: 'Admin Panel',
          message: 'Full system access - manage students, subjects, and data',
          color: '#dc2626'
        };
      default:
        return {
          title: 'Welcome',
          message: 'Loading your dashboard...',
          color: '#6b7280'
        };
    }
  };

  // Get available tabs based on user role
  const getAvailableTabs = () => {
    const baseTabs = [
      { id: 'dashboard', label: '🏠 Dashboard', icon: '🏠' }
    ];

    if (userRole === 'student') {
      return [
        ...baseTabs,
        { id: 'students', label: '👥 Students', icon: '👥' },
        { id: 'marks', label: '📝 My Marks', icon: '📝' },
        { id: 'attendance', label: '📅 My Attendance', icon: '📅' }
      ];
    }

    if (userRole === 'faculty') {
      return [
        ...baseTabs,
        { id: 'students', label: '👥 Students', icon: '👥' },
        { id: 'subjects', label: '📚 Subjects', icon: '📚' },
        { id: 'marks', label: '📊 Marks', icon: '📊' },
        { id: 'attendance', label: '📋 Attendance', icon: '📋' }
      ];
    }

    if (userRole === 'admin') {
      return [
        ...baseTabs,
        { id: 'students', label: '👤 Students', icon: '👤' },
        { id: 'subjects', label: '📚 Subjects', icon: '📚' },
        { id: 'marks', label: '📊 Marks', icon: '📊' },
        { id: 'attendance', label: '📈 Attendance', icon: '📈' }
      ];
    }

    return baseTabs;
  };

  // Render active tab content
  const renderActiveTabContent = () => {
    switch(activeTab) {
      case 'students':
        return <Students userRole={userRole} />;
      case 'subjects':
        return <Subjects userRole={userRole} />;
      case 'marks':
        return <Marks userRole={userRole} />;
      case 'attendance':
        return <Attendance userRole={userRole} />;
      case 'dashboard':
      default:
        return <DashboardHome userRole={userRole} welcomeInfo={getWelcomeInfo()} />;
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  if (!session) {
    return (
      <div className="auth-container">
        <h2>VIT Student Portal</h2>
        <form onSubmit={handleAuth} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          {authMode === 'signup' && (
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              required
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          )}

          <button type="submit">
            {authMode === 'signup' ? 'Sign Up' : 'Sign In'}
          </button>
        </form>
        <p>
          {authMode === 'signup'
            ? 'Already have an account?'
            : "Don't have an account?"}{' '}
          <button
            className="link-btn"
            onClick={() =>
              setAuthMode(authMode === 'signup' ? 'signin' : 'signup')
            }
          >
            {authMode === 'signup' ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    );
  }

  if (showRoleSelector) {
    return (
      <div className="auth-container">
        <h2>Select Your Role</h2>
        <p>Please select your role to continue:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
          <button onClick={() => setUserRoleInDB('student')} className="role-select-btn">
            I am a Student
          </button>
          <button onClick={() => setUserRoleInDB('faculty')} className="role-select-btn">
            I am a Faculty Member
          </button>
          <button onClick={() => setUserRoleInDB('admin')} className="role-select-btn">
            I am an Admin
          </button>
        </div>
        <button onClick={signOut} style={{ marginTop: '20px', background: '#ef4444' }}>
          Sign Out
        </button>
      </div>
    );
  }

  const welcomeInfo = getWelcomeInfo();
  const availableTabs = getAvailableTabs();

  return (
    <div className="app-container">
      {/* Header */}
      <header>
        <h1>VIT Student Portal</h1>
        <div>
          <span className="role-badge" style={{ background: welcomeInfo.color }}>
            {userRole?.toUpperCase()}
          </span>
          <button onClick={signOut} className="logout-btn">
            Sign Out
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="tab-navigation">
        {availableTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Active Tab Content */}
      <main className="tab-content">
        {renderActiveTabContent()}
      </main>
    </div>
  );
}

// Dashboard Home Component
function DashboardHome({ userRole, welcomeInfo }) {
  return (
    <div className="dashboard-home">
      {/* Welcome Section */}
      <div className="welcome-section" style={{ borderLeft: `4px solid ${welcomeInfo.color}` }}>
        <h2>{welcomeInfo.title}</h2>
        <p>{welcomeInfo.message}</p>
      </div>

      {/* Quick Stats or Information */}
      <div className="dashboard-cards">
        {userRole === 'student' && (
          <>
            <div className="info-card">
              <h3>📚 Your Studies</h3>
              <p>Access your academic records, view marks, and track attendance all in one place.</p>
            </div>
            <div className="info-card">
              <h3>📊 Performance</h3>
              <p>Monitor your academic progress and stay updated with your latest marks and grades.</p>
            </div>
            <div className="info-card">
              <h3>📅 Attendance</h3>
              <p>Keep track of your class attendance and ensure you meet the minimum requirements.</p>
            </div>
          </>
        )}

        {userRole === 'faculty' && (
          <>
            <div className="info-card">
              <h3>👥 Student Management</h3>
              <p>View and manage student information across all your classes.</p>
            </div>
            <div className="info-card">
              <h3>📝 Grade Management</h3>
              <p>Enter and update student marks for assessments and examinations.</p>
            </div>
            <div className="info-card">
              <h3>📋 Attendance Tracking</h3>
              <p>Mark daily attendance and monitor student participation in your courses.</p>
            </div>
          </>
        )}

        {userRole === 'admin' && (
          <>
            <div className="info-card">
              <h3>🎓 Student Records</h3>
              <p>Complete control over student database - add, edit, and manage student information.</p>
            </div>
            <div className="info-card">
              <h3>📚 Course Management</h3>
              <p>Manage subjects, courses, and academic curriculum across the institution.</p>
            </div>
            <div className="info-card">
              <h3>📊 System Overview</h3>
              <p>Full access to all academic data, reports, and system administration.</p>
            </div>
          </>
        )}
      </div>

      {/* Quick Navigation */}
      <div className="quick-nav-section">
        <h3>Quick Navigation</h3>
        <p>Use the navigation tabs above to access different sections of the system.</p>
      </div>
    </div>
  );
}

export default App;