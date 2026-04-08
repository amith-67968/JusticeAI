<div align="center">

# ⚖️ JusticeAI

**AI-Powered Legal Assistance Platform for Indian Law**

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

*Empowering citizens with accessible legal guidance through AI*

</div>

---

## 🎯 What is JusticeAI?

JusticeAI is a **full-stack AI-powered legal assistance platform** focused on **Indian law**. It helps users understand their legal rights, analyze legal documents, classify cases, and get actionable guidance — all in simple, plain language through a modern, animated web interface.

> ⚠️ **Disclaimer:** JusticeAI is an informational tool. It does not provide legal verdicts or replace professional legal advice. Always consult a qualified advocate for formal legal matters.

---

## ✨ Features

### 🖥️ Modern Web Interface
- Cinematic landing page with hero video and glassmorphism effects
- Animated page transitions powered by Framer Motion
- Responsive dashboard with guided workflow navigation
- Dark-themed, premium UI built with React 19 and Tailwind CSS 4

### 🔐 Authentication
- Client-side auth with sign-up, login, and session persistence
- Protected & guest routes for seamless user flow
- "Sign in with Google" integration ready

### 💬 Legal Chatbot (RAG-Powered)
- Ask legal questions in plain language
- Get answers citing specific Indian law sections
- Powered by Retrieval-Augmented Generation with a curated legal knowledge base
- Covers: Consumer Protection, IPC/BNS, IT Act, Tenancy Law, Civil Procedure

### 📄 Document Intelligence
- Upload legal documents (PDF, images, or text)
- Automated text extraction (OCR for scanned documents)
- LLM-powered structured extraction — parties, dates, monetary values, clauses, missing elements
- Evidence strength assessment

### 🏷️ InLegalBERT Case Classification
- Classifies documents into 5 categories using a legal-domain BERT model:
  - Consumer Dispute · Civil Dispute · Criminal · Cyber Crime · Others
- Encoder-based cosine similarity with keyword boosting
- Non-legal document rejection via multi-signal heuristic

### 📊 Case Analysis Engine
- **Rule Engine** — deterministic checks for missing signatures, stamps, witnesses, payment proof, FIR filing, court orders
- **LLM Analysis** — AI-generated case strength, difficulty, confidence score, strong/weak points, and next steps
- Combined rule + LLM scoring with clamped adjustments

### 📅 Event Timeline Extraction
- Extracts dates and events from legal text
- LLM-first approach with regex fallback

### 🗄️ Document Storage
- Stores processed documents in Supabase (PostgreSQL)
- JWT-validated service-role authentication
- Paginated retrieval

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     React + Vite Frontend                        │
│  ┌─────────┐ ┌───────────┐ ┌──────────┐ ┌───────┐ ┌─────────┐  │
│  │ Landing │ │ Dashboard │ │ Analyzer │ │ Chat  │ │  Docs   │  │
│  │  Page   │ │   Page    │ │   Page   │ │ Page  │ │  Page   │  │
│  └─────────┘ └───────────┘ └──────────┘ └───────┘ └─────────┘  │
│  ┌──────────────────┐  ┌─────────────────────────────────────┐  │
│  │  Auth Context     │  │  API Client (lib/api.js)            │  │
│  │  (localStorage)   │  │  → fetch() to FastAPI backend       │  │
│  └──────────────────┘  └─────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│                        HTTP / REST API                           │
├──────────────────────────────────────────────────────────────────┤
│                      FastAPI Backend                             │
│  ┌──────────┬──────────┬──────────┬──────────┬─────────┐        │
│  │  /chat   │ /upload  │ /analyze │  /docs   │ /events │        │
│  ├──────────┴──────────┴──────────┴──────────┴─────────┤        │
│  │                    Service Layer                     │        │
│  │  ┌──────────┐ ┌────────────┐ ┌──────────┐           │        │
│  │  │ RAG Chat │ │  Document  │ │ Analysis │           │        │
│  │  │ Service  │ │  Pipeline  │ │  Engine  │           │        │
│  │  └────┬─────┘ └─────┬──────┘ └────┬─────┘           │        │
│  │       │             │              │                  │        │
│  │  ┌────┴─────┐ ┌─────┴──────┐ ┌────┴─────┐           │        │
│  │  │  FAISS   │ │InLegalBERT │ │   Rule   │           │        │
│  │  │ + MiniLM │ │ Classifier │ │  Engine  │           │        │
│  │  └──────────┘ └────────────┘ └──────────┘           │        │
│  ├──────────────────────────────────────────────────────┤        │
│  │  Groq LLM (LLaMA 3.3 70B)  │  Supabase (Postgres)  │        │
│  └──────────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.12+** — backend runtime
- **Node.js 18+** and **npm** — frontend tooling
- [Groq API Key](https://console.groq.com) (free tier available)
- [Supabase Project](https://supabase.com) (recommended for production document storage)
- Tesseract OCR *(optional, for scanned PDFs/images)*

---

### 1. Clone the Repository

```bash
git clone https://github.com/amith-67968/JusticeAI.git
cd JusticeAI
```

---

### 2. Backend Setup

```bash
cd Backend
```

**Option A — PowerShell script:**

```powershell
.\setup.ps1
```

**Option B — Manual:**

```bash
python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate  # macOS / Linux
pip install -r requirements.txt
```

**Configure environment** — create `Backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
GOOGLE_PLACES_API_KEY=
DEBUG=true
```

**Start the server:**

```bash
python main.py
```

The API will be available at `http://localhost:8000`
Swagger docs at `http://localhost:8000/docs`
Health check at `http://localhost:8000/health`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

**Configure environment** — create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

**Start the dev server:**

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

---

### 4. Run Tests

```bash
cd Backend
python test_api.py
```

---

## Deployment

### Frontend on Vercel

This repo includes `frontend/vercel.json` so React Router routes work correctly on refresh in production.

1. Import the repository into Vercel.
2. Set the **Root Directory** to `frontend`.
3. Use the Vite defaults:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add the environment variable `VITE_API_BASE_URL=https://your-render-service.onrender.com`.
5. Deploy the frontend.

### Backend on Render

This repo includes `render.yaml` and `Backend/.python-version` for Render deployment.

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. In Render, create a new **Blueprint** or **Web Service** from the repo.
3. Use these backend settings:
   - Root Directory: `Backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Health Check Path: `/health`
4. Add these Render environment variables:
   - `GROQ_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_PLACES_API_KEY` *(optional)*
5. Deploy and verify `https://your-render-service.onrender.com/health`.

Important: the backend can fall back to local storage when Supabase is missing, but that fallback is not suitable for long-term production storage on Render. Use Supabase in production.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/chat/` | Legal chatbot (RAG) |
| `POST` | `/upload/` | Upload & process document |
| `POST` | `/analyze/` | Analyze case materials |
| `GET` | `/documents/` | List stored documents |
| `GET` | `/documents/{id}/preview` | Generate preview URL |
| `GET` | `/documents/{id}/download` | Generate download URL |
| `DELETE` | `/documents/{id}` | Delete a stored document |
| `POST` | `/lawyers/recommend` | Recommend nearby lawyers |
| `POST` | `/extract-events/` | Extract dates & events |

See [`sample_requests.json`](Backend/sample_requests.json) for detailed request/response examples.

---

## 📁 Project Structure

```
JusticeAI/
├── Backend/                         # FastAPI server
│   ├── main.py                      #   Entry point + lifespan hooks
│   ├── config.py                    #   Centralized settings (.env)
│   ├── requirements.txt             #   Python dependencies
│   ├── setup.ps1                    #   PowerShell setup script
│   ├── test_api.py                  #   Integration tests
│   ├── sample_requests.json         #   API documentation
│   ├── routes/                      #   API route handlers
│   │   ├── chat.py                  #     POST /chat
│   │   ├── upload.py                #     POST /upload
│   │   ├── analyze.py               #     POST /analyze
│   │   ├── documents.py             #     GET  /documents
│   │   └── events.py                #     POST /extract-events
│   ├── services/                    #   Core business logic
│   │   ├── rag_service.py           #     RAG chat pipeline
│   │   ├── document_service.py      #     Document processing
│   │   ├── classification_service.py#     InLegalBERT classifier
│   │   └── analysis_service.py      #     Rule engine + LLM analysis
│   ├── models/
│   │   └── schemas.py               #   Pydantic request/response models
│   ├── database/
│   │   ├── supabase_client.py       #   Supabase client (JWT validated)
│   │   ├── queries.py               #   Insert/fetch operations
│   │   └── schema.sql               #   PostgreSQL table definition
│   ├── utils/
│   │   ├── llm.py                   #   Shared Groq async client
│   │   ├── prompts.py               #   All LLM prompt templates
│   │   ├── extraction.py            #   PDF/Image/Text extraction
│   │   └── embeddings.py            #   SentenceTransformer adapter
│   └── data/                        #   Legal reference knowledge base
│       ├── consumer_protection_act_2019.txt
│       ├── ipc_bns_common_offences.txt
│       ├── it_act_2000_cybercrime.txt
│       ├── rent_tenancy_laws.txt
│       └── civil_procedure_remedies.txt
│
├── frontend/                        # React + Vite SPA
│   ├── index.html                   #   App shell
│   ├── package.json                 #   Dependencies & scripts
│   ├── vite.config.js               #   Vite configuration
│   ├── tailwind.config.js           #   Tailwind CSS v4 config
│   ├── public/
│   │   ├── favicon.svg              #   App favicon
│   │   └── video/                   #   Hero video assets
│   └── src/
│       ├── main.jsx                 #   React entry point
│       ├── App.jsx                  #   Routing & providers
│       ├── index.css                #   Global styles
│       ├── context/
│       │   └── AuthContext.jsx      #   Auth state (localStorage)
│       ├── lib/
│       │   └── api.js               #   Backend API client
│       ├── pages/
│       │   ├── LandingPage.jsx      #   Cinematic hero landing
│       │   ├── Login.jsx            #   Login form
│       │   ├── Signup.jsx           #   Registration form
│       │   ├── DashboardPage.jsx    #   Main dashboard
│       │   ├── CaseAnalyzerPage.jsx #   Case analysis workflow
│       │   ├── ChatPage.jsx         #   RAG chatbot interface
│       │   └── DocumentsPage.jsx    #   Document management
│       └── components/
│           ├── Navbar.jsx           #   Navigation bar
│           ├── ProtectedRoute.jsx   #   Auth-gated wrapper
│           ├── GuestRoute.jsx       #   Guest-only wrapper
│           ├── ChatMessage.jsx      #   Chat bubble component
│           ├── FileUpload.jsx       #   Drag-and-drop uploader
│           ├── DocumentCard.jsx     #   Document preview card
│           └── AuthModal.jsx        #   Auth dialog
│
├── .gitignore
└── LICENSE                          # MIT License
```

---

Deployment-specific files in this repo:

- `render.yaml`
- `Backend/.python-version`
- `frontend/vercel.json`

## 🧠 Tech Stack

### Backend

| Component | Technology |
|-----------|------------|
| **Framework** | FastAPI |
| **LLM** | Groq Cloud (LLaMA 3.3 70B Versatile) |
| **Legal Classifier** | InLegalBERT (law-ai/InLegalBERT) |
| **RAG Embeddings** | SentenceTransformers (all-MiniLM-L6-v2) |
| **Vector Store** | FAISS (persisted to disk) |
| **Document OCR** | PyMuPDF + Tesseract |
| **Database** | Supabase (PostgreSQL) |

### Frontend

| Component | Technology |
|-----------|------------|
| **Framework** | React 19 |
| **Build Tool** | Vite 8 |
| **Styling** | Tailwind CSS 4 |
| **Animations** | Framer Motion |
| **Routing** | React Router 7 |
| **Icons** | Lucide React |

---

## 📜 Legal Knowledge Base

The RAG chatbot draws from curated reference documents covering:

- **Consumer Protection Act, 2019** — Sections 2, 35, 36, 38, 39, 69; filing process; remedies
- **IPC / Bharatiya Nyaya Sanhita** — Sections 420, 406, 498A, 354, 302; FIR filing process
- **IT Act, 2000** — Sections 43, 65, 66, 66A-66E, 67; cyber crime reporting
- **Rent & Tenancy Laws** — Transfer of Property Act; Model Tenancy Act, 2021
- **Civil Procedure & Remedies** — Filing suits; court hierarchy; limitation periods; ADR; legal aid

---

## 🖼️ Screenshots

<!-- Add screenshots of the app here -->
<!-- ![Landing Page](docs/screenshots/landing.png) -->
<!-- ![Dashboard](docs/screenshots/dashboard.png) -->
<!-- ![Chat](docs/screenshots/chat.png) -->

*Coming soon*

---

## 👥 Team

Built for **Build With AI Hackathon**

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
