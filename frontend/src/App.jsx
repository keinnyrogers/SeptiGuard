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
    </Routes>
  );
}