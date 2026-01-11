"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, Engine, ISourceOptions } from "@tsparticles/engine";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface ParticleBackgroundProps {
  containerWidth: number;
  containerHeight: number;
}

const ParticleBackground = ({
  containerWidth,
  containerHeight,
}: ParticleBackgroundProps) => {
  const [init, setInit] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = useCallback(async (container?: Container) => {
    console.log("Particles loaded", container);
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      background: {
        opacity: 0,
      },
      fullScreen: {
        enable: false,
        zIndex: 0,
      },
      particles: {
        number: {
          value: prefersReducedMotion ? 25 : 40,
          density: {
            enable: true,
            width: containerWidth,
            height: containerHeight,
          },
        },
        color: {
          value: ["#ff6b35", "#4ecdc4", "#45b7d1", "#f9ca24", "#ff9fc3", "#a855f7", "#3b82f6"],
        },
        shape: {
          type: "circle",
        },
        opacity: {
          value: { min: 0.4, max: 0.7 },
          animation: {
            enable: !prefersReducedMotion,
            speed: 0.5,
            sync: false,
          },
        },
        size: {
          value: { min: 2, max: 4 },
          animation: {
            enable: !prefersReducedMotion,
            speed: 2,
            sync: false,
          },
        },
        move: {
          enable: true,
          speed: prefersReducedMotion ? 0.5 : 1,
          direction: "none",
          random: true,
          straight: false,
          outModes: {
            default: "out",
          },
          attract: {
            enable: false,
          },
        },
        links: {
          enable: true,
          distance: 120,
          color: "#ffffff",
          opacity: prefersReducedMotion ? 0.2 : 0.3,
          width: 1,
          triangles: {
            enable: false,
          },
        },
      },
      interactivity: {
        detectsOn: "canvas",
        events: {
          onHover: {
            enable: !prefersReducedMotion,
            mode: "grab",
            parallax: {
              enable: false,
            },
          },
          onClick: {
            enable: false,
          },
          resize: {
            enable: true,
            delay: 0.5,
          },
        },
        modes: {
          grab: {
            distance: 150,
            links: {
              opacity: 0.6,
              color: "#ff9fc3",
            },
          },
        },
      },
      detectRetina: true,
      fpsLimit: 60,
      smooth: true,
    }),
    [prefersReducedMotion, containerWidth, containerHeight]
  );

  if (!init) {
    return null;
  }

  return (
    <Particles
      id="tsparticles"
      className="absolute inset-0 pointer-events-auto"
      particlesLoaded={particlesLoaded}
      options={options as any}
    />
  );
};

export default ParticleBackground;
