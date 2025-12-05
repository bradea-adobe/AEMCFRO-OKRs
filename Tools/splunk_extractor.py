#!/usr/bin/env python3
"""
Splunk Data Extractor for AEM API Router
Connects to Adobe Splunk instance and extracts API request metrics
"""

import os
import sys
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import urllib3
from collections import defaultdict

# Disable SSL warnings for corporate SSL inspection
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class TenantMapper:
    """Maps tenant IDs to program names"""
    
    def __init__(self, mapping_file: str = "tenant_program_mapping.json"):
        self.mapping_file = os.path.join(os.path.dirname(__file__), mapping_file)
        self.tenant_to_program: Dict[str, str] = {}
        self.program_metadata: Dict[str, Dict] = {}
        self.load_mapping()
    
    def load_mapping(self):
        """Load tenant-to-program mapping from JSON file"""
        if not os.path.exists(self.mapping_file):
            print(f"⚠ Warning: Mapping file not found: {self.mapping_file}")
            print("  Creating default mapping file...")
            self.create_default_mapping()
            return
        
        try:
            with open(self.mapping_file, 'r') as f:
                data = json.load(f)
                self.tenant_to_program = data.get('tenant_mapping', {})
                self.program_metadata = data.get('program_metadata', {})
                print(f"✓ Loaded {len(self.tenant_to_program)} tenant mappings")
        except Exception as e:
            print(f"✗ Error loading mapping file: {e}")
    
    def create_default_mapping(self):
        """Create a default mapping file template"""
        default_data = {
            "tenant_mapping": {},
            "program_metadata": {},
            "metadata": {
                "last_updated": datetime.now().strftime("%Y-%m-%d"),
                "version": "1.0",
                "description": "Mapping of Splunk tenant IDs to program names"
            }
        }
        
        try:
            with open(self.mapping_file, 'w') as f:
                json.dump(default_data, f, indent=2)
            print(f"✓ Created default mapping file: {self.mapping_file}")
            print("  Please edit this file to add your tenant-to-program mappings")
        except Exception as e:
            print(f"✗ Error creating mapping file: {e}")
    
    def get_program_name(self, tenant_id: str) -> str:
        """Get program name for a tenant ID"""
        return self.tenant_to_program.get(tenant_id, "Unknown Program")
    
    def get_display_name(self, tenant_id: str) -> Tuple[str, str]:
        """Get both tenant ID and program name for display"""
        program_name = self.get_program_name(tenant_id)
        return (tenant_id, program_name)
    
    def add_mapping(self, tenant_id: str, program_name: str):
        """Add a new tenant-to-program mapping"""
        self.tenant_to_program[tenant_id] = program_name
    
    def save_mapping(self):
        """Save current mappings back to file"""
        data = {
            "tenant_mapping": self.tenant_to_program,
            "program_metadata": self.program_metadata,
            "metadata": {
                "last_updated": datetime.now().strftime("%Y-%m-%d"),
                "version": "1.0",
                "description": "Mapping of Splunk tenant IDs to program names"
            }
        }
        
        try:
            with open(self.mapping_file, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"✓ Saved mappings to: {self.mapping_file}")
        except Exception as e:
            print(f"✗ Error saving mapping file: {e}")
    
    def update_from_data(self, tenants: List[str], auto_save: bool = True):
        """Update mapping file with any new tenants found in data"""
        new_tenants = []
        for tenant in tenants:
            if tenant not in self.tenant_to_program:
                self.tenant_to_program[tenant] = f"Program for {tenant}"
                new_tenants.append(tenant)
        
        if new_tenants:
            print(f"\n✓ Added {len(new_tenants)} new tenants to mapping file")
            if auto_save:
                self.save_mapping()
        
        return new_tenants


class SplunkExtractor:
    """Extract data from Splunk API"""
    
    def __init__(self, base_url: str, username: str, password: str):
        self.base_url = base_url.rstrip('/')
        self.username = username
        self.password = password
        self.session_key: Optional[str] = None
        self.session = requests.Session()
        
    def authenticate(self) -> bool:
        """Authenticate with Splunk and get session key"""
        # Try multiple authentication methods
        
        # Method 1: Try the standard API endpoint
        auth_url = f"{self.base_url}/services/auth/login"
        
        try:
            print("  Attempting API authentication...")
            response = self.session.post(
                auth_url,
                data={
                    'username': self.username,
                    'password': self.password,
                    'output_mode': 'json'
                },
                verify=False,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.session_key = data.get('sessionKey')
                if self.session_key:
                    print("✓ Authentication successful (API method)")
                    return True
            
            print(f"  API auth failed: {response.status_code}")
            
        except Exception as e:
            print(f"  API auth error: {e}")
        
        # Method 2: Try web-based authentication
        try:
            print("  Attempting web authentication...")
            # Use the web login endpoint
            web_base = self.base_url.replace(':8089', '')
            login_url = f"{web_base}/en-US/account/login"
            
            response = self.session.post(
                login_url,
                data={
                    'username': self.username,
                    'password': self.password,
                    'cval': ''
                },
                verify=False,
                timeout=30,
                allow_redirects=True
            )
            
            # Check if we got a session cookie
            if 'session_id' in self.session.cookies or 'splunkd_' in str(self.session.cookies):
                print("✓ Authentication successful (Web method)")
                # For web auth, we'll use cookies instead of session key
                self.session_key = "web_session"
                return True
            
            print(f"  Web auth failed: {response.status_code}")
                
        except Exception as e:
            print(f"  Web auth error: {e}")
        
        print("✗ All authentication methods failed")
        return False
    
    def search(self, query: str, earliest_time: str = "-30d", latest_time: str = "now") -> Optional[List[Dict]]:
        """Execute a Splunk search query"""
        if not self.session_key:
            print("✗ Not authenticated. Call authenticate() first.")
            return None
        
        search_url = f"{self.base_url}/services/search/jobs"
        
        # Use different headers based on auth method
        if self.session_key == "web_session":
            # Using web session cookies
            headers = {}
        else:
            # Using API session key
            headers = {
                'Authorization': f'Splunk {self.session_key}'
            }
        
        # Create search job
        try:
            print(f"Creating search job...")
            
            # Ensure we have valid authentication
            if self.session_key != "web_session" and 'Authorization' in headers:
                # Using API key authentication
                pass
            else:
                # Using cookie-based session
                headers = {}
            
            response = self.session.post(
                search_url,
                headers=headers,
                data={
                    'search': f'search {query}',
                    'earliest_time': earliest_time,
                    'latest_time': latest_time,
                    'output_mode': 'json'
                },
                verify=False,
                timeout=30
            )
            
            # Debug output
            if response.status_code != 201:
                print(f"  Debug - Request URL: {search_url}")
                print(f"  Debug - Headers: {list(headers.keys())}")
                print(f"  Debug - Session cookies: {list(self.session.cookies.keys())}")
            
            if response.status_code != 201:
                print(f"✗ Failed to create search job: {response.status_code}")
                print(f"  Response: {response.text}")
                return None
            
            job_data = response.json()
            job_id = job_data.get('sid')
            
            if not job_id:
                print("✗ No job ID returned")
                return None
            
            print(f"✓ Search job created: {job_id}")
            
            # Wait for job to complete
            job_status_url = f"{search_url}/{job_id}"
            import time
            
            for i in range(180):  # Wait up to 180 seconds (3 minutes)
                status_response = self.session.get(
                    job_status_url,
                    headers=headers,
                    params={'output_mode': 'json'},
                    verify=False,
                    timeout=60  # Increased timeout
                )
                
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    entry = status_data.get('entry', [{}])[0]
                    content = entry.get('content', {})
                    
                    is_done = content.get('isDone', False)
                    result_count = content.get('resultCount', 0)
                    
                    if is_done:
                        print(f"✓ Search complete. Found {result_count} results")
                        break
                    else:
                        print(f"  Searching... ({i+1}s)", end='\r')
                        time.sleep(1)
                else:
                    print(f"✗ Failed to check job status: {status_response.status_code}")
                    return None
            
            # Get results
            results_url = f"{job_status_url}/results"
            
            print(f"  Retrieving results from job...")
            
            results_response = self.session.get(
                results_url,
                headers=headers,
                params={
                    'output_mode': 'json',
                    'count': 0  # Get all results
                },
                verify=False,
                timeout=30
            )
            
            print(f"  Results response: {results_response.status_code}")
            
            if results_response.status_code == 200:
                results_data = results_response.json()
                results = results_data.get('results', [])
                print(f"✓ Retrieved {len(results)} results")
                return results
            elif results_response.status_code == 204:
                # 204 No Content - search completed but no results
                print(f"⚠ Search completed but returned no results (204)")
                print(f"  This might mean:")
                print(f"    - No data matches the query criteria")
                print(f"    - Time range has no data")
                print(f"    - Index or router_api filter is too restrictive")
                return []
            else:
                print(f"✗ Failed to get results: {results_response.status_code}")
                print(f"  Response: {results_response.text[:500]}")
                return None
                
        except Exception as e:
            print(f"✗ Search error: {e}")
            return None
    
    def get_requests_per_day_per_tenant(self, days: int = 30, mapper: Optional[TenantMapper] = None, filter_contentai: bool = True) -> Optional[Dict]:
        """Get API requests per day per tenant for last N days"""
        
        # Splunk query based on working dashboard query
        # Using second query which filters for successful requests only
        if filter_contentai:
            query = '''
                index="dx_aem_edge_prod" sourcetype="apirouter" host="*" 
                api="contentAI" 
                (status<400 OR (reason!="API not found" AND reason!="No tenant provided"))
                | eval day=strftime(_time, "%Y-%m-%d")
                | stats count as requests by day, aem_tenant
                | sort day aem_tenant
            '''
            filter_desc = "ContentAI API - successful requests only (status<400, excludes errors)"
        else:
            query = '''
                index="dx_aem_edge_prod" sourcetype="apirouter" host="*"
                aem_tenant="*"
                | eval day=strftime(_time, "%Y-%m-%d")
                | stats count as requests by day, aem_tenant
                | sort day aem_tenant
            '''
            filter_desc = "All API Router requests (sourcetype=apirouter)"
        
        # Use same time format as dashboard
        earliest = f"-{days}d@d"
        latest = "now"
        
        print(f"\nQuerying: Requests per day per tenant (last {days} days)")
        print(f"Index: dx_aem_edge_prod")
        print(f"Sourcetype: apirouter")
        print(f"Filter: {filter_desc}")
        print(f"Time range: {earliest} to {latest}\n")
        
        results = self.search(query, earliest_time=earliest, latest_time=latest)
        
        if not results:
            return None
        
        # Organize data
        data = {
            'by_day': defaultdict(lambda: defaultdict(int)),
            'by_tenant': defaultdict(int),
            'by_day_total': defaultdict(int),
            'tenant_info': {},  # New: Store tenant ID -> program name mapping
            'raw': results
        }
        
        # Get all unique tenants
        all_tenants = set()
        
        for result in results:
            day = result.get('day', 'Unknown')
            tenant = result.get('aem_tenant', 'Unknown')  # Fixed: use aem_tenant field
            requests = int(result.get('requests', 0))
            
            all_tenants.add(tenant)
            
            data['by_day'][day][tenant] += requests
            data['by_tenant'][tenant] += requests
            data['by_day_total'][day] += requests
        
        # Add program names if mapper is provided
        if mapper:
            # Update mapper with any new tenants
            mapper.update_from_data(list(all_tenants))
            
            # Build tenant info with program names
            for tenant in all_tenants:
                tenant_id, program_name = mapper.get_display_name(tenant)
                data['tenant_info'][tenant] = {
                    'tenant_id': tenant_id,
                    'program_name': program_name,
                    'total_requests': data['by_tenant'][tenant]
                }
        
        return data


def format_table(data: Dict) -> str:
    """Format data as a text table"""
    if not data:
        return "No data to display"
    
    lines = []
    lines.append("\n" + "="*100)
    lines.append("SUMMARY: Total Requests by Tenant (Last 30 Days)")
    lines.append("="*100)
    
    # Check if we have tenant info with program names
    has_program_names = 'tenant_info' in data and data['tenant_info']
    
    if has_program_names:
        lines.append(f"{'Tenant ID':<25} {'Program Name':<35} {'Requests':>15}")
        lines.append("-"*100)
        
        # Sort by total requests
        sorted_tenants = sorted(
            data['tenant_info'].items(), 
            key=lambda x: x[1]['total_requests'], 
            reverse=True
        )
        
        for tenant_id, info in sorted_tenants:
            program_name = info['program_name']
            total = info['total_requests']
            lines.append(f"{tenant_id:<25} {program_name:<35} {total:>15,}")
    else:
        # Fallback to tenant ID only
        lines.append(f"{'Tenant ID':<60} {'Requests':>15}")
        lines.append("-"*100)
        
        sorted_tenants = sorted(data['by_tenant'].items(), key=lambda x: x[1], reverse=True)
        
        for tenant, total in sorted_tenants:
            lines.append(f"{tenant:<60} {total:>15,}")
    
    lines.append("="*100)
    lines.append(f"{'TOTAL':<60} {sum(data['by_tenant'].values()):>15,} requests")
    lines.append("="*100)
    
    # Daily breakdown
    lines.append("\n" + "="*100)
    lines.append("DAILY BREAKDOWN: Requests per Day")
    lines.append("="*100)
    
    sorted_days = sorted(data['by_day_total'].items())
    
    for day, total in sorted_days:
        lines.append(f"{day:15} {total:>12,} requests")
    
    lines.append("="*100)
    
    return "\n".join(lines)


def save_json(data: Dict, filename: str = "splunk_data.json"):
    """Save data to JSON file"""
    # Convert defaultdict to regular dict for JSON serialization
    json_data = {
        'by_day': {day: dict(tenants) for day, tenants in data['by_day'].items()},
        'by_tenant': dict(data['by_tenant']),
        'by_day_total': dict(data['by_day_total']),
        'tenant_info': data.get('tenant_info', {}),  # Include tenant-to-program mapping
        'raw': data['raw'],
        'extracted_at': datetime.now().isoformat()
    }
    
    filepath = os.path.join(os.path.dirname(__file__), filename)
    with open(filepath, 'w') as f:
        json.dump(json_data, f, indent=2)
    
    print(f"\n✓ Data saved to: {filepath}")


def main():
    """Main execution"""
    print("="*100)
    print("Splunk Data Extractor - AEM API Router Metrics")
    print("="*100)
    
    # Configuration - Try both API and Web endpoints
    SPLUNK_BASE_URL = "https://splunk.or1.adobe.net:8089"  # Splunk API port
    USERNAME = "bradea"
    PASSWORD = "sd3bkf00mn_ADRO45"
    
    print(f"\nSplunk Instance: {SPLUNK_BASE_URL}")
    print(f"Username: {USERNAME}")
    print(f"Dashboard: https://splunk.or1.adobe.net/en-GB/app/TA-aem_skyline/aem_as_a_cloud_service__api_router")
    
    # Initialize tenant mapper
    print("\nInitializing tenant-to-program mapper...")
    mapper = TenantMapper()
    
    # Initialize extractor
    extractor = SplunkExtractor(SPLUNK_BASE_URL, USERNAME, PASSWORD)
    
    # Authenticate
    if not extractor.authenticate():
        print("\n✗ Failed to authenticate. Please check credentials.")
        return 1
    
    # Extract data with tenant mapping
    # Using correct filters (sourcetype=apirouter) should make query much faster
    data = extractor.get_requests_per_day_per_tenant(days=30, mapper=mapper, filter_contentai=True)
    
    if not data:
        print("\n✗ Failed to extract data")
        return 1
    
    # Display results
    print(format_table(data))
    
    # Save to JSON
    save_json(data)
    
    print("\n✓ Extraction complete!")
    print(f"✓ Tenant-to-program mapping updated and saved")
    return 0


if __name__ == "__main__":
    sys.exit(main())

