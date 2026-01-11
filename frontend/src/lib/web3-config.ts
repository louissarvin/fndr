import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrumSepolia } from './contracts';

// Fndr Web3 Configuration
export const config = getDefaultConfig({
  appName: 'Fndr',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
  chains: [arbitrumSepolia],
  ssr: false,
});

// Mock data for demo purposes
export const MOCK_CAMPAIGNS = [
  {
    id: '1',
    name: 'NeuralAI Labs',
    tagline: 'Next-gen AI infrastructure for enterprises',
    description: 'Building the future of enterprise AI with proprietary neural architecture that reduces inference costs by 90%.',
    category: 'AI/ML',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    raised: 450000,
    target: 750000,
    investors: 234,
    daysLeft: 12,
    apy: 6,
    founder: {
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      verified: true,
    },
    featured: true,
  },
  {
    id: '2',
    name: 'DeFi Protocol X',
    tagline: 'Cross-chain liquidity aggregation',
    description: 'Revolutionary cross-chain DEX aggregator that finds the best rates across 15+ blockchains.',
    category: 'Web3',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
    raised: 320000,
    target: 500000,
    investors: 156,
    daysLeft: 8,
    apy: 6,
    founder: {
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      verified: true,
    },
    featured: true,
  },
  {
    id: '3',
    name: 'MedChain Health',
    tagline: 'Blockchain-powered health records',
    description: 'Secure, portable health records on blockchain. Own your medical data.',
    category: 'HealthTech',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800',
    raised: 180000,
    target: 400000,
    investors: 89,
    daysLeft: 21,
    apy: 6,
    founder: {
      name: 'Dr. Michael Park',
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100',
      verified: true,
    },
    featured: false,
  },
  {
    id: '4',
    name: 'PayFlow',
    tagline: 'Instant cross-border payments',
    description: 'Send money globally in seconds with near-zero fees using stablecoin rails.',
    category: 'FinTech',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
    raised: 890000,
    target: 1000000,
    investors: 412,
    daysLeft: 5,
    apy: 6,
    founder: {
      name: 'Emma Watson',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      verified: true,
    },
    featured: true,
  },
  {
    id: '5',
    name: 'GreenVolt Energy',
    tagline: 'Tokenized renewable energy credits',
    description: 'Making carbon credits accessible and tradeable for everyone through tokenization.',
    category: 'CleanTech',
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800',
    raised: 250000,
    target: 600000,
    investors: 178,
    daysLeft: 15,
    apy: 6,
    founder: {
      name: 'James Miller',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      verified: false,
    },
    featured: false,
  },
  {
    id: '6',
    name: 'MetaLearn',
    tagline: 'AI-powered personalized education',
    description: 'Adaptive learning platform that personalizes curriculum in real-time using AI.',
    category: 'EdTech',
    image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800',
    raised: 420000,
    target: 550000,
    investors: 267,
    daysLeft: 9,
    apy: 6,
    founder: {
      name: 'Lisa Zhang',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100',
      verified: true,
    },
    featured: true,
  },
];

export const MOCK_PORTFOLIO = [
  {
    id: '1',
    campaignId: '1',
    campaignName: 'NeuralAI Labs',
    invested: 5000,
    currentValue: 5450,
    yieldEarned: 125,
    purchaseDate: '2024-01-15',
    status: 'active',
  },
  {
    id: '2',
    campaignId: '4',
    campaignName: 'PayFlow',
    invested: 10000,
    currentValue: 11200,
    yieldEarned: 280,
    purchaseDate: '2024-02-01',
    status: 'active',
  },
  {
    id: '3',
    campaignId: '6',
    campaignName: 'MetaLearn',
    invested: 2500,
    currentValue: 2680,
    yieldEarned: 62,
    purchaseDate: '2024-02-20',
    status: 'active',
  },
];

export const CATEGORIES = [
  { id: 'all', name: 'All', count: 6 },
  { id: 'ai-ml', name: 'AI/ML', count: 1 },
  { id: 'fintech', name: 'FinTech', count: 1 },
  { id: 'web3', name: 'Web3', count: 1 },
  { id: 'healthtech', name: 'HealthTech', count: 1 },
  { id: 'cleantech', name: 'CleanTech', count: 1 },
  { id: 'edtech', name: 'EdTech', count: 1 },
];

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

export const calculateProgress = (raised: number, target: number): number => {
  return Math.min(Math.round((raised / target) * 100), 100);
};

// Marketplace Mock Data
export interface MarketToken {
  id: string;
  name: string;
  symbol: string;
  image: string;
  totalSupply: number;
  holders: number;
  lastTradePrice: number;
  priceChange24h: number;
  volume24h: number;
  floorPrice: number;
  campaign: {
    name: string;
    category: string;
  };
}

export interface SellOrder {
  id: string;
  seller: {
    address: string;
    name: string;
    avatar: string;
    verified: boolean;
  };
  token: MarketToken;
  amount: number;
  originalAmount: number;
  pricePerToken: number;
  totalValue: number;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

export const MOCK_MARKET_TOKENS: MarketToken[] = [
  {
    id: '1',
    name: 'NeuralAI Labs Equity',
    symbol: 'NRAL',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    totalSupply: 50000,
    holders: 234,
    lastTradePrice: 2.45,
    priceChange24h: 12.5,
    volume24h: 45000,
    floorPrice: 2.20,
    campaign: {
      name: 'NeuralAI Labs',
      category: 'AI/ML',
    },
  },
  {
    id: '2',
    name: 'PayFlow Equity',
    symbol: 'PFLOW',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
    totalSupply: 100000,
    holders: 412,
    lastTradePrice: 3.80,
    priceChange24h: -2.3,
    volume24h: 89000,
    floorPrice: 3.50,
    campaign: {
      name: 'PayFlow',
      category: 'FinTech',
    },
  },
  {
    id: '3',
    name: 'MetaLearn Equity',
    symbol: 'MTLRN',
    image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800',
    totalSupply: 75000,
    holders: 267,
    lastTradePrice: 1.95,
    priceChange24h: 5.8,
    volume24h: 32000,
    floorPrice: 1.80,
    campaign: {
      name: 'MetaLearn',
      category: 'EdTech',
    },
  },
  {
    id: '4',
    name: 'DeFi Protocol X Equity',
    symbol: 'DPEX',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
    totalSupply: 120000,
    holders: 156,
    lastTradePrice: 4.20,
    priceChange24h: 8.7,
    volume24h: 67000,
    floorPrice: 3.90,
    campaign: {
      name: 'DeFi Protocol X',
      category: 'Web3',
    },
  },
  {
    id: '5',
    name: 'MedChain Health Equity',
    symbol: 'MCHH',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800',
    totalSupply: 60000,
    holders: 89,
    lastTradePrice: 1.50,
    priceChange24h: -4.2,
    volume24h: 18000,
    floorPrice: 1.35,
    campaign: {
      name: 'MedChain Health',
      category: 'HealthTech',
    },
  },
  {
    id: '6',
    name: 'GreenVolt Energy Equity',
    symbol: 'GVOLT',
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800',
    totalSupply: 80000,
    holders: 178,
    lastTradePrice: 2.85,
    priceChange24h: 3.1,
    volume24h: 41000,
    floorPrice: 2.60,
    campaign: {
      name: 'GreenVolt Energy',
      category: 'CleanTech',
    },
  },
  {
    id: '7',
    name: 'CloudSync Pro Equity',
    symbol: 'CSYNC',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
    totalSupply: 90000,
    holders: 312,
    lastTradePrice: 5.10,
    priceChange24h: 15.2,
    volume24h: 112000,
    floorPrice: 4.80,
    campaign: {
      name: 'CloudSync Pro',
      category: 'SaaS',
    },
  },
  {
    id: '8',
    name: 'RoboTech Industries Equity',
    symbol: 'RBTK',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
    totalSupply: 45000,
    holders: 145,
    lastTradePrice: 6.75,
    priceChange24h: -1.8,
    volume24h: 58000,
    floorPrice: 6.20,
    campaign: {
      name: 'RoboTech Industries',
      category: 'Robotics',
    },
  },
  {
    id: '9',
    name: 'GameFi Studios Equity',
    symbol: 'GMFI',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800',
    totalSupply: 150000,
    holders: 523,
    lastTradePrice: 1.25,
    priceChange24h: 22.4,
    volume24h: 95000,
    floorPrice: 1.10,
    campaign: {
      name: 'GameFi Studios',
      category: 'Gaming',
    },
  },
  {
    id: '10',
    name: 'BioGen Labs Equity',
    symbol: 'BGEN',
    image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800',
    totalSupply: 35000,
    holders: 98,
    lastTradePrice: 8.90,
    priceChange24h: 6.3,
    volume24h: 72000,
    floorPrice: 8.50,
    campaign: {
      name: 'BioGen Labs',
      category: 'BioTech',
    },
  },
];

export const MOCK_SELL_ORDERS: SellOrder[] = [
  {
    id: '1',
    seller: {
      address: '0x7a3b...9f2d',
      name: 'CryptoWhale',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      verified: true,
    },
    token: MOCK_MARKET_TOKENS[0],
    amount: 5000,
    originalAmount: 5000,
    pricePerToken: 2.50,
    totalValue: 12500,
    createdAt: '2024-03-15T10:30:00Z',
    expiresAt: '2024-04-14T10:30:00Z',
    isActive: true,
  },
  {
    id: '2',
    seller: {
      address: '0x3e8f...4a1c',
      name: 'EarlyBacker',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=100',
      verified: true,
    },
    token: MOCK_MARKET_TOKENS[0],
    amount: 2500,
    originalAmount: 3000,
    pricePerToken: 2.35,
    totalValue: 5875,
    createdAt: '2024-03-14T14:20:00Z',
    expiresAt: '2024-04-13T14:20:00Z',
    isActive: true,
  },
  {
    id: '3',
    seller: {
      address: '0x9c2a...7b3e',
      name: 'VentureDAO',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      verified: true,
    },
    token: MOCK_MARKET_TOKENS[1],
    amount: 10000,
    originalAmount: 10000,
    pricePerToken: 3.75,
    totalValue: 37500,
    createdAt: '2024-03-16T09:00:00Z',
    expiresAt: '2024-04-15T09:00:00Z',
    isActive: true,
  },
  {
    id: '4',
    seller: {
      address: '0x5d1f...8e9a',
      name: 'TokenTrader',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      verified: false,
    },
    token: MOCK_MARKET_TOKENS[1],
    amount: 3500,
    originalAmount: 5000,
    pricePerToken: 3.90,
    totalValue: 13650,
    createdAt: '2024-03-13T16:45:00Z',
    expiresAt: '2024-04-12T16:45:00Z',
    isActive: true,
  },
  {
    id: '5',
    seller: {
      address: '0x2b4c...1d6f',
      name: 'DiamondHands',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100',
      verified: true,
    },
    token: MOCK_MARKET_TOKENS[2],
    amount: 8000,
    originalAmount: 8000,
    pricePerToken: 2.00,
    totalValue: 16000,
    createdAt: '2024-03-17T11:15:00Z',
    expiresAt: '2024-04-16T11:15:00Z',
    isActive: true,
  },
];

export const PLATFORM_FEE_BPS = 25; // 0.25%

export const calculatePlatformFee = (amount: number): number => {
  return (amount * PLATFORM_FEE_BPS) / 10000;
};

export const formatTimeRemaining = (expiresAt: string): string => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
};
