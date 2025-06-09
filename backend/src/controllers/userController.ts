import { Request, Response } from "express";
import { generateNonce, authenticate } from "../services/authService";
import { PrismaClient } from "@prisma/client";
import { blockchainService } from "../services/blockchainService";
import { UserRole } from "backend-contract/src/services/contractService";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { auditService } from "../services/auditService";
import { ethers } from 'ethers';
import { createHash } from 'crypto';
import { SessionService } from "../services/sessionService";

const prisma = new PrismaClient();

export const userController = {
  requestNonce: (req: Request, res: Response): void => {
    console.log('Request body:', req.body);
    const { address, purpose } = req.body;
    console.log('Extracted purpose from request:', purpose);
    if (!address) {
      console.log('No address provided');
      res.status(400).json({ error: "Address required" });
      return;
    }
    console.log('Generating nonce for address:', address, 'with purpose:', purpose);
    const nonce = generateNonce(address, purpose);
    console.log('Generated nonce:', nonce, 'for purpose:', purpose);
    const response = { 
      message: "Nonce generated successfully",
      data: { nonce }
    };
    console.log('Sending response:', response);
    res.json(response);
  },

  verifySignature: async (req: Request, res: Response): Promise<void> => {
    const { address, signature, purpose } = req.body;
    try {
      console.log('Verifying signature for address:', address);
      const { token } = authenticate(address, signature, purpose);
      console.log('Token generated:', token);

      // Find user by wallet address
      const user = await prisma.user.findUnique({
        where: { walletAddress: address }
      });

      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      // Only create session if purpose is 'login'
      if (purpose === 'login') {
        // Create session using sessionService
        const sessionService = new SessionService();
        await sessionService.createSession(user.id, token, 24 * 60 * 60, req);

        // Create audit log for login
        await auditService.createAuditLog(
          user.id,
          'LOGIN',
          'User logged in successfully',
          req
        );
      }

      res.json({ 
        message: "Signature verified successfully",
        data: { 
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
      });
    } catch (err: any) {
      console.error('Signature verification error:', err);
      res.status(400).json({ error: err.message });
    }
  },

  register: async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('Registration request received:', {
        ...req.body,
        signature: req.body.signature ? 'present' : 'missing'
      });

      const { 
        name, 
        email,
        walletAddress,
        dob,
        gender,
        allergies,
        bloodGroup,
        emergencyContact,
        signature,
        publicKey
      } = req.body;

      // Validate required fields
      const requiredFields = {
        name: 'Name',
        email: 'Email',
        walletAddress: 'Wallet Address',
        dob: 'Date of Birth',
        gender: 'Gender',
        signature: 'Signature',
        publicKey: 'Public Key'
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([key]) => !req.body[key])
        .map(([_, label]) => label);

      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        res.status(400).json({ 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ error: "Invalid email format" });
        return;
      }

      // Validate date of birth
      const dobDate = new Date(dob);
      if (isNaN(dobDate.getTime())) {
        res.status(400).json({ error: "Invalid date of birth" });
        return;
      }

      // Verify the signature with registration purpose
      try {
        const { token } = authenticate(walletAddress, signature, 'registration');
        
        // Create user and patient profile in database
        const user = await prisma.user.create({
          data: {
            name,
            email,
            role: 'patient',
            walletAddress,
            publicKey,
            patientProfile: {
              create: {
                dob: dobDate,
                gender,
                allergies,
                bloodGroup,
                emergencyContact
              }
            }
          },
          include: {
            patientProfile: true
          }
        });

        // Add user role to blockchain
        try {
          await blockchainService.addUserRole(walletAddress, UserRole.PATIENT);
          console.log('User role added to blockchain successfully');

          // Verify the role was added
          const hasRole = await blockchainService.checkUserRole(walletAddress, UserRole.PATIENT);
          if (!hasRole) {
            throw new Error('Failed to verify role addition to blockchain');
          }

          // Add audit log for user registration
          await auditService.createAuditLog(
            user.id,
            'USER_REGISTRATION',
            JSON.stringify({
              email,
              role: 'patient',
              walletAddress
            }),
            req
          );
        } catch (blockchainError) {
          console.error('Failed to add user role to blockchain:', blockchainError);
          // Rollback database changes if blockchain role addition fails
          try {
            // Delete patient profile first
            await prisma.patient.delete({
              where: { userId: user.id }
            });
            // Then delete user
            await prisma.user.delete({
              where: { walletAddress }
            });
          } catch (rollbackError) {
            console.error('Failed to rollback database changes:', rollbackError);
          }
          throw new Error('Failed to add user role to blockchain. Registration incomplete.');
        }

        console.log('Registration successful:', {
          user,
          token
        });

        res.status(201).json({
          message: "User registered successfully",
          data: {
            user,
            token
          }
        });
      } catch (err: any) {
        console.error('Signature verification failed:', err);
        res.status(401).json({ error: "Invalid signature" });
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'P2002') {
        res.status(400).json({ 
          error: "Email or wallet address already registered" 
        });
        return;
      }
      res.status(500).json({ error: err.message });
    }
  },

  checkUserRoles: async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      
      // Check in database
      const dbUser = await prisma.user.findUnique({
        where: { walletAddress },
        select: { role: true }
      });

      // Check in blockchain
      const hasPatientRole = await blockchainService.checkUserRole(walletAddress, UserRole.PATIENT);
      const hasDoctorRole = await blockchainService.checkUserRole(walletAddress, UserRole.DOCTOR);
      const hasAdminRole = await blockchainService.checkUserRole(walletAddress, UserRole.ADMIN);

      res.json({
        message: "User roles retrieved successfully",
        data: {
          database: {
            role: dbUser?.role || null
          },
          blockchain: {
            roles: {
              patient: hasPatientRole,
              doctor: hasDoctorRole,
              admin: hasAdminRole
            }
          }
        }
      });
    } catch (err: any) {
      console.error('Error checking user roles:', err);
      res.status(500).json({ error: err.message });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          password: true
        }
      });

      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      if (!user.password) {
        res.status(401).json({ error: 'Password not set for this account' });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // Create session
      await auditService.createSession(user.id, token, 24 * 60 * 60, req);

      // Create audit log
      await auditService.createAuditLog(
        user.id,
        'LOGIN',
        'User logged in successfully',
        req
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  },

  async getMedicalRecords(req: Request, res: Response) {
    try {
      // Get walletAddress from params
      const { walletAddress } = req.params;
      // Temporarily remove authentication check
      // const user = (req as any).user;
      // if (!user) {
      //   return res.status(401).json({ error: 'Authentication required' });
      // }
      // Only allow access if the authenticated user's walletAddress matches the requested one
      // if (user.walletAddress !== walletAddress) {
      //   return res.status(403).json({ error: 'Forbidden: You can only access your own records' });
      // }
      // Get user from database
      const dbUser = await prisma.user.findUnique({
        where: { walletAddress },
        include: {
          recordsReceived: { // Records created by this user (patient)
            include: {
              accessGrants: { // Include access grants on these records
                include: {
                  user: true // Include the user the grant is for (doctor)
                }
              }
            }
          }
        }
      });

      if (!dbUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // The user is a patient viewing their own records.
      // The records they see are the ones they created (recordsReceived).
      // These records should include the rawAesKey if it's stored in the DB.

      // Map the database records to the desired response format.
      // Ensure rawAesKey is included.
      const records = dbUser.recordsReceived.map((dbRecord) => ({
          ...dbRecord, // Includes id, title, description, ipfsHash, rawAesKey, fileType, etc.
          // Do not include blockchainData here unless explicitly needed and fetched
          // blockchainData: undefined // Explicitly set if not fetching blockchain details here
      }));

      // Add audit log for medical records viewing
      await auditService.createAuditLog(
        dbUser.id,
        'MEDICAL_RECORDS_VIEWED',
        `Viewed ${records.length} medical records`,
        req
      );

      res.json({ data: { records } });
    } catch (error: any) {
      console.error('Error fetching medical records:', error);
      res.status(500).json({ error: 'Failed to fetch medical records' });
    }
  },

  async uploadMedicalRecord(req: Request, res: Response) {
    try {
      const { walletAddress } = req.params;
      // Destructure rawAesKey, fileType, title, description, ipfsHash, blockchainTxHash from the request body
      const { title, description, ipfsHash, blockchainTxHash, rawAesKey, fileType } = req.body;

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { walletAddress }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Add record to database
      const record = await prisma.medicalRecord.create({
        data: {
          title: title || '',
          description: description || '',
          ipfsHash: ipfsHash || '',
          createdById: user.id,
          forUserId: user.id, // Record is for the patient who uploaded it
          blockchainTxHash: blockchainTxHash || null,
          rawAesKey: rawAesKey || null, // Save the raw AES key
          fileType: fileType || null // Save the fileType
        }
      });

      // Add audit log for medical record upload
      await auditService.createAuditLog(
        user.id,
        'MEDICAL_RECORD_UPLOAD',
        JSON.stringify({
          recordId: record.id,
          title,
          fileType
        }),
        req
      );

      // Return the created record
      res.json({
        data: {
          record
        }
      });
    } catch (error: any) {
      console.error('Error uploading medical record:', error);
      res.status(500).json({ error: error.message || 'Failed to upload medical record' });
    }
  },

  async revokeAccess(req: Request, res: Response) {
    try {
      const { walletAddress, recordId } = req.params;
      const { doctorAddress } = req.body;

      const [owner, doctor] = await Promise.all([
        prisma.user.findUnique({ where: { walletAddress } }),
        prisma.user.findUnique({ where: { walletAddress: doctorAddress } })
      ]);

      if (!owner || !doctor) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Revoke access in blockchain
      const tx = await blockchainService.revokeAccess(walletAddress, doctorAddress);

      // Revoke access in database
      const accessGrant = await prisma.accessGrant.deleteMany({
        where: {
          recordId,
          userId: doctor.id,
          grantedById: owner.id
        }
      });

      // Add audit log for access revocation
      await auditService.createAuditLog(
        owner.id,
        'ACCESS_REVOKED',
        JSON.stringify({
          recordId,
          doctorAddress
        }),
        req
      );

      res.json({ 
        data: { 
          accessGrant,
          transactionHash: tx.hash
        } 
      });
    } catch (error: any) {
      console.error('Error revoking access:', error);
      res.status(500).json({ error: 'Failed to revoke access' });
    }
  },

  /**
   * Records a confirmed on-chain access grant in the database.
   * This endpoint is called by the frontend *after* the blockchain transaction is mined.
   */
  async recordAccessGrantedDb(req: Request, res: Response) {
    try {
      const { walletAddress, recordId } = req.params; // walletAddress is the patient's address
      const { doctorAddress, encryptedAesKey, transactionHash } = req.body; // Add encryptedAesKey and transactionHash

      // Find the patient (owner) and doctor users by their wallet addresses
      const [owner, doctor] = await Promise.all([
        prisma.user.findUnique({ where: { walletAddress } }),
        prisma.user.findUnique({ where: { walletAddress: doctorAddress } }),
      ]);

      if (!owner || !doctor) {
        // Log an error if users are not found, but still return success to frontend
        // as the on-chain part was successful.
        console.error(`User or Doctor not found for DB grant recording: Patient ${walletAddress}, Doctor ${doctorAddress}`);
        // Decide on appropriate response - maybe 200 with a warning, or 404 if essential
        // For now, let's return 200 as the on-chain grant is the source of truth
        return res.status(200).json({ message: 'On-chain grant recorded, but database update skipped due to user not found' });
      }

      // Check if the grant already exists to avoid duplicates
      const existingGrant = await prisma.accessGrant.findFirst({
        where: {
          recordId: recordId,
          userId: doctor.id, // Doctor's user ID
          grantedById: owner.id // Patient's user ID
        }
      });

      if (existingGrant) {
        console.log(`Access grant already exists in DB for record ${recordId} to doctor ${doctorAddress} by patient ${walletAddress}`);
        return res.status(200).json({ message: 'Access grant already exists in database' });
      }

      // Create access grant in database
      const accessGrant = await prisma.accessGrant.create({
        data: {
          userId: doctor.id, // Doctor's user ID
          recordId: recordId, // Medical record ID
          grantedById: owner.id, // Patient's user ID
          encryptedAesKey: encryptedAesKey // Store the raw AES key (field name is misleading)
        }
      });

      // Update the medical record with the transaction hash
      await prisma.medicalRecord.update({
        where: { id: recordId },
        data: { blockchainTxHash: transactionHash }
      });

      // Optional: Log the database grant recording
      await auditService.createAuditLog(
        owner.id, // Log action by the patient
        'RECORD_ACCESS_DB_RECORDED',
        `Recorded DB access grant for record ${recordId} to doctor ${doctorAddress}`,
        req // Pass the request object for IP/User Agent
      );

      res.status(201).json({ // Use 201 Created status
        message: 'Access grant recorded in database successfully',
        data: { accessGrant }
      });
    } catch (error: any) {
      console.error('Error recording access grant in database:', error);
      // Return a 500 error if the database operation fails
      res.status(500).json({ error: 'Failed to record access grant in database' });
    }
  },

  async getPublicKey(req: Request, res: Response): Promise<void> {
    // This function was added for the new encryption scheme and should be removed/commented out if reverting
    // Keeping it commented out or returning an error for now.
    console.warn('getPublicKey endpoint is not intended for use in the reverted raw key flow.');
    res.status(501).json({ error: 'This endpoint is not available in the current configuration.' });

    // try {
    //   const { walletAddress } = req.params;

    //   const user = await prisma.user.findUnique({
    //     where: { walletAddress },
    //     select: { publicKey: true },
    //   });

    //   if (!user || !user.publicKey) {
    //     res.status(404).json({ error: 'Public key not found for this user' });
    //     return;
    //   }

    //   res.json({
    //     message: 'Public key retrieved successfully',
    //     data: { publicKey: user.publicKey },
    //   });
    // } catch (error: any) {
    //   console.error('Error retrieving public key:', error);
    //   res.status(500).json({ error: error.message || 'Failed to retrieve public key' });
    // }
  },

  getAccessRequests: async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress } = req.params;

      const user = await prisma.user.findUnique({
        where: { walletAddress }
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const accessRequests = await prisma.accessRequest.findMany({
        where: {
          patientId: user.id,
          status: 'PENDING'
        },
        include: {
          doctor: {
            include: {
              doctorProfile: true
            }
          }
        },
        orderBy: {
          requestedAt: 'desc'
        }
      });

      res.json({
        message: "Access requests retrieved successfully",
        data: { accessRequests }
      });
    } catch (err: any) {
      console.error('Error retrieving access requests:', err);
      res.status(500).json({ error: err.message });
    }
  },

  reviewAccessRequest: async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress, requestId } = req.params;
      const { status } = req.body;

      const user = await prisma.user.findUnique({
        where: { walletAddress }
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const accessRequest = await prisma.accessRequest.findUnique({
        where: { id: requestId },
        include: {
          doctor: true
        }
      });

      if (!accessRequest) {
        res.status(404).json({ error: "Access request not found" });
        return;
      }

      if (accessRequest.patientId !== user.id) {
        res.status(403).json({ error: "Not authorized to review this request" });
        return;
      }

      if (accessRequest.status !== 'PENDING') {
        res.status(400).json({ error: "Request has already been reviewed" });
        return;
      }

      // Update access request status
      const updatedRequest = await prisma.accessRequest.update({
        where: { id: requestId },
        data: {
          status,
          reviewedAt: new Date()
        }
      });

      // Create notification for doctor
      await prisma.notification.create({
        data: {
          userId: accessRequest.doctorId,
          type: 'ACCESS_REQUEST_REVIEWED',
          title: 'Access Request Reviewed',
          message: `Your access request has been ${status.toLowerCase()}`,
          data: {
            requestId,
            status,
            timestamp: new Date().toISOString()
          }
        }
      });

      // Add audit log
      await auditService.createAuditLog(
        user.id,
        'ACCESS_REQUEST_REVIEWED',
        JSON.stringify({
          requestId,
          status
        }),
        req
      );

      res.json({
        message: "Access request reviewed successfully",
        data: { accessRequest: updatedRequest }
      });
    } catch (err: any) {
      console.error('Error reviewing access request:', err);
      res.status(500).json({ error: err.message });
    }
  },

  getNotifications: async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress } = req.params;

      const user = await prisma.user.findUnique({
        where: { walletAddress }
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const notifications = await prisma.notification.findMany({
        where: {
          userId: user.id
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({
        message: "Notifications retrieved successfully",
        data: { notifications }
      });
    } catch (err: any) {
      console.error('Error retrieving notifications:', err);
      res.status(500).json({ error: err.message });
    }
  },

  markNotificationAsRead: async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress, notificationId } = req.params;

      const user = await prisma.user.findUnique({
        where: { walletAddress }
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
          userId: user.id
        },
        data: {
          read: true
        }
      });

      res.json({
        message: "Notification marked as read",
        data: { notification }
      });
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      res.status(500).json({ error: err.message });
    }
  },

  validateToken: async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
      }

      const token = authHeader.split(' ')[1];
      const sessionService = new SessionService();

      // Validate session
      const session = await sessionService.validateSession(token);
      if (!session) {
        res.status(401).json({ error: 'Invalid or expired session' });
        return;
      }

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          walletAddress: true
        }
      });

      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      // Create audit log for token validation
      await auditService.createAuditLog(
        user.id,
        'TOKEN_VALIDATED',
        'Token validation successful',
        req
      );

      res.json({
        message: 'Token is valid',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            walletAddress: user.walletAddress
          }
        }
      });
    } catch (err: any) {
      console.error('Token validation error:', err);
      res.status(500).json({ error: 'Token validation failed' });
    }
  }
}; 