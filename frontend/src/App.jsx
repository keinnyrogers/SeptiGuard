import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import RealTimeMonitoring from "./pages/RealTimeMonitoring.jsx";
import Predictions from "./pages/Predictions.jsx";
import Complaints from "./pages/Complaints.jsx";
import NewComplaint from "./pages/NewComplaint.jsx";
import Maintain from "./pages/Maintain.jsx";
import Alerts from "./pages/Alerts.jsx";
import Profile from "./pages/Profile.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminTanks from "./pages/AdminTanks.jsx";
import AdminComplaints from "./pages/AdminComplaints.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/monitor" element={<RealTimeMonitoring />} />
      <Route path="/predict" element={<Predictions />} />
      <Route path="/complaints" element={<Complaints />} />
      <Route path="/complaints/new" element={<NewComplaint />} />
      <Route path="/maintain" element={<Maintain />} />
      <Route path="/alerts" element={<Alerts />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/tanks" element={<AdminTanks />} />
      <Route path="/admin/complaints" element={<AdminComplaints />} />
    </Routes>
  );
}