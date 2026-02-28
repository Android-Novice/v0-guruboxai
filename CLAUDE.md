# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Project Overview

**GuruBox.ai** is an AI expert toolbox platform. The first tool is **AI Product Insight**, which generates expert-level AI product opportunity analysis reports (300 opportunities + expert summary) from user input directions.

### Key Specifications
- 300 opportunities per report, 20 per page
- 30s–5min runtime per analysis
- Maximum 1 concurrent task per user
- Multi-language support: EN, ZH, DE, FR, IT, ES, PT
- Report data is permanently saved (soft delete supported)

## Technology Stack

- **Framework**: Next.js 16.1.6 with App Router
- **Language**: TypeScript 5.7.3
- **UI**: Radix UI components via shadcn/ui
- **Styling**: Tailwind CSS v4 with OKLCH color space
- **Theming**: next-themes (dark/light mode)
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Analytics**: Vercel Analytics
- **Notifications**: Sonner

## Architecture

### Directory Structure

```
/app                    # Next.js App Router pages
  /tools/product-insight # Main AI Product Insight tool page
  /analysis/[task_id]   # Analysis progress tracking
  /report/[report_id]    # Report display page
  /account              # User account and history

/components             # React components
  /ui                   # shadcn/ui base components
  /auth                 # Authentication components
  /layout               # Navbar, Footer
  /tool                 # Tool-specific components
  /i18n                 # Internationalization components
  /account, /analysis, /report  # Feature-specific components

/lib                    # Utilities and constants
  types.ts              # TypeScript type definitions
  mock-data.ts          # Mock data for development
  translations.ts       # i18n translations
  constants.ts          # App constants
  utils.ts              # Utility functions
```

### Data Models (lib/types.ts)

**Core Entities:**
- `User`: id, google_id, email, name, avatar, language
- `Report`: id, user_id, input_text, status, analysis_time_sec, total_opportunities, premium_ratio, summary_text, created_at, is_deleted
- `Task`: id, user_id, report_id, status, current_stage, stages_completed, created_at
- `Opportunity`: Detailed product opportunity with scoring metrics (monetization, industry_size, competition, mvp_difficulty, final_score)

**Analysis Stages:**
1. `understanding` - Understanding idea
2. `analyzing` - Analyzing markets
3. `scanning` - Scanning signals
4. `generating` - Generating opportunities
5. `scoring` - Scoring opportunities
6. `finalizing` - Finalizing report

## Design System

The app uses a custom design theme called **"灵光乍现" (Spark of Insight)** with:

- **OKLCH color space** for better accessibility
- **Glass morphism** effects with gradient backgrounds
- **Slow gradient motion** background animation (10-30s cycle, GPU-accelerated, 60fps)
- **Signal scanning style** animation for analysis loading (not simple spinners)
- Subtle animations: soft glow on input focus, gradient shift on button hover, smooth table transitions

Design principles: Professional, Futuristic, Effortless, Expert-level. Reference: Linear, Vercel, Perplexity.

Avoid: Neon styles, strong contrasts, complex particle animations, high-frequency animations, visual noise.

## Current Implementation Status

### Completed
- Frontend UI implementation with Next.js App Router
- Design system with "灵光乍现" theme
- Authentication provider (mock with localStorage for dev, Google OAuth planned)
- Internationalization system with type-safe translations
- Report display with pagination (20 per page)

### Not Yet Implemented
- Backend API routes
- Database integration
- Real AI model integration
- Google OAuth authentication
- Actual PDF/Google Docs export functionality

## Key Features

### AI Product Insight Tool
- Single input box with natural language support
- Pre-populated suggestions (3-6 items) for quick start
- Real-time analysis progress tracking via 6-stage pipeline
- Export capabilities: PDF, Google Docs
- Persistent report history in user account

### User Management
- Google OAuth authentication
- User profiles with avatar
- Analysis history tracking
- Language preference settings (account dropdown)

## Important Notes

- This is a frontend-focused codebase using mock data for development
- The full PRD is available at `.claude/guruprd.md` with detailed specifications
- Mobile devices auto-disable background animations for performance
- Tasks support resume functionality on page refresh or re-login
- Premium opportunities are defined as `final_score > 80`
