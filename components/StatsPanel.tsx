'use client';

import { Entity } from '@/types/entity';
import { motion } from 'framer-motion';

interface StatsPanelProps {
  entities: Entity[];
}

export function StatsPanel({ entities }: StatsPanelProps) {
  // Calculate aggregate statistics
  const totalInteractions = entities.reduce((sum, e) => sum + e.interactionHistory.interactionCount, 0);
  const activeEntities = entities.filter(e => e.interactionHistory.frequency > 0).length;
  const avgVelocity = entities.reduce((sum, e) => sum + e.interactionHistory.averageVelocity, 0) / entities.length || 0;
  const mostActiveEntity = entities.reduce((max, e) => 
    e.interactionHistory.frequency > max.interactionHistory.frequency ? e : max, entities[0]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-gradient-to-br from-gray-900/40 via-black/30 to-gray-900/40 backdrop-blur-md text-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/10 shadow-2xl min-w-[220px] sm:min-w-[260px] max-w-[260px] sm:max-w-[300px] pointer-events-auto relative overflow-hidden"
      style={{
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(147, 51, 234, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/3 via-transparent to-blue-500/3 pointer-events-none" />
      
      <div className="relative z-10">
        <h3 className="text-xs sm:text-sm font-black mb-3 sm:mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300 uppercase tracking-wider flex items-center gap-2">
          <span className="w-1 h-4 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full"></span>
          Interaction Stats
        </h3>
      
        <div className="space-y-2.5 sm:space-y-3">
          <motion.div 
            className="flex justify-between items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            whileHover={{ x: 4 }}
          >
            <span className="text-gray-300 text-[11px] sm:text-xs font-medium">Total Interactions</span>
            <span className="text-white font-mono font-bold text-sm sm:text-base bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {totalInteractions}
            </span>
          </motion.div>
          
          <motion.div 
            className="flex justify-between items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            whileHover={{ x: 4 }}
          >
            <span className="text-gray-300 text-[11px] sm:text-xs font-medium">Active Entities</span>
            <span className="text-white font-mono font-bold text-sm sm:text-base">
              <span className="text-green-400">{activeEntities}</span>
              <span className="text-gray-500">/{entities.length}</span>
            </span>
          </motion.div>
          
          <motion.div 
            className="flex justify-between items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            whileHover={{ x: 4 }}
          >
            <span className="text-gray-300 text-[11px] sm:text-xs font-medium">Avg Velocity</span>
            <span className="text-white font-mono font-bold text-sm sm:text-base text-yellow-400">
              {avgVelocity.toFixed(0)} px/s
            </span>
          </motion.div>
          
          {mostActiveEntity && mostActiveEntity.interactionHistory.frequency > 0 && (
            <motion.div 
              className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-[11px] sm:text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">Most Active</div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                <motion.div
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full flex-shrink-0 shadow-lg"
                  style={{ 
                    backgroundColor: mostActiveEntity.visualState.color,
                    boxShadow: `0 0 12px ${mostActiveEntity.visualState.color}80`,
                  }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-white text-[11px] sm:text-xs font-mono truncate font-semibold">
                  {mostActiveEntity.id} <span className="text-purple-300">({mostActiveEntity.interactionHistory.frequency}x)</span>
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
