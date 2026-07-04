
export const Logo = ({ className = "h-9 w-9" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 36 36" 
      fill="none"
      className={className}
    >
      <rect width="36" height="36" fill="#000000" rx="8" />
      <rect x="2" y="8" width="26" height="26" rx="5.5" fill="#000000ff" />
      <rect x="3.25" y="6.75" width="26" height="26" rx="5.5" fill="#668f00" />
      <rect x="4.5" y="5.5" width="26" height="26" rx="5.5" fill="#80b300" />
      <rect x="5.75" y="4.25" width="26" height="26" rx="5.5" fill="#99cc00" />
      <rect x="7" y="3" width="26" height="26" rx="5.5" fill="#c8ff00" />
      <text 
        x="20" 
        y="20" 
        textAnchor="middle" 
        fontFamily="'League Spartan', 'Montserrat', 'Arial Black', sans-serif" 
        fontSize="13" 
        fontWeight="900" 
        fill="#000000" 
        letterSpacing="-0.03em"
      >
        MV
      </text>
    </svg>
  );
};
  