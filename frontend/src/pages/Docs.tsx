import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);
import {
  ArrowUpRight,
} from 'lucide-react';

// Documentation sections configuration
const docSections = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'getting-started', title: 'Getting Started' },
  { id: 'fundamentals', title: 'Fundamentals' },
  { id: 'for-founders', title: 'For Founders' },
  { id: 'for-investors', title: 'For Investors' },
  { id: 'technical', title: 'Technical' },
  { id: 'smart-contracts', title: 'Smart Contracts' },
  { id: 'zk-identity', title: 'ZK Identity' },
  { id: 'security', title: 'Security' },
];

export default function Docs() {
  const [activeSection, setActiveSection] = useState('introduction');
  const location = useLocation();
  const navigate = useNavigate();

  // Animation refs
  const sidebarRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const sectionsRef = useRef<HTMLDivElement>(null);

  // Entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Get elements
      const navItems = navRef.current?.querySelectorAll('li') || [];
      const sectionCards = sectionsRef.current?.querySelectorAll('section') || [];

      // Initial states
      gsap.set(sidebarRef.current, { x: -100, opacity: 0 });
      gsap.set(logoRef.current, { scale: 0.8, opacity: 0 });
      gsap.set(navItems, { x: -30, opacity: 0 });

      // Sidebar entrance
      tl.to(sidebarRef.current, {
        x: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out'
      });

      // Logo pop in
      tl.to(logoRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        ease: 'back.out(1.7)'
      }, '-=0.3');

      // Nav items stagger in
      tl.to(navItems, {
        x: 0,
        opacity: 1,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power2.out'
      }, '-=0.2');

      // Scroll-triggered animations for each section
      sectionCards.forEach((section) => {
        // Get inner content elements
        const card = section.querySelector('div');
        const heading = section.querySelector('h1');
        const paragraphs = section.querySelectorAll('p');
        const innerCards = section.querySelectorAll('.rounded-xl');

        // Set initial states
        gsap.set(section, { opacity: 0, y: 80 });

        // Create scroll trigger for each section
        ScrollTrigger.create({
          trigger: section,
          start: 'top 85%',
          onEnter: () => {
            // Main section animation
            gsap.to(section, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: 'power3.out'
            });

            // Stagger inner cards if they exist
            if (innerCards.length > 0) {
              gsap.fromTo(innerCards,
                { opacity: 0, y: 30 },
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.5,
                  stagger: 0.08,
                  ease: 'power2.out',
                  delay: 0.2
                }
              );
            }
          },
          once: true
        });
      });
    });

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  // Handle scroll to update active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = docSections.map((s) => ({
        id: s.id,
        element: document.getElementById(s.id),
      }));

      for (const section of sections) {
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle hash navigation
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && docSections.find((s) => s.id === hash)) {
      setActiveSection(hash);
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location.hash]);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    navigate(`#${sectionId}`, { replace: true });
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#000000]">
      {/* Fixed Left Sidebar */}
      <aside
        ref={sidebarRef}
        className="fixed left-0 top-0 h-screen w-64 border-r border-[#1F1F1F] bg-[#000000]/80 backdrop-blur-lg z-40 overflow-y-auto"
      >
        <div className="p-6">
          {/* Logo / Home Link */}
          <Link
            ref={logoRef}
            to="/"
            className="flex items-center mb-8"
          >
            <img src="/fndr.png" alt="fndr" className="h-24" />
          </Link>

          {/* Navigation */}
          <nav ref={navRef}>
            <p className="text-xs font-semibold text-[#F6F6F6]/40 uppercase tracking-wider mb-4">
              Contents
            </p>
            <ul className="space-y-1">
              {docSections.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <li key={section.id}>
                    <button
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-[#A2D5C6]/20 text-[#A2D5C6] border-l-2 border-[#A2D5C6]'
                          : 'text-[#F6F6F6]/60 hover:text-white hover:bg-[#1A1A1A]'
                      }`}
                    >
                      <span>{section.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Back to App */}
          <div className="mt-8 pt-6 border-t border-[#1F1F1F]">
            <Link
              to="/browse"
              className="flex items-center gap-2 text-sm text-[#A2D5C6] hover:text-[#CFFFE2] transition-colors"
            >
              <ArrowUpRight className="h-4 w-4" />
              Launch App
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 min-h-screen">
        <div ref={sectionsRef} className="max-w-4xl mx-auto px-8 py-12">

          {/* Introduction Section */}
          <section id="introduction" className="mb-16 scroll-mt-8">
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <h1 className="text-3xl font-bold text-white">Introduction</h1>
              </div>

              <p className="text-lg text-[#F6F6F6]/60 mb-8">
                Welcome to <strong className="text-white">fndr</strong>, the decentralized startup fundraising platform built on Mantle blockchain that transforms how startups raise capital and how investors grow their wealth.
              </p>

              <div className="space-y-8">
                {/* Problems for Founders */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-semibold text-[#A2D5C6]">Problems for Founders</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                      <h3 className="font-semibold text-white mb-2">1. Slow Fundraising Process</h3>
                      <p className="text-[#F6F6F6]/60">
                        Traditional fundraising takes months of meetings, negotiations, and paperwork. Founders spend more time raising than building their product.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                      <h3 className="font-semibold text-white mb-2">2. High Legal & Admin Costs</h3>
                      <p className="text-[#F6F6F6]/60">
                        Lawyers, accountants, cap table management - traditional equity issuance costs tens of thousands in legal fees alone.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                      <h3 className="font-semibold text-white mb-2">3. Limited Investor Access</h3>
                      <p className="text-[#F6F6F6]/60">
                        Geographic restrictions and accreditation requirements limit who can invest, reducing the pool of potential backers.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Problems for Investors */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-xl font-semibold text-[#A2D5C6]">Problems for Investors</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                      <h3 className="font-semibold text-white mb-2">1. Idle Capital</h3>
                      <p className="text-[#F6F6F6]/60">
                        When you invest in a startup, your money sits in a bank account earning nothing while waiting to be deployed. Zero returns during the wait.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                      <h3 className="font-semibold text-white mb-2">2. No Liquidity</h3>
                      <p className="text-[#F6F6F6]/60">
                        Once invested, your money is locked for 7-10 years. You can't exit until acquisition or IPO - which might never happen.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                      <h3 className="font-semibold text-white mb-2">3. Complex Compliance</h3>
                      <p className="text-[#F6F6F6]/60">
                        Selling private equity involves expensive lawyers, regulatory filings, and months of paperwork. Most small investors are priced out entirely.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Getting Started Section */}
          <section id="getting-started" className="mb-16 scroll-mt-8">
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <h1 className="text-3xl font-bold text-white">Getting Started</h1>
              </div>

              <p className="text-lg text-[#F6F6F6]/60 mb-8">
                Get up and running with fndr in just a few minutes.
              </p>

              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                  <h3 className="font-semibold text-white mb-2">1. Connect Your Wallet</h3>
                  <p className="text-[#F6F6F6]/60 mb-4">
                    You need a Web3 wallet like MetaMask. Click "Connect Wallet" in the navbar.
                  </p>
                  <div className="p-4 rounded-xl bg-[#0A0A0A]">
                    <p className="text-sm font-mono text-[#F6F6F6]/60">
                      <span className="text-[#A2D5C6]">Network:</span> Mantle Sepolia<br />
                      <span className="text-[#A2D5C6]">Chain ID:</span> 5003<br />
                      <span className="text-[#A2D5C6]">RPC:</span> https://rpc.sepolia.mantle.xyz
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                  <h3 className="font-semibold text-white mb-2">2. Verify Your Identity</h3>
                  <p className="text-[#F6F6F6]/60 mb-4">
                    Complete ZK-Passport verification to prove you're a real person without revealing personal information.
                  </p>
                  <ul className="list-disc list-inside text-[#F6F6F6]/60 space-y-1 text-sm">
                    <li>Click "Identity" button in the navbar</li>
                    <li>Scan your passport using ZKPassport app</li>
                    <li>Your unique identifier is stored on-chain (privacy-preserved)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                  <h3 className="font-semibold text-white mb-2">3. Choose Your Role</h3>
                  <p className="text-[#F6F6F6]/60 mb-4">
                    Select whether you want to be a Founder or an Investor.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-[#A2D5C6]/10 border border-[#A2D5C6]/20">
                      <p className="font-medium text-[#A2D5C6]">Founder</p>
                      <p className="text-sm text-[#F6F6F6]/40">Create funding rounds</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#A2D5C6]/10 border border-[#A2D5C6]/20">
                      <p className="font-medium text-[#A2D5C6]">Investor</p>
                      <p className="text-sm text-[#F6F6F6]/40">Invest and earn yield</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                  <h3 className="font-semibold text-white mb-2">4. Get Test USDC</h3>
                  <p className="text-[#F6F6F6]/60 mb-2">
                    On testnet, claim free USDC via the Faucet button.
                  </p>
                  <p className="text-sm text-[#A2D5C6]">Airdrop: 1,000 USDC (one-time)</p>
                </div>
              </div>
            </div>
          </section>

          {/* Fundamentals Section */}
          <section id="fundamentals" className="mb-16 scroll-mt-8">
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <h1 className="text-3xl font-bold text-white">Fundamentals</h1>
              </div>

              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-[#A2D5C6]">How Yield Generation Works</h2>
                  <div className="p-6 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                    <div className="grid grid-cols-3 gap-4 text-center mb-6">
                      <div>
                        <p className="text-2xl font-bold text-[#CFFFE2]">$100K</p>
                        <p className="text-sm text-[#F6F6F6]/40">Investment</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[#CFFFE2]">6% APY</p>
                        <p className="text-sm text-[#F6F6F6]/40">Yield Rate</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[#CFFFE2]">$500/mo</p>
                        <p className="text-sm text-[#F6F6F6]/40">Monthly Yield</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-[#0A0A0A]">
                      <p className="text-sm text-[#F6F6F6]/60">
                        <strong className="text-white">50/50 Split:</strong> $250 to founder for operations, $250 distributed to investors proportionally.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4 text-[#A2D5C6]">Tokenized Equity</h2>
                  <p className="text-[#F6F6F6]/60 mb-4">
                    When you invest, you receive equity tokens representing your ownership stake.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#2A2A2A]">
                          <th className="text-left p-3 font-semibold text-white">Traditional</th>
                          <th className="text-left p-3 font-semibold text-[#A2D5C6]">fndr Tokens</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#F6F6F6]/60">
                        <tr className="border-b border-[#1F1F1F]">
                          <td className="p-3">Paper certificates</td>
                          <td className="p-3 text-[#A2D5C6]">ERC-20 tokens</td>
                        </tr>
                        <tr className="border-b border-[#1F1F1F]">
                          <td className="p-3">Hard to transfer</td>
                          <td className="p-3 text-[#A2D5C6]">Tradeable after 180 days</td>
                        </tr>
                        <tr className="border-b border-[#1F1F1F]">
                          <td className="p-3">No yield</td>
                          <td className="p-3 text-[#A2D5C6]">6% APY from day one</td>
                        </tr>
                        <tr>
                          <td className="p-3">Company records</td>
                          <td className="p-3 text-[#A2D5C6]">Blockchain verified</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4 text-[#A2D5C6]">Investment Lifecycle</h2>
                  <div className="space-y-4">
                    {[
                      { num: '1', title: 'Fundraising', desc: 'Invest USDC, receive equity tokens, funds go to yield vault' },
                      { num: '2', title: 'Yield Accumulation', desc: 'Yield accrues daily. Claim anytime. Founders withdraw up to 2%/month' },
                      { num: '3', title: 'Holding Period', desc: '180 days lock for compliance. You still earn yield' },
                      { num: '4', title: 'Secondary Trading', desc: 'Trade tokens on marketplace at any price' },
                    ].map((step) => (
                      <div key={step.num} className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#A2D5C6] flex items-center justify-center flex-shrink-0 text-sm font-bold text-black">
                          {step.num}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{step.title}</h3>
                          <p className="text-[#F6F6F6]/60 text-sm">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* For Founders Section */}
          <section id="for-founders" className="mb-16 scroll-mt-8">
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <h1 className="text-3xl font-bold text-white">For Founders</h1>
              </div>

              <p className="text-lg text-[#F6F6F6]/60 mb-8">
                Raise capital faster with automated compliance and give your investors yield from day one.
              </p>

              <div className="space-y-8">
                {/* Solutions for Founders */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-[#A2D5C6]">How fndr Solves Your Problems</h2>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                      <h3 className="font-semibold text-white mb-2">1. Launch in Minutes, Not Months</h3>
                      <p className="text-[#F6F6F6]/60">
                        Create a funding round in one transaction. Set your terms, upload your pitch, and start accepting investments immediately. No lawyers required.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                      <h3 className="font-semibold text-white mb-2">2. Near-Zero Overhead</h3>
                      <p className="text-[#F6F6F6]/60">
                        Just <strong className="text-[#A2D5C6]">10 USDC</strong> to create a round + <strong className="text-[#A2D5C6]">0.5%</strong> success fee. Smart contracts handle cap table, compliance, and distributions automatically.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                      <h3 className="font-semibold text-white mb-2">3. Global Investor Access</h3>
                      <p className="text-[#F6F6F6]/60">
                        Anyone with a valid passport can invest through ZK-Passport verification. Access capital from worldwide investors without geographic barriers.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                      <h3 className="font-semibold text-white mb-2">4. Yield While You Build</h3>
                      <p className="text-[#F6F6F6]/60">
                        Your raised capital earns <strong className="text-[#A2D5C6]">6% APY</strong> in the vault. You receive 50% of yield monthly - additional runway without diluting equity.
                      </p>
                    </div>
                  </div>
                </div>

                {/* How to Create Round */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-[#A2D5C6]">Creating a Funding Round</h2>
                  <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                    <ul className="space-y-3">
                      {[
                        { label: 'Target Raise', desc: 'How much USDC (e.g., $500,000)' },
                        { label: 'Equity %', desc: 'What % of company you offer (e.g., 10%)' },
                        { label: 'Token Price', desc: 'Price per equity token (determines valuation)' },
                        { label: 'Deadline', desc: 'When the round closes' },
                      ].map((item) => (
                        <li key={item.label} className="flex items-start gap-3">
                          <span className="text-[#A2D5C6]">•</span>
                          <div>
                            <strong className="text-white">{item.label}</strong>
                            <p className="text-sm text-[#F6F6F6]/60">{item.desc}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Withdrawals */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-[#A2D5C6]">Withdrawing Funds</h2>
                  <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                    <p className="text-[#F6F6F6]/60">
                      <strong className="text-yellow-400">Important:</strong> You can withdraw up to <strong className="text-white">2% of vault balance per month</strong>. This limit is immutable and protects investors.
                    </p>
                  </div>
                  <div className="mt-3 p-3 rounded-xl bg-[#0A0A0A]">
                    <p className="text-sm text-[#F6F6F6]/40">
                      Example: $100K raised = $2K/month withdrawal + ~$250/month yield share
                    </p>
                  </div>
                </div>

                {/* Fees */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-[#A2D5C6]">Platform Fees</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                      <p className="text-2xl font-bold text-[#A2D5C6]">10 USDC</p>
                      <p className="text-sm text-[#F6F6F6]/40">Round Creation</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                      <p className="text-2xl font-bold text-[#A2D5C6]">0.5%</p>
                      <p className="text-sm text-[#F6F6F6]/40">Success Fee</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* For Investors Section */}
          <section id="for-investors" className="mb-16 scroll-mt-8">
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <h1 className="text-3xl font-bold text-white">For Investors</h1>
              </div>

              <p className="text-lg text-[#F6F6F6]/60 mb-8">
                Invest in startups you believe in while earning passive yield from day one.
              </p>

              <div className="space-y-8">
                {/* Solutions for Investors */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-[#A2D5C6]">How fndr Solves Your Problems</h2>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                      <h3 className="font-semibold text-white mb-2">1. Yield-Enhanced Capital</h3>
                      <p className="text-[#F6F6F6]/60">
                        Every dollar invested immediately earns <strong className="text-white">6% APY</strong>. Your capital works for you from day one - no more idle money sitting in a bank account.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                      <h3 className="font-semibold text-white mb-2">2. Built-in Liquidity</h3>
                      <p className="text-[#F6F6F6]/60">
                        After 180 days, trade your equity tokens on the secondary market. Exit whenever you want at any price - no more waiting 7-10 years.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                      <h3 className="font-semibold text-white mb-2">3. Automated Compliance</h3>
                      <p className="text-[#F6F6F6]/60">
                        ZK-Passport verification and smart contract transfer restrictions handle all regulatory requirements automatically. No lawyers needed.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                      <h3 className="font-semibold text-white mb-2">4. Transparent Ownership</h3>
                      <p className="text-[#F6F6F6]/60">
                        Your equity tokens are on-chain and verifiable. No disputes about cap tables or ownership - the blockchain is the source of truth.
                      </p>
                    </div>
                  </div>
                </div>

                {/* How to Invest */}
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-[#A2D5C6]">How to Invest</h2>
                  <ol className="space-y-4">
                    {[
                      { title: 'Browse rounds', desc: 'Review pitch decks and metrics. AI can help analyze.' },
                      { title: 'Approve USDC', desc: 'Allow the contract to transfer your USDC.' },
                      { title: 'Invest', desc: 'USDC goes to vault, you receive equity tokens.' },
                      { title: 'Claim yield', desc: 'Your share accrues automatically. Claim anytime.' },
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-4">
                        <span className="w-6 h-6 rounded-full bg-[#A2D5C6] flex items-center justify-center flex-shrink-0 text-xs font-bold text-black">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-medium text-white">{step.title}</p>
                          <p className="text-sm text-[#F6F6F6]/60">{step.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4 text-[#A2D5C6]">Your Returns</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#A2D5C6]/10 border border-[#A2D5C6]/20">
                      <h3 className="font-semibold text-[#A2D5C6] mb-2">Yield Returns</h3>
                      <p className="text-sm text-[#F6F6F6]/60">
                        3% APY (your 50% share)
                        <br /><strong className="text-white">$10K invested = ~$25/month</strong>
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                      <h3 className="font-semibold text-white mb-2">Equity Upside</h3>
                      <p className="text-sm text-[#F6F6F6]/60">
                        If startup succeeds, tokens could be worth multiples.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4 text-[#A2D5C6]">Secondary Trading</h2>
                  <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                    <p className="text-[#F6F6F6]/60 mb-3">After 180-day holding period:</p>
                    <ul className="space-y-2 text-[#F6F6F6]/60 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="text-[#A2D5C6]">•</span>
                        Create sell orders at your price
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#A2D5C6]">•</span>
                        Buy from others to increase position
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#A2D5C6]">•</span>
                        0.25% trading fee per transaction
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Technical Architecture Section */}
          <section id="technical" className="mb-16 scroll-mt-8">
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <h1 className="text-3xl font-bold text-[#A2D5C6]">Technical Architecture</h1>
              </div>

              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-[#A2D5C6]">System Overview</h2>
                  <div className="p-4 rounded-xl bg-[#0A0A0A] font-mono text-sm overflow-x-auto">
                    <pre className="text-[#F6F6F6]/60">{`Frontend (React)  →  Backend (Ponder)  →  Blockchain (Mantle)
      │                      │                      │
   Wagmi              GraphQL API           Smart Contracts
RainbowKit              AI/LLM                 Foundry`}</pre>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4 text-[#A2D5C6]">Tech Stack</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { layer: 'Frontend', tech: 'React, Vite, TypeScript, Tailwind' },
                      { layer: 'Web3', tech: 'Wagmi, Viem, RainbowKit' },
                      { layer: 'Backend', tech: 'Ponder, Hono, GraphQL' },
                      { layer: 'AI', tech: 'Groq (Llama 3.3 70B)' },
                      { layer: 'Contracts', tech: 'Solidity, Foundry' },
                      { layer: 'Storage', tech: 'IPFS (Pinata)' },
                      { layer: 'Identity', tech: 'ZKPassport, Circom' },
                    ].map((item) => (
                      <div key={item.layer} className="p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                        <p className="font-medium text-[#A2D5C6] text-sm">{item.layer}</p>
                        <p className="text-xs text-[#F6F6F6]/40">{item.tech}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Smart Contracts Section */}
          <section id="smart-contracts" className="mb-16 scroll-mt-8">
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <h1 className="text-3xl font-bold text-white">Smart Contracts</h1>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-[#A2D5C6]">Contract Addresses</h2>
                  <div className="space-y-3">
                    {[
                      { name: 'MockUSDC', address: '0xc6C927c77D9BFaFb7b9e003db6D96F3605ba2514', desc: 'Test stablecoin' },
                      { name: 'MockVault', address: '0xE8163650f9e5bdAcd1e449f2fB70a5677bbA62ED', desc: '6% APY vault' },
                      { name: 'FndrIdentity', address: '0x342F7e47E9F62cf1f0f1E0e62c9F7F641de114DE', desc: 'ZK verification' },
                      { name: 'RoundFactory', address: '0x9D05244Bf4D091734da61e21396c74Cd92346E6f', desc: 'Deploys rounds' },
                      { name: 'SecondaryMarket', address: '0x7fB1E1C25F47acf921d9d89480586111dEf65CBb', desc: 'Token trading' },
                    ].map((contract) => (
                      <div key={contract.name} className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-white">{contract.name}</span>
                          <span className="text-xs text-[#F6F6F6]/40">{contract.desc}</span>
                        </div>
                        <code className="text-xs text-[#A2D5C6] break-all">{contract.address}</code>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4 text-[#A2D5C6]">Contract Flow</h2>
                  <div className="p-4 rounded-xl bg-[#0A0A0A] font-mono text-sm overflow-x-auto">
                    <pre className="text-[#F6F6F6]/60">{`RoundFactory
    ├── creates → RoundManager (per startup)
    │                 ├── creates → StartupEquityToken
    │                 └── deposits → MockVault (6% APY)
    └── requires → FndrIdentity (verification)

SecondaryMarket → trades → StartupEquityToken`}</pre>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ZK Identity Section */}
          <section id="zk-identity" className="mb-16 scroll-mt-8">
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <h1 className="text-3xl font-bold text-white">ZK Identity</h1>
              </div>

              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-[#A2D5C6]">What is ZK-Passport?</h2>
                  <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                    <p className="text-[#F6F6F6]/60 mb-4">
                      Zero-knowledge proofs verify your passport is real without revealing personal info.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-xl bg-[#0A0A0A]">
                        <p className="font-medium text-[#A2D5C6]">What's Proven</p>
                        <p className="text-sm text-[#F6F6F6]/40">Valid passport from accepted country</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#0A0A0A]">
                        <p className="font-medium text-red-400">What's Hidden</p>
                        <p className="text-sm text-[#F6F6F6]/40">Name, photo, DOB, passport number</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4 text-[#A2D5C6]">Why ZK Proofs Matter</h2>
                  <div className="space-y-3">
                    {[
                      { title: 'Sybil Resistance', desc: 'One passport = one account. No fake accounts.' },
                      { title: 'Privacy', desc: 'Your investments aren\'t linked to real identity.' },
                      { title: 'Compliance', desc: 'Proves users are real without centralized KYC.' },
                    ].map((item) => (
                      <div key={item.title} className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                        <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                        <p className="text-sm text-[#F6F6F6]/60">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4 text-[#A2D5C6]">ZK Circuits (Built)</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'Commitment', purpose: 'Hide investment amounts', status: 'Built' },
                      { name: 'Membership', purpose: 'Prove investor status anonymously', status: 'Built' },
                      { name: 'MinInvestment', purpose: 'Prove threshold privately', status: 'Built' },
                      { name: 'Claim', purpose: 'Claim tokens with proof', status: 'Built' },
                    ].map((circuit) => (
                      <div key={circuit.name} className="p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-white">{circuit.name}</span>
                          <span className="text-xs text-yellow-400">{circuit.status}</span>
                        </div>
                        <p className="text-xs text-[#F6F6F6]/40">{circuit.purpose}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Security Section */}
          <section id="security" className="mb-16 scroll-mt-8">
            <div className="bg-[#A2D5C6]/10 backdrop-blur-md rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <h1 className="text-3xl font-bold text-white">Security</h1>
              </div>

              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-[#A2D5C6]">Investor Protections</h2>
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                      <h3 className="font-semibold text-white mb-2">2% Monthly Withdrawal Limit</h3>
                      <p className="text-sm text-[#F6F6F6]/60">
                        <strong className="text-white">Immutable</strong> - Founders cannot drain funds quickly.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                      <h3 className="font-semibold text-white mb-2">Round Isolation</h3>
                      <p className="text-sm text-[#F6F6F6]/60">
                        Each startup has its own contracts. No shared pools.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                      <h3 className="font-semibold text-white mb-2">180-Day Holding</h3>
                      <p className="text-sm text-[#F6F6F6]/60">
                        Prevents pump-and-dump schemes.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4 text-[#A2D5C6]">Risk Warnings</h2>
                  <div className="p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
                    <h3 className="font-semibold text-red-400 mb-3">Important Disclaimers</h3>
                    <ul className="space-y-2 text-sm text-[#F6F6F6]/60">
                      <li className="flex items-start gap-2">
                        <span className="text-red-400">•</span>
                        <span>Startup investing is high-risk. You may lose everything.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400">•</span>
                        <span>Smart contracts are not audited (testnet phase).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400">•</span>
                        <span>6% APY is from mock vault. Real yield may vary.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-400">•</span>
                        <span>This is not financial advice. DYOR.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-[#1F1F1F] pt-8 mt-16">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#F6F6F6]/40">
                Built for the decentralized future of startup funding.
              </p>
              <Link
                to="/browse"
                className="flex items-center gap-2 px-4 py-2 bg-[#A2D5C6] text-black font-semibold rounded-xl hover:bg-[#CFFFE2] transition-colors text-sm"
              >
                Launch App
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
