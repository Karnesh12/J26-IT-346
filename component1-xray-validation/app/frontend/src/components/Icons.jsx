// Small inline SVG icons (no icon library needed, works offline).
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
               strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

export const Logo = (p) => (
  <svg width="30" height="30" viewBox="0 0 32 32" {...p}>
    {/* bone: straight shaft with two rounded knobs at each end, tilted like the team logo */}
    <g transform="rotate(-25 16 16)" fill="currentColor">
      <rect x="13" y="7" width="6" height="18" rx="2" />
      <circle cx="12.2" cy="6.6" r="3.6" /><circle cx="19.8" cy="6.6" r="3.6" />
      <circle cx="12.2" cy="25.4" r="3.6" /><circle cx="19.8" cy="25.4" r="3.6" />
    </g>
  </svg>
);
export const Upload = (p) => (<svg {...base} width="34" height="34" {...p}><path d="M16 16l-4-4-4 4" /><path d="M12 12v9" /><path d="M20.4 18.4A5 5 0 0 0 18 9h-1.3A8 8 0 1 0 3 16.3" /></svg>);
export const Play = (p) => (<svg {...base} width="16" height="16" {...p}><polygon points="6 4 20 12 6 20 6 4" fill="currentColor" /></svg>);
export const Check = (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>);
export const Cross = (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>);
export const Alert = (p) => (<svg {...base} {...p}><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>);
export const Info = (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>);
export const Bone = (p) => (
  <svg width="24" height="24" viewBox="0 0 32 32" {...p}>
    <g transform="rotate(-25 16 16)" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
      <path d="M13 9.5 A3.6 3.6 0 1 1 16 4.4 A3.6 3.6 0 1 1 19 9.5 V22.5 A3.6 3.6 0 1 1 16 27.6 A3.6 3.6 0 1 1 13 22.5 Z" />
    </g>
  </svg>
);
export const Chevron = ({ open, ...p }) => (<svg {...base} width="16" height="16" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} {...p}><path d="M6 9l6 6 6-6" /></svg>);
export const Trash = (p) => (<svg {...base} width="16" height="16" {...p}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>);
