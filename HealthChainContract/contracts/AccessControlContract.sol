// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AccessControlContract is AccessControl, Pausable, ReentrancyGuard {
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DOCTOR_ROLE = keccak256("DOCTOR_ROLE");
    bytes32 public constant PATIENT_ROLE = keccak256("PATIENT_ROLE");
    bytes32 public constant LAB_ROLE = keccak256("LAB_ROLE");

    // Events
   
    event ContractPaused(address indexed account);
    event ContractUnpaused(address indexed account);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Grants a role to an account. Only callable by admin.
     * @param role The role to grant
     * @param account The account to grant the role to
     */
    function grantRole(bytes32 role, address account) 
        public 
        override 
        onlyRole(ADMIN_ROLE) 
        whenNotPaused 
        nonReentrant 
    {
        require(role != DEFAULT_ADMIN_ROLE, "Cannot modify DEFAULT_ADMIN_ROLE");
        _grantRole(role, account);
        emit RoleGranted(role, account, msg.sender);
    }

    /**
     * @dev Revokes a role from an account. Only callable by admin.
     * @param role The role to revoke
     * @param account The account to revoke the role from
     */
    function revokeRole(bytes32 role, address account) 
        public 
        override 
        onlyRole(ADMIN_ROLE) 
        whenNotPaused 
        nonReentrant 
    {
        require(role != DEFAULT_ADMIN_ROLE, "Cannot modify DEFAULT_ADMIN_ROLE");
        _revokeRole(role, account);
        emit RoleRevoked(role, account, msg.sender);
    }

    /**
     * @dev Pauses the contract. Only callable by admin.
     */
    function pause() public onlyRole(ADMIN_ROLE) {
        _pause();
        emit ContractPaused(msg.sender);
    }

    /**
     * @dev Unpauses the contract. Only callable by admin.
     */
    function unpause() public onlyRole(ADMIN_ROLE) {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }

    /**
     * @dev Checks if an account has a specific role
     * @param role The role to check
     * @param account The account to check
     * @return bool True if the account has the role, false otherwise
     */
    function hasRole(bytes32 role, address account) 
        public 
        view 
        override 
        returns (bool) 
    {
        return super.hasRole(role, account);
    }
} 