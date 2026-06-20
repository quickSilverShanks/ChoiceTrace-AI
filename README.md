# ChoiceTrace AI - Proactive Sustainability Coach

ChoiceTrace AI is a production-ready real-time carbon awareness and behavior change platform. Most sustainability tools focus on retrospective carbon accounting reports at the end of the month. ChoiceTrace AI operates under a different philosophy: **nudging users toward lower-carbon choices during everyday decision-making moments before they act.**

Designed as a modern full-stack web application, it combines Next.js, FastAPI, PostgreSQL, and Google Gemini AI, deployable on Google Cloud Platform.

---

## 🏗️ Architecture

```
                                  +-----------------------+
                                  |     User Browser      |
                                  +-----------+-----------+
                                              |
                                              | (HTTP/WebSockets)
                                              v
                                  +-----------+-----------+
                                  |   Next.js Frontend    |
                                  |  (React/Tailwind/TS)  |
                                  +-----------+-----------+
                                              |
                                              | (REST API)
                                              v
                                  +-----------+-----------+
                                  |    FastAPI Backend    |
                                  |     (Python/Uvicorn)  |
                                  +-----+-----------+-----+
                                        |           |
                               (SQL)    |           | (JSON Prompts)
                                        v           v
                          +-------------+---+   +---+-------------+
                          |   PostgreSQL    |   | Google Gemini / |
                          |    Database     |   | Fallback Engine |
                          +-----------------+   +-----------------+
```

### Key Technical Specs:
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion (Transitions) + Recharts (Interactive charts).
- **Backend**: FastAPI + SQLAlchemy ORM + Pydantic v2 validation.
- **AI Recommendation Engine**: Google GenAI SDK (model `gemini-1.5-flash`) with structured prompts. It implements a robust, rule-based local simulation fallback if the API key is not present.
- **Database**: PostgreSQL (SQLAlchemy models), automatically structured on backend boot.
- **Containers & Deployments**: Single-command orchestrator via Docker Compose, multi-stage lightweight Dockerfiles, and GCP Cloud Build pipelines deploying to Google Cloud Run and linking with Cloud SQL.

---

## 📁 Repository Directory Structure

```
ChoiceTrace-AI/
├── backend/
│   ├── app/
│   │   ├── routes/              # FastAPI Router endpoints
│   │   │   ├── auth.py          # User auth, persona/profile switching
│   │   │   ├── activities.py    # Decision feed logging & evaluation
│   │   │   ├── challenges.py    # Daily micro-actions complete endpoints
│   │   │   ├── coach.py         # Conversational Coach API
│   │   │   ├── dashboard.py     # Carbon dashboard, Recharts aggregates, Leaderboard
│   │   │   ├── roadmap.py       # 30-day checklist checklist tracking
│   │   │   └── simulator.py     # What-If simulator calculations
│   │   ├── ai.py                # Gemini integration & local mock recommendations
│   │   ├── config.py            # Environment configurations (Pydantic Settings)
│   │   ├── database.py          # SQLAlchemy PostgreSQL connection settings
│   │   ├── main.py              # FastAPI main entrypoint and cors handlers
│   │   ├── models.py            # SQLAlchemy database tables
│   │   └── schemas.py           # Pydantic schemas (validations)
│   ├── Dockerfile               # Multi-stage python image
│   └── requirements.txt         # Backend python libraries
│
├── frontend/
│   ├── app/                     # Next.js App Router views
│   │   ├── coach/               # AI chatbot interface
│   │   ├── dashboard/           # Gamification center (XP, badges, leaderboard)
│   │   ├── map/                 # Community eco-forest visual mapping
│   │   ├── roadmap/             # 30-day timeline checkoff sheets
│   │   ├── simulator/           # Sliders & timeline carbon charts
│   │   ├── globals.css          # Styling layout variables
│   │   ├── layout.tsx           # Global sidebar navigation & Profile Simulator
│   │   └── page.tsx             # Primary Decision Feed (What are you about to do?)
│   ├── components/              # Utility React widgets
│   ├── Dockerfile               # Node builder/runner stages
│   ├── next.config.js           # Next configuration
│   ├── package.json             # NPM dependencies
│   ├── postcss.config.js        # Postcss styling compiler config
│   └── tailwind.config.js       # Core color palette & branding setup
│
├── deploy/
│   ├── cloudbuild.yaml          # GCP Cloud Build compilation settings
│   └── setup_gcp.sh             # Bash infrastructure setup script
│
├── docker-compose.yml           # Core local container orchestration launcher
├── LICENSE
└── README.md                    # Master guide document
```

---

## 🕹️ Product User Guide

### 1. Simulated Profile Switching
In the sidebar, locate the **Profile Simulator** panel. ChoiceTrace AI allows switching user personas dynamically. Select from:
* 🎓 **Student**: Offers budget-centric, low-cost plant-based choices and commuter advice.
* 👔 **Working Professional**: Focuses on convenience, smart electricity tips, and premium refurbished switches.
* 🚇 **Urban Commuter**: Emphasizes multi-modal transit options (bikes, e-scooters, rails).
* 🏡 **Family**: Targets bulk grocery buying, AC adjustments, and family sizing calculations.
* 🌿 **Enthusiast**: Focuses on advanced composting, eco-friendly shopping, and energy offsets.

*When you change the profile, the active daily challenges and 30-day roadmaps automatically regenerate to match the chosen persona's habits.*

### 2. Evaluative Decision Feed (Primary Screen)
Under **"What are you about to do?"**, click any category card (e.g. *Commute*, *Order Food*, *Home Energy*):
1. Select one of the pre-filled recommendation templates (e.g., "Drive 10km to office" or "Order beef burger").
2. Click **Evaluate Impact**.
3. Inspect the comparison dashboard: Review your planned carbon footprint, the recommended alternative, difficulty rating, cost savings, and scientific reasoning.
4. Click **Accept Green Nudge** to mark that you followed the alternative. The top-bar will update with your added XP, streaks, and trees saved.
5. Below the cards, review the chronological timeline showing recommendations pushed to you throughout the day.

### 3. Conversational AI Sustainability Coach
Navigate to **AI Coach**:
* Use the prompt inputs or click standard topics (e.g. *"Should I drive or take public transport?"*).
* The coach will generate a conversational reply and render a dedicated widget showing:
  - **Carbon Footprint Impact**
  - **Scientific Reasoning**
  - **Better Alternatives**
  - **Potential Monthly/Annual Savings**

### 4. Interactive Gamified Dashboard
Navigate to **Dashboard**:
* **Daily Micro-actions**: View checklist items that take less than 15 minutes (e.g., "Unplug phantom loads"). Click the lightning bolt icon to check them off and gain XP.
* **Weekly Missions**: Monitor progress bars for weekly goals.
* **Analytics**: Look at the Recharts-based bar chart showcasing your carbon reductions grouped by category.
* **Trophies & Badges**: View achievements (e.g., *7 Day Green Streak*, *Public Transport Champion*, *Forest Guardian*).
* **Community Rankings**: Compare your eco-score against simulated peer users.

### 5. What-If Simulator Workspace
Navigate to **What-If Simulator**:
* Drag sliders to represent how many times per week you plan to do sustainable actions (e.g., Cycle to work twice, Replace 3 beef meals).
* The dashboard cards will dynamically scale to show projected **Annual Carbon Saved**, **Annual Cost Saved**, and **Sustainability Score boost**.
* Enter a title (e.g. *"My Summer Plan"*) and click **Save Scenario** to store it.

### 6. 30-Day Roadmap Checklist
Navigate to **Roadmap**:
* Check off the daily sustainability roadmap items step-by-step.
* Each checklist item includes category indicators, difficulty, carbon savings, and awards 75 XP.

### 7. Community Eco-Forest Map
Navigate to **Community Achievements**:
* Review collective community savings (e.g. 452,000+ kg CO₂ prevented, 20,000+ trees planted).
* Hover or click on coordinate plots in the **Eco-Forest Grid** to see which community user planted each tree and their annual carbon absorption value.

---

## 🛠️ Local Installation & Verification Guide (via Docker Compose)

The easiest and recommended way to run ChoiceTrace AI locally on your personal laptop is using **Docker Compose**. This spins up the Next.js frontend, FastAPI backend, and PostgreSQL database automatically in a fully containerized environment.

### 📋 Prerequisites
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) on your laptop.
- (Optional) A Google Gemini API Key.

---

### Step 1: Set Up Environment Variables
1. In the root directory of the project, create a copy of the `.env.example` file and name it `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open the `.env` file and insert your Gemini API Key:
   ```env
   GEMINI_API_KEY=your-actual-api-key-here
   ```
   *If you do not have an API key, you can leave it blank. ChoiceTrace AI will run using a local high-fidelity AI recommendation simulator.*

---

### Step 2: Spin Up the Containers
From the project root directory, run the following command to build and launch all services:
```bash
# Build and run the containers in the foreground
docker compose up --build
```
*Note: If you want to run it in the background, append the `-d` flag (i.e. `docker compose up --build -d`).*

This command automatically pulls the official Postgres image, builds the Next.js frontend and FastAPI backend containers, connects them to a private virtual network, and exposes them to your host laptop.

---

### Step 3: Verify the Running Services

1. **Verify the Next.js Frontend**:
   - Open your browser and navigate to `http://localhost:3000`.
   - The application will automatically load and log in as `demo_user` (credentials seeded automatically on backend boot). You will see the main Decision Feed and AI coach interface.

2. **Verify the FastAPI Backend API & Documentation**:
   - Open your browser and navigate to `http://localhost:8080/api/docs`.
   - This opens the interactive **Swagger OpenAPI UI** showing all endpoints, where you can inspect and test the API directly.

3. **Verify the PostgreSQL Database**:
   - The database is fully initialized inside the Docker network, and any modifications you make inside the app (e.g. accepting a nudge, logging a commute, adding a what-if scenario) are persisted to the container's volume.

---

### Step 4: Stopping the Containers
To stop and clean up the local containers, run:
```bash
docker compose down
```

---

### 💻 Alternative: Running Without Docker (Manual Local Setup)
If you prefer to run the services directly on your laptop without Docker:

#### 1. Backend Setup (FastAPI)
Open a terminal in the `./backend` directory:
```bash
# Create python virtual environment
python -m venv venv
source venv/Scripts/activate  # On Windows (Use source venv/bin/activate on macOS/Linux)

# Install dependencies
pip install -r requirements.txt

# Run server (runs on port 8080 by default)
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```
*Verification*: Open `http://localhost:8080/api/docs` in your browser.

#### 2. Frontend Setup (Next.js)
Open another terminal in the `./frontend` directory:
```bash
# Install dependencies
npm install

# Start Next.js development server (runs on port 3000)
npm run dev
```
*Verification*: Open `http://localhost:3000` in your browser.

---

## 🚀 GCP Deployment Guide (via Google Cloud Shell)

Deploying ChoiceTrace AI to Google Cloud Platform is fully automated and designed to run directly from **Google Cloud Shell**. Follow this step-by-step guide to get your production-ready application live on GCP.

### 📋 Prerequisites
- A Google Cloud Platform (GCP) account.
- A GCP Project with billing enabled.
- A Google Gemini API Key (optional, the application automatically falls back to local AI simulation if not provided).

---

### Step 1: Open Google Cloud Shell
1. Go to the [Google Cloud Console](https://console.cloud.google.com).
2. Select your GCP project from the project dropdown menu at the top.
3. Click the **Activate Cloud Shell** button (🐚 icon) in the top-right toolbar. This spins up a free virtual machine pre-configured with `gcloud`, `git`, `docker`, and other tools.

---

### Step 2: Clone & Navigate to the Repository
In your Cloud Shell terminal, clone the repository and navigate into the project directory:
```bash
# Clone the repository
git clone <YOUR_REPOSITORY_URL>

# Change directory
cd ChoiceTrace-AI
```

---

### Step 3: Configure GCP Project
Ensure Cloud Shell is pointing to your active GCP Project ID:
```bash
# Set your active project
gcloud config set project YOUR_PROJECT_ID

# Verify the setting
gcloud config get-value project
```

---

### Step 4: Run the Infrastructure Provisioning Script
Run the pre-configured environment setup script. This script automatically enables the required GCP APIs (Cloud Run, Cloud SQL, Secret Manager, Artifact Registry, Cloud Build), provisions the Artifact Registry repository, creates the Cloud SQL instance, sets up Secrets, and configures permissions.

```bash
# Make the script executable
chmod +x deploy/setup_gcp.sh

# Execute the setup script
./deploy/setup_gcp.sh
```

During execution, the script will prompt you for:
1. **Gemini API Key**: Paste your key to enable live Gemini AI recommendations. If you press **Enter** without typing, it will set a placeholder and fall back to local AI simulation.
2. **PostgreSQL Root Password**: Enter a secure password for the database `postgres` user. If you press **Enter**, it will use the default `SuperSecretDBPassword123!`.

> [!NOTE]
> Creating the Cloud SQL PostgreSQL database instance can take between **5 to 10 minutes**. Do not interrupt the shell session.

---

### Step 5: Build and Deploy using Google Cloud Build
Trigger Google Cloud Build to compile the Docker containers for the frontend and backend, push them to your GCP Artifact Registry repository, and deploy them to Cloud Run.

```bash
gcloud builds submit --config=deploy/cloudbuild.yaml --substitutions=_REGION=us-central1,_REPOSITORY=choicetrace-repo
```

This pipeline automatically handles deployment dependencies:
1. Builds the **FastAPI Backend** and pushes it to Artifact Registry.
2. Builds the **Next.js Frontend** and pushes it to Artifact Registry.
3. Deploys the Backend to **Google Cloud Run** and connects it to the Cloud SQL database and Secret Manager.
4. Dynamically retrieves the Backend's live URL and deploys the Frontend to **Google Cloud Run**, configuring the Next.js runtime environment variable `BACKEND_API_URL` to route requests automatically.

---

### Step 6: Access the Live Application
When the build finishes, it will print the URLs of both deployed services.
1. Look for the URL printed under the deployment of the frontend service `choicetrace-frontend` (e.g., `https://choicetrace-frontend-xxxxxx-uc.a.run.app`).
2. Click the link to open the ChoiceTrace AI web app in your browser!
3. Login using the default credentials seeded during backend startup:
   - **Username**: `demo_user`
   - **Password**: `password123`

---

### 🧹 Cleaning Up GCP Resources (To Avoid Charges)
If you wish to tear down the application and prevent ongoing GCP database or computing charges, run the following commands in Cloud Shell:

```bash
# Delete Cloud Run services
gcloud run services delete choicetrace-frontend --region=us-central1 --quiet
gcloud run services delete choicetrace-backend --region=us-central1 --quiet

# Delete Cloud SQL Database Instance (Permanent deletion of data)
gcloud sql instances delete choicetrace-db --quiet

# Delete stored secrets from Secret Manager
gcloud secrets delete GEMINI_API_KEY --quiet
gcloud secrets delete DATABASE_URL --quiet

# Delete Artifact Registry docker images
gcloud artifacts repositories delete choicetrace-repo --location=us-central1 --quiet
```
