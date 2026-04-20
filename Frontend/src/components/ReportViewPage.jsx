import React, { useState, useEffect } from 'react';
import '../styles/ReportViewPage.css';
import { getAllReports, getReportById } from '../db';

export default function ReportViewPage() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const allReports = getAllReports();
    setReports(allReports);
    if (allReports.length > 0) {
      setSelectedReport(allReports[0]);
    }
  }, []);

  const handleSelectReport = (reportId) => {
    const report = getReportById(reportId);
    setSelectedReport(report);
  };

  const downloadCSV = (report) => {
    if (!report) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Header
    csvContent += `Report: ${report.title}\n`;
    csvContent += `Department: ${report.department}\n`;
    csvContent += `Date: ${report.date}\n`;
    csvContent += `Period: ${report.period}\n\n`;

    // Summary
    if (report.totalProduced) {
      csvContent += `Total Produced,${report.totalProduced}\n`;
      csvContent += `Quality Rate,${report.qualityRate}%\n`;
      csvContent += `Efficiency,${report.efficiency}%\n\n`;
    } else if (report.totalWorkers) {
      csvContent += `Total Workers,${report.totalWorkers}\n`;
      csvContent += `Present Today,${report.presentToday}\n`;
      csvContent += `Attendance Rate,${report.attendanceRate}%\n\n`;
    } else if (report.totalEquipment) {
      csvContent += `Total Equipment,${report.totalEquipment}\n`;
      csvContent += `Operational,${report.operationalEquipment}\n`;
      csvContent += `Uptime,${report.uptime}%\n\n`;
    }

    // Data table header
    const headers = Object.keys(report.data[0]);
    csvContent += headers.join(',') + '\n';

    // Data rows
    report.data.forEach(row => {
      csvContent += Object.values(row).join(',') + '\n';
    });

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${report.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = (report) => {
    if (!report) return;

    let pdfContent = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 1200 >>
stream
BT
/F1 16 Tf
50 750 Td
(${report.title}) Tj
0 -30 Td
/F1 12 Tf
(Department: ${report.department}) Tj
0 -20 Td
(Date: ${report.date}) Tj
0 -20 Td
(Period: ${report.period}) Tj
0 -30 Td
/F1 11 Tf
`;

    // Add report summary
    if (report.totalProduced) {
      pdfContent += `(Total Produced: ${report.totalProduced}) Tj\n0 -15 Td\n`;
      pdfContent += `(Quality Rate: ${report.qualityRate}%) Tj\n0 -15 Td\n`;
      pdfContent += `(Efficiency: ${report.efficiency}%) Tj\n0 -30 Td\n`;
    } else if (report.totalWorkers) {
      pdfContent += `(Total Workers: ${report.totalWorkers}) Tj\n0 -15 Td\n`;
      pdfContent += `(Present Today: ${report.presentToday}) Tj\n0 -15 Td\n`;
      pdfContent += `(Attendance Rate: ${report.attendanceRate}%) Tj\n0 -30 Td\n`;
    } else if (report.totalEquipment) {
      pdfContent += `(Total Equipment: ${report.totalEquipment}) Tj\n0 -15 Td\n`;
      pdfContent += `(Operational: ${report.operationalEquipment}) Tj\n0 -15 Td\n`;
      pdfContent += `(Uptime: ${report.uptime}%) Tj\n0 -30 Td\n`;
    }

    // Add data table
    report.data.forEach(row => {
      const values = Object.values(row).join(' | ');
      pdfContent += `(${values}) Tj\n0 -15 Td\n`;
    });

    pdfContent += `
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000001499 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
1577
%%EOF
`;

    // Create download link
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${report.title.replace(/\s+/g, '_')}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="report-view-container">
      <div className="report-header">
        <h2>📋 View Reports</h2>
        <p>Access and download operational reports</p>
      </div>

      <div className="report-layout">
        {/* Reports List */}
        <div className="reports-sidebar">
          <h3>Available Reports</h3>
          <div className="reports-list">
            {reports.map(report => (
              <button
                key={report.id}
                className={`report-item ${selectedReport?.id === report.id ? 'active' : ''}`}
                onClick={() => handleSelectReport(report.id)}
              >
                <div className="report-item-icon">📄</div>
                <div className="report-item-info">
                  <p className="report-item-title">{report.title}</p>
                  <p className="report-item-date">{new Date(report.date).toLocaleDateString()}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Report Display */}
        {selectedReport && (
          <div className="report-content">
            <div className="report-header-info">
              <h3>{selectedReport.title}</h3>
              <div className="report-metadata">
                <span className="metadata">📅 {new Date(selectedReport.date).toLocaleDateString()}</span>
                <span className="metadata">🏢 {selectedReport.department}</span>
                <span className="metadata">📊 {selectedReport.period}</span>
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="report-summary">
              <h4>Summary</h4>
              <div className="summary-grid">
                {selectedReport.totalProduced && (
                  <>
                    <div className="summary-card">
                      <span className="summary-label">Total Produced</span>
                      <span className="summary-value">{selectedReport.totalProduced.toLocaleString()}</span>
                    </div>
                    <div className="summary-card">
                      <span className="summary-label">Quality Rate</span>
                      <span className="summary-value">{selectedReport.qualityRate}%</span>
                    </div>
                    <div className="summary-card">
                      <span className="summary-label">Efficiency</span>
                      <span className="summary-value">{selectedReport.efficiency}%</span>
                    </div>
                  </>
                )}
                {selectedReport.totalWorkers && (
                  <>
                    <div className="summary-card">
                      <span className="summary-label">Total Workers</span>
                      <span className="summary-value">{selectedReport.totalWorkers}</span>
                    </div>
                    <div className="summary-card">
                      <span className="summary-label">Present Today</span>
                      <span className="summary-value">{selectedReport.presentToday}</span>
                    </div>
                    <div className="summary-card">
                      <span className="summary-label">Attendance Rate</span>
                      <span className="summary-value">{selectedReport.attendanceRate}%</span>
                    </div>
                  </>
                )}
                {selectedReport.totalEquipment && (
                  <>
                    <div className="summary-card">
                      <span className="summary-label">Total Equipment</span>
                      <span className="summary-value">{selectedReport.totalEquipment}</span>
                    </div>
                    <div className="summary-card">
                      <span className="summary-label">Operational</span>
                      <span className="summary-value">{selectedReport.operationalEquipment}</span>
                    </div>
                    <div className="summary-card">
                      <span className="summary-label">Uptime</span>
                      <span className="summary-value">{selectedReport.uptime}%</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Detailed Data Table */}
            <div className="report-table">
              <h4>Detailed Data</h4>
              <table>
                <thead>
                  <tr>
                    {Object.keys(selectedReport.data[0]).map(key => (
                      <th key={key}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedReport.data.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((value, cellIdx) => (
                        <td key={cellIdx}>{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Download Buttons */}
            <div className="download-actions">
              <button 
                className="btn-download csv"
                onClick={() => downloadCSV(selectedReport)}
              >
                📥 Download as CSV
              </button>
              <button 
                className="btn-download pdf"
                onClick={() => downloadPDF(selectedReport)}
              >
                📥 Download as PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
