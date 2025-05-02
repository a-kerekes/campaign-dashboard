// src/components/pages/TermsOfService.js
import React from 'react';

const TermsOfService = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      
      <div className="prose lg:prose-lg">
        <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">1. Acceptance of Terms</h2>
        <p>
          By accessing or using the Campaign Dashboard ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
          If you disagree with any part of the terms, you may not access the Service.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">2. Description of Service</h2>
        <p>
          Campaign Dashboard is an analytics tool that allows users to connect their Meta Ads accounts to view performance data, 
          analyze creative assets, and obtain insights about their advertising campaigns.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">3. Meta Platform Integration</h2>
        <p>
          Our Service integrates with the Meta Platform to access and analyze your advertising data. By using our Service, you acknowledge:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>You must comply with Meta's Terms of Service</li>
          <li>We access your Meta data only with your explicit permission</li>
          <li>You can revoke access to your Meta data at any time</li>
          <li>We do not represent or claim to be endorsed by Meta</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">4. User Account</h2>
        <p>
          To use certain features of the Service, you may need to create an account. You are responsible for:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Maintaining the confidentiality of your account credentials</li>
          <li>All activities that occur under your account</li>
          <li>Notifying us immediately of any unauthorized use of your account</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">5. User Data and Privacy</h2>
        <p>
          Your use of the Service is also governed by our Privacy Policy, which can be found at 
          <a href="/privacy-policy" className="text-blue-600 hover:underline"> https://campaign-dashboard-topaz.vercel.app/privacy-policy</a>.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">6. Intellectual Property</h2>
        <p>
          The Service and its original content, features, and functionality are owned by us and are protected by international 
          copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">7. Data Ownership</h2>
        <p>
          You retain all rights to your Meta advertising data. We do not claim ownership of your data and will only use it in accordance 
          with these Terms and our Privacy Policy.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">8. Restrictions</h2>
        <p>
          You agree not to:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Use the Service for any illegal purpose</li>
          <li>Attempt to gain unauthorized access to any portion of the Service</li>
          <li>Interfere with or disrupt the Service or servers</li>
          <li>Sell, resell, or lease the Service</li>
          <li>Reverse engineer or attempt to extract the source code of the Service</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">9. Termination</h2>
        <p>
          We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, 
          for any reason, including without limitation if you breach the Terms.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">10. Limitation of Liability</h2>
        <p>
          In no event shall we be liable for any indirect, incidental, special, consequential or punitive damages, including without 
          limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Your access to or use of or inability to access or use the Service</li>
          <li>Any conduct or content of any third party on the Service</li>
          <li>Unauthorized access, use or alteration of your transmissions or content</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">11. Disclaimer</h2>
        <p>
          Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is 
          provided without warranties of any kind, whether express or implied.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">12. Changes to Terms</h2>
        <p>
          We reserve the right to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on this page.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">13. Contact Us</h2>
        <p>
          If you have any questions about these Terms, please contact us at:
        </p>
        <p>
          [Your Company Name]<br />
          Email: [Your Contact Email]<br />
          Address: [Your Business Address]
        </p>
      </div>
    </div>
  );
};

export default TermsOfService;
