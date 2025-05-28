import { Request, Response } from "express";
import { generateNonce, authenticate } from "../services/authService";

export const userController = {
  requestNonce: (req: Request, res: Response) => {
    console.log('Request body:', req.body);
    const { address } = req.body;
    if (!address) {
      console.log('No address provided');
      return res.status(400).json({ error: "Address required" });
    }
    console.log('Generating nonce for address:', address);
    const nonce = generateNonce(address);
    console.log('Generated nonce:', nonce);
    const response = { 
      message: "Nonce generated successfully",
      data: { nonce }
    };
    console.log('Sending response:', response);
    res.json(response);
  },

  verifySignature: (req: Request, res: Response) => {
    const { address, signature } = req.body;
    try {
      console.log('Verifying signature for address:', address);
      const { token } = authenticate(address, signature);
      console.log('Token generated:', token);
      res.json({ 
        message: "Signature verified successfully",
        data: { token }
      });
    } catch (err: any) {
      console.error('Signature verification error:', err);
      res.status(400).json({ error: err.message });
    }
  },

  register: async (req: Request, res: Response) => {
    try {
      console.log('Registration request received:', {
        ...req.body,
        signature: req.body.signature ? 'present' : 'missing'
      });

      const { 
        name, 
        age, 
        dateOfBirth, 
        email, 
        phoneNumber, 
        physicalAddress, 
        walletAddress,
        signature 
      } = req.body;

      // Validate required fields
      const requiredFields = {
        name: 'Name',
        age: 'Age',
        dateOfBirth: 'Date of Birth',
        email: 'Email',
        phoneNumber: 'Phone Number',
        physicalAddress: 'Physical Address',
        walletAddress: 'Wallet Address',
        signature: 'Signature'
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([key]) => !req.body[key])
        .map(([_, label]) => label);

      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        return res.status(400).json({ 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        });
      }

      // Log the values of each field
      console.log('Field values:', {
        name: name || 'missing',
        age: age || 'missing',
        dateOfBirth: dateOfBirth || 'missing',
        email: email || 'missing',
        phoneNumber: phoneNumber || 'missing',
        physicalAddress: physicalAddress || 'missing',
        walletAddress: walletAddress || 'missing',
        signature: signature ? 'present' : 'missing'
      });

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      // Validate phone number format (basic validation)
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ error: "Invalid phone number format" });
      }

      // Validate age
      if (age < 0 || age > 150) {
        return res.status(400).json({ error: "Invalid age" });
      }

      // Validate date of birth
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        return res.status(400).json({ error: "Invalid date of birth" });
      }

      // Verify the signature with registration purpose
      try {
        const { token } = authenticate(walletAddress, signature, 'registration');
        
        // If we get here, the signature is valid
        const userData = {
          name,
          age,
          dateOfBirth,
          email,
          phoneNumber,
          physicalAddress,
          walletAddress
        };

        // TODO: Store user data in database
        // For now, just return success
        console.log('Registration successful:', {
          user: userData,
          token
        });

        res.status(201).json({
          message: "User registered successfully",
          data: {
            user: userData,
            token
          }
        });
      } catch (err: any) {
        console.error('Signature verification failed:', err);
        res.status(401).json({ error: "Invalid signature" });
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ error: err.message });
    }
  }
}; 