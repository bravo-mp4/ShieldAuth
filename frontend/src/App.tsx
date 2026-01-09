import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
// @ts-expect-error - JSX component
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
// @ts-expect-error - JSX component
import Login from "./pages/Login";
// @ts-expect-error - JSX component
import Signup from "./pages/Signup";
// @ts-expect-error - JSX component
import ForgotPassword from "./pages/ForgotPassword";
// @ts-expect-error - JSX component
import ResetPassword from "./pages/ResetPassword";
// @ts-expect-error - JSX component
import Features from "./pages/Features";
// @ts-expect-error - JSX component
import Pricing from "./pages/Pricing";
// @ts-expect-error - JSX component
import Status from "./pages/Status";
// @ts-expect-error - JSX component
import Blog from "./pages/Blog";
// @ts-expect-error - JSX component
import About from "./pages/About";
// @ts-expect-error - JSX component
import Contact from "./pages/Contact";
// @ts-expect-error - JSX component
import Terms from "./pages/Terms";
// @ts-expect-error - JSX component
import Privacy from "./pages/Privacy";
// @ts-expect-error - JSX component
import Changelog from "./pages/Changelog";
// @ts-expect-error - JSX component
import Documentation from "./pages/Documentation";
// @ts-expect-error - JSX component
import UseCases from "./pages/UseCases";
// @ts-expect-error - JSX component
import SecurityPage from "./pages/SecurityPage";
// @ts-expect-error - JSX component
import APIDemo from "./pages/APIDemo";
import Dashboard from "./pages/NewDashboard";
import Applications from "./pages/Applications";
// @ts-expect-error - JSX component
import ApplicationDetail from "./pages/ApplicationDetail";
// @ts-expect-error - JSX component
import Analytics from "./pages/Analytics";
// @ts-expect-error - JSX component
import APIKeys from "./pages/APIKeys";
// @ts-expect-error - JSX component
import Webhooks from "./pages/Webhooks";
// @ts-expect-error - JSX component
import Downloads from "./pages/Downloads";
// @ts-expect-error - JSX component
import Support from "./pages/Support";
import Users from "./pages/Users";
import Logs from "./pages/Logs";
import SettingsPage from "./pages/Settings";
import Licenses from "./pages/Licenses";
import "./App.css";

export default function App() {
  useEffect(() => {
    // Disabled mouse tracking and particle effects for cleaner look
    return () => {};
  }, []);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/features" element={<Features />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/use-cases" element={<UseCases />} />
      <Route path="/security" element={<SecurityPage />} />
      <Route path="/api-demo" element={<APIDemo />} />
      <Route path="/status" element={<Status />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/changelog" element={<Changelog />} />
      <Route path="/docs" element={<Documentation />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/users" element={<Users />} />
          <Route path="/licenses" element={<Licenses />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/api-keys" element={<APIKeys />} />
          <Route path="/webhooks" element={<Webhooks />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="/support" element={<Support />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
