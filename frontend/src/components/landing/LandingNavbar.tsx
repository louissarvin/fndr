import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

const LandingNavbar = forwardRef<HTMLElement>((_, ref) => {
  return (
    <nav ref={ref} className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 opacity-0">
      <div className="bg-[#4988C4]/10 backdrop-blur-md rounded-full px-8 shadow-lg flex items-center space-x-8">
        <div className="flex items-center">
          <img src="/fndr.png" alt="Fndr" className="h-16" />
        </div>
        <div className="flex items-center space-x-6">
          <a href="/browse" className="text-[#F6F6F6] hover:text-[#1C4D8D] transition-colors font-medium text-sm">Browse</a>
          <a href="/marketplace" className="text-[#F6F6F6] hover:text-[#1C4D8D] transition-colors font-medium text-sm">Marketplace</a>
          <a href="/docs" className="text-[#F6F6F6] hover:text-[#1C4D8D] transition-colors font-medium text-sm">Documentation</a>
          <Link to="/browse" className="bg-[#4988C4] px-4 py-2 rounded-full font-semibold text-sm hover:bg-[#1C4D8D] transition-colors" style={{ color: '#000000' }}>
            Launch App
          </Link>
        </div>
      </div>
    </nav>
  );
});

LandingNavbar.displayName = 'LandingNavbar';

export default LandingNavbar;
