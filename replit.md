# Morphit - Personal Fitness Program Application

## Overview
Morphit is a science-backed fitness application that generates personalized workout programs based on CNS-ordered programming principles. It supports 10 functional movement patterns with adaptive difficulty, offers various split and duration options, and includes intelligent equipment-based exercise swapping, Zone 2 and HIIT cardio, and fitness assessments. The platform features a flexible 7-day cycle system with automatic missed workout rescheduling, AI-enhanced insights for intuitive program generation, and a trainer marketplace for program creation and sales. Morphit aims to provide longevity-focused, adaptive training through four core cycles: Flow, Build, Strong, and Move, guiding users to achieve their fitness goals through intelligent, progressive programming.

## User Preferences
- Preferred communication style: Simple, everyday language.
- Testing preference: Only use browser-based testing when absolutely necessary (UI/UX validation, multi-page workflows, JavaScript-dependent features). Prefer faster methods like API testing, database queries, log inspection, and LSP diagnostics for backend/schema changes.

## System Architecture

### UI/UX Decisions
The frontend uses React 18 with TypeScript, Vite, Wouter for routing, and React Query for server state management. UI components are built with Shadcn/ui and Radix UI, styled with Tailwind CSS, featuring a custom Material Design-inspired theme with light/dark modes. Core user views include Home, Workout, History, Body Metrics, Settings, and Progress visualization. Marketing pages communicate the adaptive training approach and Morphit's 4 cycles. The system supports a comprehensive user settings page and a consolidated trainer dashboard for streamlined navigation.

### Technical Implementations
The backend is an Express.js server developed with TypeScript, handling JSON requests/responses with CORS. Authentication is managed via Replit Auth (OpenID Connect) using Passport.js. PostgreSQL serves as the primary database, accessed through Drizzle ORM. Performance is optimized with database-level query optimization and paginated API endpoints. Date handling uses YYYY-MM-DD strings for timezone safety. AI Conversational Program Generation uses a confirmation flow and optional fitness assessments. A 4-Week Microcycle System defines progression (Learn, Load, Push, Deload) within each Focus Cycle (Flow, Build, Strong, Move). A Workout Duration Calculator provides real-time estimates. A Movement Pattern Tracking System monitors 10 functional movement patterns. Development uses an authentication bypass for test user sessions and an idempotent seed script for populating realistic data.

### Feature Specifications
- **Data Model**: Includes Users, Fitness Assessments, Exercise Database, Workout Programs, and Performance Tracking.
- **AI-Powered Onboarding**: Uses natural language prompts with OpenAI structured outputs to parse user data.
- **Fitness Assessment System**: Offers Bodyweight/Weights Tests, mapping data to 10 movement patterns.
- **Adaptive Training**: Algorithms select from prebuilt templates for custom 8-week programs.
- **Science-Based Workout Structure**: Workouts have specific focuses determining exercise selection and warmups.
- **Goal-Based Programming**: Implements mixed strength/hypertrophy training adjusted for experience.
- **CNS-Ordered Workout Progression**: Follows warmup → power → compounds → isolations → core → cardio hierarchy.
- **Superset & Time Allocation**: Aggressive superset programming and percentage-based time allocation.
- **Time-Based Fallback System**: Adds exercises to meet target workout duration.
- **Calendar-Aligned Sessions**: Programs start on the user's current day.
- **Smart Exercise Reuse & Progressive Overload**: Implements hierarchical reuse and automatic difficulty adjustment.
- **Intelligent Muscle Tracking**: Prevents muscle overwork.
- **7-Day Cycle System**: Users select calendar dates; system prompts for continuation or new program.
- **Daily Calendar Workflow**: Displays today's workout, allows cardio/rest days, and previews tomorrow.
- **Partial Workout System**: Allows resuming ended workouts.
- **Automatic Missed Workout Rescheduling**: Detects and reschedules missed workouts.
- **Flexible Exercise Swap System**: Allows swapping exercises with equipment/bodyweight options.
- **Calorie Tracking & Cardio Variety**: Incorporates MET calculations and goal-based cardio rotation.
- **HIIT Interval Training**: Supports automated timers and custom intervals.
- **Unified Program Settings**: Combines nutrition and workout preferences, triggering program regeneration.
- **Trainer Marketplace**: Allows trainers to create, publish, and sell programs, and manage clients with features like a 3-step onboarding wizard, freemium coach connection system, soft-delete architecture for disconnections, username-based coach discovery, and a sales dashboard.
- **Trainer Workout Notes System**: Enables trainers to provide pre-session notes and post-session reviews.
- **Comprehensive Alert System**: Per-client alert tracking with dual-endpoint architecture (lightweight counts for roster table, detailed categorized alerts on client pages). Tracks inactive status (7+ days without workout), missing pre-session notes, and missing post-session reviews. Yellow warning theme throughout with summary banners and dedicated Alerts tab on client detail pages.
- **Morphit Cycle Programs**: Training programs use Morphit cycle names (Flow, Build, Strong, Move) reflecting the longevity-focused progressive training philosophy. Seed script updates existing programs to match this naming convention.

## External Dependencies
- **UI Libraries**: Radix UI primitives, Recharts, date-fns, cmdk, Lucide React.
- **Form & Validation**: React Hook Form, Zod, Drizzle-Zod.
- **External Services**: Neon serverless (PostgreSQL), OpenAI API.
- **Asset Management**: Stock images, Google Fonts (Inter, Roboto Mono).