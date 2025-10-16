// /lib/templates/dr-rajesh-letterhead.js
export const LETTERHEAD_TEMPLATE = {
  header: `
    <div class="letterhead-header">
      <img src="/assets/spine-logo.png" class="logo" />
      <h1>Mr MANGATTIL RAJESH</h1>
      <p class="qualifications">FRCS (Gen) MCh (Orth) FRCS (Orth) MBA</p>
      <p class="contact">Office: 0203 1500 222 | Mob: 07928 333 999</p>
      <hr class="divider" />
    </div>
  `,
  
  footer: `
    <div class="letterhead-footer">
      <img src="/assets/signature.png" class="signature" />
      <p class="doctor-name">Mr MANGATTIL RAJESH FRCS (Orth) MBA</p>
      <p>Clinical Lead in Spine Surgery</p>
      <p>Consultant Spine Surgeon</p>
      <p>Royal London Hospital</p>
      <p>LONDON</p>
      
      <div class="address-block">
        <p>Longfield Place, 38 Blacklands Farm Way, Sherfield on Loddon, Hook Hampshire RG27 0GE</p>
        <p>Princess Grace Hospital Consulting Rooms, 30 Devonshire Street, London W1G 6PU</p>
        <p>The London Clinic Consulting Rooms, 20 Devonshire Place, London W1G 6BW</p>
        <p>Lyca Health, 1 Westferry Circus, Canary Wharf, London E14 4HD</p>
        <p><a href="www.spinesurgeon.london">www.spinesurgeon.london</a> | secretary@spinesurgeon.london</p>
      </div>
    </div>
  `,
  
  css: `
    .letterhead-header { text-align: center; margin-bottom: 40px; }
    .logo { height: 60px; margin-bottom: 10px; }
    .qualifications { color: #666; font-size: 14px; }
    .contact { font-size: 12px; }
    .divider { border: 0.5px solid #ccc; margin: 20px 0; }
    
    .letterhead-footer { margin-top: 50px; }
    .signature { height: 80px; margin: 20px 0; }
    .doctor-name { font-weight: bold; margin-top: 20px; }
    .address-block { 
      font-size: 10px; 
      color: #666; 
      margin-top: 40px;
      border-top: 1px solid #ccc;
      padding-top: 20px;
    }
    
    @media print {
      .letterhead-header { position: fixed; top: 0; }
      .letterhead-footer { position: fixed; bottom: 0; }
      .letter-content { margin: 150px 0 200px 0; }
    }
  `
}