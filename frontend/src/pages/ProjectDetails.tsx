import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Search, Filter, Users, UserPlus } from 'lucide-react';
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { TaskCard } from '../components/TaskCard';
import { TaskDetailsModal } from '../components/TaskDetailsModal';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  priority?: 'Low' | 'Medium' | 'High';
}

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'Todo', dueDate: '', priority: 'Low' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const fetchData = async () => {
    try {
       const res = await api.get(`/projects/${id}`);
       setProject(res.data);
    } catch (error) {
       console.error('Failed to fetch project details');
    } finally {
       setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (!currentUser || !id) return;

    const q = query(
      collection(db, 'tasks'), 
      where('projectId', '==', id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(liveTasks);
    });

    return () => unsubscribe();
  }, [id, currentUser]);

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      navigate('/');
    } catch (error) {
      console.error('Failed to delete project');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/tasks/project/${id}`, newTask);
      setNewTask({ title: '', description: '', status: 'Todo', dueDate: '', priority: 'Low' });
      setShowTaskModal(false);
      // Real-time listener handles the update automatically
    } catch (err) {
      console.error('Failed to create task');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
       // Optimistic update
       setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
       await api.put(`/tasks/${taskId}`, { status });
       // Real-time listener will sync if optimistic update differs
    } catch (err) {
       console.error('Failed to update status');
       // In a real app we might revert the optimistic update or fetch data
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if(!confirm('Delete this task?')) return;
    try {
       setTasks(prev => prev.filter(t => t.id !== taskId));
       await api.delete(`/tasks/${taskId}`);
    } catch (err) {
       console.error('Failed to delete task');
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      await api.post(`/projects/${id}/members`, { email: inviteEmail });
      setInviteEmail('');
      setShowInviteModal(false);
      fetchData(); // Refresh project data to show new member
    } catch (err) {
      console.error('Failed to invite member');
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    const oldStatus = source.droppableId;

    if (newStatus !== oldStatus) {
      // Optimistic update
      setTasks(prev => prev.map(t => 
        t.id === draggableId ? { ...t, status: newStatus } : t
      ));

      try {
        await api.put(`/tasks/${draggableId}`, { status: newStatus });
      } catch (err) {
        console.error('Failed to update status after drag', err);
      }
    }
  };

  if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading project...</div>;
  if (!project) return <div className="container" style={{ padding: '2rem' }}>Project not found.</div>;

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'All' || t.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const getStatusColumn = (statusName: string) => {
    return filteredTasks
      .filter(t => t.status === statusName)
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '1rem' }}>
         <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
           <ArrowLeft size={16} /> Back to Projects
         </Link>
      </div>
      <div className="page-header">
        <div>
          <h1>{project.name}</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{project.description}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {project.members && project.members.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', marginRight: '1rem' }}>
              {project.members.map((email: string, i: number) => (
                <div 
                  key={email} 
                  title={email}
                  style={{ 
                    width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                    fontWeight: 'bold', fontSize: '14px', border: '2px solid var(--bg-surface)',
                    marginLeft: i > 0 ? '-10px' : '0', zIndex: project.members.length - i 
                  }}
                >
                  {email.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          )}
          <button className="btn btn-secondary" onClick={() => setShowInviteModal(true)}>
            <UserPlus size={18} /> Invite
          </button>
          <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
            <Plus size={18} /> Add Task
          </button>
          <button className="btn btn-danger" onClick={handleDeleteProject}>
            <Trash2 size={18} /> Delete Project
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <Filter size={18} />
          <span style={{ fontWeight: 500 }}>Filters</span>
        </div>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Priority:</label>
          <select 
            value={filterPriority} 
            onChange={e => setFilterPriority(e.target.value)}
            style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="task-board">
          {['Todo', 'In Progress', 'Done'].map(status => (
            <Droppable droppableId={status} key={status}>
              {(provided, snapshot) => (
                <div 
                  className="task-column"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{
                    backgroundColor: snapshot.isDraggingOver ? 'rgba(255, 255, 255, 0.05)' : undefined,
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <div className="task-column-header">
                     <span>{status}</span>
                     <span style={{ fontSize: '0.8rem', background: 'var(--bg-color)', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
                       {getStatusColumn(status).length}
                     </span>
                  </div>
                  {getStatusColumn(status).map((task, index) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      index={index} 
                      onUpdateStatus={handleUpdateTaskStatus} 
                      onDelete={handleDeleteTask} 
                      onClick={setSelectedTask}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskDetailsModal task={selectedTask} projectMembers={project.members || []} onClose={() => setSelectedTask(null)} />
      )}

      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem' }}>Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Task Title</label>
                <input required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={24} /> Invite Team Member
            </h2>
            <form onSubmit={handleInviteMember}>
              <div className="form-group">
                <label>Member Email Address</label>
                <input required type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@example.com" />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
