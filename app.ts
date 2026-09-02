import express, { Application } from 'express'
import apiRouter from './routes/router';

const PORT: number = 5000;

const app : Application = express();

app.use(express.json());

app.use('/api/v1', apiRouter);

app.listen(PORT, () => {
    console.log(`SERVER RUNNING AT ${PORT}`)
});

