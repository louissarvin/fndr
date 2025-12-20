# Fndr Frontend Design Specification V2

```json
{
  "designPhilosophy": {
    "brandPhilosophy": {
      "core": "Yield-Enhanced Innovation",
      "personality": ["modern", "trustworthy", "innovative", "accessible"],
      "tone": "Professional yet approachable - making DeFi fundraising feel safe and exciting",
      "uniqueValue": "First platform where investment capital immediately works for everyone"
    },
    "visualDirection": {
      "style": "Neo-brutalism meets Web3",
      "feeling": "Confident, transparent, growth-focused",
      "inspiration": ["Linear.app", "Stripe.com", "Uniswap", "Framer.com"]
    }
  },
  
  "colorSystem": {
    "primary": {
      "main": "#6366F1",
      "light": "#A5B4FC",
      "dark": "#4338CA",
      "gradient": "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
    },
    "accent": {
      "yield": "#10B981",
      "warning": "#F59E0B",
      "success": "#059669",
      "error": "#DC2626"
    },
    "neutral": {
      "bg": "#FAFAFA",
      "surface": "#FFFFFF",
      "border": "#E5E7EB",
      "text": {
        "primary": "#111827",
        "secondary": "#6B7280",
        "muted": "#9CA3AF"
      }
    },
    "web3": {
      "ethereum": "#627EEA",
      "wallet": "#FF6B35",
      "defi": "#1CFFCE"
    }
  },
  
  "typography": {
    "fontStack": {
      "primary": "Inter, system-ui, -apple-system, sans-serif",
      "mono": "JetBrains Mono, Consolas, monospace",
      "display": "Cal Sans, Inter, sans-serif"
    },
    "scale": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "hero": "3.5rem"
    },
    "weights": {
      "regular": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    }
  },
  
  "componentLibrary": {
    "buttons": {
      "primary": {
        "style": "Solid background, rounded-lg, medium padding",
        "states": ["default", "hover", "active", "loading", "disabled"],
        "variants": ["small", "medium", "large", "full-width"],
        "animations": "Subtle scale on hover, loading spinner"
      },
      "secondary": {
        "style": "Border + transparent bg, same rounding",
        "interactions": "Hover fills with primary color"
      },
      "web3Connect": {
        "style": "Special wallet connection styling",
        "features": ["wallet icon", "connection status", "network indicator"]
      }
    },
    "cards": {
      "campaignCard": {
        "layout": "Image → Title → Progress → Stats → CTA",
        "features": [
          "Yield APY badge (prominent)",
          "Funding progress bar",
          "Live investor count",
          "Days remaining countdown",
          "Founder verification badge"
        ],
        "animations": "Gentle hover lift, progress bar fills"
      },
      "statsCard": {
        "variants": ["yield-focused", "funding-focused", "performance-focused"],
        "features": ["Large number display", "Trend indicators", "Sparkline charts"]
      }
    },
    "inputs": {
      "amountInput": {
        "features": ["USD/Token toggle", "Max button", "Real-time validation"],
        "styling": "Clean, prominent borders, clear labels"
      },
      "searchBar": {
        "features": ["Instant search", "Filter tags", "Clear button"],
        "placement": "Hero section, persistent in browse"
      }
    }
  },
  
  "pageLayouts": {
    "homepage": {
      "hero": {
        "layout": "Split-screen with 3D visualization",
        "leftSide": {
          "headline": "Startup Capital That Works 24/7",
          "subheadline": "First fundraising platform where investments immediately generate 6% APY for everyone",
          "cta": ["Browse Startups", "Create Campaign"],
          "trustIndicators": ["$XX raised", "XX startups funded", "6% guaranteed yield"]
        },
        "rightSide": {
          "visual": "3D animated yield vault visualization",
          "elements": ["Floating coins", "Growth charts", "Yield counter"]
        }
      },
      "valueProps": {
        "section1": {
          "title": "How It Works",
          "cards": [
            {
              "title": "Invest in Startups",
              "description": "Browse verified startups, invest with USDC",
              "icon": "💼",
              "visual": "Investment flow animation"
            },
            {
              "title": "Earn 6% APY",
              "description": "Capital immediately generates yield in secure vaults",
              "icon": "📈",
              "visual": "Yield counter animation"
            },
            {
              "title": "Trade on Secondary",
              "description": "Liquid equity markets after 180-day holding period",
              "icon": "🔄",
              "visual": "Trading interface preview"
            }
          ]
        }
      },
      "featuredCampaigns": {
        "title": "Featured Startups",
        "layout": "Horizontal scroll cards",
        "filters": ["All", "AI/ML", "FinTech", "Web3", "HealthTech"]
      }
    },
    "browsePage": {
      "layout": "Filter sidebar + Card grid",
      "filters": {
        "categories": ["Industry", "Funding Stage", "Min Investment", "Yield Rate"],
        "advanced": ["Verification Status", "Days Remaining", "Progress"]
      },
      "sorting": ["Most Popular", "Highest Yield", "Ending Soon", "Recently Added"],
      "cardGrid": {
        "responsive": "1-4 columns based on screen size",
        "loadMore": "Infinite scroll or pagination"
      }
    },
    "campaignDetail": {
      "layout": "Hero + Tab interface",
      "hero": {
        "left": "Campaign media (images/video)",
        "right": "Investment panel with live stats"
      },
      "investmentPanel": {
        "components": [
          "Current progress bar",
          "Live yield calculator",
          "Investment amount input",
          "Expected returns breakdown",
          "Invest button (Web3 connect if needed)"
        ]
      },
      "tabs": ["Overview", "Team", "Financials", "Use of Funds", "Updates", "Community"]
    }
  },
  
  "dashboardSpecs": {
    "investorDashboard": {
      "overview": {
        "stats": [
          {
            "title": "Total Invested",
            "value": "$XX,XXX",
            "trend": "+XX% this month",
            "visual": "Investment breakdown chart"
          },
          {
            "title": "Total Yield Earned",
            "value": "$XXX",
            "trend": "+$XX this week",
            "visual": "Yield accumulation chart"
          },
          {
            "title": "Portfolio Value",
            "value": "$XX,XXX",
            "trend": "+XX% total return",
            "visual": "Portfolio performance chart"
          }
        ]
      },
      "portfolio": {
        "layout": "Table + Card views toggle",
        "columns": ["Company", "Invested", "Current Value", "Yield Earned", "Actions"],
        "actions": ["Claim Yield", "View Details", "Sell on Market"]
      },
      "yieldCenter": {
        "title": "Yield Management",
        "features": [
          "Claimable yield counter",
          "Yield history chart",
          "Auto-compound toggle",
          "Claim all button"
        ]
      }
    },
    "founderDashboard": {
      "campaignOverview": {
        "kpis": [
          "Funds Raised vs Target",
          "Active Investors Count",
          "Yield Generated for Community",
          "Available for Withdrawal"
        ]
      },
      "fundManagement": {
        "withdrawalSection": {
          "currentLimit": "Monthly 2% limit visualization",
          "availableAmount": "Large, prominent number",
          "withdrawHistory": "Timeline of past withdrawals",
          "withdrawButton": "Disabled/enabled based on limits"
        }
      }
    }
  },
  
  "web3Integration": {
    "walletConnection": {
      "connectFlow": {
        "trigger": "Any investment or campaign creation action",
        "modal": {
          "title": "Connect Your Wallet",
          "options": [
            {
              "name": "MetaMask",
              "description": "Connect using browser wallet",
              "status": "detected/not_detected"
            },
            {
              "name": "WalletConnect",
              "description": "Connect with mobile wallet",
              "icon": "QR code"
            },
            {
              "name": "Coinbase Wallet",
              "description": "Connect using Coinbase",
              "status": "available"
            }
          ]
        }
      },
      "connectedState": {
        "display": "Address + ENS name (if available)",
        "menu": ["View Portfolio", "Switch Network", "Disconnect"],
        "networkIndicator": "Ethereum mainnet status"
      }
    },
    "transactionFlows": {
      "investment": {
        "steps": [
          "Amount input with live USD conversion",
          "USDC allowance approval (if needed)",
          "Investment transaction confirmation",
          "Success state with transaction link"
        ],
        "loadingStates": "Clear progress indicators for each step"
      },
      "yieldClaim": {
        "preview": "Shows claimable amount before transaction",
        "oneClick": "Single transaction to claim all yield",
        "confirmation": "Success with updated balance"
      }
    }
  },
  
  "threeDAnimations": {
    "3dVisualizations": {
      "heroYieldVault": {
        "concept": "Floating 3D vault with coins flowing in/out",
        "technology": "Three.js or React-Three-Fiber",
        "elements": [
          "Rotating vault cylinder",
          "Animated USDC coins entering vault",
          "Yield particles floating upward",
          "Gentle glow effects",
          "Responsive to scroll/mouse movement"
        ],
        "colors": "Primary gradient with gold accents for yield"
      },
      "investmentFlow3d": {
        "concept": "3D pipeline showing money flow",
        "stages": [
          "USDC input → Vault deposit → Yield generation",
          "Visual nodes connected by flowing lines",
          "Each stage animates on viewport entry"
        ]
      },
      "portfolioVisualization": {
        "concept": "3D pie chart for portfolio breakdown",
        "interaction": "Hover to expand segments",
        "data": "Investment amounts per startup"
      }
    },
    "microInteractions": {
      "buttons": {
        "hover": "Gentle scale + glow",
        "click": "Ripple effect",
        "loading": "Pulse animation"
      },
      "cards": {
        "hover": "Lift + shadow increase",
        "campaignProgress": "Progress bar fills with smooth easing",
        "yieldCounter": "Numbers count up with spring animation"
      },
      "pageTransitions": {
        "type": "Smooth slide transitions",
        "duration": "300ms ease-out",
        "elements": "Stagger animations for lists"
      }
    },
    "dataVisualizations": {
      "yieldCharts": {
        "library": "Chart.js or D3.js",
        "style": "Clean lines, gradient fills",
        "animations": "Draw-in animations on load"
      },
      "fundingProgress": {
        "style": "Custom progress bars with gradient fills",
        "animation": "Fill animation on page load"
      }
    }
  },
  
  "mobileDesign": {
    "mobileExperience": {
      "navigation": {
        "type": "Bottom tab bar for main sections",
        "tabs": ["Explore", "Portfolio", "Yield", "Profile"],
        "hamburger": "Secondary menu access"
      },
      "campaignCards": {
        "layout": "Full-width cards in mobile",
        "swipe": "Horizontal swipe between cards",
        "cta": "Prominent invest button"
      },
      "investment": {
        "modal": "Full-screen modal for investment flow",
        "input": "Large, thumb-friendly inputs",
        "confirmation": "Clear step-by-step process"
      }
    },
    "responsiveBreakpoints": {
      "mobile": "320px - 768px",
      "tablet": "768px - 1024px",
      "desktop": "1024px+"
    }
  },
  
  "technicalStack": {
    "recommendedStack": {
      "framework": "Next.js 14 with App Router",
      "styling": "Tailwind CSS + Framer Motion",
      "web3": "wagmi + viem + ConnectKit",
      "3d": "React Three Fiber + Drei",
      "state": "Zustand for local state",
      "forms": "React Hook Form + Zod validation",
      "charts": "Recharts or Chart.js",
      "deployment": "Vercel"
    },
    "keyLibraries": {
      "animations": "framer-motion for micro-interactions",
      "3dRendering": "@react-three/fiber, @react-three/drei",
      "web3Integration": "@wagmi/core, connectkit",
      "styling": "tailwindcss, clsx, tailwind-merge",
      "utils": "date-fns, numeral, react-hot-toast"
    }
  },
  
  "contentStrategy": {
    "copywriting": {
      "tone": "Confident, transparent, growth-focused",
      "headlines": {
        "heroOptions": [
          "Startup Capital That Works 24/7",
          "Where Investments Earn While They Grow",
          "Revolutionary Yield-Enhanced Fundraising"
        ]
      },
      "valueProps": [
        "6% guaranteed yield on all investments",
        "Liquid equity markets after holding period",
        "Zero idle capital - every dollar works immediately",
        "Built-in founder accountability with withdrawal limits"
      ]
    },
    "trustSignals": {
      "security": ["Smart contract audited", "Non-custodial funds"],
      "transparency": ["Real-time yield tracking", "Open source contracts"],
      "community": ["$XX total raised", "XX successful campaigns"]
    }
  },
  
  "implementationPhases": {
    "phase1": {
      "title": "Core Infrastructure",
      "tasks": [
        "Design system setup",
        "Component library",
        "Basic layouts",
        "Web3 integration"
      ]
    },
    "phase2": {
      "title": "Core Features",
      "tasks": [
        "Campaign browsing",
        "Investment flow",
        "Dashboard basics",
        "Wallet connection"
      ]
    },
    "phase3": {
      "title": "Advanced Features",
      "tasks": [
        "3D visualizations",
        "Advanced animations",
        "Secondary market UI",
        "Mobile optimization"
      ]
    },
    "phase4": {
      "title": "Polish & Performance",
      "tasks": [
        "Micro-interactions",
        "Performance optimization",
        "Accessibility improvements",
        "Testing & QA"
      ]
    }
  }
}
```