import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { config } from "@/lib/web3-config";
import { AIProvider } from "@/components/ai/AIContext";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import Portfolio from "./pages/Portfolio";
import Chest from "./pages/Chest";
import Marketplace from "./pages/Marketplace";
import FounderDashboard from "./pages/FounderDashboard";
import NotFound from "./pages/NotFound";

import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider
        theme={darkTheme({
          accentColor: "#A2D5C6",
          accentColorForeground: "#000000",
          borderRadius: "large",
          fontStack: "system",
          overlayBlur: "small",
        })}
        modalSize="compact"
      >
        <TooltipProvider>
          <AIProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Chest />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/dashboard" element={<Portfolio />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/founder" element={<FounderDashboard />} />
                <Route path="/old-index" element={<Index />} />
                <Route path="/how-it-works" element={<Chest />} />
                <Route path="/create-campaign" element={<Browse />} />
                <Route path="/campaign/:id" element={<Browse />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AIProvider>
        </TooltipProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
