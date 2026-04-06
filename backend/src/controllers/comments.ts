import { Response } from 'express';
import { db } from '../config/firebase';
import { AuthenticatedRequest } from '../middleware/auth';

const commentsRef = db.collection('comments');

export const getComments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const snapshot = await commentsRef.where('taskId', '==', taskId).orderBy('createdAt', 'asc').get();
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

export const createComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;
    const docRef = await commentsRef.add({
      taskId,
      userId: req.user.uid,
      userName: req.user.email, // using email as display name
      text,
      createdAt: new Date().toISOString()
    });
    const newCommentDoc = await docRef.get();
    res.status(201).json({ id: docRef.id, ...newCommentDoc.data() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};
