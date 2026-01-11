# Living Interface

A Next.js application demonstrating a dynamic, adaptive user interface where UI elements respond to user behavior over time. Motion and animation are core to the product logic, not decoration.

<img width="1902" height="860" alt="image" src="https://github.com/user-attachments/assets/855f9efa-10a6-467c-9aeb-66ad0a5e0cb7" />

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






## Author

Built as a demonstration of motion-driven interface design and adaptive interaction systems.
