import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Layout from '@/components/layout/Layout';
import RoundCard from '@/components/campaigns/RoundCard';
import AIChat from '@/components/ai/AIChat';
import { useRounds } from '@/hooks/usePonderData';
import { ChevronLeft, ChevronRight, Loader2, Wifi, WifiOff, Rocket } from 'lucide-react';

const ITEMS_PER_PAGE = 6;

export default function Browse() {
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch real data from Ponder
  const { data: rounds, isLoading, error } = useRounds();

  // Animation refs
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      const titleWords = titleRef.current?.querySelectorAll('.title-word') || [];

      gsap.set(titleWords, { y: 100, opacity: 0 });
      gsap.set(subtitleRef.current, { y: 20, opacity: 0 });
      gsap.set(gridRef.current, { y: 40, opacity: 0 });

      tl.to(titleWords, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: 'back.out(1.7)'
      });

      tl.to(subtitleRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out'
      }, '-=0.4');

      tl.to(gridRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out'
      }, '-=0.3');
    });

    return () => ctx.revert();
  }, []);

  // Pagination logic
  const totalPages = Math.ceil((rounds?.length || 0) / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRounds = rounds?.slice(startIndex, startIndex + ITEMS_PER_PAGE) || [];

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
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

          {/* Connection Status */}
          <div className="flex justify-center mb-8">
            {isLoading ? (
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading rounds...
              </div>
            ) : error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <WifiOff className="h-4 w-4" />
                Failed to connect to indexer
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-[#A2D5C6] mb-4" />
              <p className="text-white/60">Loading rounds from indexer...</p>
            </div>
          )}

          {/* Results Grid */}
          {!isLoading && rounds && rounds.length > 0 && (
            <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedRounds.map((round: any) => (
                <RoundCard key={round.id} round={round} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && (!rounds || rounds.length === 0) && (
            <div ref={gridRef} className="text-center py-16">
              <div className="w-20 h-20 bg-[#A2D5C6]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Rocket className="h-10 w-10 text-[#A2D5C6]/40" />
              </div>
              <p className="text-[#F6F6F6]/60 text-lg mb-2">
                No fundraising rounds yet.
              </p>
              <p className="text-[#F6F6F6]/40 text-sm">
                Be the first to create a fundraising round as a founder!
              </p>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex justify-center mt-10">
              <div className="flex items-center gap-2">
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

      {/* AI Chat */}
      <AIChat rounds={rounds || []} />
    </Layout>
  );
}
