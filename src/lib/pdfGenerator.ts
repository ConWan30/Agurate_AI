import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ClaimData {
  id: string;
  event_type: string;
  event_date: string;
  estimated_loss_percentage: number;
  description: string;
  status: string;
  created_at: string;
  field: {
    name: string;
    crop_type: string;
    acreage?: number | null;
    location?: string;
  };
  assessment?: {
    health_score: number;
    stress_level: string;
    analyzed_at: string;
    recommendations?: string;
  };
}

export const generateInsurancePDF = (claim: ClaimData): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Header with branding
  doc.setFillColor(22, 163, 74); // Primary green
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('AgurateAI', 15, 20);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Crop Insurance Claim Report', 15, 30);

  // Report metadata
  yPos = 50;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, pageWidth - 15, yPos, { align: 'right' });
  
  doc.text(`Claim ID: ${claim.id.substring(0, 8).toUpperCase()}`, pageWidth - 15, yPos + 5, { align: 'right' });

  // Claim Information Section
  yPos = 65;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text('Claim Information', 15, yPos);
  
  yPos += 10;
  const claimInfo = [
    ['Event Type', claim.event_type.charAt(0).toUpperCase() + claim.event_type.slice(1)],
    ['Event Date', new Date(claim.event_date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })],
    ['Claim Status', claim.status.toUpperCase()],
    ['Estimated Loss', Number.isFinite(Number(claim.estimated_loss_percentage))
      ? `${claim.estimated_loss_percentage}%`
      : 'Not recorded'],
    ['Created Date', new Date(claim.created_at).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: claimInfo,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 15, right: 15 }
  });

  // Field Information Section
  yPos = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text('Field Information', 15, yPos);
  
  yPos += 10;
  const acreageLabel =
    claim.field.acreage != null && Number.isFinite(Number(claim.field.acreage))
      ? `${claim.field.acreage} acres`
      : 'Not recorded';
  const fieldInfo = [
    ['Field Name', claim.field.name],
    ['Crop Type', claim.field.crop_type.charAt(0).toUpperCase() + claim.field.crop_type.slice(1)],
    ['Acreage', acreageLabel],
    ...(claim.field.location ? [['Location', claim.field.location]] : []),
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: fieldInfo,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' }
    },
    margin: { left: 15, right: 15 }
  });

  // AI Assessment Data (if available)
  if (claim.assessment) {
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    // Check if we need a new page
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(22, 163, 74);
    doc.text('AI Assessment Data (decision aid)', 15, yPos);
    
    // Highlight box for AI data
    doc.setFillColor(240, 253, 244); // Light green
    doc.rect(15, yPos + 5, pageWidth - 30, 55, 'F');
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(0.5);
    doc.rect(15, yPos + 5, pageWidth - 30, 55, 'S');
    
    yPos += 15;
    const healthLabel =
      claim.assessment.health_score != null && Number.isFinite(Number(claim.assessment.health_score))
        ? `${claim.assessment.health_score}/100`
        : 'Not recorded';
    const assessmentInfo = [
      ['Health Score', healthLabel],
      ['Stress Level', (claim.assessment.stress_level || 'not recorded').toUpperCase()],
      ['Analysis Date', new Date(claim.assessment.analyzed_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: assessmentInfo,
      theme: 'plain',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 'auto' }
      },
      margin: { left: 20, right: 20 }
    });
  }

  // Description Section
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Check if we need a new page
  if (yPos > pageHeight - 60) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text('Damage Description', 15, yPos);
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const splitDescription = doc.splitTextToSize(claim.description || 'No additional description provided', pageWidth - 30);
  doc.text(splitDescription, 15, yPos);

  // Footer
  const footerY = pageHeight - 20;
  doc.setFillColor(245, 245, 245);
  doc.rect(0, footerY - 10, pageWidth, 30, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'italic');
  doc.text('This report was generated by AgurateAI', pageWidth / 2, footerY, { align: 'center' });
  doc.text('AI-Powered Crop Health Monitoring for Louisiana Delta Agriculture', pageWidth / 2, footerY + 5, { align: 'center' });
  doc.text('For questions or verification, visit agurateai.com', pageWidth / 2, footerY + 10, { align: 'center' });

  return doc;
};

export const downloadClaimPDF = (claim: ClaimData): void => {
  const doc = generateInsurancePDF(claim);
  const fileName = `insurance-claim-${claim.id.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const getClaimPDFBlob = (claim: ClaimData): Blob => {
  const doc = generateInsurancePDF(claim);
  return doc.output('blob');
};
