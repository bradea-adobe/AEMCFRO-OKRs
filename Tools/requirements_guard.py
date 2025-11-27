#!/usr/bin/env python3
"""
Guardrail: ensure REQUIREMENTS.md exists, plan exists, and all implemented features
reference explicit requirement IDs (FR-*, NFR-*) from REQUIREMENTS.md.

Fails if:
- REQUIREMENTS.md missing
- IMPLEMENTATION_PLAN.md missing
- Plan doesn't reference at least one FR/NFR from REQUIREMENTS.md
- Plan lists FRs/NFRs for IDs not present in REQUIREMENTS.md
- Source code references undeclared FR/NFR IDs

Allows:
- Q-xxx IDs in plan even if not in REQUIREMENTS.md (discovered questions)
- SPEC-xxx IDs (external specifications)

Usage:
    python3 tools/requirements_guard.py

Exit codes:
    0 — All checks passed
    1 — Validation passed with warnings
    2 — Validation failed (blocking errors)
"""

from __future__ import annotations

import re
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
REQ = ROOT / "REQUIREMENTS.md"
PLAN = ROOT / "IMPLEMENTATION_PLAN.md"
SRC = ROOT / "src"

# Match FR/NFR/OOS/Q/SPEC with flexible digit count (handles both FR-001 and FR-1)
# Also normalizes shorthand F- to FR-, NF- to NFR-
ID_RE = re.compile(r"\b(?:F|FR|NF|NFR|OOS|Q|SPEC)-\d+\b", re.I)


def normalize_id(match_text: str) -> str:
    """Normalize requirement IDs (F-001 -> FR-001, NF-001 -> NFR-001)"""
    upper = match_text.upper()
    return (upper
            .replace("F-", "FR-")
            .replace("NF-", "NFR-"))


def extract_ids(text: str) -> set[str]:
    """Extract and normalize all requirement IDs from text"""
    return {normalize_id(m.group(0)) for m in ID_RE.finditer(text)}


def main() -> int:
    errors = []
    warnings = []
    
    # Check 1: Required files exist
    if not REQ.exists():
        print("❌ ERROR: REQUIREMENTS.md is missing.")
        return 2
    
    if not PLAN.exists():
        print("❌ ERROR: IMPLEMENTATION_PLAN.md is missing.")
        return 2
    
    # Extract IDs
    req_text = REQ.read_text(encoding="utf-8")
    plan_text = PLAN.read_text(encoding="utf-8")
    
    req_ids = extract_ids(req_text)
    plan_ids = extract_ids(plan_text)
    
    print(f"📋 Found in REQUIREMENTS.md: {len(req_ids)} IDs")
    print(f"📋 Found in IMPLEMENTATION_PLAN.md: {len(plan_ids)} IDs")
    
    # Check 2: Plan must reference at least one FR or NFR
    fr_nfr_in_plan = {i for i in plan_ids if i.startswith(('FR-', 'NFR-'))}
    if not fr_nfr_in_plan:
        errors.append("Plan does not reference any FR-xxx or NFR-xxx IDs.")
    
    # Check 3: Plan's FR/NFR IDs must exist in requirements
    # (Allow Q-xxx to be discovered in plan, and SPEC-xxx, OOS-xxx)
    fr_nfr_in_req = {i for i in req_ids if i.startswith(('FR-', 'NFR-'))}
    undeclared_in_plan = fr_nfr_in_plan - fr_nfr_in_req
    
    if undeclared_in_plan:
        errors.append(
            f"Plan references FR/NFR IDs not in REQUIREMENTS.md: {sorted(undeclared_in_plan)}"
        )
    
    # Check 4: Source code must only reference declared IDs
    if SRC.exists():
        code_ids = set()
        file_count = 0
        
        for ext in ["*.py", "*.js", "*.ts", "*.tsx"]:
            for code_file in SRC.rglob(ext):
                try:
                    content = code_file.read_text(encoding="utf-8")
                    file_ids = extract_ids(content)
                    if file_ids:
                        code_ids.update(file_ids)
                        file_count += 1
                except Exception as e:
                    warnings.append(f"Could not read {code_file}: {e}")
        
        if code_ids:
            print(f"📂 Found in source code ({file_count} files): {len(code_ids)} IDs")
            
            # FR/NFR in code must be in requirements
            fr_nfr_in_code = {i for i in code_ids if i.startswith(('FR-', 'NFR-'))}
            undeclared_in_code = fr_nfr_in_code - fr_nfr_in_req
            
            if undeclared_in_code:
                errors.append(
                    f"Source code references undeclared FR/NFR IDs: {sorted(undeclared_in_code)}"
                )
    else:
        print("📂 No source code directory found (src/), skipping code validation")
    
    # Check 5: Coverage - all FRs should be in plan (warning only)
    fr_in_req = {i for i in req_ids if i.startswith('FR-')}
    fr_in_plan = {i for i in plan_ids if i.startswith('FR-')}
    missing_from_plan = fr_in_req - fr_in_plan
    
    if missing_from_plan:
        warnings.append(
            f"FRs in REQUIREMENTS.md not covered in plan: {sorted(missing_from_plan)}"
        )
    
    # Print results
    print("\n" + "="*60)
    
    if errors:
        print("\n❌ ERRORS (blocking):")
        for error in errors:
            print(f"  - {error}")
    
    if warnings:
        print("\n⚠️  WARNINGS (non-blocking):")
        for warning in warnings:
            print(f"  - {warning}")
    
    if not errors and not warnings:
        print("\n✅ All checks passed! Requirements are properly aligned.")
        print("="*60)
        return 0
    elif not errors:
        print("\n⚠️  Validation passed with warnings.")
        print("="*60)
        return 1
    else:
        print("\n❌ Validation failed. Fix errors before proceeding.")
        print("="*60)
        return 2


if __name__ == "__main__":
    sys.exit(main())
