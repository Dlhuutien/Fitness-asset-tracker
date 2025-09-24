import { useEffect, useRef } from "react";

export default function BubbleBackground() {
  const bubbleLayerRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const container = bubbleLayerRef.current;
    if (!container) return;

    let W = container.clientWidth;
    let H = container.clientHeight;
    const NUM = window.innerWidth < 640 ? 18 : 35;

    const rand = (a, b) => a + Math.random() * (b - a);
    const bubbles = [];

    for (let i = 0; i < NUM; i++) {
      const el = document.createElement("div");
      const size = rand(40, 160);
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.borderRadius = "50%";
      el.style.position = "absolute";
      el.style.background = `rgba(34,197,94,${rand(0.08, 0.25)})`;
      el.style.opacity = 0;
      el.style.transform = "scale(0)";

      const x = rand(0, W - size);
      const y = rand(0, H - size);
      container.appendChild(el);

      setTimeout(() => {
        el.style.transition = "opacity 1s ease, transform 1s ease";
        el.style.opacity = 1;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1)`;
      }, rand(0, 2) * 1000);

      bubbles.push({
        el,
        x,
        y,
        vx: rand(-0.6, 0.6),
        vy: rand(-0.5, 0.5),
        radius: size / 2,
      });
    }

    const onResize = () => {
      W = container.clientWidth;
      H = container.clientHeight;
    };
    window.addEventListener("resize", onResize);

    function step() {
      for (let b of bubbles) {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < 0 || b.x + b.radius * 2 > W) b.vx *= -0.7;
        if (b.y < 0 || b.y + b.radius * 2 > H) b.vy *= -0.7;
        b.x = Math.max(0, Math.min(b.x, W - b.radius * 2));
        b.y = Math.max(0, Math.min(b.y, H - b.radius * 2));
        const scale = 0.95 + Math.random() * 0.08;
        b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) scale(${scale})`;
      }
      rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      bubbles.forEach((b) => b.el.remove());
    };
  }, []);

  return <div ref={bubbleLayerRef} className="absolute inset-0 z-0"></div>;
}
