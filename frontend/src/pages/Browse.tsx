import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Layout from '@/components/layout/Layout';
import RoundCard from '@/components/campaigns/RoundCard';
import AIChat from '@/components/ai/AIChat';
import { useRounds, type Round } from '@/hooks/usePonderData';
import { useAI } from '@/components/ai/AIContext';
import { ChevronLeft, ChevronRight, Loader2, WifiOff, Rocket, Scale, X, Check } from 'lucide-react';

const ITEMS_PER_PAGE = 6;

export default function Browse() {
  const [currentPage, setCurrentPage] = useState(1);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedRounds, setSelectedRounds] = useState<Round[]>([]);

  // Fetch real data from Ponder
  const { data: rounds, isLoading, error } = useRounds();

  // AI context for comparison
  const { openWithComparison } = useAI();

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

  // Toggle round selection for comparison
  const toggleRoundSelection = (round: Round) => {
    setSelectedRounds(prev => {
      const isSelected = prev.some(r => r.id === round.id);
      if (isSelected) {
        return prev.filter(r => r.id !== round.id);
      } else {
        // Limit to 4 rounds for comparison
        if (prev.length >= 4) return prev;
        return [...prev, round];
      }
    });
  };

  // Check if a round is selected
  const isRoundSelected = (roundId: string) => {
    return selectedRounds.some(r => r.id === roundId);
  };

  // Handle compare action
  const handleCompare = () => {
    if (selectedRounds.length >= 2) {
      openWithComparison(selectedRounds);
      setCompareMode(false);
      setSelectedRounds([]);
    }
  };

  // Exit compare mode
  const exitCompareMode = () => {
    setCompareMode(false);
    setSelectedRounds([]);
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

            {/* Compare Mode Toggle */}
            {!isLoading && rounds && rounds.length >= 2 && (
              <div className="mt-6">
                {!compareMode ? (
                  <button
                    onClick={() => setCompareMode(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors text-sm"
                  >
                    <Scale className="h-4 w-4" />
                    Compare Rounds
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#4988C4]/20 text-white rounded-xl">
                    <Scale className="h-4 w-4 text-[#4988C4]" />
                    <span className="text-sm">Select 2-4 rounds to compare</span>
                    <button
                      onClick={exitCompareMode}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Compare Bar - Fixed at bottom when rounds are selected */}
          {compareMode && selectedRounds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1a1a1a] border border-white/10 rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-4">
              <div className="flex items-center gap-2">
                {selectedRounds.map((round) => (
                  <div
                    key={round.id}
                    className="flex items-center gap-2 bg-[#4988C4]/20 px-3 py-1.5 rounded-lg"
                  >
                    <span className="text-sm text-white font-medium">
                      {round.companyName || round.id.slice(0, 8)}
                    </span>
                    <button
                      onClick={() => toggleRoundSelection(round)}
                      className="p-0.5 hover:bg-white/10 rounded transition-colors"
                    >
                      <X className="h-3 w-3 text-white/60" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="h-8 w-px bg-white/10" />
              <span className="text-sm text-white/60">
                {selectedRounds.length}/4 selected
              </span>
              <button
                onClick={handleCompare}
                disabled={selectedRounds.length < 2}
                className="px-4 py-2 bg-[#4988C4] text-black font-semibold rounded-xl hover:bg-[#1C4D8D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Scale className="h-4 w-4" />
                Compare with AI
              </button>
            </div>
          )}

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
              <Loader2 className="h-12 w-12 animate-spin text-[#4988C4] mb-4" />
              <p className="text-white/60">Loading rounds from indexer...</p>
            </div>
          )}

          {/* Results Grid */}
          {!isLoading && rounds && rounds.length > 0 && (
            <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedRounds.map((round: any) => (
                <div key={round.id} className="relative">
                  {compareMode && (
                    <button
                      onClick={() => toggleRoundSelection(round)}
                      className={`absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        isRoundSelected(round.id)
                          ? 'bg-[#4988C4] border-[#4988C4] text-black'
                          : 'bg-[#1a1a1a] border-white/30 text-white/60 hover:border-[#4988C4] hover:text-[#4988C4]'
                      }`}
                    >
                      {isRoundSelected(round.id) ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <span className="text-xs font-medium">{selectedRounds.length + 1}</span>
                      )}
                    </button>
                  )}
                  <div
                    className={`transition-all duration-200 ${
                      compareMode
                        ? isRoundSelected(round.id)
                          ? 'ring-2 ring-[#4988C4] rounded-2xl'
                          : 'cursor-pointer hover:ring-2 hover:ring-white/20 rounded-2xl'
                        : ''
                    }`}
                    onClick={compareMode ? () => toggleRoundSelection(round) : undefined}
                  >
                    <RoundCard round={round} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && (!rounds || rounds.length === 0) && (
            <div ref={gridRef} className="text-center py-16">
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
                      : 'text-white/60 hover:text-white hover:bg-[#4988C4]/20'
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
                          ? 'bg-[#4988C4] text-black'
                          : 'text-white/60 hover:text-white hover:bg-[#4988C4]/20'
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
                      : 'text-white/60 hover:text-white hover:bg-[#4988C4]/20'
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
