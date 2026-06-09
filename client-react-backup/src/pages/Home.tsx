import { Link } from "react-router-dom";
import React from "react";

/* ═══════════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════════ */

interface GlassEffectProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  to?: string;
  href?: string;
  target?: string;
}

interface DockItem {
  emoji: string;
  label: string;
  gradient: string;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   SVG Glass Distortion Filter Component (EXACTLY from reference)
   ═══════════════════════════════════════════════════════════════════════════════ */

const GlassFilter: React.FC = () => (
  <svg style={{ display: "none" }}>
    <filter
      id="glass-distortion"
      x="0%"
      y="0%"
      width="100%"
      height="100%"
      filterUnits="objectBoundingBox"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.001 0.005"
        numOctaves={1}
        seed={17}
        result="turbulence"
      />
      <feComponentTransfer in="turbulence" result="mapped">
        <feFuncR type="gamma" amplitude={1} exponent={10} offset={0.5} />
        <feFuncG type="gamma" amplitude={0} exponent={1} offset={0} />
        <feFuncB type="gamma" amplitude={0} exponent={1} offset={0.5} />
      </feComponentTransfer>
      <feGaussianBlur in="turbulence" stdDeviation={3} result="softMap" />
      <feSpecularLighting
        in="softMap"
        surfaceScale={5}
        specularConstant={1}
        specularExponent={100}
        lightingColor="white"
        result="specLight"
      >
        <fePointLight x={-200} y={-200} z={300} />
      </feSpecularLighting>
      <feComposite
        in="specLight"
        operator="arithmetic"
        k1={0}
        k2={1}
        k3={1}
        k4={0}
        result="litImage"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="softMap"
        scale={200}
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════════════════
   Glass Effect Wrapper Component (EXACTLY from reference)
   ═══════════════════════════════════════════════════════════════════════════════ */

const GlassEffect: React.FC<GlassEffectProps> = ({
  children,
  className = "",
  style = {},
  to,
  href,
  target = "_blank",
}) => {
  const glassStyle = {
    boxShadow: "0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)",
    transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
    ...style,
  };

  const content = (
    <div
      className={`relative flex font-semibold overflow-hidden text-black cursor-pointer transition-all duration-700 ${className}`}
      style={glassStyle}
    >
      {/* Glass Layers */}
      <div
        className="absolute inset-0 z-0 overflow-hidden rounded-inherit rounded-3xl"
        style={{
          backdropFilter: "blur(3px)",
          filter: "url(#glass-distortion)",
          isolation: "isolate",
        }}
      />
      <div
        className="absolute inset-0 z-10 rounded-inherit"
        style={{ background: "rgba(255, 255, 255, 0.25)" }}
      />
      <div
        className="absolute inset-0 z-20 rounded-inherit rounded-3xl overflow-hidden"
        style={{
          boxShadow:
            "inset 2px 2px 1px 0 rgba(255, 255, 255, 0.5), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.5)",
        }}
      />

      {/* Content */}
      <div className="relative z-30">{children}</div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block no-underline" style={{ textDecoration: "none" }}>
        {content}
      </Link>
    );
  }

  return href ? (
    <a href={href} target={target} rel="noopener noreferrer" className="block no-underline" style={{ textDecoration: "none" }}>
      {content}
    </a>
  ) : (
    content
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   macOS/visionOS Glass App Dock (EXACTLY styled from reference)
   ═══════════════════════════════════════════════════════════════════════════════ */

const GlassDock: React.FC<{ items: DockItem[]; to?: string }> = ({
  items,
  to,
}) => (
  <GlassEffect
    to={to}
    className="rounded-3xl p-3 hover:p-4 hover:rounded-4xl w-auto max-w-full"
  >
    <div className="flex items-center justify-center gap-2 rounded-3xl p-3 py-0 px-0.5 overflow-hidden">
      {items.map((item, index) => (
        <div
          key={index}
          className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl transition-all duration-700 hover:scale-110 cursor-pointer shadow-md select-none group/item relative overflow-hidden"
          style={{
            background: item.gradient,
            transformOrigin: "center center",
            transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
            boxShadow: "inset 0 3px 6px rgba(255,255,255,0.45), inset 0 -3px 6px rgba(0,0,0,0.25), 0 8px 16px rgba(0,0,0,0.2)",
          }}
          title={item.label}
        >
          {/* Glossy overlay sheen for round iOS look */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none" />
          <span className="relative z-10 filter drop-shadow-md">{item.emoji}</span>
        </div>
      ))}
    </div>
  </GlassEffect>
);

/* ═══════════════════════════════════════════════════════════════════════════════
   Glass Capsule Search-bar Button (EXACTLY styled from reference)
   ═══════════════════════════════════════════════════════════════════════════════ */

const GlassButton: React.FC<{ children: React.ReactNode; to?: string }> = ({
  children,
  to,
}) => (
  <GlassEffect
    to={to}
    className="rounded-3xl px-10 py-6 hover:px-11 hover:py-7 hover:rounded-4xl overflow-hidden"
  >
    <div
      className="transition-all duration-700 hover:scale-95"
      style={{
        transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
      }}
    >
      {children}
    </div>
  </GlassEffect>
);

/* ═══════════════════════════════════════════════════════════════════════════════
   Dock Items — MeetMidway place types with vibrant app-style gradients
   ═══════════════════════════════════════════════════════════════════════════════ */

const DOCK_ITEMS: DockItem[] = [
  { emoji: "🍽️", label: "Eat", gradient: "linear-gradient(135deg, #ff5757 0%, #ff914d 100%)" },
  { emoji: "☕", label: "Coffee", gradient: "linear-gradient(135deg, #e6a15c 0%, #ab692e 100%)" },
  { emoji: "🌳", label: "Parks", gradient: "linear-gradient(135deg, #4ef289 0%, #00a851 100%)" },
  { emoji: "🍺", label: "Bars", gradient: "linear-gradient(135deg, #ffde59 0%, #ff914d 100%)" },
  { emoji: "🎬", label: "Cinema", gradient: "linear-gradient(135deg, #8c52ff 0%, #ff914d 100%)" },
  { emoji: "🏛️", label: "Museum", gradient: "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)" },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   Home Page
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050510] font-sans">
      <GlassFilter />
      
      {/* Infinite scrolling background container — 100% viewport coverage, absolute layout */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none w-screen h-screen">
        <div 
          className="absolute left-0 top-0 w-screen h-[200vh] flex flex-col"
          style={{
            animation: "scrollBackground 60s linear infinite",
          }}
        >
          <img 
            src="https://images.unsplash.com/photo-1432251407527-504a6b4174a2?q=80&w=1480&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
            alt="Background Part 1" 
            className="w-screen h-screen object-cover block"
            style={{ minWidth: "100vw", minHeight: "100vh" }}
          />
          <img 
            src="https://images.unsplash.com/photo-1432251407527-504a6b4174a2?q=80&w=1480&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
            alt="Background Part 2" 
            className="w-screen h-screen object-cover block"
            style={{ minWidth: "100vw", minHeight: "100vh" }}
          />
        </div>
      </div>

      {/* Subtle visionOS dark radial veil for legibility */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: "radial-gradient(circle at center, rgba(10, 10, 25, 0.1) 0%, rgba(5, 5, 15, 0.55) 100%)",
        }}
      />

      {/* Main Content Container — perfectly centered via flex-col inside block wrapper */}
      <div className="relative z-20 flex flex-col gap-8 items-center justify-center min-h-screen w-full px-4 py-12 text-center">
        
        {/* Glass Logo/Title Badge */}
        <div className="mb-4">
          <GlassEffect className="rounded-3xl px-6 py-3 flex items-center gap-3 hover:scale-105 hover:rounded-4xl">
            <span className="text-3xl md:text-4xl animate-bounce-slow select-none">📍</span>
            <h1
              className="text-3xl md:text-5xl font-black text-white tracking-tight m-0 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-blue-200"
              style={{
                letterSpacing: "-0.03em",
                fontFamily: "'DM Sans', sans-serif",
                textShadow: "0 2px 10px rgba(255,255,255,0.1)",
              }}
            >
              MeetMidway
            </h1>
          </GlassEffect>
        </div>

        {/* Description Tagline Badge */}
        <div className="max-w-md mx-auto mb-2">
          <p className="text-white/90 text-base md:text-lg font-medium tracking-wide leading-relaxed m-0 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            Find the fairest meetup spot with your friends
          </p>
        </div>

        {/* macOS/visionOS-style Glass App Dock */}
        <div className="mb-2 px-2 flex justify-center w-full">
          <GlassDock items={DOCK_ITEMS} to="/create" />
        </div>

        {/* Primary CTA Glass Capsule Button (matches search bar style in expected screenshot) */}
        <div className="w-full max-w-md md:max-w-lg mb-2 px-2 flex justify-center">
          <GlassButton to="/create">
            <span className="text-lg md:text-2xl text-white font-bold tracking-wider">
              Where should we meet?
            </span>
          </GlassButton>
        </div>

        {/* Secondary Invitee Glass Badge */}
        <Link
          to="/join"
          className="text-sm font-semibold tracking-wider text-white/75 hover:text-white transition-all duration-300 flex items-center gap-1.5 no-underline mt-4 bg-white/5 hover:bg-white/10 px-6 py-3 rounded-full border border-white/10 hover:border-white/20 shadow-md backdrop-blur-md"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
        >
          <span>Have an invite code?</span>
          <span className="text-blue-300 hover:text-blue-200 underline underline-offset-4">
            Join a trip
          </span>
        </Link>
      </div>

      {/* Infinite scrolling & micro-animation styles */}
      <style>{`
        @keyframes scrollBackground {
          0% { transform: translateY(0); }
          100% { transform: translateY(-100vh); }
        }
        .animate-bounce-slow {
          animation: bounceSlow 3.5s infinite ease-in-out;
        }
        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}



