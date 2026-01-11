'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { EntityContainer } from '@/components/EntityContainer';
import { useEntityState } from '@/hooks/useEntityState';
import { StatsPanel } from '@/components/StatsPanel';

export default function Home() {
  // Client-side mount check to prevent hydration mismatches
  const [isMounted, setIsMounted] = useState(false);
  
  // Container dimensions (initialize with default values)
  const [containerSize, setContainerSize] = useState({
    width: 1200,
    height: 800,
  });

  // Get entity state management functions
  const {
    entities,
    updateInteractionState,
    handleEntityInteraction,
    updateTargetPosition,
    recalculateLayout,
  } = useEntityState(containerSize.width, containerSize.height, 15); // 15 entities

  // Handle window resize and set initial size with responsive calculations
  useEffect(() => {
    // Set mounted state
    setIsMounted(true);
    
    const updateSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Responsive height calculation (more space on mobile for content)
      const heightOffset = width < 768 ? 320 : width < 1024 ? 250 : 200;
      
      // Calculate container width (accounting for padding and max-width)
      const maxContentWidth = Math.min(1280, width - 32); // 32px for padding
      const contentWidth = width < 640 ? width - 32 : maxContentWidth; // Mobile has more padding
      
      setContainerSize({
        width: Math.max(320, contentWidth), // Minimum width
        height: Math.max(400, height - heightOffset), // Minimum height
      });
    };

    updateSize(); // Set initial size
    window.addEventListener('resize', updateSize); // Listen for resize events
    return () => window.removeEventListener('resize', updateSize); // Cleanup listener
  }, []);

  // Periodically recalculate layout based on interactions (entities move over time)
  useEffect(() => {
    const interval = setInterval(() => {
      recalculateLayout(); // Move entities toward center/edges based on interaction
    }, 3000); // Every 3 seconds

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [recalculateLayout]);

  // Calculate responsive dimensions based on container size
  const isMobile = containerSize.width < 768;
  const isTablet = containerSize.width < 1024;
  const containerPadding = isMobile ? 16 : isTablet ? 32 : 64;
  const heightOffset = isMobile ? 320 : isTablet ? 250 : 200;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 relative overflow-x-hidden pb-8">
      {/* Animated background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 animate-pulse pointer-events-none" />

      <div className="w-full flex flex-col items-center justify-start relative z-10 px-2 sm:px-4 pt-2 sm:pt-4 md:pt-6">
        {/* Living Interface Title - Outside Frame */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-3 sm:mb-4 text-center px-2 sm:px-4 w-full relative"
        >
          <div className="absolute inset-0 -z-10 mx-auto w-[90%] sm:w-[480px] md:w-[600px] max-w-[600px] h-[90px] sm:h-[110px] md:h-[130px] bg-black/50 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] border-2 border-white/20 shadow-2xl" 
            style={{
              boxShadow: '0 0 40px rgba(138,43,226,0.3), 0 20px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
          />
          <div 
            className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-2 sm:mb-3 text-white"
            style={{
              textShadow: '0 2px 10px rgba(0,0,0,0.8)',
              letterSpacing: '0.02em',
            }}
          >
            Living Interface
          </div>
          <div className="text-xs sm:text-base md:text-lg lg:text-xl text-white font-bold px-2 sm:px-4"
            style={{
              filter: 'drop-shadow(0 3px 12px rgba(0,0,0,1)) drop-shadow(0 0 25px rgba(138,43,226,0.5))',
              textShadow: '0 3px 10px rgba(0,0,0,1), 0 0 20px rgba(138,43,226,0.6), 0 1px 2px rgba(255,255,255,0.2)',
              letterSpacing: '0.015em',
            }}
          >
            An adaptive interface where entities respond to your behavior. <span className="text-cyan-400 font-black" style={{ textShadow: '0 0 15px rgba(34,211,238,1), 0 0 8px rgba(34,211,238,0.8)' }}>Hover</span>, <span className="text-purple-400 font-black" style={{ textShadow: '0 0 15px rgba(168,85,247,1), 0 0 8px rgba(168,85,247,0.8)' }}>click</span>, and <span className="text-pink-400 font-black" style={{ textShadow: '0 0 15px rgba(236,72,153,1), 0 0 8px rgba(236,72,153,0.8)' }}>drag</span> to watch them evolve.
          </div>
        </motion.div>

        {/* Enhanced container with glow effect - responsive */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-white/30 relative w-full bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 backdrop-blur-xl"
          style={{ 
            width: isMobile ? 'calc(100% - 16px)' : 'calc(100% - 32px)',
            maxWidth: '1280px',
            height: isMobile ? '400px' : isTablet ? '500px' : '600px',
            minHeight: '350px',
            maxHeight: isMobile ? '50vh' : '65vh',
            boxShadow: `
              0 25px 80px rgba(0, 0, 0, 0.6),
              0 0 60px rgba(59, 130, 246, 0.15),
              0 0 100px rgba(147, 51, 234, 0.1),
              inset 0 0 120px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
          }}
        >
          {/* Animated border glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl sm:rounded-3xl blur-xl opacity-50 animate-pulse -z-10" />
          {/* Inner container with overflow hidden for entities */}
          <div className="absolute inset-0 rounded-xl sm:rounded-2xl overflow-hidden">
            {isMounted && (
              <EntityContainer
                entities={entities}
                containerWidth={Math.max(300, containerSize.width - containerPadding)}
                containerHeight={Math.max(500, containerSize.height - 220)}
                onInteraction={handleEntityInteraction}
                onInteractionStateChange={updateInteractionState}
                onPositionUpdate={updateTargetPosition}
              />
            )}
          </div>
        </motion.div>

        {/* Stats panel - positioned at bottom-right corner */}
        <div className="absolute bottom-6 sm:bottom-8 md:bottom-12 right-2 sm:right-4 z-50">
          <StatsPanel entities={entities} />
        </div>
        
        {/* Enhanced instructions - responsive with better styling */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: -20 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-4 sm:mt-6 md:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 text-center w-full max-w-6xl"
          style={{ marginBottom: '20px' }}
        >
          <motion.div 
            className="group bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-transparent backdrop-blur-md rounded-xl p-4 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 relative overflow-hidden"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="text-blue-400 font-bold text-sm sm:text-base mb-2 flex items-center justify-center gap-2">
                <span className="text-blue-500">⚡</span> Center Focus
              </div>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">Active entities move toward center</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="group bg-gradient-to-br from-purple-500/10 via-purple-600/5 to-transparent backdrop-blur-md rounded-xl p-4 border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 relative overflow-hidden"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="text-purple-400 font-bold text-sm sm:text-base mb-2 flex items-center justify-center gap-2">
                <span className="text-purple-500">📈</span> Growth
              </div>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">Frequent interactions increase size</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="group bg-gradient-to-br from-pink-500/10 via-pink-600/5 to-transparent backdrop-blur-md rounded-xl p-4 border border-pink-500/20 hover:border-pink-400/40 transition-all duration-300 relative overflow-hidden"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="text-pink-400 font-bold text-sm sm:text-base mb-2 flex items-center justify-center gap-2">
                <span className="text-pink-500">🌀</span> Spring Physics
              </div>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">Fast gestures create stiffer springs</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="group bg-gradient-to-br from-yellow-500/10 via-yellow-600/5 to-transparent backdrop-blur-md rounded-xl p-4 border border-yellow-500/20 hover:border-yellow-400/40 transition-all duration-300 relative overflow-hidden"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="text-yellow-400 font-bold text-sm sm:text-base mb-2 flex items-center justify-center gap-2">
                <span className="text-yellow-500">🧠</span> Adaptive
              </div>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">Interface learns from behavior</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
