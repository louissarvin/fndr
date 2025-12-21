import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

const LandingNavbar = forwardRef<HTMLElement>((_, ref) => {
  return (
    <nav ref={ref} className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 opacity-0">
      <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-full px-8 shadow-lg flex items-center space-x-8">
        <div className="flex items-center">
          <img src="/fndr.png" alt="Fndr" className="h-16" />
        </div>
        <div className="flex items-center space-x-6">
          <a href="/browse" className="text-[#F6F6F6] hover:text-[#CFFFE2] transition-colors font-medium text-sm">Browse</a>
          <a href="/marketplace" className="text-[#F6F6F6] hover:text-[#CFFFE2] transition-colors font-medium text-sm">Marketplace</a>
          <a href="/dashboard" className="text-[#F6F6F6] hover:text-[#CFFFE2] transition-colors font-medium text-sm">Dashboard</a>
          <a href="#how-it-works" className="text-[#F6F6F6] hover:text-[#CFFFE2] transition-colors font-medium text-sm">How it Works</a>
          <Link to="/browse" className="bg-[#A2D5C6] text-[#000000] px-4 py-2 rounded-full font-semibold text-sm hover:bg-[#CFFFE2] transition-colors">
            Launch App
          </Link>
        </div>
      </div>
    </nav>
  );
});

LandingNavbar.displayName = 'LandingNavbar';

export default LandingNavbar;
