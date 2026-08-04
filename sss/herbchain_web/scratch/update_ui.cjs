const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/features/government/pages/MemberRegistration.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Fix the duplicate password lines in CollectionCenterEntityForm and other forms
// Since we might have multiple `password: formData.password,` lines, let's clean them up.
content = content.replace(/(      password: formData\.password,\n)+/g, '      password: formData.password,\n');

// 2. We need to make sure the UI fields are actually inserted.
const forms = ['CollectionCenterEntityForm', 'FarmerForm', 'WildCollectorForm', 'ProcessingLabForm', 'ManufacturerForm', 'SupplyChainForm'];

forms.forEach(form => {
  // First, let's remove any old standard Email Address field if it's there
  content = content.replace(/<FormField label="Email Address"[^>]+ \/>\n?\s*/g, '');

  // Next, we find the Phone Number field. It looks like:
  // <FormField label="Phone Number" id="collectioncenterentityform-phone" type="tel" placeholder="+91 9876543210" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
  // Note: For some forms it might have a different ID because the previous script used form.toLowerCase().
  
  const phoneInputRegex = new RegExp(`(<FormField label="Phone Number" id="[^"]+" type="tel" placeholder="\\+91 9876543210" required value=\\{formData\\.phone\\} onChange=\\{[^}]+\\} \\/>)`);

  const passwordInputs = `
      <EmailVerification onVerified={(email) => setFormData({...formData, email})} />
      $1
      <FormField label="Create Password" id="${form.toLowerCase()}-pass" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
      <FormField label="Confirm Password" id="${form.toLowerCase()}-cpass" type="password" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />`;

  // We only want to replace it if we haven't already added the EmailVerification component right above it
  // Let's do a replace that checks if EmailVerification is already there
  const uiBlockRegex = new RegExp(`(?:<EmailVerification[^>]+>\\s*)?` + phoneInputRegex.source + `(?:\\s*<FormField label="Create Password"[^>]+>)?`, 'g');
  
  // Wait, let's just do a simple string replace for the phone input. We will do it per form by finding the form block.
  // Extract the form block
  const formStart = content.indexOf(`function ${form}() {`);
  const nextFormStart = forms.indexOf(form) < forms.length - 1 
    ? content.indexOf(`function ${forms[forms.indexOf(form) + 1]}() {`)
    : content.length;
    
  let formBlock = content.substring(formStart, nextFormStart);
  
  // Inside formBlock, remove old EmailVerification and Password fields so we can cleanly insert them
  formBlock = formBlock.replace(/<EmailVerification[^>]+ \/>\n?\s*/g, '');
  formBlock = formBlock.replace(/<FormField label="Create Password"[^>]+ \/>\n?\s*/g, '');
  formBlock = formBlock.replace(/<FormField label="Confirm Password"[^>]+ \/>\n?\s*/g, '');
  
  // Now find the Phone field in this block and insert the fields
  formBlock = formBlock.replace(phoneInputRegex, (match, p1) => {
    return `<EmailVerification onVerified={(email) => setFormData({...formData, email})} />
      ${p1}
      <FormField label="Create Password" id="${form.toLowerCase()}-pass" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
      <FormField label="Confirm Password" id="${form.toLowerCase()}-cpass" type="password" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />`;
  });
  
  content = content.substring(0, formStart) + formBlock + content.substring(nextFormStart);
});

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully fixed UI fields in MemberRegistration.tsx');
