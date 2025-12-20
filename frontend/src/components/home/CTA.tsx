import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CTA() {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl gradient-primary p-8 md:p-12 lg:p-16">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-sm text-white/90">Start earning today</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Ready to Make Your Capital Work?
            </h2>
            
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Join thousands of investors earning 6% APY while supporting the next generation of startups.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                asChild 
                className="gap-2 text-base bg-white text-primary hover:bg-white/90"
              >
                <Link to="/browse">
                  Start Investing
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild
                className="gap-2 text-base border-white/30 text-white hover:bg-white/10"
              >
                <Link to="/create-campaign">
                  Launch Your Campaign
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
