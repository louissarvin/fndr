// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CampaignManager.sol";
import "./MockVault.sol";
import "forge-std/interfaces/IERC20.sol";
import "./FndrIdentity.sol";

contract CampaignFactory {
    error NotVerifiedFounder();
    error CampaignAlreadyExists();
    error CompanyNameAlreadyTaken();
    error InvalidCompanyName();
    error InvalidTargetRaise();
    error InvalidEquityPercentage();
    error InvalidSharePrice();
    error InvalidDeadline();
    error InvalidUSDCAddress();
    error InvalidVaultAddress();
    error InvalidIdentityAddress();
    error InvalidPlatformWallet();
    error InsufficientCreationFee();
    error CreationFeeTransferFailed();

    IERC20 public immutable usdc;
    MockVault public immutable sharedYieldVault;
    FndrIdentity public immutable identity;
    
    uint256 public constant CAMPAIGN_CREATION_FEE = 10 * 1e6;
    address public immutable platformWallet = 0x564323aE0D8473103F3763814c5121Ca9e48004B;
    
    address[] public campaigns;
    mapping(address => bool) public isActiveCampaign;
    mapping(address => address) public founderToCampaign;
    mapping(string => address) public ipfsHashToCampaign;
    
    struct CampaignCore {
        address campaignAddress;
        address founder;
        address equityToken;
        uint256 targetRaise;
        uint256 equityPercentage;
        uint256 sharePrice;
        uint256 founderYieldShare;
        uint256 deadline;
        string ipfsMetadata;  
        uint256 createdAt;
        CampaignManager.CampaignState state;
    }
    
    struct CampaignConfig {
        uint256 targetRaise;
        uint256 equityPercentage;
        uint256 sharePrice;
        uint256 deadline;
        string ipfsMetadata; 
    }
    
    mapping(address => CampaignCore) public campaignCores;
    
    event CampaignDeployed(
        address indexed campaignAddress,
        address indexed founder,
        string indexed ipfsMetadata,
        uint256 targetRaise,
        uint256 equityPercentage
    );
    
    event CampaignStateChanged(
        address indexed campaignAddress,
        CampaignManager.CampaignState newState
    );
    
    constructor(address _usdc, address _sharedYieldVault, address _fndrIdentity) {
        if (_usdc == address(0)) revert InvalidUSDCAddress();
        if (_sharedYieldVault == address(0)) revert InvalidVaultAddress();
        if (_fndrIdentity == address(0)) revert InvalidIdentityAddress();
        
        usdc = IERC20(_usdc);
        sharedYieldVault = MockVault(_sharedYieldVault);
        identity = FndrIdentity(_fndrIdentity);
    }

    modifier onlyVerifiedFounder() {
        if (!identity.isFounder(msg.sender)) {
            revert NotVerifiedFounder();
        }
        _;
    }
    
    function createCampaign(
        CampaignConfig memory config,
        string memory companySymbol
    ) external onlyVerifiedFounder returns (address campaignAddress) {
        if (founderToCampaign[msg.sender] != address(0)) revert CampaignAlreadyExists();
        if (config.targetRaise == 0) revert InvalidTargetRaise();
        if (config.equityPercentage == 0 || config.equityPercentage > 10000) revert InvalidEquityPercentage();
        if (config.sharePrice == 0) revert InvalidSharePrice();
        if (config.deadline <= block.timestamp) revert InvalidDeadline();
        if (bytes(config.ipfsMetadata).length == 0) revert InvalidCompanyName();
        
        if (usdc.balanceOf(msg.sender) < CAMPAIGN_CREATION_FEE) revert InsufficientCreationFee();
        if (!usdc.transferFrom(msg.sender, platformWallet, CAMPAIGN_CREATION_FEE)) revert CreationFeeTransferFailed();
        
        CampaignManager.CampaignConfig memory managerConfig = CampaignManager.CampaignConfig({
            targetRaise: config.targetRaise,
            equityPercentage: config.equityPercentage,
            sharePrice: config.sharePrice,
            deadline: config.deadline
        });
        
        CampaignManager newCampaign = new CampaignManager(
            address(usdc),
            address(sharedYieldVault),
            managerConfig,
            companySymbol,
            msg.sender,
            address(identity)
        );
        
        campaignAddress = address(newCampaign);
        
        campaignCores[campaignAddress] = CampaignCore({
            campaignAddress: campaignAddress,
            founder: msg.sender,
            equityToken: newCampaign.getEquityToken(),
            targetRaise: config.targetRaise,
            equityPercentage: config.equityPercentage,
            sharePrice: config.sharePrice,
            founderYieldShare: 5000, 
            deadline: config.deadline,
            ipfsMetadata: config.ipfsMetadata,
            createdAt: block.timestamp,
            state: CampaignManager.CampaignState.FUNDRAISING
        });
        
        campaigns.push(campaignAddress);
        isActiveCampaign[campaignAddress] = true;
        founderToCampaign[msg.sender] = campaignAddress;
        ipfsHashToCampaign[config.ipfsMetadata] = campaignAddress;
        
        emit CampaignDeployed(
            campaignAddress,
            msg.sender,
            config.ipfsMetadata,
            config.targetRaise,
            config.equityPercentage
        );
        
        return campaignAddress;
    }

    function getActiveCampaigns() external view returns (address[] memory) {
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < campaigns.length; i++) {
            if (isActiveCampaign[campaigns[i]]) {
                activeCount++;
            }
        }
        
        address[] memory activeCampaigns = new address[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < campaigns.length; i++) {
            if (isActiveCampaign[campaigns[i]]) {
                activeCampaigns[currentIndex] = campaigns[i];
                currentIndex++;
            }
        }
        
        return activeCampaigns;
    }

    function getCampaignCore(address campaignAddress) external view returns (CampaignCore memory) {
        return campaignCores[campaignAddress];
    }

    function getCampaignCores(address[] calldata campaignAddresses) 
        external view returns (CampaignCore[] memory) {
        CampaignCore[] memory cores = new CampaignCore[](campaignAddresses.length);
        
        for (uint256 i = 0; i < campaignAddresses.length; i++) {
            cores[i] = campaignCores[campaignAddresses[i]];
            
            CampaignManager campaign = CampaignManager(campaignAddresses[i]);
            (CampaignManager.CampaignState state,,,,,) = campaign.getCampaignInfoView();
            cores[i].state = state;
        }
        
        return cores;
    }

    function getCampaignByFounder(address founder) external view returns (address) {
        return founderToCampaign[founder];
    }

    function getCampaignByIpfsHash(string calldata ipfsHash) external view returns (address) {
        return ipfsHashToCampaign[ipfsHash];
    }

    function getTotalCampaignsCount() external view returns (uint256) {
        return campaigns.length;
    }

    function getCampaignsPaginated(uint256 offset, uint256 limit) 
        external view returns (address[] memory) {
        require(offset < campaigns.length, "Offset exceeds campaign count");
        
        uint256 end = offset + limit;
        if (end > campaigns.length) {
            end = campaigns.length;
        }
        
        address[] memory paginatedCampaigns = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            paginatedCampaigns[i - offset] = campaigns[i];
        }
        
        return paginatedCampaigns;
    }

    function markCampaignInactive(address campaignAddress) external {
        require(msg.sender == campaignAddress, "Only campaign can mark itself inactive");
        require(isActiveCampaign[campaignAddress], "Campaign is not active");
        
        isActiveCampaign[campaignAddress] = false;
        
        CampaignManager campaign = CampaignManager(campaignAddress);
        (CampaignManager.CampaignState state,,,,,) = campaign.getCampaignInfo();
        
        emit CampaignStateChanged(campaignAddress, state);
    }

    function getCampaignsByState(CampaignManager.CampaignState targetState) 
        external view returns (address[] memory) {
        uint256 matchingCount = 0;
        
        for (uint256 i = 0; i < campaigns.length; i++) {
            CampaignManager campaign = CampaignManager(campaigns[i]);
            (CampaignManager.CampaignState state,,,,,) = campaign.getCampaignInfoView();
            if (state == targetState) {
                matchingCount++;
            }
        }
        
        address[] memory matchingCampaigns = new address[](matchingCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < campaigns.length; i++) {
            CampaignManager campaign = CampaignManager(campaigns[i]);
            (CampaignManager.CampaignState state,,,,,) = campaign.getCampaignInfoView();
            if (state == targetState) {
                matchingCampaigns[currentIndex] = campaigns[i];
                currentIndex++;
            }
        }
        
        return matchingCampaigns;
    }
}