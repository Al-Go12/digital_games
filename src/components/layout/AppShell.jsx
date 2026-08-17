import { motion } from "framer-motion";

export function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      <div className="max-w-md mx-auto min-h-screen bg-white relative shadow-2xl sm:border-x sm:border-gray-200 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
