export default function WorkspaceContours({ className }) {
  return (
    <svg className={`workspace-contours ${className}`} viewBox="0 0 1200 800" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {Array.from({ length: 16 }, (_, i) => (
        <g key={i} fill="none" stroke="currentColor" strokeWidth="0.8">
          <path d={`M ${-190 + i * 16} 280 C ${160 + i * 8} 340, ${-150 + i * 14} 430, ${30 + i * 13} 520 S ${-90 + i * 17} 710, ${100 + i * 18} 840`} />
          <path d={`M ${1250 - i * 14} 300 C ${1040 - i * 6} 350, ${1270 - i * 15} 460, ${1130 - i * 13} 530 S ${1240 - i * 15} 700, ${940 - i * 16} 850`} />
          <path d={`M ${700 + i * 18} -40 C ${550 + i * 14} 100, ${1020 + i * 8} 20, ${950 + i * 13} 180 S ${1100 + i * 10} 240, 1270 ${320 + i * 13}`} />
        </g>
      ))}
    </svg>
  );
}
