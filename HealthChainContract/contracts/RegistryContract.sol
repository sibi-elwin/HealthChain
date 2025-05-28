// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AccessControlContract.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract RegistryContract is ReentrancyGuard {
    // Reference to the access control contract
    AccessControlContract public accessControl;

    // Entity information structure
    struct EntityInfo {
        string name;
        string specialization;  // For doctors
        string licenseNumber;   // For doctors
        string organization;    // For labs
        uint256 registrationDate;
        bool isActive;
    }

    // Mappings
    mapping(address => EntityInfo) public entityInfo;
    mapping(address => bool) public isRegistered;
    mapping(address => mapping(address => bool)) public patientDoctorAccess;

    // Events
    event EntityRegistered(address indexed entity, string entityType);
    event EntityUpdated(address indexed entity);
    event EntityDeactivated(address indexed entity);

    constructor(address _accessControl) {
        accessControl = AccessControlContract(_accessControl);
    }

    /**
     * @dev Registers a new entity (doctor, patient, or lab)
     * @param entity Address of the entity to register
     * @param name Name of the entity
     * @param specialization Specialization (for doctors)
     * @param licenseNumber License number (for doctors)
     * @param organization Organization name (for labs)
     */
    function registerEntity(
        address entity,
        string memory name,
        string memory specialization,
        string memory licenseNumber,
        string memory organization
    ) external nonReentrant {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Only admin can register entities"
        );
        require(!isRegistered[entity], "Entity already registered");

        entityInfo[entity] = EntityInfo({
            name: name,
            specialization: specialization,
            licenseNumber: licenseNumber,
            organization: organization,
            registrationDate: block.timestamp,
            isActive: true
        });

        isRegistered[entity] = true;
        emit EntityRegistered(entity, "New Entity");
    }

    /**
     * @dev Updates entity information
     * @param entity Address of the entity to update
     * @param name New name
     * @param specialization New specialization
     * @param licenseNumber New license number
     * @param organization New organization name
     */
    function updateEntity(
        address entity,
        string memory name,
        string memory specialization,
        string memory licenseNumber,
        string memory organization
    ) external nonReentrant {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender) || msg.sender == entity,
            "Only admin or entity can update"
        );
        require(isRegistered[entity], "Entity not registered");

        EntityInfo storage info = entityInfo[entity];
        info.name = name;
        info.specialization = specialization;
        info.licenseNumber = licenseNumber;
        info.organization = organization;

        emit EntityUpdated(entity);
    }

    /**
     * @dev Deactivates an entity
     * @param entity Address of the entity to deactivate
     */
    function deactivateEntity(address entity) external nonReentrant {
        require(
            accessControl.hasRole(accessControl.ADMIN_ROLE(), msg.sender),
            "Only admin can deactivate entities"
        );
        require(isRegistered[entity], "Entity not registered");

        entityInfo[entity].isActive = false;
        emit EntityDeactivated(entity);
    }

    /**
     * @dev Gets entity information
     * @param entity Address of the entity
     * @return Entity information
     */
    function getEntityInfo(address entity) external view returns (EntityInfo memory) {
        require(isRegistered[entity], "Entity not registered");
        return entityInfo[entity];
    }

    /**
     * @dev Checks if an entity is active
     * @param entity Address of the entity
     * @return bool True if the entity is active
     */
    function isEntityActive(address entity) external view returns (bool) {
        return isRegistered[entity] && entityInfo[entity].isActive;
    }
} 