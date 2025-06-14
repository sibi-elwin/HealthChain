import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { blockchainService } from "../services/blockchainService";
import { UserRole } from "backend-contract/src/services/contractService";
import { auditService } from "../services/auditService";
import { authenticate, generateNonce } from "../services/authService";
import { SessionService } from "../services/sessionService";
import { WebhookService } from "../services/webhookService";
import crypto from "crypto";
import { hashPassword } from "../utils/passwordUtils";

const prisma = new PrismaClient();

export const doctorController = {
  requestNonce: (req: Request, res: Response): void => {
    console.log('Doctor nonce request received:', req.body);
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

      // For wallet connection, just verify the signature
      if (purpose === 'wallet_connection') {
        res.json({ 
          message: "Signature verified successfully",
          data: { 
            token,
            verified: true
          }
        });
        return;
      }

      
      

      // For registration, we don't expect the user to exist
      if (purpose === 'registration') {
        res.json({ 
          message: "Signature verified successfully",
          data: { 
            token,
            verified: true
          }
        });
        return;
      }
      // Find user by wallet address
      const user = await prisma.user.findUnique({
        where: { walletAddress: address }
      });

      // For login, user must exist
      if (!user) {
        res.status(401).json({ error: 'Doctor not found' });
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
          'DOCTOR_LOGIN',
          'Doctor logged in successfully',
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

  validateToken: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      // For wallet connection tokens, we don't need to check for user/profile
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        res.status(401).json({ error: "No token provided" });
        return;
      }

      // Check if this is a wallet connection token
      const sessionService = new SessionService();
      const authSession = await sessionService.validateAuthSession(token);
      
      if (authSession) {
        // This is a wallet connection token, just verify it's valid
        res.json({
          message: "Token is valid",
          data: {
            verified: true
          }
        });
        return;
      }

      // For regular tokens, check user and profile
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          doctorProfile: true
        }
      });

      if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
      }

      if (!user.doctorProfile) {
        res.status(401).json({ error: "Doctor profile not found" });
        return;
      }

      
      res.json({
        message: "Token is valid",
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            walletAddress: user.walletAddress,
            doctorProfile: user.doctorProfile
          }
        }
      });
    } catch (err: any) {
      console.error('Token validation error:', err);
      res.status(401).json({ error: "Invalid or expired token" });
    }
  },

  register: async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('Doctor registration request received:', {
        ...req.body,
        signature: req.body.signature ? 'present' : 'missing',
        password: req.body.password ? 'present' : 'missing',
        publicKey: req.body.publicKey ? 'present' : 'missing',
        pairPublicKey: req.body.pairPublicKey ? 'present' : 'missing',
        encryptedPrivateKey: req.body.encryptedPrivateKey ? 'present' : 'missing',
        authSalt: req.body.authSalt ? 'present' : 'missing',
        encSalt: req.body.encSalt ? 'present' : 'missing'
      });

      const { 
        name, 
        email,
        walletAddress,
        specialization,
        licenseNumber,
        hospital,
        signature,
        publicKey,
        phoneNumber,
        password,
        pairPublicKey,
        encryptedPrivateKey,
        authSalt,
        encSalt
      } = req.body;

      // Validate required fields
      const requiredFields = {
        name: 'Name',
        email: 'Email',
        walletAddress: 'Wallet Address',
        specialization: 'Specialization',
        licenseNumber: 'License Number',
        signature: 'Signature',
        publicKey: 'Public Key',
        phoneNumber: 'Phone Number',
        password: 'Password',
        pairPublicKey: 'Access Control Public Key',
        encryptedPrivateKey: 'Encrypted Private Key',
        authSalt: 'Auth Salt',
        encSalt: 'Enc Salt'
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

      // Hash the password using PBKDF2 with the provided auth salt
      const hashedPassword = hashPassword(password, authSalt);

      // Create user with hashed password and salts
      const user = await prisma.user.create({
        data: {
          name,
          email,
          walletAddress,
          role: 'doctor',
          password: hashedPassword,
          authSalt,
          encSalt,
          publicKey,
          phoneNumber,
          doctorProfile: {
            create: {
              specialization,
              licenseNumber,
              hospital,
              pairPublicKey,
              encryptedPrivateKey
            }
          }
        },
        include: {
          doctorProfile: true
        }
      });

      // Add user role to blockchain
      try {
        await blockchainService.addUserRole(walletAddress, UserRole.DOCTOR);
        console.log('Doctor role added to blockchain successfully');

        // Verify the role was added
        const hasRole = await blockchainService.checkUserRole(walletAddress, UserRole.DOCTOR);
        if (!hasRole) {
          throw new Error('Failed to verify role addition to blockchain');
        }
      } catch (blockchainError) {
        console.error('Failed to add doctor role to blockchain:', blockchainError);
        // Rollback database changes if blockchain role addition fails
        try {
          await prisma.doctor.delete({
            where: { userId: user.id }
          });
          await prisma.user.delete({
            where: { walletAddress }
          });
        } catch (rollbackError) {
          console.error('Failed to rollback database changes:', rollbackError);
        }
        throw new Error('Failed to add doctor role to blockchain. Registration incomplete.');
      }

      // Log the registration
      await auditService.createAuditLog(
        user.id,
        'DOCTOR_REGISTRATION',
        JSON.stringify({
          specialization,
          licenseNumber,
          hospital
        }),
        req
      );

      console.log('Doctor registration successful:', {
        user
      });

      res.status(201).json({
        message: "Doctor registered successfully",
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            doctorProfile: user.doctorProfile
          }
        }
      });
    } catch (err: any) {
      console.error('Doctor registration error:', err);
      if (err.code === 'P2002') {
        res.status(400).json({ 
          error: "Email or wallet address already registered" 
        });
        return;
      }
      res.status(500).json({ error: err.message });
    }
  },

  getProfile: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          doctorProfile: true
        }
      });

      if (!user || !user.doctorProfile) {
        res.status(404).json({ error: "Doctor profile not found" });
        return;
      }

      // Add audit log for doctor profile viewing
      await auditService.createAuditLog(
        req.user.id,
        'DOCTOR_PROFILE_VIEWED',
        'Doctor profile retrieved',
        req
      );

      res.json({
        message: "Doctor profile retrieved successfully",
        data: user
      });
    } catch (err: any) {
      console.error('Error retrieving doctor profile:', err);
      res.status(500).json({ error: err.message });
    }
  },

  updateProfile: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const { specialization, hospital } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          doctorProfile: {
            update: {
              specialization,
              hospital
            }
          }
        },
        include: {
          doctorProfile: true
        }
      });

      // Log the profile update
      await auditService.createAuditLog(
        req.user.id,
        'DOCTOR_PROFILE_UPDATE',
        JSON.stringify({
          specialization,
          hospital
        }),
        req
      );

      res.json({
        message: "Doctor profile updated successfully",
        data: updatedUser
      });
    } catch (err: any) {
      console.error('Error updating doctor profile:', err);
      res.status(500).json({ error: err.message });
    }
  },

  verifyDoctorRole: async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress } = req.params;
      
      // Check in database
      const dbUser = await prisma.user.findUnique({
        where: { walletAddress },
        select: { role: true, id: true }
      });

      // Check in blockchain
      const hasDoctorRole = await blockchainService.checkUserRole(walletAddress, UserRole.DOCTOR);

      // Add audit log for doctor role verification
      if (dbUser) {
        await auditService.createAuditLog(
          dbUser.id,
          'DOCTOR_ROLE_VERIFIED',
          JSON.stringify({
            hasDoctorRole,
            walletAddress
          }),
          req
        );
      }

      res.json({
        message: "Doctor role verification complete",
        data: {
          database: {
            role: dbUser?.role || null
          },
          blockchain: {
            roles: {
              doctor: hasDoctorRole
            }
          }
        }
      });
    } catch (err: any) {
      console.error('Error verifying doctor role:', err);
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * Get medical records the authenticated doctor has been granted access to.
   */
  getAccessibleMedicalRecords: async (req: Request, res: Response): Promise<void> => {
    try {
      // 1. Ensure doctor is authenticated
      if (!req.user || req.user.role !== 'doctor') {
        res.status(403).json({ error: "Forbidden: Only doctors can access this resource" });
        return;
      }

      const doctorUserId = req.user.id;
      const doctorWalletAddress = req.user.walletAddress;

      console.log(`Fetching access grants for doctorUserId: ${doctorUserId}, doctorWalletAddress: ${doctorWalletAddress}`);
      // 2. Find all access grants for this doctor in the database
      const accessGrants = await prisma.accessGrant.findMany({
        where: {
          userId: doctorUserId,
          // Optional: Add expiry date check here if AccessGrant has expiresAt
          // expiresAt: {
          //   gte: new Date() // Only consider grants that have not expired
          // }
        },
        include: {
          record: { // Include the medical record details
            include: {
              forUser: true // Include the patient's details (grantedById)
            }
          }
        }
      });

      console.log(`Found ${accessGrants.length} access grants in database.`);

      const accessibleRecords = [];

      // 3. Process each grant and verify on-chain
      for (const grant of accessGrants) {
        // Ensure the record and patient details exist (should always with includes)
        if (grant.record && grant.record.forUser) {
          const patientWalletAddress = grant.record.forUser.walletAddress;

          console.log(`Checking blockchain access for record ${grant.record.id} (patient: ${patientWalletAddress}, doctor: ${doctorWalletAddress})...`);
          // 4. Verify access on-chain (patient granted access to this doctor)
          const hasAccessOnChain = await blockchainService.checkAccess(patientWalletAddress, doctorWalletAddress);

          if (hasAccessOnChain) {
            console.log(`Blockchain access confirmed for record ${grant.record.id}. Adding to accessible records.`);
            // 5. If access is confirmed on-chain, add the record to the list
            // Include necessary record info, including fileType and aesKey (raw key)
            accessibleRecords.push({
              id: grant.record.id,
              title: grant.record.title,
              description: grant.record.description,
              ipfsHash: grant.record.ipfsHash,
              createdAt: grant.record.createdAt,
              fileType: grant.record.fileType,
              patient: {
                id: grant.record.forUser.id,
                name: grant.record.forUser.name,
                walletAddress: grant.record.forUser.walletAddress
              },
              grantedAt: grant.grantedAt,
              expiresAt: grant.expiresAt,
              blockchainTxHash: grant.record.blockchainTxHash,
              encryptedAesKey: grant.encryptedAesKey // Map encryptedAesKey to match frontend expectation
            });
          } else {
            console.log(`Blockchain access denied for record ${grant.record.id}. Skipping.`);
              // Optional: Log if a database grant exists but blockchain access is denied
              // You might want to handle this discrepancy, e.g., revoke the database grant.
          }
        }
      }

      console.log(`Returning ${accessibleRecords.length} accessible records.`);
      // 6. Return the filtered list of records
      res.json({
        message: "Accessible medical records retrieved successfully",
        data: {
          records: accessibleRecords
        }
      });

    } catch (err: any) {
      console.error('Error retrieving accessible medical records:', err);
      res.status(500).json({ error: err.message || 'Failed to retrieve accessible medical records' });
    }
  },

  createAccessRequest: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const { patientWalletAddress, reason } = req.body;

      // Find patient by wallet address
      const patient = await prisma.user.findUnique({
        where: { walletAddress: patientWalletAddress }
      });

      if (!patient) {
        res.status(404).json({ error: "Patient not found" });
        return;
      }

      // Get doctor with profile
      const doctor = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          doctorProfile: true
        }
      });

      if (!doctor || !doctor.doctorProfile) {
        res.status(404).json({ error: "Doctor profile not found" });
        return;
      }

      // Create access request
      const accessRequest = await prisma.accessRequest.create({
        data: {
          doctorId: doctor.id,
          patientId: patient.id,
          doctorWalletAddress: doctor.walletAddress,
          reason
        }
      });

      // Create notification for patient
      await prisma.notification.create({
        data: {
          userId: patient.id,
          type: 'ACCESS_REQUEST',
          title: 'New Access Request',
          message: `Dr. ${doctor.name} has requested access to your medical records`,
          data: {
            doctorId: doctor.id,
            doctorName: doctor.name,
            doctorSpecialization: doctor.doctorProfile.specialization,
            reason,
            timestamp: new Date().toISOString()
          }
        }
      });
      await WebhookService.sendWhatsAppNotification({
        to: patient.phoneNumber || "",
        doctor: {
          name: doctor.name,
          specialization: doctor.doctorProfile.specialization,
          registrationNumber: doctor.doctorProfile.licenseNumber,
          hospital: doctor.doctorProfile.hospital || ""
        },
        patientEmail: patient.email
      });

      // Add audit log
      await auditService.createAuditLog(
        doctor.id,
        'ACCESS_REQUEST_CREATED',
        JSON.stringify({
          patientId: patient.id,
          reason
        }),
        req
      );

      res.status(201).json({
        message: "Access request created successfully",
        data: { accessRequest }
      });
    } catch (err: any) {
      console.error('Error creating access request:', err);
      res.status(500).json({ error: err.message });
    }
  },

  getAccessRequests: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const accessRequests = await prisma.accessRequest.findMany({
        where: {
          doctorId: req.user.id
        },
        include: {
          patient: {
            select: {
              name: true,
              walletAddress: true
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

  getDoctorDetails: async (req: Request, res: Response): Promise<void> => {
    try {
      const { walletAddress } = req.params;

      // Find doctor by wallet address with all related data
      const doctor = await prisma.user.findUnique({
        where: { walletAddress },
        include: {
          doctorProfile: true,
          notifications: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 10 // Limit to last 10 notifications
          },
          accessRequestsSent: {
            orderBy: {
              requestedAt: 'desc'
            },
            take: 10 // Limit to last 10 access requests
          }
        }
      });

      if (!doctor) {
        res.status(404).json({ error: "Doctor not found" });
        return;
      }

      if (!doctor.doctorProfile) {
        res.status(404).json({ error: "Doctor profile not found" });
        return;
      }

      // Add audit log for doctor details viewing
      await auditService.createAuditLog(
        doctor.id,
        'DOCTOR_DETAILS_VIEWED',
        'Doctor details retrieved',
        req
      );

      res.json({
        message: "Doctor details retrieved successfully",
        data: {
          user: {
            id: doctor.id,
            name: doctor.name,
            email: doctor.email,
            role: doctor.role,
            walletAddress: doctor.walletAddress,
            phoneNumber: doctor.phoneNumber,
            authSalt: doctor.authSalt,
            encSalt: doctor.encSalt,
            createdAt: doctor.createdAt,
            updatedAt: doctor.updatedAt,
            doctorProfile: doctor.doctorProfile,
            notifications: doctor.notifications,
            accessRequestsSent: doctor.accessRequestsSent
          }
        }
      });
    } catch (err: any) {
      console.error('Error retrieving doctor details:', err);
      res.status(500).json({ error: err.message });
    }
  }
}; 