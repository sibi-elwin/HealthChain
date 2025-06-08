import { Router, RequestHandler } from 'express';
import { ContractService } from '../services/contractService';

const router = Router();
const contractService = new ContractService();

// Medical Records Endpoints


const getRecordHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { recordId } = req.params;
    const record = await contractService.getMedicalRecord(parseInt(recordId));
    res.json({ success: true, record });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const getPatientRecordsHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { patientAddress } = req.params;
    const recordIds = await contractService.getPatientRecordIds(patientAddress);
    res.json({ success: true, recordIds: recordIds.map(id => id.toNumber()) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};


router.get('/:recordId', getRecordHandler);
router.get('/patient/:patientAddress', getPatientRecordsHandler);

export default router; 