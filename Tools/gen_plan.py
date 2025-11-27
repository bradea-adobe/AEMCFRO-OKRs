#!/usr/bin/env python3
"""
Generate or refresh IMPLEMENTATION_PLAN.md from REQUIREMENTS.md.

- Extracts FR-xxx / NFR-xxx / OOS-xxx / Q-xxx / SPEC-xxx IDs.
- Fills a structured plan with checklists.
- Safe to re-run: preserves user edits outside managed block.

Usage:
    python3 tools/gen_plan.py

Output:
    IMPLEMENTATION_PLAN.md (updated or created with auto-managed sections)
"""

from __future__ import annotations

from pathlib import Path
from datetime import datetime
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
REQ = ROOT / "REQUIREMENTS.md"
PLAN = ROOT / "IMPLEMENTATION_PLAN.md"
BEGIN = "<!-- PLAN:AUTO:BEGIN -->"
END = "<!-- PLAN:AUTO:END -->"


def extract_ids(section: str, text: str) -> list[str]:
    """Extract requirement IDs of a given type (FR, NFR, etc.)"""
    # Match both heading format (### FR-001) and bold format (**FR-001**)
    rx = re.compile(rf"(?mi)(?:###\s*|^\s*-\s*|\*\*)({section}-\d{{3}})\b")
    return sorted({m.group(1).upper() for m in rx.finditer(text)})


def extract_with_description(section: str, text: str) -> list[tuple[str, str]]:
    """Extract requirement IDs with their descriptions"""
    # Match heading format (### FR-001 — Description) or bold/list format
    patterns = [
        # Heading format: ### FR-001 — Description
        rf"(?mi)^###\s*({section}-\d{{3}})\s*[—\-:]+\s*(.+?)(?=\n|$)",
        # Bold format: **FR-001**: Description
        rf"(?mi)\*\*({section}-\d{{3}})\*\*\s*[:\s—|]+\s*(.+?)(?=\n|\|)",
        # List format: - FR-001: Description
        rf"(?mi)^\s*-\s*({section}-\d{{3}})[:\s—]+\s*(.+?)(?=\n|\|)",
    ]
    
    results = []
    for pattern in patterns:
        rx = re.compile(pattern, re.MULTILINE)
        for match in rx.finditer(text):
            req_id = match.group(1).upper()
            desc = match.group(2).strip()
            # Clean up markdown and truncate if too long
            desc = desc.replace("**", "").replace("*", "")
            if len(desc) > 80:
                desc = desc[:77] + "..."
            results.append((req_id, desc))
    
    return sorted(set(results), key=lambda x: x[0])


def render_block(req_text: str) -> str:
    """Generate the auto-managed section of the implementation plan"""
    # Extract IDs
    fr_ids = extract_ids("FR", req_text)
    nfr_ids = extract_ids("NFR", req_text)
    oos_ids = extract_ids("OOS", req_text)
    q_ids = extract_ids("Q", req_text)
    spec_ids = extract_ids("SPEC", req_text)
    
    # Extract with descriptions for detailed mapping
    fr_detailed = extract_with_description("FR", req_text)
    nfr_detailed = extract_with_description("NFR", req_text)
    q_detailed = extract_with_description("Q", req_text)

    lines = []
    lines.append(BEGIN)
    lines.append("")
    lines.append(f"*Auto-generated on {datetime.now().strftime('%Y-%m-%d %H:%M')}*")
    lines.append("")
    
    # Scope Matrix
    lines.append("## Scope Matrix")
    lines.append("")
    lines.append(f"- **In Scope (FR)**: {', '.join(fr_ids) if fr_ids else '—'}")
    lines.append(f"- **In Scope (NFR)**: {', '.join(nfr_ids) if nfr_ids else '—'}")
    lines.append(f"- **Out of Scope**: {', '.join(oos_ids) if oos_ids else '—'}")
    lines.append(f"- **Specifications**: {', '.join(spec_ids) if spec_ids else '—'}")
    lines.append(f"- **Open Questions**: {', '.join(q_ids) if q_ids else '—'}")
    lines.append("")
    
    # Open Questions Section
    lines.append("## Open Questions")
    lines.append("")
    if q_detailed:
        lines.append("**Resolve these before implementation:**")
        lines.append("")
        for q_id, question in q_detailed:
            lines.append(f"- [ ] **{q_id}**: {question}")
        lines.append("")
    else:
        lines.append("*No open questions at this time.*")
        lines.append("")
    
    # Requirements Mapping
    lines.append("## Requirements Mapping")
    lines.append("")
    lines.append("### Functional Requirements")
    lines.append("")
    if fr_detailed:
        for fr_id, desc in fr_detailed:
            lines.append(f"**{fr_id}**: {desc}")
            lines.append("")
            lines.append("- [ ] Define implementation approach")
            lines.append("- [ ] Write tests (happy path + edge cases)")
            lines.append("- [ ] Implement solution")
            lines.append("- [ ] Update module README")
            lines.append("")
    else:
        lines.append("*No functional requirements defined.*")
        lines.append("")
    
    lines.append("### Non-Functional Requirements")
    lines.append("")
    if nfr_detailed:
        lines.append("| ID | Requirement | Status |")
        lines.append("|----|-------------|--------|")
        for nfr_id, desc in nfr_detailed:
            lines.append(f"| {nfr_id} | {desc} | ⏸️ Pending |")
        lines.append("")
    else:
        lines.append("*No non-functional requirements defined.*")
        lines.append("")
    
    # Standard Workflow Steps
    lines.append("## Standard Development Workflow")
    lines.append("")
    lines.append("Follow these steps for each feature/requirement:")
    lines.append("")
    base_steps = [
        "Read REQUIREMENTS.md, confirm scope (only FR/NFR in file).",
        "Resolve all Open Questions; block implementation until answers provided.",
        "Write failing tests for each FR (TDD approach).",
        "Implement minimal solution to satisfy tests.",
        "Add per-module READMEs (Design/Features/Usage).",
        "Wire CLI/API only if explicitly required by FR/NFR.",
        "Validate NFRs (performance, security, coverage >= 90%).",
        "Run `python3 tools/requirements_guard.py` to validate alignment.",
        "Update documentation and changelog.",
        "Commit with conventional commits (feat:, fix:, docs:)."
    ]
    for idx, step in enumerate(base_steps, 1):
        lines.append(f"{idx}. {step}")
    lines.append("")
    
    # Test Plan
    lines.append("## Test Plan")
    lines.append("")
    lines.append("- Each FR must have **at least one happy-path and one edge-case test**")
    lines.append("- Target: **>= 90% code coverage**")
    lines.append("- Use descriptive test names: `test_<function>_<behavior>`")
    lines.append("- Mock external dependencies (Jira MCP, Azure OpenAI, email)")
    lines.append("")
    
    # Acceptance Criteria
    lines.append("## Acceptance Criteria")
    lines.append("")
    lines.append("✅ Implementation is complete when:")
    lines.append("")
    lines.append("- [ ] All FR/NFR IDs mapped and implemented")
    lines.append("- [ ] No features beyond REQUIREMENTS.md implemented (OOS respected)")
    lines.append("- [ ] All tests passing with >= 90% coverage")
    lines.append("- [ ] `python3 tools/requirements_guard.py` passes")
    lines.append("- [ ] All module READMEs updated")
    lines.append("- [ ] No linter errors (`ruff check .`)")
    lines.append("- [ ] Code formatted (`black .`)")
    lines.append("- [ ] Type hints validated (`mypy src/py`)")
    lines.append("")
    
    lines.append(END)
    return "\n".join(lines) + "\n"


def main() -> int:
    """Main execution"""
    if not REQ.exists():
        print(f"❌ ERROR: {REQ} not found; cannot generate plan.", file=sys.stderr)
        return 2
    
    print(f"📖 Reading requirements from: {REQ}")
    req_text = REQ.read_text(encoding="utf-8")
    
    # Count requirements
    fr_count = len(extract_ids("FR", req_text))
    nfr_count = len(extract_ids("NFR", req_text))
    oos_count = len(extract_ids("OOS", req_text))
    q_count = len(extract_ids("Q", req_text))
    
    print(f"\n📊 Found:")
    print(f"   FR:  {fr_count} functional requirements")
    print(f"   NFR: {nfr_count} non-functional requirements")
    print(f"   OOS: {oos_count} out-of-scope items")
    print(f"   Q:   {q_count} open questions")
    
    print(f"\n🔧 Generating implementation plan...")
    block = render_block(req_text)

    # Smart merge: preserve manual edits outside AUTO block
    if PLAN.exists():
        text = PLAN.read_text(encoding="utf-8")
        if BEGIN in text and END in text:
            # Replace only the auto-managed section
            text = re.sub(
                rf"{re.escape(BEGIN)}.*?{re.escape(END)}",
                block,
                text,
                flags=re.DOTALL
            )
            print("   ♻️  Updated auto-managed section (manual edits preserved)")
        else:
            # No markers found, prepend auto section
            header = "# IMPLEMENTATION PLAN — GARCEA\n\n"
            header += "## Overview\n\n"
            header += "This plan maps REQUIREMENTS.md to implementation tasks.\n"
            header += "Sections between AUTO markers are regenerated by `tools/gen_plan.py`.\n"
            header += "Add manual notes outside these markers.\n\n"
            header += "---\n\n"
            text = header + block + "\n---\n\n" + "## Manual Notes\n\n" + text
            print("   ✨ Added auto-managed section to existing file")
    else:
        # Create new file
        header = "# IMPLEMENTATION PLAN — GARCEA\n\n"
        header += "## Overview\n\n"
        header += "This plan maps REQUIREMENTS.md to implementation tasks.\n"
        header += "Sections between AUTO markers are regenerated by `tools/gen_plan.py`.\n"
        header += "Add manual notes outside these markers.\n\n"
        header += "---\n\n"
        footer = "\n---\n\n## Manual Notes\n\n"
        footer += "*Add custom implementation notes, architecture decisions, "
        footer += "or detailed task breakdowns here.*\n"
        text = header + block + footer
        print("   📝 Created new implementation plan")

    PLAN.write_text(text, encoding="utf-8")
    print(f"\n✅ Success! Wrote {PLAN.relative_to(ROOT.parent)}")
    print("\n📋 Next steps:")
    print("   1. Review IMPLEMENTATION_PLAN.md")
    print("   2. Resolve Open Questions")
    print("   3. Add detailed notes in 'Manual Notes' section")
    print("   4. Begin implementation per Standard Workflow")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
