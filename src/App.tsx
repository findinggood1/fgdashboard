import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

import Login from "./pages/Login";
import DashboardLayout from "./layouts/DashboardLayout";
import PortalLayout from "./layouts/PortalLayout";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import EngagementDetail from "./pages/EngagementDetail";
import Events from "./pages/Events";
import Analytics from "./pages/Analytics";
import Chat from "./pages/Chat";
import CoachChat from "./pages/CoachChat";
import NotFound from "./pages/NotFound";

// Portal pages
import PortalHome from "./pages/portal/PortalHome";
import PortalJourney from "./pages/portal/PortalJourney";
import PortalMap from "./pages/portal/PortalMap";
import PortalChat from "./pages/portal/PortalChat";
import PortalLogin from "./pages/portal/PortalLogin";
import PortalSignup from "./pages/portal/PortalSignup";
import AccessPending from "./pages/portal/AccessPending";
import AccessRevoked from "./pages/portal/AccessRevoked";
import NoAccount from "./pages/portal/NoAccount";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            
            {/* Status pages (no layout) */}
            <Route path="/portal/login" element={<PortalLogin />} />
            <Route path="/portal/signup" element={<PortalSignup />} />
            <Route path="/access-pending" element={<AccessPending />} />
            <Route path="/access-revoked" element={<AccessRevoked />} />
            <Route path="/no-account" element={<NoAccount />} />
            
            {/* Coach/Admin Protected Routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/:email" element={<ClientDetail />} />
              <Route path="/engagements/:id" element={<EngagementDetail />} />
              <Route path="/events" element={<Events />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/coach/chat" element={<CoachChat />} />
            </Route>

            {/* Client Portal Routes */}
            <Route element={<PortalLayout />}>
              <Route path="/portal" element={<PortalHome />} />
              <Route path="/portal/journey" element={<PortalJourney />} />
              <Route path="/portal/map" element={<PortalMap />} />
              <Route path="/portal/chat" element={<PortalChat />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
