# REQUIREMENTS — [Project Name]

## Context
[Provide a clear overview of what the system does, why it exists, and who uses it]

**Example:**
> MyApp automates the processing of customer support tickets by classifying incoming requests, routing them to appropriate teams, and tracking resolution times.

The system:
- Connects to [external system/API] via [connection method]
- Reads and classifies [data type]
- Applies [decision logic type] to determine actions
- Updates [target system] with results
- Operates [frequency/schedule]

Integrations:
- **[System 1]** — for [purpose]
- **[System 2]** — for [purpose]

---

## Specifications (TBD Sections)
| Spec | Description | Status |
|------|-------------|---------|
| **SPEC-001** | [Configuration or query definition] | [Value or TBD] |
| **SPEC-002** | [File location or mapping reference] | [Value or TBD] |
| **SPEC-003** | [Status values or workflow states] | [Value or TBD] |
| **SPEC-004** | [Data format or schema definition] | [Value or TBD] |

**Example:**
| Spec | Description | Status |
|------|-------------|---------|
| **SPEC-001** | API endpoint for fetching tickets | **https://api.example.com/v1/tickets** |
| **SPEC-002** | Team routing configuration file | **config/teams.yaml** |
| **SPEC-003** | Valid ticket statuses | **Open, In Progress, Resolved, Closed** |

---

## System Prompt for [AI Agent Name]
*(Include this section only if building an AI agent)*

```
You are [Agent Name], [role description] responsible for [main task].

Your primary responsibilities:
1. [Responsibility 1]
2. [Responsibility 2]
3. [Responsibility 3]

Guidelines:
- [Guideline 1]
- [Guideline 2]
- [Guideline 3]
```

**Example:**
```
You are SupportBot, an AI agent responsible for triaging customer support tickets.

Your primary responsibilities:
1. Classify tickets by urgency (Critical, High, Medium, Low)
2. Route tickets to appropriate teams based on category
3. Suggest initial responses based on historical resolutions

Guidelines:
- Always prioritize customer safety and security issues
- Escalate to human if confidence is below 70%
- Maintain professional and empathetic tone
```

---

## Functional Requirements

### FR-001 — [Feature Name: Data Retrieval]
- Connect to [system] using [authentication method]
- Execute [query/request] to fetch [data type]
- Filter results by [criteria]:
  - Include: [conditions]
  - Exclude: [conditions]
- Process only items that meet [change detection criteria]

**Example:**
### FR-001 — Fetch Support Tickets
- Connect to Zendesk API using OAuth token
- Execute API call to `/api/v2/tickets.json` to fetch open tickets
- Filter results:
  - Include: Status = "Open" or "New", Created within last 24 hours
  - Exclude: Status = "Closed", Tags contain "spam"
- Process only tickets with new comments since last check

### FR-002 — [Feature Name: Data Extraction]
For each item retrieved, extract the following fields:

**Required Fields:**
1. **[Field 1]** — [Description and validation rules]
2. **[Field 2]** — [Description and validation rules]
3. **[Field 3]** — [Description and validation rules]

**Optional Fields:**
- **[Field 4]** — [Description]
- **[Field 5]** — [Description]

**Validation Rules:**
- [Field name]: [Validation logic]
- [Field name]: [Validation logic]

**Example:**
### FR-002 — Extract Ticket Data
**Required Fields:**
1. **Customer Email** — Valid email format, not empty
2. **Issue Category** — Must be one of: Technical, Billing, Account, Product
3. **Priority** — Auto-calculated based on keywords and customer tier

**Optional Fields:**
- **Attachments** — List of uploaded files
- **Previous Tickets** — Related ticket references

**Validation Rules:**
- Customer Email: Reject if missing or invalid format
- Issue Category: Default to "General" if unspecified

### FR-003 — [Feature Name: Decision Logic]
Apply the following decision logic:

```
START: Evaluate [Item]
│
├─ STEP 1: Check [Condition A]
│  │
│  ├─ [Condition A met]?
│  │  │
│  │  ├─ YES → [Action 1]
│  │  │
│  │  └─ NO → Continue to STEP 2
│
├─ STEP 2: Check [Condition B]
│  │
│  ├─ [Condition B met]?
│  │  │
│  │  ├─ YES → [Action 2]
│  │  │
│  │  └─ NO → [Action 3]
```

**Decision Outcomes:**
| Decision | Trigger Conditions | Action |
|----------|-------------------|---------|
| **[Outcome 1]** | [Conditions] | [Actions taken] |
| **[Outcome 2]** | [Conditions] | [Actions taken] |
| **[Outcome 3]** | [Conditions] | [Actions taken] |

**Example:**
### FR-003 — Classify and Route Ticket
```
START: Evaluate Ticket
│
├─ STEP 1: Check for Critical Keywords
│  │
│  ├─ Contains "urgent", "down", "security breach"?
│  │  │
│  │  ├─ YES → Mark as CRITICAL, route to on-call team
│  │  │
│  │  └─ NO → Continue to STEP 2
│
├─ STEP 2: Determine Category
│  │
│  ├─ Technical issue?
│  │  │
│  │  ├─ YES → Route to Engineering
│  │  │
│  │  └─ NO → Route to Customer Success
```

| Decision | Trigger Conditions | Action |
|----------|-------------------|---------|
| **CRITICAL** | Contains urgent keywords | Route to on-call, notify manager |
| **TECHNICAL** | Engineering-related | Route to Engineering team queue |
| **BUSINESS** | Account/billing related | Route to Customer Success |

### FR-004 — [Feature Name: Update Target System]
- Post [output type] to [system]
- Update [field/status] to [value]
- Include [metadata] in the update

**Example:**
### FR-004 — Update Ticket Status
- Post classification comment to Zendesk ticket
- Update ticket status to "In Progress"
- Add tags: category, priority, assigned_team
- Assign to team queue based on routing decision

### FR-005 — [Feature Name: Scheduling/Operations]
- Run [frequency]
- Each run:
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]

**Example:**
### FR-005 — Continuous Operation
- Run every 15 minutes during business hours (9 AM - 6 PM)
- Each run:
  1. Fetch new tickets
  2. Classify and route
  3. Update ticket metadata
  4. Log all actions

### FR-006 — [Feature Name: Error Handling]
When [error condition] occurs:
- Log [details] locally
- Send notification to [recipient] including:
  - [Information 1]
  - [Information 2]
- [Recovery action]

**Example:**
### FR-006 — Error Handling and Notifications
When API call fails:
- Log error to `app_errors.log` with timestamp and endpoint
- Send email to `ops-team@example.com` including:
  - Error type and message
  - Number of tickets affected
  - Time of failure
- Retry on next scheduled run (no immediate retry)

---

## Non-Functional Requirements

| ID | Requirement | Description |
|----|-------------|-------------|
| **NFR-001** | Performance | [Performance target] |
| **NFR-002** | Reliability | [Reliability target] |
| **NFR-003** | Logging | [Logging requirements] |
| **NFR-004** | Security | [Security requirements] |
| **NFR-005** | Scalability | [Scalability target] |
| **NFR-006** | Observability | [Monitoring requirements] |
| **NFR-007** | Data Privacy | [Privacy requirements] |
| **NFR-008** | Configurability | [Configuration options] |

**Example:**
| ID | Requirement | Description |
|----|-------------|-------------|
| **NFR-001** | Performance | Process 1000 tickets per minute |
| **NFR-002** | Reliability | 99.9% uptime during business hours |
| **NFR-003** | Logging | All actions logged to persistent storage with 90-day retention |
| **NFR-004** | Security | API keys stored in encrypted vault, no plaintext secrets |
| **NFR-005** | Scalability | Horizontal scaling to handle 10x traffic spikes |
| **NFR-006** | Observability | Metrics dashboard showing throughput, errors, latency |
| **NFR-007** | Data Privacy | No customer PII logged or stored locally |
| **NFR-008** | Configurability | All thresholds and rules configurable via YAML without code changes |

---

## Out of Scope

| ID | Description |
|----|-------------|
| **OOS-001** | [Feature/capability explicitly not included] |
| **OOS-002** | [Feature/capability explicitly not included] |
| **OOS-003** | [Feature/capability explicitly not included] |

**Example:**
| ID | Description |
|----|-------------|
| **OOS-001** | Automated responses to customers (agent classifies only, humans respond) |
| **OOS-002** | Integration with social media channels (email and web portal only) |
| **OOS-003** | Ticket creation or deletion (read and update only) |

---

## Open Questions

| ID | Question | Resolution |
|----|----------|------------|
| **Q-001** | [Open question about requirements or design] | [TBD or resolved answer] |
| **Q-002** | [Open question about requirements or design] | [TBD or resolved answer] |
| **Q-003** | [Open question about requirements or design] | [TBD or resolved answer] |

**Example:**
| ID | Question | Resolution |
|----|----------|------------|
| **Q-001** | Should we classify tickets in languages other than English? | ✅ **Resolved** — Phase 1: English only. Phase 2: Add Spanish, French |
| **Q-002** | What happens if customer replies during classification? | **TBD** — Waiting on product team decision |
| **Q-003** | Should we handle attachments? | ✅ **Resolved** — Yes, scan for common file types, flag suspicious files |

---

## Summary Flow

1. **[Step 1]** — [Brief description]
2. **[Step 2]** — [Brief description]
3. **[Step 3]** — [Brief description]
4. **[Step 4]** — [Brief description]
5. **[Step 5]** — [Brief description]

**Example:**
1. **Fetch** — Connect to Zendesk API and retrieve new tickets
2. **Extract** — Parse ticket fields and validate required data
3. **Classify** — Determine priority and category using ML model
4. **Route** — Assign to appropriate team queue based on classification
5. **Update** — Post classification results and update ticket status
6. **Log** — Record all actions to audit log
7. **Repeat** — Run again in 15 minutes

---

## Glossary

| Term | Description |
|------|-------------|
| **[Term 1]** | [Definition] |
| **[Term 2]** | [Definition] |
| **[Term 3]** | [Definition] |

**Example:**
| Term | Description |
|------|-------------|
| **SLA** | Service Level Agreement — guaranteed response time based on priority |
| **P0 Ticket** | Critical priority ticket requiring immediate response |
| **Triage** | Initial classification and routing of incoming tickets |
| **Escalation** | Moving ticket to higher-level support team |

---

## Change Log

### [Date] - [Summary of Changes]

**Changes:**

1. **[Feature/Change Name]** ✅
   - **Old Behavior:** [What it did before]
   - **New Behavior:** [What it does now]
   - **Impact:** [How this affects the system]
   - **Files Modified:** [List of changed files]
   - **Rationale:** [Why this change was made]

**Example:**
### November 18, 2025 - Priority Classification Improvements

**Changes:**

1. **Added VIP Customer Detection** ✅
   - **Old Behavior:** All customers treated equally for priority
   - **New Behavior:** VIP customers automatically elevated to high priority
   - **Impact:** VIP tickets now route to dedicated queue
   - **Files Modified:**
     - `src/classifier.py` - Added VIP lookup
     - `config/vip_customers.yaml` - New configuration file
   - **Rationale:** Business requirement to provide premium service

2. **Fixed Category Misclassification** ✅
   - **Problem:** Billing questions incorrectly routed to Engineering
   - **Root Cause:** Keyword overlap between categories
   - **Fix Applied:** Added negative keywords and improved scoring weights
   - **Test Results:** Accuracy improved from 78% to 94%

---

*End of REQUIREMENTS.md*
*Last Updated: [Date]*

