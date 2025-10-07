import React from 'react';
import Footer from '../components/Footer';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-[#63bb33] mb-8">Privacy Policy</h1>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-6">
              <strong>Last updated:</strong> October 6, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">1. Introduction</h2>
              <p className="text-gray-300 mb-4">
                Dark Matter ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Model Context Protocol (MCP) platform and related services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">2.1 Information You Provide</h3>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Account information (email, username, profile details)</li>
                <li>Authentication credentials</li>
                <li>MCP server configurations and settings</li>
                <li>Chat messages and conversations with AI agents</li>
                <li>Uploaded files and documents</li>
                <li>Feedback and support communications</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3">2.2 Information We Collect Automatically</h3>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Usage analytics and performance metrics</li>
                <li>IP addresses and device information</li>
                <li>Browser type and operating system</li>
                <li>Session data and interaction logs</li>
                <li>Error reports and diagnostic information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Provide and maintain our MCP platform services</li>
                <li>Authenticate users and secure accounts</li>
                <li>Process and respond to your requests</li>
                <li>Improve our platform and develop new features</li>
                <li>Analyze usage patterns and optimize performance</li>
                <li>Communicate with you about updates and support</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">4. Data Sharing and Disclosure</h2>
              <p className="text-gray-300 mb-4">
                We do not sell, trade, or rent your personal information. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>With your explicit consent</li>
                <li>To service providers who assist in our operations</li>
                <li>To comply with legal requirements or protect our rights</li>
                <li>In connection with a business transfer or merger</li>
                <li>To protect the safety and security of our users</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">5. Data Security</h2>
              <p className="text-gray-300 mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Encryption in transit and at rest</li>
                <li>Regular security audits and assessments</li>
                <li>Access controls and authentication systems</li>
                <li>Secure data centers and infrastructure</li>
                <li>Employee training on data protection</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">6. Data Retention</h2>
              <p className="text-gray-300 mb-4">
                We retain your information for as long as necessary to provide our services and comply with legal obligations. Specific retention periods include:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Account data: Until account deletion plus 30 days</li>
                <li>Chat conversations: 90 days unless explicitly saved</li>
                <li>Usage logs: 12 months for analytics purposes</li>
                <li>Legal compliance data: As required by applicable law</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">7. Your Rights</h2>
              <p className="text-gray-300 mb-4">
                Depending on your jurisdiction, you may have the following rights:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Delete your personal information</li>
                <li>Port your data to another service</li>
                <li>Object to or restrict processing</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">8. International Transfers</h2>
              <p className="text-gray-300 mb-4">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers, including:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Adequacy decisions by relevant authorities</li>
                <li>Standard contractual clauses</li>
                <li>Certification schemes</li>
                <li>Binding corporate rules</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">9. Children's Privacy</h2>
              <p className="text-gray-300 mb-4">
                Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it promptly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">10. Changes to This Policy</h2>
              <p className="text-gray-300 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of our services after such changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">11. Contact Us</h2>
              <p className="text-gray-300 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-gray-300">
                  <strong>Email:</strong> privacy@zyniq.solutions<br />
                  <strong>Address:</strong> ZYNIQ Solutions, Data Protection Office<br />
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

export default PrivacyPolicy;