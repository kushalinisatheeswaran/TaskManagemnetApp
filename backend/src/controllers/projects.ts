import { Response } from 'express';
import { db } from '../config/firebase';
import { AuthenticatedRequest } from '../middleware/auth';

const projectsRef = db.collection('projects');
const tasksRef = db.collection('tasks');

export const getProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const email = req.user.email;
    const snapshot = await projectsRef.where('members', 'array-contains', email).get();
    const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

export const createProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.uid;
    const { name, description } = req.body;
    const docRef = await projectsRef.add({
      userId,
      members: [req.user.email],
      name,
      description,
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ id: docRef.id, userId, members: [req.user.email], name, description });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const getProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const doc = await projectsRef.doc(id).get();
    const projectData = doc.data();
    if (!doc.exists || !projectData?.members?.includes(req.user.email)) {
       res.status(404).json({ error: 'Project not found or access denied' });
       return;
    }
    res.json({ id: doc.id, ...projectData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

export const updateProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const docRef = projectsRef.doc(id);
    const doc = await docRef.get();
    const projectData = doc.data();
    if (!doc.exists || !projectData?.members?.includes(req.user.email)) {
       res.status(404).json({ error: 'Project not found or access denied' });
       return;
    }
    await docRef.update(req.body);
    res.json({ id: doc.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const docRef = projectsRef.doc(id);
    const doc = await docRef.get();
    const projectData = doc.data();
    if (!doc.exists || projectData?.userId !== req.user.uid) {
       res.status(404).json({ error: 'Project not found or admin access required' });
       return;
    }
    await docRef.delete();
    
    // Delete all tasks in the project
    const tasksSnapshot = await tasksRef.where('projectId', '==', id).get();
    const batch = db.batch();
    tasksSnapshot.docs.forEach(obj => {
      batch.delete(obj.ref);
    });
    await batch.commit();

    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

export const addMember = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const docRef = projectsRef.doc(id);
    const doc = await docRef.get();
    const projectData = doc.data();
    
    if (!doc.exists || !projectData?.members?.includes(req.user.email)) {
       res.status(404).json({ error: 'Project not found or access denied' });
       return;
    }

    const members = projectData.members || [];
    if (!members.includes(email)) {
      members.push(email);
      await docRef.update({ members });
    }

    res.json({ message: 'Member added', members });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add member' });
  }
};
