import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Folder, Search, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import api from '../services/api';

interface Project {
  id: string;
  name: string;
  description: string;
}

export const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [allTasks, setAllTasks] = useState<any[]>([]);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchDashboardData = async () => {
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        api.get('/projects'),
        api.get('/tasks/all')
      ]);
      setProjects(projectsRes.data);
      setAllTasks(tasksRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/projects', { name: newName, description: newDesc });
      setNewName('');
      setNewDesc('');
      setShowModal(false);
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to create project', error);
    }
  };

  if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading projects...</div>;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Your Projects</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Manage and organize your tasks across different projects.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> New Project
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
           <h3 style={{ fontSize: '2rem', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>{allTasks.length}</h3>
           <p style={{ color: 'var(--text-secondary)' }}>Total Tasks</p>
        </div>
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
           <h3 style={{ fontSize: '2rem', color: '#10b981', marginBottom: '0.5rem' }}>{allTasks.filter(t => t.status === 'Done').length}</h3>
           <p style={{ color: 'var(--text-secondary)' }}>Completed</p>
        </div>
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
           <h3 style={{ fontSize: '2rem', color: '#3b82f6', marginBottom: '0.5rem' }}>{allTasks.filter(t => t.status === 'In Progress').length}</h3>
           <p style={{ color: 'var(--text-secondary)' }}>In Progress</p>
        </div>
      </div>

      {allTasks.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', alignSelf: 'flex-start' }}><BarChart3 size={18} /> Task Status Distribution</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Todo', value: allTasks.filter(t => t.status === 'Todo').length },
                    { name: 'In Progress', value: allTasks.filter(t => t.status === 'In Progress').length },
                    { name: 'Done', value: allTasks.filter(t => t.status === 'Done').length },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#64748b" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#10b981" />
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
         <div style={{ flex: 1, position: 'relative' }}>
           <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
           <input 
             placeholder="Search projects..." 
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
           />
         </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
          <Folder size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3>No projects yet</h3>
          <p>Create your first project to get started.</p>
        </div>
      ) : (
        <div className="grid-cards">
          {filteredProjects.map(project => (
             <Link to={`/project/${project.id}`} key={project.id} className="card" style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
                <h3 className="card-title">{project.name}</h3>
                <p className="card-desc">{project.description || 'No description provided.'}</p>
             </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem' }}>Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>Project Name</label>
                <input required value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
