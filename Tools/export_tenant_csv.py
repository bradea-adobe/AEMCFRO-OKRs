#!/usr/bin/env python3
"""
Export Splunk data to CSV with Tenant ID and Program Name
"""

import json
import os
import sys
import csv
from datetime import datetime


def load_data(filename: str = "splunk_data.json") -> dict:
    """Load data from JSON file"""
    filepath = os.path.join(os.path.dirname(__file__), filename)
    
    if not os.path.exists(filepath):
        print(f"✗ Data file not found: {filepath}")
        print("  Run splunk_extractor.py first to extract data.")
        return None
    
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    return data


def export_summary_csv(data: dict, output_dir: str):
    """Export summary by tenant to CSV"""
    tenant_info = data.get('tenant_info', {})
    by_tenant = data.get('by_tenant', {})
    
    if not by_tenant:
        print("✗ No tenant data available")
        return
    
    # Sort by requests
    sorted_tenants = sorted(by_tenant.items(), key=lambda x: x[1], reverse=True)
    
    # Create CSV
    filepath = os.path.join(output_dir, 'tenant_summary.csv')
    
    with open(filepath, 'w', newline='') as f:
        writer = csv.writer(f)
        
        # Header
        writer.writerow(['Tenant ID', 'Program Name', 'Total Requests (30 Days)', 'Avg Requests per Day'])
        
        # Data rows
        for tenant_id, total_requests in sorted_tenants:
            if tenant_info and tenant_id in tenant_info:
                program_name = tenant_info[tenant_id]['program_name']
            else:
                program_name = 'Unknown Program'
            
            avg_per_day = total_requests / 30
            
            writer.writerow([
                tenant_id,
                program_name,
                total_requests,
                f"{avg_per_day:.2f}"
            ])
    
    print(f"✓ Created: {filepath}")


def export_daily_csv(data: dict, output_dir: str):
    """Export daily breakdown to CSV"""
    by_day = data.get('by_day', {})
    tenant_info = data.get('tenant_info', {})
    
    if not by_day:
        print("✗ No daily data available")
        return
    
    # Get all dates and tenants
    dates = sorted(by_day.keys())
    all_tenants = set()
    for day_data in by_day.values():
        all_tenants.update(day_data.keys())
    
    sorted_tenants = sorted(all_tenants)
    
    # Create CSV
    filepath = os.path.join(output_dir, 'tenant_daily_breakdown.csv')
    
    with open(filepath, 'w', newline='') as f:
        writer = csv.writer(f)
        
        # Header
        header = ['Date', 'Tenant ID', 'Program Name', 'Requests']
        writer.writerow(header)
        
        # Data rows
        for date in dates:
            for tenant_id in sorted_tenants:
                requests = by_day[date].get(tenant_id, 0)
                
                if requests > 0:  # Only write rows with activity
                    if tenant_info and tenant_id in tenant_info:
                        program_name = tenant_info[tenant_id]['program_name']
                    else:
                        program_name = 'Unknown Program'
                    
                    writer.writerow([
                        date,
                        tenant_id,
                        program_name,
                        requests
                    ])
    
    print(f"✓ Created: {filepath}")


def export_pivot_csv(data: dict, output_dir: str):
    """Export pivot table (dates as columns, tenants as rows)"""
    by_day = data.get('by_day', {})
    tenant_info = data.get('tenant_info', {})
    by_tenant = data.get('by_tenant', {})
    
    if not by_day:
        print("✗ No daily data available")
        return
    
    # Get all dates and tenants (sorted by total requests)
    dates = sorted(by_day.keys())
    sorted_tenants = sorted(by_tenant.items(), key=lambda x: x[1], reverse=True)
    tenant_ids = [t[0] for t in sorted_tenants]
    
    # Create CSV
    filepath = os.path.join(output_dir, 'tenant_pivot_table.csv')
    
    with open(filepath, 'w', newline='') as f:
        writer = csv.writer(f)
        
        # Header
        header = ['Tenant ID', 'Program Name', 'Total'] + dates
        writer.writerow(header)
        
        # Data rows
        for tenant_id in tenant_ids:
            if tenant_info and tenant_id in tenant_info:
                program_name = tenant_info[tenant_id]['program_name']
            else:
                program_name = 'Unknown Program'
            
            total = by_tenant[tenant_id]
            daily_values = [by_day[date].get(tenant_id, 0) for date in dates]
            
            row = [tenant_id, program_name, total] + daily_values
            writer.writerow(row)
        
        # Add total row
        total_row = ['TOTAL', 'All Programs', sum(by_tenant.values())]
        for date in dates:
            total_row.append(sum(by_day[date].values()))
        writer.writerow(total_row)
    
    print(f"✓ Created: {filepath}")


def main():
    """Main execution"""
    print("="*80)
    print("Splunk Data CSV Exporter")
    print("="*80 + "\n")
    
    # Load data
    data = load_data()
    if not data:
        return 1
    
    print(f"✓ Loaded data from: splunk_data.json")
    print(f"  Extracted at: {data.get('extracted_at', 'Unknown')}\n")
    
    # Create output directory
    output_dir = os.path.join(os.path.dirname(__file__), 'splunk_exports')
    os.makedirs(output_dir, exist_ok=True)
    
    print("Generating CSV exports...")
    print("-"*80)
    
    try:
        export_summary_csv(data, output_dir)
        export_daily_csv(data, output_dir)
        export_pivot_csv(data, output_dir)
        
        print("-"*80)
        print(f"\n✓ All CSV exports created successfully!")
        print(f"  Output directory: {output_dir}")
        print("\nGenerated files:")
        print("  - tenant_summary.csv           (Summary by tenant)")
        print("  - tenant_daily_breakdown.csv   (Daily detail by tenant)")
        print("  - tenant_pivot_table.csv       (Pivot: tenants x dates)")
        
    except Exception as e:
        print(f"\n✗ Error creating exports: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

