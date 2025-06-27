// src/components/ProfileDropdown.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { User } from "lucide-react";
import { Loader } from "lucide-react";
export default function ProfileDropdown({ userData, loading }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { setAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/auth/logout",
        {},
        { withCredentials: true }
      );
      if (response.status === 200) {
        setAuthenticated(false);
        navigate("/");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* <img
        src={user?.profilePic || "/default-avatar.png"} // fallback image
        alt="Profile"
        className="w-10 h-10 rounded-full cursor-pointer border border-gray-600"
        onClick={() => setOpen(!open)}
      /> */}
      <User
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full cursor-pointer border border-orange-600 p-1 shadow-[0_0_10px_rgba(255,115,0,0.7)]"
      ></User>

      {open && (
        <div className="absolute flex flex-col justify-center items-center right-0 mt-2 bg-gray-800 w-md text-white rounded-lg shadow-lg z-50">
          <div className=" px-4 py-3 border-b border-gray-700 text-sm font-semibold">
            {loading ? (
              <Loader className="w-5 h-5 animate-spin align-middle" />
            ) : (
              <>
                <p>Username: {userData.username || "User"}</p>
                <p>Email: {userData.email || ""}</p>
                <p>Last updated: {userData.updated_at || "N/A"}</p>
              </>
            )}
          </div>

          <button
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 my-2 rounded text-sm font-semibold"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
