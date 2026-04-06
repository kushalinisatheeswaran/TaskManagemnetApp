import { Router } from 'express';
import { getProjects, createProject, getProject, updateProject, deleteProject, addMember } from '../controllers/projects';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/members', addMember);

export default router;
