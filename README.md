<div align="center">

# ⚖️ JusticeAI

**AI-Powered Legal Assistance Platform for Indian Law**

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

*Empowering citizens with accessible legal guidance through AI*

</div>

---

## 🎯 What is JusticeAI?

JusticeAI is an AI-powered legal assistance platform focused on **Indian law**. It helps users understand their legal rights, analyze legal documents, and get actionable guidance — all in simple, plain language.

> ⚠️ **Disclaimer:** JusticeAI is an informational tool. It does not provide legal verdicts or replace professional legal advice. Always consult a qualified advocate for formal legal matters.

---

## ✨ Features

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
┌─────────────────────────────────────────────────────┐
│                    FastAPI Server                     │
├──────────┬──────────┬──────────┬──────────┬─────────┤
│  /chat   │ /upload  │ /analyze │  /docs   │ /events │
├──────────┴──────────┴──────────┴──────────┴─────────┤
│                   Service Layer                      │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐          │
│  │ RAG Chat │ │  Document  │ │ Analysis │          │
│  │ Service  │ │  Pipeline  │ │  Engine  │          │
│  └────┬─────┘ └─────┬──────┘ └────┬─────┘          │
│       │             │              │                 │
│  ┌────┴─────┐ ┌─────┴──────┐ ┌────┴─────┐          │
│  │  FAISS   │ │InLegalBERT │ │   Rule   │          │
│  │ + MiniLM │ │ Classifier │ │  Engine  │          │
│  └──────────┘ └────────────┘ └──────────┘          │
├─────────────────────────────────────────────────────┤
│  Groq LLM (LLaMA 3.3 70B)  │  Supabase (Postgres) │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- [Groq API Key](https://console.groq.com) (free tier available)
- [Supabase Project](https://supabase.com) (for document storage)
- Tesseract OCR (optional, for scanned PDFs/images)

### 1. Clone & Setup

```bash
git clone https://github.com/your-username/JusticeAI.git
cd JusticeAI/Backend
```

**Option A — PowerShell script:**
```powershell
.\setup.ps1
```

**Option B — Manual:**
```bash
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
```

### 2. Configure Environment

Copy and edit the `.env` file:
```env
GROQ_API_KEY=your_groq_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Run the Server

```bash
python main.py
```

The API will be available at `http://localhost:8000`  
Swagger docs at `http://localhost:8000/docs`

### 4. Run Tests

```bash
python test_api.py
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/chat/` | Legal chatbot (RAG) |
| `POST` | `/upload/` | Upload & process document |
| `POST` | `/analyze/` | Analyze case materials |
| `GET` | `/documents/` | List stored documents |
| `POST` | `/extract-events/` | Extract dates & events |

See [`sample_requests.json`](Backend/sample_requests.json) for detailed request/response examples.

---

## 📁 Project Structure

```
Backend/
├── main.py                     # FastAPI entry point
├── config.py                   # Centralized settings (.env)
├── requirements.txt            # Dependencies
├── setup.ps1                   # PowerShell setup script
├── test_api.py                 # Integration tests
├── sample_requests.json        # API documentation
├── routes/                     # API route handlers
│   ├── chat.py                 #   POST /chat
│   ├── upload.py               #   POST /upload
│   ├── analyze.py              #   POST /analyze
│   ├── documents.py            #   GET /documents
│   └── events.py               #   POST /extract-events
├── services/                   # Core business logic
│   ├── rag_service.py          #   RAG chat pipeline
│   ├── document_service.py     #   Document processing
│   ├── classification_service.py # InLegalBERT classifier
│   └── analysis_service.py     #   Rule engine + LLM analysis
├── models/
│   └── schemas.py              # Pydantic request/response models
├── database/
│   ├── supabase_client.py      # Supabase client (JWT validated)
│   ├── queries.py              # Insert/fetch operations
│   └── schema.sql              # PostgreSQL table definition
├── utils/
│   ├── llm.py                  # Shared Groq async client
│   ├── prompts.py              # All LLM prompt templates
│   ├── extraction.py           # PDF/Image/Text extraction
│   └── embeddings.py           # SentenceTransformer adapter
└── data/                       # Legal reference knowledge base
    ├── consumer_protection_act_2019.txt
    ├── ipc_bns_common_offences.txt
    ├── it_act_2000_cybercrime.txt
    ├── rent_tenancy_laws.txt
    └── civil_procedure_remedies.txt
```

---

## 🧠 Tech Stack

| Component | Technology |
|-----------|-----------|
| **Backend Framework** | FastAPI |
| **LLM** | Groq Cloud (LLaMA 3.3 70B Versatile) |
| **Legal Classifier** | InLegalBERT (law-ai/InLegalBERT) |
| **RAG Embeddings** | SentenceTransformers (all-MiniLM-L6-v2) |
| **Vector Store** | FAISS (persisted to disk) |
| **Document OCR** | PyMuPDF + Tesseract |
| **Database** | Supabase (PostgreSQL) |
| **Text Extraction** | PyMuPDF, Pillow, pytesseract |

---

## 📜 Legal Knowledge Base

The RAG chatbot draws from curated reference documents covering:

- **Consumer Protection Act, 2019** — Sections 2, 35, 36, 38, 39, 69; filing process; remedies
- **IPC / Bharatiya Nyaya Sanhita** — Sections 420, 406, 498A, 354, 302; FIR filing process
- **IT Act, 2000** — Sections 43, 65, 66, 66A-66E, 67; cyber crime reporting
- **Rent & Tenancy Laws** — Transfer of Property Act; Model Tenancy Act, 2021
- **Civil Procedure & Remedies** — Filing suits; court hierarchy; limitation periods; ADR; legal aid

---

## 👥 Team

Built for **Build With AI Hackathon**

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.