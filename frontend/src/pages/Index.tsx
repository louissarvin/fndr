import Layout from '@/components/layout/Layout';
import Hero from '@/components/home/Hero';
import HowItWorks from '@/components/home/HowItWorks';
import Stats from '@/components/home/Stats';
import FeaturedCampaigns from '@/components/campaigns/FeaturedCampaigns';
import CTA from '@/components/home/CTA';

const Index = () => {
  return (
    <Layout>
      <Hero />
      <Stats />
      <HowItWorks />
      <FeaturedCampaigns />
      <CTA />
    </Layout>
  );
};

export default Index;
