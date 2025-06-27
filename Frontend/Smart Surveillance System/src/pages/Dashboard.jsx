import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { set } from "react-hook-form";
import ProfileDropdown from "../components/ProfileDropdown";

export default function Dashboard() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [sceneDescription, setSceneDescription] = useState("");

  const navigate = useNavigate();
  const { loading, setAuthenticated, authenticated } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    updated_at: "",
  });
  useEffect(() => {
    if (!loading && !authenticated) {
      navigate("/");
    }
  }, [loading, authenticated, navigate]);
  // Fetch user data on open
  useEffect(() => {
    const fetchUserData = async () => {
      setProfileLoading(true);
      try {
        const response = await axios.get("http://localhost:8000/auth/me", {
          withCredentials: true,
        });
        if (response.status === 200) {
          const { username, email, updated_at } = response.data;
          setUserData({
            username,
            email,
            updated_at: new Date(updated_at).toLocaleString(),
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserData({
          username: "",
          email: "",
          updated_at: "",
        });
      } finally {
        setProfileLoading(false);
      }
    };

    if (open) {
      fetchUserData();
    }
  }, []);
  if (loading) return <LoadingScreen></LoadingScreen>;
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-orange-500">
          Smart Surveillance Dashboard
        </h1>
        <ProfileDropdown
          userData={userData}
          loading={profileLoading}
        ></ProfileDropdown>
      </div>

      {/* Upload Section */}
      <div className="bg-[#0c1324] border border-orange-500 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-orange-400 mb-3">
          Upload Image or Video
        </h2>
        <input
          type="file"
          accept="image/*, video/*"
          onChange={(e) => setUploadedFile(e.target.files[0])}
          className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-orange-600 file:text-white hover:file:bg-orange-700"
        />
        {uploadedFile && (
          <p className="mt-2 text-sm text-gray-400">
            File ready: {uploadedFile.name}
          </p>
        )}
      </div>

      {/* Output Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0c1324] border border-orange-500 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2 text-orange-400">
            Output Preview
          </h2>
          <div className="w-full h-64 bg-gray-900 rounded flex items-center justify-center">
            {processedImage ? (
              <img
                src={processedImage}
                alt="Processed"
                className="max-h-full max-w-full rounded"
              />
            ) : (
              <span className="text-gray-500 text-sm">
                No output available yet
              </span>
            )}
          </div>
        </div>

        <div className="bg-[#0c1324] border border-orange-500 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2 text-orange-400">
            Scene Analysis
          </h2>
          <div className="text-sm text-gray-300 h-64 overflow-y-auto border border-gray-700 rounded p-2 bg-black">
            {sceneDescription ||
              "Scene description will appear here after analysis."}
          </div>
        </div>
      </div>
    </div>
  );
}
