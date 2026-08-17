import { motion } from "framer-motion";
import { Card } from "../ui/Card";
import { ArrowRight, Smartphone, Video, Activity } from "lucide-react";

const GAMES = [
  {
    id: "tilt-basket",
    title: "Tilt Basket",
    description: "Tilt your phone and catch falling rewards.",
    input: "Phone Motion",
    icon: Smartphone,
    color: "bg-blue-500",
  },
  {
    id: "catch-diamond",
    title: "Catch the Diamond",
    description: "Move your hand and catch falling diamonds.",
    input: "Camera + Hand Tracking",
    icon: Video,
    color: "bg-purple-500",
  },
  {
    id: "jackpot-stop",
    title: "Jackpot Stop",
    description: "Stop the moving marker inside the jackpot zone.",
    input: "Phone Motion",
    icon: Activity,
    color: "bg-emerald-500",
  },
  {
    id: "pose-freeze",
    title: "Pose & Freeze",
    description: "Match the pose and freeze before time runs out.",
    input: "Camera + Body Tracking",
    icon: Video,
    color: "bg-rose-500",
  }
];

export function GameHub({ onSelectGame }) {
  return (
    <div className="flex-1 overflow-y-auto pb-12">
      <div className="bg-white px-6 pt-12 pb-8 border-b border-gray-100">
        <h2 className="text-xs font-bold tracking-widest text-indigo-600 uppercase mb-3">Play & Win</h2>
        <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-4 leading-[1.1]">
          PLAY.<br/>SCORE.<br/>WIN.
        </h1>
        <p className="text-gray-500 font-medium leading-relaxed max-w-[280px]">
          Interactive games designed to turn customer participation into memorable experiences.
        </p>
      </div>

      <div className="p-6 space-y-4">
        {GAMES.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className="p-5 cursor-pointer hover:shadow-md transition-shadow group border-gray-200/60"
              onClick={() => onSelectGame(game.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4 mb-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${game.color}`}>
                    <game.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{game.title}</h3>
                    <p className="text-xs font-medium text-gray-400 mt-0.5">{game.input}</p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{game.description}</p>
              
              <div className="flex items-center text-sm font-bold text-indigo-600">
                Play Now <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
