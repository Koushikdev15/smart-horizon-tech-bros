const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/features/government/pages/MemberRegistration.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Remove Firebase imports
content = content.replace(/import \{ auth, db \} from '\.\.\/\.\.\/\.\.\/lib\/firebase';\n/, '');
content = content.replace(/import \{ RecaptchaVerifier, signInWithPhoneNumber \} from 'firebase\/auth';\n/, '');
content = content.replace(/import type \{ ConfirmationResult \} from 'firebase\/auth';\n/, '');
content = content.replace(/import \{ collection, addDoc, serverTimestamp \} from 'firebase\/firestore';\n/, '');

// 2. Remove PhoneVerification component and window declaration
const phoneVerRegex = /\/\/ Reusable Phone Verification Component[\s\S]*?\/\/ Submit Helper/m;
content = content.replace(phoneVerRegex, `// Mock Submit Helper`);

// 3. Update submitToFirestore to submitToMockDB
const submitRegex = /const submitToFirestore = async \(collectionName: string, data: any\) => \{[\s\S]*?return false;\n  \}\n\}/m;
content = content.replace(submitRegex, `const submitToMockDB = async (collectionName: string, data: any) => {
  return new Promise<boolean>((resolve) => {
    setTimeout(() => {
      console.log(\`Mock submitting to \${collectionName}:\`, data);
      resolve(true);
    }, 1000);
  });
}`);

// 4. Update forms
// For each form, we need to:
// a. Remove `const [verifiedPhone, setVerifiedPhone] = useState('');`
// b. Add `phone: ''` to formData
// c. Change `if (!verifiedPhone) return toast.error('Please verify phone number first');` to `if (!formData.phone) return toast.error('Please enter a phone number');`
// d. Change `submitToFirestore` to `submitToMockDB`
// e. Change `phone: verifiedPhone` to `phone: formData.phone`
// f. Change `<PhoneVerification onVerified={setVerifiedPhone} />` to `<FormField label="Phone Number" id="phone" placeholder="+91 9876543210" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />`

const forms = ['CollectionCenterEntityForm', 'FarmerForm', 'WildCollectorForm', 'ProcessingLabForm', 'ManufacturerForm', 'SupplyChainForm'];

forms.forEach(form => {
  // Remove verifiedPhone state
  content = content.replace(/  const \[verifiedPhone, setVerifiedPhone\] = useState\(''\);\n/, '');
  
  // Add phone to formData
  // We look for setFormData({ ... })
  const formDataRegex = new RegExp(`(function ${form}\\(\\) \\{[\\s\\S]*?const \\[formData, setFormData\\] = useState\\(\\{[^\\]]*?)\\}\\);`, 'm');
  content = content.replace(formDataRegex, (match, p1) => {
    return p1.trimEnd() + `, phone: '' });`;
  });

  // Change validation
  content = content.replace(/if \(!verifiedPhone\) return toast.error\('Please verify phone number first'\);/, `if (!formData.phone) return toast.error('Please enter a phone number');`);

  // Change submit fn and phone payload
  content = content.replace(/submitToFirestore/g, `submitToMockDB`);
  content = content.replace(/phone: verifiedPhone/g, `phone: formData.phone`);

  // Change PhoneVerification component in UI
  content = content.replace(/<PhoneVerification onVerified=\{setVerifiedPhone\} \/>/g, `<FormField label="Phone Number" id="${form.toLowerCase()}-phone" type="tel" placeholder="+91 9876543210" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />`);
});

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully updated MemberRegistration.tsx');
