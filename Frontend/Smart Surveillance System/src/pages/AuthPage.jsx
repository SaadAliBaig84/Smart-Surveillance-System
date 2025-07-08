import { useEffect, useState } from "react";
import LoginForm from "../components/LoginForm";
import SignupForm from "../components/SignupForm";
import { Flame } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from "../components/LoadingScreen";
import { motion, AnimatePresence } from "framer-motion";

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
        console.log(response.data);
        const access_token = response.data.access_token.access_token; // Parse the JSON string
        console.log(access_token);
        // Optional: Store in sessionStorage
        sessionStorage.setItem("access_token", access_token);
        await new Promise((r) => setTimeout(r, 0));
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
        const access_token = response.data.access_token.access_token;

        // Optional: Store in sessionStorage
        sessionStorage.setItem("access_token", access_token);
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setSignupError(error?.response?.data?.detail || "An error occurred.");
    } finally {
      setLocalLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="relative h-screen flex flex-col md:flex-row bg-black text-white z-10 overflow-hidden">
      {/* Left Branding */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full md:w-1/2 h-full flex flex-col justify-center items-center px-6 py-12 text-center md:text-left"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Flame className="w-12 h-12 text-orange-500 mb-4 drop-shadow-[0_0_10px_rgba(255,115,0,0.6)]" />
        </motion.div>

        <div className="max-w-md">
          <h1 className="text-4xl font-bold text-orange-500 mb-4">
            Smart Surveillance System
          </h1>
          <p className="text-gray-300 text-lg mb-6">
            AI-driven real-time fire and face detection to secure your
            surroundings.
          </p>
        </div>
      </motion.div>

      {/* Right Form Side */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full md:w-1/2 h-full bg-[#0c1324] flex items-center justify-center px-6 py-12"
      >
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md min-h-[420px]"
            >
              <LoginForm
                onSubmit={handleLogin}
                errorMessage={loginError}
                toggleForm={() => setIsLogin(false)}
                loading={localLoading}
              />
            </motion.div>
          ) : (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md min-h-[420px]"
            >
              <SignupForm
                onSubmit={handleSignup}
                errorMessage={signupError}
                toggleForm={() => setIsLogin(true)}
                loading={localLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
