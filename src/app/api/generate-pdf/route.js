// src/app/api/generate-pdf/route.js
// Modified to support both preview (HTML) and binary PDF generation

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Generating PDF...');
    
    const letterHtmlContent = body.letterContent || '';
    const patientInfo = body.patientInfo || {};
    const returnType = body.returnType || 'html'; // 'html' for preview, 'base64' for sending
    
    // Read logo as base64
    let logoBase64 = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'assets', 'dr-rajesh', 'logo.png');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      }
    } catch (err) {
      console.error('Logo error:', err);
    }
    
    // Clean content
    const cleanContent = letterHtmlContent
      .replace(/<br\s*\/?>/gi, '<br>')
      .replace(/<\/p>\s*<p>/gi, '</p><p>')
      .replace(/&nbsp;/g, ' ')
      .trim();
    
    const patientName = (patientInfo.name || 'patient').replace(/\s+/g, '_').toLowerCase();
    const fileName = `clinicletter_${patientName}.pdf`;
    
    // If requesting base64 (for sending emails), return a simpler format
    if (returnType === 'base64') {
      // Create a simplified HTML that can be converted to base64
      const simpleHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 40px;
                color: #333;
              }
              .header {
                text-align: center;
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 2px solid #ddd;
              }
              .logo {
                width: 60px;
                height: 60px;
                margin-bottom: 10px;
              }
              .doctor-name {
                font-size: 20px;
                font-weight: bold;
                margin: 10px 0;
              }
              .credentials {
                font-size: 14px;
                color: #666;
              }
              .date {
                margin: 30px 0;
              }
              .content {
                margin: 30px 0;
                line-height: 1.8;
              }
              .signature {
                margin-top: 60px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" class="logo" />` : ''}
              <div class="doctor-name">Mr MANGATTIL RAJESH</div>
              <div class="credentials">FRCS (Gen) MCh (Orth) FRCS (Orth) MBA</div>
              <div>Office: 0203 1500 222 | Mob: 07928 333 999</div>
            </div>
            
            <div class="date">
              ${new Date().toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </div>
            
            <div>
              Ms ${patientInfo.name || 'Patient'}<br/>
              ${patientInfo.email || ''}<br/>
              ${patientInfo.address || 'London'}
            </div>
            
            <div class="content">
              ${cleanContent}
            </div>
            
            <div class="signature">
              <p>Yours sincerely,</p>
              <br/><br/>
              <p><strong>Mr MANGATTIL RAJESH FRCS (Orth) MBA</strong><br/>
              Clinical Lead in Spine Surgery<br/>
              Consultant Spine Surgeon<br/>
              Royal London Hospital<br/>
              LONDON</p>
            </div>
          </body>
        </html>
      `;
      
      // Convert HTML to base64
      const htmlBase64 = Buffer.from(simpleHtml).toString('base64');
      
      // Return JSON with base64 data
      return NextResponse.json({
        success: true,
        base64: htmlBase64,
        filename: fileName,
        type: 'html' // Indicate this is HTML that needs PDF conversion in N8N
      });
    }
    
    // For preview, return the existing HTML with download button
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Medical Letter - ${patientInfo.name || 'Patient'}</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
            
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #000;
              background: #f5f5f5;
              margin: 0;
              padding: 20px;
            }
            
            .page {
              max-width: 210mm;
              margin: 0 auto;
              padding: 30mm 25mm;
              background: white;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            
            .header {
              text-align: center;
              margin-bottom: 40px;
            }
            
            .logo {
              width: 60px;
              height: 60px;
              margin: 0 auto 20px;
              display: block;
            }
            
            .doctor-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            
            .credentials {
              font-size: 13px;
              margin-bottom: 5px;
            }
            
            .contact {
              font-size: 12px;
              color: #333;
              margin-bottom: 3px;
            }
            
            .date-section {
              margin: 40px 0 25px 0;
              font-size: 14px;
            }
            
            .recipient {
              margin-bottom: 25px;
              font-size: 14px;
              line-height: 1.5;
            }
            
            .letter-content {
              font-size: 14px;
              line-height: 1.8;
              margin-bottom: 30px;
            }
            
            .signature-section {
              margin-top: 60px;
            }
            
            .doctor-footer {
              font-size: 13px;
              line-height: 1.5;
            }
            
            .doctor-footer .name {
              font-weight: bold;
              margin-bottom: 5px;
            }
            
            .download-button {
              position: fixed;
              top: 20px;
              right: 20px;
              background: #4CAF50;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
              font-weight: 500;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .download-button:hover {
              background: #45a049;
            }
            
            .download-button:disabled {
              background: #cccccc;
              cursor: not-allowed;
            }
            
            .download-icon {
              width: 20px;
              height: 20px;
            }
          </style>
        </head>
        <body>
          <button class="download-button no-print" onclick="downloadPDF()" id="downloadBtn">
            <svg class="download-icon" fill="white" viewBox="0 0 24 24">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            Download PDF
          </button>
          
          <div class="page" id="letterContent">
            <div class="header">
              ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" class="logo" />` : ''}
              <div class="doctor-name">Mr MANGATTIL RAJESH</div>
              <div class="credentials">FRCS (Gen) MCh (Orth) FRCS (Orth) MBA</div>
              <div class="contact">Office: 0203 1500 222</div>
              <div class="contact">Mob: 07928 333 999</div>
            </div>

            <div class="date-section">
              ${new Date().toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </div>

            <div class="recipient">
              Ms ${patientInfo.name || 'Patient Name'}<br/>
              ${patientInfo.email ? patientInfo.email + '<br/>' : ''}
              ${(patientInfo.address || 'London\nEN6 8GH').split('\n').join('<br/>')}
            </div>

            <div class="letter-content">
              ${cleanContent}
            </div>

            <div class="signature-section">
              <div class="doctor-footer">
                <div class="name">Mr MANGATTIL RAJESH FRCS (Orth) MBA</div>
                <div>Clinical Lead in Spine Surgery</div>
                <div>Consultant Spine Surgeon</div>
                <div>Royal London Hospital</div>
                <div>LONDON</div>
              </div>
            </div>
          </div>
          
          <script>
            async function downloadPDF() {
              const button = document.getElementById('downloadBtn');
              button.disabled = true;
              button.innerHTML = '<svg class="download-icon" fill="white" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M10 10h4v4h-4z"/></svg> Generating...';
              
              try {
                const { jsPDF } = window.jspdf;
                const element = document.getElementById('letterContent');
                
                const canvas = await html2canvas(element, {
                  scale: 2,
                  useCORS: true,
                  logging: false,
                  backgroundColor: '#ffffff'
                });
                
                const imgWidth = 210;
                const pageHeight = 297;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgData = canvas.toDataURL('image/png');
                
                let heightLeft = imgHeight;
                let position = 0;
                
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
                
                while (heightLeft >= 0) {
                  position = heightLeft - imgHeight;
                  pdf.addPage();
                  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                  heightLeft -= pageHeight;
                }
                
                pdf.save('${fileName}');
                
                button.disabled = false;
                button.innerHTML = '<svg class="download-icon" fill="white" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg> Download PDF';
                
              } catch (error) {
                console.error('Error generating PDF:', error);
                alert('Error generating PDF. Please try again.');
                button.disabled = false;
                button.innerHTML = '<svg class="download-icon" fill="white" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg> Download PDF';
              }
            }
          </script>
        </body>
      </html>
    `;

    return new NextResponse(htmlTemplate, {
      headers: {
        'Content-Type': 'text/html',
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview', details: error.message },
      { status: 500 }
    );
  }
}