import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "./LoadingScreen";

export default function ProtectedRoute({ children }) {
  const { authenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !authenticated) {
      navigate("/"); // ⬅️ Navigate after render
    }
  }, [loading, authenticated, navigate]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!authenticated) {
    return null; // ⬅️ Prevent rendering children until redirected
  }

  return children;
}
