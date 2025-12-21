import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
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
    functionName: 'getRoundInfoView',
    query: {
      enabled: !!roundAddress,
    },
  });
}

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
    functionName: 'getInvestorInfoView',
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
    functionName: 'getYieldInfoView',
    query: {
      enabled: !!roundAddress,
    },
  });
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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseFloat(formatted));
}
