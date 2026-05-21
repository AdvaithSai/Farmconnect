import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Wheat, Users, Handshake } from 'lucide-react';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  badge: string;
  icon: React.ReactNode;
  accentColor: string;
}

const slides: Slide[] = [
  {
    id: 1,
    badge: "Direct Marketplace",
    title: "Revolutionizing Farm-to-Retail Trade",
    subtitle: "FRESH HARVEST",
    description: "Connect directly with local agricultural producers. Eliminate traditional supply-chain layers to get the absolute freshest crops directly at source values.",
    image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1600&q=80",
    icon: <Wheat className="w-5 h-5 text-yellow-400" />,
    accentColor: "from-amber-600/30 to-amber-900/40"
  },
  {
    id: 2,
    badge: "Transparent Bidding",
    title: "Fair Direct Pricing for Every Farmer",
    subtitle: "OPEN OFFERS",
    description: "Our live interactive negotiation hub enables farmers and retailers to propose, match, and confirm produce transactions securely with complete pricing transparency.",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80",
    icon: <Handshake className="w-5 h-5 text-green-400" />,
    accentColor: "from-green-600/30 to-green-900/40"
  },
  {
    id: 3,
    badge: "Sustainable Future",
    title: "Empowering Local Farming Communities",
    subtitle: "SUPPORT LOCAL",
    description: "Support organic farming practices, reduce visual and material logistic waste, and boost regional agricultural economies through direct collaborative integration.",
    image: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1600&q=80",
    icon: <Users className="w-5 h-5 text-emerald-400" />,
    accentColor: "from-emerald-600/30 to-emerald-900/40"
  }
];

export default function ScrollSlider() {
  const [current, setCurrent] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStart = useRef({ x: 0, y: 0 });

  // Auto-advance mechanism with visual progress bar (reset on manual changes)
  useEffect(() => {
    const duration = 7500; // 7.5 seconds per slide
    const interval = 50;   // Update progress every 50ms
    let elapsed = 0;

    const startTimer = () => {
      timerRef.current = setInterval(() => {
        elapsed += interval;
        setScrollProgress(Math.min((elapsed / duration) * 100, 100));

        if (elapsed >= duration) {
          handleNext();
          elapsed = 0;
        }
      }, interval);
    };

    startTimer();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [current, isAnimating]);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent((prev) => (prev + 1) % slides.length);
    setScrollProgress(0);
    setTimeout(() => setIsAnimating(false), 900);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    setScrollProgress(0);
    setTimeout(() => setIsAnimating(false), 900);
  };

  const handleDotClick = (index: number) => {
    if (isAnimating || index === current) return;
    setIsAnimating(true);
    setCurrent(index);
    setScrollProgress(0);
    setTimeout(() => setIsAnimating(false), 900);
  };

  // 3D Parallax Mouse Move Listener
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientWidth, clientHeight } = e.currentTarget;
    const x = (e.clientX - clientWidth / 2) / (clientWidth / 2); // Normalizes between -1 and 1
    const y = (e.clientY - clientHeight / 2) / (clientHeight / 2); // Normalizes between -1 and 1
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  // Touch swiping navigation for mobile viewports
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isAnimating) return;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStart.current.x;
    const diffY = touch.clientY - touchStart.current.y;

    // Detect horizontal swipes primarily
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > 60) {
        if (diffX < 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    } 
    // Detect vertical swipe only when page is scrolled strictly at top
    else {
      const isAtTop = window.scrollY === 0;
      if (Math.abs(diffY) > 60 && isAtTop) {
        if (diffY < 0) { // Swiped upwards (scroll down)
          if (current < slides.length - 1) {
            handleNext();
          }
        } else { // Swiped downwards (scroll up)
          if (current > 0) {
            handlePrev();
          }
        }
      }
    }
  };

  // Scroll Interception Wheel Event Hook
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      const isAtTop = window.scrollY === 0;

      // Scroll Down (deltaY > 0)
      if (e.deltaY > 0) {
        // If we are not on the last slide, lock normal browser scroll and change slide
        if (current < slides.length - 1 && isAtTop) {
          if (e.cancelable) e.preventDefault();
          if (!isAnimating) {
            handleNext();
          }
        }
      } 
      // Scroll Up (deltaY < 0)
      else if (e.deltaY < 0) {
        // If we are not on the first slide, lock normal browser scroll and change slide
        if (current > 0 && isAtTop) {
          if (e.cancelable) e.preventDefault();
          if (!isAnimating) {
            handlePrev();
          }
        }
      }
    };

    // Attach active event listener to bypass passive block
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [current, isAnimating]);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-screen min-h-[600px] overflow-hidden bg-black select-none"
    >
      {/* Background Images with smooth 3D Parallax & Zoom */}
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            idx === current ? 'opacity-100 z-0' : 'opacity-0 -z-10'
          }`}
        >
          {/* Parallax Overlay - Dark gradient mask for supreme text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-10 pointer-events-none" />
          <div className={`absolute inset-0 bg-gradient-to-b ${slide.accentColor} mix-blend-multiply z-10 pointer-events-none`} />
          
          <img
            src={slide.image}
            alt={slide.title}
            className={`w-full h-full object-cover transition-all duration-[7500ms] ease-out pointer-events-none ${
              idx === current ? 'scale-110' : 'scale-100'
            }`}
            style={{
              transform: idx === current 
                ? `scale(1.12) translate(${mousePos.x * -16}px, ${mousePos.y * -16}px)` 
                : 'scale(1.0) translate(0px, 0px)',
              transition: idx === current 
                ? 'transform 0.15s ease-out' 
                : 'transform 1.2s ease-in-out, opacity 1.0s ease-in-out'
            }}
          />
        </div>
      ))}

      {/* Main Content Area - Shifted dynamically based on normalized mouse coordinates */}
      <div 
        className="absolute inset-0 z-20 flex items-center pt-[72px]"
        style={{
          transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`,
          transition: isAnimating ? 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1)' : 'transform 0.15s ease-out'
        }}
      >
        <div className="container mx-auto px-6 md:px-12 lg:px-16">
          <div className="max-w-3xl text-left">
            {/* Top Badge */}
            <div className="overflow-hidden mb-4">
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs font-bold text-white uppercase tracking-wider transform transition-all duration-700 ease-out"
                style={{
                  transform: isAnimating ? 'translateY(110%)' : 'translateY(0)',
                  opacity: isAnimating ? 0 : 1
                }}
              >
                {slides[current].icon}
                {slides[current].badge}
              </div>
            </div>

            {/* Subtitle */}
            <div className="overflow-hidden mb-3">
              <span 
                className="block text-yellow-400 font-extrabold text-sm md:text-base tracking-[0.2em] uppercase transform transition-all duration-700 delay-100 ease-out"
                style={{
                  transform: isAnimating ? 'translateY(110%)' : 'translateY(0)',
                  opacity: isAnimating ? 0 : 1
                }}
              >
                {slides[current].subtitle}
              </span>
            </div>

            {/* Title with stagger effect */}
            <div className="overflow-hidden mb-6">
              <h1 
                className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight transform transition-all duration-700 delay-200 ease-out"
                style={{
                  transform: isAnimating ? 'translateY(110%)' : 'translateY(0)',
                  opacity: isAnimating ? 0 : 1
                }}
              >
                {slides[current].title}
              </h1>
            </div>

            {/* Description with delay */}
            <div className="overflow-hidden mb-10">
              <p 
                className="text-gray-200 text-sm md:text-lg leading-relaxed max-w-xl font-medium transform transition-all duration-700 delay-300 ease-out"
                style={{
                  transform: isAnimating ? 'translateY(110%)' : 'translateY(0)',
                  opacity: isAnimating ? 0 : 1
                }}
              >
                {slides[current].description}
              </p>
            </div>

            {/* Premium action buttons with slide-in staggered entrance */}
            <div className="overflow-hidden">
              <div 
                className="flex flex-col sm:flex-row gap-4 transform transition-all duration-700 delay-400 ease-out"
                style={{
                  transform: isAnimating ? 'translateY(110%)' : 'translateY(0)',
                  opacity: isAnimating ? 0 : 1
                }}
              >
                <Link
                  to="/register"
                  className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-green-950 font-extrabold rounded-full transition-all duration-200 text-center shadow-lg hover:shadow-yellow-500/20 transform hover:-translate-y-1 cursor-pointer tracking-wider text-xs uppercase"
                >
                  Get Started Direct
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 border border-white/30 hover:border-white bg-white/5 hover:bg-white/10 text-white font-extrabold rounded-full transition-all duration-200 text-center backdrop-blur-md transform hover:-translate-y-1 cursor-pointer tracking-wider text-xs uppercase"
                >
                  Partner Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Interactive Sidebar Controller - Golden Active Timeline Indicator */}
      <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-6">
        {slides.map((slide, idx) => (
          <button
            key={slide.id}
            onClick={() => handleDotClick(idx)}
            className="group relative flex items-center justify-center w-8 h-8 focus:outline-none cursor-pointer"
          >
            {/* Hover Tooltip */}
            <span className="absolute right-10 px-3 py-1 rounded bg-green-950/90 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none border border-white/10">
              {slide.subtitle}
            </span>
            {/* Outer Circle Indicator */}
            <span className={`absolute w-7 h-7 rounded-full border border-white/30 transition-transform duration-300 ${
              idx === current ? 'scale-100 border-yellow-400' : 'scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-50'
            }`} />
            {/* Center dot */}
            <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              idx === current ? 'bg-yellow-400 scale-125' : 'bg-white/50 group-hover:bg-white'
            }`} />
          </button>
        ))}
      </div>

      {/* Bottom Visual Timeline & Navigation Bar */}
      <div className="absolute bottom-6 left-0 right-0 z-30 bg-transparent px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Navigation Arrows */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            className="w-11 h-11 rounded-full border border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90"
            title="Previous Slide"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="w-11 h-11 rounded-full border border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90"
            title="Next Slide"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Current timeline progress bar */}
        <div className="w-full sm:w-64 bg-white/15 h-1 rounded-full overflow-hidden">
          <div 
            className="bg-yellow-400 h-full transition-all duration-50 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.5)]"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
