import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import VehicleDetail from "./pages/VehicleDetail";
import Vehicles from "./pages/Vehicles";
import Employees from "./pages/Employees";
import Requests from "./pages/Requests";
import NewRequest from "./pages/NewRequest";
import RequestDetail from "./pages/RequestDetail";
import EventReports from "./pages/EventReports";
import FormTemplates from "./pages/FormTemplates";
import Roles from "./pages/Roles";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/vehicle-fleet" element={<Vehicles />} />
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/requests" element={<Requests />} />
                    <Route path="/requests/new" element={<NewRequest />} />
                    <Route path="/requests/edit/:id" element={<NewRequest />} />
                    <Route path="/requests/:id" element={<RequestDetail />} />
                    <Route path="/event-reports" element={<EventReports />} />
                    <Route path="/form-templates" element={<FormTemplates />} />
                    <Route path="/roles" element={<Roles />} />
                    <Route path="/vehicle/:licensePlate" element={<VehicleDetail />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
