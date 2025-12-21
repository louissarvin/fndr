import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Wallet, ChevronDown, Search, Droplets, UserCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import FaucetModal from '@/components/wallet/FaucetModal';
import IdentityModal from '@/components/wallet/IdentityModal';

export default function Navbar() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [isOpen, setIsOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [faucetModalOpen, setFaucetModalOpen] = useState(false);
  const [identityModalOpen, setIdentityModalOpen] = useState(false);

  const handleDisconnect = () => {
    disconnect();
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Handle keyboard shortcut ⌘K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('navbar-search');
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* Floating navbar card */}
      <div className="max-w-5xl mx-auto bg-[#000000]/50 backdrop-blur-lg border border-[#1F1F1F] rounded-b-2xl px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/fndr.png" alt="Fndr" className="h-16" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/browse"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Browse
          </Link>
          <Link
            to="/marketplace"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Marketplace
          </Link>
        </nav>

        {/* Desktop Right Section */}
        <div className="hidden md:flex items-center gap-3">
          {/* Search Bar */}
          <div className={`relative flex items-center transition-all duration-200`}>
            <div className="flex items-center bg-[#1A1A1A] rounded-2xl px-5 py-2.5 gap-2">
              <Search className="h-4 w-4 text-[#F6F6F6]/80" />
              <input
                id="navbar-search"
                type="text"
                placeholder="Search startups..."
                className="bg-transparent text-sm text-white placeholder-[#F6F6F6]/80 outline-none w-[140px]"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              <div className="flex items-center gap-0.5 text-[#F6F6F6]/80 text-xs font-medium bg-[#2A2A2A] px-1.5 py-0.5 rounded">
                <span>⌘</span>
                <span>K</span>
              </div>
            </div>
          </div>

          {/* Faucet Button - only when connected */}
          {isConnected && (
            <button
              onClick={() => setFaucetModalOpen(true)}
              className="flex items-center gap-2 bg-transparent text-[#A2D5C6] px-4 py-2 rounded-2xl text-sm font-semibold border border-[#A2D5C6] hover:border-[#CFFFE2] hover:text-[#CFFFE2] hover:scale-105 transition-all duration-300"
            >
              <Droplets className="h-4 w-4" />
              Faucet
            </button>
          )}

          {/* Verify Identity Button - only when connected */}
          {isConnected && (
            <button
              onClick={() => setIdentityModalOpen(true)}
              className="flex items-center gap-2 bg-transparent text-[#A2D5C6] px-4 py-2 rounded-2xl text-sm font-semibold border border-[#A2D5C6] hover:border-[#CFFFE2] hover:text-[#CFFFE2] hover:scale-105 transition-all duration-300"
            >
              <UserCheck className="h-4 w-4" />
              Identity
            </button>
          )}

          {/* Connect Wallet Button */}
          {isConnected && address ? (
            <DropdownMenu open={walletDropdownOpen} onOpenChange={setWalletDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <button className={`flex items-center gap-2 bg-[#A2D5C6] text-black px-5 py-2.5 text-sm font-semibold border border-[#A2D5C6] hover:bg-[#CFFFE2] hover:border-[#CFFFE2] transition-all duration-200 ${walletDropdownOpen ? 'rounded-t-xl rounded-b-none' : 'rounded-xl'}`}>
                  <Wallet className="h-4 w-4" />
                  <span className="font-mono text-xs">{shortenAddress(address)}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${walletDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={0} className="bg-[#A2D5C6] border-0 rounded-t-none rounded-b-xl min-w-[var(--radix-dropdown-menu-trigger-width)] animate-in fade-in-0 zoom-in-95 duration-200 py-3 pb-4">
                <DropdownMenuItem asChild className="text-black hover:bg-transparent focus:bg-transparent focus:text-black cursor-pointer relative overflow-hidden group">
                  <Link to="/dashboard">
                    <span className="relative z-10">View Portfolio</span>
                    <span className="absolute bottom-1 left-2 h-[2px] w-0 bg-black transition-all duration-300 ease-out group-hover:w-[calc(100%-16px)]"></span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDisconnect} className="text-red-600 hover:bg-transparent focus:bg-transparent focus:text-red-600 cursor-pointer relative overflow-hidden group">
                  <span className="relative z-10">Disconnect</span>
                  <span className="absolute bottom-1 left-2 h-[2px] w-0 bg-red-600 transition-all duration-300 ease-out group-hover:w-[calc(100%-16px)]"></span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={openConnectModal}
                  className="flex items-center gap-2 bg-[#A2D5C6] text-black rounded-2xl px-5 py-2.5 text-sm font-semibold border border-[#A2D5C6] hover:bg-[#CFFFE2] hover:border-[#CFFFE2] transition-colors"
                >
                  Connect Wallet
                </button>
              )}
            </ConnectButton.Custom>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <button className="text-white hover:bg-[#1A1A1A] p-2 rounded-lg transition-colors">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] bg-[#0A0A0A] border-[#1F1F1F]">
            <div className="flex flex-col gap-6 mt-6">
              {/* Mobile Search */}
              <div className="flex items-center bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 gap-2">
                <Search className="h-4 w-4 text-[#666666]" />
                <input
                  type="text"
                  placeholder="Search markets..."
                  className="bg-transparent text-sm text-white placeholder-[#666666] outline-none flex-1"
                />
              </div>

              {/* Mobile Testnet */}
              <button className="flex items-center justify-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-sm text-white font-medium">
                <span className="w-2 h-2 rounded-full bg-[#A2D5C6]"></span>
                Testnet
              </button>

              {/* Mobile Faucet - only when connected */}
              {isConnected && (
                <button
                  onClick={() => {
                    setFaucetModalOpen(true);
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 bg-transparent text-[#A2D5C6] rounded-lg px-4 py-3 text-sm font-semibold border border-[#A2D5C6] hover:bg-[#A2D5C6]/10 hover:border-[#CFFFE2] hover:text-[#CFFFE2] transition-all duration-300"
                >
                  <Droplets className="h-4 w-4" />
                  Get Test USDC
                </button>
              )}

              {/* Mobile Verify Identity - only when connected */}
              {isConnected && (
                <button
                  onClick={() => {
                    setIdentityModalOpen(true);
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 bg-transparent text-[#A2D5C6] rounded-lg px-4 py-3 text-sm font-semibold border border-[#A2D5C6] hover:bg-[#A2D5C6]/10 hover:border-[#CFFFE2] hover:text-[#CFFFE2] transition-all duration-300"
                >
                  <UserCheck className="h-4 w-4" />
                  Verify Identity
                </button>
              )}

              {/* Mobile Connect Wallet */}
              {isConnected && address ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-sm text-white font-mono">
                    {shortenAddress(address)}
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="flex items-center justify-center gap-2 bg-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm font-medium border border-red-500/30"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              ) : (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button
                      onClick={openConnectModal}
                      className="flex items-center justify-center gap-2 bg-white text-black rounded-lg px-4 py-3 text-sm font-medium"
                    >
                      Connect Wallet
                    </button>
                  )}
                </ConnectButton.Custom>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Modals */}
      <FaucetModal open={faucetModalOpen} onOpenChange={setFaucetModalOpen} />
      <IdentityModal open={identityModalOpen} onOpenChange={setIdentityModalOpen} />
    </header>
  );
}
