import { useState, useCallback, useMemo } from 'react';
import { Entity, EntityId, InteractionState, VisualState } from '@/types/entity';
import { useInteractionTracking } from './useInteractionTracking';

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

const SHAPES: VisualState['shape'][] = ['circle', 'square', 'hexagon'];

// Creates a new entity with random initial properties
function createInitialEntity(id: EntityId, index: number, containerWidth: number, containerHeight: number): Entity {
  // Responsive size: smaller on mobile, normal on desktop
  const isMobile = containerWidth < 768;
  const baseSize = isMobile ? 40 : 60;
  const sizeRange = isMobile ? 30 : 40;
  
  return {
    id,
    visualState: {
      size: baseSize + Math.random() * sizeRange, // Responsive size: 40-70px on mobile, 60-100px on desktop
      color: COLORS[index % COLORS.length], // Cycle through colors
      opacity: 0.7 + Math.random() * 0.3, // Random opacity 0.7-1.0
      shape: SHAPES[index % SHAPES.length], // Cycle through shapes
    },
    interactionState: 'idle', // Start in idle state
    interactionHistory: {
      frequency: 0, // No interactions yet
      totalDuration: 0,
      lastInteractionTime: 0,
      averageVelocity: 0,
      interactionCount: 0,
    },
    position: {
      x: Math.random() * containerWidth, // Random x position
      y: Math.random() * containerHeight, // Random y position
    },
    targetPosition: {
      x: Math.random() * containerWidth, // Random target x (where entity will animate to)
      y: Math.random() * containerHeight, // Random target y
    },
    createdAt: Date.now(), // Creation timestamp
  };
}

export function useEntityState(containerWidth: number, containerHeight: number, entityCount: number = 15) {
  // Clamp to spec range 10-20 and keep deterministic IDs per index
  const normalizedCount = Math.max(10, Math.min(20, entityCount));

  // Initialize entities array with random positions and properties
  const [entities, setEntities] = useState<Entity[]>(() => {
    return Array.from({ length: normalizedCount }, (_, i) =>
      createInitialEntity(`entity-${i}`, i, containerWidth, containerHeight)
    );
  });

  const { trackInteraction, getInteractionHistory } = useInteractionTracking(); // Get interaction tracking functions

  // Update specific entity's properties
  const updateEntityState = useCallback((entityId: EntityId, updates: Partial<Entity>) => {
    setEntities(prev => prev.map(entity =>
      entity.id === entityId ? { ...entity, ...updates } : entity // Merge updates into matching entity
    ));
  }, []);

  // Update only the interaction state of an entity
  const updateInteractionState = useCallback((entityId: EntityId, state: InteractionState) => {
    updateEntityState(entityId, { interactionState: state });
  }, [updateEntityState]);

  // Handle user interaction with entity and update its visual state
  const handleEntityInteraction = useCallback((
    entityId: EntityId,
    type: 'hover' | 'click' | 'drag',
    duration: number = 0,
    startPos?: { x: number; y: number },
    endPos?: { x: number; y: number }
  ) => {
    trackInteraction(entityId, duration, startPos, endPos); // Record interaction in history
    
    const history = getInteractionHistory(entityId); // Get updated interaction history
    updateEntityState(entityId, { interactionHistory: history }); // Update entity with new history

    const entity = entities.find(e => e.id === entityId); // Find the entity
    if (!entity) return;

    const newVisualState: Partial<VisualState> = {}; // Prepare visual state changes
    const timeSinceLastInteraction = Date.now() - history.lastInteractionTime;

    // Frequency-driven growth & opacity lift
    if (history.frequency > 3) {
      newVisualState.size = Math.min(130, entity.visualState.size + 12);
      newVisualState.opacity = Math.min(1, entity.visualState.opacity + 0.12);
    }

    // Velocity-driven punch (more energetic gestures = bigger visual presence)
    if (history.averageVelocity > 600) {
      newVisualState.size = Math.min(135, (newVisualState.size ?? entity.visualState.size) + 6);
      newVisualState.opacity = Math.min(1, (newVisualState.opacity ?? entity.visualState.opacity) + 0.05);
    }

    // Long hover soft glow vs. short tap
    if (type === 'hover' && duration > 1200) {
      newVisualState.opacity = Math.min(1, (newVisualState.opacity ?? entity.visualState.opacity) + 0.08);
    } else if (type === 'click' && duration < 400) {
      newVisualState.size = Math.min(140, (newVisualState.size ?? entity.visualState.size) + 4);
    }

    // Ignored entities (no interaction for 10-15s) decay
    if (timeSinceLastInteraction > 10000 && history.frequency === 0) {
      newVisualState.size = Math.max(36, (newVisualState.size ?? entity.visualState.size) - 8);
      newVisualState.opacity = Math.max(0.25, (newVisualState.opacity ?? entity.visualState.opacity) - 0.08);
    }
    if (timeSinceLastInteraction > 15000 && history.frequency === 0) {
      newVisualState.opacity = Math.max(0.18, (newVisualState.opacity ?? entity.visualState.opacity) - 0.12);
    }

    updateEntityState(entityId, {
      visualState: { ...entity.visualState, ...newVisualState }, // Apply visual changes
    });
  }, [entities, trackInteraction, getInteractionHistory, updateEntityState]);

  // Update entity's target position (where it will animate to)
  const updateTargetPosition = useCallback((entityId: EntityId, x: number, y: number) => {
    updateEntityState(entityId, { 
      targetPosition: { x, y },
      lastDragTime: Date.now() // Record when entity was manually dragged
    });
  }, [updateEntityState]);

  // Recalculate layout: move entities based on interaction history
  const recalculateLayout = useCallback(() => {
    setEntities(prev => {
      const now = Date.now();
      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;
      const maxRadius = Math.max(120, Math.min(containerWidth, containerHeight) / 2 - 80);

      // Precompute histories to reuse in force calculations
      const histories = prev.map(entity => ({ entity, history: getInteractionHistory(entity.id) }));
      const activeEntities = histories.filter(({ entity, history }) => history.frequency > 0 || entity.interactionState === 'active');

      const updated = prev.map((entity, idx) => {
        const { history } = histories[idx];
        const timeSinceLastInteraction = now - history.lastInteractionTime;

        // Skip recently dragged entities (within 10 seconds) to preserve manual positioning
        const timeSinceLastDrag = entity.lastDragTime ? now - entity.lastDragTime : Infinity;
        if (timeSinceLastDrag < 10000) {
          return {
            ...entity,
            interactionHistory: history,
          };
        }

        // Normalized signals
        const freqScore = Math.min(1, history.frequency / 6);
        const velocityScore = Math.min(1, history.averageVelocity / 900);
        const hoverScore = Math.min(1, history.totalDuration / 6000);
        const ignored = timeSinceLastInteraction > 8000 && history.frequency === 0;

        // Truly random distribution - use entity's created time and id as random seed
        const seed1 = entity.createdAt * 0.123 + idx * 456.789 + parseFloat(entity.id.split('-')[1] || '0') * 123.456;
        const seed2 = entity.createdAt * 0.456 + idx * 789.123 + parseFloat(entity.id.split('-')[1] || '0') * 654.321;
        const seed3 = entity.createdAt * 0.789 + idx * 321.654;
        const seed4 = entity.createdAt * 0.321 + idx * 654.987;
        
        // Better pseudo-random using multiple hash functions
        const hash1 = Math.abs(Math.sin(seed1) * 43758.5453123);
        const hash2 = Math.abs(Math.sin(seed2) * 43758.5453123);
        const hash3 = Math.abs(Math.cos(seed3) * 12345.6789);
        const hash4 = Math.abs(Math.sin(seed4) * 98765.4321);
        
        const randomX = hash1 - Math.floor(hash1); // Get fractional part (0-1)
        const randomY = hash2 - Math.floor(hash2); // Get fractional part (0-1)
        const randomOffsetX = (hash3 - Math.floor(hash3) - 0.5) * 150; // -75 to +75
        const randomOffsetY = (hash4 - Math.floor(hash4) - 0.5) * 150; // -75 to +75
        
        // Calculate completely random target position with padding from edges
        const padding = 80;
        const availableWidth = containerWidth - (padding * 2);
        const availableHeight = containerHeight - (padding * 2);
        
        // Pure random distribution across entire screen
        let targetX = padding + (randomX * availableWidth) + randomOffsetX;
        let targetY = padding + (randomY * availableHeight) + randomOffsetY;
        
        // Clamp to ensure entities stay within bounds
        targetX = Math.max(padding, Math.min(containerWidth - padding, targetX));
        targetY = Math.max(padding, Math.min(containerHeight - padding, targetY));

        // Only pull toward center for highly engaged entities
        if (freqScore > 0.5) {
          const centerPull = (freqScore - 0.5) * 0.3; // Max 15% pull for high frequency
          targetX = targetX * (1 - centerPull) + centerX * centerPull;
          targetY = targetY * (1 - centerPull) + centerY * centerPull;
        }

        // Ignored entities drift to edges
        if (ignored) {
          const edgeFactor = 0.9;
          if (targetX > centerX) {
            targetX = padding + availableWidth * edgeFactor;
          } else {
            targetX = padding + availableWidth * (1 - edgeFactor);
          }
          if (targetY > centerY) {
            targetY = padding + availableHeight * edgeFactor;
          } else {
            targetY = padding + availableHeight * (1 - edgeFactor);
          }
        }

        // Active repulsion: push away from currently active / high-frequency nodes
        let repelX = 0;
        let repelY = 0;
        activeEntities.forEach(({ entity: other }) => {
          if (other.id === entity.id) return;
          const dx = targetX - other.targetPosition.x;
          const dy = targetY - other.targetPosition.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 1) return;
          const dist = Math.sqrt(distSq);
          const force = dist < 180 ? (180 - dist) / 180 : 0;
          repelX += (dx / dist) * force * 28;
          repelY += (dy / dist) * force * 28;
        });
        targetX += repelX;
        targetY += repelY;

        // Varied drift movement - different speed and amplitude per entity
        const driftSpeed = 0.00008 + (idx * 0.00003); // Varied speed per entity
        const driftAmplitude = 15 + (idx % 5) * 8; // 15-47px amplitude
        const driftDirection = (idx % 3 === 0 ? 1 : idx % 3 === 1 ? -1 : 0.5);
        
        targetX += Math.sin(now * driftSpeed + idx) * driftAmplitude * driftDirection;
        targetY += Math.cos(now * driftSpeed * 0.8 + idx * 1.5) * driftAmplitude * 0.7;

        // Clamp inside container bounds
        const margin = 40;
        targetX = Math.max(margin, Math.min(containerWidth - margin, targetX));
        targetY = Math.max(margin, Math.min(containerHeight - margin, targetY));

        return {
          ...entity,
          interactionHistory: history,
          targetPosition: { x: targetX, y: targetY },
        };
      });

      return updated;
    });
  }, [containerWidth, containerHeight, getInteractionHistory]);

  return {
    entities,
    updateInteractionState,
    handleEntityInteraction,
    updateTargetPosition,
    recalculateLayout,
  };
}
