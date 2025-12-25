import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import {
  CONTRACTS,
  FndrIdentityABI,
  RoundFactoryABI,
  RoundManagerABI,
  StartupSecondaryMarketABI,
  MockUSDCABI,
  StartupEquityTokenABI,
  UserRole,
} from '@/lib/contracts';

// ============================================
// FndrIdentity Hooks
// ============================================

export function useIsUserRegistered(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.FndrIdentity as `0x${string}`,
    abi: FndrIdentityABI,
    functionName: 'isUserRegistered',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

export function useIsVerifiedUser(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.FndrIdentity as `0x${string}`,
    abi: FndrIdentityABI,
    functionName: 'isVerifiedUser',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

export function useIsZKPassportVerified(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.FndrIdentity as `0x${string}`,
    abi: FndrIdentityABI,
    functionName: 'isZKPassportVerified',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

export function useUserRole(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.FndrIdentity as `0x${string}`,
    abi: FndrIdentityABI,
    functionName: 'getUserRole',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

export function useIsFounder(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.FndrIdentity as `0x${string}`,
    abi: FndrIdentityABI,
    functionName: 'isFounder',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

export function useIsInvestor(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.FndrIdentity as `0x${string}`,
    abi: FndrIdentityABI,
    functionName: 'isInvestor',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

export function useRegisterUserRole() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const registerRole = (role: UserRole) => {
    writeContract({
      address: CONTRACTS.FndrIdentity as `0x${string}`,
      abi: FndrIdentityABI,
      functionName: 'registerUserRole',
      args: [role],
    });
  };

  return {
    registerRole,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useRegisterZKPassport() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const registerZKPassport = (uniqueIdentifier: `0x${string}`) => {
    writeContract({
      address: CONTRACTS.FndrIdentity as `0x${string}`,
      abi: FndrIdentityABI,
      functionName: 'registerZKPassportUser',
      args: [uniqueIdentifier],
    });
  };

  return {
    registerZKPassport,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// ============================================
// RoundFactory Hooks
// ============================================

export function useGetAllRounds() {
  return useReadContract({
    address: CONTRACTS.RoundFactory as `0x${string}`,
    abi: RoundFactoryABI,
    functionName: 'getAllRounds',
  });
}

export function useGetTotalRoundsCount() {
  return useReadContract({
    address: CONTRACTS.RoundFactory as `0x${string}`,
    abi: RoundFactoryABI,
    functionName: 'getTotalRoundsCount',
  });
}

export function useGetRoundByFounder(founder: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.RoundFactory as `0x${string}`,
    abi: RoundFactoryABI,
    functionName: 'getRoundByFounder',
    args: founder ? [founder] : undefined,
    query: {
      enabled: !!founder,
    },
  });
}

export function useRoundCreationFee() {
  return useReadContract({
    address: CONTRACTS.RoundFactory as `0x${string}`,
    abi: RoundFactoryABI,
    functionName: 'ROUND_CREATION_FEE',
  });
}

export function useCreateRound() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createRound = (
    targetRaise: bigint,
    equityPercentage: bigint,
    sharePrice: bigint,
    deadline: bigint,
    companySymbol: string,
    metadataURI: string
  ) => {
    writeContract({
      address: CONTRACTS.RoundFactory as `0x${string}`,
      abi: RoundFactoryABI,
      functionName: 'createRound',
      args: [targetRaise, equityPercentage, sharePrice, deadline, companySymbol, metadataURI],
    });
  };

  return {
    createRound,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// ============================================
// RoundManager Hooks (for specific round addresses)
// ============================================

export function useRoundInfo(roundAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: roundAddress,
    abi: RoundManagerABI,
    functionName: 'getRoundInfo',
    query: {
      enabled: !!roundAddress,
    },
  });
}

// Read the full round data struct including lastWithdrawal
export function useRoundData(roundAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: roundAddress,
    abi: RoundManagerABI,
    functionName: 'round',
    query: {
      enabled: !!roundAddress,
    },
  });
}

// Constants from the contract
export const SECONDS_PER_MONTH = 1 * 24 * 60 * 60; // 30 days in seconds

export function useRoundConfig(roundAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: roundAddress,
    abi: RoundManagerABI,
    functionName: 'config',
    query: {
      enabled: !!roundAddress,
    },
  });
}

export function useInvestorInfo(roundAddress: `0x${string}` | undefined, investor: `0x${string}` | undefined) {
  return useReadContract({
    address: roundAddress,
    abi: RoundManagerABI,
    functionName: 'getInvestorInfo',
    args: investor ? [investor] : undefined,
    query: {
      enabled: !!roundAddress && !!investor,
    },
  });
}

export function useYieldInfo(roundAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: roundAddress,
    abi: RoundManagerABI,
    functionName: 'getYieldInfo',
    query: {
      enabled: !!roundAddress,
    },
  });
}

// Hook to get pending yield across multiple rounds for an investor
export function useMultiRoundInvestorYield(
  roundAddresses: `0x${string}`[],
  investor: `0x${string}` | undefined
) {
  const contracts = roundAddresses.map((roundAddress) => ({
    address: roundAddress,
    abi: RoundManagerABI,
    functionName: 'getInvestorInfo' as const,
    args: investor ? [investor] : undefined,
  }));

  const result = useReadContracts({
    contracts,
    query: {
      enabled: !!investor && roundAddresses.length > 0,
    },
  });

  // Calculate total pending yield from all rounds
  const totalPendingYield = result.data?.reduce((total, roundResult) => {
    if (roundResult.status === 'success' && roundResult.result) {
      // getInvestorInfo returns: (contribution, equityTokens, yieldBalance, yieldClaimed)
      const yieldBalance = (roundResult.result as readonly [bigint, bigint, bigint, bigint])[2];
      return total + yieldBalance;
    }
    return total;
  }, BigInt(0)) || BigInt(0);

  // Get per-round yield breakdown
  const yieldByRound = result.data?.map((roundResult, index) => {
    if (roundResult.status === 'success' && roundResult.result) {
      const data = roundResult.result as readonly [bigint, bigint, bigint, bigint];
      return {
        roundAddress: roundAddresses[index],
        contribution: data[0],
        equityTokens: data[1],
        yieldBalance: data[2],
        yieldClaimed: data[3],
      };
    }
    return null;
  }).filter(Boolean) || [];

  return {
    ...result,
    totalPendingYield,
    yieldByRound,
  };
}

// Hook to get vault balance and round info for yield calculations
export function useMultiRoundYieldInfo(
  roundAddresses: `0x${string}`[],
  investor: `0x${string}` | undefined
) {
  // Fetch yield info (vault balance, total yield, APY) for each round
  const yieldContracts = roundAddresses.map((roundAddress) => ({
    address: roundAddress,
    abi: RoundManagerABI,
    functionName: 'getYieldInfo' as const,
  }));

  // Fetch round info (totalRaised, totalWithdrawn, tokensIssued) for each round
  const roundContracts = roundAddresses.map((roundAddress) => ({
    address: roundAddress,
    abi: RoundManagerABI,
    functionName: 'getRoundInfo' as const,
  }));

  // Fetch investor info for each round
  const investorContracts = roundAddresses.map((roundAddress) => ({
    address: roundAddress,
    abi: RoundManagerABI,
    functionName: 'getInvestorInfo' as const,
    args: investor ? [investor] : undefined,
  }));

  const yieldResult = useReadContracts({
    contracts: yieldContracts,
    query: { enabled: roundAddresses.length > 0 },
  });

  const roundResult = useReadContracts({
    contracts: roundContracts,
    query: { enabled: roundAddresses.length > 0 },
  });

  const investorResult = useReadContracts({
    contracts: investorContracts,
    query: { enabled: !!investor && roundAddresses.length > 0 },
  });

  // Calculate totals and per-round breakdown
  let totalVaultBalance = BigInt(0);
  let totalRaised = BigInt(0);
  let totalWithdrawn = BigInt(0);
  let totalTokensIssued = BigInt(0);
  let userTotalTokens = BigInt(0);
  let totalClaimableYield = BigInt(0);
  let totalYieldClaimed = BigInt(0);

  const roundBreakdown = roundAddresses.map((roundAddress, index) => {
    const yieldData = yieldResult.data?.[index];
    const roundData = roundResult.data?.[index];
    const investorData = investorResult.data?.[index];

    let vaultBalance = BigInt(0);
    let raised = BigInt(0);
    let withdrawn = BigInt(0);
    let tokensIssued = BigInt(0);
    let userTokens = BigInt(0);
    let claimableYield = BigInt(0);
    let yieldClaimed = BigInt(0);

    if (yieldData?.status === 'success' && yieldData.result) {
      const data = yieldData.result as readonly [bigint, bigint, bigint];
      vaultBalance = data[0]; // totalVaultBalance
    }

    if (roundData?.status === 'success' && roundData.result) {
      const data = roundData.result as readonly [number, bigint, bigint, bigint, bigint, bigint];
      raised = data[1]; // totalRaised
      withdrawn = data[2]; // totalWithdrawn
      tokensIssued = data[3]; // tokensIssued
    }

    if (investorData?.status === 'success' && investorData.result) {
      const data = investorData.result as readonly [bigint, bigint, bigint, bigint];
      userTokens = data[1]; // equityTokens
      claimableYield = data[2]; // yieldBalance
      yieldClaimed = data[3]; // yieldClaimed
    }

    // Accumulate totals
    totalVaultBalance += vaultBalance;
    totalRaised += raised;
    totalWithdrawn += withdrawn;
    totalTokensIssued += tokensIssued;
    userTotalTokens += userTokens;
    totalClaimableYield += claimableYield;
    totalYieldClaimed += yieldClaimed;

    // Calculate accruing yield for this round
    // Vault growth = vaultBalance - (raised - withdrawn)
    // This represents yield that has accrued but not yet distributed
    const originalPrincipal = raised > withdrawn ? raised - withdrawn : BigInt(0);
    const vaultGrowth = vaultBalance > originalPrincipal ? vaultBalance - originalPrincipal : BigInt(0);

    // Investor's share of potential yield (50% goes to investors, proportional to tokens)
    const investorShareOfGrowth = tokensIssued > BigInt(0) && userTokens > BigInt(0)
      ? (vaultGrowth * BigInt(50) * userTokens) / (BigInt(100) * tokensIssued)
      : BigInt(0);

    return {
      roundAddress,
      vaultBalance,
      totalRaised: raised,
      totalWithdrawn: withdrawn,
      tokensIssued,
      userTokens,
      claimableYield,
      yieldClaimed,
      accruingYield: investorShareOfGrowth,
    };
  });

  // Calculate total accruing yield
  const totalAccruingYield = roundBreakdown.reduce(
    (acc, round) => acc + (round?.accruingYield || BigInt(0)),
    BigInt(0)
  );

  // User's share of total vault
  const userVaultShare = totalTokensIssued > BigInt(0) && userTotalTokens > BigInt(0)
    ? (totalVaultBalance * userTotalTokens) / totalTokensIssued
    : BigInt(0);

  return {
    isLoading: yieldResult.isLoading || roundResult.isLoading || investorResult.isLoading,
    refetch: () => {
      yieldResult.refetch();
      roundResult.refetch();
      investorResult.refetch();
    },
    // Totals
    totalVaultBalance,
    totalRaised,
    totalWithdrawn,
    userTotalTokens,
    totalTokensIssued,
    totalClaimableYield,
    totalYieldClaimed,
    totalAccruingYield,
    userVaultShare,
    // Per-round breakdown
    roundBreakdown,
  };
}

export function useGetEquityToken(roundAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: roundAddress,
    abi: RoundManagerABI,
    functionName: 'getEquityToken',
    query: {
      enabled: !!roundAddress,
    },
  });
}

export function useInvest(roundAddress: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const invest = (usdcAmount: bigint) => {
    if (!roundAddress) return;
    writeContract({
      address: roundAddress,
      abi: RoundManagerABI,
      functionName: 'invest',
      args: [usdcAmount],
    });
  };

  return {
    invest,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useClaimYield(roundAddress: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimYield = () => {
    if (!roundAddress) return;
    writeContract({
      address: roundAddress,
      abi: RoundManagerABI,
      functionName: 'claimYield',
    });
  };

  return {
    claimYield,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useFounderWithdraw(roundAddress: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const founderWithdraw = (usdcAmount: bigint) => {
    if (!roundAddress) return;
    writeContract({
      address: roundAddress,
      abi: RoundManagerABI,
      functionName: 'founderWithdraw',
      args: [usdcAmount],
    });
  };

  return {
    founderWithdraw,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook to complete a round (triggers updateRoundState modifier)
export function useCompleteRound(roundAddress: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const completeRound = () => {
    if (!roundAddress) return;
    // Call checkRoundState which has updateRoundState modifier
    // This will trigger state transition if conditions are met
    writeContract({
      address: roundAddress,
      abi: RoundManagerABI,
      functionName: 'checkRoundState',
    });
  };

  return {
    completeRound,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// ============================================
// Secondary Market Hooks
// ============================================

export function useActiveOrdersForToken(tokenContract: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.StartupSecondaryMarket as `0x${string}`,
    abi: StartupSecondaryMarketABI,
    functionName: 'getActiveOrdersForToken',
    args: tokenContract ? [tokenContract] : undefined,
    query: {
      enabled: !!tokenContract,
    },
  });
}

export function useMarketSummary(tokenContract: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.StartupSecondaryMarket as `0x${string}`,
    abi: StartupSecondaryMarketABI,
    functionName: 'getMarketSummary',
    args: tokenContract ? [tokenContract] : undefined,
    query: {
      enabled: !!tokenContract,
    },
  });
}

export function useSellerOrders(seller: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.StartupSecondaryMarket as `0x${string}`,
    abi: StartupSecondaryMarketABI,
    functionName: 'getSellerOrders',
    args: seller ? [seller] : undefined,
    query: {
      enabled: !!seller,
    },
  });
}

export function useCanSellTokens(
  seller: `0x${string}` | undefined,
  tokenContract: `0x${string}` | undefined,
  amount: bigint
) {
  return useReadContract({
    address: CONTRACTS.StartupSecondaryMarket as `0x${string}`,
    abi: StartupSecondaryMarketABI,
    functionName: 'canSellTokens',
    args: seller && tokenContract ? [seller, tokenContract, amount] : undefined,
    query: {
      enabled: !!seller && !!tokenContract && amount > BigInt(0),
    },
  });
}

export function useFirstPurchaseTime(
  investor: `0x${string}` | undefined,
  tokenContract: `0x${string}` | undefined
) {
  return useReadContract({
    address: CONTRACTS.StartupSecondaryMarket as `0x${string}`,
    abi: StartupSecondaryMarketABI,
    functionName: 'firstPurchaseTime',
    args: investor && tokenContract ? [investor, tokenContract] : undefined,
    query: {
      enabled: !!investor && !!tokenContract,
    },
  });
}

export function useMinHoldingPeriod() {
  return useReadContract({
    address: CONTRACTS.StartupSecondaryMarket as `0x${string}`,
    abi: StartupSecondaryMarketABI,
    functionName: 'MIN_HOLDING_PERIOD',
  });
}

export function useCreateSellOrder() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createSellOrder = (
    tokenContract: `0x${string}`,
    amount: bigint,
    pricePerToken: bigint,
    durationHours: bigint
  ) => {
    writeContract({
      address: CONTRACTS.StartupSecondaryMarket as `0x${string}`,
      abi: StartupSecondaryMarketABI,
      functionName: 'createSellOrder',
      args: [tokenContract, amount, pricePerToken, durationHours],
    });
  };

  return {
    createSellOrder,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useBuyTokens() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const buyTokens = (orderId: bigint, amount: bigint) => {
    writeContract({
      address: CONTRACTS.StartupSecondaryMarket as `0x${string}`,
      abi: StartupSecondaryMarketABI,
      functionName: 'buyTokens',
      args: [orderId, amount],
    });
  };

  return {
    buyTokens,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useCancelSellOrder() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const cancelSellOrder = (orderId: bigint) => {
    writeContract({
      address: CONTRACTS.StartupSecondaryMarket as `0x${string}`,
      abi: StartupSecondaryMarketABI,
      functionName: 'cancelSellOrder',
      args: [orderId],
    });
  };

  return {
    cancelSellOrder,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// ============================================
// MockUSDC Hooks
// ============================================

export function useUSDCBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.MockUSDC as `0x${string}`,
    abi: MockUSDCABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

export function useUSDCAllowance(owner: `0x${string}` | undefined, spender: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.MockUSDC as `0x${string}`,
    abi: MockUSDCABI,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!owner && !!spender,
    },
  });
}

export function useHasClaimedAirdrop(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.MockUSDC as `0x${string}`,
    abi: MockUSDCABI,
    functionName: 'hasClaimedAirdrop',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

export function useUSDCAirdrop() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimAirdrop = () => {
    writeContract({
      address: CONTRACTS.MockUSDC as `0x${string}`,
      abi: MockUSDCABI,
      functionName: 'airdrop',
    });
  };

  return {
    claimAirdrop,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useUSDCApprove() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (spender: `0x${string}`, amount: bigint) => {
    writeContract({
      address: CONTRACTS.MockUSDC as `0x${string}`,
      abi: MockUSDCABI,
      functionName: 'approve',
      args: [spender, amount],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// ============================================
// StartupEquityToken Hooks
// ============================================

export function useEquityTokenInfo(tokenAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: tokenAddress,
    abi: StartupEquityTokenABI,
    functionName: 'getTokenInfo',
    query: {
      enabled: !!tokenAddress,
    },
  });
}

export function useEquityTokenBalance(tokenAddress: `0x${string}` | undefined, holder: `0x${string}` | undefined) {
  return useReadContract({
    address: tokenAddress,
    abi: StartupEquityTokenABI,
    functionName: 'balanceOf',
    args: holder ? [holder] : undefined,
    query: {
      enabled: !!tokenAddress && !!holder,
    },
  });
}

export function useEquityTokenApprove(tokenAddress: `0x${string}` | undefined) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (spender: `0x${string}`, amount: bigint) => {
    if (!tokenAddress) return;
    writeContract({
      address: tokenAddress,
      abi: StartupEquityTokenABI,
      functionName: 'approve',
      args: [spender, amount],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// ============================================
// Utility Functions
// ============================================

export const USDC_DECIMALS = 6;

export function parseUSDC(amount: string): bigint {
  return parseUnits(amount, USDC_DECIMALS);
}

export function formatUSDC(amount: bigint): string {
  return formatUnits(amount, USDC_DECIMALS);
}

export function formatUSDCDisplay(amount: bigint): string {
  const formatted = formatUnits(amount, USDC_DECIMALS);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parseFloat(formatted));
}
