import { motion } from "framer-motion";

export function AppShell({ children }) {
  return (
    <div className="h-[100dvh] w-full bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden flex flex-col">
      <div className="max-w-md w-full mx-auto h-full bg-white relative shadow-2xl sm:border-x sm:border-gray-200 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
