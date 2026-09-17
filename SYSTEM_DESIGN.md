# 🏗️ PrepForge OS — Complete System Design & Architecture Blueprint

An end-to-end technical system design document detailing how **PrepForge OS** operates, executes code, aggregates real-time contest data, synchronizes user developer profiles, and deploys on a serverless zero-cost infrastructure.

---

## 📑 Table of Contents
1. [High-Level Architecture](#1-high-level-architecture)
2. [Network & Edge Topology](#2-network--edge-topology)
3. [Component Deep Dives](#3-component-deep-dives)
   - [A. Next.js 16 Web Core](#a-nextjs-16-web-core)
   - [B. Multi-Platform Contest Aggregator](#b-multi-platform-contest-aggregator)
   - [C. Code Execution Sandbox Engine](#c-code-execution-sandbox-engine)
   - [D. Supabase Auth & Progress Ledger](#d-supabase-auth--progress-ledger)
4. [Request Lifecycle & Execution Flowcharts](#4-request-lifecycle--execution-flowcharts)
5. [Data Models & Schema](#5-data-models--schema)
6. [Deployment Topology & Cloud Infrastructure](#6-deployment-topology--cloud-infrastructure)
7. [Zero-Cost Guardrails & Capacity Planning](#7-zero-cost-guardrails--capacity-planning)

---

## 1. High-Level Architecture

PrepForge OS is designed as a **decoupled, serverless microservice system** optimized for developer experience, sub-second code verification, and zero maintenance overhead.

```mermaid
flowchart TB
    subgraph ClientLayer["1. Client Layer (Browser)"]
        Browser["👤 Developer Workspace<br/>(React 19 / Monaco Editor / KaTeX / Tailwind v4)"]
    end

    subgraph EdgeLayer["2. Global Edge CDN Layer (Cloudflare)"]
        CF_Worker["🛡️ Cloudflare Worker (*.workers.dev)<br/>• Edge Reverse Proxy<br/>• Unlimited Free Egress<br/>• Static Asset Cache (/_next/static/*)"]
        CF_Cache[("💾 Cloudflare Edge Cache<br/>(30-Day TTL / Hash Invalidation)")]
        CF_Worker <--> CF_Cache
    end

    subgraph CloudRunLayer["3. Serverless Compute Layer (Google Cloud Run / us-central1)"]
        subgraph WebService["prepforge-web (Next.js Standalone Container ~65MB)"]
            SSR["Server Components & SSR Engine"]
            APIs["API Route Handlers (/api/execute, /api/contests)"]
            AuthMiddleware["Auth & Session Middleware"]
        end

        subgraph RunnerService["prepforge-runner (Alpine Linux Sandbox ~100MB)"]
            SandboxAPI["Express Runner Daemon (:2000)"]
            PyEnv["🐍 Python 3 Runtime"]
            CppEnv["⚡ GCC / g++ 17 Compiler"]
            NodeEnv["🟢 Node.js 20 Engine"]
            SubprocessMgr["Security Sandbox & Subprocess Jail"]
        end
    end

    subgraph PersistenceLayer["4. Data & External Integration Layer"]
        SupabaseDB[("🗄️ Supabase Postgres<br/>• Profiles, Quests, XP<br/>• Row-Level Security")]
        CF_API["📡 Codeforces API"]
        LC_API["📡 LeetCode GraphQL"]
        CC_API["📡 CodeChef API"]
    end

    Browser <-->|"HTTPS / WSS"| CF_Worker
    CF_Worker -->|"Cache MISS / Dynamic SSR"| WebService
    APIs -->|"Internal Intra-Region HTTP"| SandboxAPI
    SandboxAPI --> SubprocessMgr
    SubprocessMgr --> PyEnv
    SubprocessMgr --> CppEnv
    SubprocessMgr --> NodeEnv

    WebService <-->|"Connection Pool"| SupabaseDB
    APIs -->|"Revalidated Fetch"| CF_API
    APIs -->|"Revalidated Fetch"| LC_API
    APIs -->|"Revalidated Fetch"| CC_API
```

---

## 2. Network & Edge Topology

The network layer protects origin compute instances from traffic spikes and egress bandwidth exhaustion.

```mermaid
sequenceDiagram
    autonumber
    actor User as Developer Browser
    participant CF as Cloudflare Worker Edge
    participant CR_Web as Cloud Run (prepforge-web)
    participant CR_Run as Cloud Run (prepforge-runner)
    participant DB as Supabase DB

    User->>CF: GET /_next/static/chunks/main-123.js
    alt Static Asset Cached at Edge
        CF-->>User: 200 OK (Served from Edge Cache • 0ms Origin Egress)
    else Cache Miss
        CF->>CR_Web: Forward request to origin
        CR_Web-->>CF: 200 OK (Cache-Control: public, max-age=2592000)
        CF->>CF: Store in global edge cache
        CF-->>User: 200 OK (x-prepforge-cache: EDGE-SAVED)
    end

    User->>CF: POST /api/execute (Code Run Request)
    CF->>CR_Web: Bypass Cache -> Forward POST to Cloud Run
    CR_Web->>CR_Run: POST /api/v2/execute (Code + Test Cases)
    CR_Run->>CR_Run: Compile & Run in isolated tmpfs jail
    CR_Run-->>CR_Web: { passed: true, results: [...] }
    CR_Web->>DB: Record quest solved & update XP
    CR_Web-->>CF: 200 OK JSON
    CF-->>User: Return results to Monaco IDE
```

---

## 3. Component Deep Dives

### A. Next.js 16 Web Core (`prepforge-web`)
* **Framework:** Next.js 16.3 (Turbopack, App Router, React 19).
* **Bundle Optimization:** `output: "standalone"` traces file dependencies to generate a headless Node.js server container of only **~65 MB** (dropping over 90% of unused node_modules).
* **CSRF & Proxy Guard:** Configured with `experimental.serverActions.allowedOrigins` to trust requests forwarded through Cloudflare Workers (`*.workers.dev`).

### B. Multi-Platform Contest Aggregator (`/api/contests`)
Aggregates live competitive programming rounds across the top three platforms with parallel fetching, timeout protections, and revalidation caching.

```mermaid
flowchart LR
    Scheduler["Cron / Request Trigger"] --> ParallelFetch{"Promise.allSettled()"}
    
    ParallelFetch -->|"Timeout 6s"| CF_Task["Codeforces API<br/>contest.list?gym=false"]
    ParallelFetch -->|"Timeout 6s"| LC_Task["LeetCode API<br/>GraphQL (allContests)"]
    ParallelFetch -->|"Timeout 6s"| CC_Task["CodeChef API<br/>api/list/contests/all"]
    
    CF_Task --> Normalizer["Unified Normalization Engine<br/>• ISO Timestamps<br/>• Status: LIVE vs UPCOMING<br/>• Google Calendar Linker"]
    LC_Task --> Normalizer
    CC_Task --> Normalizer
    
    Normalizer --> Sorter["Chronological Sorter<br/>(LIVE rounds first, then nearest startTime)"]
    Sorter --> CacheLayer["5-Minute In-Memory / ISR Revalidation Cache"]
    CacheLayer --> ClientUI["Interactive Monthly Contest Calendar"]
```

### C. Code Execution Sandbox Engine (`prepforge-runner`)
* **Base OS:** Alpine Linux (eliminates Ubuntu system bloat; compresses down to **~100 MB**).
* **Compilers Included:**
  * `python3`: Native Python 3 runtime with dynamic LeetCode AST harness.
  * `g++`: GNU C++ Compiler supporting `-O2 -std=c++17`.
  * `node`: Built-in Node.js v20 engine.
* **Jail & Isolation:**
  * Executes under an unprivileged user (`sandboxuser:1001`).
  * Isolated temporary directory (`/tmp/interviewos-box-XXXXXX`) created per request and erased immediately in a `finally` block.
  * Strict execution timeouts (4,000 ms runtime limit, 8,000 ms compilation limit) to eliminate infinite loops.
  * Output buffer caps (100 KB stdout limit) to prevent memory-exhaustion attacks (`while True: print(...)`).

---

## 4. Request Lifecycle & Execution Flowcharts

### Problem Workspace Code Execution Flow

```mermaid
flowchart TD
    Start(["Developer clicks 'Run' or 'Submit'"]) --> Collect["Gather Code, Language & Test Cases"]
    Collect --> SendReq["POST /api/execute"]
    SendReq --> ParseBody{"Test Cases Provided?"}

    ParseBody -->|Custom Stdin| ExecSingle["Execute Single Test Case"]
    ParseBody -->|Multiple Cases| LoopCases["Iterate Test Cases (Case 1 .. N)"]

    LoopCases --> RunCase["Send case.input to Sandbox via stdin"]
    RunCase --> LangSwitch{"Language?"}

    LangSwitch -->|Python| PyHarness["Inject AST JSON Harness (if LeetCode Solution class) ➔ python3 solution.py"]
    LangSwitch -->|C++| CppCompile["g++ -O2 -std=c++17 main.cpp -o solution"]
    LangSwitch -->|JavaScript| JsRun["node solution.js"]

    CppCompile --> CppSuccess{"Compilation OK?"}
    CppSuccess -->|Failed| CompError["Return compile.stderr (Compilation Error)"]
    CppSuccess -->|Success| CppExec["./solution < stdin"]

    PyHarness --> CollectOut["Capture stdout, stderr, executionTime"]
    CppExec --> CollectOut
    JsRun --> CollectOut

    CollectOut --> CheckOutput{"normalizedActual === normalizedExpected?"}
    CheckOutput -->|Match| MarkPass["passed: true"]
    CheckOutput -->|Mismatch| MarkFail["passed: false (Wrong Answer)"]

    MarkPass --> MoreCases{"More Cases & No Errors?"}
    MarkFail --> MoreCases
    MoreCases -->|Yes| LoopCases
    MoreCases -->|No| FinalResult["Calculate allPassed = (passedCount === totalCount)"]

    CompError --> FinalResult
    ExecSingle --> FinalResult

    FinalResult --> CheckSubmit{"Is Submission & allPassed?"}
    CheckSubmit -->|Yes| UpdateDB["Save quest completion to Supabase + Award XP"]
    CheckSubmit -->|No| ReturnResp["Return Execution Result JSON"]
    UpdateDB --> ReturnResp
    ReturnResp --> RenderUI["Update Test Case Tabs in Browser (Green/Red)"]
    RenderUI --> End(["End"])
```

---

## 5. Data Models & Schema

```mermaid
erDiagram
    PROFILES ||--o{ COMPLETED_QUESTS : achieves
    PROFILES {
        uuid id PK
        string email
        string name
        int level
        int xp
        string leetcode_username
        string codeforces_username
        timestamp created_at
    }

    QUESTIONS ||--o{ COMPLETED_QUESTS : records
    QUESTIONS {
        uuid id PK
        string title
        string difficulty
        string platform
        string_array topics
        string url
        string solution_link
        timestamp created_at
    }

    COMPLETED_QUESTS {
        uuid id PK
        uuid user_id FK
        string quest_title
        int xp_awarded
        timestamp completed_at
    }

    SYSTEM_DESIGN_TOPICS {
        string slug PK
        string title
        string category
        int read_time
        jsonb architecture_blocks
    }
```

---

## 6. Deployment Topology & Cloud Infrastructure

The deployment distributes responsibilities across Cloudflare and Google Cloud Run in the **`us-central1`** region:

```mermaid
graph LR
    subgraph Internet
        Dev["User Browser"]
    end

    subgraph CloudflareNetwork["Cloudflare Edge (Worldwide)"]
        CFW["Worker Proxy (prepforge.workers.dev)<br/>100k requests/day free"]
        Cache["Edge Cache Storage<br/>Unlimited free bandwidth"]
    end

    subgraph GoogleCloud["Google Cloud Platform (us-central1)"]
        subgraph ArtifactRegistry["Artifact Registry (500 MB Free Tier)"]
            ImgWeb["prepforge-web:latest (~65 MB)"]
            ImgRun["prepforge-runner:latest (~100 MB)"]
        end

        subgraph CloudRun["Cloud Run (Serverless Compute)"]
            ServiceWeb["prepforge-web<br/>• 512 MB RAM / 1 vCPU<br/>• min-instances: 0, max: 2<br/>• Port: 8080"]
            ServiceRunner["prepforge-runner<br/>• 512 MB RAM / 1 vCPU<br/>• min-instances: 0, max: 2<br/>• Port: 2000"]
        end
    end

    Dev -->|"HTTPS"| CFW
    CFW --> Cache
    CFW -->|"Zero-Egress Proxy"| ServiceWeb
    ServiceWeb -->|"Intra-Region (0 cost)"| ServiceRunner
    ImgWeb -.-> ServiceWeb
    ImgRun -.-> ServiceRunner
```

---

## 7. Zero-Cost Guardrails & Capacity Planning

| Potential Cost Center | Risk Scenario | Architectural Defense | Resulting Cost |
| :--- | :--- | :--- | :--- |
| **Cloud Run Egress** | Serving 2.9 MB bundles to thousands of users blows past 1 GB/month limit. | **Cloudflare Worker Edge Cache**: Static assets cached for 30 days. Cloud Run only outputs dynamic API responses (<5 KB). | **$0.00 / month** |
| **Cloud Run Compute** | Keeping instances alive 24/7 consumes 2.6M vCPU-seconds (exceeding 360k free limit). | **Scale to Zero (`--min-instances 0`)**: Containers terminate when idle; compute only consumed during active execution. | **$0.00 / month** |
| **Artifact Registry** | Pushing multiple builds builds up 2+ GB of old Docker images. | **Auto-Cleanup Policy**: Retains only the 1 latest version. Total storage capped at ~165 MB (out of 500 MB free quota). | **$0.00 / month** |
| **Infinite Loop Attacks** | Malicious user runs `while True: pass` locking container CPU. | **Subprocess Timeouts**: Runner kills process with `SIGKILL` after 4 seconds and limits stdout to 100 KB. | **$0.00 / month** |
| **Inter-Service Traffic** | Web service sending code to Runner across internet triggers egress. | **Same-Region Routing**: Both services run in `us-central1`; intra-region traffic within GCP is free. | **$0.00 / month** |
