import React from 'react';
import Footer from '../components/Footer';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-[#63bb33] mb-8">Terms of Service</h1>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-6">
              <strong>Last updated:</strong> October 6, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-300 mb-4">
                By accessing or using the Dark Matter Model Context Protocol (MCP) platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">2. Description of Service</h2>
              <p className="text-gray-300 mb-4">
                Dark Matter provides a comprehensive MCP platform that enables:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Model Context Protocol server management and deployment</li>
                <li>AI agent orchestration and workflow automation</li>
                <li>Secure multi-tenant environments</li>
                <li>Real-time monitoring and analytics</li>
                <li>Integration with various AI models and services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">3. User Accounts and Registration</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">3.1 Account Creation</h3>
              <p className="text-gray-300 mb-4">
                To use certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
              </p>

              <h3 className="text-xl font-medium text-white mb-3">3.2 Account Security</h3>
              <p className="text-gray-300 mb-4">
                You are responsible for safeguarding your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">4. Acceptable Use Policy</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">4.1 Permitted Uses</h3>
              <p className="text-gray-300 mb-4">
                You may use the Service for lawful purposes only. You agree to comply with all applicable laws and regulations.
              </p>

              <h3 className="text-xl font-medium text-white mb-3">4.2 Prohibited Activities</h3>
              <p className="text-gray-300 mb-4">You agree not to:</p>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Violate the intellectual property rights of others</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Use the Service to generate harmful, discriminatory, or inappropriate content</li>
                <li>Attempt to reverse engineer or extract source code</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">5. Content and Data</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">5.1 Your Content</h3>
              <p className="text-gray-300 mb-4">
                You retain ownership of any content you submit to the Service. However, you grant us a license to use, modify, and distribute your content as necessary to provide the Service.
              </p>

              <h3 className="text-xl font-medium text-white mb-3">5.2 Content Responsibility</h3>
              <p className="text-gray-300 mb-4">
                You are solely responsible for the content you submit and must ensure you have the right to submit such content. We reserve the right to remove content that violates these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">6. Privacy and Data Protection</h2>
              <p className="text-gray-300 mb-4">
                Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">7. Service Availability and Modifications</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">7.1 Service Availability</h3>
              <p className="text-gray-300 mb-4">
                We strive to maintain high availability but do not guarantee uninterrupted access to the Service. We may experience downtime for maintenance, updates, or unforeseen issues.
              </p>

              <h3 className="text-xl font-medium text-white mb-3">7.2 Service Modifications</h3>
              <p className="text-gray-300 mb-4">
                We reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable notice to users.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">8. Pricing and Payment</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">8.1 Free Tier</h3>
              <p className="text-gray-300 mb-4">
                We offer a free tier with limited features. Usage limits and restrictions apply.
              </p>

              <h3 className="text-xl font-medium text-white mb-3">8.2 Paid Services</h3>
              <p className="text-gray-300 mb-4">
                Premium features may require payment. All fees are charged in advance and are non-refundable unless otherwise stated.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">9. Intellectual Property</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">9.1 Our Rights</h3>
              <p className="text-gray-300 mb-4">
                The Service and its original content, features, and functionality are owned by ZYNIQ Solutions and are protected by international copyright, trademark, and other intellectual property laws.
              </p>

              <h3 className="text-xl font-medium text-white mb-3">9.2 License to Use</h3>
              <p className="text-gray-300 mb-4">
                We grant you a limited, non-exclusive, non-transferable license to use the Service in accordance with these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">10. Disclaimers and Limitation of Liability</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">10.1 Disclaimers</h3>
              <p className="text-gray-300 mb-4">
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>

              <h3 className="text-xl font-medium text-white mb-3">10.2 Limitation of Liability</h3>
              <p className="text-gray-300 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">11. Indemnification</h2>
              <p className="text-gray-300 mb-4">
                You agree to indemnify and hold harmless ZYNIQ Solutions and its affiliates from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">12. Termination</h2>
              <p className="text-gray-300 mb-4">
                We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including breach of these Terms. You may also terminate your account at any time by contacting us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">13. Governing Law and Dispute Resolution</h2>
              <p className="text-gray-300 mb-4">
                These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising under these Terms shall be resolved through binding arbitration.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">14. Changes to Terms</h2>
              <p className="text-gray-300 mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">15. Contact Information</h2>
              <p className="text-gray-300 mb-4">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-gray-300">
                  <strong>Email:</strong> legal@zyniq.solutions<br />
                  <strong>Address:</strong> ZYNIQ Solutions, Legal Department<br />
                  <strong>Website:</strong> https://zyniq.solutions/contact
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsOfService;