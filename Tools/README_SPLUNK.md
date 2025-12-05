# Splunk Data Extractor & Visualizer

Standalone tools for extracting and visualizing AEM API request data from Adobe's Splunk instance.

## Overview

These tools are **separate from the OKR tracking application** and provide:
1. **Data Extraction** - Connect to Splunk and extract API request metrics
2. **Data Visualization** - Generate charts and graphs from the extracted data

## Files

- `splunk_extractor.py` - Extracts data from Splunk API
- `splunk_visualizer.py` - Creates visualizations from extracted data
- `requirements_splunk.txt` - Python dependencies
- `README_SPLUNK.md` - This file

## Setup

### 1. Install Dependencies

```bash
# Navigate to Tools directory
cd Tools

# Install required packages
pip3 install -r requirements_splunk.txt
```

### 2. Configure Credentials

Credentials are currently hardcoded in `splunk_extractor.py`. To change them, edit the script:

```python
SPLUNK_BASE_URL = "https://splunk.or1.adobe.net:8089"
USERNAME = "your_username@adobe.com"
PASSWORD = "your_password"
```

**Security Note:** For production use, consider using environment variables or a secure credential store.

## Usage

### Step 1: Extract Data

Run the extractor to connect to Splunk and download metrics:

```bash
python3 splunk_extractor.py
```

**What it does:**
- Authenticates with Splunk API
- Queries: `index=dx_aem_edge_prod router_api=contentAI`
- Extracts: Requests per day per tenant (last 30 days)
- Saves: `splunk_data.json` in Tools directory

**Expected output:**
```
================================================================================
Splunk Data Extractor - AEM API Router Metrics
================================================================================
✓ Authentication successful

Querying: Requests per day per tenant (last 30 days)
Index: dx_aem_edge_prod
Router API: contentAI

Creating search job...
✓ Search job created: 1234567890.12345
✓ Search complete. Found 450 results
✓ Retrieved 450 results

================================================================================
SUMMARY: Total Requests by Tenant (Last 30 Days)
================================================================================
tenant-abc                               1,234,567 requests
tenant-xyz                                 987,654 requests
...
================================================================================
TOTAL                                    5,678,901 requests
================================================================================

✓ Data saved to: /path/to/Tools/splunk_data.json
✓ Extraction complete!
```

### Step 2: Create Visualizations

Run the visualizer to generate charts from the extracted data:

```bash
python3 splunk_visualizer.py
```

**What it does:**
- Loads `splunk_data.json`
- Creates 4 visualization types
- Saves PNG files to `splunk_visualizations/` directory

**Generated visualizations:**

1. **summary_stats.png** - Key metrics summary
   - Total requests
   - Total tenants
   - Average requests per day/tenant
   - Peak and low days

2. **daily_trend.png** - Line chart
   - Daily request volume over time
   - Shows trends and patterns
   - Includes statistics annotation

3. **tenant_distribution.png** - Horizontal bar chart
   - Top 20 tenants by request volume
   - Sorted by total requests

4. **tenant_daily_heatmap.png** - Heatmap
   - Top 10 tenants across all days
   - Color intensity = request volume
   - Identifies high-activity patterns

### Output Structure

```
Tools/
├── splunk_extractor.py
├── splunk_visualizer.py
├── splunk_data.json              # Extracted data
└── splunk_visualizations/        # Generated charts
    ├── summary_stats.png
    ├── daily_trend.png
    ├── tenant_distribution.png
    └── tenant_daily_heatmap.png
```

## Query Details

### Splunk Query

The extractor runs this SPL (Splunk Processing Language) query:

```spl
index=dx_aem_edge_prod router_api=contentAI
| eval day=strftime(_time, "%Y-%m-%d")
| stats count as requests by day, tenant
| sort day tenant
```

**What it does:**
- Filters: `dx_aem_edge_prod` index, `contentAI` router API
- Groups: By day and tenant
- Aggregates: Count of requests
- Time range: Last 30 days

### Customizing the Query

To modify the query, edit `splunk_extractor.py`:

```python
def get_requests_per_day_per_tenant(self, days: int = 30):
    query = '''
        index=dx_aem_edge_prod router_api=contentAI
        | eval day=strftime(_time, "%Y-%m-%d")
        | stats count as requests by day, tenant
        | sort day tenant
    '''
```

**Example modifications:**

- Different router API: Change `router_api=contentAI` to `router_api=imageGen`
- Different time grouping: Change `"%Y-%m-%d"` to `"%Y-%m"` for monthly
- Additional filters: Add `| where tenant="specific-tenant"`

## Data Format

### splunk_data.json Structure

```json
{
  "by_day": {
    "2024-12-01": {
      "tenant-abc": 1234,
      "tenant-xyz": 5678
    },
    "2024-12-02": { ... }
  },
  "by_tenant": {
    "tenant-abc": 37020,
    "tenant-xyz": 170340
  },
  "by_day_total": {
    "2024-12-01": 6912,
    "2024-12-02": 7856
  },
  "raw": [ ... ],
  "extracted_at": "2024-12-04T10:30:45.123456"
}
```

## Troubleshooting

### Authentication Fails

**Error:** `✗ Authentication failed: 401`

**Solutions:**
1. Verify credentials are correct
2. Check if password has expired
3. Ensure you're on Adobe network or VPN
4. Try accessing Splunk web UI to test credentials

### SSL Errors

**Error:** `SSL: CERTIFICATE_VERIFY_FAILED`

**Solution:** The script disables SSL verification for corporate SSL inspection. If this doesn't work:

```python
# In splunk_extractor.py, modify:
verify=False  # Change to verify=True or provide cert path
```

### No Results Found

**Error:** `✓ Search complete. Found 0 results`

**Solutions:**
1. Verify the index exists and is accessible: `dx_aem_edge_prod`
2. Check router_api value: `contentAI`
3. Adjust time range (increase days)
4. Verify permissions for the Splunk user

### Connection Timeout

**Error:** `Connection timeout`

**Solutions:**
1. Check network connectivity to `splunk.or1.adobe.net`
2. Verify port 8089 is not blocked by firewall
3. Increase timeout in script (default: 30s)

## Advanced Usage

### Custom Time Range

Modify the `get_requests_per_day_per_tenant()` call:

```python
# Extract data for last 90 days
data = extractor.get_requests_per_day_per_tenant(days=90)
```

### Multiple Queries

Run multiple extractions for different router APIs:

```python
# In main() function
data_contentai = extractor.get_requests_for_api('contentAI')
data_imagegen = extractor.get_requests_for_api('imageGen')
```

### Export to CSV

Add CSV export functionality:

```python
import csv

def save_csv(data: Dict, filename: str = "splunk_data.csv"):
    with open(filename, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Date', 'Tenant', 'Requests'])
        
        for day, tenants in data['by_day'].items():
            for tenant, requests in tenants.items():
                writer.writerow([day, tenant, requests])
```

## Security Considerations

⚠️ **Important:**

1. **Credentials** - Never commit credentials to git
2. **Data** - `splunk_data.json` may contain sensitive tenant names
3. **Network** - Ensure you're on Adobe VPN when accessing Splunk
4. **SSL** - SSL verification is disabled; use with caution

### Recommended: Use Environment Variables

```python
import os

USERNAME = os.getenv('SPLUNK_USERNAME')
PASSWORD = os.getenv('SPLUNK_PASSWORD')
```

Then set them:

```bash
export SPLUNK_USERNAME="bradea@adobe.com"
export SPLUNK_PASSWORD="your_password"
python3 splunk_extractor.py
```

## Integration (Future)

While these tools are currently **standalone**, they could be integrated with the OKR app by:

1. Adding a new FR to `REQUIREMENTS.md`
2. Creating a scheduled task to auto-populate Key Result actuals
3. Mapping Splunk metrics to specific OKR Key Results
4. Building a data sync service

This is **out of scope** for the current implementation.

## Support

For issues or questions:
1. Check Splunk documentation: https://docs.splunk.com/
2. Verify Adobe Splunk instance status
3. Contact Adobe internal support for access issues

---

**Last Updated:** December 4, 2024

