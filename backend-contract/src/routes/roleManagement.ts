import { Router, RequestHandler } from 'express';
import { ContractService, UserRole } from '../services/contractService';

const router = Router();
const contractService = new ContractService();

const addRoleHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { userAddress, role, metadata } = req.body;
    
    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    await contractService.addUserRole(userAddress, role);
    res.json({ success: true, message: `Role ${role} added successfully` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const removeRoleHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { userAddress, role } = req.body;
    
    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    await contractService.removeUserRole(userAddress, role);
    res.json({ success: true, message: `Role ${role} removed successfully` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const getUserRolesHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { userAddress } = req.params;
    const roles = await Promise.all(
      Object.values(UserRole).map(async (role) => ({
        role,
        hasRole: await contractService.hasRole(userAddress, role)
      }))
    );
    res.json({ success: true, roles: roles.filter(r => r.hasRole).map(r => r.role) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const checkRoleHandler: RequestHandler = async (req, res): Promise<void> => {
  try {
    const { userAddress, role } = req.query;
    
    // Validate role
    if (!Object.values(UserRole).includes(role as UserRole)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    const hasRole = await contractService.hasRole(
      userAddress as string,
      role as UserRole
    );
    res.json({ success: true, hasRole });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

router.post('/add', addRoleHandler);
router.post('/remove', removeRoleHandler);
router.get('/:userAddress', getUserRolesHandler);
router.get('/check', checkRoleHandler);

export default router; 