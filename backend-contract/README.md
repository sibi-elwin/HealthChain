# Medical Records Contract Backend

This service provides a REST API for interacting with the deployed medical records smart contracts. It handles medical record management, access control operations, and role management.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration:
- Add your Infura API key
- Add the deployed contract addresses
- Add your admin wallet private key

## Development

Run the development server:
```bash
npm run dev
```

## Production

Build the TypeScript code:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## API Endpoints

### Role Management

- `POST /roles/add`
  - Add a role to a user
  - Body: `{ userAddress, role, metadata? }`
  - Roles: `patient`, `doctor`, `admin`

- `POST /roles/remove`
  - Remove a role from a user
  - Body: `{ userAddress, role }`

- `GET /roles/:userAddress`
  - Get all roles for a user
  - Params: `userAddress`

- `GET /roles/check`
  - Check if a user has a specific role
  - Query: `userAddress`, `role`

### Medical Records

- `POST /records`
  - Add a new medical record
  - Body: `{ patientAddress, recordHash, metadata }`

- `GET /records/:patientAddress/:recordIndex`
  - Get a specific medical record
  - Params: `patientAddress`, `recordIndex`

- `GET /records/count/:patientAddress`
  - Get the number of records for a patient
  - Params: `patientAddress`

### Access Control

- `POST /access/grant`
  - Grant access to a doctor
  - Body: `{ patientAddress, doctorAddress, recordIndex }`

- `POST /access/revoke`
  - Revoke access from a doctor
  - Body: `{ patientAddress, doctorAddress, recordIndex }`

- `GET /access/check`
  - Check if a doctor has access
  - Query: `patientAddress`, `doctorAddress`, `recordIndex`

- `GET /access/doctor/:doctorAddress`
  - Get all records a doctor has access to
  - Params: `doctorAddress`

## Security Notes

- The admin private key should be kept secure and never committed to version control
- All sensitive operations require proper authentication and authorization
- The service should be run behind a reverse proxy with HTTPS in production
- Role management operations should be restricted to admin users only 