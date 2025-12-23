/**
 * Fix Stuff - PDF Export Utility
 * Company: RentMouse
 * PR #7: PDF Export
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

interface RepairData {
  repair_id?: string;
  item_type: string;
  model_number?: string;
  damage_description: string;
  repair_difficulty: string;
  estimated_time: string;
  repair_steps: any[];
  tools_needed: any[];
  parts_needed: any[];
  safety_tips: string[];
  cost_estimate?: {
    low: number;
    typical: number;
    high: number;
    currency: string;
    parts_breakdown?: Array<{ name: string; cost: number }>;
    tools_cost?: number;
    labor_hours_range?: { min: number; max: number };
    assumptions?: string[];
  };
  time_estimate?: {
    prep: number;
    active: number;
    cure?: number;
    total: number;
    unit: string;
  };
}

/**
 * Generates HTML template for the PDF
 */
function generateHTMLTemplate(repairData: RepairData): string {
  const {
    item_type,
    model_number,
    damage_description,
    repair_difficulty,
    estimated_time,
    repair_steps,
    tools_needed,
    parts_needed,
    safety_tips,
    cost_estimate,
    time_estimate,
  } = repairData;

  const difficultyColor = 
    repair_difficulty === 'easy' ? '#10b981' : 
    repair_difficulty === 'medium' ? '#f59e0b' : '#ef4444';

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Repair Guide - ${item_type}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          padding: 40px;
          background: #ffffff;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #00D9FF;
        }
        
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #00D9FF;
          margin-bottom: 8px;
        }
        
        .tagline {
          font-size: 14px;
          color: #6b7280;
          font-style: italic;
        }
        
        .title {
          font-size: 28px;
          font-weight: bold;
          color: #111827;
          margin: 20px 0 10px;
        }
        
        .subtitle {
          font-size: 16px;
          color: #6b7280;
          margin-bottom: 30px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .info-card {
          background: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #00D9FF;
        }
        
        .info-label {
          font-size: 12px;
          text-transform: uppercase;
          color: #6b7280;
          font-weight: 600;
          margin-bottom: 5px;
        }
        
        .info-value {
          font-size: 16px;
          color: #111827;
          font-weight: 600;
        }
        
        .difficulty-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          color: white;
          background-color: ${difficultyColor};
        }
        
        .section {
          margin-bottom: 30px;
        }
        
        .section-title {
          font-size: 20px;
          font-weight: bold;
          color: #111827;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .section-content {
          color: #374151;
        }
        
        .step {
          margin-bottom: 20px;
          padding: 15px;
          background: #f9fafb;
          border-radius: 8px;
          page-break-inside: avoid;
        }
        
        .step-number {
          display: inline-block;
          width: 30px;
          height: 30px;
          background: #00D9FF;
          color: white;
          border-radius: 50%;
          text-align: center;
          line-height: 30px;
          font-weight: bold;
          margin-right: 10px;
        }
        
        .step-title {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 8px;
          color: #111827;
        }
        
        .step-description {
          color: #4b5563;
          margin-left: 40px;
          line-height: 1.6;
        }
        
        .list-item {
          padding: 10px;
          margin-bottom: 8px;
          background: white;
          border-radius: 6px;
          border-left: 3px solid #00D9FF;
          page-break-inside: avoid;
        }
        
        .list-item-name {
          font-weight: 600;
          color: #111827;
        }
        
        .list-item-detail {
          color: #6b7280;
          font-size: 14px;
        }
        
        .warning-box {
          background: #fef2f2;
          border-left: 4px solid #ef4444;
          padding: 15px;
          margin-bottom: 10px;
          border-radius: 6px;
          page-break-inside: avoid;
        }
        
        .warning-title {
          color: #dc2626;
          font-weight: 600;
          margin-bottom: 5px;
        }
        
        .warning-text {
          color: #991b1b;
          font-size: 14px;
        }
        
        .cost-time-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .cost-card, .time-card {
          background: #f0fdfa;
          padding: 20px;
          border-radius: 10px;
          border: 2px solid #00D9FF;
        }
        
        .cost-range {
          font-size: 24px;
          font-weight: bold;
          color: #00D9FF;
          margin: 10px 0;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
        
        .footer-note {
          margin-bottom: 10px;
          font-style: italic;
        }
        
        @media print {
          body {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <div class="logo">Fix Stuff</div>
        <div class="tagline">AI-Powered Repair Intelligence</div>
      </div>
      
      <!-- Title -->
      <div class="title">${item_type} Repair Guide</div>
      ${model_number ? `<div class="subtitle">Model: ${model_number}</div>` : ''}
      
      <!-- Info Cards -->
      <div class="info-grid">
        <div class="info-card">
          <div class="info-label">Damage Description</div>
          <div class="info-value">${damage_description}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Difficulty Level</div>
          <div class="info-value">
            <span class="difficulty-badge">${repair_difficulty.toUpperCase()}</span>
          </div>
        </div>
        <div class="info-card">
          <div class="info-label">Estimated Time</div>
          <div class="info-value">${estimated_time}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Report Generated</div>
          <div class="info-value">${currentDate}</div>
        </div>
      </div>
      
      ${cost_estimate ? `
      <!-- Cost & Time Estimates -->
      <div class="section">
        <div class="section-title">💰 Cost & Time Estimates</div>
        <div class="cost-time-grid">
          <div class="cost-card">
            <div class="info-label">Estimated Cost Range</div>
            <div class="cost-range">
              ${cost_estimate.currency}${cost_estimate.low} - ${cost_estimate.currency}${cost_estimate.high}
            </div>
            <div class="info-label" style="margin-top: 10px;">Typical Cost</div>
            <div style="font-size: 18px; font-weight: 600; color: #059669;">
              ${cost_estimate.currency}${cost_estimate.typical}
            </div>
            ${cost_estimate.tools_cost ? `
              <div style="margin-top: 10px; font-size: 14px; color: #6b7280;">
                Tools: ${cost_estimate.currency}${cost_estimate.tools_cost}
              </div>
            ` : ''}
          </div>
          ${time_estimate ? `
          <div class="time-card">
            <div class="info-label">Total Time Required</div>
            <div class="cost-range">${time_estimate.total} ${time_estimate.unit}</div>
            <div style="margin-top: 15px; font-size: 14px; color: #374151;">
              <div>Prep: ${time_estimate.prep} min</div>
              <div>Active Work: ${time_estimate.active} min</div>
              ${time_estimate.cure ? `<div>Cure/Dry: ${time_estimate.cure} min</div>` : ''}
            </div>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}
      
      <!-- Repair Steps -->
      <div class="section">
        <div class="section-title">🔧 Step-by-Step Instructions</div>
        ${repair_steps.map((step, index) => `
          <div class="step">
            <div class="step-title">
              <span class="step-number">${index + 1}</span>
              ${typeof step === 'string' ? step : step.title || step.step || `Step ${index + 1}`}
            </div>
            ${step.description ? `
              <div class="step-description">${step.description}</div>
            ` : ''}
            ${step.details ? `
              <div class="step-description">${step.details}</div>
            ` : ''}
          </div>
        `).join('')}
      </div>
      
      <!-- Tools Needed -->
      ${tools_needed && tools_needed.length > 0 ? `
      <div class="section">
        <div class="section-title">🛠️ Tools Required</div>
        ${tools_needed.map(tool => `
          <div class="list-item">
            <div class="list-item-name">${typeof tool === 'string' ? tool : tool.name || tool.tool}</div>
            ${tool.purpose ? `<div class="list-item-detail">${tool.purpose}</div>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}
      
      <!-- Parts Needed -->
      ${parts_needed && parts_needed.length > 0 ? `
      <div class="section">
        <div class="section-title">🔩 Parts & Materials</div>
        ${parts_needed.map(part => `
          <div class="list-item">
            <div class="list-item-name">${typeof part === 'string' ? part : part.name || part.part}</div>
            ${part.spec ? `<div class="list-item-detail">Spec: ${part.spec}</div>` : ''}
            ${part.cost ? `<div class="list-item-detail">Cost: $${part.cost}</div>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}
      
      <!-- Safety Tips -->
      ${safety_tips && safety_tips.length > 0 ? `
      <div class="section">
        <div class="section-title">⚠️ Safety Precautions</div>
        ${safety_tips.map(tip => `
          <div class="warning-box">
            <div class="warning-title">⚠️ Important</div>
            <div class="warning-text">${tip}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}
      
      <!-- Footer -->
      <div class="footer">
        <div class="footer-note">
          This repair guide was generated by Fix Stuff. Always prioritize safety and consult a professional if unsure.
        </div>
        <div>
          © ${new Date().getFullYear()} Fix Stuff - Powered by RentMouse
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Exports repair data as PDF and shares it
 */
export async function exportRepairAsPDF(repairData: RepairData): Promise<boolean> {
  try {
    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (!isAvailable && Platform.OS !== 'web') {
      throw new Error('Sharing is not available on this device');
    }

    // Generate HTML template
    const html = generateHTMLTemplate(repairData);

    // Generate PDF
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    console.log('PDF generated at:', uri);

    // Share the PDF
    if (Platform.OS !== 'web') {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `${repairData.item_type} Repair Guide`,
        UTI: 'com.adobe.pdf',
      });
    } else {
      // On web, trigger download
      const link = document.createElement('a');
      link.href = uri;
      link.download = `${repairData.item_type.replace(/\s+/g, '_')}_Repair_Guide.pdf`;
      link.click();
    }

    return true;
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
}
