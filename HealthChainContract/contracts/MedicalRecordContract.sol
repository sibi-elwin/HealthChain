// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AccessControlContract.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MedicalRecordContract is ReentrancyGuard {
    // Reference to the access control contract
    AccessControlContract public accessControlContract;

    // Record structure
    struct Record {
        uint256 id;
        string cid;           // IPFS hash
        address uploader;     // Address of the uploader (doctor/lab)
        address patient;      // Address of the patient
        uint256 timestamp;    // Upload timestamp
        string fileType;      // Type of record (e.g., "XRay", "Prescription")
        string description;   // Brief description of the record
    }

    // Mappings
    mapping(uint256 => Record) public records;
    mapping(address => uint256[]) private patientRecordIds;
    mapping(address => mapping(address => bool)) public patientDoctorAccess; // patient => doctor => hasAccess

    // Counter for record IDs
    uint256 private _recordIds;

    // Events
    event RecordAdded(uint256 indexed recordId, address indexed patient, address indexed uploader, string cid);
    event AccessGranted(address indexed patient, address indexed doctor);
    event AccessRevoked(address indexed patient, address indexed doctor);

    constructor(address _accessControl) {
        accessControlContract = AccessControlContract(_accessControl);
    }

    /**
     * @dev Adds a new medical record. Only callable by doctors or labs.
     * @param patient Address of the patient
     * @param cid IPFS hash of the record
     * @param fileType Type of the medical record
     * @param description Brief description of the record
     */
    function addRecord(
        address patient,
        string memory cid,
        string memory fileType,
        string memory description
    ) external nonReentrant {
        require(
            accessControlContract.hasRole(accessControlContract.PATIENT_ROLE(), msg.sender),
            "Only patients can add records"
        );
        require(
            accessControlContract.hasRole(accessControlContract.PATIENT_ROLE(), patient),
            "Patient must be registered"
        );

        _recordIds++;
        uint256 recordId = _recordIds;

        records[recordId] = Record({
            id: recordId,
            cid: cid,
            uploader: msg.sender,
            patient: patient,
            timestamp: block.timestamp,
            fileType: fileType,
            description: description
        });

        patientRecordIds[patient].push(recordId);
        emit RecordAdded(recordId, patient, msg.sender, cid);
    }

    /**
     * @dev Grants access to a doctor for a patient's records
     * @param doctor Address of the doctor to grant access to
     */
    function grantAccess(address doctor) external {
        require(
            accessControlContract.hasRole(accessControlContract.PATIENT_ROLE(), msg.sender),
            "Only patients can grant access"
        );
        require(
            accessControlContract.hasRole(accessControlContract.DOCTOR_ROLE(), doctor),
            "Doctor must be registered"
        );

        patientDoctorAccess[msg.sender][doctor] = true;
        emit AccessGranted(msg.sender, doctor);
    }

    /**
     * @dev Revokes access from a doctor for a patient's records
     * @param doctor Address of the doctor to revoke access from
     */
    function revokeAccess(address doctor) external {
        require(
            accessControlContract.hasRole(accessControlContract.PATIENT_ROLE(), msg.sender),
            "Only patients can revoke access"
        );

        patientDoctorAccess[msg.sender][doctor] = false;
        emit AccessRevoked(msg.sender, doctor);
    }

    /**
     * @dev Gets all record IDs for a patient
     * @param patient Address of the patient
     * @return Array of record IDs
     */
    function getPatientRecordIds(address patient) external view returns (uint256[] memory) {
        require(
            msg.sender == patient || patientDoctorAccess[patient][msg.sender],
            "No access to patient records"
        );
        return patientRecordIds[patient];
    }

    /**
     * @dev Gets a specific record by ID
     * @param recordId ID of the record to retrieve
     * @return Record details
     */
    function getRecord(uint256 recordId) external view returns (Record memory) {
        Record memory record = records[recordId];
        require(
            msg.sender == record.patient || patientDoctorAccess[record.patient][msg.sender],
            "No access to this record"
        );
        return record;
    }
} 