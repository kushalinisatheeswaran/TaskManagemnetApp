import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Trash2, Paperclip } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  priority?: 'Low' | 'Medium' | 'High';
  assignee?: string;
  attachments?: { name: string, url: string }[];
}

interface TaskCardProps {
  task: Task;
  index: number;
  onUpdateStatus: (taskId: string, status: string) => void;
  onDelete: (taskId: string) => void;
  onClick: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, index, onUpdateStatus, onDelete, onClick }) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const isOverdue = new Date(task.dueDate) < today && task.status !== 'Done';

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          className="task-item"
          onClick={() => onClick(task)}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.9 : 1,
            boxShadow: snapshot.isDragging ? '0 8px 16px rgba(0,0,0,0.2)' : 'none',
            transform: provided.draggableProps.style?.transform,
          }}
        >
          {task.priority && (
            <div style={{
              display: 'inline-block',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              fontSize: '0.7rem',
              marginBottom: '0.4rem',
              backgroundColor: task.priority === 'High' ? 'rgba(239, 68, 68, 0.15)' : task.priority === 'Medium' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(34, 197, 94, 0.15)',
              color: task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#f97316' : '#22c55e',
            }}>
              {task.priority}
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="task-item-title" style={{ flexGrow: 1 }}>{task.title}</div>
            {task.assignee && (
              <div 
                title={task.assignee}
                style={{ 
                  width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-primary)', 
                  display: 'flex', alignItems: 'center', justifySelf: 'flex-end', justifyContent: 'center', color: 'white',
                  fontWeight: 'bold', fontSize: '10px', marginLeft: '0.5rem', flexShrink: 0
                }}
              >
                {task.assignee.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {task.description && <div className="task-item-desc">{task.description}</div>}
          {task.dueDate && (
            <div className="task-item-desc" style={{ 
              color: isOverdue ? '#ef4444' : 'var(--accent-primary)', 
              fontSize: '0.75rem',
              fontWeight: isOverdue ? '600' : 'normal'
            }}>
              Due: {task.dueDate} {isOverdue ? '(Overdue)' : ''}
            </div>
          )}
          <div className="task-item-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select 
                value={task.status} 
                onChange={e => { e.stopPropagation(); onUpdateStatus(task.id, e.target.value); }}
                onClick={e => e.stopPropagation()}
                style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.2rem', fontSize: '0.75rem', borderRadius: '4px', width: 'auto' }}
              >
                <option value="Todo">Todo</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
              
              {task.attachments && task.attachments.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  <Paperclip size={12} />
                  <span>{task.attachments.length}</span>
                </div>
              )}
            </div>
            <button onClick={e => { e.stopPropagation(); onDelete(task.id); }} style={{ background: 'none', border: 'none', color: '#ef4444', padding: '0.2rem' }}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
};
