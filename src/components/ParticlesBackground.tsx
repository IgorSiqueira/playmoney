"use client";
import { useEffect, useRef } from "react";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  alpha: number;
  maxAlpha: number;
  life: number; maxLife: number;
  hue: number; // 200-260 range (blue-purple)
}

interface Meteor {
  x: number; y: number;
  vx: number; vy: number;
  length: number;
  alpha: number;
  life: number; maxLife: number;
}

function mkParticle(w: number, h: number, scatter = false): Particle {
  const maxLife = 120 + Math.random() * 180;
  return {
    x: Math.random() * w,
    y: scatter ? Math.random() * h : h + 8,
    vx: (Math.random() - 0.5) * 0.4,
    vy: -(0.25 + Math.random() * 0.55),
    r: 0.4 + Math.random() * 1.6,
    alpha: 0,
    maxAlpha: 0.12 + Math.random() * 0.28,
    life: scatter ? Math.random() * maxLife : 0,
    maxLife,
    hue: 200 + Math.floor(Math.random() * 60),
  };
}

function mkMeteor(w: number): Meteor {
  return {
    x: Math.random() * w * 1.5,
    y: -20,
    vx: -(1.5 + Math.random() * 2),
    vy: 0.8 + Math.random() * 1.2,
    length: 60 + Math.random() * 80,
    alpha: 0.6 + Math.random() * 0.3,
    life: 0,
    maxLife: 60 + Math.random() * 40,
  };
}

export function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let frame = 0;
    const particles: Particle[] = [];
    const meteors: Meteor[] = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener("resize", resize);

    // seed particles spread across the canvas
    for (let i = 0; i < 55; i++) {
      particles.push(mkParticle(canvas.width, canvas.height, true));
    }

    function draw() {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;

      // spawn a new particle every ~4 frames
      if (frame % 4 === 0 && particles.length < 70) {
        particles.push(mkParticle(w, h));
      }

      // spawn meteor every ~400 frames (roughly every 7s at 60fps)
      if (frame % 400 === 0) {
        meteors.push(mkMeteor(w));
      }

      // draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const t = p.life / p.maxLife;
        // fade in first 20%, full alpha 20-80%, fade out last 20%
        let a: number;
        if (t < 0.2) a = (t / 0.2) * p.maxAlpha;
        else if (t < 0.8) a = p.maxAlpha;
        else a = ((1 - t) / 0.2) * p.maxAlpha;
        p.alpha = a;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${a})`;
        ctx.fill();

        if (p.life >= p.maxLife || p.y < -10) {
          particles[i] = mkParticle(w, h);
        }
      }

      // draw meteors
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx;
        m.y += m.vy;
        m.life++;

        const t = m.life / m.maxLife;
        const a = m.alpha * (1 - t);

        const tailX = m.x - m.vx * (m.length / Math.hypot(m.vx, m.vy));
        const tailY = m.y - m.vy * (m.length / Math.hypot(m.vx, m.vy));

        const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        grad.addColorStop(0, `hsla(200, 100%, 70%, 0)`);
        grad.addColorStop(1, `hsla(200, 100%, 80%, ${a})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (m.life >= m.maxLife) {
          meteors.splice(i, 1);
        }
      }

      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[1]"
      style={{ opacity: 0.75 }}
    />
  );
}
