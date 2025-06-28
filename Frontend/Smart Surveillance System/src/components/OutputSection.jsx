// components/OutputSection.jsx
export default function OutputSection({
  uploadMode,
  processedImage,
  processedVideoUrl,
  sceneDescription,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-[#0c1324] border border-orange-500 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2 text-orange-400">
          Output Preview
        </h2>
        <div className="w-full h-64 bg-gray-900 rounded flex items-center justify-center">
          {uploadMode === "video" && processedVideoUrl ? (
            <video controls className="w-full max-h-64 rounded">
              <source src={processedVideoUrl} type="video/mp4" />
            </video>
          ) : processedImage ? (
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
  );
}
