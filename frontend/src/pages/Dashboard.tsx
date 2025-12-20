import { Suspense, lazy } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MOCK_PORTFOLIO, formatCurrency } from '@/lib/web3-config';
import { TrendingUp, Wallet, PiggyBank, ArrowUpRight, DollarSign } from 'lucide-react';

const PortfolioOrb = lazy(() => import('@/components/3d/PortfolioOrb'));

const totalInvested = MOCK_PORTFOLIO.reduce((acc, p) => acc + p.invested, 0);
const totalValue = MOCK_PORTFOLIO.reduce((acc, p) => acc + p.currentValue, 0);
const totalYield = MOCK_PORTFOLIO.reduce((acc, p) => acc + p.yieldEarned, 0);

export default function Dashboard() {
  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Badge variant="outline" className="mb-3">Investor Dashboard</Badge>
            <h1 className="text-3xl font-bold text-foreground">Your Portfolio</h1>
          </div>
          <Button className="gradient-primary gap-2">
            <DollarSign className="h-4 w-4" />
            Claim All Yield
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Total Invested
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
              <p className="text-xs text-muted-foreground">Across {MOCK_PORTFOLIO.length} startups</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Portfolio Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
              <p className="text-xs text-yield">+{(((totalValue - totalInvested) / totalInvested) * 100).toFixed(1)}% return</p>
            </CardContent>
          </Card>
          <Card className="border-yield/30 bg-yield/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <PiggyBank className="h-4 w-4" /> Total Yield Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yield">{formatCurrency(totalYield)}</div>
              <p className="text-xs text-muted-foreground">6% APY guaranteed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Claimable Now</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalYield * 0.3)}</div>
              <Button size="sm" variant="outline" className="mt-2 w-full">Claim</Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Portfolio Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Investments</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead className="text-right">Invested</TableHead>
                      <TableHead className="text-right">Current Value</TableHead>
                      <TableHead className="text-right">Yield</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_PORTFOLIO.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.campaignName}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.invested)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.currentValue)}</TableCell>
                        <TableCell className="text-right text-yield">{formatCurrency(item.yieldEarned)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost"><ArrowUpRight className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* 3D Visualization */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="h-[300px] flex items-center justify-center"><div className="h-16 w-16 rounded-full gradient-primary animate-pulse" /></div>}>
                  <PortfolioOrb />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
