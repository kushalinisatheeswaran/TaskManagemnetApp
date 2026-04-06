import { Router } from 'express';
import { getActivities } from '../controllers/activities';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.get('/', getActivities);

export default router;
