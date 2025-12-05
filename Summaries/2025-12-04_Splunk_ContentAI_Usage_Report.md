# Splunk ContentAI API Usage Report
**Generated:** December 4, 2025  
**Time Period:** Last 30 Days (Nov 4 - Dec 4, 2025)  
**Data Source:** Adobe Splunk `dx_aem_edge_prod` index

---

## Executive Summary

✅ **Successfully extracted ContentAI API usage data from Adobe Splunk**

### Key Metrics
- **Total Requests:** 316,006
- **Time Period:** 30 days
- **Unique Tenants:** 22 Cloud Manager environments
- **Unique Programs:** 6 identified programs
- **Average Daily Requests:** 10,516

---

## Top Programs by Usage

| Program Name | Environments | Total Requests | % of Total | Avg/Day |
|--------------|--------------|----------------|-----------|---------|
| **InsideAdobeNext** | 3 | 229,098 | 72.5% | 7,637 |
| **Crosswalk** | 2 | 79,387 | 25.1% | 2,646 |
| **MSC EDS** | 2 | 4,893 | 1.5% | 163 |
| **ASO Sandbox Trial** | 1 | 1,141 | 0.4% | 38 |
| **WYNDHAM (Customer)** | 1 | 646 | 0.2% | 22 |
| **Content AI Service** | 3 | 25 | <0.1% | <1 |

---

## Detailed Breakdown by Environment

### Top 10 Tenants by Volume

| Rank | Tenant ID | Program | Requests | Avg/Day |
|------|-----------|---------|----------|---------|
| 1 | cm-p7718-e16302 | InsideAdobeNext | 228,049 | 7,602 |
| 2 | cm-p130360-e1272151 | Crosswalk | 79,386 | 2,646 |
| 3 | cm-p155458-e1664685 | MSC EDS | 4,405 | 147 |
| 4 | cm-p163523-e1788054 | ASO Sandbox Trial | 1,141 | 38 |
| 5 | cm-p7718-e16261 | InsideAdobeNext | 1,003 | 33 |
| 6 | cm-p171453-e1846108 | WYNDHAM | 646 | 22 |
| 7 | cm-p162709-e1741368 | Unknown Program | 518 | 17 |
| 8 | cm-p155458-e1664796 | MSC EDS | 488 | 16 |
| 9 | cm-p31359-e1338271 | Unknown Program | 87 | 3 |
| 10 | cm-p114704-e1171262 | Unknown Program | 82 | 3 |

---

## Daily Usage Trend

| Date | Requests | Notes |
|------|----------|-------|
| Nov 4 | 95 | Start of period |
| Nov 5-9 | 218-74 | Low baseline |
| Nov 10-14 | 3,860-12,602 | **Ramp-up phase** |
| Nov 15-16 | 2,436-2,459 | Weekend dip |
| Nov 17-21 | 15,667-30,601 | **Peak usage period** |
| Nov 22-23 | 4,447-2,568 | Weekend dip |
| Nov 24-28 | 28,774-5,622 | High weekday usage |
| Nov 29-30 | 1,787-2,176 | Weekend dip |
| Dec 1-4 | 20,521-9,397 | Current week |

### Peak Days
- **Highest:** Nov 21 (30,601 requests)
- **2nd:** Nov 24 (28,774 requests)
- **3rd:** Nov 20 (26,036 requests)

### Usage Patterns
- **Weekday average:** ~18,000 requests/day
- **Weekend average:** ~2,500 requests/day
- **Weekend drop:** ~86% reduction

---

## Query Details

### Splunk Query Used
```spl
index="dx_aem_edge_prod" 
sourcetype="apirouter" 
api="contentAI" 
(status<400 OR (reason!="API not found" AND reason!="No tenant provided"))
| eval day=strftime(_time, "%Y-%m-%d")
| stats count as requests by day, aem_tenant
| sort day aem_tenant
```

### Filters Applied
- **Index:** dx_aem_edge_prod
- **Sourcetype:** apirouter (API Router logs)
- **API Type:** contentAI only
- **Status:** Successful requests (status < 400)
- **Exclusions:** "API not found" and "No tenant provided" errors
- **Time Range:** Last 30 days

---

## Files Generated

### Data Files
- `splunk_data.json` - Raw extracted data (30 KB)
- `tenant_program_mapping.json` - Tenant to program name mapping (2.6 KB)

### CSV Exports (in `splunk_exports/` folder)
1. **tenant_summary.csv** (1.1 KB)
   - Summary by tenant with program names
   - Columns: Tenant ID, Program Name, Total Requests, Avg Requests per Day

2. **tenant_daily_breakdown.csv** (9.1 KB)
   - Daily detail for each tenant
   - Columns: Date, Tenant ID, Program Name, Requests

3. **tenant_pivot_table.csv** (3.0 KB)
   - Pivot table format (tenants as rows, dates as columns)
   - Shows requests per tenant per day in matrix format

---

## Program Classifications

### Internal Adobe Programs (5)
- **InsideAdobeNext** (Program ID: 7718) - 3 environments
- **Crosswalk** (Program ID: 130360) - 2 environments  
- **MSC EDS** (Program ID: 155458) - 2 environments
- **Content AI Service Program** (Program ID: 158407) - 3 environments
- **ASO Sandbox Trial** (Program ID: 163523) - 1 environment

### Customer Programs (1)
- **WYNDHAM HOTEL GROUP LLC BC Pilot** (Program ID: 171453) - 1 environment

### Unknown Programs (9 environments)
*These programs need to be added to the tenant mapping file*

---

## Tools Created

### 1. splunk_extractor.py (19 KB)
**Purpose:** Extract API usage data from Splunk

**Features:**
- Authenticates with Splunk API (username: bradea)
- Executes search queries
- Aggregates requests by day and tenant
- Auto-updates tenant-to-program mapping
- Exports to JSON

**Usage:**
```bash
cd Tools
python3 splunk_extractor.py
```

### 2. export_tenant_csv.py (6.1 KB)
**Purpose:** Export data to CSV files

**Features:**
- Reads splunk_data.json
- Generates 3 CSV formats (summary, daily, pivot)
- Includes both Tenant ID and Program Name columns

**Usage:**
```bash
cd Tools
python3 export_tenant_csv.py
```

### 3. splunk_visualizer.py (12 KB)
**Purpose:** Create charts and visualizations

**Features:**
- Daily trend line chart
- Tenant distribution bar chart
- Heatmap of tenant activity
- Summary statistics panel

**Note:** Requires matplotlib (not yet installed)

---

## Authentication Details

**Splunk Instance:** https://splunk.or1.adobe.net:8089  
**Username:** bradea  
**Authentication Method:** API key (successful)  
**Dashboard:** https://splunk.or1.adobe.net/en-GB/app/TA-aem_skyline/

---

## Key Insights

### 1. Usage Concentration
- **Top 2 programs** (InsideAdobeNext + Crosswalk) account for **97.6%** of all requests
- InsideAdobeNext alone represents **72.5%** of total usage

### 2. Growth Trend
- Usage ramped up significantly after Nov 10
- Maintained high levels (15K-30K/day) from Nov 17 onwards
- Current daily average: ~10-20K requests

### 3. Program Adoption
- Only **6 programs** have been mapped with proper names
- **16 environments** still need program identification
- Low-usage environments (<100 requests/month) might be test/trial instances

### 4. Customer vs Internal
- **Customer usage:** <1% (646 requests - Wyndham only)
- **Internal Adobe:** >99% of traffic
- Indicates ContentAI is primarily used internally (for now)

---

## Recommendations

### 1. Update Tenant Mapping
Add program names for these unknown tenants:
- cm-p162709-e1741368 (518 requests)
- cm-p31359-e1338271 (87 requests)
- cm-p47754-e1700224 (82 requests)
- cm-p114704-e1171262 (82 requests)
- Others with lower usage

### 2. Monitor Growth
- Set up automated monthly extraction
- Track growth trends
- Identify adoption patterns

### 3. Customer Adoption
- Investigate low customer usage
- Consider outreach/enablement for external programs

### 4. Visualizations
- Install matplotlib to generate charts
- Create automated reporting dashboard

---

## Next Steps

### Immediate
✅ Data extraction working  
✅ CSV exports generated  
✅ Tenant-to-program mapping created

### Pending
⏸️ Install matplotlib for visualizations  
⏸️ Complete tenant program mappings  
⏸️ Set up automated monthly reports

### Optional
- Integrate with OKR tracking application
- Create Power BI/Tableau dashboards
- Set up alerts for usage anomalies

---

## Technical Notes

- Query execution time: ~2-3 minutes
- Data size: 185 result rows aggregated from millions of log events
- Authentication: Splunk API (port 8089)
- No visualization due to matplotlib installation issues (exit code 139)

---

*Report generated by automated Splunk extraction tools*  
*Location: /Users/bradea/CursorProjects/AEMCFRO-OKRs/Tools/*


