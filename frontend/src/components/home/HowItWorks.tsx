import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, PiggyBank, ArrowLeftRight, Shield, TrendingUp, Zap } from 'lucide-react';

const steps = [
  {
    icon: Wallet,
    title: 'Invest in Startups',
    description: 'Browse verified startups and invest with USDC. Minimum investment starts at just $100.',
    color: 'primary',
    number: '01',
  },
  {
    icon: PiggyBank,
    title: 'Earn 6% APY',
    description: 'Your capital immediately generates yield in secure DeFi vaults. Watch your returns grow daily.',
    color: 'yield',
    number: '02',
  },
  {
    icon: ArrowLeftRight,
    title: 'Trade on Secondary',
    description: 'After 180 days, trade your equity tokens on our liquid secondary market.',
    color: 'primary',
    number: '03',
  },
];

const benefits = [
  {
    icon: Shield,
    title: 'Audited Smart Contracts',
    description: 'All contracts are audited by leading security firms.',
  },
  {
    icon: TrendingUp,
    title: 'Real-Time Tracking',
    description: 'Monitor your yield and portfolio performance live.',
  },
  {
    icon: Zap,
    title: 'Instant Settlement',
    description: 'Claim your yield anytime with one transaction.',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <Badge variant="outline" className="mb-4">
            Simple & Transparent
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How Fndr Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Revolutionary yield-enhanced fundraising that benefits everyone. 
            Your investment works from day one.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-16">
          {steps.map((step, index) => (
            <Card 
              key={step.title} 
              className="relative overflow-hidden hover-lift border-border/50 bg-card"
            >
              {/* Step Number */}
              <div className="absolute top-4 right-4 text-6xl font-bold text-muted/20">
                {step.number}
              </div>
              
              <CardContent className="p-6 md:p-8">
                {/* Icon */}
                <div 
                  className={`h-14 w-14 rounded-xl flex items-center justify-center mb-6 ${
                    step.color === 'yield' ? 'bg-yield/10' : 'bg-primary/10'
                  }`}
                >
                  <step.icon 
                    className={`h-7 w-7 ${
                      step.color === 'yield' ? 'text-yield' : 'text-primary'
                    }`} 
                  />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-border" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((benefit) => (
            <div 
              key={benefit.title}
              className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <benefit.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  {benefit.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
