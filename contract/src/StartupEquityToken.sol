// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/interfaces/IERC20.sol";
import "./FndrIdentity.sol";

interface ISecondaryMarket {
    function initializeHoldingPeriod(address investor, address tokenContract) external;
}

contract StartupEquityToken {
    error TransferNotAllowed();
    error IssuanceDisabled();
    error InsufficientBalance();
    error InsufficientAllowance();
    error CannotUseZeroAddress();
    error OnlyFounderCanCall();
    error OnlyCampaignCanCall();
    error OnlyFounderOrCampaignCanCall();
    error InsufficientPartitionBalance();
    error RecipientNotVerified(address recipient);
    error SenderNotVerified(address sender);
    error SenderBlacklisted(address sender);
    error RecipientBlacklisted(address recipient);

    string public name;
    string public symbol;
    uint8 public decimals = 6;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    bytes32[] public partitions;
    mapping(bytes32 => mapping(address => uint256)) public partitionBalances;
    mapping(address => bytes32[]) public partitionsOf;
    
    mapping(address => bool) public isWhitelisted;
    mapping(address => bool) public isBlacklisted;
    bool public transfersEnabled = true;
    bool public issuanceEnabled = true;
    
    address public campaign;
    address public founder;
    uint256 public equityPercentage; 
    string public companyName;
    FndrIdentity public immutable fndrIdentity;
    address public secondaryMarket;
    
    bytes32 public constant DEFAULT_PARTITION = 0x0000000000000000000000000000000000000000000000000000000000000000;
    
    event TransferByPartition(
        bytes32 indexed fromPartition,
        address operator,
        address indexed from,
        address indexed to,
        uint256 value,
        bytes data,
        bytes operatorData
    );
    
    event IssuedByPartition(
        bytes32 indexed partition,
        address indexed to,
        uint256 value,
        bytes data
    );
    
    event RedeemedByPartition(
        bytes32 indexed partition,
        address indexed operator,
        address indexed from,
        uint256 value,
        bytes data,
        bytes operatorData
    );
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    event WhitelistAdded(address indexed account);
    event WhitelistRemoved(address indexed account);
    event TransfersDisabled();
    event TransfersEnabled();
    
    modifier onlyFounder() {
        if (msg.sender != founder) {
            revert OnlyFounderCanCall();
        }
        _;
    }
    
    modifier onlyCampaign() {
        if (msg.sender != campaign) {
            revert OnlyCampaignCanCall();
        }
        _;
    }
    
    modifier onlyFounderOrCampaign() {
        if (msg.sender != founder && msg.sender != campaign) {
            revert OnlyFounderOrCampaignCanCall();
        }
        _;
    }
    
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _companyName,
        uint256 _equityPercentage,
        address _founder,
        address _campaign,
        address _fndrIdentity
    ) {
        require(_fndrIdentity != address(0), "FndrIdentity address cannot be zero");
        
        name = _name;
        symbol = _symbol;
        companyName = _companyName;
        equityPercentage = _equityPercentage;
        founder = _founder;
        campaign = _campaign;
        fndrIdentity = FndrIdentity(_fndrIdentity);
        
        partitions.push(DEFAULT_PARTITION);
        
        isWhitelisted[_founder] = true;
        isWhitelisted[_campaign] = true;
        
        emit WhitelistAdded(_founder);
        emit WhitelistAdded(_campaign);
    }
    
    
    function transfer(address to, uint256 amount) external returns (bool) {
        return _transferWithRestrictions(msg.sender, to, amount, "");
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        require(currentAllowance >= amount, "Insufficient allowance");
        
        allowance[from][msg.sender] = currentAllowance - amount;
        return _transferWithRestrictions(from, to, amount, "");
    }

    function transferByPartition(
        bytes32 partition,
        address to,
        uint256 value,
        bytes calldata data
    ) external returns (bytes32) {
        if (!_validateTransfer(msg.sender, to, value)) {
            revert TransferNotAllowed();
        }
        
        _transferByPartition(partition, msg.sender, msg.sender, to, value, data, "");
        return partition;
    }
    
    function canTransfer(address to, uint256 value, bytes calldata data) 
        external view returns (bytes1, bytes32) {
        if (!_validateTransfer(msg.sender, to, value)) {
            return (0x50, "Transfer not allowed");
        }

        return (0x51, "Transfer valid"); 
    }

    function issueByPartition(
        bytes32 partition,
        address to,
        uint256 value,
        bytes calldata data
    ) external onlyCampaign {
        if (!issuanceEnabled) {
            revert IssuanceDisabled();
        }
        if(to == address(0)) {
            revert CannotUseZeroAddress();
        }
        
        if (!isWhitelisted[to]) {
            isWhitelisted[to] = true;
            emit WhitelistAdded(to);
        }
        
        _issueByPartition(partition, to, value, data);
    }

    function redeemByPartition(
        bytes32 partition,
        uint256 value,
        bytes calldata data
    ) external {
        _redeemByPartition(partition, msg.sender, msg.sender, value, data, "");
    }

    function balanceOfByPartition(bytes32 partition, address account) 
        external view returns (uint256) {
        return partitionBalances[partition][account];
    }

    function getPartitionsOf(address account) external view returns (bytes32[] memory) {
        return partitionsOf[account];
    }

    function totalPartitions() external view returns (bytes32[] memory) {
        return partitions;
    }

    function canReceive(address to, uint256 value) external view returns (bool) {
        return _validateTransfer(address(0), to, value);
    }
    
    function checkTransferEligibility(address from, address to) external view returns (
        bool canTransferTokens,
        string memory reason
    ) {
        if (!transfersEnabled) {
            return (false, "Transfers are disabled");
        }
        if (isBlacklisted[from]) {
            return (false, "Sender is blacklisted");
        }
        if (isBlacklisted[to]) {
            return (false, "Recipient is blacklisted");
        }
        
        if (!_isValidSender(from)) {
            return (false, "Sender not verified in FndrIdentity");
        }
        if (!_isValidRecipient(to)) {
            return (false, "Recipient not verified in FndrIdentity");
        }
        
        return (true, "Transfer allowed");
    }

    function addToWhitelist(address account) external onlyFounderOrCampaign {
        if(account == address(0)) {
            revert CannotUseZeroAddress();
        }
        isWhitelisted[account] = true;
        emit WhitelistAdded(account);
    }

    function removeFromWhitelist(address account) external onlyFounder {
        isWhitelisted[account] = false;
        emit WhitelistRemoved(account);
    }
    
    function addToBlacklist(address account) external onlyFounder {
        if(account == address(0)) {
            revert CannotUseZeroAddress();
        }
        isBlacklisted[account] = true;
    }
    
    function removeFromBlacklist(address account) external onlyFounder {
        isBlacklisted[account] = false;
    }
    
    function disableTransfers() external onlyFounder {
        transfersEnabled = false;
        emit TransfersDisabled();
    }

    function enableTransfers() external onlyFounder {
        transfersEnabled = true;
        emit TransfersEnabled();
    }
    
    function disableIssuance() external onlyFounder {
        issuanceEnabled = false;
    }
    
    function setSecondaryMarket(address _secondaryMarket) external onlyFounderOrCampaign {
        require(_secondaryMarket != address(0), "Invalid secondary market address");
        secondaryMarket = _secondaryMarket;
        
        // Automatically whitelist the secondary market for token transfers (needed for escrow)
        isWhitelisted[_secondaryMarket] = true;
        emit WhitelistAdded(_secondaryMarket);
    }
    
    function initializeInvestorHoldingPeriod(address investor) external {
        require(msg.sender == campaign, "Only campaign manager can initialize");
        if (secondaryMarket != address(0)) {
            try ISecondaryMarket(secondaryMarket).initializeHoldingPeriod(investor, address(this)) {} catch {}
        }
    }
    
    function _transferWithRestrictions(
        address from,
        address to,
        uint256 amount,
        bytes memory data
    ) internal returns (bool) {
        _validateTransferWithErrors(from, to, amount);

        _transferByPartition(DEFAULT_PARTITION, msg.sender, from, to, amount, data, "");
        return true;
    }
    
    function _validateTransferWithErrors(address from, address to, uint256 amount) internal view {
        if(!transfersEnabled) {
            revert TransferNotAllowed();
        }
        if(isBlacklisted[from]) {
            revert SenderBlacklisted(from);
        }
        if(isBlacklisted[to]) {
            revert RecipientBlacklisted(to);
        }
        
        if (from == address(0)) {
            if (!_isValidRecipient(to)) {
                revert RecipientNotVerified(to);
            }
            return;
        }
        
        if (!_isValidSender(from)) {
            revert SenderNotVerified(from);
        }
        if (!_isValidRecipient(to)) {
            revert RecipientNotVerified(to);
        }
    }
    
    function _validateTransfer(address from, address to, uint256 amount) internal view returns (bool) {
        if (!transfersEnabled) return false;
        if (isBlacklisted[from] || isBlacklisted[to]) return false;
        
        if (from == address(0)) {
            return _isValidRecipient(to);
        }
        
        return _isValidSender(from) && _isValidRecipient(to);
    }
    
    function _isValidRecipient(address to) internal view returns (bool) {
        if (isWhitelisted[to]) return true;
        
        return fndrIdentity.isFounder(to) || fndrIdentity.isInvestor(to);
    }
    
    function _isValidSender(address from) internal view returns (bool) {
        if (isWhitelisted[from]) return true;
        
        return fndrIdentity.isFounder(from) || fndrIdentity.isInvestor(from);
    }
    
    function _transferByPartition(
        bytes32 partition,
        address operator,
        address from,
        address to,
        uint256 value,
        bytes memory data,
        bytes memory operatorData
    ) internal {
        if(from == address(0)) {
            revert CannotUseZeroAddress();
        }
        if(to == address(0)) {
            revert CannotUseZeroAddress();
        }
        if(partitionBalances[partition][from] < value) {
            revert InsufficientPartitionBalance();
        }
        
        partitionBalances[partition][from] -= value;
        partitionBalances[partition][to] += value;
        
        if (partitionBalances[partition][to] == value) {
            partitionsOf[to].push(partition);
        }
        
        balanceOf[from] -= value;
        balanceOf[to] += value;
        
        if (secondaryMarket != address(0) && from != address(0) && balanceOf[to] == value) {
            try ISecondaryMarket(secondaryMarket).initializeHoldingPeriod(to, address(this)) {} catch {}
        }
        
        emit TransferByPartition(partition, operator, from, to, value, data, operatorData);
        emit Transfer(from, to, value);
    }

    function _redeemByPartition(
        bytes32 partition,
        address operator,
        address from,
        uint256 value,
        bytes memory data,
        bytes memory operatorData
    ) internal {
        if(partitionBalances[partition][from] < value) {
            revert InsufficientPartitionBalance();
        }
        if(from == address(0)) {
            revert CannotUseZeroAddress();
        }
        
        partitionBalances[partition][from] -= value;
        balanceOf[from] -= value;
        totalSupply -= value;
        
        emit RedeemedByPartition(partition, operator, from, value, data, operatorData);
        emit Transfer(from, address(0), value);
    }
    
    function mintToInvestor(address investor, uint256 amount) external onlyCampaign {
        require(investor != address(0), "Cannot mint to zero address");
        require(issuanceEnabled, "Issuance disabled");
        
        if (!isWhitelisted[investor]) {
            isWhitelisted[investor] = true;
            emit WhitelistAdded(investor);
        }
        
        _issueByPartition(DEFAULT_PARTITION, investor, amount, "");
    }
    
    function _issueByPartition(
        bytes32 partition,
        address to,
        uint256 value,
        bytes memory data
    ) internal {
        require(to != address(0), "Cannot issue to zero address");
        
        if (partitionBalances[partition][to] == 0 && value > 0) {
            partitionsOf[to].push(partition);
        }
        
        partitionBalances[partition][to] += value;
        balanceOf[to] += value;
        totalSupply += value;
        
        emit IssuedByPartition(partition, to, value, data);
        emit Transfer(address(0), to, value);
    }

    function getTokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        string memory company,
        uint256 equity,
        uint256 supply,
        address tokenFounder
    ) {
        return (name, symbol, companyName, equityPercentage, totalSupply, founder);
    }
}