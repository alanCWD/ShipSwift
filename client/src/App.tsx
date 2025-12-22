import React, { Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/use-auth";
import { useEffect } from "react";
import Home from "./pages/home";
import Dashboard from "./pages/dashboard";
import CreateShipment from "./pages/create-shipment";
import TrackShipment from "./pages/track-shipment";
import Admin from "./pages/admin";
import Profile from "./pages/profile";
import NotFound from "./pages/not-found";

function Router() {
  const { user, isLoading, checkAuth } = useAuth();

  useEffect(() => {
    // Check if user is already authenticated when app loads
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={user ? Dashboard : Home} />
      <Route path="/home" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/create-shipment" component={CreateShipment} />
      <Route path="/track" component={TrackShipment} />
      <Route path="/profile" component={Profile} />
      <Route path="/billing" component={React.lazy(() => import("./pages/billing"))} />
      <Route path="/shipments" component={React.lazy(() => import("./pages/shipments"))} />
      <Route path="/branding" component={React.lazy(() => import("@/pages/client-branding"))} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/rate-comparison" component={React.lazy(() => import("@/pages/admin/rate-comparison"))} />
      <Route path="/admin/api-keys" component={React.lazy(() => import("@/pages/admin/api-keys"))} />
      <Route path="/admin/blaze" component={React.lazy(() => import("@/pages/admin/blaze-settings"))} />
      <Route path="/admin-guide" component={React.lazy(() => import("@/pages/admin-access-guide"))} />
      {/* Blaze Portal Routes */}
      <Route path="/blaze" component={React.lazy(() => import("@/pages/blaze/dashboard"))} />
      <Route path="/blaze/ship" component={React.lazy(() => import("@/pages/blaze/ship"))} />
      <Route path="/blaze/orders" component={React.lazy(() => import("@/pages/blaze/orders"))} />
      <Route path="/blaze/connections" component={React.lazy(() => import("@/pages/blaze/connections"))} />
      <Route path="/branded-track" component={React.lazy(() => import("@/pages/branded-tracking"))} />
      <Route path="/insurance-terms" component={React.lazy(() => import("@/pages/insurance-terms"))} />
      <Route path="/privacy-policy" component={React.lazy(() => import("@/pages/privacy-policy"))} />
      <Route path="/terms-of-service" component={React.lazy(() => import("@/pages/terms-of-service"))} />
      <Route path="/cookie-policy" component={React.lazy(() => import("@/pages/cookie-policy"))} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>}>
          <Router />
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
