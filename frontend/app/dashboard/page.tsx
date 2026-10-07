"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    caseModule: "X-ray Validation",
  },
  {
    number: "02",
    title: "Hand Analysis",
    description: "Detect and classify upper-limb fractures.",
    button: "Open Hand Analysis",
    icon: "hand",
    caseModule: "Hand Analysis",
  },
  {
    number: "03",
    title: "Leg Analysis",
    description: "Detect and classify lower-limb fractures.",
    button: "Open Leg Analysis",
    icon: "leg",
    caseModule: "Leg Analysis",
  },
  {
    number: "04",
    title: "Segmentation & Morphometry",
    description: "Inspect fracture masks and calibrated measurements.",
    button: "Open Segmentation",
    icon: "segment",
    caseModule: "Segmentation",
  },
] as const;

type CurrentUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  institution: string;
};

type DashboardCase = {
  id: string;
  region: string;
  module: string;
  status: "Awaiting review" | "Reviewed";
  updated_at: string;
};

type DashboardData = {
  cases: DashboardCase[];
  stats: {
    total: number;
    awaiting_review: number;
    reviewed: number;
  };
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

class SessionExpiredError extends Error {}

async function authenticatedFetch(path: string, init?: RequestInit) {
  let response = await fetch(path, { ...init, cache: "no-store" });
  if (response.status === 401) {
    const refresh = await fetch("/api/auth/refresh", { method: "POST", cache: "no-store" });
    if (!refresh.ok) throw new SessionExpiredError("Your session has expired.");
    response = await fetch(path, { ...init, cache: "no-store" });
  }
  return response;
}

function formatUpdatedAt(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNewCase, setShowNewCase] = useState(false);
  const [region, setRegion] = useState("");
  const [selectedModule, setSelectedModule] = useState("X-ray Validation");
  const [savingCase, setSavingCase] = useState(false);
  const [formError, setFormError] = useState("");

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const profileResponse = await authenticatedFetch("/api/auth/me");
      if (!profileResponse.ok) {
        const result = await profileResponse.json() as ApiResponse<CurrentUser>;
        throw new Error(result.message || "Unable to load your profile.");
      }
      const profile = await profileResponse.json() as ApiResponse<CurrentUser>;
      if (!profile.success || !profile.data) throw new Error(profile.message || "Unable to load your profile.");

      const casesResponse = await authenticatedFetch("/api/cases");
      if (!casesResponse.ok) {
        const result = await casesResponse.json() as ApiResponse<DashboardData>;
        throw new Error(result.message || "Unable to load cases.");
      }
      const caseResult = await casesResponse.json() as ApiResponse<DashboardData>;
      if (!caseResult.success || !caseResult.data) throw new Error(caseResult.message || "Unable to load cases.");
      setUser(profile.data);
      setDashboard(caseResult.data);
    } catch (loadError) {
      if (loadError instanceof SessionExpiredError) {
        router.replace("/login");
      } else {
        setError(loadError instanceof Error ? loadError.message : "Unable to load your workspace.");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  async function submitNewCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingCase(true);
    setFormError("");
    try {
      const response = await authenticatedFetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ region, module: selectedModule }),
      });
      const result = await response.json() as ApiResponse<DashboardCase>;
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to create the case.");
      setShowNewCase(false);
      setRegion("");
      await loadWorkspace();
    } catch (submitError) {
      if (submitError instanceof SessionExpiredError) {
        router.replace("/login");
      } else {
        setFormError(submitError instanceof Error ? submitError.message : "Unable to create the case.");
      }
    } finally {
      setSavingCase(false);
    }
  }

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
                <div className="text-[15px] font-semibold">{user?.name || "Researcher"}</div>
                <div className="text-[12px] text-[#bfd0e8]">{user?.role || "Researcher"}</div>
              </div>
            </div>

            <form action="/api/auth/logout" method="post">
              <button className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-medium text-[#dfeaf5] hover:bg-[#10355d]">
                <LogOut className="h-5 w-5" />
                <span>Sign out</span>
              </button>
            </form>
          </div>
        </aside>

        <section className="flex-1">
          <header className="flex h-[78px] items-center justify-between border-b border-[#dfe7ee] bg-[#f5f7fa] px-7">
            <div className="flex items-center gap-4 text-[15px] text-[#445a76]">
              <span className="font-bold text-[#0d1f39]">
                {dashboard?.cases[0] ? `Latest case: ${dashboard.cases[0].id}` : "No cases yet"}
              </span>
              <span className="text-[#8f9aac]">•</span>
              <span>Research prototype</span>
              <span className="text-[#8f9aac]">•</span>
              <span>Live workspace</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full border border-[#dfe7ee] bg-white text-[#0d1f39]">
                <CircleHelp className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-[#edf3f8] px-3 py-2 text-[12px] font-medium text-[#415775]">
                <div className="h-2.5 w-2.5 rounded-full bg-[#0E9AA0]" />
                <span>{user?.institution || "Musculoskeletal Fracture Recognition"}</span>
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
                  Explore, analyse and review X-ray cases using AI-assisted tools. Cases are saved to your workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedModule("X-ray Validation");
                  setShowNewCase(true);
                }}
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#0d7ea6] px-5 py-4 text-[18px] font-semibold text-white shadow-sm hover:bg-[#0b6d92]"
              >
                <Plus className="h-5 w-5" />
                New case
              </button>
            </div>

            {error && (
              <div role="alert" className="mt-5 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <span>{error}</span>
                <button type="button" onClick={() => void loadWorkspace()} className="font-semibold underline">Retry</button>
              </div>
            )}

            <div className="mt-8 rounded-2xl border border-[#dfe7ee] bg-white/70 p-4 shadow-sm">
              <div className="grid gap-4 xl:grid-cols-[1.15fr_1.15fr_1.15fr_1.5fr]">
                {[
                  { value: dashboard?.stats.total, label: "cases", tone: "neutral" },
                  { value: dashboard?.stats.awaiting_review, label: "awaiting review", tone: "warning" },
                  { value: dashboard?.stats.reviewed, label: "reviewed", tone: "success" },
                ].map(({ value, label, tone }) => (
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
                        {loading ? "—" : value ?? 0}
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

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedModule(module.caseModule);
                      setShowNewCase(true);
                    }}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-[#0d8eb0] bg-[#f5fbfc] px-4 py-3 text-[16px] font-semibold text-[#0d6a83] transition hover:bg-[#ebf8fb]"
                  >
                    {module.button}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-bold text-[#0f1f35]">Recent cases</h2>
                <button type="button" className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#0c5f8d]">
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
                    {dashboard?.cases.map((row) => (
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
                        <td className="px-5 py-4 text-[#546d87]">{formatUpdatedAt(row.updated_at)}</td>
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
                    {!loading && dashboard?.cases.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-sm text-[#64748b]">
                          No cases yet. Create a case to start your research workflow.
                        </td>
                      </tr>
                    )}
                    {loading && (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-sm text-[#64748b]">
                          Loading cases…
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>

      {showNewCase && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#031a33]/55 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-case-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="new-case-title" className="text-xl font-bold text-[#0f1f35]">Create a research case</h2>
                <p className="mt-1 text-sm text-[#64748b]">Add case details to your workspace. No X-ray image is uploaded yet.</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowNewCase(false)}
                className="rounded px-2 py-1 text-xl text-[#64748b] hover:bg-[#edf3f8]"
              >
                ×
              </button>
            </div>
            <form onSubmit={submitNewCase} className="mt-6 space-y-4">
              <div>
                <label htmlFor="case-region" className="mb-1.5 block text-sm font-semibold text-[#304a68]">Anatomical region</label>
                <input
                  id="case-region"
                  required
                  minLength={2}
                  maxLength={120}
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                  placeholder="e.g. Wrist (Right)"
                  className="w-full rounded-lg border border-[#cbd7e3] px-3 py-2.5 text-sm outline-none focus:border-[#0d8eb0] focus:ring-2 focus:ring-[#0d8eb0]/20"
                />
              </div>
              <div>
                <label htmlFor="case-module" className="mb-1.5 block text-sm font-semibold text-[#304a68]">Research module</label>
                <select
                  id="case-module"
                  value={selectedModule}
                  onChange={(event) => setSelectedModule(event.target.value)}
                  className="w-full rounded-lg border border-[#cbd7e3] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0d8eb0] focus:ring-2 focus:ring-[#0d8eb0]/20"
                >
                  {modules.map((module) => <option key={module.caseModule}>{module.caseModule}</option>)}
                </select>
              </div>
              {formError && <p role="alert" className="text-sm text-red-700">{formError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCase(false)}
                  className="rounded-lg border border-[#cbd7e3] px-4 py-2 text-sm font-semibold text-[#415775] hover:bg-[#f5f8fa]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCase}
                  className="rounded-lg bg-[#0d7ea6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0b6d92] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingCase ? "Creating…" : "Create case"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
