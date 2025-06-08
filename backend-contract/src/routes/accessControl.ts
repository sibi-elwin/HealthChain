import { Router, RequestHandler } from 'express';
import { ContractService } from '../services/contractService';

const router = Router();
const contractService = new ContractService();

const grantAccessHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { patientAddress, doctorAddress } = req.body;
    const tx = await contractService.grantAccess(patientAddress, doctorAddress);
    res.json({ success: true, transactionHash: tx.hash });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const revokeAccessHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { patientAddress, doctorAddress } = req.body;
    const tx = await contractService.revokeAccess(patientAddress, doctorAddress);
    res.json({ success: true, transactionHash: tx.hash });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const checkAccessHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { patientAddress, doctorAddress } = req.query;
    const hasAccess = await contractService.patientDoctorAccess(
      patientAddress as string,
      doctorAddress as string
    );
    res.json({ success: true, hasAccess });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const getDoctorAccessHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { doctorAddress } = req.params;
    // Get all patients and check access for each
    const patients = await contractService.getPatientRecordIds(doctorAddress);
    const accessList = await Promise.all(
      patients.map(async (patientId) => {
        const hasAccess = await contractService.patientDoctorAccess(patientId.toString(), doctorAddress);
        return hasAccess ? patientId.toString() : null;
      })
    );
    const access = accessList.filter(Boolean);
    res.json({ success: true, access });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

router.post('/grant', grantAccessHandler);
router.post('/revoke', revokeAccessHandler);
router.get('/check', checkAccessHandler);
router.get('/doctor/:doctorAddress', getDoctorAccessHandler);

export default router; 