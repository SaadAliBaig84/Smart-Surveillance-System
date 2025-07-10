import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AnalysisViewer({ summaryData }) {
  // Auto-scroll to bottom on update
  const containerRef = useRef(null);
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  return (
    <div
      className="bg-[#0c1324] border border-orange-500 rounded-lg p-4 h-64 overflow-y-auto text-white"
      ref={containerRef}
    >
      <h2 className="text-orange-400 font-semibold mb-2 text-lg">
        Surveillance Summary
      </h2>

      <ul className="space-y-1 text-sm">
        <AnimatePresence initial={false}>
          {summaryData.map((line, idx) => (
            <motion.li
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-800 p-2 rounded shadow-sm border-l-4 border-orange-500"
            >
              {line}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
