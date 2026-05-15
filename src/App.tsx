import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import SendMoney from "./pages/SendMoney";
import Transactions from "./pages/Transactions";
import Profile from "./pages/Profile";
import UnlockTransaction from "./pages/UnlockTransaction";
import CheckoutReturn from "./pages/CheckoutReturn";
import AuthPage from "./pages/Auth";
import Welcome from "./pages/Welcome";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound.tsx";
import Unsubscribe from "./pages/Unsubscribe";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Support from "./pages/Support";
import Contact from "./pages/Contact";
import Security from "./pages/Security";
import Compliance from "./pages/Compliance";
import SmsPolicy from "./pages/SmsPolicy";
import DeleteAccount from "./pages/DeleteAccount";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-center" richColors />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/send" element={<ProtectedRoute><SendMoney /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/unlock/:id" element={<ProtectedRoute><UnlockTransaction /></ProtectedRoute>} />
            <Route path="/checkout/return" element={<ProtectedRoute><CheckoutReturn /></ProtectedRoute>} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/support" element={<Support />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/security" element={<Security />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/sms-policy" element={<SmsPolicy />} />
            <Route path="/delete-account" element={<ProtectedRoute><DeleteAccount /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
