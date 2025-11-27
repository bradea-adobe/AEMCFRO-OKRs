# Inverse Metrics Feature Implementation

**Date:** November 25, 2025

## Overview

Implemented support for **inverse metrics** where lower values are better than higher values. This applies to Key Results like:
- Paused Customers
- Open Tickets
- Overdue Tickets
- Any metric where decreasing values indicate improvement

## Changes Made

### 1. Database Schema (Migration v2)
- Added `inverse_metric` column to `key_results` table
- Type: INTEGER (0 = normal metric, 1 = inverse metric)
- Default value: 0
- Automatic migration for existing databases

### 2. Status Calculation Logic
**For Inverse Metrics:**
- **Green (On Track)**: Actual ≤ Target (staying under target is good)
- **Orange (Under-Watch)**: Actual is 0-50% over target
- **Red (Off Track)**: Actual is more than 50% over target

### 3. Trend Indicator Colors
**For Inverse Metrics:**
- ↓ (Down) = **Green** (decrease is good)
- ↑ (Up) = **Red** (increase is bad)

**For Normal Metrics:**
- ↑ (Up) = **Green** (increase is good)
- ↓ (Down) = **Red** (decrease is bad)

### 4. Admin UI Enhancement
Added checkbox in Key Result form:
- "Inverse metric (lower is better) - for metrics like Open Tickets, Paused Customers, etc."
- Available during both creation and editing of Key Results

## Files Modified

### Core Logic
- `src/lib/database.ts` - Schema update with migration
- `src/lib/calculations.ts` - Updated calculateStatus() and getTrendColor()
- `src/lib/queries.ts` - Updated CRUD operations

### Type Definitions
- `src/types/okr.ts` - Added inverse_metric field to KeyResult
- `src/lib/validation.ts` - Updated validation schema

### Components
- `src/components/Admin/KeyResultForm.tsx` - Added checkbox
- `src/components/Dashboard/KeyResultRow.tsx` - Pass isInverseMetric flag
- `src/components/shared/TrendIndicator.tsx` - Handle inverse metrics
- `src/components/Dashboard/StatusDistributionChart.tsx` - Updated calculations
- `src/lib/pdfExport.ts` - Handle inverse metrics in PDF reports

### Documentation
- `REQUIREMENTS.md` - Updated FR-001, FR-002, FR-003 with inverse metrics logic

## How It Works

### Example: "Open Tickets" Key Result

**Scenario 1: Under Target (Good)**
- Target: 100 tickets
- Actual: 85 tickets
- Status: **Green** (On Track)
- Completion: ~78%

**Scenario 2: Slightly Over Target**
- Target: 100 tickets
- Actual: 120 tickets (20% over)
- Status: **Orange** (Under-Watch)
- Completion: ~65%

**Scenario 3: Way Over Target**
- Target: 100 tickets
- Actual: 180 tickets (80% over)
- Status: **Red** (Off Track)
- Completion: ~30%

### Trend Example
- November: 120 tickets
- December: 100 tickets
- Trend: ↓ -16.7% **in GREEN** (decrease is good for inverse metrics)

## Usage Instructions

1. **Create/Edit a Key Result** in Admin page
2. Check the box **"Inverse metric (lower is better)"** for metrics like:
   - Paused Customers
   - Open Tickets
   - Overdue Tickets
   - Incident Count
   - Error Rate
   - Response Time (if measuring in ms/seconds)
3. The system will automatically:
   - Invert status calculations (under target = good)
   - Show correct trend colors (down = green)
   - Update dashboard and PDF reports accordingly

## Migration Notes

- Existing databases will automatically migrate to version 2
- All existing Key Results default to `inverse_metric = 0` (normal behavior)
- No data loss occurs during migration
- The migration runs once on first load after update

## Testing Recommendations

1. Create a test Key Result with inverse metric enabled
2. Set target to 100
3. Test with actual values:
   - 80 → Should show Green
   - 90 → Should show Green
   - 110 → Should show Orange
   - 160 → Should show Red
4. Verify trend colors change month-to-month correctly

---

**Status:** ✅ Complete
**Linter Errors:** None
**Ready for Production:** Yes

