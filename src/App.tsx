import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";

// Auth
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Components
import { SplashScreen } from "./components/SplashScreen";
import { ScrollToTop } from "./components/ScrollToTop";

// Public Pages
import Index from "./pages/Index";
import Servicios from "./pages/Servicios";
import Espacio from "./pages/Espacio";
import SalaReuniones from "./pages/SalaReuniones";
import Ubicacion from "./pages/Ubicacion";
import Contacto from "./pages/Contacto";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import NotFound from "./pages/NotFound";

// Client Dashboard Pages
import DashboardHome from "./pages/dashboard/DashboardHome";
import DashboardEspacio from "./pages/dashboard/DashboardEspacio";
import DashboardSalaReuniones from "./pages/dashboard/DashboardSalaReuniones";
import DashboardFacturas from "./pages/dashboard/DashboardFacturas";
import DashboardPagos from "./pages/dashboard/DashboardPagos";
import DashboardAccesos from "./pages/dashboard/DashboardAccesos";
import DashboardPerfil from "./pages/dashboard/DashboardPerfil";

// Admin Pages
import AdminHome from "./pages/admin/AdminHome";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminSalaReuniones from "./pages/admin/AdminSalaReuniones";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminEstadisticasReservas from "./pages/admin/AdminEstadisticasReservas";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SplashScreen />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/servicios" element={<Servicios />} />
            <Route path="/espacio" element={<Espacio />} />
            <Route path="/sala-reuniones" element={<SalaReuniones />} />
            <Route path="/ubicacion" element={<Ubicacion />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogArticle />} />

            {/* Client Dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
            <Route path="/dashboard/espacio" element={<ProtectedRoute><DashboardEspacio /></ProtectedRoute>} />
            <Route path="/dashboard/sala-reuniones" element={<ProtectedRoute><DashboardSalaReuniones /></ProtectedRoute>} />
            <Route path="/dashboard/facturas" element={<ProtectedRoute><DashboardFacturas /></ProtectedRoute>} />
            <Route path="/dashboard/pagos" element={<ProtectedRoute><DashboardPagos /></ProtectedRoute>} />
            <Route path="/dashboard/accesos" element={<ProtectedRoute><DashboardAccesos /></ProtectedRoute>} />
            <Route path="/dashboard/perfil" element={<ProtectedRoute><DashboardPerfil /></ProtectedRoute>} />

            {/* Admin Dashboard */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminHome /></ProtectedRoute>} />
            <Route path="/admin/usuarios" element={<ProtectedRoute requireAdmin><AdminUsuarios /></ProtectedRoute>} />
            <Route path="/admin/sala-reuniones" element={<ProtectedRoute requireAdmin><AdminSalaReuniones /></ProtectedRoute>} />
            <Route path="/admin/blog" element={<ProtectedRoute requireAdmin><AdminBlog /></ProtectedRoute>} />
            <Route path="/admin/estadisticas-reservas" element={<ProtectedRoute requireAdmin><AdminEstadisticasReservas /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Analytics />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
