import { useEffect } from "react";
import { Navigate, Outlet, Routes, Route, useLocation } from "react-router-dom";
import Login from "./pages/Login.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import RealTimeMonitoring from "./pages/RealTimeMonitoring.jsx";
import Predictions from "./pages/Predictions.jsx";
import Complaints from "./pages/Complaints.jsx";
import NewComplaint from "./pages/NewComplaint.jsx";
import ComplaintPolicy from "./pages/ComplaintPolicy.jsx";
import Maintain from "./pages/Maintain.jsx";
import Alerts from "./pages/Alerts.jsx";
import Profile from "./pages/Profile.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminTanks from "./pages/AdminTanks.jsx";
import AdminComplaints from "./pages/AdminComplaints.jsx";
import AdminResidents from "./pages/AdminResidents.jsx";
import AdminReports from "./pages/AdminReports.jsx";
import AdminDevices from "./pages/AdminDevices.jsx";
import Terms from "./pages/Terms.jsx";
import Privacy from "./pages/Privacy.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import ResidentGuide from "./components/ResidentGuide.jsx";

function RequireAuth({ role }) {
  const { isAuthenticated, isReady, user } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground" role="status">
        Loading your portal...
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== role) {
    return <Navigate to={role === "admin" ? "/admin" : "/"} replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default function App() {
  const location = useLocation();

  useEffect(() => {
    document.title = location.pathname.startsWith("/admin")
      ? "SeptiGuard Admin Portal"
      : "SeptiGuard Portal";
  }, [location.pathname]);

  return (
    <>
      <div key={location.pathname} className="route-transition">
        <Routes location={location}>
          <Route path="/" element={<Login />} />
          <Route path="/admin" element={<Login adminOnly />} />
          <Route path="/admin/login" element={<Navigate to="/admin" replace />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route element={<RequireAuth role="resident" />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/monitor" element={<RealTimeMonitoring />} />
            <Route path="/predict" element={<Predictions />} />
            <Route path="/complaints" element={<Complaints />} />
            <Route path="/complaints/new" element={<NewComplaint />} />
            <Route path="/complaints/policy" element={<ComplaintPolicy />} />
            <Route path="/maintain" element={<Maintain />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route element={<RequireAuth role="admin" />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/tanks" element={<AdminTanks />} />
            <Route path="/admin/complaints" element={<AdminComplaints />} />
            <Route path="/admin/residents" element={<AdminResidents />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/devices" element={<AdminDevices />} />
          </Route>
        </Routes>
      </div>
      <ResidentGuide />
    </>
  );
}