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
  };

  // Function to get welcome message based on role
  const getWelcomeMessage = () => {
    switch(userRole) {
      case 'student':
        return {
          title: 'Student Portal',
          message: 'View your academic records, marks, and attendance',
          color: '#16a34a' // green
        };
      case 'faculty':
        return {
          title: 'Faculty Dashboard',
          message: 'Manage student marks and attendance records',
          color: '#2563eb' // blue
        };
      case 'admin':
        return {
          title: 'Admin Panel',
          message: 'Full system access - manage students, subjects, and data',
          color: '#dc2626' // red
        };
      default:
        return {
          title: 'Welcome',
          message: 'Loading your dashboard...',
          color: '#6b7280' // gray
        };
    }
  };

  if (loading) return <p className="loading">Loading...</p>;

  if (!session) {
    return (
      <div className="auth-container">
        <h2>VIT College Student DBMS</h2>
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

  const welcomeInfo = getWelcomeMessage();

  return (
    <div className="app-container">
      <header>
        <h1>VIT College Student DBMS</h1>
        <div>
          <span className="role-badge" style={{ background: welcomeInfo.color }}>
            {userRole?.toUpperCase()}
          </span>
          <button onClick={signOut} className="logout-btn">
            Sign Out
          </button>
        </div>
      </header>

      {/* Welcome Section */}
      <div className="welcome-section" style={{ borderLeft: `4px solid ${welcomeInfo.color}` }}>
        <h2>{welcomeInfo.title}</h2>
        <p>{welcomeInfo.message}</p>
      </div>

      <main className={`dashboard dashboard-${userRole}`}>
        {/* STUDENT INTERFACE */}
        {userRole === 'student' && (
          <>
            <div className="dashboard-section">
              <h3>📊 My Academic Records</h3>
              <Students userRole={userRole} />
            </div>
            <div className="dashboard-section">
              <h3>📝 My Marks</h3>
              <Marks userRole={userRole} />
            </div>
            <div className="dashboard-section">
              <h3>📅 My Attendance</h3>
              <Attendance userRole={userRole} />
            </div>
          </>
        )}
        
        {/* FACULTY INTERFACE */}
        {userRole === 'faculty' && (
          <>
            <div className="dashboard-section">
              <h3>👥 Students Overview</h3>
              <Students userRole={userRole} />
            </div>
            <div className="dashboard-section">
              <h3>📚 Subjects</h3>
              <Subjects userRole={userRole} />
            </div>
            <div className="dashboard-section">
              <h3>✏️ Manage Marks</h3>
              <Marks userRole={userRole} />
            </div>
            <div className="dashboard-section">
              <h3>📋 Manage Attendance</h3>
              <Attendance userRole={userRole} />
            </div>
          </>
        )}
        
        {/* ADMIN INTERFACE */}
        {userRole === 'admin' && (
          <>
            <div className="dashboard-section">
              <h3>👤 Student Management</h3>
              <Students userRole={userRole} />
            </div>
            <div className="dashboard-section">
              <h3>📚 Subject Management</h3>
              <Subjects userRole={userRole} />
            </div>
            <div className="dashboard-section">
              <h3>📊 Marks Overview</h3>
              <Marks userRole={userRole} />
            </div>
            <div className="dashboard-section">
              <h3>📈 Attendance Overview</h3>
              <Attendance userRole={userRole} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;