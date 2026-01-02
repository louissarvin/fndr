// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/interfaces/IERC4626.sol";
import "forge-std/interfaces/IERC20.sol";


contract MockVault is IERC4626 {
    error InsufficientBalance();
    error InsufficientBalanceShares();
    error InsufficientAllowance();
    error CannotDepositZeroAssets();
    error CannotWithdrawZeroAssets();
    error CannotMintZeroShares();
    error CannotRedeemZeroShares();
    error CannotUseZeroAddress();

    IERC20 private immutable _asset;
    
    string public name;
    string public symbol;
    uint8 public decimals;
    
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    uint256 public constant ANNUAL_YIELD_RATE = 6e16;
    uint256 public constant SECONDS_PER_YEAR = 365.25 days;
    
    uint256 public lastYieldUpdate;
    uint256 private _totalAssets;
    uint256 public accumulatedYield;
    
    event YieldGenerated(uint256 amount, uint256 timestamp);
    
    constructor(address assetAddress, string memory _name, string memory _symbol) {
        _asset = IERC20(assetAddress);
        name = _name;
        symbol = _symbol;
        decimals = 6;
        lastYieldUpdate = block.timestamp;
    }
    
    function asset() external view returns (address) {
        return address(_asset);
    }
    
    modifier updateYield() {
        if (_totalAssets > 0) {
            uint256 timeElapsed = block.timestamp - lastYieldUpdate;
            uint256 yieldGenerated = (_totalAssets * ANNUAL_YIELD_RATE * timeElapsed) / (1e18 * SECONDS_PER_YEAR);
            
            if (yieldGenerated > 0 && _asset.balanceOf(address(this)) >= _totalAssets + yieldGenerated) {
                accumulatedYield += yieldGenerated;
                _totalAssets += yieldGenerated;
                emit YieldGenerated(yieldGenerated, block.timestamp);
            }
        }
        lastYieldUpdate = block.timestamp;
        _;
    }
    
    function deposit(uint256 assets, address receiver) external updateYield returns (uint256 shares) {
        if(assets == 0) {
            revert CannotDepositZeroAssets();
        }
        if(_asset.balanceOf(msg.sender) < assets) {
            revert InsufficientBalance();
        }
        if(_asset.allowance(msg.sender, address(this)) < assets) {
            revert InsufficientAllowance();
        }
        if(receiver == address(0)) {
            revert CannotUseZeroAddress();
        }
        
        shares = convertToShares(assets);
        
        _asset.transferFrom(msg.sender, address(this), assets);
        _totalAssets += assets;
        
        _mint(receiver, shares);
        
        emit Deposit(msg.sender, receiver, assets, shares);
    }
    
    function withdraw(uint256 assets, address receiver, address owner) external updateYield returns (uint256 shares) {
        shares = convertToShares(assets);
        if(assets == 0) {
            revert CannotWithdrawZeroAssets();
        }
        if(_asset.balanceOf(address(this)) < assets) {
            revert InsufficientBalance();
        }
        if(receiver == address(0) || owner == address(0)) {
            revert CannotUseZeroAddress();
        }
        if(balanceOf[owner] < shares) {
            revert InsufficientBalanceShares();
        }
        
        if (msg.sender != owner) {
            uint256 currentAllowance = allowance[owner][msg.sender];
            require(currentAllowance >= shares, "Insufficient allowance");
            allowance[owner][msg.sender] = currentAllowance - shares;
        }
        
        _burn(owner, shares);
        _totalAssets -= assets;
        
        _asset.transfer(receiver, assets);
        
        emit Withdraw(msg.sender, receiver, owner, assets, shares);
    }
    
    function mint(uint256 shares, address receiver) external updateYield returns (uint256 assets) {
        if(shares == 0) {
            revert CannotMintZeroShares();
        }
        if(receiver == address(0)) {
            revert CannotUseZeroAddress();
        }
        if(_asset.balanceOf(msg.sender) < assets) {
            revert InsufficientBalance();
        }
        if(_asset.allowance(msg.sender, address(this)) < assets) {
            revert InsufficientAllowance();
        }

        assets = convertToAssets(shares);
        
        _asset.transferFrom(msg.sender, address(this), assets);
        _totalAssets += assets;
        
        _mint(receiver, shares);
        
        emit Deposit(msg.sender, receiver, assets, shares);
    }
    
    function redeem(uint256 shares, address receiver, address owner) external updateYield returns (uint256 assets) {
        assets = convertToAssets(shares);

        if(shares == 0) {
            revert CannotRedeemZeroShares();
        }
        if(_asset.balanceOf(address(this)) < assets) {
            revert InsufficientBalance();
        }
        if(receiver == address(0) || owner == address(0)) {
            revert CannotUseZeroAddress();
        }
        if(balanceOf[owner] < shares) {
            revert InsufficientBalanceShares();
        }
        if(assets == 0) {
            revert CannotWithdrawZeroAssets();
        }

        if (msg.sender != owner) {
            uint256 currentAllowance = allowance[owner][msg.sender];
            require(currentAllowance >= shares, "Insufficient allowance");
            allowance[owner][msg.sender] = currentAllowance - shares;
        }
        
        _totalAssets -= assets;
        _burn(owner, shares);
        
        _asset.transfer(receiver, assets);
        
        emit Withdraw(msg.sender, receiver, owner, assets, shares);
    }

    function convertToShares(uint256 assets) public view returns (uint256) {
        if (totalSupply == 0 || _totalAssets == 0) return assets;
        return (assets * totalSupply) / _totalAssets;
    }

    function convertToAssets(uint256 shares) public view returns (uint256) {
        if (totalSupply == 0) return shares;
        
        uint256 currentAssets = this.totalAssets();
        if (currentAssets == 0) return shares;
        
        return (shares * currentAssets) / totalSupply;
    }

    function previewDeposit(uint256 assets) external view returns (uint256) {
        return convertToShares(assets);
    }

    function previewMint(uint256 shares) external view returns (uint256) {
        return convertToAssets(shares);
    }

    function previewWithdraw(uint256 assets) external view returns (uint256) {
        return convertToShares(assets);
    }

    function previewRedeem(uint256 shares) external view returns (uint256) {
        return convertToAssets(shares);
    }

    function maxDeposit(address) external pure returns (uint256) {
        return type(uint256).max;
    }

    function maxMint(address) external pure returns (uint256) {
        return type(uint256).max;
    }

    function maxWithdraw(address owner) external view returns (uint256) {
        return convertToAssets(balanceOf[owner]);
    }

    function maxRedeem(address owner) external view returns (uint256) {
        return balanceOf[owner];
    }

    function totalAssets() external view returns (uint256) {
        if (_totalAssets == 0) return 0;
        
        uint256 timeElapsed = block.timestamp - lastYieldUpdate;
        uint256 yieldGenerated = (_totalAssets * ANNUAL_YIELD_RATE * timeElapsed) / (1e18 * SECONDS_PER_YEAR);
        
        return _totalAssets + yieldGenerated;
    }

    function getCurrentAPY() external pure returns (uint256) {
        return 6; 
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        require(currentAllowance >= amount, "Insufficient allowance");
        require(balanceOf[from] >= amount, "Insufficient balance");
        
        allowance[from][msg.sender] = currentAllowance - amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    function _mint(address to, uint256 amount) internal {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
    
    function _burn(address from, uint256 amount) internal {
        require(balanceOf[from] >= amount, "Insufficient balance to burn");
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }
}