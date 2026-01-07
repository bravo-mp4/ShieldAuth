import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute wrapper component
 * Checks if user is authenticated before showing the page
 * If not authenticated, redirects to login page
 */
export default function ProtectedRoute({ children }) {
  // Check if user has a token stored
  const token = localStorage.getItem("token");

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If token exists, show the protected page
  return children;
}
