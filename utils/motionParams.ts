import { InteractionHistory } from '@/types/entity';

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

/**
 * Calculate spring parameters based on interaction history
 * Fast interactions → stiffer springs, more overshoot
 * Slow/ignored → softer springs, less energy
 */
// Calculate spring animation parameters based on interaction history
export function getSpringConfig(history: InteractionHistory, prefersReducedMotion: boolean = false): SpringConfig {
  const { frequency, averageVelocity, lastInteractionTime, totalDuration } = history;
  const timeSinceLastInteraction = Date.now() - lastInteractionTime; // Milliseconds since last interaction
  
  // Base config for idle entities (moderate responsiveness)
  let stiffness = 100; // How quickly spring reaches target (higher = faster)
  let damping = 15; // How much spring oscillates (higher = less bounce)
  let mass = 1; // Perceived weight (higher = heavier/slower)

  // Frequently interacted entities (3+ times) get stiffer springs (more responsive)
  if (frequency > 3) {
    stiffness = 200 + (frequency * 20); // Increase stiffness with frequency
    damping = 20 + (frequency * 2); // Increase damping (less overshoot)
    mass = 0.8; // Lighter mass feels more responsive
  }

  // Fast interactions (high velocity) increase spring energy
  if (averageVelocity > 500) {
    stiffness += 100; // Stiffer spring
    damping -= 5; // Less damping = more overshoot/bounce
  }

  // Long engagement increases weight slightly to feel grounded
  if (totalDuration > 5000) {
    damping += 2;
    mass += 0.2;
  }

  // Ignored entities (5+ seconds, no interactions) get softer springs (slower)
  if (timeSinceLastInteraction > 5000 && frequency === 0) {
    stiffness = 50; // Softer spring
    damping = 10; // Less damping
    mass = 1.5; // Heavier mass feels slower
  }

  // Very ignored entities (10+ seconds) drift very slowly
  if (timeSinceLastInteraction > 10000 && frequency === 0) {
    stiffness = 30; // Very soft spring
    damping = 8;
    mass = 2; // Very heavy
  }

  // For reduced motion preference, use instant transitions (accessibility)
  if (prefersReducedMotion) {
    return {
      stiffness: 1000, // Very high = instant
      damping: 100, // Very high = no overshoot
      mass: 1,
    };
  }

  // Clamp values to safe ranges
  return {
    stiffness: Math.max(20, Math.min(300, stiffness)),
    damping: Math.max(5, Math.min(30, damping)),
    mass: Math.max(0.5, Math.min(3, mass)),
  };
}

/**
 * Calculate layout transition spring based on overall interaction velocity
 */
// Calculate spring config for layout transitions (when entities reposition)
export function getLayoutSpringConfig(entities: Array<{ interactionHistory: InteractionHistory }>, prefersReducedMotion: boolean = false): SpringConfig {
  const avgVelocity = entities.reduce((sum, e) => sum + e.interactionHistory.averageVelocity, 0) / entities.length; // Average velocity across all entities
  const totalFrequency = entities.reduce((sum, e) => sum + e.interactionHistory.frequency, 0); // Total interaction frequency

  // For reduced motion preference, use instant transitions
  if (prefersReducedMotion) {
    return { stiffness: 1000, damping: 100, mass: 1 }; // Instant transition
  }

  // Active sessions (high frequency or velocity) get faster layout transitions
  if (totalFrequency > 10 || avgVelocity > 300) {
    return { stiffness: 150, damping: 20, mass: 1 }; // Faster transitions
  }

  // Normal layout transitions (default)
  return { stiffness: 100, damping: 15, mass: 1 }; // Moderate speed
}
