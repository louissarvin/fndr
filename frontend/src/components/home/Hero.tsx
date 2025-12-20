import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, TrendingUp, Users } from 'lucide-react';

const YieldVault = lazy(() => import('@/components/3d/YieldVault'));

const stats = [
  { label: 'Total Raised', value: '$12.5M+', icon: TrendingUp },
  { label: 'Active Investors', value: '2,400+', icon: Users },
  { label: 'Guaranteed APY', value: '6%', icon: Shield },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-yield/5" />
      
      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 py-12 md:py-20 lg:py-24 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="outline" className="gap-2 animate-fade-in">
                <span className="h-2 w-2 rounded-full bg-yield animate-pulse" />
                Now Live on Ethereum
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground animate-fade-in">
                Startup Capital That{' '}
                <span className="text-gradient-primary">Works 24/7</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg animate-fade-in">
                First fundraising platform where investments immediately generate{' '}
                <span className="font-semibold text-yield">6% APY</span> for everyone. 
                Zero idle capital.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
              <Button size="lg" asChild className="gradient-primary gap-2 text-base">
                <Link to="/browse">
                  Browse Startups
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="gap-2 text-base">
                <Link to="/create-campaign">
                  Create Campaign
                </Link>
              </Button>
            </div>

            {/* Trust Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 animate-fade-in">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <stat.icon className="h-4 w-4 text-primary" />
                    <span className="text-2xl md:text-3xl font-bold text-foreground">
                      {stat.value}
                    </span>
                  </div>
                  <span className="text-xs md:text-sm text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - 3D Visualization */}
          <div className="relative h-[400px] lg:h-[500px] animate-fade-in">
            <Suspense 
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="h-32 w-32 rounded-full gradient-primary animate-pulse opacity-50" />
                </div>
              }
            >
              <YieldVault />
            </Suspense>
            
            {/* Floating stat cards */}
            <div className="absolute top-8 right-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border animate-float">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-yield/20 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-yield" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Yield Generated</div>
                  <div className="text-sm font-semibold text-foreground">$847,230</div>
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-12 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border animate-float" style={{ animationDelay: '1s' }}>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Active Campaigns</div>
                  <div className="text-sm font-semibold text-foreground">127</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
