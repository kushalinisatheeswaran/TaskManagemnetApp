import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ProjectDetails } from './pages/ProjectDetails';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './config/firebase';

const AppContent = () => {
  const { loading, currentUser } = useAuth();
  
  React.useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  React.useEffect(() => {
    if (!currentUser?.email) return;

    let isInitialRender = true;

    const q = query(
      collection(db, 'tasks'),
      where('assignee', '==', currentUser.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (isInitialRender) {
        isInitialRender = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const task = change.doc.data();
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Task Assigned', {
              body: `You have been assigned to: ${task.title}`
            });
          }
        }
        if (change.type === 'modified') {
          const task = change.doc.data();
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Task Updated', {
              body: `Update on task: ${task.title} - Status: ${task.status}`
            });
          }
        }
      });
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <Navbar />
      <div className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/project/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app-layout">
            <AppContent />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
