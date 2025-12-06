// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract FndrIdentity {        
    error NotOwner();
    error UserAlreadyRegistered();
    error IdentifierAlreadyUsed();
    error InvalidIdentifier();
    error UserNotVerified();
    error InvalidRole();

    mapping(address => bytes32) public zkPassportIdentifiers;
    mapping(bytes32 => bool) public usedIdentifiers;
    
    enum UserRole { None, Founder, Investor }
    mapping(address => UserRole) public userRoles;
    
    address public owner;
    
    event ZKPassportVerified(address indexed user, bytes32 nullifierHash);
    event UserRoleRegistered(address indexed user, UserRole role);
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }
    
    modifier onlyVerifiedUsers() {
        if (!_isVerifiedUser(msg.sender)) revert UserNotVerified();
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function _isVerifiedUser(address account) internal view returns (bool) {
        return zkPassportIdentifiers[account] != bytes32(0);
    }
    
    function isVerifiedUser(address account) external view returns (bool) {
        return _isVerifiedUser(account);
    }
    
    function registerZKPassportUser(
        bytes32 uniqueIdentifier
    ) external returns (bool) {
        if (uniqueIdentifier == bytes32(0)) revert InvalidIdentifier();
        if (zkPassportIdentifiers[msg.sender] != bytes32(0)) revert UserAlreadyRegistered();
        if (usedIdentifiers[uniqueIdentifier]) revert IdentifierAlreadyUsed();

        zkPassportIdentifiers[msg.sender] = uniqueIdentifier;
        usedIdentifiers[uniqueIdentifier] = true;

        emit ZKPassportVerified(msg.sender, uniqueIdentifier);
        return true;
    }
    
    function isZKPassportVerified(address user) external view returns (bool) {
        if (user == address(0)) revert InvalidIdentifier();
        return zkPassportIdentifiers[user] != bytes32(0);
    }

    function getUniqueIdentifier(address user) external view returns (bytes32) {
        if (user == address(0)) revert InvalidIdentifier();
        return zkPassportIdentifiers[user];
    }
    
    function registerUserRole(UserRole role) external onlyVerifiedUsers{
        if (role == UserRole.None) revert InvalidRole();
        if (userRoles[msg.sender] != UserRole.None) revert UserAlreadyRegistered();
        
        userRoles[msg.sender] = role;
        
        emit UserRoleRegistered(msg.sender, role);
    }
    
    function getUserRole(address user) external view returns (UserRole) {
        return userRoles[user];
    }
    
    function isFounder(address user) external view returns (bool) {
        return userRoles[user] == UserRole.Founder;
    }

    function isInvestor(address user) external view returns (bool) {
        return userRoles[user] == UserRole.Investor;
    }
    
    function isUserRegistered(address user) external view returns (bool) {
        return userRoles[user] != UserRole.None;
    }
}