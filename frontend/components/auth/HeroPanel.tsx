import Image from "next/image";
import { Activity, BrainCircuit, ScanLine, Waypoints } from "lucide-react";
import { FeatureCard } from "./FeatureCard";
import { Logo } from "@/components/ui/Logo";

const features = [
  { icon: ScanLine, title: "X-ray Analysis", description: "AI-assisted fracture recognition research" },
  { icon: Waypoints, title: "Specialized Modules", description: "Hand and leg analysis workflows" },
  { icon: Activity, title: "Advanced Segmentation", description: "Bone and fracture segmentation tools" },
  { icon: BrainCircuit, title: "Research Insights", description: "Case history and validation tools" },
];

export function HeroPanel() {
  return (
    <section className="hero-panel relative flex min-h-[300px] flex-col overflow-hidden bg-gradient-to-br from-navy-900 to-navy-800 px-6 py-6 text-white sm:px-10 sm:py-8 lg:min-h-screen lg:px-[clamp(40px,5.2vw,84px)] lg:py-10">
      <Image src="/knee-xray.svg" alt="" fill priority unoptimized className="hero-art object-cover object-center" />
      <div className="hero-shade absolute inset-0" />
      <div className="relative z-10 flex min-h-full flex-1 flex-col">
        <div className="flex items-center justify-between">
          <Logo light />
          <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[9px] font-medium tracking-[0.14em] text-[#B5C9DB] sm:hidden">RESEARCH PLATFORM</span>
        </div>
        <div className="hero-copy mt-5 max-w-[550px] lg:mt-[clamp(44px,7vh,82px)]">
          <p className="mb-3 text-[10px] font-semibold tracking-[0.2em] text-[#57D0CF]">RESEARCH PROJECT</p>
          <h1 className="max-w-[525px] text-[clamp(30px,3vw,43px)] font-semibold leading-[1.16] tracking-[-0.035em]">
            AI–Driven Solution for Musculoskeletal Fracture Recognition
          </h1>
          <p className="mt-4 max-w-[470px] text-[14px] leading-6 text-[#B1C2D4]">
            Advancing musculoskeletal imaging research through artificial intelligence.
          </p>
        </div>
        <div className="hero-features mt-8 grid max-w-[510px] grid-cols-2 gap-3 lg:mt-9">
          {features.map((feature) => <FeatureCard key={feature.title} {...feature} />)}
        </div>
        <div className="hero-footer mt-auto hidden pt-8 lg:block">
          <div className="mb-4 h-px max-w-[510px] bg-white/15" />
          <p className="text-[9px] font-medium tracking-[0.19em] text-[#91A9BF]">RESEARCH <span className="px-1 text-[#4ABFC1]">|</span> INNOVATION <span className="px-1 text-[#4ABFC1]">|</span> BETTER MUSCULOSKELETAL CARE</p>
        </div>
      </div>
    </section>
  );
}
