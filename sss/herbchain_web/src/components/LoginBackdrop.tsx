import { useEffect, useRef, useState } from 'react';

/**
 * Motion backdrop for the sign-in brand panel.
 *
 * Plays `public/login-video.mp4` when that file exists. Until it does — and if
 * it ever fails to decode — it falls back to a canvas animation of the thing
 * this portal actually does: custody records travelling a herb's route from
 * collection through laboratory, manufacturing and distribution, each handoff
 * pulsing as it is written to the chain.
 *
 * Deliberately slow and low-contrast: this sits behind a wordmark and must never
 * compete with the form beside it.
 */

/** The provenance route, in normalised panel coordinates. */
const NODES = [
  { x: 0.14, y: 0.78 }, // collection
  { x: 0.34, y: 0.58 }, // cooperative
  { x: 0.52, y: 0.66 }, // laboratory
  { x: 0.70, y: 0.40 }, // manufacturing
  { x: 0.86, y: 0.22 }, // distribution
];

interface Mote {
  leg: number;
  t: number;
  speed: number;
  size: number;
}

function ProvenanceCanvas({ dark }: { dark: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    // Motes are spread along the route so the chain reads as continuously busy
    // rather than pulsing in lockstep.
    const motes: Mote[] = Array.from({ length: 14 }, (_, i) => ({
      leg: i % (NODES.length - 1),
      t: Math.random(),
      speed: 0.00022 + Math.random() * 0.00028,
      size: 1.1 + Math.random() * 1.6,
    }));

    const pt = (i: number) => ({ x: NODES[i].x * width, y: NODES[i].y * height });

    /** Control point that bows each leg into a gentle arc. */
    const ctrl = (i: number) => {
      const a = pt(i);
      const b = pt(i + 1);
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - height * 0.09 };
    };

    const quad = (a: number, c: number, b: number, t: number) =>
      (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

    const gold = dark ? '201, 154, 46' : '184, 138, 38';
    const green = dark ? '110, 200, 150' : '46, 106, 65';

    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, height);

      // Route: a faint continuous line through every stage.
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${green}, ${dark ? 0.22 : 0.16})`;
      for (let i = 0; i < NODES.length - 1; i++) {
        const a = pt(i);
        const b = pt(i + 1);
        const c = ctrl(i);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(c.x, c.y, b.x, b.y);
        ctx.stroke();
      }

      // Stage nodes, breathing out of phase with one another.
      NODES.forEach((_, i) => {
        const p = pt(i);
        const phase = (now / 2600 + i * 0.37) % 1;
        const halo = 4 + phase * 16;

        ctx.beginPath();
        ctx.arc(p.x, p.y, halo, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${gold}, ${0.1 * (1 - phase)})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${gold}, ${dark ? 0.75 : 0.55})`;
        ctx.fill();
      });

      // Records in transit.
      for (const m of motes) {
        m.t += m.speed * 16;
        if (m.t >= 1) {
          m.t = 0;
          m.leg = (m.leg + 1) % (NODES.length - 1);
        }

        const a = pt(m.leg);
        const b = pt(m.leg + 1);
        const c = ctrl(m.leg);
        const x = quad(a.x, c.x, b.x, m.t);
        const y = quad(a.y, c.y, b.y, m.t);

        // Brightest mid-leg, fading as it arrives — a handoff completing.
        const alpha = Math.sin(m.t * Math.PI) * (dark ? 0.85 : 0.6);

        ctx.beginPath();
        ctx.arc(x, y, m.size * 3.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${green}, ${alpha * 0.12})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, m.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${green}, ${alpha})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [dark]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}

interface LoginBackdropProps {
  dark: boolean;
  /** Served from /public. Absent by default — the canvas covers for it. */
  videoSrc?: string;
  posterSrc?: string;
}

export default function LoginBackdrop({
  dark,
  videoSrc = '/login-video.mp4',
  posterSrc = '/ayurvedic_bg.png',
}: LoginBackdropProps) {
  const [videoOk, setVideoOk] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Still poster underneath: covers the first frames and is the whole
          treatment when the visitor prefers reduced motion. */}
      <img
        src={posterSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />

      {!reducedMotion && (
        <>
          <video
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              videoOk ? 'opacity-60' : 'opacity-0'
            }`}
            src={videoSrc}
            poster={posterSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onCanPlay={() => setVideoOk(true)}
            onError={() => setVideoOk(false)}
          />
          {/* Canvas yields the moment a real video is available. */}
          {!videoOk && <ProvenanceCanvas dark={dark} />}
        </>
      )}

      {/* Scrim: holds the wordmark legible over whatever is playing beneath. */}
      <div
        className={`absolute inset-0 ${
          dark
            ? 'bg-gradient-to-br from-[#04140c]/92 via-[#06251a]/85 to-[#02100a]/95'
            : 'bg-gradient-to-br from-[#f7faf7]/90 via-[#eaf3ec]/85 to-[#dcebe1]/92'
        }`}
      />
    </div>
  );
}
