// Small inline SVG icons (no icon library needed, works offline).
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
               strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

export const Logo = (p) => (
  <svg width="30" height="30" viewBox="0 0 32 32" {...p}>
    <path d="M10 4a4 4 0 0 0-3.2 6.4L18.4 26.4A4 4 0 1 0 24.8 23 4 4 0 1 0 21.6 18.6L10 3.9Z"
          fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
    <circle cx="9" cy="7" r="3.2" fill="currentColor" opacity="0.9" />
    <circle cx="23" cy="25" r="3.2" fill="currentColor" opacity="0.9" />
  </svg>
);
export const Upload = (p) => (<svg {...base} width="34" height="34" {...p}><path d="M16 16l-4-4-4 4" /><path d="M12 12v9" /><path d="M20.4 18.4A5 5 0 0 0 18 9h-1.3A8 8 0 1 0 3 16.3" /></svg>);
export const Play = (p) => (<svg {...base} width="16" height="16" {...p}><polygon points="6 4 20 12 6 20 6 4" fill="currentColor" /></svg>);
export const Check = (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>);
export const Cross = (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>);
export const Alert = (p) => (<svg {...base} {...p}><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>);
export const Info = (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>);
export const Bone = (p) => (<svg {...base} width="26" height="26" {...p}><path d="M17 3a3 3 0 0 0-2.8 4L7 14.2A3 3 0 1 0 9.8 17 3 3 0 1 0 17 9.8L9.8 17" /><path d="M14.2 7A3 3 0 1 1 17 9.8" /></svg>);
export const Chevron = ({ open, ...p }) => (<svg {...base} width="16" height="16" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} {...p}><path d="M6 9l6 6 6-6" /></svg>);
export const Trash = (p) => (<svg {...base} width="16" height="16" {...p}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>);
