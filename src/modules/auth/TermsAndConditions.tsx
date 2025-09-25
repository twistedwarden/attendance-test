import React, { useState } from 'react';

interface TermsAndConditionsProps {
  onAccept: (accepted: boolean) => void;
  accepted: boolean;
}

export default function TermsAndConditions({ onAccept, accepted }: TermsAndConditionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="">
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id="terms-checkbox"
          checked={accepted}
          onChange={(e) => onAccept(e.target.checked)}
          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          required
        />
        <label htmlFor="terms-checkbox" className="text-sm text-gray-700 leading-relaxed">
          I have read and agree to the{' '}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Terms and Conditions
          </button>{' '}
          and{' '}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Privacy Policy
          </button>
          . I understand that by registering, I consent to the collection, processing, and storage of my personal data in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173) and other applicable Philippine laws.
        </label>
      </div>

      {/* Terms and Conditions Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl h-full overflow-hidden shadow-xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Terms and Conditions</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6 text-sm text-gray-700 leading-relaxed">
              
              {/* Introduction */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Introduction</h3>
                <p>
                  Welcome to Foothills Christian School's Parent Portal. These Terms and Conditions ("Terms") govern your use of our attendance management system and related services. By registering as a parent or guardian, you agree to be bound by these Terms and our Privacy Policy.
                </p>
              </section>

              {/* Data Privacy */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Data Privacy and Protection</h3>
                <p className="mb-3">
                  We are committed to protecting your privacy and personal information in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173) and its implementing rules and regulations.
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold">2.1 Information We Collect:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Personal information (name, contact details, relationship to student)</li>
                    <li>Account credentials (email, password)</li>
                    <li>Student attendance and academic records</li>
                    <li>Communication logs and system usage data</li>
                  </ul>
                  
                  <h4 className="font-semibold mt-3">2.2 How We Use Your Information:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>To provide attendance tracking and academic monitoring services</li>
                    <li>To communicate important school announcements and updates</li>
                    <li>To maintain accurate student records as required by the Department of Education</li>
                    <li>To ensure compliance with educational regulations and policies</li>
                  </ul>
                  
                  <h4 className="font-semibold mt-3">2.3 Your Rights:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Right to access your personal data</li>
                    <li>Right to correct inaccurate or incomplete data</li>
                    <li>Right to object to processing of personal data</li>
                    <li>Right to data portability</li>
                    <li>Right to file a complaint with the National Privacy Commission</li>
                  </ul>
                </div>
              </section>

              {/* Account Responsibilities */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Account Responsibilities</h3>
                <div className="space-y-2">
                  <h4 className="font-semibold">3.1 Account Security:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                    <li>You must notify us immediately of any unauthorized access or security breach</li>
                    <li>You agree not to share your account with others</li>
                    <li>You must use a strong, unique password</li>
                  </ul>
                  
                  <h4 className="font-semibold mt-3">3.2 Accurate Information:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>You must provide accurate and complete information during registration</li>
                    <li>You must update your information promptly when changes occur</li>
                    <li>Providing false information may result in account suspension or termination</li>
                  </ul>
                </div>
              </section>

              {/* Educational Compliance */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Educational Compliance</h3>
                <p className="mb-3">
                  This system is designed to comply with Philippine educational standards and regulations, including but not limited to:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Department of Education (DepEd) policies and guidelines</li>
                  <li>Republic Act No. 9155 (Governance of Basic Education Act of 2001)</li>
                  <li>Local school board regulations and policies</li>
                </ul>
              </section>

              {/* Attendance and Academic Records */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Attendance and Academic Records</h3>
                <div className="space-y-2">
                  <h4 className="font-semibold">5.1 Attendance Tracking:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Attendance records are maintained for educational and legal compliance purposes</li>
                    <li>Parents/guardians are responsible for ensuring student attendance</li>
                    <li>Excessive absences may result in academic consequences as per school policy</li>
                  </ul>
                  
                  <h4 className="font-semibold mt-3">5.2 Record Accuracy:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>We strive to maintain accurate attendance and academic records</li>
                    <li>Parents/guardians may request corrections to inaccurate records</li>
                    <li>Records are maintained in accordance with DepEd retention policies</li>
                  </ul>
                </div>
              </section>

              {/* Communication */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Communication and Notifications</h3>
                <div className="space-y-2">
                  <h4 className="font-semibold">6.1 School Communications:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>We may send important school announcements, attendance alerts, and academic updates</li>
                    <li>Communications will be sent to your registered email and contact number</li>
                    <li>You may opt out of non-essential communications while maintaining essential notifications</li>
                  </ul>
                  
                  <h4 className="font-semibold mt-3">6.2 Emergency Communications:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Emergency notifications cannot be opted out of for safety reasons</li>
                    <li>We may use multiple communication channels during emergencies</li>
                  </ul>
                </div>
              </section>

              {/* Prohibited Activities */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Prohibited Activities</h3>
                <p className="mb-3">You agree not to:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Use the system for any unlawful or unauthorized purpose</li>
                  <li>Attempt to gain unauthorized access to other accounts or system areas</li>
                  <li>Interfere with or disrupt the system's operation</li>
                  <li>Share false or misleading information</li>
                  <li>Use the system to harass, abuse, or harm others</li>
                  <li>Violate any applicable Philippine laws or regulations</li>
                </ul>
              </section>

              {/* System Availability */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">8. System Availability and Maintenance</h3>
                <div className="space-y-2">
                  <h4 className="font-semibold">8.1 Service Availability:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>We strive to maintain system availability but cannot guarantee uninterrupted service</li>
                    <li>Scheduled maintenance will be announced in advance when possible</li>
                    <li>Emergency maintenance may occur without prior notice</li>
                  </ul>
                  
                  <h4 className="font-semibold mt-3">8.2 Technical Support:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Technical support is available during school hours</li>
                    <li>Response times may vary based on issue complexity and volume</li>
                  </ul>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">9. Limitation of Liability</h3>
                <p className="mb-3">
                  To the maximum extent permitted by Philippine law, Foothills Christian School shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the system.
                </p>
                <p>
                  Our total liability shall not exceed the amount paid by you for the services, if any, or one thousand pesos (₱1,000), whichever is greater.
                </p>
              </section>

              {/* Termination */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">10. Account Termination</h3>
                <div className="space-y-2">
                  <h4 className="font-semibold">10.1 Termination by You:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>You may request account termination at any time</li>
                    <li>Termination requests must be submitted in writing</li>
                    <li>Some data may be retained for legal and educational compliance purposes</li>
                  </ul>
                  
                  <h4 className="font-semibold mt-3">10.2 Termination by Us:</h4>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>We may suspend or terminate accounts for violations of these Terms</li>
                    <li>We may terminate accounts for non-payment of fees (if applicable)</li>
                    <li>We will provide reasonable notice before termination when possible</li>
                  </ul>
                </div>
              </section>

              {/* Governing Law */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">11. Governing Law and Jurisdiction</h3>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the Republic of the Philippines. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of the Philippines.
                </p>
              </section>

              {/* Changes to Terms */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">12. Changes to Terms</h3>
                <p>
                  We reserve the right to modify these Terms at any time. Material changes will be communicated to users through the system or via email. Continued use of the system after changes constitutes acceptance of the new Terms.
                </p>
              </section>

              {/* Contact Information */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">13. Contact Information</h3>
                <p className="mb-2">
                  For questions, concerns, or requests regarding these Terms or your personal data, please contact:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Foothills Christian School</strong></p>
                  <p>Data Protection Officer</p>
                  <p>Email: privacy@foothillschristian.edu.ph</p>
                  <p>Phone: [School Contact Number]</p>
                  <p>Address: [School Address]</p>
                </div>
              </section>

              {/* Effective Date */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">14. Effective Date</h3>
                <p>
                  These Terms and Conditions are effective as of the date of your registration and acceptance. Last updated: {new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}.
                </p>
              </section>

            </div>
            <div className="flex justify-end p-6 border-t bg-gray-50">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
