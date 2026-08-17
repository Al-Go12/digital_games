import { motion } from "framer-motion";
import { cn } from "./utils";

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
