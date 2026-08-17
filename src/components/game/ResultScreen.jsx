import { motion } from "framer-motion";
import { Button } from "../ui/Button";

export function ResultScreen({ score, reward, onReplay, onExit }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm w-full"
      >
        <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">Time's Up!</h2>
        <p className="text-gray-500 mb-8">Let's see how you did</p>
        
        <div className="bg-indigo-50 rounded-2xl p-6 mb-8 border border-indigo-100">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-2">Total Score</p>
          <motion.p 
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.3 }}
            className="text-6xl font-black text-indigo-900"
          >
            {score}
          </motion.p>
        </div>

        {reward && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 mb-8 shadow-xl text-white"
          >
            <p className="text-sm font-semibold text-orange-100 uppercase tracking-widest mb-1">{reward.message}</p>
            <p className="text-3xl font-black">{reward.label}</p>
          </motion.div>
        )}

        <div className="space-y-3">
          <Button variant="primary" className="w-full" onClick={onReplay}>
            Play Again
          </Button>
          <Button variant="secondary" className="w-full" onClick={onExit}>
            Back to Hub
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
