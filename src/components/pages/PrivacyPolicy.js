// src/components/pages/PrivacyPolicy.js
import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="prose lg:prose-lg">
        <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">1. Introduction</h2>
        <p>
          Welcome to the Campaign Dashboard Privacy Policy. This Privacy Policy describes how we collect, use, process, and disclose your information, 
          including personal information, in conjunction with your access to and use of the Campaign Dashboard.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">2. Information We Collect</h2>
        <p>
          When you use our Campaign Dashboard, we collect information necessary to provide and improve our services, including:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Account information provided during registration</li>
          <li>Meta Ads account data, including ads performance metrics, creative content, and campaign structure</li>
          <li>Usage information to understand how you interact with our dashboard</li>
          <li>Device information to optimize your experience and enhance security</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">3. How We Use Meta Ads Data</h2>
        <p>
          Our application connects to the Meta Ads API to provide you with insights about your advertising performance. We collect and process the following data:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Ad account details</li>
          <li>Campaign, ad set, and ad data</li>
          <li>Ad creative content</li>
          <li>Performance metrics like impressions, clicks, and conversions</li>
          <li>Audience insights</li>
        </ul>
        <p>
          This data is used exclusively to:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Display analytics and insights in your dashboard</li>
          <li>Create visualizations of advertising performance</li>
          <li>Allow you to view and analyze your advertising creatives</li>
          <li>Generate recommendations to improve advertising performance</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">4. Data Retention</h2>
        <p>
          We store Meta Ads data only for as long as necessary to provide you with our services. Specifically:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Active account data is retained as long as you maintain an active account</li>
          <li>Historical performance data may be retained for up to 13 months to enable year-over-year comparisons</li>
          <li>We permanently delete your data upon request or account termination</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">5. Data Sharing</h2>
        <p>
          We do not sell your personal information or Meta Ads data to third parties. We may share information in the following limited circumstances:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>With service providers who help us operate our platform</li>
          <li>When required by law or to protect our rights</li>
          <li>With your explicit consent</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">6. Your Rights</h2>
        <p>
          Depending on your location, you may have certain rights regarding your personal information:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Right to access and review your data</li>
          <li>Right to correct inaccurate information</li>
          <li>Right to delete your data</li>
          <li>Right to data portability</li>
          <li>Right to object to or restrict processing</li>
        </ul>
        <p>
          To exercise these rights, please contact us at [your contact email].
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">7. Meta Data Deletion Requirements</h2>
        <p>
          In compliance with Meta's Platform Terms, we will promptly delete all Meta user data in our possession if you disconnect your Meta account 
          from our application or request deletion of your data. We provide functionality for you to disconnect your Meta account directly within our 
          application.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">8. Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your data. However, no method of 
          transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">9. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page 
          and updating the "Last Updated" date.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">10. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at:
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

export default PrivacyPolicy;
