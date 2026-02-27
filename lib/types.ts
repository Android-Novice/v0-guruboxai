export type Language = "en" | "zh" | "de" | "fr" | "it" | "es" | "pt"

export type AnalysisStage =
  | "understanding"
  | "analyzing"
  | "scanning"
  | "generating"
  | "scoring"
  | "finalizing"

export type TaskStatus = "pending" | "running" | "completed" | "failed"
export type ReportStatus = "generating" | "completed" | "deleted"

export interface User {
  id: string
  google_id: string
  email: string
  name: string
  avatar: string
  language: Language
}

export interface Report {
  id: string
  user_id: string
  input_text: string
  status: ReportStatus
  analysis_time_sec: number
  total_opportunities: number
  premium_ratio: number
  summary_text: string
  created_at: string
  is_deleted: boolean
}

export interface Task {
  id: string
  user_id: string
  report_id: string
  status: TaskStatus
  current_stage: AnalysisStage
  stages_completed: AnalysisStage[]
  created_at: string
}

export interface Opportunity {
  id: string
  report_id: string
  index_number: number
  name: string
  core_users: string
  pain_points: string
  user_demands: string
  ai_solution: string
  category: string
  inspiration_source: string
  signal_count: number
  monetization_score: number
  industry_size_score: number
  competition_score: number
  mvp_difficulty_score: number
  final_score: number
}

export interface AnalysisStageInfo {
  id: AnalysisStage
  nameKey: string
  descKey: string
}
