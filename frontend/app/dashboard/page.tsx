import {
  ArrowRight,
  Bone,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Ellipsis,
  FileText,
  Home,
  ImageIcon,
  Layers3,
  LogOut,
  Plus,
  ScanSearch,
  Settings,
  Stethoscope,
  UserCircle2,
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Overview", active: true },
  { icon: ImageIcon, label: "X-ray Validation", active: false },
  { icon: Stethoscope, label: "Hand Analysis", active: false },
  { icon: ScanSearch, label: "Leg Analysis", active: false },
  { icon: Layers3, label: "Segmentation", active: false },
  { icon: FileText, label: "Case History", active: false },
  { icon: Settings, label: "Settings", active: false },
];

const summaryCards = [
  { value: "12", label: "cases", tone: "neutral" },
  { value: "4", label: "awaiting review", tone: "warning" },
  { value: "8", label: "reviewed", tone: "success" },
] as const;

const workflowSteps = [
  { id: 1, label: "Upload" },
  { id: 2, label: "Validate" },
  { id: 3, label: "Analyse" },
  { id: 4, label: "Segment" },
  { id: 5, label: "Review" },
] as const;

const modules = [
  {
    number: "01",
    title: "X-ray Validation",
    description: "Validate image and identify anatomical region.",
    button: "Open X-ray Validation",
    icon: "xray",
  },
  {
    number: "02",
    title: "Hand Analysis",
    description: "Detect and classify upper-limb fractures.",
    button: "Open Hand Analysis",
    icon: "hand",
  },
  {
    number: "03",
    title: "Leg Analysis",
    description: "Detect and classify lower-limb fractures.",
    button: "Open Leg Analysis",
    icon: "leg",
  },
  {
    number: "04",
    title: "Segmentation & Morphometry",
    description: "Inspect fracture masks and calibrated measurements.",
    button: "Open Segmentation",
    icon: "segment",
  },
] as const;

const recentCases = [
  {
    id: "BV-024",
    region: "Wrist (Right)",
    module: "Hand Analysis",
    status: "Awaiting review",
    date: "12 Mar 2025, 14:32",
  },
  {
    id: "BV-023",
    region: "Femur (Left)",
    module: "Leg Analysis",
    status: "Reviewed",
    date: "11 Mar 2025, 10:18",
  },
  {
    id: "BV-022",
    region: "Ankle (Right)",
    module: "Segmentation",
    status: "Awaiting review",
    date: "10 Mar 2025, 16:05",
  },
] as const;

type ModuleType = (typeof modules)[number]["icon"];

function ModuleGraphic({ type }: { type: ModuleType }) {
  const shared = "h-16 w-16 text-[#0c5f8d]";

  if (type === "xray") {
    return (
      <div className="grid place-items-center rounded-xl bg-[#dfeef7]">
        <Bone className={shared} strokeWidth={1.8} />
      </div>
    );
  }

  if (type === "hand") {
    return (
      <div className="grid place-items-center rounded-xl bg-[#dfeef7]">
        <div className="relative h-12 w-12">
          <div className="absolute left-1/2 top-0 h-8 w-[2px] -translate-x-1/2 bg-[#0c5f8d]" />
          <div className="absolute left-0 top-3 h-[2px] w-8 bg-[#0c5f8d]" />
          <div className="absolute right-0 top-3 h-[2px] w-8 bg-[#0c5f8d]" />
          <div className="absolute left-1/2 top-6 h-7 w-[2px] -translate-x-1/2 bg-[#0c5f8d]" />
          <div className="absolute left-1/2 top-10 h-4 w-[2px] -translate-x-1/2 bg-[#0c5f8d]" />
        </div>
      </div>
    );
  }

  if (type === "leg") {
    return (
      <div className="grid place-items-center rounded-xl bg-[#dfeef7]">
        <div className="relative h-12 w-12">
          <div className="absolute left-1/2 top-0 h-9 w-[2px] -translate-x-1/2 bg-[#0c5f8d]" />
          <div className="absolute left-1/2 top-8 h-4 w-[2px] -translate-x-1/2 bg-[#0c5f8d]" />
          <div className="absolute left-0 top-4 h-[2px] w-7 bg-[#0c5f8d]" />
          <div className="absolute right-0 top-4 h-[2px] w-7 bg-[#0c5f8d]" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid place-items-center rounded-xl bg-[#dfeef7]">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 border-[3px] border-[#0c5f8d] [clip-path:polygon(50%_0%,100%_30%,100%_100%,0%_100%,0%_30%)]" />
        <div className="absolute inset-[18%] border-[3px] border-[#0c5f8d] [clip-path:polygon(50%_0%,100%_30%,100%_100%,0%_100%,0%_30%)]" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#edf3f8] text-[#031A33]">
      <div className="flex min-h-screen">
        <aside className="w-[260px] bg-[#06284d] px-4 py-4 text-white">
          <div className="flex items-center gap-3 px-2 pb-8 pt-2">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#0b355f]">
              <Bone className="h-6 w-6 text-white" strokeWidth={2.2} />
            </div>
            <div className="leading-tight">
              <div className="text-[22px] font-bold tracking-[-0.05em]">
                BoneVision <span className="text-[#4cc9d0]">AI</span>
              </div>
              <div className="text-[12px] text-[#c7d6e8]">Research Prototype</div>
            </div>
          </div>

          <nav className="mt-2 space-y-2">
            {navItems.map(({ icon: Icon, label, active }) => (
              <button
                key={label}
                className={[
                  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[18px] font-medium transition",
                  active
                    ? "bg-[#1b3f62] text-white shadow-inner"
                    : "text-[#dfeaf5] hover:bg-[#10355d] hover:text-white",
                ].join(" ")}
              >
                <Icon className="h-5 w-5" strokeWidth={2.2} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-8 border-t border-white/10 pt-5">
            <div className="flex items-center gap-3 rounded-xl px-3 py-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#dfeaf5] text-[#06284d]">
                <UserCircle2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-semibold">Dr. Alex Carter</div>
                <div className="text-[12px] text-[#bfd0e8]">Researcher</div>
              </div>
            </div>

            <button className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-medium text-[#dfeaf5] hover:bg-[#10355d]">
              <LogOut className="h-5 w-5" />
              <span>Sign out</span>
            </button>
          </div>
        </aside>

        <section className="flex-1">
          <header className="flex h-[78px] items-center justify-between border-b border-[#dfe7ee] bg-[#f5f7fa] px-7">
            <div className="flex items-center gap-4 text-[15px] text-[#445a76]">
              <span className="font-bold text-[#0d1f39]">Case BV-024</span>
              <span className="text-[#8f9aac]">•</span>
              <span>Research prototype</span>
              <span className="text-[#8f9aac]">•</span>
              <span>Demo data</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full border border-[#dfe7ee] bg-white text-[#0d1f39]">
                <CircleHelp className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-[#edf3f8] px-3 py-2 text-[12px] font-medium text-[#415775]">
                <div className="h-2.5 w-2.5 rounded-full bg-[#0E9AA0]" />
                <span>Musculoskeletal Fracture Recognition</span>
              </div>
            </div>
          </header>

          <div className="px-8 py-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h1 className="text-[58px] font-extrabold leading-[1.02] tracking-[-0.06em] text-[#0f1f35]">
                  Research workspace
                </h1>
                <p className="mt-3 text-[20px] font-medium text-[#3d526d]">
                  AI-Driven Solution for Musculoskeletal Fracture Recognition
                </p>
                <p className="mt-2 max-w-[760px] text-[15px] text-[#64748b]">
                  Explore, analyse and review X-ray cases using AI-assisted tools. Research prototype with demo data.
                </p>
              </div>

              <button className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#0d7ea6] px-5 py-4 text-[18px] font-semibold text-white shadow-sm hover:bg-[#0b6d92]">
                <Plus className="h-5 w-5" />
                New case
              </button>
            </div>

            <div className="mt-8 rounded-2xl border border-[#dfe7ee] bg-white/70 p-4 shadow-sm">
              <div className="grid gap-4 xl:grid-cols-[1.15fr_1.15fr_1.15fr_1.5fr]">
                {summaryCards.map(({ value, label, tone }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-xl border border-[#dde6ee] bg-[#f8fbfd] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={[
                          "grid h-12 w-12 place-items-center rounded-xl text-[#0f1f35]",
                          tone === "warning" && "bg-[#f6efe1] text-[#d98215]",
                          tone === "success" && "bg-[#eaf5ee] text-[#1c9a67]",
                          tone === "neutral" && "bg-[#f2efe0] text-[#0f1f35]",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {tone === "warning" ? (
                          <Clock3 className="h-5 w-5" />
                        ) : tone === "success" ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <span className="text-[24px] font-bold">{value}</span>
                        )}
                      </div>
                      <div className="text-[15px] font-medium text-[#304a68]">
                        {tone === "neutral" ? value : value}
                      </div>
                    </div>
                    <span className="text-[13px] text-[#60748a]">{label}</span>
                  </div>
                ))}

                <div className="flex items-center justify-end gap-3">
                  {workflowSteps.map((step, index) => {
                    const isActive = index === 0;
                    const isComplete = index < 2;
                    return (
                      <div key={step.id} className="flex items-center gap-2">
                        <div
                          className={[
                            "grid h-9 w-9 place-items-center rounded-full text-[14px] font-semibold",
                            isActive
                              ? "bg-[#dfeff1] text-[#0b6f83]"
                              : isComplete
                                ? "bg-[#dff3ea] text-[#1d8d62]"
                                : "bg-[#edf2f7] text-[#5a6f88]",
                          ].join(" ")}
                        >
                          {step.id}
                        </div>
                        {index < workflowSteps.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-[#72839b]" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {modules.map((module) => (
                <div key={module.number} className="rounded-2xl border border-[#dfe7ee] bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <ModuleGraphic type={module.icon} />
                      <div className="flex items-center gap-3">
                        <span className="text-[22px] font-bold text-[#0f1f35]">{module.number}</span>
                        <div className="text-[20px] font-semibold text-[#0f1f35]">{module.title}</div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[#6b7d90]" />
                  </div>

                  <p className="mt-4 text-[16px] leading-6 text-[#485d74]">{module.description}</p>

                  <button className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-[#0d8eb0] bg-[#f5fbfc] px-4 py-3 text-[16px] font-semibold text-[#0d6a83] transition hover:bg-[#ebf8fb]">
                    {module.button}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-bold text-[#0f1f35]">Recent cases</h2>
                <button className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#0c5f8d]">
                  View all cases
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-[#dfe7ee] bg-white">
                <table className="min-w-full border-collapse">
                  <thead className="bg-[#edf3f8] text-[14px] font-semibold text-[#455c75]">
                    <tr>
                      <th className="px-5 py-4 text-left">Case ID</th>
                      <th className="px-5 py-4 text-left">Region</th>
                      <th className="px-5 py-4 text-left">Module</th>
                      <th className="px-5 py-4 text-left">Review status</th>
                      <th className="px-5 py-4 text-left">Last updated</th>
                      <th className="px-5 py-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf1f5]">
                    {recentCases.map((row) => (
                      <tr key={row.id} className="text-[15px] text-[#20314a]">
                        <td className="px-5 py-4 font-medium">{row.id}</td>
                        <td className="px-5 py-4">{row.region}</td>
                        <td className="px-5 py-4">{row.module}</td>
                        <td className="px-5 py-4">
                          <span
                            className={[
                              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[13px] font-semibold",
                              row.status === "Reviewed"
                                ? "bg-[#e7f8ef] text-[#208a5d]"
                                : "bg-[#fdf1df] text-[#c78a21]",
                            ].join(" ")}
                          >
                            <span
                              className={[
                                "h-2.5 w-2.5 rounded-full",
                                row.status === "Reviewed" ? "bg-[#1ea96d]" : "bg-[#d9951d]",
                              ].join(" ")}
                            />
                            {row.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[#546d87]">{row.date}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <button className="inline-flex items-center gap-2 rounded-xl border border-[#0d8eb0] bg-[#f5fbfc] px-3 py-2 text-[14px] font-semibold text-[#0d6a83]">
                              Open
                              <ChevronRight className="h-4 w-4" />
                            </button>
                            <button className="grid h-9 w-9 place-items-center rounded-lg border border-[#dfe7ee] bg-white text-[#425b73]">
                              <Ellipsis className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
