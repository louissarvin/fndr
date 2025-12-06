// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./FndrIdentity.sol";
import "./StartupEquityToken.sol";
import "forge-std/interfaces/IERC20.sol";

contract StartupSecondaryMarket {
    error OrderNotFound();
    error OrderExpired();
    error OrderInactive();
    error InsufficientAmount();
    error InsufficientPayment();
    error UnauthorizedSeller();
    error UnauthorizedBuyer();
    error CannotTradeOwnOrder();
    error HoldingPeriodNotMet();
    error InvalidToken();
    error InvalidPrice();
    error InvalidDuration();
    error TransferFailed();

    struct SellOrder {
        uint256 orderId;
        address seller;
        address tokenContract;
        uint256 amount;
        uint256 originalAmount;     
        uint256 pricePerToken;      
        uint256 createdAt;
        uint256 expiryTime;
        bool active;
        bytes32 partition;          
    }

    struct OrderSummary {
        uint256 totalOrders;
        uint256 totalVolume;
        uint256 averagePrice;
        uint256 lastTradePrice;
    }

    FndrIdentity public immutable fndrIdentity;
    IERC20 public immutable usdc;
    address public immutable platformWallet;
    
    mapping(uint256 => SellOrder) public orders;
    mapping(address => uint256[]) public sellerOrders;
    mapping(address => uint256[]) public tokenOrders;
    uint256 public nextOrderId = 1;
    
    mapping(address => mapping(address => uint256)) public firstPurchaseTime;
    uint256 public constant MIN_HOLDING_PERIOD = 180 days; // 6 months
    uint256 public constant MAX_ORDER_DURATION = 30 days;
    uint256 public constant MARKET_FEE_BPS = 25; // 0.25%
    
    mapping(address => OrderSummary) public tokenMarketSummary;
    mapping(address => uint256) public lastTradePrice;

    event OrderCreated(
        uint256 indexed orderId,
        address indexed seller,
        address indexed tokenContract,
        uint256 amount,
        uint256 pricePerToken,
        uint256 expiryTime
    );

    event OrderExecuted(
        uint256 indexed orderId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        uint256 pricePerToken,
        uint256 totalPrice,
        uint256 platformFee
    );

    event OrderCancelled(
        uint256 indexed orderId,
        address indexed seller,
        uint256 amountReturned
    );

    event OrderPartiallyFilled(
        uint256 indexed orderId,
        address indexed buyer,
        uint256 amountFilled,
        uint256 amountRemaining
    );

    event HoldingPeriodUpdated(
        address indexed user,
        address indexed token,
        uint256 timestamp
    );

    modifier onlyVerifiedUser() {
            require(
                fndrIdentity.isFounder(msg.sender) || fndrIdentity.isInvestor(msg.sender),
                "User not verified"
            );
        _;
    }

    modifier validOrder(uint256 orderId) {
        require(orderId < nextOrderId && orderId > 0, "Invalid order ID");
        require(orders[orderId].active, "Order not active");
        require(block.timestamp <= orders[orderId].expiryTime, "Order expired");
        _;
    }

    constructor(
        address _fndrIdentity,
        address _usdc,
        address _platformWallet
    ) {
        require(_fndrIdentity != address(0), "Invalid FndrIdentity address");
        require(_usdc != address(0), "Invalid USDC address");
        require(_platformWallet != address(0), "Invalid platform wallet");

        fndrIdentity = FndrIdentity(_fndrIdentity);
        usdc = IERC20(_usdc);
        platformWallet = _platformWallet;
    }

    function createSellOrder(
        address tokenContract,
        uint256 amount,
        uint256 pricePerToken,
        uint256 durationHours
    ) external onlyVerifiedUser returns (uint256 orderId) {
        require(amount > 0, "Amount must be greater than zero");
        require(pricePerToken > 0, "Price must be greater than zero");
        require(durationHours > 0 && durationHours <= 24 * 30, "Invalid duration"); // Max 30 days
        
        require(_isValidTokenContract(tokenContract), "Invalid token contract");
        
        require(_canSellTokens(msg.sender, tokenContract, amount), "Holding period not met");
        
        StartupEquityToken token = StartupEquityToken(tokenContract);
        require(token.balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Token transfer failed"
        );
        
        uint256 expiryTime = block.timestamp + (durationHours * 1 hours);
        orderId = nextOrderId++;
        
        orders[orderId] = SellOrder({
            orderId: orderId,
            seller: msg.sender,
            tokenContract: tokenContract,
            amount: amount,
            originalAmount: amount,
            pricePerToken: pricePerToken,
            createdAt: block.timestamp,
            expiryTime: expiryTime,
            active: true,
            partition: bytes32(0)
        });
        
        sellerOrders[msg.sender].push(orderId);
        tokenOrders[tokenContract].push(orderId);
        _updateMarketSummary(tokenContract);
        
        emit OrderCreated(orderId, msg.sender, tokenContract, amount, pricePerToken, expiryTime);
        
        return orderId;
    }

    function buyTokens(
        uint256 orderId, 
        uint256 amount
    ) external onlyVerifiedUser validOrder(orderId) {
        SellOrder storage order = orders[orderId];
        
        require(msg.sender != order.seller, "Cannot buy own order");
        require(amount > 0 && amount <= order.amount, "Invalid amount");
        
        uint256 totalPrice = amount * order.pricePerToken;
        uint256 platformFee = (totalPrice * MARKET_FEE_BPS) / 10000;
        uint256 sellerReceives = totalPrice - platformFee;
        
        require(
            usdc.transferFrom(msg.sender, order.seller, sellerReceives),
            "USDC transfer to seller failed"
        );
        
        require(
            usdc.transferFrom(msg.sender, platformWallet, platformFee),
            "Platform fee transfer failed"
        );
        
        StartupEquityToken token = StartupEquityToken(order.tokenContract);
        require(
            token.transfer(msg.sender, amount),
            "Token transfer to buyer failed"
        );
        
        if (firstPurchaseTime[msg.sender][order.tokenContract] == 0) {
            firstPurchaseTime[msg.sender][order.tokenContract] = block.timestamp;
            emit HoldingPeriodUpdated(msg.sender, order.tokenContract, block.timestamp);
        }
        
        order.amount -= amount;
        
        if (order.amount == 0) {
            order.active = false;
            emit OrderExecuted(orderId, msg.sender, order.seller, amount, order.pricePerToken, totalPrice, platformFee);
        } else {
            emit OrderPartiallyFilled(orderId, msg.sender, amount, order.amount);
            emit OrderExecuted(orderId, msg.sender, order.seller, amount, order.pricePerToken, totalPrice, platformFee);
        }
        
        lastTradePrice[order.tokenContract] = order.pricePerToken;
        _updateMarketSummary(order.tokenContract);
    }

    function cancelSellOrder(uint256 orderId) external validOrder(orderId) {
        SellOrder storage order = orders[orderId];
        require(msg.sender == order.seller, "Only seller can cancel");
        
        uint256 amountToReturn = order.amount;
        order.active = false;
        order.amount = 0;
        
        StartupEquityToken token = StartupEquityToken(order.tokenContract);
        require(
            token.transfer(order.seller, amountToReturn),
            "Token return failed"
        );
        
        emit OrderCancelled(orderId, order.seller, amountToReturn);
    }

    function getActiveOrdersForToken(address tokenContract) 
        external view returns (SellOrder[] memory activeOrders) {
        uint256[] memory orderIds = tokenOrders[tokenContract];
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < orderIds.length; i++) {
            SellOrder memory order = orders[orderIds[i]];
            if (order.active && block.timestamp <= order.expiryTime) {
                activeCount++;
            }
        }
        
        activeOrders = new SellOrder[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < orderIds.length; i++) {
            SellOrder memory order = orders[orderIds[i]];
            if (order.active && block.timestamp <= order.expiryTime) {
                activeOrders[currentIndex] = order;
                currentIndex++;
            }
        }
        
        return activeOrders;
    }

    function getOrdersByPriceRange(
        address tokenContract,
        uint256 minPrice,
        uint256 maxPrice
    ) external view returns (SellOrder[] memory) {
        SellOrder[] memory allOrders = this.getActiveOrdersForToken(tokenContract);
        uint256 matchingCount = 0;
        
        for (uint256 i = 0; i < allOrders.length; i++) {
            if (allOrders[i].pricePerToken >= minPrice && allOrders[i].pricePerToken <= maxPrice) {
                matchingCount++;
            }
        }
        
        SellOrder[] memory matchingOrders = new SellOrder[](matchingCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < allOrders.length; i++) {
            if (allOrders[i].pricePerToken >= minPrice && allOrders[i].pricePerToken <= maxPrice) {
                matchingOrders[currentIndex] = allOrders[i];
                currentIndex++;
            }
        }
        
        return matchingOrders;
    }

    function getSellerOrders(address seller) external view returns (uint256[] memory) {
        return sellerOrders[seller];
    }

    function getMarketSummary(address tokenContract) external view returns (
        uint256 totalActiveOrders,
        uint256 totalVolume,
        uint256 lowestPrice,
        uint256 highestPrice,
        uint256 lastPrice
    ) {
        SellOrder[] memory activeOrders = this.getActiveOrdersForToken(tokenContract);
        
        totalActiveOrders = activeOrders.length;
        totalVolume = 0;
        lowestPrice = type(uint256).max;
        highestPrice = 0;
        
        for (uint256 i = 0; i < activeOrders.length; i++) {
            totalVolume += activeOrders[i].amount;
            if (activeOrders[i].pricePerToken < lowestPrice) {
                lowestPrice = activeOrders[i].pricePerToken;
            }
            if (activeOrders[i].pricePerToken > highestPrice) {
                highestPrice = activeOrders[i].pricePerToken;
            }
        }
        
        if (lowestPrice == type(uint256).max) lowestPrice = 0;
        lastPrice = lastTradePrice[tokenContract];
        
        return (totalActiveOrders, totalVolume, lowestPrice, highestPrice, lastPrice);
    }

    function canSellTokens(
        address seller,
        address tokenContract,
        uint256 amount
    ) external view returns (bool canSell, string memory reason) {
        if (!_isValidTokenContract(tokenContract)) {
            return (false, "Invalid token contract");
        }
        
        if (!_canSellTokens(seller, tokenContract, amount)) {
            return (false, "Holding period not met");
        }
        
        StartupEquityToken token = StartupEquityToken(tokenContract);
        if (token.balanceOf(seller) < amount) {
            return (false, "Insufficient balance");
        }
        
        return (true, "Can sell");
    }


    function _canSellTokens(address seller, address tokenContract, uint256 amount) internal view returns (bool) {
        uint256 purchaseTime = firstPurchaseTime[seller][tokenContract];
        
        if (purchaseTime == 0) return false;
        
        return block.timestamp >= purchaseTime + MIN_HOLDING_PERIOD;
    }

    function _isValidTokenContract(address tokenContract) internal view returns (bool) {
        try StartupEquityToken(tokenContract).name() returns (string memory) {
            return true;
        } catch {
            return false;
        }
    }

    function _updateMarketSummary(address tokenContract) internal {
        tokenMarketSummary[tokenContract].totalOrders = tokenOrders[tokenContract].length;
    }

    function initializeHoldingPeriod(address investor, address tokenContract) external {
        require(msg.sender == tokenContract, "Only token contract can initialize");
        
        if (firstPurchaseTime[investor][tokenContract] == 0) {
            firstPurchaseTime[investor][tokenContract] = block.timestamp;
            emit HoldingPeriodUpdated(investor, tokenContract, block.timestamp);
        }
    }
}