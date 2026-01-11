export type EntityId = string;

export type InteractionState = 'idle' | 'active' | 'hovered' | 'ignored' | 'dismissed';

export interface VisualState {
  size: number; // 0-100 scale
  color: string;
  opacity: number; // 0-1
  shape: 'circle' | 'square' | 'hexagon';
}

export interface InteractionHistory {
  frequency: number; // number of interactions
  totalDuration: number; // total time in milliseconds
  lastInteractionTime: number; // timestamp
  averageVelocity: number; // pixels per second
  interactionCount: number;
}

export interface Entity {
  id: EntityId;
  visualState: VisualState;
  interactionState: InteractionState;
  interactionHistory: InteractionHistory;
  position: {
    x: number;
    y: number;
  };
  targetPosition: {
    x: number;
    y: number;
  };
  createdAt: number; // timestamp
  lastDragTime?: number; // timestamp of last manual drag
}
