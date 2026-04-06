import { Response } from 'express';
import { db } from '../config/firebase';
import { AuthenticatedRequest } from '../middleware/auth';

const activitiesRef = db.collection('activities');

export const getActivities = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const snapshot = await activitiesRef.where('taskId', '==', taskId).orderBy('createdAt', 'desc').get();
    const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(activities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};

export const logActivity = async (taskId: string, userId: string, userName: string, action: string) => {
  try {
    await activitiesRef.add({
      taskId,
      userId,
      userName,
      action,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log activity', error);
  }
};
