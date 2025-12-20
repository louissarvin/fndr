import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CampaignCard from './CampaignCard';
import { MOCK_CAMPAIGNS, CATEGORIES } from '@/lib/web3-config';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FeaturedCampaigns() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredCampaigns = selectedCategory === 'all'
    ? MOCK_CAMPAIGNS
    : MOCK_CAMPAIGNS.filter(
        (c) => c.category.toLowerCase().replace('/', '-') === selectedCategory
      );

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <Badge variant="outline" className="mb-3">
              Featured Startups
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Invest in Tomorrow's Leaders
            </h2>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Discover verified startups earning 6% APY on your investment while they build the future.
            </p>
          </div>
          <Button variant="outline" asChild className="gap-2 self-start md:self-auto">
            <Link to="/browse">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={selectedCategory === category.id ? 'gradient-primary' : ''}
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Campaign Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.slice(0, 6).map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>

        {/* Load More CTA */}
        <div className="flex justify-center mt-12">
          <Button variant="outline" size="lg" asChild className="gap-2">
            <Link to="/browse">
              Explore All Campaigns
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
