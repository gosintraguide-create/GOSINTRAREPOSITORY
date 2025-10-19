interface FlagIconProps {
  className?: string;
}

export function FlagGB({ className = "w-6 h-4" }: FlagIconProps) {
  // Using a random suffix to avoid ID collisions
  const id = Math.random().toString(36).substring(7);
  return (
    <svg viewBox="0 0 60 30" className={className}>
      <defs>
        <clipPath id={`gb-s-${id}`}>
          <path d="M0,0 v30 h60 v-30 z"/>
        </clipPath>
        <clipPath id={`gb-t-${id}`}>
          <path d="M30,15 h30 v15 z v-15 h-30 z h-30 v15 z v-15 h30 z"/>
        </clipPath>
      </defs>
      <g clipPath={`url(#gb-s-${id})`}>
        <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#gb-t-${id})`} stroke="#C8102E" strokeWidth="4"/>
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
      </g>
    </svg>
  );
}

export function FlagPT({ className = "w-6 h-4" }: FlagIconProps) {
  return (
    <svg viewBox="0 0 600 400" className={className}>
      <rect width="600" height="400" fill="#FF0000"/>
      <rect width="240" height="400" fill="#006600"/>
      <circle cx="240" cy="200" r="80" fill="#FFFF00" stroke="#000" strokeWidth="3"/>
      <path d="M240,200 m-60,0 a60,60 0 1,0 120,0 a60,60 0 1,0 -120,0" fill="#0000FF"/>
      <path d="M240,200 m-40,0 a40,40 0 1,0 80,0 a40,40 0 1,0 -80,0" fill="#FFF"/>
      <circle cx="210" cy="185" r="8" fill="#FFFF00"/>
      <circle cx="240" cy="175" r="8" fill="#FFFF00"/>
      <circle cx="270" cy="185" r="8" fill="#FFFF00"/>
      <circle cx="225" cy="205" r="8" fill="#FFFF00"/>
      <circle cx="255" cy="205" r="8" fill="#FFFF00"/>
      <circle cx="240" cy="220" r="8" fill="#FFFF00"/>
    </svg>
  );
}

export function FlagES({ className = "w-6 h-4" }: FlagIconProps) {
  return (
    <svg viewBox="0 0 750 500" className={className}>
      <rect width="750" height="500" fill="#AA151B"/>
      <rect width="750" height="250" y="125" fill="#F1BF00"/>
    </svg>
  );
}

export function FlagFR({ className = "w-6 h-4" }: FlagIconProps) {
  return (
    <svg viewBox="0 0 900 600" className={className}>
      <rect width="900" height="600" fill="#ED2939"/>
      <rect width="600" height="600" fill="#FFF"/>
      <rect width="300" height="600" fill="#002395"/>
    </svg>
  );
}

export function FlagDE({ className = "w-6 h-4" }: FlagIconProps) {
  return (
    <svg viewBox="0 0 5 3" className={className}>
      <rect width="5" height="3" fill="#000"/>
      <rect width="5" height="2" y="1" fill="#D00"/>
      <rect width="5" height="1" y="2" fill="#FFCE00"/>
    </svg>
  );
}

export function FlagNL({ className = "w-6 h-4" }: FlagIconProps) {
  return (
    <svg viewBox="0 0 900 600" className={className}>
      <rect width="900" height="600" fill="#FFF"/>
      <rect width="900" height="200" fill="#AE1C28"/>
      <rect width="900" height="200" y="400" fill="#21468B"/>
    </svg>
  );
}

export function FlagIT({ className = "w-6 h-4" }: FlagIconProps) {
  return (
    <svg viewBox="0 0 3 2" className={className}>
      <rect width="3" height="2" fill="#FFF"/>
      <rect width="1" height="2" fill="#009246"/>
      <rect width="1" height="2" x="2" fill="#CE2B37"/>
    </svg>
  );
}
