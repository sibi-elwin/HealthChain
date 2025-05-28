# HealthChain - Decentralized Medical Records System

HealthChain is a decentralized medical records system built on the Ethereum blockchain (Polygon network) that enables secure, private, and efficient management of medical records.

## Features

- Role-based access control (Admin, Doctor, Patient, Lab)
- Secure storage of medical records using IPFS
- Granular access control for patient records
- Entity registration and verification
- Event logging for audit trails
- Upgradeable contract architecture

## Smart Contracts

1. **AccessControlContract.sol**
   - Manages roles and permissions
   - Implements OpenZeppelin's AccessControl
   - Includes emergency pause functionality

2. **MedicalRecordContract.sol**
   - Handles medical record storage and access
   - Manages patient-doctor data sharing
   - Implements IPFS integration for file storage

3. **RegistryContract.sol**
   - Tracks registered entities
   - Stores entity information
   - Manages entity status

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MetaMask or similar Web3 wallet
- Access to Polygon Mumbai testnet or Polygon mainnet

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/healthchain.git
cd healthchain
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PRIVATE_KEY=your_wallet_private_key
MUMBAI_RPC_URL=your_mumbai_rpc_url
POLYGON_RPC_URL=your_polygon_rpc_url
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

## Usage

### Compile Contracts
```bash
npm run compile
```

### Deploy to Local Network
```bash
npm run deploy
```

### Deploy to Mumbai Testnet
```bash
npm run deploy:testnet
```

### Deploy to Polygon Mainnet
```bash
npm run deploy:mainnet
```

## Contract Architecture

### Access Control
- ADMIN_ROLE: System administrators
- DOCTOR_ROLE: Medical practitioners
- PATIENT_ROLE: Patients
- LAB_ROLE: Medical laboratories

### Medical Records
- Records are stored as IPFS hashes
- Each record includes metadata (timestamp, uploader, type)
- Access control is managed at the patient level

### Entity Registry
- Stores entity information
- Manages entity status
- Links on-chain addresses to real-world identities

## Security Features

- Role-based access control
- Reentrancy protection
- Emergency pause functionality
- Secure IPFS integration
- Access control at record level

## Testing

Run the test suite:
```bash
npm test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
