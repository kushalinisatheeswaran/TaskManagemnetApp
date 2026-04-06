import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Moon, Sun } from 'lucide-react';
import { auth } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export const Navbar: React.FC = () => {
  const { currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  if (!currentUser) return null;

  return (
    <nav className="navbar glass">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="navbar-brand">
          <LayoutDashboard size={24} color="var(--accent-primary)" />
          TaskFlow
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={toggleTheme} className="btn" style={{ background: 'transparent', padding: '0.5rem', color: 'var(--text-primary)' }} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {currentUser.email}
          </span>
          <button onClick={handleLogout} className="btn btn-secondary">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
};
