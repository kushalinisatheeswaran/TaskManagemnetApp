import { Router } from 'express';
import { getTasks, getAllTasks, createTask, updateTask, deleteTask } from '../controllers/tasks';
import { authenticate } from '../middleware/auth';
import commentsRouter from './comments';
import activitiesRouter from './activities';

const router = Router();

router.use(authenticate);

router.get('/all', getAllTasks);
router.get('/project/:projectId', getTasks);
router.post('/project/:projectId', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

router.use('/:taskId/comments', commentsRouter);
router.use('/:taskId/activities', activitiesRouter);

export default router;
