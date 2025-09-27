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
  const [authMode, setAuthMode] = useState('signin'); // signin / signup
  const [form, setForm] = useState({ email: '', password: '', role: 'student' });

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
    }
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
        // Insert into profiles
        await supabase.from('profiles').insert({
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

  return (
    <div className="app-container">
      <header>
        <h1>VIT College Student DBMS</h1>
        <div>
          <span className="role-badge">Role: {userRole}</span>
          <button onClick={signOut} className="logout-btn">
            Sign Out
          </button>
        </div>
      </header>

      <main>
        <Students userRole={userRole} />
        <Subjects userRole={userRole} />
        <Marks userRole={userRole} />
        <Attendance userRole={userRole} />
      </main>
    </div>
  );
}

export default App;
