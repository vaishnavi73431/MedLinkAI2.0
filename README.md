# MedLinkAI🌱
> **Tagline**: Build Habits, Grow Your World.

## 1. The Problem
Building healthy habits is hard.
- **Inconsistency**: Most people start strong but quit within 2 weeks.
- **Delayed Gratification**: Health benefits (weight loss, better sleep) take months to show, making daily effort feel unrewarding.
- **Loneliness**: Self-improvement often feels like a solitary grind.

## 2. The Solution: Gamified "Twin-World"
MedLinkAIdiffers by mirroring your internal state into an external, visual world.
- **Visual Feedback**: You don't just "log" water; you water your digital garden. If you neglect your health, your garden withers.
- **Immediate Companionship**: "Sprout" (your AI companion) and other NPCs (Dr. Triage, Coach Flex) provide instant social feedback.
- **Progression**: Unlocking new zones (Gym, Restaurant, Camping) gives a tangible sense of "leveling up" in life.

## 3. The Psychology (The "Why It Works")
We leverage core behavioral psychology principles:
- **Operant Conditioning**: Immediate rewards (Coins, XP, Visual Growth) reinforce the behavior of completing boring tasks.
- **Startle Effect & Pattern Interrupt**: The "Zen Garden Breathing" task uses camera verification to force a physical state change, breaking stress loops.
- **Loss Aversion**: Users return to prevent their garden from decaying (extrinsic motivation that builds intrinsic habits).
- **Social Proof**: The "Global Feed" shows others succeeding, normalizing healthy behavior.

## 4. Clinically-Backed Tasks
Our tasks aren't random; they align with proven health markers:
- **"Zen Garden Breathing"**: Based on **Pranayama** and **Box Breathing** techniques reducing cortisol (stress hormone).
- **"Hydration Hero"**: Targets the baseline 2-3L daily water intake recommended for cognitive function.
- **"Sleep Hygiene"**: The task focuses on *consistency* of sleep windows, which studies show is more critical than just duration for circadian rhythm alignment.
- **"Gratitude Reflection"**: Based on positive psychology research (e.g., Seligman) linking daily gratitude logging to reduced depression scores.

## 5. Technology Stack
Built for performance, scalability, and aesthetic delight:
- **Frontend**: **React 18** with **TypeScript** for robust, type-safe logic.
- **Build Tool**: **Vite** for lightning-fast HMR and optimized production bundles.
- **Styling**: **Tailwind CSS** for rapid, responsive, and modern UI design.
- **Rendering**: Custom **HTML5 Canvas** engine (`PixelGarden.tsx`) for high-performance 2D rendering of the game world without heavy game engine overhead.
- **Backend**: **Supabase** (PostgreSQL + Authentication + pgvector for RAG Storage)
- **AI Core (Hybrid Architecture)**: **Google Gemini 2.5 Flash** integration featuring:
    - **Dynamic NPC Conversations**: Persona-driven bots (Doctor, Nutritionist, Trainer).
    - **Retrieval-Augmented Generation (RAG)**: Uses `gemini-embedding-001` and Supabase vector search to inject factual medical, gym, and nutrition knowledge into bot responses, significantly reducing hallucinations.
    - **Function Calling & Tool Use**: Real-time web search integration (Tavily API) to provide up-to-date health facts and guidelines when needed.
    - **Fine-Tuned Models**: Specialized fine-tuned logic integrated for the Nutrition Bot to analyze user diets and verify meal photos with high precision.
    - **Computer Vision Verification**: Analyzing user photos to verify meditation/breathing tasks.
- **Deployment**: Vercel (web) / Expo (mobile-ready)

## 6. Business Model (Monetization)
How we turn health into revenue:
1.  **Freemium Model**:
    -   Free: Basic garden, limited daily tasks.
    -   **Premium ($9.99/mo)**: Unlocks "Seva Hub", "Camping Grounds", and advanced AI coaching.
2.  **In-App Purchases (Microtransactions)**:
    -   Speed-ups for garden growth.
    -   Exclusive furniture/skins for the homestead (Cosmetic-only, non-pay-to-win).
3.  **Affiliate Partnerships**:
    -   The "Trainer" and "Dietician" boards link to real-world experts (e.g., Cult.fit, HealthifyMe). We earn a commission for every user who books a consultation through our "Find a Pro" feature.
4.  **Health Data Insights (B2B)**:
    -   Aggregated, anonymized data on habit formation trends sold to health research institutes or insurers (with user consent).

---

## 🚀 Run Locally

### Prerequisites
- Node.js (v18+)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/vaishnavi73431/MedLinkAI2.0.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file in the root directory and add your Gemini API key and Supabase credentials:
   ```env
   VITE_OPENAI_API_KEY=your_gemini_api_key_here
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   OPENAI_API_KEY=your_gemini_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
# MedLinkAI2.0
