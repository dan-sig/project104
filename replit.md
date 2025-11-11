# Morphit - Personal Fitness Program Application

## Overview
Morphit is a science-backed fitness application that generates personalized workout programs based on CNS-ordered programming (warmup → power → compounds → isolations → core → cardio). It trains 10 functional movement patterns with adaptive difficulty and offers various split/duration options. Key features include intelligent equipment-based exercise swapping, Zone 2 and HIIT cardio, fitness assessments for advanced movements, and a flexible 7-day cycle system with automatic missed workout rescheduling. It also integrates AI-enhanced insights, including a prompt-based onboarding system for intuitive program generation, and supports a trainer marketplace for program creation and sales. Morphit aims to provide longevity-focused, adaptive training, supporting users in reaching fitness goals through intelligent, progressive programming across its four core cycles: Flow, Build, Strong, and Move.

## User Preferences
- Preferred communication style: Simple, everyday language.
- Testing preference: Only use browser-based testing when absolutely necessary (UI/UX validation, multi-page workflows, JavaScript-dependent features). Prefer faster methods like API testing, database queries, log inspection, and LSP diagnostics for backend/schema changes.

## System Architecture

### UI/UX Decisions
The frontend uses React 18 with TypeScript, Vite, Wouter for routing, and React Query for server state management. UI components are built with Shadcn/ui and Radix UI, styled with Tailwind CSS, featuring a custom Material Design-inspired theme with light/dark modes. Core views include Home, Workout, History, Body Metrics, Settings, and Progress visualization. Marketing pages (Landing, About, How It Works, Science) communicate the adaptive training approach and Morphit's 4 cycles.

### Technical Implementations
The backend is an Express.js server developed with TypeScript, handling JSON requests/responses with CORS. It integrates with Vite and uses Replit Auth (OpenID Connect) via Passport.js for authentication. PostgreSQL is the primary database, accessed via Drizzle ORM. Performance optimizations include database-level query optimization and paginated API endpoints. Timezone-safe date handling uses YYYY-MM-DD strings for calendar dates. The system supports both legacy day-of-week and new date-based scheduling. AI Conversational Program Generation uses a confirmation flow, leveraging existing profile settings and offering optional fitness assessments. A 4-Week Microcycle System defines progression (Learn, Load, Push, Deload) with week-specific parameters for each Focus Cycle (Flow, Build, Strong, Move). The Workout Duration Calculator provides real-time estimates based on tempo, reps, rest, and equipment transitions. A Movement Pattern Tracking System tracks 10 functional movement patterns at workout, week, and program levels.

### Feature Specifications
- **Data Model**: Includes Users, Fitness Assessments, Exercise Database, Workout Programs, and Performance Tracking, with pre-generated workout sessions.
- **AI-Powered Onboarding**: Uses natural language prompts with OpenAI structured outputs to parse fitness goals, schedule, and equipment, recommending assessments based on experience.
- **Comprehensive Fitness Assessment System**: Offers Bodyweight/Weights Tests or skip option, mapping data to 10 movement patterns.
- **Template-Based Adaptive Training**: Algorithms select from prebuilt templates (Strength Primary, Cardio Primary, Hybrid Balance) for custom 8-week programs.
- **Science-Based Weekly Workout Structure**: Workouts have specific focuses (squat, push, hinge, pull, athletic, unilateral) determining exercise/power selection and warmups.
- **Goal-Based Programming**: Implements mixed strength/hypertrophy training with parameters determined by exercise type and training goal, adjusting for experience.
- **CNS-Ordered Workout Progression**: Follows a hierarchy: warmup → power → compounds → isolations → core → cardio.
- **Superset & Time Allocation**: Aggressive superset programming for shorter workouts and percentage-based time allocation system based on nutrition goal and duration.
- **Time-Based Fallback System**: Ensures target workout duration by adding exercises when needed.
- **Calendar-Aligned Sessions**: Programs start on the user's current day, aligning with calendar dates.
- **Smart Exercise Reuse & Progressive Overload**: Implements hierarchical reuse rules and automatically adjusts exercise difficulty.
- **Intelligent Muscle Tracking**: Prevents muscle overwork.
- **7-Day Cycle System**: Users select calendar dates; system prompts for continuation or new program upon cycle completion.
- **Daily Calendar Workflow**: Displays today's workout, allows cardio/rest days, and previews tomorrow.
- **Partial Workout System**: Allows resuming workouts ended early.
- **Automatic Missed Workout Rescheduling**: Detects and reschedules missed workouts, shifting future sessions.
- **Flexible Exercise Swap System**: Allows swapping exercises with equipment/bodyweight options, persisting changes.
- **Calorie Tracking & Cardio Variety**: Incorporates MET calculations and goal-based cardio type rotation.
- **HIIT Interval Training**: Supports automated timers and custom intervals.
- **Unified Program Settings**: Combines nutrition and workout preferences, triggering program regeneration.
- **Trainer Marketplace**: Allows trainers to create custom exercises, build, publish, and sell training programs, and manage clients. Features include a 3-step onboarding wizard, invite system for clients, program builder, publishing flow, and a sales dashboard for revenue/client tracking.

## External Dependencies
- **UI Libraries**: Radix UI primitives, Recharts, date-fns, cmdk, Lucide React.
- **Form & Validation**: React Hook Form, Zod, Drizzle-Zod.
- **External Services**: Neon serverless (PostgreSQL), OpenAI API.
- **Asset Management**: Stock images, Google Fonts (Inter, Roboto Mono).