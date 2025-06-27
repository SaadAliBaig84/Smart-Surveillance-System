import { useEffect, useState } from "react";
import LoginForm from "../components/LoginForm";
import SignupForm from "../components/SignupForm";
import { Flame } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "../components/LoadingScreen";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loginError, setLoginError] = useState(null);
  const [signupError, setSignupError] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);

  const navigate = useNavigate();
  const { loading, setAuthenticated, authenticated } = useAuth();
  useEffect(() => {
    if (!loading && authenticated) {
      navigate("/dashboard");
    }
  }, [loading, authenticated, navigate]);
  const handleLogin = async (data) => {
    const { email, password } = data;
    try {
      setLocalLoading(true);
      setLoginError(null);
      const response = await axios.post(
        "http://localhost:8000/auth/login",
        { email, password },
        { withCredentials: true }
      );
      if (response.status === 200) {
        setAuthenticated(true);
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(error?.response?.data?.detail || "An error occurred.");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSignup = async (data) => {
    const { username, email, password } = data;
    try {
      setLocalLoading(true);
      setSignupError(null);
      const response = await axios.post(
        "http://localhost:8000/auth/signup",
        { username, email, password },
        { withCredentials: true }
      );
      if (response.status === 201) {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setSignupError(error?.response?.data?.detail || "An error occurred.");
    } finally {
      setLocalLoading(false);
    }
  };
  if (loading) return <LoadingScreen></LoadingScreen>;
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-black text-white">
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-6 py-12 text-center md:text-left">
        <Flame className="w-12 h-12 text-orange-500 mb-4" />
        <div className="max-w-md">
          <h1 className="text-4xl font-bold text-orange-500 mb-4">
            Smart Surveillance System
          </h1>
          <p className="text-gray-300 text-lg mb-6">
            AI-driven real-time fire and face detection to secure your
            surroundings.
          </p>
        </div>
      </div>

      <div className="w-full md:w-1/2 bg-[#0c1324] flex items-center justify-center px-6 py-12">
        {isLogin ? (
          <LoginForm
            onSubmit={handleLogin}
            errorMessage={loginError}
            toggleForm={() => setIsLogin(false)}
            loading={localLoading}
          />
        ) : (
          <SignupForm
            onSubmit={handleSignup}
            errorMessage={signupError}
            toggleForm={() => setIsLogin(true)}
            loading={localLoading}
          />
        )}
      </div>
    </div>
  );
}
