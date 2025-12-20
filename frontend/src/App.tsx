import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import Portfolio from "./pages/Portfolio";
import Chest from "./pages/Chest";
import Marketplace from "./pages/Marketplace";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Chest />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/dashboard" element={<Portfolio />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/old-index" element={<Index />} />
          <Route path="/how-it-works" element={<Chest />} />
          <Route path="/create-campaign" element={<Browse />} />
          <Route path="/campaign/:id" element={<Browse />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
