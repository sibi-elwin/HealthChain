import express from 'express';
import dotenv from 'dotenv';
import medicalRecordsRouter from './routes/medicalRecords';
import accessControlRouter from './routes/accessControl';
import roleManagementRouter from './routes/roleManagement';

dotenv.config();

const app = express();
app.use(express.json());

// Mount routes
app.use('/records', medicalRecordsRouter);
app.use('/access', accessControlRouter);
app.use('/roles', roleManagementRouter);

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Contract interaction server running on port ${PORT}`);
}); 