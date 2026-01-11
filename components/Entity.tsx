'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { Entity as EntityType } from '@/types/entity';
import { getSpringConfig } from '@/utils/motionParams';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface EntityProps {
  entity: EntityType;
  containerWidth: number;
  containerHeight: number;
  onInteraction: (entityId: string, type: 'hover' | 'click' | 'drag', duration: number, startPos?: { x: number; y: number }, endPos?: { x: number; y: number }) => void;
  onInteractionStateChange: (entityId: string, state: 'idle' | 'active' | 'hovered' | 'ignored' | 'dismissed') => void;
  onPositionUpdate?: (entityId: string, x: number, y: number) => void;
}

export function Entity({ entity, containerWidth, containerHeight, onInteraction, onInteractionStateChange, onPositionUpdate }: EntityProps) {
  const [isHovered, setIsHovered] = useState(false); // Track if entity is currently hovered
  const hoverStartTimeRef = useRef<number | null>(null); // Store when hover started (for duration)
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null); // Store drag start position
  const dragStartTimeRef = useRef<number | null>(null); // Store when drag started (for duration)
  const prefersReducedMotion = useReducedMotion(); // Check user's motion preference (accessibility)

  const springConfig = getSpringConfig(entity.interactionHistory, prefersReducedMotion); // Get spring params based on interaction history
  
  // Motion values for position - target values that entity animates toward
  const x = useMotionValue(entity.targetPosition.x);
  const y = useMotionValue(entity.targetPosition.y);
  
  // Spring animations - creates smooth physics-based motion from current to target position
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  // Update motion values when target position changes (e.g., from layout recalculation)
  useEffect(() => {
    x.set(entity.targetPosition.x); // Update x target position
    y.set(entity.targetPosition.y); // Update y target position
  }, [entity.targetPosition.x, entity.targetPosition.y, x, y]);

  // Motion values for visual properties
  const baseScale = useMotionValue(entity.visualState.size / 100); // Base size (0-1 scale, size is 0-100)
  const opacity = useMotionValue(entity.visualState.opacity); // Opacity (0-1)
  const interactiveScale = useMotionValue(1); // Extra scale multiplier for hover/active states
  
  // Combine base scale with interactive scale (base * interactive = final)
  const finalScale = useTransform([baseScale, interactiveScale], ([base, interactive]: number[]) => base * interactive);

  // Update base scale when entity size property changes
  useEffect(() => {
    baseScale.set(entity.visualState.size / 100); // Convert size (0-100) to scale (0-1)
  }, [entity.visualState.size, baseScale]);

  // Update opacity when entity opacity property changes
  useEffect(() => {
    opacity.set(entity.visualState.opacity);
  }, [entity.visualState.opacity, opacity]);

  // Update interactive scale based on interaction state (adds visual feedback)
  useEffect(() => {
    if (entity.interactionState === 'active') {
      interactiveScale.set(1.2); // 20% larger when active (dragging)
    } else if (isHovered) {
      interactiveScale.set(1.1); // 10% larger when hovered
    } else {
      interactiveScale.set(1); // Normal size when idle
    }
  }, [entity.interactionState, isHovered, interactiveScale]);

  const handleMouseEnter = () => {
    setIsHovered(true); // Mark as hovered for visual feedback
    hoverStartTimeRef.current = Date.now(); // Record start time for duration calculation
    onInteractionStateChange(entity.id, 'hovered'); // Notify parent component
  };

  const handleMouseLeave = () => {
    const duration = hoverStartTimeRef.current ? Date.now() - hoverStartTimeRef.current : 0; // Calculate hover duration
    setIsHovered(false);
    hoverStartTimeRef.current = null;
    
    if (duration > 0) {
      onInteraction(entity.id, 'hover', duration); // Report hover interaction with duration
    }
    
    onInteractionStateChange(entity.id, 'idle'); // Return to idle state
  };

  const handleClick = () => {
    const duration = hoverStartTimeRef.current ? Date.now() - hoverStartTimeRef.current : 0; // Get hover duration if existed
    onInteraction(entity.id, 'click', duration); // Report click interaction
    onInteractionStateChange(entity.id, 'active'); // Show active state
    
    setTimeout(() => {
      onInteractionStateChange(entity.id, 'idle'); // Return to idle after 300ms
    }, 300);
  };

  const handleDragStart = () => {
    dragStartPosRef.current = { x: entity.targetPosition.x, y: entity.targetPosition.y }; // Store starting position
    dragStartTimeRef.current = Date.now(); // Store start time for duration
    onInteractionStateChange(entity.id, 'active'); // Show active state
  };

  const handleDrag = (_event: any, info: { offset: { x: number; y: number } }) => {
    if (!dragStartPosRef.current) return;
    
    // Calculate new position from drag START position + offset, constrained to container bounds
    const newX = Math.max(0, Math.min(containerWidth - entity.visualState.size, dragStartPosRef.current.x + info.offset.x));
    const newY = Math.max(0, Math.min(containerHeight - entity.visualState.size, dragStartPosRef.current.y + info.offset.y));
    
    if (onPositionUpdate) {
      onPositionUpdate(entity.id, newX, newY); // Update position in parent state
    }
  };

  const handleDragEnd = (_event: any, info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }) => {
    if (!dragStartPosRef.current) return;
    
    const duration = dragStartTimeRef.current ? Date.now() - dragStartTimeRef.current : 0; // Calculate drag duration
    // Calculate final position from drag START position + offset (constrained to container bounds)
    const finalX = Math.max(0, Math.min(containerWidth - entity.visualState.size, dragStartPosRef.current.x + info.offset.x));
    const finalY = Math.max(0, Math.min(containerHeight - entity.visualState.size, dragStartPosRef.current.y + info.offset.y));
    const endPos = { x: finalX, y: finalY };
    
    const velocity = Math.sqrt(info.velocity.x ** 2 + info.velocity.y ** 2); // Calculate total velocity magnitude
    
    if (onPositionUpdate) {
      onPositionUpdate(entity.id, finalX, finalY); // Update final position
    }
    
    onInteraction(entity.id, 'drag', duration, dragStartPosRef.current || undefined, endPos); // Report drag with data
    onInteractionStateChange(entity.id, 'idle'); // Return to idle
    
    dragStartPosRef.current = null; // Clear drag data
    dragStartTimeRef.current = null;
  };

  const renderShape = () => {
    // Create gradient from entity color with more vibrant effects
    const colorLight = entity.visualState.color;
    const colorDark = entity.visualState.color + 'dd'; // Slightly darker for gradient
    
    const commonStyle = {
      width: '100%', // Fill container
      height: '100%', // Fill container
      background: `linear-gradient(135deg, ${colorLight}ff 0%, ${colorLight}dd 50%, ${colorDark} 100%)`, // Enhanced gradient
      boxShadow: isActive 
        ? `inset 0 3px 6px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2), 0 0 30px ${entity.visualState.color}60, 0 4px 12px rgba(0, 0, 0, 0.4)`
        : `inset 0 2px 4px rgba(255, 255, 255, 0.15), inset 0 -2px 4px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)`,
      border: isActive ? `1px solid ${entity.visualState.color}80` : '1px solid rgba(255, 255, 255, 0.1)',
    };

    switch (entity.visualState.shape) {
      case 'square':
        return <div style={commonStyle} className="rounded-lg" />; // Square with rounded corners
      case 'hexagon':
        return (
          <div
            style={{ ...commonStyle, clipPath: "polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)" }}
            className="rounded-lg"
          />
        );
      case 'circle':
      default:
        return <div style={commonStyle} className="rounded-full" />; // Perfect circle
    }
  };

  // Calculate glow intensity based on interaction frequency
  const glowIntensity = Math.min(1, entity.interactionHistory.frequency / 10);
  const isActive = entity.interactionState === 'active' || entity.interactionState === 'hovered';

  return (
    <motion.div
      style={{
        x: springX, // Animated x position from spring
        y: springY, // Animated y position from spring
        scale: finalScale, // Combined scale (base * interactive)
        opacity, // Opacity from motion value
        position: 'absolute', // Absolute positioning
        width: `${entity.visualState.size}px`, // Entity width
        height: `${entity.visualState.size}px`, // Entity height
        left: 0, // Position anchor
        top: 0, // Position anchor
        cursor: 'pointer', // Show pointer cursor
        zIndex: entity.interactionState === 'active' ? 10 : 1, // Active entities on top
        filter: isActive ? `drop-shadow(0 0 ${8 + glowIntensity * 12}px ${entity.visualState.color}80)` : 'none',
        touchAction: 'none', // Prevent default touch behavior for better drag on mobile
      }}
      drag // Enable drag functionality
      dragMomentum={false} // Disable momentum after drag (no inertia)
      dragElastic={0} // No elastic bounce (we handle bounds manually)
      onDragStart={handleDragStart} // When drag starts
      onDrag={handleDrag} // While dragging (continuous)
      onDragEnd={handleDragEnd} // When drag ends
      onMouseEnter={handleMouseEnter} // Mouse enters entity
      onMouseLeave={handleMouseLeave} // Mouse leaves entity
      onClick={handleClick} // Entity clicked
      whileHover={{ scale: 1.1 }} // 10% larger on hover (multiplier applied to finalScale)
      whileTap={{ scale: 0.95 }} // 5% smaller on tap (press feedback)
      transition={{
        type: 'spring', // Use spring physics
        ...springConfig, // Spring parameters (stiffness, damping, mass)
      }}
    >
      <div className="relative w-full h-full">
        {/* Glow ring for active/high-frequency entities */}
        {(isActive || entity.interactionHistory.frequency > 3) && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: `2px solid ${entity.visualState.color}`,
              opacity: 0.6,
              boxShadow: `0 0 ${10 + glowIntensity * 15}px ${entity.visualState.color}`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 0.3, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
        {renderShape()} {/* Render the shape (circle/square/hexagon) */}
        {entity.interactionHistory.frequency > 0 && ( // Show badge if entity has interactions
          <motion.div
            className="absolute -top-2 -right-2 bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-400 text-white text-xs font-black rounded-full w-7 h-7 flex items-center justify-center shadow-xl border-2 border-white/30"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            whileHover={{ scale: 1.2, rotate: 360 }}
            style={{
              boxShadow: `0 0 20px rgba(251, 191, 36, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)`,
            }}
          >
            {entity.interactionHistory.frequency} {/* Display interaction frequency */}
          </motion.div>
        )}
        {/* Velocity indicator for fast interactions */}
        {entity.interactionHistory.averageVelocity > 500 && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-yellow-400 rounded-full animate-pulse" />
        )}
      </div>
    </motion.div>
  );
}
