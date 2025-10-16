'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, Edit2, Send, Check, Loader2, Eye, FileText, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import dynamic from 'next/dynamic'

// Import these at the top - no dynamic import needed in the function
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

export default function LetterReviewPage() {
  const params = useParams()
  const router = useRouter()
  const letterId = params.letterId as string

  const [letterData, setLetterData] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [plainTextContent, setPlainTextContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  
  const editorRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    try {
      const storedLetter = localStorage.getItem('currentLetter');
      if (storedLetter) {
        const data = JSON.parse(storedLetter);
        console.log('Loaded letter data:', data);
        
        setLetterData(data);
        
        const htmlContent = data.letterHtml || data.letter_html || '';
        setEditedContent(htmlContent);
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        setPlainTextContent(tempDiv.textContent || tempDiv.innerText || '');
      } else {
        console.log('No letter data found in localStorage');
      }
    } catch (error) {
      console.error('Error loading letter data:', error);
      alert('Error loading letter data. Please try again.');
      router.push('/');
    }
  }, [router]);

  const handleEdit = () => {
    setIsEditing(true)
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus()
      }
    }, 50)
  }

  const handleSave = () => {
    setIsEditing(false)
    const formattedContent = plainTextContent
      .split('\n')
      .map(para => para.trim())
      .filter(para => para.length > 0)
      .map(para => `<p>${para}</p>`)
      .join('\n')
    
    setEditedContent(formattedContent)
    setLetterData({
      ...letterData,
      letterHtml: formattedContent
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = editedContent
    setPlainTextContent(tempDiv.textContent || tempDiv.innerText || '')
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
      handleSave()
    }
  }

  useEffect(() => {
    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isEditing, plainTextContent])

  const handleViewPDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          letterContent: editedContent,
          patientInfo: {
            name: letterData.patientName || letterData.patient_name,
            email: letterData.patientEmail || letterData.patient_email,
            address: letterData.patientAddress || letterData.patient_address || "London"
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('text/html')) {
        const htmlContent = await response.text();
        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
          previewWindow.document.write(htmlContent);
          previewWindow.document.close();
        }
      } else if (contentType && contentType.includes('application/pdf')) {
        const pdfBlob = await response.blob();
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      } else {
        throw new Error('Unexpected response format');
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF preview. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  }

  const generatePDFBase64 = async (letterContent: string, patientInfo: any): Promise<string> => {
  try {
    // Create a temporary div to render the HTML
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '595px'; // A4 width at 72 DPI (smaller)
    tempDiv.style.padding = '30px';
    tempDiv.style.background = 'white';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
    tempDiv.style.fontSize = '11px'; // Even smaller font
    
    // Create the HTML content with minimal styling
    tempDiv.innerHTML = `
      <div style="font-family: Arial, sans-serif; line-height: 1.4; color: #000; font-size: 11px;">
        <div style="text-align: center; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #ccc;">
          <div style="font-size: 14px; font-weight: bold;">Mr MANGATTIL RAJESH</div>
          <div style="font-size: 10px;">FRCS (Gen) MCh (Orth) FRCS (Orth) MBA</div>
          <div style="font-size: 9px;">Office: 0203 1500 222 | Mob: 07928 333 999</div>
        </div>
        
        <div style="margin: 10px 0; font-size: 11px;">
          ${new Date().toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
        
        <div style="margin-bottom: 10px; font-size: 11px;">
          Ms ${patientInfo.name || 'Patient'}<br/>
          ${patientInfo.email || ''}<br/>
          ${(patientInfo.address || 'London').split('\n').join('<br/>')}
        </div>
        
        <div style="margin: 10px 0; line-height: 1.4; font-size: 11px;">
          ${letterContent}
        </div>
        
        <div style="margin-top: 20px; font-size: 11px;">
          <p>Yours sincerely,</p>
          <br/>
          <p><strong>Mr MANGATTIL RAJESH FRCS (Orth) MBA</strong><br/>
          Clinical Lead in Spine Surgery<br/>
          Consultant Spine Surgeon<br/>
          Royal London Hospital<br/>
          LONDON</p>
        </div>
      </div>
    `;
    
    // Add to document temporarily
    document.body.appendChild(tempDiv);
    
    try {
      // Generate canvas with VERY LOW resolution
      const canvas = await html2canvas(tempDiv, {
        scale: 0.75, // Even lower scale
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 595,
        windowHeight: 842
      });
      
      // Convert to PDF with maximum compression
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
        compress: true
      });
      
      // Calculate dimensions
      const imgWidth = 595.28;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Convert to JPEG with LOW quality
      const imgData = canvas.toDataURL('image/jpeg', 0.3); // 30% quality
      
      // Add single page only
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, 841.89));
      
      // Get base64 string
      const pdfOutput = pdf.output('datauristring');
      
      if (!pdfOutput.startsWith('data:application/pdf')) {
        throw new Error('Generated output is not a PDF');
      }
      
      const pdfBase64 = pdfOutput.split(',')[1];
      
      // Check size
      const sizeInMB = (pdfBase64.length * 0.75 / 1024 / 1024).toFixed(2);
      console.log('PDF size:', sizeInMB, 'MB');
      
      // Clean up
      document.body.removeChild(tempDiv);
      
      // If STILL too large, throw error
      if (parseFloat(sizeInMB) > 8) {
        throw new Error(`PDF still too large (${sizeInMB}MB). Letter may be too long.`);
      }
      
      return pdfBase64;
      
    } catch (error) {
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv);
      }
      throw error;
    }
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

  const handleSendLetter = async () => {
    setIsSending(true)
    setStatusMessage('Generating PDF...')
    
   try {
  // Step 1: Generate PDF base64
  let pdfBase64 = '';
  const patientInfo = {
    name: letterData.patientName || letterData.patient_name,
    email: letterData.patientEmail || letterData.patient_email,
    address: letterData.patientAddress || letterData.patient_address || "London"
  };
  
  try {
    pdfBase64 = await generatePDFBase64(editedContent, patientInfo);
    
    // Verify it's actually a PDF
    if (!pdfBase64.startsWith('JVBERi0x')) {
      throw new Error('Generated base64 is not a PDF (should start with JVBERi0x)');
    }
    
    const sizeInMB = (pdfBase64.length * 0.75 / 1024 / 1024).toFixed(2);
    console.log('PDF generated successfully');
    console.log('Base64 length:', pdfBase64.length);
    console.log('PDF size:', sizeInMB, 'MB');
    console.log('First 50 chars:', pdfBase64.substring(0, 50));
    
    if (parseFloat(sizeInMB) > 10) {
      throw new Error(`PDF too large (${sizeInMB}MB). Maximum size is 10MB.`);
    }
    
  } catch (pdfError) {
  console.error('PDF generation failed:', pdfError);
  // Fix the TypeScript error by properly typing the error
  const errorMessage = pdfError instanceof Error ? pdfError.message : String(pdfError);
  alert(`PDF generation failed: ${errorMessage}`);
  setIsSending(false);
  setStatusMessage('');
  return; // Stop here - don't send without a valid PDF
}
  
  setStatusMessage('Sending email with PDF attachment...')
      
      // Step 2: Format letter ID
      let formattedLetterId = letterId
      if (letterId.length === 32 && !letterId.includes('-')) {
        formattedLetterId = [
          letterId.slice(0, 8),
          letterId.slice(8, 12),
          letterId.slice(12, 16),
          letterId.slice(16, 20),
          letterId.slice(20, 32)
        ].join('-')
      }

      // Step 3: Send to N8N with PDF data
      const filename = `clinicletter_${(letterData.patientName || 'patient')
        .toLowerCase()
        .replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      
      const payload = {
        letter_id: formattedLetterId,
        letter_html: editedContent,
        pdf_base64: pdfBase64, // This is the actual PDF data
        filename: filename,
        patient_name: letterData.patientName || letterData.patient_name,
        patient_email: letterData.patientEmail || letterData.patient_email,
        patient_phone: letterData.patientPhone || letterData.patient_phone || '',
        approved_by: 'Mr Mangattil Rajesh',
        send_email: true,
        send_whatsapp: false
      };
      
      console.log('Sending to N8N:', {
        ...payload,
        pdf_base64: payload.pdf_base64 ? `${payload.pdf_base64.substring(0, 50)}...` : 'none'
      });
      
      const response = await fetch('https://mangattilrajesh.app.n8n.cloud/webhook/sendclinicletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error('Response not OK:', response.status, response.statusText)
        throw new Error('Failed to send letter')
      }

      // Step 4: Handle response
      let result
      try {
        const responseText = await response.text()
        console.log('Raw response:', responseText)
        
        if (responseText) {
          result = JSON.parse(responseText)
        } else {
          console.log('Empty response, treating as failure')
          result = { success: false, message: 'No response from server' }
        }
      } catch (e) {
        console.log('Response parsing error:', e)
        if (response.ok) {
          result = { success: true }
        } else {
          throw new Error('Invalid response from server')
        }
      }
      
      if (result.success || response.ok) {
        setStatusMessage('✅ Email with PDF sent successfully!')
        setSent(true)
        
        setTimeout(() => {
          router.push('/')
        }, 2500)
      } else {
        throw new Error(result.message || 'Failed to send letter')
      }
      
   } catch (error) {
  console.error('Error sending letter:', error);
  const errorMessage = error instanceof Error ? error.message : 'Failed to send letter';
  setStatusMessage('');
  alert(errorMessage);
} finally {
  setIsSending(false);
}
  }

  if (!letterData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-500 to-blue-600 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-500 via-purple-600 to-blue-600">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <button onClick={() => router.push('/')} className="p-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold">Review Letter</h1>
        <div className="text-right">
          <p className="text-xs opacity-80">Letter ID</p>
          <p className="text-xs font-mono">{letterId.slice(0, 8)}...</p>
        </div>
      </div>

      {/* Patient Info Card */}
      <div className="px-4 mt-2">
        <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-white">
          <h2 className="text-lg font-semibold">{letterData.patientName}</h2>
          <p className="text-sm opacity-90">{letterData.patientEmail}</p>
        </div>
      </div>

      {/* Transcript Dropdown */}
      <div className="px-4 mt-4">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-full bg-white/10 backdrop-blur rounded-lg p-3 text-white flex items-center justify-between hover:bg-white/20 transition-colors"
        >
          <span className="text-sm font-medium">View Original Transcript</span>
          {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {showTranscript && (
          <div className="mt-2 bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-sm text-white/90 italic">
              {letterData.transcript}
            </p>
          </div>
        )}
      </div>

      {/* Letter Content */}
      <div className="px-4 mt-4 pb-32">
        <div className="bg-white rounded-2xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-gray-900">Letter Content</h3>
            <div className="flex gap-2">
              {!isEditing && (
                <button
                  onClick={handleViewPDF}
                  disabled={isGeneratingPDF}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm"
                >
                  {isGeneratingPDF ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{isGeneratingPDF ? 'Generating...' : 'Preview PDF'}</span>
                </button>
              )}
              {isEditing && (
                <>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all transform hover:scale-105"
                  >
                    <Check className="w-4 h-4" />
                    <span className="font-medium">Save</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="relative">
              <div className="absolute -top-2 right-2 z-10">
                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-medium">
                  Editing
                </span>
              </div>
              <textarea
                ref={editorRef}
                value={plainTextContent}
                onChange={(e) => setPlainTextContent(e.target.value)}
                className="w-full min-h-[400px] max-h-[500px] p-4 border-2 border-purple-400 rounded-lg focus:outline-none focus:ring-3 focus:ring-purple-500/30 focus:border-purple-500 text-gray-800 bg-white resize-none transition-all"
                style={{ 
                  lineHeight: '1.8',
                  fontSize: '15px',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
                placeholder="Type or edit your letter content here..."
                autoFocus
              />
              <div className="mt-2 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  💡 Tip: Click outside to save automatically
                </span>
                <span className="text-xs text-gray-400">
                  {plainTextContent.length} characters
                </span>
              </div>
            </div>
          ) : (
            <div 
              onClick={handleEdit}
              className="min-h-[400px] max-h-[500px] overflow-y-auto p-4 border-2 border-transparent hover:border-purple-200 rounded-lg bg-gray-50 hover:bg-white text-gray-800 cursor-text transition-all duration-200 relative group"
              dangerouslySetInnerHTML={{ __html: editedContent }}
              style={{ lineHeight: '1.8' }}
            />
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-blue-700 via-blue-600/95 to-transparent backdrop-blur-sm">
        {!sent ? (
          <button
            onClick={handleSendLetter}
            disabled={isSending || isEditing}
            className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${
              isSending || isEditing
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
            }`}
          >
            {isSending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{statusMessage || 'Processing...'}</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Approve & Send to Patient</span>
              </>
            )}
          </button>
        ) : (
          <div className="text-center py-4">
            <div className="bg-green-500 rounded-2xl py-4 px-6">
              <div className="flex items-center justify-center gap-2 text-white">
                <Check className="w-6 h-6" />
                <span className="font-semibold text-lg">Letter Sent Successfully!</span>
              </div>
              <p className="text-white/90 text-sm mt-1">Redirecting to appointments...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}