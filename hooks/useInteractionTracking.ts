import { useRef, useCallback, useMemo } from 'react';
import { EntityId, InteractionHistory } from '@/types/entity';

interface InteractionEvent {
  entityId: EntityId;
  timestamp: number;
  duration: number;
  velocity?: number;
}

export function useInteractionTracking() {
  // Map of entity IDs to their interaction events (stores interaction history)
  const interactionsRef = useRef<Map<EntityId, InteractionEvent[]>>(new Map());
  // Map of entity IDs to their last known position (for velocity calculation)
  const lastPositionRef = useRef<Map<EntityId, { x: number; y: number; timestamp: number }>>(new Map());
  
  // Record an interaction event for an entity
  const trackInteraction = useCallback((
    entityId: EntityId,
    duration: number,
    startPosition?: { x: number; y: number },
    endPosition?: { x: number; y: number }
  ) => {
    const timestamp = Date.now(); // Current timestamp
    let velocity = 0; // Initialize velocity

    // Calculate velocity if we have start/end positions and duration
    if (startPosition && endPosition && duration > 0) {
      const distance = Math.sqrt(
        Math.pow(endPosition.x - startPosition.x, 2) + // Euclidean distance formula
        Math.pow(endPosition.y - startPosition.y, 2)
      );
      velocity = distance / (duration / 1000); // Convert to pixels per second
    } else if (lastPositionRef.current.has(entityId)) {
      // Fallback: calculate velocity from last known position
      const last = lastPositionRef.current.get(entityId)!;
      const timeDelta = (timestamp - last.timestamp) / 1000; // Time difference in seconds
      if (timeDelta > 0 && endPosition) {
        const distance = Math.sqrt(
          Math.pow(endPosition.x - last.x, 2) +
          Math.pow(endPosition.y - last.y, 2)
        );
        velocity = distance / timeDelta; // Velocity = distance / time
      }
    }

    // Store end position for next velocity calculation
    if (endPosition) {
      lastPositionRef.current.set(entityId, {
        ...endPosition,
        timestamp,
      });
    }

    // Get or create events array for this entity
    const events = interactionsRef.current.get(entityId) || [];
    events.push({
      entityId,
      timestamp,
      duration,
      velocity,
    });
    
    // Keep only last 100 interactions per entity (prevent memory bloat)
    if (events.length > 100) {
      events.shift(); // Remove oldest event
    }
    
    interactionsRef.current.set(entityId, events); // Store updated events
  }, []);

  // Get aggregated interaction history for an entity
  const getInteractionHistory = useCallback((entityId: EntityId): InteractionHistory => {
    const events = interactionsRef.current.get(entityId) || []; // Get all events for entity
    const now = Date.now();
    
    if (events.length === 0) {
      return {
        frequency: 0,
        totalDuration: 0,
        lastInteractionTime: 0,
        averageVelocity: 0,
        interactionCount: 0,
      };
    }

    const recentEvents = events.filter(e => now - e.timestamp < 60000); // Events in last 60 seconds
    const totalDuration = events.reduce((sum, e) => sum + e.duration, 0); // Sum all durations
    const velocities = events.filter(e => e.velocity !== undefined).map(e => e.velocity!); // Extract velocities
    const averageVelocity = velocities.length > 0
      ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length // Calculate average
      : 0;

    return {
      frequency: recentEvents.length, // Interactions in last minute
      totalDuration, // Total time spent interacting
      lastInteractionTime: events[events.length - 1]?.timestamp || 0, // Most recent interaction time
      averageVelocity, // Average interaction velocity
      interactionCount: events.length, // Total interaction count
    };
  }, []);

  const reset = useCallback(() => {
    interactionsRef.current.clear();
    lastPositionRef.current.clear();
  }, []);

  return {
    trackInteraction,
    getInteractionHistory,
    reset,
  };
}
