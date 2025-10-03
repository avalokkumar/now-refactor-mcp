# ✅ **Requirements for Code Intelligence & Refactoring MCP (ServiceNow)**

## 1. 🎯 **Goals & Scope**

* **Primary Objective:**
  Provide **real-time code intelligence and refactoring suggestions** for ServiceNow developers working with **GlideScript (Server-side JS)** and **TypeScript (UI/Now Experience components)**.
* **Secondary Objective:**
  Automate **pull request (PR) generation** with refactoring suggestions to enforce best practices.

---

## 2. 📂 **Core Functionalities**

### 🔹 **A. Code Analysis**

* Parse ServiceNow-specific code repositories (GlideScript, TypeScript).
* Detect **smells & anti-patterns**, e.g.:

  * GlideScript:

    * Inefficient GlideRecord queries (e.g., querying inside loops).
    * Deprecated APIs (`GlideAjax` misuses, old APIs).
    * Hardcoded values instead of system properties.
    * Synchronous server calls in UI scripts.
  * TypeScript:

    * Missing type definitions.
    * Poor module organization.
    * Long, unoptimized client-side loops.
    * Direct DOM manipulation vs. using ServiceNow UI framework.

* Detect **performance bottlenecks**:

  * Nested GlideRecord queries.
  * Large loops without indexing.
  * Missing query conditions.

---

### 🔹 **B. Refactoring Suggestions**

* Suggest **idiomatic improvements**, e.g.:

  * Replace nested GlideRecords with `GlideAggregate`.
  * Use `gs.error()` instead of `gs.log()` for errors.
  * Introduce constants for hardcoded values.
  * Break large client scripts into modules/components.
* Generate **before/after code snippets** with explanations.

---

### 🔹 **C. Auto-PR Generation**

* On detecting issues, MCP generates:

  * Refactored code patch.
  * Git commit message (with rationale).
  * Optionally, open a PR on GitHub/GitLab/Bitbucket.

---

### 🔹 **D. Developer Experience**

* **Input:** Repo path, ServiceNow code files, or GitHub repo link.
* **Output:**

  * Analysis report (JSON + natural language summary).
  * Suggested fixes (inline + PR-ready diffs).
  * Confidence scores for each suggestion.

---

## 3. ⚙️ **Architecture**

### 🔹 **High-Level Workflow**

```
Developer → MCP Server → Code Analyzer → Refactoring Engine → Git Integration → Report/PR
```

### 🔹 **Components**

1. **MCP Server**

   * Implements Model Context Protocol.
   * Handles requests: `analyzeRepo`, `suggestRefactor`, `generatePR`.
   * Communicates with LLM for reasoning.

2. **Code Parser/Analyzer**

   * Uses:

     * **Esprima / Acorn** for JavaScript (GlideScript).
     * **TypeScript Compiler API** for TypeScript.
   * Builds AST → runs lint + custom ServiceNow rules.

3. **Refactoring Engine**

   * Applies transformations to AST.
   * Suggests fixes in idiomatic ServiceNow style.
   * Prepares human-readable diffs.

4. **LLM Reasoning Layer**

   * Explains *why* refactoring is needed.
   * Suggests best practices with context.
   * Could use GPT-5 (medium reasoning) for explanations.

5. **Git Integration**

   * Reads repo via GitHub/GitLab API.
   * Creates branches, commits, and PRs automatically.

6. **Reporting Module**

   * Outputs:

     * JSON (machine-consumable for CI/CD).
     * Markdown/HTML (developer-readable).

---

## 4. 🧪 **Testing Strategy**

### 🔹 **Unit Tests**

* Test parsing of GlideScript/TypeScript.
* Validate detection of anti-patterns:

  * Loop queries → flagged correctly.
  * Deprecated APIs → identified.
* Refactoring suggestions produce **compilable code**.

### 🔹 **Integration Tests**

* Run MCP against a sample ServiceNow repo.
* Ensure:

  * Issues detected.
  * Fix suggestions generated.
  * PR is correctly opened with changes.

### 🔹 **Developer Acceptance Tests**

* Mock real ServiceNow dev workflow:

  * Dev pushes bad code → MCP runs → PR with suggestions appears.
  * Ensure fixes are meaningful and follow best practices.

### 🔹 **Performance Tests**

* Large ServiceNow repos (1000+ scripts).
* Ensure MCP completes within acceptable time (<30s per repo scan).

---

## 5. 📊 **Success Metrics**

* **Precision/Recall of detections:** % of actual bad patterns flagged.
* **Developer Adoption:** # of PRs merged from MCP.
* **Refactoring Acceptance:** Ratio of auto-suggestions accepted vs. rejected.
* **Performance:** Avg analysis time per repo.

---

## 6. 🚀 **Implementation Phases**

### **Phase 1 – MVP**

* MCP with repo scan + smell detection.
* CLI-based report output.

### **Phase 2 – Refactoring Engine**

* Add before/after code suggestions.
* GitHub PR integration.

### **Phase 3 – Advanced Intelligence**

* Confidence scoring.
* Inline IDE feedback (e.g., VSCode extension).
* Support for ServiceNow-specific linting rules.
