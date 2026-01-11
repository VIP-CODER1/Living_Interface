# Living Interface

A Next.js application demonstrating a dynamic, adaptive user interface where UI elements respond to user behavior over time. Motion and animation are core to the product logic, not decoration.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-11-ff69b4)](https://www.framer.com/motion/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8)](https://tailwindcss.com/)

## Table of Contents

- [Concept](#concept)
- [System Design](#system-design)
  - [Architecture Overview](#architecture-overview)
  - [Data Flow](#data-flow)
  - [Component Architecture](#component-architecture)
  - [State Management](#state-management)
  - [Animation System](#animation-system)
- [Interaction Rules](#interaction-rules)
- [Motion Strategy](#motion-strategy)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Evaluation Criteria](#evaluation-criteria-coverage)

## Concept

The Living Interface displays 10–20 interactive entities (default 15) that evolve their appearance, position, and motion characteristics based on how users interact with them. The system observes interaction patterns—frequency, duration, velocity, and time since last interaction—and responds by adjusting:

- **Visual appearance**: Size, opacity, and prominence
- **Layout position**: Entities move toward or away from focus areas
- **Motion physics**: Spring parameters adapt to create responsive or drifting animations
- **Interaction feedback**: Active entities become more prominent; ignored ones fade away

This creates an interface that feels "alive" and responsive, demonstrating how animation can be a meaningful part of interaction design rather than mere decoration.

---

## System Design

### Architecture Overview

The Living Interface follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Entity     │  │   Entity     │  │  Stats       │     │
│  │  Component   │  │  Container   │  │  Panel       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ Props / Callbacks
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    State Management Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  useEntity   │  │  useInterac  │  │  useReduced  │     │
│  │    State     │  │   Tracking   │  │   Motion     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ Interaction History
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Logic Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Motion     │  │   Layout     │  │   Spring     │     │
│  │   Params     │  │  Algorithm   │  │   Physics    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ Spring Config
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Animation Layer                          │
│              Framer Motion Spring System                    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Unidirectional data flow** ensures predictable state updates:

```
User Interaction (hover/click/drag)
        │
        ▼
Entity Component (captures event)
        │
        ├──→ onInteraction callback
        │
        ▼
useInteractionTracking (records history)
        │
        ├──→ trackInteraction(id, duration, velocity)
        ├──→ stores in Map<EntityId, InteractionEvent[]>
        │
        ▼
useEntityState (updates state)
        │
        ├──→ getInteractionHistory(id)
        ├──→ updates entity.interactionHistory
        ├──→ updates entity.visualState (size, opacity)
        ├──→ triggers recalculateLayout()
        │
        ▼
motionParams (calculates spring config)
        │
        ├──→ analyzes frequency, velocity, duration
        ├──→ returns { stiffness, damping, mass }
        │
        ▼
Framer Motion (animates)
        │
        ├──→ useSpring(position, springConfig)
        ├──→ smooth physics-based animation
        │
        ▼
Visual Update (user sees change)
```

### Component Architecture

#### **Page Component** (`app/page.tsx`)
- **Role**: Root client component
- **Responsibilities**:
  - Container size management (responsive)
  - Entity state initialization
  - Periodic layout recalculation (3s interval)
  - Window resize handling
- **State**: `containerSize`, `entities`
- **Effects**: Resize listener, layout interval

#### **EntityContainer** (`components/EntityContainer.tsx`)
- **Role**: Collection manager
- **Responsibilities**:
  - Renders all entities
  - Provides shared context (width, height)
  - Manages background effects (particles, glow)
  - Displays debug information
- **Props**: 
  - `entities[]`
  - `containerWidth/Height`
  - `onInteraction`
  - `onInteractionStateChange`
  - `onPositionUpdate`

#### **Entity** (`components/Entity.tsx`)
- **Role**: Individual interactive element
- **Responsibilities**:
  - Captures user interactions (hover, click, drag)
  - Animates position using springs
  - Renders shape (circle, square, hexagon)
  - Calculates interaction metrics (duration, velocity)
  - Updates visual state (scale, opacity)
- **Motion Values**:
  - `x, y` → position targets
  - `springX, springY` → animated positions
  - `baseScale, interactiveScale` → size animation
  - `opacity` → fade animation
- **State Machine**: `idle` → `hovered` → `active` → `idle`

#### **Custom Hooks**

##### **useEntityState** (`hooks/useEntityState.ts`)
```typescript
function useEntityState(width, height, count) {
  const [entities, setEntities] = useState([...])
  const { trackInteraction, getInteractionHistory } = useInteractionTracking()
  
  return {
    entities,                    // Array of Entity objects
    updateInteractionState,       // Update state machine
    handleEntityInteraction,      // Process interaction event
    updateTargetPosition,         // Set new position target
    recalculateLayout,           // Run layout algorithm
  }
}
```

**Layout Algorithm** (runs every 3s):
```typescript
// 1. Calculate base ring position (angle-based distribution)
const angle = (idx / total) * Math.PI * 2

// 2. Apply interaction-based modifiers
const centerPull = 0.18 + freqScore * 0.45 + velocityScore * 0.25
const ringShrink = 0.65 - freqScore * 0.35

// 3. Handle ignored entities (>8s no interaction)
if (ignored) {
  // Push to perimeter
  targetRadius = maxRadius + 30
}

// 4. Apply repulsion forces from active entities
activeEntities.forEach(other => {
  const force = calculateRepulsion(distance)
  targetX += repelX
  targetY += repelY
})

// 5. Add orbital drift animation
targetX += Math.sin(time * 0.00015 + idx) * drift
targetY += Math.cos(time * 0.0001 + idx) * drift
```

##### **useInteractionTracking** (`hooks/useInteractionTracking.ts`)
```typescript
function useInteractionTracking() {
  const interactionsRef = useRef<Map<EntityId, InteractionEvent[]>>()
  
  const trackInteraction = (id, duration, startPos, endPos) => {
    // Calculate velocity from positions
    const velocity = distance / (duration / 1000)
    
    // Store event
    events.push({ id, timestamp, duration, velocity })
    
    // Limit to 100 events per entity
    if (events.length > 100) events.shift()
  }
  
  const getInteractionHistory = (id) => {
    // Filter recent events (last 60s)
    const recentEvents = events.filter(e => now - e.timestamp < 60000)
    
    // Calculate aggregates
    return {
      frequency: recentEvents.length,
      totalDuration: sum(events.map(e => e.duration)),
      lastInteractionTime: events[events.length - 1].timestamp,
      averageVelocity: average(events.map(e => e.velocity)),
      interactionCount: events.length
    }
  }
  
  return { trackInteraction, getInteractionHistory }
}
```

### State Management

**Entity State Model**:
```typescript
interface Entity {
  id: EntityId                    // Stable identifier "entity-0"
  
  visualState: {
    size: number                  // 40-140px (adapts to interactions)
    color: string                 // Fixed per entity
    opacity: number               // 0.18-1.0 (fades when ignored)
    shape: 'circle' | 'square' | 'hexagon'
  }
  
  interactionState: InteractionState  // State machine
  // 'idle' → 'hovered' → 'active' → 'idle'
  // 'idle' → 'ignored' (after 8s)
  
  interactionHistory: {
    frequency: number             // Interactions in last 60s
    totalDuration: number         // Cumulative time (ms)
    lastInteractionTime: number   // Timestamp
    averageVelocity: number       // Pixels per second
    interactionCount: number      // Session total
  }
  
  position: { x, y }              // Current position
  targetPosition: { x, y }        // Animation target
  createdAt: number               // Creation timestamp
}
```

**State Updates** follow immutable patterns:
```typescript
// ❌ Bad: Direct mutation
entity.size = 100

// ✅ Good: Immutable update
setEntities(prev => prev.map(e => 
  e.id === entityId 
    ? { ...e, visualState: { ...e.visualState, size: 100 } }
    : e
))
```

### Animation System

**Spring Physics Implementation**:

```typescript
// 1. Create motion values (targets)
const x = useMotionValue(entity.targetPosition.x)
const y = useMotionValue(entity.targetPosition.y)

// 2. Apply spring physics
const springConfig = getSpringConfig(entity.interactionHistory)
const springX = useSpring(x, springConfig)
const springY = useSpring(y, springConfig)

// 3. Update targets when entity changes
useEffect(() => {
  x.set(entity.targetPosition.x)
  y.set(entity.targetPosition.y)
}, [entity.targetPosition])

// 4. Render with animated values
<motion.div style={{ x: springX, y: springY }} />
```

**Spring Parameter Calculation**:

| Interaction Pattern | Stiffness | Damping | Mass | Result |
|---------------------|-----------|---------|------|--------|
| Baseline (idle) | 100 | 15 | 1.0 | Moderate response |
| High frequency (3+) | 200-300 | 20-26 | 0.8 | Snappy, responsive |
| High velocity (>500px/s) | +100 | -5 | - | Energetic bounce |
| Long hover (>5s) | - | +2 | +0.2 | Grounded feel |
| Ignored (5-10s) | 50 | 10 | 1.5 | Slow drift |
| Ignored (>10s) | 30 | 8 | 2.0 | Very sluggish |
| Reduced motion | 1000 | 100 | 1.0 | Instant (accessible) |

**Animation Layers**:
1. **Position**: Spring-based X/Y movement
2. **Scale**: Interactive feedback (hover = 1.1x, active = 1.2x)
3. **Opacity**: Fade based on interaction history
4. **Layout**: Periodic repositioning (3s interval)

---

## Interaction Rules

### Entity Behaviors

1. **Frequently Interacted Entities** (3+ interactions):
   - Cluster closer to center with stronger center pull
   - Grow larger and more opaque
   - Use stiffer, more responsive springs (faster animations)
   - Display interaction count badge

2. **Ignored Entities** (no interaction for 8–15s):
   - Decay toward the edges (perimeter ring) and fade
   - Shrink and lose opacity
   - Use softer, heavier springs; motion slows down

3. **Fast Interactions** (high velocity gestures):
   - Increase spring energy (stiffer, less damping)
   - Add size/opacity punch for the entity
   - Influence layout pull strength toward focus

4. **Long Hovers vs Short Clicks**:
   - Long hover (>1.2s) boosts opacity (gentle glow)
   - Short click (<0.4s) adds a compact size bump
   - Drag velocity feeds back into motion energy and layout

5. **Active Repulsion & Clustering**:
   - Active/high-frequency nodes repel neighbors to reduce overlap
   - Entities drift in subtle orbits; ignored nodes settle to the perimeter

### Interaction Types

- **Hover**: Move mouse over an entity (duration tracked)
- **Click**: Single click on an entity
- **Drag**: Click and drag an entity (velocity and distance tracked)

## Motion Strategy

### Why Springs?

Spring-based animations provide natural, physics-based motion that:
- Feels organic and responsive
- Adapts dynamically to interaction patterns
- Creates visual hierarchy through motion energy
- Provides better UX than fixed-duration animations

### Spring Parameter Adaptation

Spring configurations are dynamically calculated from interaction history (frequency, velocity, duration, last interaction):

- **Stiffness**: increases with frequency/velocity; reduced for ignored
- **Damping**: eased for fast gestures (more overshoot); increased for long-hover grounding
- **Mass**: lighter for active, heavier for ignored/long-hover to feel settled

Examples:
- High-frequency + fast drag → stiff + low damping for energetic bounce
- Idle 10s with no interactions → soft, heavy spring drifting to perimeter
- Long hover → slightly heavier, damped motion (feels grounded)

## Architecture

### Project Structure (App Router)

```
living-interface/
├── app/                        # Next.js App Router
│   ├── layout.tsx             # Root layout (server component)
│   ├── page.tsx               # Main page (client component)
│   └── globals.css            # Global styles + Tailwind
│
├── components/                 # React components
│   ├── Entity.tsx             # Individual entity with motion
│   ├── EntityContainer.tsx    # Collection manager
│   ├── StatsPanel.tsx         # Interaction statistics display
│   ├── ParticleBackground.tsx # Animated particle network
│   └── ThreeDScene.tsx        # Three.js background (optional)
│
├── hooks/                      # Custom React hooks
│   ├── useEntityState.ts      # State management + layout algorithm
│   ├── useInteractionTracking.ts  # Interaction history tracking
│   └── useReducedMotion.ts    # Accessibility hook
│
├── types/                      # TypeScript definitions
│   └── entity.ts              # Entity, InteractionHistory, VisualState
│
├── utils/                      # Utility functions
│   └── motionParams.ts        # Spring parameter calculations
│
└── Configuration Files
    ├── next.config.js         # Next.js configuration
    ├── tailwind.config.ts     # Tailwind CSS setup
    ├── tsconfig.json          # TypeScript configuration
    └── package.json           # Dependencies
```

### Dependency Graph

```
app/page.tsx
    ├─→ hooks/useEntityState.ts
    │       ├─→ hooks/useInteractionTracking.ts
    │       └─→ types/entity.ts
    │
    ├─→ components/EntityContainer.tsx
    │       ├─→ components/Entity.tsx
    │       │       ├─→ utils/motionParams.ts
    │       │       ├─→ hooks/useReducedMotion.ts
    │       │       └─→ framer-motion
    │       │
    │       ├─→ components/ParticleBackground.tsx
    │       └─→ components/StatsPanel.tsx
    │
    └─→ components/ThreeDScene.tsx
            └─→ three.js
```

### Key Design Patterns

#### 1. **Custom Hook Pattern**
Encapsulates complex logic into reusable hooks:
```typescript
// State management
const { entities, handleEntityInteraction, recalculateLayout } = useEntityState()

// Interaction tracking
const { trackInteraction, getInteractionHistory } = useInteractionTracking()

// Accessibility
const prefersReducedMotion = useReducedMotion()
```

#### 2. **Container/Presentation Pattern**
Separation of data management from rendering:
- `EntityContainer`: Manages collection, provides context
- `Entity`: Renders individual items, captures events

#### 3. **Callback Pattern**
Unidirectional data flow via callbacks:
```typescript
<Entity
  entity={entity}
  onInteraction={(id, type, duration) => handleEntityInteraction(id, type, duration)}
  onInteractionStateChange={(id, state) => updateInteractionState(id, state)}
  onPositionUpdate={(id, x, y) => updateTargetPosition(id, x, y)}
/>
```

#### 4. **Temporal State Pattern**
Multi-timeframe state tracking:
```typescript
// Immediate (current state)
entity.interactionState: 'idle' | 'active' | 'hovered'

// Short-term (last 60s)
entity.interactionHistory.frequency

// Long-term (session)
entity.interactionHistory.interactionCount
```

#### 5. **Physics-Based Animation**
Spring parameters derived from behavioral data:
```typescript
const springConfig = calculateSpring(
  frequency,      // How often
  velocity,       // How fast
  duration,       // How long
  timeSinceLast   // Recency
)
```

### Performance Considerations

**Optimization Strategies**:

1. **Throttled Layout Recalculation**
   - Runs every 3 seconds (not on every frame)
   - Prevents excessive re-renders
   
2. **Event History Limits**
   - Maximum 100 interactions per entity
   - Older events automatically pruned
   
3. **Recent Event Filtering**
   - Frequency calculated from last 60s only
   - Reduces computation on large histories
   
4. **Motion Value Optimization**
   - Uses Framer Motion's `useMotionValue` (bypasses React renders)
   - `useSpring` runs on RAF (60fps)
   
5. **Reduced Motion Support**
   - Instant transitions when `prefers-reduced-motion` enabled
   - Reduces particle count and animation intensity

**Performance Metrics**:
- 15 entities: ~60fps on modern hardware
- 20 entities: May drop to 45-55fps (acceptable)
- Memory: ~10MB for interaction history (100 events × 20 entities)

### Type System

**Core Types**:
```typescript
type EntityId = string

type InteractionState = 
  | 'idle'      // Default resting state
  | 'active'    // Being dragged
  | 'hovered'   // Mouse over
  | 'ignored'   // No interaction for 8s+
  | 'dismissed' // Removed from layout

interface VisualState {
  size: number      // 40-140px
  color: string     // Hex color
  opacity: number   // 0-1
  shape: 'circle' | 'square' | 'hexagon'
}

interface InteractionHistory {
  frequency: number             // Last 60s
  totalDuration: number         // Session cumulative (ms)
  lastInteractionTime: number   // Timestamp
  averageVelocity: number       // px/s
  interactionCount: number      // Session total
}

interface Entity {
  id: EntityId
  visualState: VisualState
  interactionState: InteractionState
  interactionHistory: InteractionHistory
  position: { x: number; y: number }
  targetPosition: { x: number; y: number }
  createdAt: number
}

interface SpringConfig {
  stiffness: number  // 20-300 (speed)
  damping: number    // 5-30 (oscillation)
  mass: number       // 0.5-3 (weight)
}
```

### State Lifecycle

```
┌─────────────────────────────────────────────────┐
│              Entity Creation                    │
│  createInitialEntity(id, index, width, height) │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│            Initial State                        │
│  • visualState: random size/color/shape         │
│  • interactionState: 'idle'                     │
│  • interactionHistory: all zeros                │
│  • position: random (x, y)                      │
└─────────────────────────────────────────────────┘
                    ↓
        ┌──────────────────────┐
        │   User Interaction   │
        └──────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         State Update Flow                       │
│  1. Event captured (hover/click/drag)           │
│  2. Interaction tracked (duration, velocity)    │
│  3. History aggregated (frequency, avg vel)     │
│  4. Visual state updated (size, opacity)        │
│  5. Spring config recalculated                  │
│  6. Target position updated                     │
└─────────────────────────────────────────────────┘
                    ↓
        ┌──────────────────────┐
        │  Animation System    │
        │  (Framer Motion)     │
        └──────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         Periodic Layout Update                  │
│  Every 3s: recalculateLayout()                  │
│  • Center pull for active entities              │
│  • Perimeter decay for ignored entities         │
│  • Active repulsion between nodes               │
│  • Orbital drift animation                      │
└─────────────────────────────────────────────────┘
                    ↓
        ┌──────────────────────┐
        │   Visual Update      │
        │   (User sees)        │
        └──────────────────────┘
```

---

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.2.5 | React framework with App Router |
| **React** | 18.3.1 | UI library |
| **TypeScript** | 5.5.4 | Type safety and developer experience |
| **Framer Motion** | 11.3.4 | Spring physics and animations |
| **Tailwind CSS** | 3.4.9 | Utility-first styling |
| **Three.js** | 0.169.0 | 3D background rendering (optional) |
| **tsparticles** | 3.9.1 | Particle network effects (optional) |

### Why These Technologies?

#### **Next.js 14 (App Router)**
- ✅ Server/client component separation
- ✅ Built-in performance optimizations
- ✅ File-based routing
- ✅ TypeScript support out of the box
- ✅ Production-ready build system

#### **Framer Motion**
- ✅ Spring physics primitives (`useSpring`)
- ✅ Motion values (bypass React renders)
- ✅ Drag gestures with velocity tracking
- ✅ `prefers-reduced-motion` support
- ✅ Declarative animation API

**Comparison to alternatives**:
```typescript
// ❌ React Spring: More verbose, older API
const [props, api] = useSpring(() => ({ x: 0, y: 0 }))
api.start({ x: 100, y: 100 })

// ✅ Framer Motion: Cleaner, more intuitive
const x = useMotionValue(0)
const springX = useSpring(x, { stiffness: 100 })
x.set(100) // Triggers spring animation
```

#### **TypeScript**
- ✅ Catch errors at compile time
- ✅ Better IDE autocomplete
- ✅ Self-documenting code
- ✅ Refactoring safety
- ✅ Interface contracts between components

#### **Tailwind CSS**
- ✅ Utility-first (no CSS file switching)
- ✅ Consistent design system
- ✅ Responsive modifiers (`sm:`, `md:`, `lg:`)
- ✅ Dark mode support
- ✅ PurgeCSS (small bundle size)

### Development Tools

```json
{
  "scripts": {
    "dev": "next dev",           // Development server with HMR
    "build": "next build",       // Production build
    "start": "next start",       // Production server
    "lint": "next lint"          // ESLint checking
  }
}
```

### Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 14+ | Full support |
| Edge | 90+ | Full support |
| Mobile Safari | 14+ | Touch drag supported |
| Chrome Android | 90+ | Touch drag supported |

**Required Browser Features**:
- CSS Grid & Flexbox
- ES6+ JavaScript
- RequestAnimationFrame
- CSS Custom Properties
- `prefers-reduced-motion` media query

---

## Getting Started

### Prerequisites

- **Node.js**: 18.x or higher ([Download](https://nodejs.org/))
- **npm**, **yarn**, or **pnpm**: Any modern package manager
- **Git**: For cloning the repository

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/yourusername/living-interface.git
cd living-interface
```

2. **Install dependencies**:
```bash
# Using npm
npm install

# Using yarn
yarn install

# Using pnpm
pnpm install
```

3. **Run the development server**:
```bash
# Using npm
npm run dev

# Using yarn
yarn dev

# Using pnpm
pnpm dev
```

4. **Open your browser**:
Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start

# The app will be available at http://localhost:3000
```

### Project Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create optimized production build |
| `npm start` | Run production server |
| `npm run lint` | Check code quality with ESLint |

### Development Workflow

```
┌─────────────────────────────────────────────────┐
│  1. npm run dev                                 │
│     - Starts Next.js development server         │
│     - Enables Fast Refresh (hot reload)         │
│     - TypeScript type checking                  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  2. Edit code in your IDE                       │
│     - Changes auto-reload in browser            │
│     - TypeScript errors shown inline            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  3. Test in browser                             │
│     - Interact with entities                    │
│     - Check console for errors                  │
│     - Verify spring animations                  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  4. npm run lint (before commit)                │
│     - Catches code quality issues               │
│     - Enforces consistent style                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  5. npm run build (before deployment)           │
│     - Optimizes for production                  │
│     - Generates static pages                    │
│     - Minimizes bundle size                     │
└─────────────────────────────────────────────────┘
```

### Environment Setup

**Recommended VS Code Extensions**:
- **ESLint**: Real-time linting
- **Prettier**: Code formatting
- **Tailwind CSS IntelliSense**: Class name autocomplete
- **TypeScript + JavaScript**: Enhanced TS support
- **Error Lens**: Inline error display

**VS Code Settings** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```




## Author

Built as a demonstration of motion-driven interface design and adaptive interaction systems.
