import React from 'react';
import Footer from '../components/Footer';

const DataProcessingAddendum: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-[#63bb33] mb-8">Data Processing Addendum</h1>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 mb-6">
              <strong>Last updated:</strong> October 6, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">1. Introduction</h2>
              <p className="text-gray-300 mb-4">
                This Data Processing Addendum ("DPA") forms part of the Terms of Service between you ("Customer") and ZYNIQ Solutions ("ZYNIQ," "we," "us," or "our") regarding the Dark Matter MCP platform ("Service"). This DPA governs the processing of personal data by ZYNIQ on behalf of Customer in connection with the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">2. Definitions</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">2.1 General Definitions</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    <li><strong>"Personal Data"</strong> means any information relating to an identified or identifiable natural person</li>
                    <li><strong>"Data Controller"</strong> means the Customer who determines the purposes and means of processing</li>
                    <li><strong>"Data Processor"</strong> means ZYNIQ who processes personal data on behalf of the Customer</li>
                    <li><strong>"Data Subject"</strong> means the individual to whom personal data relates</li>
                    <li><strong>"Processing"</strong> means any operation performed on personal data</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">3. Scope and Applicability</h2>
              <p className="text-gray-300 mb-4">
                This DPA applies when and to the extent that ZYNIQ processes personal data on behalf of Customer in the provision of the Service, and such personal data is subject to data protection laws including but not limited to:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>European Union General Data Protection Regulation (GDPR)</li>
                <li>UK Data Protection Act 2018</li>
                <li>California Consumer Privacy Act (CCPA)</li>
                <li>Other applicable regional data protection laws</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">4. Data Processing Details</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">4.1 Categories of Data Subjects</h3>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Customer's employees and contractors</li>
                <li>End users of Customer's applications</li>
                <li>Individuals whose data is processed through MCP agents</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3">4.2 Categories of Personal Data</h3>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Contact information (names, email addresses, phone numbers)</li>
                <li>Account credentials and authentication data</li>
                <li>Usage data and interaction logs</li>
                <li>Content uploaded to or processed by the Service</li>
                <li>Technical identifiers (IP addresses, device IDs)</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3">4.3 Purpose of Processing</h3>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Provision of the Dark Matter MCP platform services</li>
                <li>User authentication and access control</li>
                <li>Service optimization and performance monitoring</li>
                <li>Customer support and technical assistance</li>
                <li>Security monitoring and incident response</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">5. Data Processing Principles</h2>
              <p className="text-gray-300 mb-4">
                ZYNIQ shall process personal data in accordance with the following principles:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Process data only as necessary to provide the Service</li>
                <li>Process data only for the purposes specified in this DPA</li>
                <li>Not process data for ZYNIQ's own purposes without consent</li>
                <li>Implement appropriate technical and organizational measures</li>
                <li>Ensure data is kept secure and confidential</li>
                <li>Delete or return data upon termination of services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">6. Security Measures</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">6.1 Technical Measures</h3>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Access controls and authentication systems</li>
                <li>Network security and firewalls</li>
                <li>Regular security monitoring and logging</li>
                <li>Secure software development practices</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3">6.2 Organizational Measures</h3>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Employee training on data protection</li>
                <li>Confidentiality agreements with staff</li>
                <li>Regular security assessments and audits</li>
                <li>Incident response procedures</li>
                <li>Data breach notification protocols</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">7. Sub-processors</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">7.1 Authorized Sub-processors</h3>
              <p className="text-gray-300 mb-4">
                ZYNIQ may engage the following categories of sub-processors:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Cloud infrastructure providers (e.g., AWS, Google Cloud, Azure)</li>
                <li>Monitoring and analytics services</li>
                <li>Customer support platforms</li>
                <li>Security and authentication services</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3">7.2 Sub-processor Requirements</h3>
              <p className="text-gray-300 mb-4">
                All sub-processors are bound by data protection obligations equivalent to those in this DPA.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">8. Data Subject Rights</h2>
              <p className="text-gray-300 mb-4">
                ZYNIQ will assist Customer in fulfilling data subject requests, including:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Right of access to personal data</li>
                <li>Right to rectification of inaccurate data</li>
                <li>Right to erasure ("right to be forgotten")</li>
                <li>Right to restrict processing</li>
                <li>Right to data portability</li>
                <li>Right to object to processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">9. International Data Transfers</h2>
              <p className="text-gray-300 mb-4">
                When personal data is transferred outside the European Economic Area, ZYNIQ ensures appropriate safeguards through:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>European Commission adequacy decisions</li>
                <li>Standard Contractual Clauses (SCCs)</li>
                <li>Binding Corporate Rules where applicable</li>
                <li>Certification mechanisms and codes of conduct</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">10. Data Retention and Deletion</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">10.1 Retention Periods</h3>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Personal data is retained only as long as necessary for the purposes outlined</li>
                <li>Data is deleted in accordance with Customer instructions</li>
                <li>Backup data is securely deleted within 90 days of the retention period</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3">10.2 Data Return and Deletion</h3>
              <p className="text-gray-300 mb-4">
                Upon termination of the Service, ZYNIQ will, at Customer's choice, return or securely delete all personal data within 30 days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">11. Data Breach Notification</h2>
              <p className="text-gray-300 mb-4">
                In the event of a personal data breach, ZYNIQ will:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>Notify Customer without undue delay, within 72 hours when feasible</li>
                <li>Provide details of the breach and its likely consequences</li>
                <li>Describe measures taken to address the breach</li>
                <li>Assist Customer with regulatory notifications if required</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">12. Audits and Compliance</h2>
              <p className="text-gray-300 mb-4">
                ZYNIQ will make available to Customer information necessary to demonstrate compliance with this DPA and allow for reasonable audits, including:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                <li>SOC 2 Type II reports</li>
                <li>ISO 27001 certification</li>
                <li>Third-party security assessments</li>
                <li>Compliance questionnaires and documentation</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">13. Liability and Indemnification</h2>
              <p className="text-gray-300 mb-4">
                Each party's liability under this DPA is subject to the limitations and exclusions set forth in the main Terms of Service. ZYNIQ will indemnify Customer against claims arising from ZYNIQ's breach of this DPA.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">14. Term and Termination</h2>
              <p className="text-gray-300 mb-4">
                This DPA remains in effect for the duration of the Terms of Service and any processing of personal data thereafter. The obligations regarding data security, confidentiality, and return/deletion of data survive termination.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#63bb33] mb-4">15. Contact Information</h2>
              <p className="text-gray-300 mb-4">
                For questions regarding this DPA or data protection matters, please contact:
              </p>
              <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-gray-300">
                  <strong>Data Protection Officer:</strong> dpo@zyniq.solutions<br />
                  <strong>Legal Department:</strong> legal@zyniq.solutions<br />
                  <strong>Address:</strong> ZYNIQ Solutions, Data Protection Office<br />
                  <strong>Website:</strong> https://zyniq.solutions/privacy
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

export default DataProcessingAddendum;