import type { User, Report, Task, Opportunity } from "./types"

export const MOCK_USER: User = {
  id: "user_001",
  google_id: "g_mock_001",
  email: "alex@example.com",
  name: "Alex Chen",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
  language: "en",
}

// --- Opportunity generation helpers ---

const oppNames = [
  "AI Resume Optimizer", "Smart Invoice Generator", "AI Meeting Summarizer",
  "Predictive Inventory Manager", "AI Customer Segmentation", "Smart Content Scheduler",
  "AI Legal Document Analyzer", "Automated Bug Reporter", "AI Diet Planner",
  "Smart Email Prioritizer", "AI Presentation Builder", "Automated Code Reviewer",
  "AI Competitor Tracker", "Smart Pricing Engine", "AI Copywriting Assistant",
  "Automated Social Listener", "AI Talent Matcher", "Smart Contract Analyzer",
  "AI Study Plan Generator", "Automated Expense Tracker", "AI Brand Voice Checker",
  "Smart Lead Scorer", "AI Translation Memory", "Automated Feedback Analyzer",
  "AI Workflow Optimizer", "Smart A/B Test Designer", "AI Risk Assessor",
  "Automated Onboarding Flow", "AI Product Roadmap Planner", "Smart Bid Optimizer",
  "AI Recipe Personalizer", "Automated Report Builder", "AI Tone Adjuster",
  "Smart Queue Manager", "AI Market Size Estimator", "Automated Compliance Checker",
  "AI Pitch Deck Generator", "Smart Resource Allocator", "AI Review Responder",
  "Automated Data Cleaner", "AI Feature Prioritizer", "Smart Campaign Optimizer",
  "AI Interview Coach", "Automated Schema Designer", "AI Prompt Library Manager",
  "Smart Notification Filter", "AI Content Repurposer", "Automated Changelog Writer",
  "AI Partnership Finder", "Smart Deadline Predictor",
]

const coreUsers = [
  "Freelance designers and developers", "Small e-commerce business owners",
  "Startup product managers", "Marketing agency teams", "Remote team leads",
  "Solo entrepreneurs", "Corporate HR departments", "University students",
  "Content creators and influencers", "SaaS customer success teams",
  "Healthcare administrators", "Real estate agents", "Legal professionals",
  "Financial advisors", "Non-profit organizations", "EdTech companies",
  "Supply chain managers", "Retail store owners", "B2B sales teams",
  "Data analysts and scientists",
]

const painPoints = [
  "Manual processes consuming 40% of productive time",
  "Inability to scale personalized service beyond 50 clients",
  "High error rates in repetitive documentation tasks",
  "Lack of data-driven decision making in daily workflows",
  "Difficulty keeping up with rapidly changing market trends",
  "Inconsistent quality across team deliverables",
  "Information overload leading to missed opportunities",
  "Slow response times impacting customer satisfaction",
  "Budget constraints limiting access to expert analysis",
  "Poor visibility into competitive landscape",
  "Fragmented tools creating data silos",
  "Difficulty onboarding new team members efficiently",
  "Compliance risks from manual tracking processes",
  "Language barriers limiting market expansion",
  "Inability to process unstructured data at scale",
]

const userDemands = [
  "One-click automation for repetitive tasks",
  "Real-time insights without technical expertise",
  "Seamless integration with existing tool stack",
  "Affordable AI that delivers enterprise-grade results",
  "Customizable workflows adapting to unique processes",
  "Multi-language support for global operations",
  "Actionable recommendations, not just raw data",
  "Mobile-first access for on-the-go decisions",
  "Privacy-first approach with local data processing",
  "Collaborative features for team alignment",
  "White-label capability for agency resale",
  "API access for custom integrations",
  "Bulk processing for high-volume needs",
  "Version control and audit trail",
  "Self-service setup under 5 minutes",
]

const aiSolutions = [
  "GPT-4 powered analysis with domain-specific fine-tuning and structured output",
  "Multi-model ensemble combining vision and language understanding for richer context",
  "RAG pipeline with real-time web data for always-current recommendations",
  "Few-shot learning engine that adapts to user style within 3 interactions",
  "Automated prompt chain orchestration for complex multi-step reasoning",
  "Embedding-based semantic search across all user documents and history",
  "Fine-tuned classification model with 95%+ accuracy on domain-specific tasks",
  "Real-time streaming AI with sub-second response for interactive workflows",
  "Multi-agent collaboration system for comprehensive analysis from multiple angles",
  "Hybrid on-device and cloud AI for privacy-sensitive operations",
  "Custom knowledge graph construction for organizational intelligence",
  "Continuous learning loop incorporating user feedback for improving accuracy",
  "Template-based generation with AI-guided customization for consistent quality",
  "Cross-lingual transfer learning for instant multi-language deployment",
  "Predictive modeling with explainable AI for transparent decision support",
]

const categories = [
  "Productivity", "Marketing", "Sales", "Analytics", "Operations",
  "Education", "Healthcare", "Finance", "Legal", "Creative",
]

const inspirationSources = [
  "Reddit community analysis", "Y Combinator trends", "Product Hunt launches",
  "Twitter/X discussions", "Industry report data", "Patent filings",
  "Academic research papers", "GitHub trending repos", "LinkedIn job trends",
  "App Store reviews analysis",
]

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return s / 2147483647
  }
}

function gaussianRandom(rand: () => number, mean: number, std: number): number {
  const u1 = rand()
  const u2 = rand()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return Math.max(10, Math.min(100, Math.round(mean + z * std)))
}

function generateOpportunities(reportId: string, seed: number): Opportunity[] {
  const rand = seededRandom(seed)
  const opportunities: Opportunity[] = []

  for (let i = 0; i < 300; i++) {
    const nameBase = oppNames[Math.floor(rand() * oppNames.length)]
    const suffix = i < 50 ? "" : ` v${Math.floor(rand() * 9) + 2}`
    const variant = i < 50 ? "" : ` for ${coreUsers[Math.floor(rand() * coreUsers.length)].split(" ").slice(-2).join(" ")}`

    const monetization = gaussianRandom(rand, 65, 18)
    const industrySize = gaussianRandom(rand, 60, 20)
    const competition = gaussianRandom(rand, 55, 15)
    const mvpDifficulty = gaussianRandom(rand, 60, 16)
    const signalCount = Math.floor(rand() * 180) + 20

    const finalScore = Math.round(
      monetization * 0.25 +
      industrySize * 0.25 +
      competition * 0.2 +
      mvpDifficulty * 0.15 +
      Math.min(100, signalCount / 2) * 0.15
    )

    opportunities.push({
      id: `opp_${reportId}_${String(i + 1).padStart(3, "0")}`,
      report_id: reportId,
      index_number: i + 1,
      name: i < 50 ? nameBase : `${nameBase}${suffix}${variant}`,
      core_users: coreUsers[Math.floor(rand() * coreUsers.length)],
      pain_points: painPoints[Math.floor(rand() * painPoints.length)],
      user_demands: userDemands[Math.floor(rand() * userDemands.length)],
      ai_solution: aiSolutions[Math.floor(rand() * aiSolutions.length)],
      category: categories[Math.floor(rand() * categories.length)],
      inspiration_source: inspirationSources[Math.floor(rand() * inspirationSources.length)],
      signal_count: signalCount,
      monetization_score: monetization,
      industry_size_score: industrySize,
      competition_score: competition,
      mvp_difficulty_score: mvpDifficulty,
      final_score: finalScore,
    })
  }

  // Sort by final_score descending
  opportunities.sort((a, b) => b.final_score - a.final_score)
  // Re-index after sort
  opportunities.forEach((opp, idx) => {
    opp.index_number = idx + 1
  })

  return opportunities
}

const EXPERT_SUMMARY_1 = `## Industry Landscape

The AI tools market for freelancers represents a rapidly expanding segment within the broader AI SaaS ecosystem. Current penetration remains below 15% in emerging markets, creating substantial first-mover advantages for well-positioned solutions.

## Key Demand Gaps

Our analysis reveals three critical unmet needs: (1) affordable AI-powered project management tailored for solo practitioners, (2) automated client communication tools with cultural context awareness, and (3) intelligent pricing engines that factor in local market dynamics.

## Core Opportunity Directions

The highest-scoring opportunities cluster around **workflow automation** and **intelligent document processing** — two areas where freelancers report spending 35-40% of non-billable time. Solutions combining these capabilities with mobile-first delivery show the strongest market fit signals.

## Risk Considerations

Key risks include platform dependency (major AI providers may build competing features), regulatory uncertainty around AI-generated content in professional services, and the challenge of achieving sufficient accuracy for specialized domains without extensive fine-tuning data.`

const EXPERT_SUMMARY_2 = `## Industry Landscape

The EdTech AI market is experiencing a fundamental shift from supplementary tools to core instructional platforms. Global spending on AI in education exceeded $4B in 2024, with SaaS models capturing an increasing share versus traditional enterprise licenses.

## Key Demand Gaps

Three primary gaps emerge: (1) adaptive learning systems that work across diverse curricula without extensive configuration, (2) AI-powered assessment tools that reduce teacher workload while maintaining pedagogical rigor, and (3) accessible AI tutoring that bridges language and cultural barriers in multilingual classrooms.

## Core Opportunity Directions

Top opportunities concentrate in **personalized learning path generation** and **automated content adaptation**. Institutions report willingness to pay 3-5x current tool pricing for solutions that demonstrably improve student outcomes within one semester.

## Risk Considerations

Major risks include strict data privacy regulations (FERPA, GDPR) constraining AI training approaches, institutional resistance to AI-graded assessments, and the need for robust offline functionality in under-connected regions.`

// --- Mock Reports ---

export const MOCK_REPORTS: Report[] = [
  {
    id: "report_001",
    user_id: "user_001",
    input_text: "AI tools for freelancers in India",
    status: "completed",
    analysis_time_sec: 155,
    total_opportunities: 300,
    premium_ratio: 0.18,
    summary_text: EXPERT_SUMMARY_1,
    created_at: "2026-02-20T10:30:00Z",
    is_deleted: false,
  },
  {
    id: "report_002",
    user_id: "user_001",
    input_text: "AI SaaS opportunities for education",
    status: "completed",
    analysis_time_sec: 192,
    total_opportunities: 300,
    premium_ratio: 0.15,
    summary_text: EXPERT_SUMMARY_2,
    created_at: "2026-02-22T14:15:00Z",
    is_deleted: false,
  },
]

export const MOCK_TASKS: Task[] = [
  {
    id: "task_001",
    user_id: "user_001",
    report_id: "report_001",
    status: "completed",
    current_stage: "finalizing",
    stages_completed: ["understanding", "analyzing", "scanning", "generating", "scoring", "finalizing"],
    created_at: "2026-02-20T10:30:00Z",
  },
  {
    id: "task_002",
    user_id: "user_001",
    report_id: "report_002",
    status: "completed",
    current_stage: "finalizing",
    stages_completed: ["understanding", "analyzing", "scanning", "generating", "scoring", "finalizing"],
    created_at: "2026-02-22T14:15:00Z",
  },
]

// Pre-generate opportunities for each report
export const MOCK_OPPORTUNITIES: Record<string, Opportunity[]> = {
  report_001: generateOpportunities("report_001", 42),
  report_002: generateOpportunities("report_002", 137),
}

export function getOpportunitiesForReport(reportId: string): Opportunity[] {
  if (!MOCK_OPPORTUNITIES[reportId]) {
    MOCK_OPPORTUNITIES[reportId] = generateOpportunities(reportId, Date.now())
  }
  return MOCK_OPPORTUNITIES[reportId]
}

export function getTopScore(reportId: string): number {
  const opps = getOpportunitiesForReport(reportId)
  return opps.length > 0 ? opps[0].final_score : 0
}
