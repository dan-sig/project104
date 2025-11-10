# Morphit - Personal Fitness Program Application

## Overview
Morphit is a science-backed fitness application that generates personalized workout programs based on CNS-ordered programming (warmup → power → compounds → isolations → core → cardio). It trains 10 functional movement patterns with adaptive difficulty, offering various split and duration options. Key features include intelligent equipment-based exercise swapping, Zone 2 and HIIT cardio, fitness assessments for advanced movements, and a flexible 7-day cycle system with automatic missed workout rescheduling. It also integrates AI-enhanced insights as supplemental features, including a prompt-based onboarding system for intuitive program generation.

## User Preferences
- Preferred communication style: Simple, everyday language.
- Testing preference: Only use browser-based testing when absolutely necessary (UI/UX validation, multi-page workflows, JavaScript-dependent features). Prefer faster methods like API testing, database queries, log inspection, and LSP diagnostics for backend/schema changes.

## System Architecture

### UI/UX Decisions
The frontend uses React 18 with TypeScript, Vite, Wouter for routing, and React Query for server state management. UI components are built with Shadcn/ui and Radix UI, styled with Tailwind CSS, featuring a custom Material Design-inspired theme with light/dark modes. Core views include Home, Workout, History, Body Metrics, Settings, and Progress visualization, accessible via bottom navigation. All UI components display actual calendar dates.

**Pre-Login Marketing Pages**: Four marketing pages (Landing, About, How It Works, Science) communicate the longevity-based, adaptive training approach. Landing features the official Morphit logo (orange runner figure on black background) and brand tagline "Train Smarter. Move Stronger. Live Longer." It introduces the 4 Morphit cycles (Flow, Build, Strong, Move) with their individual taglines. About details the 10 human movement patterns emphasizing strength that lasts. How It Works explains both the 7-day cycle system and the 4-week Learn→Load→Push→Deload phase progression. Science (SmartProgression) features the 4 cycles, CNS-balanced session blueprint (Warm-Up → Power → Compound → Isolation → Core → Conditioning), and life-adaptive programming.

**Trainer Marketplace System**: A complete trainer platform allowing trainers to create custom exercises, build training programs, publish them for sale, and manage purchased clients. Role selection occurs at login via RoleSelectionDialog, storing role in sessionStorage. Routes: `/trainer` (dashboard), `/trainer/programs` (program list), `/trainer/programs/new` (program builder). **Custom Exercises**: Trainers can create custom exercises with video URLs, exercise types, and muscle targeting via CustomExerciseDrawer. All custom exercises are stored in trainerCustomExercises table with trainerId linkage. **Program Builder**: 3-step wizard interface (ProgramBuilder component using reducer pattern) for creating programs: (1) Details (name, description, price, pricing type), (2) Workouts (add/reorder workouts with day numbers), (3) Exercises (select from system exercises or custom exercises, configure sets/reps/rest). Programs are stored in trainerPrograms table with atomic creation via POST /api/trainer/programs endpoint. **Publishing Flow**: Trainers can publish programs via toggle in TrainerProgramsList, generating unique slugs for shareable links. Published programs have public landing pages at `/programs/:slug` (ProgramBuyPage) with hero section, workout accordion, pricing sidebar, and SEO metadata. **Simulated Purchase Flow**: Buyers enter email on program landing page → POST /api/programs/purchase creates/reuses buyer account → clones trainer program with all workouts/exercises to buyer's workoutPrograms → creates purchase record with 20% platform fee and 80% trainer earnings → establishes trainer-client relationship in trainerClients table → redirects to home. **Sales Dashboard**: Real-time trainer dashboard displaying revenue tracking and client roster. RevenueOverview shows total earnings, MRR (monthly recurring revenue from subscriptions), ARR (annual recurring revenue), total sales, and active plans. ClientStats shows total clients, subscription vs one-time breakdown, and recurring revenue percentage. TrainerRosterTable displays client roster with name, email, program, purchase date, subscription type, price, and trainer earnings (80%), with search functionality. All dashboard components use react-query to fetch from GET /api/trainer/clients and GET /api/trainer/sales endpoints. Database schema includes: trainerCustomExercises, trainerPrograms, trainerProgramWorkouts, trainerProgramExercises, programPurchases, and trainerClients tables.

### Technical Implementations
The backend is an Express.js server developed with TypeScript, handling JSON requests/responses with CORS. It integrates with Vite for HMR and serves static files. Replit Auth (OpenID Connect) is used for authentication via Passport.js for session management. PostgreSQL is the primary database, accessed via Drizzle ORM. Performance optimizations include database-level query optimization, paginated API endpoints, combined home data endpoint, and optimized queries for recent sets and similar exercises. Data integrity is maintained through unique constraints and automatic duplicate session removal. Timezone-safe date handling uses YYYY-MM-DD strings for calendar dates, interpreting them in the user's local timezone, while completion timestamps are stored in UTC. The authentication flow guides users from marketing pages to login, then either to home for existing users or onboarding for new users. The database schema supports both legacy day-of-week and new date-based scheduling. Session update endpoints (POST and PATCH) explicitly exclude sessionType and workoutType from client payloads to prevent accidental overwrites. Cycle completion detection correctly handles rescheduled workouts. The "Repeat Same Days" flow presents a DayPicker dialog for selecting new workout dates for the next cycle.

**AI Conversational Program Generation**: The AI Training Assistant uses a conversational confirmation flow when generating programs. When a user asks to build a program, the system checks for existing profile settings (days/week, equipment, duration) and prompts for confirmation before regenerating. Users can click "Keep Settings" to proceed with existing settings or "Make Changes" to update their preferences. Fitness assessments are truly optional - the system may suggest them based on context but never blocks program generation. If recommended, a non-blocking informational toast appears while the program generates with conservative defaults.

**4-Week Microcycle System**: Each Focus Cycle (Flow, Build, Strong, Move) follows a 4-week progression: Week 1 (Learn - RPE 5-6), Week 2 (Load - RPE 7), Week 3 (Push - RPE 8-9), Week 4 (Deload - RPE 5-6). All training parameters (tempo, RPE, RIR, rest, sets/reps) are week-specific and defined in `shared/cycleConstants.ts`. Users start at Week 1 and automatically advance to the next week when completing their 7-day cycle. Week progression: 1→2→3→4→1. Role-aware programming preserves distinct volume prescriptions while sharing cycle/week-driven parameters. Power exercises maintain explosive tempo (1-0-X-0) but use cycle/week-specific rest periods.

### Feature Specifications
- **Data Model**: Includes Users, Fitness Assessments, Exercise Database, Workout Programs, and Performance Tracking. Workout sessions are pre-generated with `scheduledDate`, enforcing a one-session-per-day rule. User profile tracks `cycleNumber` and `totalWorkoutsCompleted` with `selectedDates` for the current cycle.
- **AI-Powered Prompt-Based Onboarding**: Onboarding supports natural language prompt-based input using OpenAI structured outputs to parse fitness goals, schedule, and equipment. Automatically recommends fitness assessments based on experience level.
- **Comprehensive Fitness Assessment System**: Onboarding supports Bodyweight Test, Weights Test, or skip option. Assessment data maps to 10 independent movement patterns. Collects `daysPerWeek`, comprehensive equipment selection, and session duration options. Users can retake tests anytime.
- **Template-Based Adaptive Training System**:
  - **Program Generation**: Algorithms select from prebuilt templates (Strength Primary, Cardio Primary, Hybrid Balance) to create custom 8-week programs based on user input.
  - **Science-Based Weekly Workout Structure**: Each workout day has a specific focus (squat, push, hinge, pull, athletic, unilateral) determining exercise selection.
  - **Focus-Specific Warmup Sequences**: Deterministic warmup circuits matched to workout focus.
  - **Workout-Focus-Based Power Selection**: Power movements match workout focus for CNS preparation.
  - **Anti-Movement Core Programming**: Core exercises selected based on anti-movement principles.
  - **Week-Level Program Planning**: Plans entire week's movement pattern distribution using a 3-tier priority system for exercise selection.
  - **Goal-Based Programming**: Implements mixed strength/hypertrophy training where exercise parameters are determined by exercise type and training goal, with experience level affecting total sets.
  - **Exercise-Type Based Rest Periods**: Rest intervals are determined purely by exercise type and training goal.
  - **CNS-Ordered Workout Progression**: Professional programming structure follows CNS demand hierarchy: warmup → power → compounds → isolations → core → cardio.
  - **Aggressive Superset Programming**: For shorter workouts, implements superset pairing of antagonistic movements for time efficiency.
  - **Percentage-Based Time Allocation System**: Uses an allocation matrix mapping nutrition goal × workout duration to component percentages.
  - **Time-Based Fallback System**: Ensures workouts always meet target duration by adding exercises when a strength duration gap is detected, prioritizing variety.
  - **Intelligent Workout Naming**: Generates descriptive workout names.
  - **Calendar-Aligned Session Generation**: Programs start on the user's current day, with sessions aligning with actual calendar dates.
  - **Smart Exercise Reuse Logic**: Implements hierarchical reuse rules to maximize workout variety while preventing fatigue.
  - **Progressive Overload**: Automatically adjusts exercise difficulty based on user performance.
  - **Intelligent Muscle Tracking System**: Prevents muscle overwork through dual-layer tracking.
  - **7-Day Cycle System**: Users select specific calendar dates for their workouts. Upon cycle completion, the system prompts for continuation or new program.
  - **Daily Calendar Workflow**: Home page displays today's workout, allows adding cardio or marking rest days, and previews tomorrow's session.
  - **Partial Workout System**: Workouts ended early save as `status='partial'` allowing same-day resuming. Displays progress and restores state.
  - **Automatic Missed Workout Rescheduling with Cascading**: Automatically detects missed workouts and moves them to today, shifting all future workouts forward.
  - **Flexible Exercise Swap System**: Allows swapping exercises with all available equipment types plus bodyweight options, with changes persisting to the database.
- **Calorie Tracking System**: Incorporates MET calculations for calorie expenditure.
- **Goal-Based Cardio Variety System**: Implements cardio type rotation based on nutrition goal.
- **HIIT Interval Training System**: Supports HIIT with automated timers and custom intervals.
- **Unified Program Settings**: Settings page combines nutrition goals and workout preferences, triggering program regeneration.
- **AI-Powered Prompt-Based Onboarding**: Replaces structured forms with natural language prompt-based onboarding using OpenAI structured outputs to parse fitness goals, schedule, and equipment. Automatically recommends fitness assessments based on experience level.

## External Dependencies

- **UI Libraries**: Radix UI primitives, Recharts, date-fns, cmdk, Lucide React.
- **Form & Validation**: React Hook Form, Zod, Drizzle-Zod.
- **External Services**: Neon serverless (PostgreSQL), OpenAI API.
- **Asset Management**: Stock images, Google Fonts (Inter, Roboto Mono).