import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/use-auth";
import Home from "./pages/home";
import Dashboard from "./pages/dashboard";
import TrackShipment from "./pages/track-shipment";
import Admin from "./pages/admin";
import NotFound from "./pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      {!user ? (
        <>
          <Route path="/" component={Home} />
          <Route path="/track" component={TrackShipment} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/create-shipment" component={React.lazy(() => import("@/pages/create-shipment"))} />
          <Route path="/track" component={TrackShipment} />
          <Route path="/branding" component={React.lazy(() => import("@/pages/client-branding"))} />
          {user.role === 'admin' && (
            <>
              <Route path="/admin" component={Admin} />
              <Route path="/admin-settings" component={React.lazy(() => import("@/pages/admin-settings"))} />
            </>
          )}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
