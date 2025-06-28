// components/UploadSection.jsx
export default function UploadSection({
  uploadMode,
  setUploadMode,
  uploadedFiles,
  setUploadedFiles,
  onUpload,
}) {
  return (
    <div className="bg-[#0c1324] border border-orange-500 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-orange-400 mb-3">
        Upload File
      </h2>

      <select
        className="mb-4 bg-gray-800 text-white border border-orange-500 p-2 rounded"
        value={uploadMode}
        onChange={(e) => setUploadMode(e.target.value)}
      >
        <option value="face">Register Face (1-3 Images)</option>
        <option value="video">Analyze Video</option>
      </select>

      <input
        type="file"
        multiple={uploadMode === "face"}
        accept={uploadMode === "face" ? "image/*" : "video/*"}
        onChange={(e) => setUploadedFiles(e.target.files)}
        className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-orange-600 file:text-white hover:file:bg-orange-700"
      />
      {uploadedFiles && (
        <p className="mt-2 text-sm text-gray-400">
          {uploadMode === "face"
            ? `${uploadedFiles.length} image(s) ready`
            : `File ready: ${uploadedFiles[0]?.name}`}
        </p>
      )}

      <button
        onClick={onUpload}
        className="mt-4 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
      >
        Upload
      </button>
    </div>
  );
}
