// OutputSection.jsx
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "react-toastify";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useState, useEffect, useRef } from "react";

export default function OutputSection({
  outputCardVariants,
  StreamURL,
  setAnalysisMode,
  setStreamURL,
  onSummaryDetection,
}) {
  const socketRef = useRef(null);
  const [logs, setLogs] = useState([]);
  const [fire, setFire] = useState(0);
  const [smoke, setSmoke] = useState(0);
  const [faces, setFaces] = useState(0);
  const [faceList, setFaceList] = useState([]);

  useEffect(() => {
    const access_token = sessionStorage.getItem("access_token");
    if (!access_token || access_token.split(".").length !== 3) {
      console.error("❌ Invalid or missing access token");
      return;
    }

    const url = "ws://localhost:8000/auth/ws/summary?token=" + access_token;
    socketRef.current = new WebSocket(url);

    socketRef.current.onopen = () => {
      console.log("WebSocket connected ✅");
    };

    socketRef.current.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const { type, data: rawData } = parsed;
        const data =
          type === "stats"
            ? typeof rawData === "string"
              ? JSON.parse(rawData)
              : rawData
            : rawData;
        console.log(data);
        if (type === "stats" && data.total_frames > 0) {
          const {
            total_frames,
            fire_frames,
            smoke_frames,
            face_frames,
            known_faces_set = [],
          } = data;

          // Push raw log for display
          //setLogs((prev) => [...prev, JSON.stringify(data)]);

          const fire = Math.round((fire_frames / total_frames) * 100);
          const smoke = Math.round((smoke_frames / total_frames) * 100);
          const faces = Math.round((face_frames / total_frames) * 100);

          setFire(fire);
          setSmoke(smoke);
          setFaces(faces);
          setFaceList(known_faces_set);
        } else {
          onSummaryDetection((prev) => [...prev, data]);
        }
      } catch (err) {
        console.error("❌ Error parsing WebSocket data:", err);
      }
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket closed ❌");
    };

    return () => {
      socketRef.current?.close();
    };
  }, []);
  const percentage = 66; // Replace with real values later

  const clearStream = async () => {
    try {
      await axios.post(
        "http://localhost:8000/auth/stop_stream",
        {},
        { withCredentials: true }
      );
      setStreamURL(null);
      setAnalysisMode(false);
      setFire(0);
      setSmoke(0);
      setFaces(0);
      setFaceList([]);
      onSummaryDetection([]);
      toast.info("Stream cleared.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to stop stream.");
    }
  };

  return (
    <motion.div
      key="outputPreviewCard"
      variants={outputCardVariants}
      className="flex-1 bg-[#0c1324] border border-orange-500 rounded-lg p-4"
    >
      <div className="flex flex-col justify-between items-center">
        <h2 className="text-lg font-semibold mb-2 text-orange-400">
          Output Preview
        </h2>
        <button
          onClick={clearStream}
          className="bg-orange-600 hover:bg-orange-700 px-4 py-2 mb-2 rounded flex items-center gap-2"
        >
          Clear Preview
        </button>
      </div>

      <div className="w-full bg-gray-900 rounded flex items-center justify-between gap-4 p-4">
        {StreamURL ? (
          <>
            {/* Image Preview */}
            <img
              src={StreamURL}
              alt="Processed Output"
              className="rounded object-contain w-2/3 max-h-[400px]"
            />

            {/* Right Column */}
            <div className="flex flex-row gap-4 w-1/3 h-full">
              {/* Dials */}
              <div className="flex flex-col justify-around items-center gap-4 flex-1">
                {[
                  { label: "Fire", value: fire },
                  { label: "Smoke", value: smoke },
                  { label: "Faces", value: faces },
                ].map(({ label, value }, idx) => (
                  <div
                    className="w-24 h-24 flex flex-col items-center"
                    key={idx}
                  >
                    <CircularProgressbar
                      value={value}
                      text={`${value}%`}
                      styles={buildStyles({
                        pathColor:
                          idx === 0
                            ? `rgba(255, 0, 0)`
                            : idx === 1
                            ? `rgba(0, 0, 255)`
                            : `rgba(0, 255, 0)`,
                        textColor: "#fff",
                        trailColor:
                          idx === 0
                            ? "#330000"
                            : idx === 1
                            ? "#001f3f"
                            : "#003300",
                      })}
                    />
                    <p className="text-sm text-gray-300 mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* Face List */}
              <div className="flex-1 overflow-y-auto bg-[#121826] rounded p-2 max-h-[400px] border border-orange-500">
                <h3 className="text-sm font-semibold text-orange-400 mb-2">
                  Known Faces
                </h3>
                {/* This will be dynamically rendered later */}
                {faceList?.length ? (
                  <ul className="space-y-1 text-sm text-gray-200">
                    {faceList.map((name, i) => (
                      <li
                        key={i}
                        className="px-2 py-1 bg-gray-800 rounded hover:bg-gray-700"
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500">
                    No known faces detected.
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <span className="text-gray-500 text-sm">
            No output available yet.
          </span>
        )}
      </div>
    </motion.div>
  );
}
