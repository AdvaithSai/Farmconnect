import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  type: 'spark' | 'leaf' | 'grain';
}

const CropMagic = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5, isHovering: false });
  const [clickWave, setClickWave] = useState({ active: false, x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);

  // Self-contained high-performance keyframe styles
  const animationStyles = `
    @keyframes spin-clockwise {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes spin-counter {
      from { transform: rotate(360deg); }
      to { transform: rotate(360deg); }
      to { transform: rotate(0deg); }
    }
    @keyframes float-magic {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-12px) rotate(3deg); }
    }
    @keyframes pulse-magic-glow {
      0%, 100% { opacity: 0.45; filter: drop-shadow(0 0 10px rgba(250, 204, 21, 0.4)); }
      50% { opacity: 0.85; filter: drop-shadow(0 0 25px rgba(52, 211, 153, 0.8)); }
    }
    .animate-spin-cw {
      animation: spin-clockwise 25s linear infinite;
    }
    .animate-spin-ccw {
      animation: spin-counter 18s linear infinite;
    }
    .animate-spin-fast-cw {
      animation: spin-clockwise 10s linear infinite;
    }
    .animate-float-magic {
      animation: float-magic 5s ease-in-out infinite;
    }
    .animate-pulse-glow {
      animation: pulse-magic-glow 3.5s ease-in-out infinite;
    }
  `;

  // Handle Mouse Interactions for 3D Parallax Tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y, isHovering: true });
  };

  const handleMouseLeave = () => {
    setMousePos((prev) => ({ ...prev, isHovering: false }));
  };

  // Trigger MCU Particle Burst on Click
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !canvasRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    setClickWave({ active: true, x: clickX, y: clickY });
    setTimeout(() => setClickWave({ active: false, x: 0, y: 0 }), 500);

    // Spawn 65+ energetic golden/green sparks in a circular burst
    const newParticles: Particle[] = [];
    for (let i = 0; i < 70; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 5.5;
      
      const typeRand = Math.random();
      const type = typeRand < 0.4 ? 'spark' : typeRand < 0.75 ? 'grain' : 'leaf';
      
      const color = type === 'leaf' 
        ? `rgba(${34 + Math.random() * 40}, ${197 + Math.random() * 40}, ${94}, ${0.8 + Math.random() * 0.2})` // Emerald Green
        : `rgba(${250 + Math.random() * 5}, ${204 + Math.random() * 40}, ${21}, ${0.8 + Math.random() * 0.2})`; // Golden Amber

      newParticles.push({
        x: clickX,
        y: clickY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: type === 'leaf' ? 4 + Math.random() * 6 : 2 + Math.random() * 3,
        alpha: 1,
        decay: 0.015 + Math.random() * 0.02,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: -0.1 + Math.random() * 0.2,
        color,
        type,
      });
    }

    particlesRef.current = [...particlesRef.current, ...newParticles];
  };

  // Canvas Particle Physics Engine Loops
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Main Draw & Update loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Keep spawning ambient floating agricultural sparks from bottom/center
      if (Math.random() < 0.12 && particlesRef.current.length < 130) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 60;
        const startX = canvas.width / 2 + Math.cos(angle) * radius;
        const startY = canvas.height / 2 + Math.sin(angle) * radius + 40; // centered slightly low near hands
        
        const typeRand = Math.random();
        const type = typeRand < 0.5 ? 'spark' : typeRand < 0.85 ? 'grain' : 'leaf';
        const color = type === 'leaf' 
          ? 'rgba(52, 211, 153, 0.65)' // Emerald
          : 'rgba(250, 204, 21, 0.65)';  // Amber

        particlesRef.current.push({
          x: startX,
          y: startY,
          vx: -0.5 + Math.random() * 1,
          vy: -0.4 - Math.random() * 1.6, // floating upwards
          size: type === 'leaf' ? 3 + Math.random() * 4 : 1.5 + Math.random() * 2,
          alpha: 0.1, // fade in
          decay: 0.003 + Math.random() * 0.007,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: -0.02 + Math.random() * 0.04,
          color,
          type,
        });
      }

      // Update and draw existing particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        
        // Sway horizontally
        p.vx += Math.sin(p.rotation) * 0.02;

        p.rotation += p.rotationSpeed;

        // Apply mouse attraction/gravitational pull if hovering
        if (mousePos.isHovering && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const targetX = mousePos.x * rect.width;
          const targetY = mousePos.y * rect.height;
          
          const dx = targetX - p.x;
          const dy = targetY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 180) {
            // gentle pull towards cursor
            p.vx += (dx / dist) * 0.04;
            p.vy += (dy / dist) * 0.04;
          }
        }

        // Adjust alpha
        if (p.alpha < 0.95 && p.decay < 0.01) {
          p.alpha += 0.02; // fade in gently at first
        } else {
          p.alpha -= p.decay; // decay
        }

        if (p.alpha <= 0 || p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
          return false; // remove
        }

        // Draw particle based on agricultural type
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

        if (p.type === 'spark') {
          // Glowy round mystical particle
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.fill();
        } else if (p.type === 'grain') {
          // Levitating wheat grain (elliptical shape)
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 1.6, p.size, 0, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 6;
          ctx.shadowColor = p.color;
          ctx.fill();
        } else {
          // Floating emerald leaf particle
          ctx.beginPath();
          ctx.moveTo(0, -p.size * 1.5);
          ctx.quadraticCurveTo(p.size * 1.1, -p.size * 0.3, 0, p.size * 1.5);
          ctx.quadraticCurveTo(-p.size * 1.1, -p.size * 0.3, 0, -p.size * 1.5);
          ctx.closePath();
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.fill();
        }

        ctx.restore();
        return true;
      });

      // Draw active ripple ring on canvas if clicked
      if (clickWave.active) {
        ctx.beginPath();
        ctx.arc(clickWave.x, clickWave.y, 45, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.25)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [mousePos]);

  // Calculate 3D rotations based on mouse cursor position
  const get3DStyle = () => {
    if (!mousePos.isHovering) {
      return {
        transform: 'rotateX(0deg) rotateY(0deg) scale(1)',
        transition: 'transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)',
      };
    }
    const rotateX = (mousePos.y - 0.5) * -22; // 22 degrees max tilt
    const rotateY = (mousePos.x - 0.5) * 22;
    return {
      transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.025)`,
      transition: 'transform 0.1s ease-out',
    };
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[480px] md:h-[520px] rounded-3xl bg-gradient-to-br from-green-950/40 via-emerald-950/20 to-black/60 border border-white/10 backdrop-blur-md overflow-hidden flex items-center justify-center cursor-pointer group shadow-2xl select-none"
      style={{ perspective: '1000px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleCanvasClick}
    >
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />

      {/* Embedded Particle Background Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none z-0" 
      />

      {/* Magical 3D Tilting Mandala Group */}
      <div 
        className="relative z-10 w-[380px] h-[380px] flex items-center justify-center"
        style={get3DStyle()}
      >
        {/* Glow Ring Behind Everything */}
        <div className="absolute w-[240px] h-[240px] bg-gradient-to-tr from-yellow-500/20 to-emerald-500/25 rounded-full blur-2xl opacity-60 animate-pulse-glow" />

        {/* Vector SVG Mandalas (Nested rotating Doctor Strange shields) */}
        <svg 
          viewBox="0 0 400 400" 
          className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_0_12px_rgba(234,179,8,0.3)]"
        >
          <defs>
            <linearGradient id="goldenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
            <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* 1. OUTERMOST STALKS MANDALA (Slow clockwise rotation) */}
          <g className="animate-spin-cw">
            {/* Outer dotted circles */}
            <circle cx="200" cy="200" r="182" fill="none" stroke="url(#goldenGrad)" strokeWidth="1" strokeDasharray="3, 5" />
            <circle cx="200" cy="200" r="176" fill="none" stroke="url(#goldenGrad)" strokeWidth="2.5" strokeDasharray="25, 12, 5, 12" />
            
            {/* Circular Wheat stalk indicators orbiting */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
              <g key={angle} transform={`rotate(${angle}, 200, 200) translate(200, 15)`}>
                {/* Micro wheat seed drawings */}
                <ellipse cx="0" cy="0" rx="3" ry="5" fill="url(#goldenGrad)" />
                <ellipse cx="-4" cy="-4" rx="2" ry="4" fill="url(#goldenGrad)" transform="rotate(-30)" />
                <ellipse cx="4" cy="-4" rx="2" ry="4" fill="url(#goldenGrad)" transform="rotate(30)" />
                <line x1="0" y1="5" x2="0" y2="12" stroke="url(#goldenGrad)" strokeWidth="1.5" />
              </g>
            ))}
          </g>

          {/* 2. GEOMETRIC MAGIC RUNES LAYER (Middle, counter-clockwise rotation) */}
          <g className="animate-spin-ccw origin-center opacity-85">
            <circle cx="200" cy="200" r="148" fill="none" stroke="url(#emeraldGrad)" strokeWidth="1.5" strokeDasharray="8, 6" />
            
            {/* Mystical intersecting square runes (Doctor Strange magic squares) */}
            <rect x="94" y="94" width="212" height="212" rx="16" fill="none" stroke="url(#emeraldGrad)" strokeWidth="0.8" transform="rotate(0, 200, 200)" />
            <rect x="94" y="94" width="212" height="212" rx="16" fill="none" stroke="url(#goldenGrad)" strokeWidth="0.8" transform="rotate(30, 200, 200)" />
            <rect x="94" y="94" width="212" height="212" rx="16" fill="none" stroke="url(#emeraldGrad)" strokeWidth="0.8" transform="rotate(60, 200, 200)" />
            
            {/* Circular Dash segments with leaf shapes */}
            <circle cx="200" cy="200" r="128" fill="none" stroke="url(#emeraldGrad)" strokeWidth="2.5" strokeDasharray="45, 15" />
            
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <path
                key={angle}
                d="M200 64 Q204 72 200 80 Q196 72 200 64"
                fill="url(#emeraldGrad)"
                transform={`rotate(${angle}, 200, 200)`}
              />
            ))}
          </g>

          {/* 3. INNER LEAF RUNES LAYER (Fast clockwise rotation) */}
          <g className="animate-spin-fast-cw origin-center opacity-90">
            <circle cx="200" cy="200" r="105" fill="none" stroke="url(#goldenGrad)" strokeWidth="1.5" strokeDasharray="20, 8, 4, 8" />
            
            {/* Orbiting Golden/Emerald leaves pointing outward */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <path
                key={angle}
                d="M200 88 C204 96 209 100 200 108 C191 100 196 96 200 88"
                fill="url(#emeraldGrad)"
                transform={`rotate(${angle}, 200, 200)`}
              />
            ))}
            
            {/* Concentric helper circle */}
            <circle cx="200" cy="200" r="76" fill="none" stroke="url(#goldenGrad)" strokeWidth="1" />
          </g>

          {/* 4. SHIELD SEED/STEM CENTER (Floats up and down dynamically) */}
          <g className="animate-float-magic origin-center">
            {/* Thin inner rings */}
            <circle cx="200" cy="200" r="54" fill="none" stroke="url(#goldenGrad)" strokeWidth="1.5" strokeDasharray="4, 4" />
            <circle cx="200" cy="200" r="46" fill="none" stroke="url(#emeraldGrad)" strokeWidth="1" />

            {/* Glowing farmer hands outline cupping the magic seedling */}
            <g className="opacity-95 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">
              {/* Left Hand cupping */}
              <path
                d="M165 240 C160 232 153 216 150 206 C148 196 150 192 153 192 C156 192 159 201 164 209 C161 196 160 186 161 178 C162 173 166 173 167 179 C170 191 174 204 177 212 C174 196 173 186 175 178 C176 173 180 173 181 179 C183 193 186 208 187 217 C185 204 185 194 187 186 C188 181 192 181 193 187 C194 199 195 214 195 221 C195 228 190 238 181 243"
                fill="none"
                stroke="url(#goldenGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Right Hand cupping (Mirrored) */}
              <path
                d="M235 240 C240 232 247 216 250 206 C252 196 250 192 247 192 C244 192 241 201 236 209 C239 196 240 186 239 178 C238 173 234 173 233 179 C230 191 226 204 223 212 C226 196 227 186 225 178 C224 173 220 173 219 179 C217 193 214 208 213 217 C215 204 215 194 213 186 C212 181 208 181 207 187 C206 199 205 214 205 221 C205 228 210 238 219 243"
                fill="none"
                stroke="url(#goldenGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>

            {/* Glowing magic seedling cupped by hands */}
            <g transform="translate(192, 134) scale(0.85)">
              {/* Core golden aura background */}
              <circle cx="10" cy="18" r="15" fill="url(#goldenGrad)" className="opacity-40 blur-sm" />
              
              {/* Stem */}
              <path
                d="M10 32 Q10 18 20 8"
                fill="none"
                stroke="url(#goldenGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Left sprout leaf */}
              <path
                d="M10 22 C4 20 -1 11 9 9 C11 16 11 20 10 22"
                fill="url(#emeraldGrad)"
              />
              {/* Right sprout leaf */}
              <path
                d="M10 16 C16 14 20 5 10 3 C8 10 8 14 10 16"
                fill="url(#goldenGrad)"
              />
            </g>
          </g>
        </svg>

        {/* Small Central Levitating Glowing Orb */}
        <div className="absolute w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 blur-[6px] opacity-75 animate-float-magic pointer-events-none z-20" />
      </div>

      {/* Floating Interactive CTA Overlay on Hover */}
      <div className="absolute bottom-6 left-6 right-6 z-20 flex items-center justify-between bg-black/50 border border-white/10 backdrop-blur-md rounded-2xl py-3 px-5 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">MCU Crop Magic</span>
          <span className="text-xs text-white/70">Click anywhere to cast harvest particles!</span>
        </div>
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500 text-green-950 font-bold text-xs animate-bounce">
          ⚡
        </div>
      </div>

      {/* Subtle border corner glow effects */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-yellow-500/10 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-emerald-500/10 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
};

export default CropMagic;
