'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Entity } from './Entity';
import { Entity as EntityType } from '@/types/entity';
import { getLayoutSpringConfig } from '@/utils/motionParams';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import ParticleBackground from './ParticleBackground';

interface EntityContainerProps {
  entities: EntityType[];
  containerWidth: number;
  containerHeight: number;
  onInteraction: (entityId: string, type: 'hover' | 'click' | 'drag', duration: number, startPos?: { x: number; y: number }, endPos?: { x: number; y: number }) => void;
  onInteractionStateChange: (entityId: string, state: 'idle' | 'active' | 'hovered' | 'ignored' | 'dismissed') => void;
  onPositionUpdate?: (entityId: string, x: number, y: number) => void;
}

export function EntityContainer({
  entities,
  containerWidth,
  containerHeight,
  onInteraction,
  onInteractionStateChange,
  onPositionUpdate,
}: EntityContainerProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null); // Store interval reference
  const prefersReducedMotion = useReducedMotion(); // Check motion preference

  useEffect(() => {
    // Set up interval (layout recalculation handled by parent)
    intervalRef.current = setInterval(() => {
      // Layout recalculation is handled by parent component
    }, 2000); // Every 2 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current); // Cleanup on unmount
      }
    };
  }, []);

  const layoutSpringConfig = getLayoutSpringConfig(entities, prefersReducedMotion); // Get spring config for layout transitions

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
        minWidth: '100%',
        minHeight: '100%',
        background: `linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #0f172a 70%, #1e1b4b 100%)`,
      }}
    >
      {/* Particle Network Background */}
      <ParticleBackground containerWidth={containerWidth} containerHeight={containerHeight} />
      {/* Animated grid pattern overlay with better visibility */}
      <motion.div 
        className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
        animate={{
          backgroundPosition: ['0 0', '50px 50px'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Animated particles/glow effects with pulsing */}
      <div className="absolute inset-0 pointer-events-none">
        {entities.filter(e => e.interactionHistory.frequency > 2).map((entity) => (
          <motion.div
            key={`glow-${entity.id}`}
            className="absolute rounded-full blur-2xl"
            style={{
              left: entity.targetPosition.x,
              top: entity.targetPosition.y,
              width: entity.visualState.size * 2.5,
              height: entity.visualState.size * 2.5,
              background: `radial-gradient(circle, ${entity.visualState.color}50 0%, ${entity.visualState.color}20 40%, transparent 70%)`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 0.9, 0.6],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Interactive entities overlay - positioned on top of 3D scene */}
      <div className="absolute inset-0 pointer-events-none">
        <AnimatePresence>
          {entities.map((entity) => (
            <div key={entity.id} className="pointer-events-auto">
              <Entity
                entity={entity}
                containerWidth={containerWidth}
                containerHeight={containerHeight}
                onInteraction={onInteraction}
                onInteractionStateChange={onInteractionStateChange}
                onPositionUpdate={onPositionUpdate}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Enhanced debug overlay with better styling - responsive */}
      <motion.div 
        className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-gradient-to-br from-black/70 via-gray-900/70 to-black/70 backdrop-blur-md text-white text-[10px] sm:text-xs rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 border border-white/20 shadow-2xl z-40 pointer-events-none"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="font-bold mb-1.5 sm:mb-2 text-[10px] sm:text-xs text-purple-300 uppercase tracking-wider">System Status</div>
        <div className="space-y-1">
          <div className="text-gray-300 text-[10px] sm:text-xs">
            Entities: <span className="font-mono font-semibold text-blue-400">{entities.length}</span>
          </div>
          <div className="text-gray-300 text-[10px] sm:text-xs">
            Spring: <span className="font-mono font-semibold text-white">s={layoutSpringConfig.stiffness.toFixed(0)}</span> | 
            <span className="font-mono font-semibold text-white"> d={layoutSpringConfig.damping.toFixed(0)}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
