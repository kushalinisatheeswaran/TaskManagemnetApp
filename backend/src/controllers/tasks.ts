import { Response } from 'express';
import { db } from '../config/firebase';
import { AuthenticatedRequest } from '../middleware/auth';
import { logActivity } from './activities';

const tasksRef = db.collection('tasks');

export const getTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;
    
    let query: FirebaseFirestore.Query = tasksRef.where('projectId', '==', projectId);
    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const getAllTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectsSnapshot = await db.collection('projects').where('members', 'array-contains', req.user.email).get();
    const projectIds = projectsSnapshot.docs.map(doc => doc.id);
    
    if (projectIds.length === 0) {
      res.json([]);
      return;
    }

    // Since 'in' allows max 10 elements, we chunk for safety in a real app, 
    // but here we just slice 10 for demonstration or use multiple queries.
    const allTasks: any[] = [];
    for (let i = 0; i < projectIds.length; i += 10) {
      const chunk = projectIds.slice(i, i + 10);
      const snapshot = await tasksRef.where('projectId', 'in', chunk).get();
      snapshot.docs.forEach(doc => allTasks.push({ id: doc.id, ...doc.data() }));
    }

    res.json(allTasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all tasks' });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { title, description, status, dueDate, priority, assignee } = req.body;
    const docRef = await tasksRef.add({
      projectId,
      userId: req.user.uid,
      title,
      description: description || '',
      status: status || 'Todo',
      dueDate: dueDate || null,
      priority: priority || 'Low',
      assignee: assignee || null,
      attachments: [],
      createdAt: new Date().toISOString()
    });
    await logActivity(docRef.id, req.user.uid, req.user.email || 'User', 'Task created');
    res.status(201).json({ id: docRef.id, projectId, title, description, status, dueDate, priority: priority || 'Low', assignee: assignee || null, attachments: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const docRef = tasksRef.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
       res.status(404).json({ error: 'Task not found' });
       return;
    }
    
    await docRef.update(req.body);
    res.json({ id: doc.id, ...doc.data(), ...req.body });

    let actionDesc = 'Task updated';
    if (req.body.status && doc.data()?.status !== req.body.status) {
      actionDesc = `Status changed to ${req.body.status}`;
    }
    await logActivity(doc.id, req.user.uid, req.user.email || 'User', actionDesc);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const docRef = tasksRef.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
       res.status(404).json({ error: 'Task not found' });
       return;
    }
    await docRef.delete();
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
};
