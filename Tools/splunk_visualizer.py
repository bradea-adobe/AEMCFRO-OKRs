#!/usr/bin/env python3
"""
Splunk Data Visualizer
Creates charts and graphs from extracted Splunk data
"""

import json
import os
import sys
from datetime import datetime
from typing import Dict, List
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from collections import defaultdict


def load_data(filename: str = "splunk_data.json") -> Dict:
    """Load data from JSON file"""
    filepath = os.path.join(os.path.dirname(__file__), filename)
    
    if not os.path.exists(filepath):
        print(f"✗ Data file not found: {filepath}")
        print("  Run splunk_extractor.py first to extract data.")
        return None
    
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    print(f"✓ Loaded data from: {filepath}")
    print(f"  Extracted at: {data.get('extracted_at', 'Unknown')}")
    print(f"  Total records: {len(data.get('raw', []))}")
    
    return data


def create_daily_trend_chart(data: Dict, output_dir: str):
    """Create line chart of daily request trends"""
    by_day_total = data.get('by_day_total', {})
    
    if not by_day_total:
        print("✗ No daily data available")
        return
    
    # Sort by date
    dates = sorted(by_day_total.keys())
    values = [by_day_total[date] for date in dates]
    
    # Convert to datetime objects
    date_objects = [datetime.strptime(d, "%Y-%m-%d") for d in dates]
    
    # Create chart
    fig, ax = plt.subplots(figsize=(14, 6))
    
    ax.plot(date_objects, values, marker='o', linewidth=2, markersize=6, color='#2563eb')
    ax.fill_between(date_objects, values, alpha=0.3, color='#2563eb')
    
    # Formatting
    ax.set_xlabel('Date', fontsize=12, fontweight='bold')
    ax.set_ylabel('Number of Requests', fontsize=12, fontweight='bold')
    ax.set_title('AEM ContentAI API - Daily Request Trend (Last 30 Days)', 
                 fontsize=14, fontweight='bold', pad=20)
    
    # Format x-axis
    ax.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    ax.xaxis.set_major_locator(mdates.DayLocator(interval=2))
    plt.xticks(rotation=45, ha='right')
    
    # Add grid
    ax.grid(True, alpha=0.3, linestyle='--')
    
    # Format y-axis with commas
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{int(x):,}'))
    
    # Add stats annotation
    total_requests = sum(values)
    avg_requests = total_requests / len(values)
    max_requests = max(values)
    min_requests = min(values)
    
    stats_text = f'Total: {total_requests:,}\nAvg: {avg_requests:,.0f}\nMax: {max_requests:,}\nMin: {min_requests:,}'
    ax.text(0.02, 0.98, stats_text, transform=ax.transAxes,
            fontsize=10, verticalalignment='top',
            bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
    
    plt.tight_layout()
    
    # Save
    filepath = os.path.join(output_dir, 'daily_trend.png')
    plt.savefig(filepath, dpi=300, bbox_inches='tight')
    print(f"✓ Created: {filepath}")
    
    plt.close()


def create_tenant_distribution_chart(data: Dict, output_dir: str):
    """Create bar chart of requests by tenant"""
    by_tenant = data.get('by_tenant', {})
    tenant_info = data.get('tenant_info', {})
    
    if not by_tenant:
        print("✗ No tenant data available")
        return
    
    # Sort by request count
    sorted_tenants = sorted(by_tenant.items(), key=lambda x: x[1], reverse=True)
    
    # Take top 20 tenants
    top_n = 20
    if len(sorted_tenants) > top_n:
        top_tenants = sorted_tenants[:top_n]
        other_count = sum(count for _, count in sorted_tenants[top_n:])
        top_tenants.append(('Others', other_count))
    else:
        top_tenants = sorted_tenants
    
    # Create labels with program names if available
    labels = []
    for tenant_id, _ in top_tenants:
        if tenant_id == 'Others':
            labels.append('Others')
        elif tenant_info and tenant_id in tenant_info:
            program_name = tenant_info[tenant_id]['program_name']
            # Format: "Program Name (tenant-id)"
            if len(program_name) > 30:
                program_name = program_name[:27] + "..."
            labels.append(f"{program_name}\n({tenant_id})")
        else:
            labels.append(tenant_id)
    
    tenants = labels
    counts = [t[1] for t in top_tenants]
    
    # Create chart with larger figure for multi-line labels
    fig, ax = plt.subplots(figsize=(14, max(8, len(tenants) * 0.5)))
    
    bars = ax.barh(tenants, counts, color='#10b981')
    
    # Add value labels
    for i, (bar, count) in enumerate(zip(bars, counts)):
        width = bar.get_width()
        ax.text(width, bar.get_y() + bar.get_height()/2, 
                f' {count:,}', ha='left', va='center', fontsize=8)
    
    # Formatting
    ax.set_xlabel('Number of Requests (Last 30 Days)', fontsize=12, fontweight='bold')
    ax.set_ylabel('Program Name (Tenant ID)', fontsize=12, fontweight='bold')
    ax.set_title(f'AEM ContentAI API - Top {min(top_n, len(sorted_tenants))} Programs by Request Volume', 
                 fontsize=14, fontweight='bold', pad=20)
    
    # Adjust tick label size for readability
    ax.tick_params(axis='y', labelsize=8)
    
    # Format x-axis with commas
    ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{int(x):,}'))
    
    # Add grid
    ax.grid(True, alpha=0.3, linestyle='--', axis='x')
    
    # Invert y-axis to show highest at top
    ax.invert_yaxis()
    
    plt.tight_layout()
    
    # Save
    filepath = os.path.join(output_dir, 'tenant_distribution.png')
    plt.savefig(filepath, dpi=300, bbox_inches='tight')
    print(f"✓ Created: {filepath}")
    
    plt.close()


def create_tenant_daily_heatmap(data: Dict, output_dir: str, top_n: int = 10):
    """Create heatmap showing requests per tenant per day"""
    by_day = data.get('by_day', {})
    tenant_info = data.get('tenant_info', {})
    
    if not by_day:
        print("✗ No daily tenant data available")
        return
    
    # Get top N tenants by total requests
    by_tenant = data.get('by_tenant', {})
    top_tenants = sorted(by_tenant.items(), key=lambda x: x[1], reverse=True)[:top_n]
    tenant_ids = [t[0] for t in top_tenants]
    
    # Create display labels with program names
    tenant_labels = []
    for tenant_id in tenant_ids:
        if tenant_info and tenant_id in tenant_info:
            program_name = tenant_info[tenant_id]['program_name']
            if len(program_name) > 25:
                program_name = program_name[:22] + "..."
            tenant_labels.append(f"{program_name}")
        else:
            tenant_labels.append(tenant_id)
    
    # Get all dates
    dates = sorted(by_day.keys())
    
    # Build matrix
    matrix = []
    for tenant_id in tenant_ids:
        row = [by_day[date].get(tenant_id, 0) for date in dates]
        matrix.append(row)
    
    # Create heatmap
    fig, ax = plt.subplots(figsize=(16, 8))
    
    im = ax.imshow(matrix, cmap='YlOrRd', aspect='auto')
    
    # Set ticks
    ax.set_xticks(range(len(dates)))
    ax.set_yticks(range(len(tenant_labels)))
    
    # Set labels
    ax.set_xticklabels(dates, rotation=45, ha='right', fontsize=8)
    ax.set_yticklabels(tenant_labels, fontsize=9)
    
    # Add colorbar
    cbar = plt.colorbar(im, ax=ax)
    cbar.set_label('Number of Requests', rotation=270, labelpad=20, fontsize=11, fontweight='bold')
    
    # Titles
    ax.set_xlabel('Date', fontsize=12, fontweight='bold')
    ax.set_ylabel('Program Name', fontsize=12, fontweight='bold')
    ax.set_title(f'AEM ContentAI API - Request Heatmap (Top {top_n} Programs)', 
                 fontsize=14, fontweight='bold', pad=20)
    
    plt.tight_layout()
    
    # Save
    filepath = os.path.join(output_dir, 'tenant_daily_heatmap.png')
    plt.savefig(filepath, dpi=300, bbox_inches='tight')
    print(f"✓ Created: {filepath}")
    
    plt.close()


def create_summary_stats(data: Dict, output_dir: str):
    """Create a summary statistics chart"""
    by_tenant = data.get('by_tenant', {})
    by_day_total = data.get('by_day_total', {})
    
    if not by_tenant or not by_day_total:
        print("✗ Insufficient data for summary")
        return
    
    # Calculate stats
    total_requests = sum(by_tenant.values())
    total_tenants = len(by_tenant)
    total_days = len(by_day_total)
    avg_requests_per_day = total_requests / total_days if total_days > 0 else 0
    avg_requests_per_tenant = total_requests / total_tenants if total_tenants > 0 else 0
    
    daily_values = list(by_day_total.values())
    max_daily = max(daily_values) if daily_values else 0
    min_daily = min(daily_values) if daily_values else 0
    
    # Create figure with stats
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.axis('off')
    
    # Title
    title_text = "AEM ContentAI API - Summary Statistics (Last 30 Days)"
    ax.text(0.5, 0.95, title_text, ha='center', va='top', 
            fontsize=16, fontweight='bold', transform=ax.transAxes)
    
    # Stats boxes
    stats = [
        ('Total Requests', f'{total_requests:,}', '#2563eb'),
        ('Total Tenants', f'{total_tenants:,}', '#10b981'),
        ('Total Days', f'{total_days}', '#f59e0b'),
        ('Avg Requests/Day', f'{avg_requests_per_day:,.0f}', '#8b5cf6'),
        ('Avg Requests/Tenant', f'{avg_requests_per_tenant:,.0f}', '#ef4444'),
        ('Peak Day', f'{max_daily:,}', '#06b6d4'),
        ('Low Day', f'{min_daily:,}', '#84cc16'),
    ]
    
    y_pos = 0.75
    for i, (label, value, color) in enumerate(stats):
        if i % 2 == 0:
            x_pos = 0.25
        else:
            x_pos = 0.75
            
        # Box
        box = plt.Rectangle((x_pos - 0.15, y_pos - 0.06), 0.3, 0.1,
                           transform=ax.transAxes,
                           facecolor=color, alpha=0.2, edgecolor=color, linewidth=2)
        ax.add_patch(box)
        
        # Label
        ax.text(x_pos, y_pos + 0.02, label, ha='center', va='center',
               fontsize=11, fontweight='bold', transform=ax.transAxes)
        
        # Value
        ax.text(x_pos, y_pos - 0.02, value, ha='center', va='center',
               fontsize=14, fontweight='bold', transform=ax.transAxes, color=color)
        
        if i % 2 == 1:
            y_pos -= 0.15
    
    # Footer
    extracted_at = data.get('extracted_at', 'Unknown')
    footer_text = f"Data extracted at: {extracted_at}"
    ax.text(0.5, 0.02, footer_text, ha='center', va='bottom',
           fontsize=9, style='italic', transform=ax.transAxes, color='gray')
    
    plt.tight_layout()
    
    # Save
    filepath = os.path.join(output_dir, 'summary_stats.png')
    plt.savefig(filepath, dpi=300, bbox_inches='tight')
    print(f"✓ Created: {filepath}")
    
    plt.close()


def main():
    """Main execution"""
    print("="*80)
    print("Splunk Data Visualizer - AEM API Router Metrics")
    print("="*80 + "\n")
    
    # Load data
    data = load_data()
    if not data:
        return 1
    
    # Create output directory
    output_dir = os.path.join(os.path.dirname(__file__), 'splunk_visualizations')
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"\nGenerating visualizations...")
    print("-"*80)
    
    # Create visualizations
    try:
        create_summary_stats(data, output_dir)
        create_daily_trend_chart(data, output_dir)
        create_tenant_distribution_chart(data, output_dir)
        create_tenant_daily_heatmap(data, output_dir, top_n=10)
        
        print("-"*80)
        print(f"\n✓ All visualizations created successfully!")
        print(f"  Output directory: {output_dir}")
        print("\nGenerated files:")
        print("  - summary_stats.png          (Summary statistics)")
        print("  - daily_trend.png            (Daily request trend)")
        print("  - tenant_distribution.png    (Top tenants by volume)")
        print("  - tenant_daily_heatmap.png   (Tenant activity heatmap)")
        
    except Exception as e:
        print(f"\n✗ Error creating visualizations: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

