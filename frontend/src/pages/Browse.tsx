import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Layout from '@/components/layout/Layout';
import CampaignCard from '@/components/campaigns/CampaignCard';
import { MOCK_CAMPAIGNS, CATEGORIES } from '@/lib/web3-config';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 6;

export default function Browse() {
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);

  // Animation refs
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Get title words
      const titleWords = titleRef.current?.querySelectorAll('.title-word') || [];

      // Set initial states
      gsap.set(titleWords, { y: 100, opacity: 0 });
      gsap.set(subtitleRef.current, { y: 20, opacity: 0 });
      gsap.set(filtersRef.current, { y: 30, opacity: 0 });
      gsap.set(gridRef.current, { y: 40, opacity: 0 });

      // Animate title words with stagger
      tl.to(titleWords, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: 'back.out(1.7)'
      });

      // Animate subtitle
      tl.to(subtitleRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out'
      }, '-=0.4');

      // Animate filters
      tl.to(filtersRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out'
      }, '-=0.3');

      // Animate grid
      tl.to(gridRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out'
      }, '-=0.3');
    });

    return () => ctx.revert();
  }, []);

  const filteredCampaigns = MOCK_CAMPAIGNS.filter((c) => {
    const matchesCategory = category === 'all' ||
      c.category.toLowerCase().replace('/', '-') === category;
    return matchesCategory;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredCampaigns.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCampaigns = filteredCampaigns.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset to page 1 when filters change
  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setCurrentPage(1);
  };

  return (
    <Layout>
      <div className="py-12 px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 ref={titleRef} className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-4 overflow-hidden flex justify-center flex-wrap gap-4">
              {'Browse Startups'.split(' ').map((word, i) => (
                <span key={i} className="inline-block title-word">{word}</span>
              ))}
            </h1>
            <p ref={subtitleRef} className="text-lg text-[#F6F6F6]/60 max-w-xl mx-auto">
              Discover investment opportunities and earn 6% APY on your invested capital.
            </p>
          </div>

          {/* Main Container Card - glassmorphism like landing page */}
          <div>
            {/* Filters Row */}
            <div ref={filtersRef} className="flex flex-col md:flex-row gap-4 mb-8">
              {/* Category Dropdown */}
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="appearance-none bg-[#A2D5C6]/20 backdrop-blur-md border-0 rounded-xl px-5 py-3 pr-12 text-sm text-white font-medium cursor-pointer hover:bg-[#A2D5C6]/30 transition-colors focus:outline-none focus:ring-2 focus:ring-[#A2D5C6]/50"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-[#1A1A1A] text-white">{cat.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" />
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-[#A2D5C6]/20 backdrop-blur-md border-0 rounded-2xl px-5 py-3 pr-12 text-sm text-white font-medium cursor-pointer hover:bg-[#A2D5C6]/30 transition-colors focus:outline-none focus:ring-2 focus:ring-[#A2D5C6]/50"
                >
                  <option value="popular" className="bg-[#1A1A1A] text-white">Most Popular</option>
                  <option value="yield" className="bg-[#1A1A1A] text-white">Highest Yield</option>
                  <option value="ending" className="bg-[#1A1A1A] text-white">Ending Soon</option>
                  <option value="recent" className="bg-[#1A1A1A] text-white">Recently Added</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none" />
              </div>
            </div>

            {/* Results Grid */}
            <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>

            {filteredCampaigns.length === 0 && (
              <div className="text-center py-16">
                <p className="text-[#F6F6F6]/60 text-lg">No campaigns found matching your criteria.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-10">
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      currentPage === 1
                        ? 'text-white/20 cursor-not-allowed'
                        : 'text-white/60 hover:text-white hover:bg-[#A2D5C6]/20'
                    }`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                          currentPage === page
                            ? 'bg-[#A2D5C6] text-black'
                            : 'text-white/60 hover:text-white hover:bg-[#A2D5C6]/20'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      currentPage === totalPages
                        ? 'text-white/20 cursor-not-allowed'
                        : 'text-white/60 hover:text-white hover:bg-[#A2D5C6]/20'
                    }`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
