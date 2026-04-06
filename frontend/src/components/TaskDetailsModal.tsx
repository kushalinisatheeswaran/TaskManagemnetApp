import React, { useState, useEffect } from 'react';
import { X, Send, Paperclip, File, Download } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import api from '../services/api';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  priority?: 'Low' | 'Medium' | 'High';
  assignee?: string;
  projectId?: string;
  attachments?: { name: string, url: string }[];
}

interface Comment {
  id: string;
  userName: string;
  text: string;
  createdAt: string;
}

interface Activity {
  id: string;
  userName: string;
  action: string;
  createdAt: string;
}

interface TaskDetailsModalProps {
  task: Task;
  projectMembers: string[];
  onClose: () => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({ task, projectMembers, onClose }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!task.id) return;

    const commentsQuery = query(
      collection(db, 'comments'),
      where('taskId', '==', task.id),
      orderBy('createdAt', 'asc')
    );

    const activitiesQuery = query(
      collection(db, 'activities'),
      where('taskId', '==', task.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
      const liveComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comment[];
      setComments(liveComments);
    });

    const unsubscribeActivities = onSnapshot(activitiesQuery, (snapshot) => {
      const liveActivities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Activity[];
      setActivities(liveActivities);
    });

    return () => {
      unsubscribeComments();
      unsubscribeActivities();
    };
  }, [task.id]);

  const handleAssigneeChange = async (newAssignee: string) => {
    try {
      await api.put(`/tasks/${task.id}`, { assignee: newAssignee || null });
    } catch (err) {
      console.error('Failed to change assignee');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post(`/tasks/${task.id}/comments`, { text: newComment });
      setNewComment('');
      // Real-time listener will instantly append the comment
    } catch (error) {
      console.error('Failed to add comment', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileRef = ref(storage, `tasks/${task.id}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      const newAttachment = { name: file.name, url };
      const updatedAttachments = [...(task.attachments || []), newAttachment];
      
      await api.put(`/tasks/${task.id}`, { attachments: updatedAttachments });
    } catch (error) {
      console.error('Failed to upload file', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>{task.title}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span className={`status-badge status-${task.status.toLowerCase().replace(' ', '-')}`}>{task.status}</span>
            {task.priority && (
              <span style={{ 
                padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
                backgroundColor: task.priority === 'High' ? 'rgba(239, 68, 68, 0.15)' : task.priority === 'Medium' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                color: task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#f97316' : '#22c55e'
              }}>
                {task.priority}
              </span>
            )}
            
            <select
              value={task.assignee || ''}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              style={{
                background: 'var(--bg-color)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.8rem'
              }}
            >
              <option value="">Unassigned</option>
              {projectMembers.map(email => (
                <option key={email} value={email}>{email}</option>
              ))}
            </select>

            {task.dueDate && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>Due: {task.dueDate}</span>}
          </div>
          <p style={{ color: 'var(--text-secondary)', background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px' }}>
            {task.description || 'No description provided.'}
          </p>

          {task.attachments && task.attachments.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Attachments</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {task.attachments.map((att, idx) => (
                  <a 
                    key={idx} 
                    href={att.url} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', 
                      background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', 
                      borderRadius: '8px', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.8rem' 
                    }}
                  >
                    <File size={16} color="var(--accent-primary)" />
                    {att.name}
                    <Download size={14} style={{ color: 'var(--text-secondary)' }} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem', alignItems: 'center' }}>
          <button 
            style={{ background: 'transparent', border: 'none', padding: '0.5rem 1rem', borderBottom: activeTab === 'comments' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'comments' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            onClick={() => setActiveTab('comments')}
          >
            Comments ({comments.length})
          </button>
          <button 
            style={{ background: 'transparent', border: 'none', padding: '0.5rem 1rem', borderBottom: activeTab === 'activity' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'activity' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
          
          <div style={{ marginLeft: 'auto' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: uploading ? 'wait' : 'pointer', color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
              <Paperclip size={16} />
              {uploading ? 'Uploading...' : 'Attach File'}
              <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '1rem', paddingRight: '0.5rem' }}>
          {activeTab === 'comments' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {comments.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No comments yet.</p> : null}
              {comments.map(c => (
                <div key={c.id} style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 600 }}>{c.userName}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <p style={{ fontSize: '0.9rem' }}>{c.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activities.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No activity yet.</p> : null}
              {activities.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', marginTop: '0.3rem' }} />
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.userName}</span> <span style={{ color: 'var(--text-secondary)' }}>{a.action.toLowerCase()}</span>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.2rem' }}>{new Date(a.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {activeTab === 'comments' && (
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
            <input 
              value={newComment} 
              onChange={e => setNewComment(e.target.value)} 
              placeholder="Write a comment..." 
              style={{ flexGrow: 1 }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }}>
              <Send size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
