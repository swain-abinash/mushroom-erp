"use client";

interface MushroomLoaderProps {
  /**
   * Animation style variant:
   * - "shop-jump": A tiny realistic mushroom jumping up & down happily in place over a miniature shop icon
   * - "dance-walk": Stylish stroll left-to-right with swinging boots, hands & musical notes
   * - "bounce": Classic organic pulse & bounce with floating glowing spores
   * @default "shop-jump"
   */
  variant?: "shop-jump" | "dance-walk" | "bounce";
  /**
   * Optional custom text message below the loader
   */
  message?: string;
  /**
   * Subtitle or secondary helpful text
   */
  subMessage?: string;
  /**
   * Visual size of the mushroom loader
   * @default "xl"
   */
  size?: "sm" | "md" | "lg" | "xl";
  /**
   * If true, centers the loader across full viewport with smooth blur backdrop
   * @default false
   */
  fullScreen?: boolean;
  /**
   * Optional extra container classes
   */
  className?: string;
}

const sizeConfig = {
  sm: { shopWidth: 120, shopHeight: 128, danceWidth: 120, danceHeight: 82, bounceSize: 76, textSize: "text-xs", subSize: "text-[10px]" },
  md: { shopWidth: 170, shopHeight: 182, danceWidth: 180, danceHeight: 124, bounceSize: 120, textSize: "text-sm", subSize: "text-xs" },
  lg: { shopWidth: 220, shopHeight: 236, danceWidth: 240, danceHeight: 165, bounceSize: 160, textSize: "text-base", subSize: "text-xs" },
  xl: { shopWidth: 260, shopHeight: 278, danceWidth: 300, danceHeight: 206, bounceSize: 200, textSize: "text-lg", subSize: "text-sm" },
};

/**
 * Tiny Realistic Mushroom Jumping Up & Down Over a Miniature Shop Icon
 */
function ShopJumpMushroomSvg({ width, height }: { width: number; height: number }) {
  return (
    <svg
      viewBox="0 0 280 300"
      width={width}
      height={height}
      className="relative z-10 drop-shadow-[0_12px_28px_rgba(15,58,47,0.22)] dark:drop-shadow-[0_12px_32px_rgba(34,197,94,0.32)] select-none pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="jumpCapGradJsx" cx="38%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#ff4757" />
          <stop offset="35%" stopColor="#ee2a3a" />
          <stop offset="75%" stopColor="#b31221" />
          <stop offset="100%" stopColor="#6e050f" />
        </radialGradient>

        <linearGradient id="jumpStemGradJsx" x1="25%" y1="0%" x2="75%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#fdf8ed" />
          <stop offset="100%" stopColor="#e8dec8" />
        </linearGradient>

        <linearGradient id="awningGreenJsx" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#166534" />
          <stop offset="100%" stopColor="#0e4422" />
        </linearGradient>
        <linearGradient id="awningCreamJsx" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fefce8" />
          <stop offset="100%" stopColor="#faeed1" />
        </linearGradient>

        <linearGradient id="shopWoodJsx" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#6b2f0a" />
        </linearGradient>

        <radialGradient id="shopWindowGlowJsx" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="70%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>

        <filter id="jumpSparkleGlowJsx" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <style>{`
        @keyframes happyJumpPhysicsJsx {
          0% {
            transform: translateY(0px) scale(1.15, 0.85);
          }
          14% {
            transform: translateY(-8px) scale(0.92, 1.14);
          }
          38% {
            transform: translateY(-54px) scale(1.02, 0.98);
          }
          50% {
            transform: translateY(-56px) scale(1, 1);
          }
          65% {
            transform: translateY(-40px) scale(0.96, 1.08);
          }
          88% {
            transform: translateY(-4px) scale(0.95, 1.1);
          }
          94% {
            transform: translateY(2px) scale(1.22, 0.78);
          }
          100% {
            transform: translateY(0px) scale(1.15, 0.85);
          }
        }

        @keyframes happyArmWaveLeftJsx {
          0%, 100% { transform: rotate(10deg); }
          45% { transform: rotate(-35deg); }
          85% { transform: rotate(20deg); }
        }

        @keyframes happyArmWaveRightJsx {
          0%, 100% { transform: rotate(-10deg); }
          45% { transform: rotate(35deg); }
          85% { transform: rotate(-20deg); }
        }

        @keyframes roofShadowPulseJsx {
          0%, 94%, 100% {
            transform: scale(1.18, 1);
            opacity: 0.35;
          }
          45%, 50% {
            transform: scale(0.48, 0.4);
            opacity: 0.1;
          }
        }

        @keyframes awningJostleJsx {
          0%, 100% { transform: translateY(0px); }
          93% { transform: translateY(2px); }
          96% { transform: translateY(-1px); }
        }

        @keyframes sparkleFloat1Jsx {
          0% { opacity: 0; transform: translate(0, 0) scale(0.3); }
          30% { opacity: 1; }
          100% { opacity: 0; transform: translate(-22px, -45px) scale(1.2) rotate(35deg); }
        }

        @keyframes sparkleFloat2Jsx {
          0% { opacity: 0; transform: translate(0, 0) scale(0.3); }
          30% { opacity: 1; }
          100% { opacity: 0; transform: translate(25px, -50px) scale(1.3) rotate(-35deg); }
        }

        .anim-shroom-jumper {
          transform-origin: 140px 108px;
          animation: happyJumpPhysicsJsx 1.35s cubic-bezier(0.3, 0.1, 0.3, 1) infinite;
        }

        .anim-shroom-arm-l {
          transform-origin: 124px 88px;
          animation: happyArmWaveLeftJsx 1.35s ease-in-out infinite;
        }

        .anim-shroom-arm-r {
          transform-origin: 156px 88px;
          animation: happyArmWaveRightJsx 1.35s ease-in-out infinite;
        }

        .anim-roof-shadow {
          transform-origin: 140px 108px;
          animation: roofShadowPulseJsx 1.35s cubic-bezier(0.3, 0.1, 0.3, 1) infinite;
        }

        .anim-awning-bounce {
          transform-origin: 140px 148px;
          animation: awningJostleJsx 1.35s ease-in-out infinite;
        }

        .anim-spark-1 {
          animation: sparkleFloat1Jsx 1.35s ease-out infinite;
          animation-delay: 0.15s;
        }

        .anim-spark-2 {
          animation: sparkleFloat2Jsx 1.35s ease-out infinite;
          animation-delay: 0.25s;
        }
      `}</style>

      {/* Shop Base Mound */}
      <ellipse cx="140" cy="275" rx="100" ry="14" fill="#365314" opacity="0.3" />
      <path d="M48,272 C70,266 210,266 232,272 C238,276 230,284 216,286 C170,288 110,288 64,286 C50,284 42,276 48,272 Z" fill="#4d7c0f" />
      <ellipse cx="118" cy="278" rx="8" ry="4" fill="#78716c" opacity="0.8" />
      <ellipse cx="138" cy="281" rx="10" ry="4.5" fill="#a8a29e" opacity="0.9" />
      <ellipse cx="160" cy="278" rx="8" ry="4" fill="#78716c" opacity="0.8" />

      {/* Shop Walls */}
      <rect x="65" y="160" width="150" height="110" rx="10" fill="url(#shopWoodJsx)" stroke="#451a03" strokeWidth="2.5" />
      <line x1="65" y1="190" x2="215" y2="190" stroke="#451a03" strokeWidth="1.2" opacity="0.4" />
      <line x1="65" y1="220" x2="215" y2="220" stroke="#451a03" strokeWidth="1.2" opacity="0.4" />
      <line x1="65" y1="248" x2="215" y2="248" stroke="#451a03" strokeWidth="1.2" opacity="0.4" />

      {/* Arched Doorway */}
      <path d="M120,270 L120,212 C120,200 160,200 160,212 L160,270 Z" fill="#451a03" />
      <path d="M123,268 L123,214 C123,205 157,205 157,214 L157,268 Z" fill="url(#shopWindowGlowJsx)" stroke="#78350f" strokeWidth="2" />
      <circle cx="152" cy="242" r="2.2" fill="#fef08a" stroke="#78350f" strokeWidth="0.8" />
      <path d="M128,218 C134,212 146,212 152,218 L152,230 L128,230 Z" fill="#ffffff" opacity="0.4" />

      {/* Windows */}
      <rect x="76" y="202" width="34" height="42" rx="6" fill="url(#shopWindowGlowJsx)" stroke="#451a03" strokeWidth="2" />
      <line x1="93" y1="202" x2="93" y2="244" stroke="#78350f" strokeWidth="1.5" />
      <line x1="76" y1="223" x2="110" y2="223" stroke="#78350f" strokeWidth="1.5" />

      <rect x="170" y="202" width="34" height="42" rx="6" fill="url(#shopWindowGlowJsx)" stroke="#451a03" strokeWidth="2" />
      <line x1="187" y1="202" x2="187" y2="244" stroke="#78350f" strokeWidth="1.5" />
      <line x1="170" y1="223" x2="204" y2="223" stroke="#78350f" strokeWidth="1.5" />

      {/* Shop Sign Plaque */}
      <g>
        <rect x="100" y="105" width="5" height="15" fill="#451a03" />
        <rect x="175" y="105" width="5" height="15" fill="#451a03" />
        <rect x="90" y="102" width="100" height="24" rx="6" fill="#78350f" stroke="#451a03" strokeWidth="2" />
        <text x="140" y="118" fill="#fef08a" fontSize="11" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle" letterSpacing="2">🍄 SPORE</text>
      </g>

      {/* Striped Awning */}
      <g className="anim-awning-bounce">
        <path d="M52,156 L65,130 L215,130 L228,156 Z" fill="#166534" stroke="#0e4422" strokeWidth="2" />
        <path d="M52,156 L65,130 L87,130 L78,156 Z" fill="url(#awningCreamJsx)" />
        <path d="M78,156 L87,130 L109,130 L104,156 Z" fill="url(#awningGreenJsx)" />
        <path d="M104,156 L109,130 L131,130 L130,156 Z" fill="url(#awningCreamJsx)" />
        <path d="M130,156 L131,130 L153,130 L156,156 Z" fill="url(#awningGreenJsx)" />
        <path d="M156,156 L153,130 L175,130 L182,156 Z" fill="url(#awningCreamJsx)" />
        <path d="M182,156 L175,130 L197,130 L208,156 Z" fill="url(#awningGreenJsx)" />
        <path d="M208,156 L197,130 L215,130 L228,156 Z" fill="url(#awningCreamJsx)" />
        <path
          d="M52,156 Q65,166 78,156 Q91,166 104,156 Q117,166 130,156 Q143,166 156,156 Q169,166 182,156 Q195,166 208,156 Q218,166 228,156"
          stroke="#451a03"
          strokeWidth="2"
          fill="none"
        />
      </g>

      {/* Roof Landing Shadow */}
      <ellipse className="anim-roof-shadow" cx="140" cy="108" rx="26" ry="6" fill="#09271c" />

      {/* Sparkles */}
      <g filter="url(#jumpSparkleGlowJsx)">
        <text className="anim-spark-1" x="110" y="55" fill="#fbbf24" fontSize="16" fontFamily="sans-serif">✦</text>
        <text className="anim-spark-2" x="160" y="50" fill="#f59e0b" fontSize="18" fontFamily="sans-serif">✨</text>
        <circle className="anim-spark-1" cx="158" cy="70" r="3" fill="#4ade80" />
        <circle className="anim-spark-2" cx="118" cy="76" r="2.5" fill="#fde047" />
      </g>

      {/* Tiny Realistic Jumping Mushroom Character */}
      <g className="anim-shroom-jumper">
        {/* Feet */}
        <ellipse cx="132" cy="104" rx="5.5" ry="4" fill="#78350f" stroke="#451a03" strokeWidth="1" />
        <ellipse cx="148" cy="104" rx="5.5" ry="4" fill="#78350f" stroke="#451a03" strokeWidth="1" />

        {/* Arms */}
        <g className="anim-shroom-arm-l">
          <path d="M124,84 C112,80 106,66 112,62" stroke="#fdf8ed" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <circle cx="112" cy="62" r="3.2" fill="#ffffff" />
        </g>
        <g className="anim-shroom-arm-r">
          <path d="M156,84 C168,80 174,66 168,62" stroke="#fdf8ed" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <circle cx="168" cy="62" r="3.2" fill="#ffffff" />
        </g>

        {/* Stem */}
        <path
          d="M128,68 C126,80 123,98 126,102 C128,105 134,106 140,106 C146,106 152,105 154,102 C157,98 154,80 152,68 Z"
          fill="url(#jumpStemGradJsx)"
          stroke="#cbbba3"
          strokeWidth="1.2"
        />
        <path d="M132,74 C130,84 128,95 130,100" stroke="#d5c8b2" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M148,74 C150,84 152,95 150,100" stroke="#c2b49e" strokeWidth="1.5" strokeLinecap="round" fill="none" />

        {/* Gills */}
        <ellipse cx="140" cy="68" rx="38" ry="9" fill="#fef08a" opacity="0.9" stroke="#d4c39e" strokeWidth="1" />
        <path d="M140,68 L140,76 M128,68 L130,75 M152,68 L150,75 M116,66 L122,72 M164,66 L158,72 M108,65 L114,69 M172,65 L166,69" stroke="#c0af88" strokeWidth="1.1" strokeLinecap="round" />

        {/* Cap with Spherical 3D Light */}
        <path
          d="M96,66 C92,42 112,14 140,14 C168,14 188,42 184,66 C180,72 168,74 140,74 C112,74 100,72 96,66 Z"
          fill="url(#jumpCapGradJsx)"
          stroke="#50040a"
          strokeWidth="1.8"
        />
        <path
          d="M110,44 C115,28 126,20 140,20 C146,20 152,22 156,26 C148,23 142,22 136,23 C124,25 114,34 110,44 Z"
          fill="#ffffff"
          opacity="0.45"
        />

        {/* Polka Dots */}
        <ellipse cx="122" cy="40" rx="6.5" ry="5.5" fill="#ffffff" opacity="0.95" />
        <ellipse cx="154" cy="38" rx="7" ry="6" fill="#ffffff" opacity="0.95" />
        <ellipse cx="138" cy="28" rx="5.5" ry="4.8" fill="#ffffff" opacity="0.95" />
        <ellipse cx="107" cy="56" rx="4" ry="3.2" fill="#ffffff" opacity="0.88" />
        <ellipse cx="171" cy="55" rx="4.5" ry="3.5" fill="#ffffff" opacity="0.88" />
        <ellipse cx="139" cy="53" rx="5" ry="4" fill="#ffffff" opacity="0.92" />

        {/* Happy Face */}
        <path d="M133,85 Q136,81 139,85" stroke="#27272a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d="M145,85 Q148,81 151,85" stroke="#27272a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <ellipse cx="130" cy="88" rx="3.5" ry="2" fill="#f43f5e" opacity="0.55" />
        <ellipse cx="154" cy="88" rx="3.5" ry="2" fill="#f43f5e" opacity="0.55" />
        <path d="M138,89 Q142,95 146,89 Z" fill="#991b1b" stroke="#450a0a" strokeWidth="1.2" />
        <path d="M140,92 Q142,94 144,92" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

/**
 * Stylish Dance-Walk Mushroom (Left-to-Right Stroll, Swinging Boots, Musical Notes)
 */
function DanceWalkMushroomSvg({ width, height }: { width: number; height: number }) {
  return (
    <svg
      viewBox="0 0 320 220"
      width={width}
      height={height}
      className="relative z-10 drop-shadow-[0_10px_24px_rgba(15,58,47,0.22)] dark:drop-shadow-[0_10px_28px_rgba(34,197,94,0.32)] select-none pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="danceCapGradJsx" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2ed573" />
          <stop offset="45%" stopColor="#107c41" />
          <stop offset="100%" stopColor="#093824" />
        </linearGradient>

        <linearGradient id="danceStemGradJsx" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="65%" stopColor="#f4efe4" />
          <stop offset="100%" stopColor="#ddd2be" />
        </linearGradient>

        <linearGradient id="danceBootGradJsx" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c28b53" />
          <stop offset="100%" stopColor="#8c5825" />
        </linearGradient>

        <filter id="danceNoteGlowJsx" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <style>{`
        @keyframes danceWalkTrackJsx {
          0% {
            transform: translateX(-55px) scaleX(1);
          }
          44% {
            transform: translateX(55px) scaleX(1);
          }
          48% {
            transform: translateX(55px) scaleX(-1);
          }
          94% {
            transform: translateX(-55px) scaleX(-1);
          }
          98%, 100% {
            transform: translateX(-55px) scaleX(1);
          }
        }

        @keyframes danceBodyGrooveJsx {
          0%, 100% {
            transform: translateY(0px) rotate(-6deg);
          }
          25% {
            transform: translateY(-11px) rotate(0deg);
          }
          50% {
            transform: translateY(0px) rotate(6deg);
          }
          75% {
            transform: translateY(-11px) rotate(0deg);
          }
        }

        @keyframes stepLeftLegJsx {
          0%, 100% {
            transform: rotate(-18deg) translateY(0px);
          }
          25% {
            transform: rotate(4deg) translateY(-10px);
          }
          50% {
            transform: rotate(18deg) translateY(0px);
          }
          75% {
            transform: rotate(0deg) translateY(-3px);
          }
        }

        @keyframes stepRightLegJsx {
          0%, 100% {
            transform: rotate(18deg) translateY(0px);
          }
          25% {
            transform: rotate(0deg) translateY(-3px);
          }
          50% {
            transform: rotate(-18deg) translateY(0px);
          }
          75% {
            transform: rotate(4deg) translateY(-10px);
          }
        }

        @keyframes swingLeftArmJsx {
          0%, 100% {
            transform: rotate(26deg);
          }
          50% {
            transform: rotate(-26deg);
          }
        }

        @keyframes swingRightArmJsx {
          0%, 100% {
            transform: rotate(-26deg);
          }
          50% {
            transform: rotate(26deg);
          }
        }

        @keyframes shadowWalkPulseJsx {
          0%, 50%, 100% {
            transform: scale(1, 1);
            opacity: 0.28;
          }
          25%, 75% {
            transform: scale(0.82, 0.7);
            opacity: 0.16;
          }
        }

        @keyframes floatMusicNote1Jsx {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(0.4);
          }
          30% {
            opacity: 0.95;
          }
          100% {
            opacity: 0;
            transform: translate(-24px, -50px) scale(1.15) rotate(-18deg);
          }
        }

        @keyframes floatMusicNote2Jsx {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(0.4);
          }
          30% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(26px, -55px) scale(1.2) rotate(20deg);
          }
        }

        .anim-track-stroll {
          transform-origin: 160px 186px;
          animation: danceWalkTrackJsx 3.6s ease-in-out infinite;
        }

        .anim-body-groove {
          transform-origin: 160px 150px;
          animation: danceBodyGrooveJsx 0.9s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }

        .anim-leg-left {
          transform-origin: 148px 148px;
          animation: stepLeftLegJsx 0.9s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }

        .anim-leg-right {
          transform-origin: 172px 148px;
          animation: stepRightLegJsx 0.9s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }

        .anim-arm-left {
          transform-origin: 136px 125px;
          animation: swingLeftArmJsx 0.9s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }

        .anim-arm-right {
          transform-origin: 184px 125px;
          animation: swingRightArmJsx 0.9s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }

        .anim-walk-shadow {
          transform-origin: 160px 188px;
          animation: shadowWalkPulseJsx 0.9s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }

        .anim-note-1 {
          animation: floatMusicNote1Jsx 2.2s ease-out infinite;
          animation-delay: 0.1s;
        }

        .anim-note-2 {
          animation: floatMusicNote2Jsx 2.2s ease-out infinite;
          animation-delay: 1.1s;
        }
      `}</style>

      {/* Runway track moving left to right */}
      <g className="anim-track-stroll">
        <ellipse className="anim-walk-shadow" cx="160" cy="188" rx="38" ry="9" fill="#09271c" />

        <g filter="url(#danceNoteGlowJsx)">
          <text className="anim-note-1" x="122" y="90" fill="#22c55e" fontSize="20" fontFamily="sans-serif" fontWeight="bold">♪</text>
          <text className="anim-note-2" x="185" y="82" fill="#f59e0b" fontSize="22" fontFamily="sans-serif" fontWeight="bold">♫</text>
          <circle className="anim-note-1" cx="195" cy="105" r="3" fill="#fbbf24" />
          <circle className="anim-note-2" cx="120" cy="120" r="2.5" fill="#4ade80" />
        </g>

        <g className="anim-leg-left">
          <path d="M148,145 C146,155 142,168 141,176" stroke="#d5c8b2" strokeWidth="7" strokeLinecap="round" fill="none" />
          <path
            d="M130,174 C130,170 144,169 148,172 C152,176 150,186 142,186 C134,186 130,181 130,174 Z"
            fill="url(#danceBootGradJsx)"
            stroke="#5a3411"
            strokeWidth="1.2"
          />
          <path d="M130,183 L144,183" stroke="#3d2208" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        <g className="anim-leg-right">
          <path d="M172,145 C174,155 178,168 179,176" stroke="#d5c8b2" strokeWidth="7" strokeLinecap="round" fill="none" />
          <path
            d="M170,174 C170,170 184,169 188,172 C192,176 190,186 182,186 C174,186 170,181 170,174 Z"
            fill="url(#danceBootGradJsx)"
            stroke="#5a3411"
            strokeWidth="1.2"
          />
          <path d="M170,183 L184,183" stroke="#3d2208" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        <g className="anim-body-groove">
          <g className="anim-arm-left">
            <path d="M136,124 C124,120 114,132 118,140" stroke="#f4efe4" strokeWidth="6.5" strokeLinecap="round" fill="none" />
            <circle cx="118" cy="140" r="5" fill="#fdfcf9" stroke="#d9cfbe" strokeWidth="1" />
          </g>

          <g className="anim-arm-right">
            <path d="M184,124 C196,120 206,132 202,140" stroke="#f4efe4" strokeWidth="6.5" strokeLinecap="round" fill="none" />
            <circle cx="202" cy="140" r="5" fill="#fdfcf9" stroke="#d9cfbe" strokeWidth="1" />
          </g>

          <path
            d="M142,108 C140,128 135,148 138,154 C140,158 150,160 160,160 C170,160 180,158 182,154 C185,148 180,128 178,108 Z"
            fill="url(#danceStemGradJsx)"
            stroke="#b5a995"
            strokeWidth="1.5"
          />

          <path d="M148,118 C146,132 143,145 145,152" stroke="#d0c4b2" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M172,118 C174,132 177,145 175,152" stroke="#c2b49e" strokeWidth="1.8" strokeLinecap="round" fill="none" />

          <ellipse cx="160" cy="108" rx="52" ry="13" fill="#f4ebd9" stroke="#cfc0a5" strokeWidth="1.2" />
          <path d="M160,108 L160,119 M142,108 L146,118 M178,108 L174,118 M126,106 L133,114 M194,106 L187,114 M116,104 L123,110 M204,104 L197,110" stroke="#d5c8b2" strokeWidth="1.2" strokeLinecap="round" />

          <path
            d="M102,106 C98,78 122,44 160,44 C198,44 222,78 218,106 C213,113 198,116 160,116 C122,116 107,113 102,106 Z"
            fill="url(#danceCapGradJsx)"
            stroke="#062618"
            strokeWidth="2"
          />

          <path
            d="M120,78 C126,62 140,52 160,52 C168,52 175,55 180,59 C171,56 162,55 154,56 C136,58 124,68 120,78 Z"
            fill="#ffffff"
            opacity="0.34"
          />

          <ellipse cx="134" cy="76" rx="8" ry="7" fill="#fbf9f5" opacity="0.92" />
          <ellipse cx="178" cy="74" rx="8.5" ry="7.5" fill="#fbf9f5" opacity="0.92" />
          <ellipse cx="158" cy="64" rx="7" ry="6" fill="#fbf9f5" opacity="0.95" />
          <ellipse cx="118" cy="94" rx="5" ry="4" fill="#fbf9f5" opacity="0.85" />
          <ellipse cx="200" cy="92" rx="5.5" ry="4.5" fill="#fbf9f5" opacity="0.85" />
          <ellipse cx="160" cy="90" rx="5.5" ry="4.5" fill="#fbf9f5" opacity="0.9" />

          <path d="M150,132 Q154,128 157,132" stroke="#2d3748" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <circle cx="169" cy="131" r="2.5" fill="#2d3748" />
          <circle cx="170" cy="130" r="0.9" fill="#ffffff" />
          <ellipse cx="145" cy="136" rx="3.5" ry="2" fill="#f43f5e" opacity="0.45" />
          <ellipse cx="175" cy="136" rx="3.5" ry="2" fill="#f43f5e" opacity="0.45" />
          <path d="M157,137 Q161,142 166,138" stroke="#4a5568" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </g>
      </g>
    </svg>
  );
}

/**
 * Classic Bounce & Spore Dispersal Animated Mushroom
 */
function BounceMushroomSvg({ sizePx }: { sizePx: number }) {
  return (
    <svg
      viewBox="0 0 240 240"
      width={sizePx}
      height={sizePx}
      className="relative z-10 drop-shadow-[0_8px_20px_rgba(15,58,47,0.18)] dark:drop-shadow-[0_8px_24px_rgba(34,197,94,0.3)] select-none pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="shroomCapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2ed573" />
          <stop offset="45%" stopColor="#107c41" />
          <stop offset="100%" stopColor="#093824" />
        </linearGradient>

        <linearGradient id="shroomStemGrad" x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#f1ede2" />
          <stop offset="100%" stopColor="#d9cfbe" />
        </linearGradient>

        <filter id="shroomSporeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <style>{`
        @keyframes shroomGroundPulse {
          0%, 100% { transform: scale(1); opacity: 0.25; }
          50% { transform: scale(0.75); opacity: 0.12; }
        }
        @keyframes shroomBounceKeyframe {
          0%, 100% { transform: translateY(0px) scale(1, 1); }
          35% { transform: translateY(-14px) scale(0.96, 1.05); }
          50% { transform: translateY(-16px) scale(1.02, 0.98); }
          75% { transform: translateY(2px) scale(1.06, 0.93); }
        }
        @keyframes shroomSporeAnim1 {
          0% { transform: translate(0, 0) scale(0.4); opacity: 0; }
          25% { opacity: 0.95; }
          80% { opacity: 0.8; }
          100% { transform: translate(-18px, -65px) scale(1.2); opacity: 0; }
        }
        @keyframes shroomSporeAnim2 {
          0% { transform: translate(0, 0) scale(0.4); opacity: 0; }
          30% { opacity: 1; }
          80% { opacity: 0.7; }
          100% { transform: translate(16px, -75px) scale(1.1); opacity: 0; }
        }
        @keyframes shroomSporeAnim3 {
          0% { transform: translate(0, 0) scale(0.3); opacity: 0; }
          35% { opacity: 0.85; }
          100% { transform: translate(-4px, -85px) scale(1.3); opacity: 0; }
        }
        @keyframes shroomSporeAnim4 {
          0% { transform: translate(0, 0) scale(0.4); opacity: 0; }
          20% { opacity: 0.95; }
          100% { transform: translate(24px, -60px) scale(0.9); opacity: 0; }
        }
        .anim-shroom-shadow {
          transform-origin: 120px 198px;
          animation: shroomGroundPulse 2.2s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }
        .anim-shroom-body {
          transform-origin: 120px 195px;
          animation: shroomBounceKeyframe 2.2s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }
        .anim-spore-1 {
          animation: shroomSporeAnim1 2.2s ease-out infinite;
          animation-delay: 0.1s;
        }
        .anim-spore-2 {
          animation: shroomSporeAnim2 2.2s ease-out infinite;
          animation-delay: 0.6s;
        }
        .anim-spore-3 {
          animation: shroomSporeAnim3 2.2s ease-out infinite;
          animation-delay: 1.1s;
        }
        .anim-spore-4 {
          animation: shroomSporeAnim4 2.2s ease-out infinite;
          animation-delay: 1.6s;
        }
      `}</style>

      <ellipse className="anim-shroom-shadow" cx="120" cy="198" rx="46" ry="12" fill="#09271c" />

      <g filter="url(#shroomSporeGlow)">
        <circle className="anim-spore-1" cx="95" cy="110" r="3.5" fill="#4ade80" />
        <circle className="anim-spore-2" cx="145" cy="112" r="3" fill="#86efac" />
        <circle className="anim-spore-3" cx="120" cy="98" r="4" fill="#fbbf24" />
        <circle className="anim-spore-4" cx="152" cy="125" r="2.5" fill="#a7f3d0" />
      </g>

      <g className="anim-shroom-body">
        <path
          d="M102,142 C100,165 92,185 94,194 C96,198 108,200 120,200 C132,200 144,198 146,194 C148,185 140,165 138,142 Z"
          fill="url(#shroomStemGrad)"
          stroke="#b5a995"
          strokeWidth="1.5"
        />

        <path d="M107,155 C106,170 102,185 104,192" stroke="#d0c4b2" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M133,155 C134,170 138,185 136,192" stroke="#c2b49e" strokeWidth="2" strokeLinecap="round" fill="none" />

        <ellipse cx="120" cy="142" rx="55" ry="14" fill="#f4ebd9" stroke="#cfc0a5" strokeWidth="1.2" />
        <path
          d="M120,142 L120,154 M100,142 L105,153 M140,142 L135,153 M85,140 L93,149 M155,140 L147,149 M75,138 L83,144 M165,138 L157,144"
          stroke="#d5c8b2"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        <path
          d="M60,140 C56,110 82,72 120,72 C158,72 184,110 180,140 C175,147 160,150 120,150 C80,150 65,147 60,140 Z"
          fill="url(#shroomCapGrad)"
          stroke="#062618"
          strokeWidth="2"
        />

        <path
          d="M78,110 C85,92 100,80 120,80 C128,80 136,83 142,88 C132,84 122,83 114,84 C95,86 82,97 78,110 Z"
          fill="#ffffff"
          opacity="0.32"
        />

        <ellipse cx="92" cy="108" rx="8" ry="7" fill="#fbf9f5" opacity="0.92" />
        <ellipse cx="140" cy="106" rx="9" ry="8" fill="#fbf9f5" opacity="0.92" />
        <ellipse cx="118" cy="94" rx="7.5" ry="6.5" fill="#fbf9f5" opacity="0.95" />
        <ellipse cx="74" cy="126" rx="5" ry="4" fill="#fbf9f5" opacity="0.85" />
        <ellipse cx="164" cy="124" rx="5.5" ry="4.5" fill="#fbf9f5" opacity="0.85" />
        <ellipse cx="119" cy="122" rx="6" ry="5" fill="#fbf9f5" opacity="0.9" />

        <circle cx="112" cy="166" r="2.2" fill="#2d3748" />
        <circle cx="128" cy="166" r="2.2" fill="#2d3748" />
        <ellipse cx="106" cy="170" rx="3" ry="1.8" fill="#f43f5e" opacity="0.4" />
        <ellipse cx="134" cy="170" rx="3" ry="1.8" fill="#f43f5e" opacity="0.4" />
        <path d="M117,171 Q120,174 123,171" stroke="#4a5568" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

export function MushroomLoader({
  variant = "shop-jump",
  message,
  subMessage,
  size = "xl",
  fullScreen = false,
  className = "",
}: MushroomLoaderProps) {
  const cfg = sizeConfig[size];

  const content = (
    <div
      className={`flex flex-col items-center justify-center text-center p-4 transition-all duration-300 animate-in fade-in zoom-in-95 duration-200 ${className}`}
      role="status"
      aria-live="polite"
    >
      {/* Mushroom Animated Container with soft glow */}
      <div className="relative flex items-center justify-center">
        {/* Ambient background glow ring */}
        <div
          className="absolute rounded-full bg-emerald-500/20 dark:bg-emerald-400/20 blur-2xl pointer-events-none animate-pulse"
          style={{
            width: variant === "shop-jump" ? cfg.shopWidth * 0.95 : variant === "dance-walk" ? cfg.danceWidth * 0.9 : cfg.bounceSize * 1.3,
            height: variant === "shop-jump" ? cfg.shopHeight * 0.8 : variant === "dance-walk" ? cfg.danceHeight * 0.9 : cfg.bounceSize * 1.3,
          }}
        />

        {/* Selected Vector Animation */}
        {variant === "shop-jump" ? (
          <ShopJumpMushroomSvg width={cfg.shopWidth} height={cfg.shopHeight} />
        ) : variant === "dance-walk" ? (
          <DanceWalkMushroomSvg width={cfg.danceWidth} height={cfg.danceHeight} />
        ) : (
          <BounceMushroomSvg sizePx={cfg.bounceSize} />
        )}
      </div>

      {/* Primary Message with bouncing dots (optional) */}
      {message && (
        <div className="mt-4 flex items-center gap-1.5 font-display font-semibold text-forest-primary dark:text-spore-ivory">
          <span className={cfg.textSize}>{message}</span>
          <span className="flex gap-0.5">
            <span className="inline-block size-1 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
            <span className="inline-block size-1 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
            <span className="inline-block size-1 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-bounce" />
          </span>
        </div>
      )}

      {/* Optional Subtitle */}
      {subMessage && (
        <p className={`mt-1 font-body text-stone-500 dark:text-spore-ivory/60 ${cfg.subSize}`}>
          {subMessage}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-50/70 dark:bg-[#0b120f]/75 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return content;
}

export default MushroomLoader;
