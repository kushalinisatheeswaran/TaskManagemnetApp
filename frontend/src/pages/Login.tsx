import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { LayoutDashboard } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form glass">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
           <LayoutDashboard size={40} color="var(--accent-primary)" />
           <h2 style={{ marginTop: '1rem', fontSize: '1.75rem' }}>Welcome Back</h2>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button disabled={loading} type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Need an account? <Link to="/register">Sign Up</Link>
        </div>
      </div>
    </div>
  );
};
