# Morphit - Personal Fitness Program Application

## Overview
Morphit is a science-backed fitness application designed to generate personalized workout programs based on CNS-ordered programming principles. It supports 10 functional movement patterns with adaptive difficulty, offering various split and duration options. Key features include intelligent equipment-based exercise swapping, Zone 2 and HIIT cardio, fitness assessments for advanced movements, and a flexible 7-day cycle system with automatic missed workout rescheduling. The platform integrates AI-enhanced insights, including a prompt-based onboarding system for intuitive program generation, and supports a trainer marketplace for program creation and sales. Morphit aims to provide longevity-focused, adaptive training, guiding users through four core cycles: Flow, Build, Strong, and Move, to achieve their fitness goals through intelligent, progressive programming.

## User Preferences
- Preferred communication style: Simple, everyday language.
- Testing preference: Only use browser-based testing when absolutely necessary (UI/UX validation, multi-page workflows, JavaScript-dependent features). Prefer faster methods like API testing, database queries, log inspection, and LSP diagnostics for backend/schema changes.

## Recent Changes

### November 12, 2025 - User Support System & Settings Page
- **Comprehensive User Settings Page**: Created UserSettings page (route: /settings) with 5 tabs mirroring trainer settings structure:
  - **Profile**: Displays current Morphit cycle, 4-week microcycle phase, equipment list, weekly schedule with "Edit Training Preferences" button linking to /settings/program
  - **Subscription**: Free vs Premium tier comparison showing current tier, feature differences, upgrade CTA
  - **Support**: Request form using useForm + zodResolver with category dropdown (Technical Issue, Billing, Program Question, General Question), displays all past support requests with timestamps/statuses
  - **FAQ**: 6 collapsible questions explaining 4 Morphit cycles (Flow, Build, Strong, Move), 4-week microcycle progression (Learn, Load, Push, Deload), equipment swapping, cardio, streak tracking, and trainer connections
  - **Getting Started**: 4-step guide for new users (complete fitness assessment, set program preferences, start first workout, explore body metrics tracking)
- **Database Enhancements**: Added hasSeenWelcomePrompt field to users table for first-time user experience tracking
- **Support Request System for Users**: Extended support_requests table and API to support both users and trainers:
  - Added userId field (nullable), tier field (auto-populated from user's subscriptionTier for prioritization)
  - Storage methods: createUserSupportRequest (auto-tags tier), getUserSupportRequests
  - API endpoints: POST /api/support-requests, GET /api/support-requests
  - Validation using supportFormSchema with Zod enum matching backend (technical_issue, billing, program_question, general_question)
- **Routing Architecture**: Reorganized settings routes for clarity:
  - /settings → UserSettings (main user profile, subscription, support, FAQ)
  - /settings/program → Settings (training/program configuration, formerly at /settings)
  - Dashboard header includes Settings icon button for easy navigation
- **Architecture Quality**: All forms use useForm + zodResolver, no nested Cards, comprehensive data-testid attributes for testing

### November 12, 2025 - User Alert System & Motivational Quotes
- **Real-Time User Alert System**: Created comprehensive alert dashboard accessible from user Dashboard:
  - **Workout Streak**: Tracks consecutive days with completed workouts (green border, Flame icon)
  - **Trainer Notes**: Shows count of unread trainer notes for pre-session guidance and post-session reviews (blue border, MessageSquare icon)
  - **Program Status**: Displays active program status with days remaining, alerts when program ends soon (purple border, Target icon)
  - **Pending Invites**: Indicates number of pending trainer invitations awaiting response (blue border, UserPlus icon)
  - Backend: userAlerts storage method calculates workout streak, counts unread trainer notes, checks active program status, fetches pending invites
  - API endpoint: GET /api/user-alerts returns all alert data in single response
  - UI: Grid of 4 alert cards on Dashboard, each with icon, title, description, count badge, and "View" action button
- **Daily Motivational Quote System**: Implemented curated quote rotation using day-of-year modulo:
  - Created shared/motivationalQuotes.ts with 100+ fitness/longevity quotes (no emojis per user preference)
  - getDailyQuote() function uses deterministic day-of-year calculation for consistent daily rotation
  - Dashboard displays daily quote in gradient card with Sparkles icon
  - Quotes focus on consistency, progress, longevity, mental health benefits of fitness

### November 12, 2025 - Real-Time Trainer Alert System
- **Complete Mock Data Removal**: Eliminated all mock client data (deleted trainerMockData.ts, removed TrainerDataContext.tsx references from ExerciseEditorDrawer and WorkoutDetail)
- **Real Alert System**: Replaced mock totalAlerts banner with individual alert cards using live database queries
  - Backend storage methods: getInactiveClients (7+ days no workout), getPendingInvitesCounts, getWorkoutsMissingNotes
  - API endpoints: GET /api/trainer/alerts/summary (returns counts), GET /api/trainer/alerts/detail (returns affected client lists)
  - Alert cards: Inactive Clients (yellow), Pending Invites (blue) with real-time counts and "View" actions
- **Client Roster Filtering**: Enhanced TrainerRosterTable to support alert-based filtering
  - Accepts filterType prop ('inactive' | null) to filter and highlight affected clients
  - Shows active filter badge and "Clear" button for better UX
  - Auto-clears filter when switching tabs
  - Loading state while fetching filtered data
- **Hook Consolidation**: Replaced useMergedClientData with useTrainerClients hook that uses only real database queries via /api/trainer/clients
- **Navigation Flow**: Alert card "View" buttons set filter and switch to Clients tab, displaying highlighted rows for quick identification
- **Testing**: End-to-end tests confirm alert cards display correct counts, filtering works, navigation functions properly, and all mock data references removed

### November 12, 2025 - Trainer Dashboard Tab Consolidation
- **Simplified Navigation**: Consolidated trainer dashboard from 6 tabs down to 3 streamlined tabs:
  - **Clients** (previously "Client Roster"): Client roster table with active/inactive clients
  - **Client Experience**: Combined Revenue Overview, Client Stats, Client Invitations, and Discount Codes into single comprehensive view
  - **Library**: Combined Training Programs and Custom Exercises with inline management capabilities
- **Component Reusability**: Created TrainerProgramsGrid component extracting core program management logic (data fetching, publish/unpublish, delete, copy links) used by both TrainerDashboard Library tab and TrainerProgramsList page
- **Improved UX**: Maintained all functionality while reducing cognitive load - trainers can view revenue metrics, manage invitations, create discount codes, manage programs, and create custom exercises without tab-switching
- **Data-testid Updates**: Updated all tab identifiers to tab-clients, tab-client-experience, tab-library for test consistency
- **Pending Badge Migration**: Moved pending invites badge from old client-invitations tab to new Client Experience tab

### November 12, 2025 - Trainer Settings & Support System Complete
- **Trainer Settings Page**: Created comprehensive TrainerSettings page accessible from dashboard with 5 tabs:
  - Profile: Read-only trainer info (name, username, email, bio, specialties, years of experience)
  - Subscription: Shows Free/Premium status, client count limits (5 free, unlimited premium), upgrade button
  - Support: Request form with category dropdown (Technical Issue, Billing, Feature Request, General Question) and message field, displays all past support requests with timestamps and statuses
  - FAQ: 6 collapsible questions covering programs, clients, exercises, subscriptions, invites, billing
  - Getting Started: 4-step guide for new trainers (complete profile, create custom exercises, build first program, invite clients)
- **Database Tables Added**: Created support_requests and exercise_requests tables for trainer-developer communication
- **API Endpoints**: Implemented POST /api/trainer/support-requests and POST /api/trainer/exercise-requests for submitting requests
- **Custom Exercise Enhancement**: Added "Request to Add to Master DB" button in CustomExerciseLibrary allowing trainers to submit their custom exercises for inclusion in Morphit's master database with justification text
- **Dashboard Improvements**: Added Settings icon button to trainer dashboard header, removed non-existent totalUnreadMessages references from alert summary cards
- **Data Integrity**: Removed DELETE endpoint for trainer custom exercises to maintain program integrity (trainers can edit but not delete)

## System Architecture

### UI/UX Decisions
The frontend uses React 18 with TypeScript, Vite, Wouter for routing, and React Query for server state management. UI components are built with Shadcn/ui and Radix UI, styled with Tailwind CSS, featuring a custom Material Design-inspired theme with light/dark modes. Core user views include Home, Workout, History, Body Metrics, Settings, and Progress visualization. Marketing pages communicate the adaptive training approach and Morphit's 4 cycles. The system supports a comprehensive user settings page and a consolidated trainer dashboard for streamlined navigation.

### Technical Implementations
The backend is an Express.js server developed with TypeScript, handling JSON requests/responses with CORS. Authentication is managed via Replit Auth (OpenID Connect) using Passport.js. PostgreSQL serves as the primary database, accessed through Drizzle ORM. Performance is optimized with database-level query optimization and paginated API endpoints. Date handling uses YYYY-MM-DD strings for timezone safety, supporting both legacy day-of-week and date-based scheduling. AI Conversational Program Generation uses a confirmation flow, leveraging profile settings and offering optional fitness assessments. A 4-Week Microcycle System defines progression (Learn, Load, Push, Deload) within each Focus Cycle (Flow, Build, Strong, Move). A Workout Duration Calculator provides real-time estimates. A Movement Pattern Tracking System monitors 10 functional movement patterns.
For development, an authentication bypass injects a fake test user session when `NODE_ENV=development`. An idempotent seed script auto-runs in development mode, populating realistic trainer profiles, custom exercises, programs, clients, and invite links.

### Feature Specifications
- **Data Model**: Includes Users, Fitness Assessments, Exercise Database, Workout Programs, and Performance Tracking.
- **AI-Powered Onboarding**: Uses natural language prompts with OpenAI structured outputs to parse fitness goals, schedule, and equipment.
- **Fitness Assessment System**: Offers Bodyweight/Weights Tests, mapping data to 10 movement patterns.
- **Adaptive Training**: Algorithms select from prebuilt templates (Strength Primary, Cardio Primary, Hybrid Balance) for custom 8-week programs.
- **Science-Based Workout Structure**: Workouts have specific focuses (e.g., squat, push, hinge, pull) determining exercise selection and warmups.
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
- **Trainer Marketplace**: Allows trainers to create, publish, and sell programs, and manage clients with features like a 3-step onboarding wizard, freemium coach connection system (5 free client slots, premium for unlimited), soft-delete architecture for disconnections, username-based coach discovery, and a sales dashboard. Clients can connect with coaches via username search.
- **Trainer Workout Notes System**: Enables trainers to provide pre-session notes (visible before workout) and post-session reviews (visible in history). This is the exclusive method for trainer-client interaction.

## External Dependencies
- **UI Libraries**: Radix UI primitives, Recharts, date-fns, cmdk, Lucide React.
- **Form & Validation**: React Hook Form, Zod, Drizzle-Zod.
- **External Services**: Neon serverless (PostgreSQL), OpenAI API.
- **Asset Management**: Stock images, Google Fonts (Inter, Roboto Mono).