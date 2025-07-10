import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ProfileDropdown from "../components/ProfileDropdown";
import { toast, ToastContainer } from "react-toastify";
import { Loader } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import OutputSection from "../components/OutputSection";
import AnalysisViewer from "../components/AnalysisViewer";

// Animation variants
const outputContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: 0.7,
      staggerChildren: 0.15,
      when: "beforeChildren",
    },
  },
  exit: {
    opacity: 0,
    transition: {
      when: "afterChildren",
      duration: 0.3,
    },
  },
};

const outputCardVariants = {
  hidden: { opacity: 0, y: 80 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "linear" },
  },
  exit: {
    opacity: 0,
    y: 60,
    transition: { duration: 0.3 },
  },
};

export default function Dashboard() {
  const [faceFiles, setFaceFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [sceneDescription, setSceneDescription] = useState("");
  const [isUploadingFace, setIsUploadingFace] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [StreamURL, setStreamURL] = useState(null);
  const [faceName, setFaceName] = useState("");
  const [analysisMode, setAnalysisModeState] = useState(false);
  const faceInputRef = useRef();
  const videoInputRef = useRef();
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [summaryData, setSummaryData] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("http://localhost:8000/auth/me", {
          withCredentials: true,
        });
        setUserData(response.data);
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();

    if (!sessionStorage.getItem("access_token")) {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      sessionStorage.setItem("access_token", token);
    }
  }, []);
  const setAnalysisMode = (mode) => {
    setAnalysisModeState(mode);
  };

  const handleFaceUpload = async () => {
    if (faceFiles.length === 0) {
      toast.error("Please select 1–3 face images.");
      return;
    }

    setIsUploadingFace(true);
    const formData = new FormData();
    faceFiles.forEach((file) => formData.append("files", file));
    formData.append("name", faceName);

    try {
      const response = await axios.post(
        "http://localhost:8000/auth/register_face",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      toast.success(response.data.message || "Faces registered!");
      setFaceFiles([]);
      faceInputRef.current && (faceInputRef.current.value = null);
      setFaceName("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Face upload failed.");
    } finally {
      setIsUploadingFace(false);
    }
  };

  const handleVideoAnalyze = async () => {
    if (!videoFile) {
      toast.error("Please select a video file.");
      return;
    }

    setIsUploadingVideo(true);

    const formData = new FormData();
    formData.append("file", videoFile);

    try {
      const response = await axios.post(
        "http://localhost:8000/auth/upload_video",
        formData,
        { withCredentials: true }
      );
      console.log(response.data);
      toast.success("Video Uploaded successfully.");

      // Step 1: Set analysisMode true FIRST
      setAnalysisMode(true);

      // Step 2: Delay to let LiveLogViewer mount and connect
      setTimeout(() => {
        setStreamURL(
          `http://localhost:8000/auth/stream_video/${response.data.video_id}`
        );
      }, 300); // give LiveLogViewer time to mount & connect WebSocket

      // Optional:
      setSceneDescription(response.data.scene_description || "");

      // Reset input
      setVideoFile(null);
      if (videoInputRef.current) videoInputRef.current.value = null;
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Error uploading video.");
    } finally {
      setIsUploadingVideo(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <ToastContainer position="top-right" theme="dark" />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-orange-500">
          Smart Surveillance Dashboard
        </h1>
        <ProfileDropdown userData={userData} loading={loadingUser} />
      </div>

      <AnimatePresence>
        {!analysisMode && (
          <motion.div
            key="uploadSection"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            {/* Face Upload */}
            <div className="bg-[#0c1324] p-6 rounded-lg border border-orange-500 mb-6">
              <h2 className="text-xl font-semibold text-orange-400 mb-2">
                Register Face
              </h2>
              <input
                ref={faceInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFaceFiles([...e.target.files])}
                className="mb-4 block file:bg-orange-600 file:text-white file:py-2 file:px-4 rounded"
              />
              {faceFiles.length > 0 && (
                <input
                  type="text"
                  placeholder="Enter name for face"
                  value={faceName}
                  onChange={(e) => setFaceName(e.target.value)}
                  className="mb-4 w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-600"
                />
              )}
              <button
                onClick={handleFaceUpload}
                disabled={isUploadingFace}
                className={`bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded flex items-center gap-2 ${
                  isUploadingFace ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isUploadingFace && <Loader className="w-5 h-5 animate-spin" />}
                Upload Face(s)
              </button>
            </div>

            {/* Video Upload */}
            <div className="bg-[#0c1324] p-6 rounded-lg border border-orange-500 mb-6">
              <h2 className="text-xl font-semibold text-orange-400 mb-2">
                Upload Surveillance Video
              </h2>
              <input
                ref={videoInputRef}
                type="file"
                accept=".mp4,.mov,.avi,.mkv"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setVideoFile(file);
                    toast.info("Video uploaded. Choose to analyze or discard.");
                  }
                }}
                disabled={!!videoFile}
                className={`mb-4 block file:bg-orange-600 file:text-white file:py-2 file:px-4 rounded ${
                  videoFile ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
              {videoFile && (
                <div className="flex gap-4">
                  <button
                    onClick={handleVideoAnalyze}
                    disabled={isUploadingVideo}
                    className={`bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center gap-2 ${
                      isUploadingVideo ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isUploadingVideo && (
                      <Loader className="w-5 h-5 animate-spin" />
                    )}
                    Analyze Video
                  </button>
                  <button
                    onClick={() => {
                      setVideoFile(null);
                      videoInputRef.current &&
                        (videoInputRef.current.value = null);
                      toast.info("Video discarded.");
                    }}
                    disabled={isUploadingVideo}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
                  >
                    Discard Video
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Output & Logs */}
      <AnimatePresence>
        {analysisMode && (
          <motion.div
            key="outputSectionWrapper"
            variants={outputContainerVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="flex flex-col gap-6"
          >
            {/* Output Video + Stats */}
            <OutputSection
              outputCardVariants={outputCardVariants}
              StreamURL={StreamURL}
              setStreamURL={setStreamURL}
              setAnalysisMode={setAnalysisMode}
              onSummaryDetection={setSummaryData}
            />
            <AnalysisViewer summaryData={summaryData} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
