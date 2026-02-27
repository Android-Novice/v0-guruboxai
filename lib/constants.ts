import type { AnalysisStageInfo, Language } from "./types"

export const ANALYSIS_STAGES: AnalysisStageInfo[] = [
  { id: "understanding", nameKey: "stage_understanding", descKey: "stage_understanding_desc" },
  { id: "analyzing", nameKey: "stage_analyzing", descKey: "stage_analyzing_desc" },
  { id: "scanning", nameKey: "stage_scanning", descKey: "stage_scanning_desc" },
  { id: "generating", nameKey: "stage_generating", descKey: "stage_generating_desc" },
  { id: "scoring", nameKey: "stage_scoring", descKey: "stage_scoring_desc" },
  { id: "finalizing", nameKey: "stage_finalizing", descKey: "stage_finalizing_desc" },
]

export const SUPPORTED_LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
]

export const SUGGESTIONS = [
  "AI tools for freelancers",
  "AI SaaS opportunities",
  "AI video products",
  "AI productivity tools",
  "AI tools for small businesses",
  "AI healthcare solutions",
]

export const PAGE_SIZE = 20
export const TOTAL_OPPORTUNITIES = 300

export const STAGE_DURATION_MIN = 3000
export const STAGE_DURATION_MAX = 8000
