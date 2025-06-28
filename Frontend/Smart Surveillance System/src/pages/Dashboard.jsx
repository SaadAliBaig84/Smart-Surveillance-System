import { useState, useRef } from "react";
import axios from "axios";
import ProfileDropdown from "../components/ProfileDropdown";
import { toast, ToastContainer } from "react-toastify";
import { Loader } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
export default function Dashboard() {
  const [faceFiles, setFaceFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [sceneDescription, setSceneDescription] = useState(""); // Placeholder

  const [isUploadingFace, setIsUploadingFace] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [StreamURL, setStreamURL] = useState(null);
  const [faceName, setFaceName] = useState("");
  const faceInputRef = useRef();
  const videoInputRef = useRef();

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
      if (faceInputRef.current) faceInputRef.current.value = null;
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
        "http://localhost:8000/auth/upload_video", // Replace with your actual endpoint
        formData,
        {
          withCredentials: true,
        }
      );

      toast.success("Video Uploaded successfully.");
      setStreamURL(
        `http://localhost:8000/auth/stream_video/${response.data.video_id}`
      );
      // Optional: Set backend results
      setSceneDescription(response.data.scene_description || "");

      // Reset upload state
      setVideoFile(null);
      if (videoInputRef.current) videoInputRef.current.value = null;
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.detail || "Error uploading video. Try again."
      );
    } finally {
      setIsUploadingVideo(false);
    }
  };
  const clearStream = async () => {
    try {
      await axios.post(
        "http://localhost:8000/auth/stop_stream",
        {},
        { withCredentials: true }
      );
      setStreamURL(null);
      toast.info("Stream cleared.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to stop stream.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <ToastContainer position="top-right" theme="dark" />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-orange-500">
          Smart Surveillance Dashboard
        </h1>
        <ProfileDropdown />
      </div>

      {/* Face Registration Upload */}
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

        {/* Conditionally show name input only if face files selected */}
        {faceFiles.length > 0 && (
          <input
            type="text"
            placeholder="Enter name for face"
            value={faceName}
            onChange={(e) => setFaceName(e.target.value)}
            className="mb-4 w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none"
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

      {/* Video Upload Card */}
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

        {/* Show action buttons if a video is selected */}
        {videoFile && (
          <div className="flex gap-4">
            <button
              onClick={handleVideoAnalyze}
              disabled={isUploadingVideo}
              className={`bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center gap-2 ${
                isUploadingVideo ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isUploadingVideo && <Loader className="w-5 h-5 animate-spin" />}
              Analyze Video
            </button>
            <button
              onClick={() => {
                setVideoFile(null);
                if (videoInputRef.current) videoInputRef.current.value = null;
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

      {/* Output & Scene Analysis */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Output Preview */}
        <div className="flex-1 bg-[#0c1324] border border-orange-500 rounded-lg p-4">
          <div className="flex flex-row justify-between items-center">
            <h2 className="text-lg font-semibold mb-2 text-orange-400">
              Output Preview
            </h2>
            <button
              onClick={clearStream}
              className={`bg-orange-600 hover:bg-orange-700 px-4 py-2 mb-2 rounded flex items-center gap-2`}
            >
              Clear Preview
            </button>
          </div>

          <div className="w-full h-64 bg-gray-900 rounded flex items-center justify-center">
            {StreamURL ? (
              <img
                src={StreamURL}
                alt="Processed Output"
                className="max-h-full max-w-full rounded"
              />
            ) : (
              <span className="text-gray-500 text-sm">
                No output available yet.
              </span>
            )}
          </div>
        </div>

        {/* Scene Analysis */}
        <div className="flex-1 bg-[#0c1324] border border-orange-500 rounded-lg p-4">
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
