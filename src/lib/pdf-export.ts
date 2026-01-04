import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  orientation?: 'portrait' | 'landscape';
}

interface TableColumn {
  header: string;
  key: string;
}

export function exportTableToPDF<T extends Record<string, unknown>>(
  data: T[],
  columns: TableColumn[],
  options: PDFExportOptions
) {
  const { title, subtitle, filename, orientation = 'portrait' } = options;
  
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  // Add title
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(title, 14, 20);

  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, 28);
  }

  // Add date
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, subtitle ? 36 : 28);

  // Prepare table data
  const headers = columns.map(col => col.header);
  const rows = data.map(item => 
    columns.map(col => {
      const value = item[col.key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'number') return value.toLocaleString();
      if (value instanceof Date) return value.toLocaleDateString();
      return String(value);
    })
  );

  // Add table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: subtitle ? 42 : 34,
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [16, 185, 129], // Primary green color
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 10, right: 14, bottom: 10, left: 14 },
  });

  // Save the PDF
  doc.save(`${filename}.pdf`);
}

export function exportReportToPDF(
  reportData: {
    title: string;
    sections: Array<{
      heading: string;
      content: string | Array<{ label: string; value: string | number }>;
    }>;
  },
  filename: string
) {
  const doc = new jsPDF();
  let yPosition = 20;

  // Title
  doc.setFontSize(24);
  doc.setTextColor(40, 40, 40);
  doc.text(reportData.title, 14, yPosition);
  yPosition += 15;

  // Date
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, yPosition);
  yPosition += 15;

  // Sections
  reportData.sections.forEach(section => {
    // Check if we need a new page
    if (yPosition > 260) {
      doc.addPage();
      yPosition = 20;
    }

    // Section heading
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text(section.heading, 14, yPosition);
    yPosition += 8;

    // Section content
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);

    if (typeof section.content === 'string') {
      const lines = doc.splitTextToSize(section.content, 180);
      doc.text(lines, 14, yPosition);
      yPosition += lines.length * 6 + 10;
    } else {
      section.content.forEach(item => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setTextColor(100, 100, 100);
        doc.text(`${item.label}:`, 14, yPosition);
        doc.setTextColor(40, 40, 40);
        doc.text(String(item.value), 80, yPosition);
        yPosition += 7;
      });
      yPosition += 5;
    }
  });

  doc.save(`${filename}.pdf`);
}

export function exportAnalyticsToPDF(
  analytics: {
    period: string;
    tasksCompleted: number;
    tasksTotal: number;
    focusHours: number;
    habitsCompleted: number;
    income: number;
    expenses: number;
    projectsActive: number;
  },
  filename: string
) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(24);
  doc.setTextColor(40, 40, 40);
  doc.text('Analytics Report', 14, 20);

  // Period
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Period: ${analytics.period}`, 14, 30);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38);

  // Stats cards simulation
  const stats = [
    { label: 'Tasks Completed', value: `${analytics.tasksCompleted}/${analytics.tasksTotal}`, color: [16, 185, 129] },
    { label: 'Focus Hours', value: `${analytics.focusHours}h`, color: [59, 130, 246] },
    { label: 'Habits Done', value: String(analytics.habitsCompleted), color: [249, 115, 22] },
    { label: 'Active Projects', value: String(analytics.projectsActive), color: [139, 92, 246] },
  ];

  let xPos = 14;
  let yPos = 55;
  const cardWidth = 43;
  const cardHeight = 30;

  stats.forEach((stat, index) => {
    // Card background
    doc.setFillColor(stat.color[0], stat.color[1], stat.color[2]);
    doc.roundedRect(xPos, yPos, cardWidth, cardHeight, 3, 3, 'F');

    // Card text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(stat.label, xPos + 5, yPos + 10);
    doc.setFontSize(16);
    doc.text(stat.value, xPos + 5, yPos + 22);

    xPos += cardWidth + 5;
    if (index === 1) {
      xPos = 14;
      yPos += cardHeight + 5;
    }
  });

  // Financial summary
  yPos += cardHeight + 20;
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Financial Summary', 14, yPos);
  yPos += 10;

  const financialData = [
    ['Income', `$${analytics.income.toLocaleString()}`],
    ['Expenses', `$${analytics.expenses.toLocaleString()}`],
    ['Net', `$${(analytics.income - analytics.expenses).toLocaleString()}`],
  ];

  autoTable(doc, {
    body: financialData,
    startY: yPos,
    styles: {
      fontSize: 11,
      cellPadding: 5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { halign: 'right', cellWidth: 60 },
    },
    theme: 'plain',
    margin: { left: 14 },
  });

  doc.save(`${filename}.pdf`);
}
