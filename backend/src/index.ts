import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import projectsRouter from './routes/projects';
import tasksRouter from './routes/tasks';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
