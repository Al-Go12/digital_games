import { Button } from "../ui/Button";
import { ArrowLeft } from "lucide-react";

export function GameHeader({ title, onExit }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <Button variant="ghost" size="icon" onClick={onExit} aria-label="Exit Game">
        <ArrowLeft className="w-6 h-6" />
      </Button>
      <h2 className="text-xl font-bold tracking-tight text-gray-900">{title}</h2>
      <div className="w-10"></div> {/* Spacer for alignment */}
    </div>
  );
}
