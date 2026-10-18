"use client";

import { type FormEvent, type PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bone,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileText,
  Hand,
  Home,
  Image as ImageIcon,
  Layers3,
  LogOut,
  Move,
  Play,
  Plus,
  RotateCcw,
  Settings,
  Sun,
  UserCircle2,
  ZoomIn,
} from "lucide-react";

type User = { id: number; name: string; email: string; role: string; institution: string };
type Finding = {
  id: number;
  bone: string;
  location: string;
  pattern: string;
  confidence: number;
  review_status: string;
  notes: string;
};
type ResearchCase = {
  id: string;
  region: string;
  module: string;
  status: string;
  updated_at: string;
  side: string;
  view: string;
  study_date: string | null;
  validation_status: string;
  image_url: string | null;
  findings: Finding[];
};
type CaseSummary = Omit<ResearchCase, "findings">;
type ApiResponse<T> = { success: boolean; message: string; data: T | null };
type FindingDraft = Omit<Finding, "id">;

const navItems = [
  { label: "Overview", icon: Home },
  { label: "X-ray Validation", icon: ImageIcon },
  { label: "Hand Analysis", icon: Hand },
  { label: "Leg Analysis", icon: Bone, active: true },
  { label: "Segmentation", icon: Layers3 },
  { label: "Case History", icon: FileText },
  { label: "Settings", icon: Settings },
];

const emptyDraft: FindingDraft = {
  bone: "Tibia",
  location: "Shaft",
  pattern: "Oblique",
  confidence: 0,
  review_status: "Pending clinician review",
  notes: "",
};

class SessionExpiredError extends Error {}

async function apiRequest<T>(path: string, method: "GET" | "POST" | "PATCH" = "GET", body?: unknown) {
  const options: RequestInit = {
    method,
    cache: "no-store",
    ...(body === undefined
      ? {}
      : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  };
  let response = await fetch(path, options);
  if (response.status === 401) {
    const refresh = await fetch("/api/auth/refresh", { method: "POST", cache: "no-store" });
    if (!refresh.ok) throw new SessionExpiredError("Your session has expired.");
    response = await fetch(path, options);
  }
  const result = await response.json() as ApiResponse<T>;
  if (!response.ok || !result.success || result.data === null) {
    throw new Error(result.message || "The request could not be completed.");
  }
  return result.data;
}

function formatStudyDate(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-CA");
}

function Sidebar({ user }: { user: User | null }) {
  return (
    <aside className="flex min-h-screen w-[170px] shrink-0 flex-col bg-[#062849] text-[#d4e0ef] max-[760px]:w-[58px]">
      <div className="flex h-[58px] items-center gap-2.5 border-b border-white/10 px-5 max-[760px]:justify-center max-[760px]:px-2">
        <div className="text-[#10b9ca]"><Bone size={25} strokeWidth={3} /></div>
        <div className="whitespace-nowrap text-[16px] font-bold tracking-[-.04em] max-[760px]:hidden">
          BoneVision <span className="text-[#16bfd0]">AI</span>
        </div>
      </div>
      <nav aria-label="Main navigation" className="mt-4 space-y-1 px-1">
        {navItems.map(({ label, icon: Icon, active }) => (
          <a
            key={label}
            href={label === "Leg Analysis" ? "/dashboard" : "#"}
            aria-current={active ? "page" : undefined}
            title={label}
            className={[
              "flex h-[42px] items-center gap-3 border-l-[3px] px-4 text-[12px] transition max-[760px]:justify-center max-[760px]:px-0",
              active
                ? "border-[#15c5d3] bg-[#0d4663] font-semibold text-white"
                : "border-transparent hover:bg-white/[.06] hover:text-white",
            ].join(" ")}
          >
            <Icon size={17} strokeWidth={1.8} />
            <span className="whitespace-nowrap max-[760px]:hidden">{label}</span>
          </a>
        ))}
      </nav>
      <div className="mt-auto px-4 pb-4 max-[760px]:px-2">
        <div className="mb-3 border-t border-white/20" />
        <div className="flex items-center gap-2.5 px-1 py-2">
          <UserCircle2 className="shrink-0 text-[#d8e7f5]" size={29} />
          <div className="min-w-0 text-[11px] max-[760px]:hidden">
            <div className="truncate font-semibold text-white">{user?.name || "Researcher"}</div>
            <div className="text-[#aec2d7]">{user?.role || "Researcher"}</div>
          </div>
        </div>
        <form action="/api/auth/logout" method="post">
          <button className="mt-2 flex w-full items-center gap-3 rounded px-2 py-2 text-left text-[12px] hover:bg-white/[.06] max-[760px]:justify-center">
            <LogOut size={17} /><span className="max-[760px]:hidden">Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}

function StatusPill({ text, passed }: { text: string; passed?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${passed ? "text-[#12885f]" : "text-[#a45a05]"}`}>
      {passed ? <Check size={15} className="rounded-full bg-[#16a874] p-[2px] text-white" /> : <AlertTriangle size={15} />}
      {text}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [activeCase, setActiveCase] = useState<ResearchCase | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<FindingDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [regionRange, setRegionRange] = useState("Knee to ankle");
  const [view, setView] = useState("AP");
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [panMode, setPanMode] = useState(false);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showAttention, setShowAttention] = useState(false);
  const [showNewCase, setShowNewCase] = useState(false);
  const [newRegion, setNewRegion] = useState("Knee to ankle");
  const [dragStart, setDragStart] = useState<{ x: number; y: number; left: number; top: number } | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const imageFrame = useRef<HTMLDivElement>(null);
  const currentFinding = activeCase?.findings.find(({ id }) => id === selectedFindingId) ?? activeCase?.findings[0] ?? null;

  const loadWorkspace = useCallback(async (preferredId?: string) => {
    setLoading(true);
    setError("");
    try {
      const profile = await apiRequest<User>("/api/auth/me");
      const summaries = await apiRequest<{ cases: CaseSummary[] }>("/api/cases");
      setUser(profile);
      setCases(summaries.cases);
      const chosen = summaries.cases.find(({ id }) => id === preferredId)
        ?? summaries.cases.find(({ module }) => module === "Leg Analysis")
        ?? summaries.cases[0];
      if (!chosen) {
        setActiveCase(null);
        setSelectedFindingId(null);
        return;
      }
      const detail = await apiRequest<ResearchCase>(`/api/cases/${encodeURIComponent(chosen.id)}`);
      setActiveCase(detail);
      setSelectedFindingId((current) => detail.findings.some(({ id }) => id === current) ? current : detail.findings[0]?.id ?? null);
      setView(detail.view);
    } catch (loadError) {
      if (loadError instanceof SessionExpiredError) router.replace("/login");
      else setError(loadError instanceof Error ? loadError.message : "Unable to load the case workspace.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void loadWorkspace(); }, [loadWorkspace]);

  useEffect(() => {
    if (!currentFinding) {
      setDraft(emptyDraft);
      return;
    }
    setDraft({
      bone: currentFinding.bone,
      location: currentFinding.location,
      pattern: currentFinding.pattern,
      confidence: currentFinding.confidence,
      review_status: currentFinding.review_status,
      notes: currentFinding.notes,
    });
  }, [currentFinding]);

  async function saveFinding() {
    if (!activeCase || !currentFinding) return;
    setBusy(true);
    setNotice("");
    setError("");
    try {
      await apiRequest<Finding>(
        `/api/cases/${encodeURIComponent(activeCase.id)}/findings/${currentFinding.id}`,
        "PATCH",
        draft,
      );
      await loadWorkspace(activeCase.id);
      setNotice("Finding draft saved.");
    } catch (saveError) {
      if (saveError instanceof SessionExpiredError) router.replace("/login");
      else setError(saveError instanceof Error ? saveError.message : "Unable to save this finding.");
    } finally {
      setBusy(false);
    }
  }

  async function performCaseAction(action: "review" | "segmentation" | "analyze") {
    if (!activeCase) return;
    if (action !== "analyze" && currentFinding) {
      try {
        await apiRequest<Finding>(
          `/api/cases/${encodeURIComponent(activeCase.id)}/findings/${currentFinding.id}`,
          "PATCH",
          draft,
        );
      } catch (saveError) {
        if (saveError instanceof SessionExpiredError) router.replace("/login");
        else setError(saveError instanceof Error ? saveError.message : "Unable to save finding changes.");
        return;
      }
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const messages = {
        review: "Review request sent.",
        segmentation: "Case sent to the segmentation queue.",
        analyze: "",
      };
      await apiRequest<ResearchCase>(`/api/cases/${encodeURIComponent(activeCase.id)}/${action}`, "POST");
      await loadWorkspace(activeCase.id);
      if (messages[action]) setNotice(messages[action]);
    } catch (actionError) {
      if (actionError instanceof SessionExpiredError) router.replace("/login");
      else setError(actionError instanceof Error ? actionError.message : "The action could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function createCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const created = await apiRequest<ResearchCase>("/api/cases", "POST", {
        region: newRegion,
        module: "Leg Analysis",
        side: "Right",
        view: "AP",
        study_date: new Date().toISOString().slice(0, 10),
      });
      setShowNewCase(false);
      await loadWorkspace(created.id);
    } catch (createError) {
      if (createError instanceof SessionExpiredError) router.replace("/login");
      else setError(createError instanceof Error ? createError.message : "Unable to create the case.");
    } finally {
      setBusy(false);
    }
  }

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!panMode) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStart({ x: event.clientX, y: event.clientY, left: imagePosition.x, top: imagePosition.y });
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragStart) return;
    setImagePosition({
      x: dragStart.left + event.clientX - dragStart.x,
      y: dragStart.top + event.clientY - dragStart.y,
    });
  }

  const dateLabel = formatStudyDate(activeCase?.study_date ?? null);

  return (
    <main className="min-h-screen bg-[#eff5fa] text-[#10213d]">
      <div className="flex min-h-screen">
        <Sidebar user={user} />
        <div className="min-w-0 flex-1">
          <header className="flex h-[45px] items-center justify-between border-b border-[#d8e3ed] bg-white px-5 text-[11px] max-[760px]:px-3">
            <div className="flex min-w-0 items-center gap-3">
              <strong className="whitespace-nowrap text-[14px]">{activeCase ? `Case ${activeCase.id}` : "Leg analysis"}</strong>
              <span className="rounded-full bg-[#edf3f9] px-2.5 py-1 text-[10px] text-[#52647d]">Research prototype · Demo data</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-[10px] text-[#405675] lg:block">AI-Driven Solution for Musculoskeletal Fracture Recognition</span>
              <span className="border-l border-[#dbe4ed] pl-3 text-[#617690]"><CircleHelp size={16} /></span>
            </div>
          </header>

          <div className="mx-auto max-w-[1700px] px-[22px] pb-6 pt-4 max-[760px]:px-3">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-[23px] font-bold leading-tight tracking-[-.025em] text-[#101d39]">Leg Fracture Detection &amp; Classification</h1>
                <p className="mt-1 text-[11px] text-[#536984]">AI-assisted analysis of lower limb X-rays for fracture detection and characterization.</p>
              </div>
              <button
                onClick={() => setShowNewCase(true)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded bg-[#079baa] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#078595]"
              >
                <Plus size={15} /> New case
              </button>
            </div>

            {error && (
              <div role="alert" className="mb-3 flex items-center justify-between rounded border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
                <span>{error}</span>
                <button onClick={() => void loadWorkspace(activeCase?.id)} className="font-semibold underline">Retry</button>
              </div>
            )}
            {notice && (
              <div role="status" className="mb-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800">{notice}</div>
            )}

            {!loading && !activeCase ? (
              <section className="rounded-lg border border-[#d9e5ef] bg-white p-10 text-center">
                <Bone className="mx-auto text-[#0b9aa9]" size={34} />
                <h2 className="mt-3 text-lg font-semibold">No leg analysis cases yet</h2>
                <p className="mt-1 text-sm text-[#60738c]">Create a case to start a leg fracture review.</p>
                <button onClick={() => setShowNewCase(true)} className="mt-4 rounded bg-[#079baa] px-4 py-2 text-sm font-semibold text-white">Create case</button>
              </section>
            ) : (
              <>
                <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:hidden">
                  <label className="text-[10px] text-[#61748c]">Select case
                    <select
                      value={activeCase?.id ?? ""}
                      onChange={(event) => void loadWorkspace(event.target.value)}
                      className="mt-1 block w-full rounded border border-[#d7e2ec] bg-white p-2 text-xs text-[#162642]"
                    >
                      {cases.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.region}</option>)}
                    </select>
                  </label>
                  <div className="rounded border border-[#d7e2ec] bg-white p-2 text-[10px]">
                    <span className="block text-[#71829a]">Validation</span>
                    <StatusPill text={activeCase?.validation_status ?? "Loading"} passed={activeCase?.validation_status === "Validation passed"} />
                  </div>
                </div>
                <div className="mb-3 hidden items-center justify-between rounded border border-[#d9e5ef] bg-white px-3 py-2 lg:flex">
                  <div className="flex items-center gap-4 text-[10px]">
                    <div><div className="text-[#71829a]">Case ID</div><strong className="text-[13px]">{activeCase?.id ?? "—"}</strong></div>
                    <div className="h-8 w-px bg-[#e2e9ef]" />
                    <div><div className="text-[#71829a]">Validation</div><StatusPill text={activeCase?.validation_status ?? "Loading"} passed={activeCase?.validation_status === "Validation passed"} /></div>
                    <div className="h-8 w-px bg-[#e2e9ef]" />
                    <div><div className="text-[#71829a]">Side</div><strong>{activeCase?.side ?? "—"}</strong></div>
                    <div className="h-8 w-px bg-[#e2e9ef]" />
                    <div><div className="text-[#71829a]">View</div><strong>{view}</strong></div>
                    <div className="h-8 w-px bg-[#e2e9ef]" />
                    <div><div className="text-[#71829a]">Study date</div><strong>{dateLabel}</strong></div>
                  </div>
                  <div className="text-[10px] text-[#50627a]">Research use only</div>
                </div>

                <div className="mb-3 flex gap-1.5">
                  {["Hip to knee", "Knee to ankle", "Foot and ankle"].map((range) => (
                    <button
                      key={range}
                      onClick={() => setRegionRange(range)}
                      className={`rounded border px-3 py-1.5 text-[10px] ${regionRange === range ? "border-[#0b9eae] bg-[#0b9eae] font-semibold text-white" : "border-[#d5e0e9] bg-white text-[#405773] hover:bg-[#f4f8fb]"}`}
                    >
                      {range}
                    </button>
                  ))}
                </div>

                <div className="grid items-start gap-3 lg:grid-cols-[minmax(380px,1.18fr)_minmax(330px,.9fr)]">
                  <section aria-label="X-ray image viewer" className="overflow-hidden rounded-md border border-[#153b5d] bg-[#031b31] p-1.5">
                    <div className="flex h-[32px] items-center justify-between gap-2 px-1 text-[#d1dce8]">
                      <div className="flex items-center gap-1">
                        <button title="Zoom in" onClick={() => setZoom((value) => Math.min(value + .15, 2.5))} className="flex items-center gap-1 rounded px-1.5 py-1 text-[9px] hover:bg-white/10"><ZoomIn size={13} /> Zoom</button>
                        <button title="Pan image" onClick={() => setPanMode((value) => !value)} className={`flex items-center gap-1 rounded px-1.5 py-1 text-[9px] hover:bg-white/10 ${panMode ? "bg-[#0c9bab] text-white" : ""}`}><Move size={13} /> Pan</button>
                        <button title="Adjust brightness" onClick={() => setBrightness((value) => value >= 1.45 ? .75 : value + .15)} className="flex items-center gap-1 rounded px-1.5 py-1 text-[9px] hover:bg-white/10"><Sun size={13} /> Brightness</button>
                        <button title="Adjust contrast" onClick={() => setContrast((value) => value >= 1.45 ? .75 : value + .15)} className="hidden items-center gap-1 rounded px-1.5 py-1 text-[9px] hover:bg-white/10 sm:flex"><Activity size={13} /> Contrast</button>
                        <button title="Reset viewer" onClick={() => { setZoom(1); setBrightness(1); setContrast(1); setImagePosition({ x: 0, y: 0 }); }} className="flex items-center gap-1 rounded px-1.5 py-1 text-[9px] hover:bg-white/10"><RotateCcw size={12} /> Reset</button>
                      </div>
                      <div className="flex rounded border border-[#416078] p-[2px] text-[9px]">
                        {["AP", "Lateral"].map((projection) => (
                          <button
                            key={projection}
                            onClick={() => {
                              setView(projection);
                              if (projection === "Lateral") setNotice("A lateral demo image is not attached to this case; the AP image remains displayed.");
                              else setNotice("");
                            }}
                            className={`rounded px-3 py-1 ${view === projection ? "bg-[#079baa] text-white" : "hover:bg-white/10"}`}
                          >
                            {projection}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div
                      ref={imageFrame}
                      onPointerDown={pointerDown}
                      onPointerMove={pointerMove}
                      onPointerUp={() => setDragStart(null)}
                      onPointerCancel={() => setDragStart(null)}
                      className={`relative mx-auto h-[min(62vh,650px)] min-h-[390px] overflow-hidden rounded bg-black ${panMode ? "cursor-grab active:cursor-grabbing" : ""}`}
                    >
                      {activeCase?.image_url ? (
                        <div
                          className="absolute inset-0 grid place-items-center transition-transform duration-100"
                          style={{
                            transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${zoom})`,
                            filter: `brightness(${brightness}) contrast(${contrast})`,
                            touchAction: panMode ? "none" : "auto",
                          }}
                        >
                          <Image
                            src={activeCase.image_url}
                            alt="Illustrative demo lower-leg radiograph"
                            fill
                            sizes="(max-width: 1024px) 100vw, 60vw"
                            unoptimized
                            className="object-contain"
                            draggable={false}
                          />
                          {showAttention && <div className="pointer-events-none absolute left-[33%] top-[48%] h-[18%] w-[35%] rounded-full bg-cyan-400/20 blur-2xl" />}
                        </div>
                      ) : (
                        <div className="grid h-full place-items-center px-6 text-center text-xs text-[#c3d0dc]">
                          No X-ray image is attached to this case.
                        </div>
                      )}
                      {showBoxes && currentFinding && (
                        <div className="pointer-events-none absolute left-[45%] top-[48%] h-[19%] w-[12%] min-w-10 border border-[#ffc01f]">
                          <span className="absolute -top-[17px] left-0 whitespace-nowrap bg-[#ffbf1b] px-1.5 py-0.5 text-[9px] font-bold text-[#25200e]">
                            Candidate {activeCase?.findings.findIndex(({ id }) => id === currentFinding.id)! + 1}
                          </span>
                        </div>
                      )}
                      {!activeCase?.image_url && <span className="absolute left-3 top-3 text-[18px] text-white">R</span>}
                      <span className="absolute bottom-2 left-3 rounded bg-black/55 px-1.5 py-1 text-[9px] text-white/85">Illustrative demo image · Not for diagnosis</span>
                    </div>
                    <div className="flex min-h-[30px] flex-wrap items-center gap-x-4 gap-y-1 px-2 pt-2 text-[9px] text-[#c7d6e4]">
                      <button onClick={() => setShowBoxes((value) => !value)} className="flex items-center gap-1.5">
                        <span className={`relative h-3.5 w-6 rounded-full ${showBoxes ? "bg-[#00aabc]" : "bg-[#586777]"}`}><span className={`absolute top-[2px] h-2.5 w-2.5 rounded-full bg-white ${showBoxes ? "right-[2px]" : "left-[2px]"}`} /></span> Show AI detection boxes
                      </button>
                      <button onClick={() => setShowAttention((value) => !value)} className="flex items-center gap-1.5">
                        <span className={`relative h-3.5 w-6 rounded-full ${showAttention ? "bg-[#00aabc]" : "bg-[#586777]"}`}><span className={`absolute top-[2px] h-2.5 w-2.5 rounded-full bg-white ${showAttention ? "right-[2px]" : "left-[2px]"}`} /></span> Show attention map
                      </button>
                      <span className="ml-auto text-[#9bafc3]">Attention maps do not define fracture boundaries</span>
                    </div>
                  </section>

                  <aside className="space-y-2.5">
                    <section className="rounded-md border border-[#f2d28f] bg-white">
                      <div className="flex items-center gap-2 border-b border-[#f4e5c6] bg-[#fffaf0] px-3 py-2">
                        <AlertTriangle size={16} className="rounded-full bg-[#bf7a00] p-[2px] text-white" />
                        <strong className="text-[11px] text-[#88500a]">Model finding: Suspected fracture</strong>
                        <span className="ml-auto text-[9px] text-[#8b6940]">Illustrative demo</span>
                      </div>
                      {currentFinding ? (
                        <div className="grid grid-cols-[1fr_78px] gap-3 p-3">
                          <div>
                            <div className="text-[9px] text-[#71829a]">Confidence (illustrative)</div>
                            <div className="mt-0.5 text-[17px] font-bold">{currentFinding.confidence}% <span className="text-[10px] font-normal text-[#526681]">• Illustrative</span></div>
                            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#e4e9ed]"><div className="h-full rounded-full bg-[#08a1af]" style={{ width: `${currentFinding.confidence}%` }} /></div>
                            <dl className="mt-2 space-y-1.5 text-[10px]">
                              <div className="flex border-b border-[#edf0f2] pb-1"><dt className="w-1/2 text-[#71829a]">Bone</dt><dd className="font-medium">{currentFinding.bone}</dd></div>
                              <div className="flex border-b border-[#edf0f2] pb-1"><dt className="w-1/2 text-[#71829a]">Location</dt><dd className="font-medium">{currentFinding.location}</dd></div>
                              <div className="flex border-b border-[#edf0f2] pb-1"><dt className="w-1/2 text-[#71829a]">Pattern</dt><dd className="font-medium">{currentFinding.pattern}</dd></div>
                              <div className="flex items-center gap-1 text-[#9a5b0c]"><dt className="text-[#71829a]">Assessment</dt><dd className="ml-auto font-semibold">{currentFinding.review_status}</dd></div>
                            </dl>
                          </div>
                          <div className="relative h-[98px] overflow-hidden rounded border border-[#d7e0e8] bg-[#071018]">
                            {activeCase?.image_url && (
                              <Image
                                src={activeCase.image_url}
                                alt="Magnified illustrative finding"
                                fill
                                sizes="78px"
                                unoptimized
                                className="scale-[2.7] object-cover object-[48%_54%]"
                              />
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="p-4 text-[11px] text-[#60738c]">No saved findings yet. Run analysis after a model is configured.</p>
                      )}
                    </section>

                    <section className="rounded-md border border-[#dbe5ed] bg-white p-2">
                      <div className="mb-1.5 flex items-center justify-between px-1">
                        <strong className="text-[10px]">All model findings ({activeCase?.findings.length ?? 0})</strong>
                        <button disabled={busy || !activeCase} onClick={() => void performCaseAction("analyze")} className="flex items-center gap-1 rounded bg-[#079baa] px-2.5 py-1.5 text-[10px] font-semibold text-white disabled:opacity-60">
                          <Play size={11} /> Run analysis
                        </button>
                      </div>
                      {activeCase?.findings.map((finding, index) => (
                        <button
                          key={finding.id}
                          onClick={() => setSelectedFindingId(finding.id)}
                          className={`flex w-full items-center gap-2 rounded px-1.5 py-1.5 text-left text-[10px] ${currentFinding?.id === finding.id ? "bg-[#eaf5fa]" : "hover:bg-[#f5f8fb]"}`}
                        >
                          <span className={`grid h-[19px] w-[19px] shrink-0 place-items-center rounded-full text-[9px] ${index === 0 ? "bg-[#ffe9b5] text-[#825800]" : "bg-[#e8eef6] text-[#405773]"}`}>{String(index + 1).padStart(2, "0")}</span>
                          <span className="min-w-0 flex-1 truncate">{finding.bone} – {finding.location} – {finding.pattern}</span>
                          <strong>{finding.confidence}%</strong>
                          <span className="flex items-center gap-1 rounded bg-[#fff0cd] px-1.5 py-1 text-[9px] text-[#9b6200]"><AlertTriangle size={10} /> Review</span>
                          <ChevronRight size={13} className="text-[#71829a]" />
                        </button>
                      ))}
                      {!activeCase?.findings.length && <div className="px-2 py-3 text-[10px] text-[#71829a]">Analysis results are not available for this case.</div>}
                    </section>

                    <section className="rounded-md border border-[#dbe5ed] bg-white p-2.5">
                      <div className="mb-2 flex items-center justify-between">
                        <strong className="text-[11px]">Review and edit finding</strong>
                        <span className="text-[9px] text-[#6c7f97]">{currentFinding ? `Finding ${String((activeCase?.findings.findIndex(({ id }) => id === currentFinding.id) ?? 0) + 1).padStart(2, "0")}` : "No finding selected"}</span>
                      </div>
                      <fieldset disabled={!currentFinding || busy} className="space-y-2 disabled:opacity-70">
                        <div className="grid grid-cols-3 gap-2">
                          <label className="text-[9px] text-[#71829a]">Bone
                            <span className="relative mt-1 block">
                              <select value={draft.bone} onChange={(event) => setDraft({ ...draft, bone: event.target.value })} className="w-full appearance-none rounded border border-[#d8e2ec] bg-white px-2 py-1.5 text-[10px] text-[#1b2d49]">
                                <option>Tibia</option><option>Fibula</option>
                              </select><ChevronDown size={12} className="pointer-events-none absolute right-2 top-2 text-[#62758d]" />
                            </span>
                          </label>
                          <label className="text-[9px] text-[#71829a]">Location
                            <span className="relative mt-1 block">
                              <select value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} className="w-full appearance-none rounded border border-[#d8e2ec] bg-white px-2 py-1.5 text-[10px] text-[#1b2d49]">
                                <option>Shaft</option><option>Proximal</option><option>Distal</option>
                              </select><ChevronDown size={12} className="pointer-events-none absolute right-2 top-2 text-[#62758d]" />
                            </span>
                          </label>
                          <label className="text-[9px] text-[#71829a]">Pattern
                            <span className="relative mt-1 block">
                              <select value={draft.pattern} onChange={(event) => setDraft({ ...draft, pattern: event.target.value })} className="w-full appearance-none rounded border border-[#d8e2ec] bg-white px-2 py-1.5 text-[10px] text-[#1b2d49]">
                                <option>Oblique</option><option>Transverse</option><option>Spiral</option><option>Possible fracture</option><option>No fracture</option>
                              </select><ChevronDown size={12} className="pointer-events-none absolute right-2 top-2 text-[#62758d]" />
                            </span>
                          </label>
                        </div>
                        <div className="grid grid-cols-[.8fr_1.2fr] gap-2">
                          <label className="text-[9px] text-[#71829a]">Confidence (illustrative)
                            <span className="mt-1 flex overflow-hidden rounded border border-[#d8e2ec]">
                              <input type="number" min={0} max={100} value={draft.confidence} onChange={(event) => setDraft({ ...draft, confidence: Number(event.target.value) })} className="min-w-0 w-full px-2 py-1.5 text-[10px] text-[#1b2d49]" />
                              <span className="border-l border-[#d8e2ec] px-2 py-1.5 text-[10px] text-[#61748c]">%</span>
                            </span>
                          </label>
                          <label className="text-[9px] text-[#71829a]">Assessment status
                            <span className="relative mt-1 block">
                              <select value={draft.review_status} onChange={(event) => setDraft({ ...draft, review_status: event.target.value })} className="w-full appearance-none rounded border border-[#d8e2ec] bg-white px-2 py-1.5 text-[10px] text-[#1b2d49]">
                                <option>Pending clinician review</option><option>Review required</option><option>Reviewed</option><option>Rejected</option>
                              </select><ChevronDown size={12} className="pointer-events-none absolute right-2 top-2 text-[#62758d]" />
                            </span>
                          </label>
                        </div>
                        <label className="block text-[9px] text-[#71829a]">Notes (optional)
                          <textarea maxLength={500} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Add notes, e.g. image quality, alternative findings, or comments…" className="mt-1 h-[58px] w-full resize-y rounded border border-[#d8e2ec] px-2 py-1.5 text-[10px] text-[#1b2d49] placeholder:text-[#9aa8b8]" />
                          <span className="block text-right text-[9px] text-[#8493a5]">{draft.notes.length}/500</span>
                        </label>
                      </fieldset>
                      <div className="mt-2 grid grid-cols-3 gap-1.5">
                        <button disabled={busy || !currentFinding} onClick={() => void saveFinding()} className="rounded border border-[#bccbd8] bg-white px-1 py-2 text-[9px] font-semibold hover:bg-[#f5f8fa] disabled:opacity-50">{busy ? "Saving…" : "Save draft"}</button>
                        <button disabled={busy || !activeCase} onClick={() => void performCaseAction("review")} className="flex items-center justify-center gap-1 rounded border border-[#f1ca74] bg-[#fff0c7] px-1 py-2 text-[9px] font-semibold text-[#825600] hover:bg-[#ffe7a7] disabled:opacity-50"><UserCircle2 size={12} /> Request review</button>
                        <button disabled={busy || !activeCase} onClick={() => void performCaseAction("segmentation")} className="flex items-center justify-center gap-1 rounded bg-[#079baa] px-1 py-2 text-[9px] font-semibold text-white hover:bg-[#078595] disabled:opacity-50">Send to segmentation <ArrowRight size={12} /></button>
                      </div>
                    </section>
                    <p className="px-1 text-[9px] leading-4 text-[#73849a]">Illustrative research prototype. Findings and confidence values are demo data, not model output or clinical advice.</p>
                  </aside>
                </div>
              </>
            )}
            {loading && <div className="fixed inset-0 z-10 grid place-items-center bg-white/40 text-sm font-medium text-[#38516d]">Loading your research workspace…</div>}
          </div>
        </div>
      </div>

      {showNewCase && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-[#061c34]/55 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="new-case-title" className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 id="new-case-title" className="text-lg font-bold">Create leg analysis case</h2>
            <p className="mt-1 text-xs text-[#64758a]">This records case metadata; no image or inference model is attached.</p>
            <form onSubmit={createCase} className="mt-4 space-y-3">
              <label className="block text-xs font-semibold">Anatomical range
                <select value={newRegion} onChange={(event) => setNewRegion(event.target.value)} className="mt-1 w-full rounded border border-[#cbd7e3] bg-white px-3 py-2 text-sm font-normal">
                  <option>Hip to knee</option><option>Knee to ankle</option><option>Foot and ankle</option>
                </select>
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowNewCase(false)} className="rounded border border-[#cbd7e3] px-3 py-2 text-xs font-semibold">Cancel</button>
                <button disabled={busy} className="rounded bg-[#079baa] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? "Creating…" : "Create case"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
