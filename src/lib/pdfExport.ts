// FR-005: PDF Report Generation

import * as pdfMakeLib from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { ObjectiveWithDetails } from '@/types/okr';
import { calculateStatus, calculateTrend } from './calculations';
import { formatMonth, getPreviousMonth } from './utils';

// Get pdfMake instance (handle both default and named exports)
const pdfMake = (pdfMakeLib as any).default || pdfMakeLib;

// Initialize pdfMake with fonts
const vfs = (pdfFonts as any).pdfMake?.vfs || (pdfFonts as any).default?.pdfMake?.vfs || (pdfFonts as any).vfs || pdfFonts;
if (pdfMake && vfs) {
  pdfMake.vfs = vfs;
}

interface PDFExportOptions {
  objectives: ObjectiveWithDetails[];
  selectedMonth: string;
  title?: string;
}

/**
 * Generate and download PDF report of Dashboard
 * FR-005: PDF Report Generation
 */
export const exportDashboardToPDF = ({
  objectives,
  selectedMonth,
  title = 'AEM Cloud Foundation RO - OKRs Report',
}: PDFExportOptions): void => {
  const formattedMonth = formatMonth(selectedMonth);
  const generatedDate = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // Filter objectives and KRs to match what's visible on Dashboard
  const visibleObjectives = objectives
    .map((objective) => {
      // ALWAYS filter out key results with target = 0
      const filteredKeyResults = objective.key_results.filter((kr) => {
        const monthData = kr.monthly_data.find((md) => md.month === selectedMonth);
        return monthData && monthData.target !== 0;
      });

      return {
        ...objective,
        key_results: filteredKeyResults,
      };
    })
    .filter((obj) => obj.key_results.length > 0); // Only include objectives with visible KRs

  // Calculate summary statistics from visible data
  let totalKRs = 0;
  let onTrackCount = 0;
  let underWatchCount = 0;
  let offTrackCount = 0;

  visibleObjectives.forEach((obj) => {
    obj.key_results.forEach((kr) => {
      const monthData = kr.monthly_data.find((md) => md.month === selectedMonth);
      if (monthData) {
        totalKRs++;
        const isInverseMetric = kr.inverse_metric === 1;
        const { status } = calculateStatus(
          monthData.actual,
          monthData.target,
          isInverseMetric
        );
        if (status === 'green') onTrackCount++;
        else if (status === 'orange') underWatchCount++;
        else if (status === 'red') offTrackCount++;
        else onTrackCount++; // not-set counts as on track
      }
    });
  });

  const previousMonth = getPreviousMonth(selectedMonth);

  // Build PDF content - each objective is a separate unbreakable block
  const objectiveBlocks = visibleObjectives.map((objective, objIndex) => {
    const comment = objective.comments.find((c) => c.month === selectedMonth);

    // Build KR rows
    const krRows = objective.key_results.map((kr) => {
      const monthData = kr.monthly_data.find((md) => md.month === selectedMonth);
      const prevMonthData = previousMonth
        ? kr.monthly_data.find((md) => md.month === previousMonth)
        : null;

      if (!monthData) {
        return [
          { text: `${kr.title}\n${kr.metric} ${kr.unit ? `(${kr.unit})` : ''}`, style: 'krCell' },
          { text: 'N/A', style: 'krCell', alignment: 'right' },
          { text: 'N/A', style: 'krCell', alignment: 'right' },
          { text: 'N/A', style: 'krCell', alignment: 'right' },
          { text: 'Not Set', style: 'krCell', alignment: 'center', color: '#9ca3af' },
          { text: 'N/A', style: 'krCell', alignment: 'center' },
        ];
      }

      const isInverseMetric = kr.inverse_metric === 1;
      const { status, completionPercentage } = calculateStatus(
        monthData.actual,
        monthData.target,
        isInverseMetric
      );
      const trend = calculateTrend(monthData.actual, prevMonthData?.actual ?? null);

      // Status styling
      const statusColor =
        status === 'green' ? '#10b981' : status === 'orange' ? '#f59e0b' : status === 'red' ? '#ef4444' : '#9ca3af';
      const statusLabel =
        status === 'green' ? 'On Track' : status === 'orange' ? 'Under-Watch' : status === 'red' ? 'Off Track' : 'Not Set';

      // Trend styling (inverted for inverse metrics)
      const trendColor = isInverseMetric
        ? trend.direction === 'up'
          ? '#ef4444' // Red for up (bad for inverse)
          : trend.direction === 'down'
          ? '#10b981' // Green for down (good for inverse)
          : '#6b7280'
        : trend.direction === 'up'
        ? '#10b981' // Green for up (good for normal)
        : trend.direction === 'down'
        ? '#ef4444' // Red for down (bad for normal)
        : '#6b7280';

      const trendText =
        trend.display === 'N/A'
          ? 'N/A'
          : `${trend.direction === 'up' ? 'Up' : trend.direction === 'down' ? 'Down' : 'Stable'} ${Math.abs(trend.percentage).toFixed(1)}%`;

      return [
        { text: `${kr.title}\n${kr.metric} ${kr.unit ? `(${kr.unit})` : ''}`, style: 'krCell' },
        { text: monthData.target.toLocaleString(), style: 'krCell', alignment: 'right' },
        { text: monthData.actual.toLocaleString(), style: 'krCell', alignment: 'right' },
        { text: `${completionPercentage.toFixed(0)}%`, style: 'krCell', alignment: 'right' },
        { text: statusLabel, style: 'krCell', alignment: 'center', color: statusColor, bold: true },
        { text: trendText, style: 'krCell', alignment: 'center', color: trendColor, bold: true },
      ];
    });

    // Build objective block
    const block: any = {
      stack: [
        // Objective header with gray background
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [
                    { text: objective.title, style: 'objTitle' },
                    ...(objective.description
                      ? [{ text: objective.description, style: 'objDescription' }]
                      : []),
                    {
                      columns: [
                        {
                          text: 'Owner:',
                          style: 'objMetaLabel',
                          width: 'auto',
                        },
                        {
                          text: 'Razvan',
                          style: 'objMetaValue',
                          width: 'auto',
                          margin: [4, 0, 20, 0],
                        },
                        {
                          text: 'Driver:',
                          style: 'objMetaLabel',
                          width: 'auto',
                        },
                        {
                          text: objective.driver || 'Not set',
                          style: 'objMetaValue',
                          width: 'auto',
                          margin: [4, 0, 0, 0],
                        },
                      ],
                      margin: [0, 6, 0, 0],
                    },
                    ...(comment && comment.comment
                      ? [
                          {
                            text: comment.comment,
                            style: 'objComment',
                            margin: [0, 6, 0, 0],
                          },
                        ]
                      : []),
                  ],
                  fillColor: '#f3f4f6',
                  margin: [10, 10, 10, 10],
                },
              ],
            ],
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 8],
        },

        // Key Results table
        {
          table: {
            headerRows: 1,
            widths: ['*', 55, 55, 50, 70, 65],
            body: [
              // Header row
              [
                { text: 'Key Result', style: 'tableHeader' },
                { text: 'Target', style: 'tableHeader', alignment: 'right' },
                { text: 'Actual', style: 'tableHeader', alignment: 'right' },
                { text: 'Complete', style: 'tableHeader', alignment: 'right' },
                { text: 'Status', style: 'tableHeader', alignment: 'center' },
                { text: 'Trend', style: 'tableHeader', alignment: 'center' },
              ],
              // Data rows
              ...krRows,
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#e5e7eb',
            vLineColor: () => '#e5e7eb',
            paddingLeft: () => 6,
            paddingRight: () => 6,
            paddingTop: () => 6,
            paddingBottom: () => 6,
          },
        },
      ],
      unbreakable: true, // Keep objective and its KRs together
      margin: [0, 0, 0, 20],
    };

    // Add page break after every 2nd objective (2 objectives per page)
    // objIndex: 0, 1 → page 1, then break
    // objIndex: 2, 3 → page 2, then break
    const isEvenIndex = (objIndex + 1) % 2 === 0;
    const isNotLast = objIndex < visibleObjectives.length - 1;

    if (isEvenIndex && isNotLast) {
      return [block, { text: '', pageBreak: 'after' as const }];
    }

    return [block];
  });

  // Build PDF document
  const docDefinition: any = {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [40, 60, 40, 60],

    header: {
      margin: [40, 20, 40, 0],
      columns: [
        { text: title, style: 'header', alignment: 'left' },
        { text: formattedMonth, style: 'subheader', alignment: 'right' },
      ],
    },

    footer: (currentPage: number, pageCount: number) => ({
      margin: [40, 20],
      columns: [
        { text: `Generated: ${generatedDate}`, style: 'footer', alignment: 'left' },
        { text: `Page ${currentPage} of ${pageCount}`, style: 'footer', alignment: 'right' },
      ],
    }),

    content: [
      // Summary section
      {
        text: 'Summary',
        style: 'sectionTitle',
        margin: [0, 0, 0, 12],
      },
      {
        columns: [
          {
            width: '25%',
            stack: [
              { text: visibleObjectives.length.toString(), style: 'summaryNumber' },
              { text: 'Objectives', style: 'summaryLabel' },
            ],
          },
          {
            width: '25%',
            stack: [
              { text: totalKRs.toString(), style: 'summaryNumber' },
              { text: 'Key Results', style: 'summaryLabel' },
            ],
          },
          {
            width: '50%',
            stack: [
              { text: 'Status Distribution', style: 'summaryLabel', margin: [0, 0, 0, 6] },
              // Visual bar chart
              {
                canvas: (() => {
                  const barHeight = 24;
                  const barWidth = 250;
                  const totalItems = totalKRs || 1; // Avoid division by zero
                  
                  const onTrackWidth = (onTrackCount / totalItems) * barWidth;
                  const underWatchWidth = (underWatchCount / totalItems) * barWidth;
                  const offTrackWidth = (offTrackCount / totalItems) * barWidth;
                  
                  const bars: any[] = [];
                  let currentX = 0;
                  
                  // On Track (green)
                  if (onTrackCount > 0) {
                    bars.push({
                      type: 'rect',
                      x: currentX,
                      y: 0,
                      w: onTrackWidth,
                      h: barHeight,
                      color: '#10b981',
                    });
                    currentX += onTrackWidth;
                  }
                  
                  // Under Watch (orange)
                  if (underWatchCount > 0) {
                    bars.push({
                      type: 'rect',
                      x: currentX,
                      y: 0,
                      w: underWatchWidth,
                      h: barHeight,
                      color: '#f59e0b',
                    });
                    currentX += underWatchWidth;
                  }
                  
                  // Off Track (red)
                  if (offTrackCount > 0) {
                    bars.push({
                      type: 'rect',
                      x: currentX,
                      y: 0,
                      w: offTrackWidth,
                      h: barHeight,
                      color: '#ef4444',
                    });
                  }
                  
                  return bars;
                })(),
                margin: [0, 0, 0, 8],
              },
              {
                columns: [
                  {
                    stack: [
                      { text: 'On Track', style: 'statusLabel', color: '#10b981' },
                      { text: onTrackCount.toString(), style: 'statusValue', color: '#10b981' },
                    ],
                    width: 'auto',
                    margin: [0, 0, 12, 0],
                  },
                  {
                    stack: [
                      { text: 'Under-Watch', style: 'statusLabel', color: '#f59e0b' },
                      { text: underWatchCount.toString(), style: 'statusValue', color: '#f59e0b' },
                    ],
                    width: 'auto',
                    margin: [0, 0, 12, 0],
                  },
                  {
                    stack: [
                      { text: 'Off Track', style: 'statusLabel', color: '#ef4444' },
                      { text: offTrackCount.toString(), style: 'statusValue', color: '#ef4444' },
                    ],
                    width: 'auto',
                  },
                ],
              },
            ],
          },
        ],
        margin: [0, 0, 0, 30],
      },

      // Objectives section header
      {
        text: 'Objectives & Key Results',
        style: 'sectionTitle',
        margin: [0, 0, 0, 15],
      },

      // Objective blocks (flattened)
      ...objectiveBlocks.flat(),
    ],

    styles: {
      header: {
        fontSize: 18,
        bold: true,
        color: '#1f2937',
      },
      subheader: {
        fontSize: 12,
        color: '#6b7280',
      },
      footer: {
        fontSize: 9,
        color: '#9ca3af',
      },
      sectionTitle: {
        fontSize: 16,
        bold: true,
        color: '#1f2937',
      },
      summaryNumber: {
        fontSize: 24,
        bold: true,
        color: '#2563eb',
        margin: [0, 0, 0, 4],
      },
      summaryLabel: {
        fontSize: 10,
        color: '#6b7280',
      },
      statusLabel: {
        fontSize: 9,
        bold: true,
        margin: [0, 0, 0, 3],
      },
      statusValue: {
        fontSize: 18,
        bold: true,
      },
      objTitle: {
        fontSize: 14,
        bold: true,
        color: '#1f2937',
      },
      objDescription: {
        fontSize: 10,
        color: '#6b7280',
        margin: [0, 4, 0, 0],
      },
      objMetaLabel: {
        fontSize: 10,
        bold: true,
        color: '#374151',
      },
      objMetaValue: {
        fontSize: 10,
        color: '#1f2937',
      },
      objComment: {
        fontSize: 10,
        color: '#1e40af',
        italics: true,
      },
      tableHeader: {
        fontSize: 9,
        bold: true,
        color: '#374151',
        fillColor: '#f9fafb',
      },
      krCell: {
        fontSize: 9,
        color: '#1f2937',
      },
    },

    defaultStyle: {
      font: 'Roboto',
    },
  };

  // Generate and download PDF
  const fileName = `OKR-Dashboard-${selectedMonth}.pdf`;
  pdfMake.createPdf(docDefinition).download(fileName);
};

