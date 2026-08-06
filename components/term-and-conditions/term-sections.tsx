import type React from "react"
import { useEffect } from "react"

export type Section = {
  id: string
  title: string
  content: React.ReactNode
}
export function SmoothScroll() {
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.scrollBehavior = "smooth"
    }
  }, [])
  return null
}

export const sections: Section[] = [
  {
    id: "agreement-acceptance",
    title: "Agreement Acceptance",
    content: (
      <>
        <p className="text-pretty">
          These Terms and Conditions (“Terms”) constitute a legally binding agreement between you (“Customer,” “you,” or
          “your”) and AI2me LLC (“AI2me,” “we,” “us,” or “our”) governing your use of AI2me’s artificial intelligence
          and API services.
        </p>
        <p className="text-pretty">
          By accessing or using any AI2me services, creating an account, or clicking “I agree” during the registration
          process, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy
          Policy.
        </p>
        <p className="text-pretty">
          If you are entering into this agreement on behalf of a company or other legal entity, you represent that you
          have the authority to bind such entity to these Terms. In such cases, “you” and “your” refer to such entity.
        </p>
        <p className="text-pretty">If you do not agree to these Terms, you may not access or use our Services.</p>
      </>
    ),
  },
  {
    id: "definitions",
    title: "Definitions",
    content: (
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>API:</strong> Application Programming Interface, the software interfaces provided by AI2me that allow
          integration with your applications and systems.
        </li>
        <li>
          <strong>API Client:</strong> The software applications, systems, or services that integrate with AI2me’s APIs.
        </li>
        <li>
          <strong>Customer Data:</strong> All data, content, and information that you provide to AI2me or that is
          processed through our Services on your behalf.
        </li>
        <li>
          <strong>Documentation:</strong> The technical documentation, user guides, API references, and other materials
          provided by AI2me relating to the Services.
        </li>
        <li>
          <strong>Intellectual Property:</strong> All intellectual property rights worldwide, including patents,
          copyrights, trademarks, trade secrets, and other proprietary rights.
        </li>
        <li>
          <strong>Services:</strong> All AI2me products, services, APIs, applications, websites, and related offerings,
          including any updates, enhancements, or modifications.
        </li>
        <li>
          <strong>AI Models:</strong> The machine learning algorithms, neural networks, and artificial intelligence
          systems developed, trained, or operated by AI2me.
        </li>
        <li>
          <strong>SLA:</strong> Service Level Agreement, which defines the performance standards and availability
          commitments for our Services.
        </li>
      </ul>
    ),
  },
  {
    id: "service-description",
    title: "Service Description",
    content: (
      <>
        <p className="text-pretty">
          AI2me provides artificial intelligence and machine learning services through APIs and related tools. Our
          Services include:
        </p>
        <ul className="list-disc pl-6 space-y-1 mt-1">
          <li>
            <strong>API Services:</strong> RESTful APIs that provide access to various AI capabilities including natural
            language processing, computer vision, predictive analytics, and other machine learning functionalities.
          </li>
          <li>
            <strong>Developer Tools:</strong> Software development kits (SDKs), libraries, documentation, testing
            environments, and integration tools.
          </li>
          <li>
            <strong>Customer Portal:</strong> Web-based interface for account management, usage monitoring, billing, and
            support.
          </li>
          <li>
            <strong>AI Models:</strong> Pre-trained and custom machine learning models designed for specific business
            applications across various industries.
          </li>
          <li>
            <strong>Support Services:</strong> Technical support, consultation, and assistance with integration and
            optimization.
          </li>
        </ul>
        <p className="mt-2 text-pretty">
          AI2me may modify, update, or discontinue any aspect of the Services at any time with reasonable notice to
          customers.
        </p>
      </>
    ),
  },
  {
    id: "account-registration-and-management",
    title: "Account Registration and Management",
    content: (
      <>
        <h4 className="font-semibold">Eligibility</h4>
        <ul className="list-disc pl-6 space-y-1 mt-1">
          <li>Be at least 18 years old or have reached the age of majority in your jurisdiction</li>
          <li>Have the legal authority to enter into this agreement</li>
          <li>Provide accurate and complete registration information</li>
          <li>Comply with all applicable laws and regulations</li>
        </ul>
        <h4 className="font-semibold mt-3">Account Creation</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Provide accurate, current, and complete information</li>
          <li>Maintain and update your account information</li>
          <li>Keep your login credentials secure and confidential</li>
          <li>Notify us immediately of any unauthorized access</li>
        </ul>
        <h4 className="font-semibold mt-3">Account Responsibility</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>All activity that occurs under your account</li>
          <li>Maintaining the confidentiality of your account credentials</li>
          <li>Ensuring that your use of the Services complies with these Terms</li>
          <li>Any charges incurred through your account</li>
        </ul>
        <h4 className="font-semibold mt-3">Account Suspension</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>We may suspend or terminate your account if you violate these Terms or our Acceptable Use Policy</li>
          <li>Provide false or misleading information</li>
          <li>Engage in fraudulent or illegal activities</li>
          <li>Fail to pay applicable fees</li>
        </ul>
      </>
    ),
  },
  {
    id: "api-access-and-usage",
    title: "API Access and Usage",
    content: (
      <>
        <h4 className="font-semibold">API Key Management</h4>
        <ul className="list-disc pl-6 space-y-1 mt-1">
          <li>API keys are provided for authentication and access control</li>
          <li>You must keep API keys secure and confidential</li>
          <li>Do not share API keys with unauthorized parties</li>
          <li>Report any compromise of API keys immediately</li>
        </ul>
        <h4 className="font-semibold mt-3">Usage Limits</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>API usage is subject to rate limits and quotas</li>
          <li>Limits are based on your subscription plan and usage patterns</li>
          <li>Exceeding limits may result in temporary restrictions or additional charges</li>
          <li>We may adjust limits with reasonable notice</li>
        </ul>
        <h4 className="font-semibold mt-3">Integration Requirements</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Follow the technical specifications in our Documentation</li>
          <li>Implement proper error handling and retry logic</li>
          <li>Use APIs only for their intended purposes</li>
          <li>Maintain compatibility with API versions and updates</li>
        </ul>
        <h4 className="font-semibold mt-3">Monitoring and Analytics</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>We monitor API usage for performance, security, and billing purposes</li>
          <li>Usage data may be aggregated for service improvement</li>
          <li>You may access your usage analytics through the Customer Portal</li>
        </ul>
      </>
    ),
  },
  {
    id: "user-responsibilities-and-acceptable-use",
    title: "User Responsibilities and Acceptable Use",
    content: (
      <>
        <h4 className="font-semibold">General Responsibilities</h4>
        <ul className="list-disc pl-6 space-y-1 mt-1">
          <li>Use the Services in compliance with all applicable laws</li>
          <li>Respect the intellectual property rights of AI2me and third parties</li>
          <li>Implement appropriate security measures for your systems</li>
          <li>Provide accurate information and maintain current account details</li>
        </ul>
        <h4 className="font-semibold mt-3">Prohibited Uses</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Violate any applicable laws, regulations, or third-party rights</li>
          <li>Transmit harmful, offensive, or illegal content</li>
          <li>Attempt to gain unauthorized access to our systems</li>
          <li>Reverse engineer, decompile, or disassemble our Services</li>
          <li>Use the Services for competitive analysis or benchmarking</li>
          <li>Create competing services using our AI Models or technology</li>
        </ul>
        <h4 className="font-semibold mt-3">Data Responsibilities</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Ensuring you have the right to process any data sent to our APIs</li>
          <li>Complying with applicable data protection laws</li>
          <li>Obtaining necessary consents for data processing</li>
          <li>Implementing appropriate data security measures</li>
        </ul>
        <h4 className="font-semibold mt-3">Content Standards</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Comply with applicable laws and regulations</li>
          <li>Respect intellectual property rights</li>
          <li>Not contain harmful or malicious code</li>
          <li>Not violate privacy rights of individuals</li>
        </ul>
      </>
    ),
  },
  {
    id: "service-availability-and-performance",
    title: "Service Availability and Performance",
    content: (
      <>
        <h4 className="font-semibold">Service Level Commitments</h4>
        <ul className="list-disc pl-6 space-y-1 mt-1">
          <li>Target uptime of 99.9% monthly availability</li>
          <li>Response time commitments as specified in our SLA</li>
          <li>Regular maintenance windows with advance notice</li>
          <li>Incident response and resolution procedures</li>
        </ul>
        <h4 className="font-semibold mt-3">Planned Maintenance</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Scheduled maintenance will be announced in advance</li>
          <li>We will minimize service disruptions during maintenance</li>
          <li>Emergency maintenance may be performed with limited notice</li>
        </ul>
        <h4 className="font-semibold mt-3">Service Interruptions</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Internet connectivity issues</li>
          <li>Third-party service failures</li>
          <li>Force majeure events</li>
          <li>Customer’s failure to meet technical requirements</li>
        </ul>
        <h4 className="font-semibold mt-3">Performance Optimization</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Improve API response times and reliability</li>
          <li>Enhance AI model accuracy and performance</li>
          <li>Optimize infrastructure and service delivery</li>
          <li>Provide performance monitoring and reporting tools</li>
        </ul>
      </>
    ),
  },
  {
    id: "fees-billing-and-payment-terms",
    title: "Fees, Billing, and Payment Terms",
    content: (
      <>
        <h4 className="font-semibold">Pricing Structure</h4>
        <ul className="list-disc pl-6 space-y-1 mt-1">
          <li>Fees are based on your selected subscription plan and usage</li>
          <li>Current pricing is available on our website and Customer Portal</li>
          <li>Usage-based charges apply to API calls and data processing</li>
          <li>Additional features may incur supplementary charges</li>
        </ul>
        <h4 className="font-semibold mt-3">Billing Cycles</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Subscription fees are billed in advance on a monthly or annual basis</li>
          <li>Usage charges are calculated and billed monthly in arrears</li>
          <li>Invoices are provided electronically through the Customer Portal</li>
          <li>Payment is due within thirty (30) days of invoice date</li>
        </ul>
        <h4 className="font-semibold mt-3">Payment Methods</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>We accept major credit cards and bank transfers</li>
          <li>Payment processing is handled by third-party payment processors</li>
          <li>You authorize us to charge your designated payment method</li>
          <li>Failed payments may result in service suspension</li>
        </ul>
        <h4 className="font-semibold mt-3">Fee Changes</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>We may modify our fees with sixty (60) days advance notice</li>
          <li>Fee changes will be communicated via email and Customer Portal</li>
          <li>Continued use of Services after fee changes constitutes acceptance</li>
          <li>You may terminate your account to avoid fee increases</li>
        </ul>
        <h4 className="font-semibold mt-3">Taxes</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Fees are exclusive of all taxes, duties, and assessments</li>
          <li>You are responsible for all applicable taxes</li>
          <li>We may collect taxes as required by applicable law</li>
          <li>Tax exemption certificates must be provided if applicable</li>
        </ul>
      </>
    ),
  },
  {
    id: "intellectual-property-rights",
    title: "Intellectual Property Rights",
    content: (
      <>
        <h4 className="font-semibold">AI2me Intellectual Property</h4>
        <ul className="list-disc pl-6 space-y-1 mt-1">
          <li>The Services and underlying technology</li>
          <li>AI Models, algorithms, and training data</li>
          <li>Documentation, software, and user interfaces</li>
          <li>Trademarks, logos, and branding materials</li>
        </ul>
        <h4 className="font-semibold mt-3">Customer Intellectual Property</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Your pre-existing intellectual property</li>
          <li>Customer Data provided to our Services</li>
          <li>Your applications and integrations</li>
          <li>Your business logic and processes</li>
        </ul>
        <h4 className="font-semibold mt-3">License Grants</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Use the Services in accordance with these Terms</li>
          <li>Access and use the Documentation for integration purposes</li>
          <li>Use our APIs solely for your internal business purposes</li>
        </ul>
        <h4 className="font-semibold mt-3">Restrictions</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Copy, modify, or create derivative works of our Services</li>
          <li>Distribute, sublicense, or transfer your access rights</li>
          <li>Remove or modify any proprietary notices</li>
          <li>Use our intellectual property for competitive purposes</li>
        </ul>
        <h4 className="font-semibold mt-3">Feedback and Suggestions</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>May be used by AI2me without compensation</li>
          <li>Do not create any intellectual property rights for you</li>
          <li>May be incorporated into our Services at our discretion</li>
        </ul>
      </>
    ),
  },
  {
    id: "data-processing-and-privacy",
    title: "Data Processing and Privacy",
    content: (
      <>
        <h4 className="font-semibold">Data Processing Agreement</h4>
        <ul className="list-disc pl-6 space-y-1 mt-1">
          <li>Our processing of your data is governed by our Privacy Policy</li>
          <li>Additional data processing terms may apply for enterprise customers</li>
          <li>We act as a data processor for Customer Data</li>
          <li>You act as the data controller for your data</li>
        </ul>
        <h4 className="font-semibold mt-3">Data Security</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Encryption of data in transit and at rest</li>
          <li>Access controls and authentication requirements</li>
          <li>Regular security audits and assessments</li>
          <li>Incident response and breach notification procedures</li>
        </ul>
        <h4 className="font-semibold mt-3">Data Location</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Data may be processed in various geographic locations</li>
          <li>We provide information about data locations upon request</li>
          <li>Data transfers comply with applicable legal requirements</li>
          <li>Customers may specify data residency requirements in certain plans</li>
        </ul>
        <h4 className="font-semibold mt-3">Data Retention</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Customer Data is retained as specified in our Privacy Policy</li>
          <li>You may request deletion of your data upon account termination</li>
          <li>We may retain certain data for legal and operational purposes</li>
          <li>Backup data is purged according to our retention schedules</li>
        </ul>
      </>
    ),
  },
  {
    id: "service-limitations-and-disclaimers",
    title: "Service Limitations and Disclaimers",
    content: (
      <>
        <h4 className="font-semibold">Service Limitations</h4>
        <ul className="list-disc pl-6 space-y-1 mt-1">
          <li>AI Models provide predictions and insights, not guarantees</li>
          <li>Results may vary based on input data quality and completeness</li>
          <li>Services may have temporary interruptions or performance variations</li>
          <li>We do not warrant specific accuracy levels unless explicitly stated</li>
        </ul>
        <h4 className="font-semibold mt-3">AI Model Disclaimers</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>AI outputs should be reviewed and validated before use</li>
          <li>Models may exhibit bias or produce unexpected results</li>
          <li>Training data limitations may affect model performance</li>
          <li>Continuous improvement may result in output variations</li>
        </ul>
        <h4 className="font-semibold mt-3">Third-Party Dependencies</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Our Services may rely on third-party providers</li>
          <li>We are not responsible for third-party service failures</li>
          <li>Third-party terms and conditions may apply</li>
          <li>Integration with third-party services is at your risk</li>
        </ul>
        <h4 className="font-semibold mt-3">Warranty Disclaimer</h4>
        <p className="text-pretty">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, AI2me DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT
          LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>
      </>
    ),
  },
  {
    id: "indemnification",
    title: "Indemnification",
    content: (
      <>
        <h4 className="font-semibold">Customer Indemnification</h4>
        <p className="mt-1">
          You agree to indemnify, defend, and hold harmless AI2me from and against any claims, damages, losses, costs,
          and expenses (including reasonable attorneys’ fees) arising from or relating to:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Your use of the Services in violation of these Terms</li>
          <li>Your violation of applicable laws or regulations</li>
          <li>Your infringement of third-party intellectual property rights</li>
          <li>Customer Data processed through our Services</li>
          <li>Your breach of representations or warranties</li>
        </ul>
        <h4 className="font-semibold mt-3">AI2me Indemnification</h4>
        <p className="mt-1">
          AI2me will indemnify, defend, and hold harmless you from and against any third-party claims that our Services
          infringe valid patents, copyrights, or trademarks, provided that you:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Promptly notify us of any such claims</li>
          <li>Give us sole control over the defense and settlement</li>
          <li>Provide reasonable cooperation in the defense</li>
        </ul>
        <h4 className="font-semibold mt-3">Indemnification Exceptions</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Modification of our Services by you or third parties</li>
          <li>Use of Services in combination with non-AI2me products</li>
          <li>Your failure to implement Service updates</li>
          <li>Use of Services beyond the scope of these Terms</li>
        </ul>
      </>
    ),
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of Liability",
    content: (
      <>
        <h4 className="font-semibold">Limitation of Damages</h4>
        <p className="text-pretty">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL AI2me BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
          SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR BUSINESS
          OPPORTUNITIES.
        </p>
        <h4 className="font-semibold mt-3">Liability Cap</h4>
        <p className="text-pretty">
          AI2me’S TOTAL LIABILITY FOR ANY CLAIMS ARISING UNDER THESE TERMS SHALL NOT EXCEED THE AMOUNTS PAID BY YOU TO
          AI2me IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
        </p>
        <h4 className="font-semibold mt-3">Essential Purpose</h4>
        <p className="text-pretty">
          THE LIMITATIONS AND EXCLUSIONS IN THESE TERMS ARE FUNDAMENTAL ELEMENTS OF THE AGREEMENT BETWEEN YOU AND AI2me.
          AI2me WOULD NOT PROVIDE THE SERVICES WITHOUT THESE LIMITATIONS.
        </p>
        <h4 className="font-semibold mt-3">Exceptions</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>AI2me’s indemnification obligations</li>
          <li>Your payment obligations</li>
          <li>Your violation of intellectual property rights</li>
          <li>Gross negligence or willful misconduct</li>
        </ul>
      </>
    ),
  },
  {
    id: "termination",
    title: "Termination",
    content: (
      <>
        <h4 className="font-semibold">Termination by Customer</h4>
        <ul className="list-disc pl-6 space-y-1 mt-1">
          <li>At any time by providing thirty (30) days written notice</li>
          <li>Immediately if we materially breach these Terms</li>
          <li>Through the Customer Portal or by contacting support</li>
        </ul>
        <h4 className="font-semibold mt-3">Termination by AI2me</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Upon thirty (30) days written notice for convenience</li>
          <li>Immediately for material breach of these Terms</li>
          <li>Immediately for non-payment of fees</li>
          <li>Immediately for violation of Acceptable Use Policy</li>
        </ul>
        <h4 className="font-semibold mt-3">Effect of Termination</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Your access to Services will be discontinued</li>
          <li>Outstanding fees become immediately due</li>
          <li>We will provide reasonable assistance in data export</li>
          <li>Confidentiality obligations survive termination</li>
        </ul>
        <h4 className="font-semibold mt-3">Data Handling Upon Termination</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Customer Data will be made available for export for thirty (30) days</li>
          <li>Data will be securely deleted after the retention period</li>
          <li>Certain data may be retained for legal compliance</li>
          <li>Anonymized data may be retained for analytical purposes</li>
        </ul>
      </>
    ),
  },
  {
    id: "dispute-resolution",
    title: "Dispute Resolution",
    content: (
      <>
        <h4 className="font-semibold">Informal Resolution</h4>
        <ul className="list-disc pl-6 space-y-1 mt-1">
          <li>Discuss disputes in good faith</li>
          <li>Provide written notice of disputes</li>
          <li>Attempt resolution through direct negotiation</li>
          <li>Allow thirty (30) days for informal resolution</li>
        </ul>
        <h4 className="font-semibold mt-3">Binding Arbitration</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Administered by the American Arbitration Association</li>
          <li>Conducted under Commercial Arbitration Rules</li>
          <li>Single arbitrator selected by mutual agreement</li>
          <li>Location determined by arbitrator or mutual agreement</li>
        </ul>
        <h4 className="font-semibold mt-3">Class Action Waiver</h4>
        <p className="text-pretty">
          You agree that any arbitration or legal proceeding will be conducted on an individual basis only. Class
          actions, class arbitrations, and representative actions are prohibited.
        </p>
        <h4 className="font-semibold mt-3">Exceptions</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Intellectual property disputes</li>
          <li>Requests for injunctive relief</li>
          <li>Small claims court matters within jurisdictional limits</li>
        </ul>
      </>
    ),
  },
  {
    id: "governing-law",
    title: "Governing Law",
    content: (
      <>
        <p className="text-pretty">
          These Terms are governed by and construed in accordance with the laws of the State of Delaware, United States,
          without regard to conflict of law principles.
        </p>
        <p className="text-pretty">
          Any legal action or proceeding arising under these Terms will be brought exclusively in the federal or state
          courts located in Delaware, and you consent to the jurisdiction of such courts.
        </p>
      </>
    ),
  },
  {
    id: "changes-to-terms",
    title: "Changes to Terms",
    content: (
      <>
        <h4 className="font-semibold">Modification Process</h4>
        <ul className="list-disc pl-6 space-y-1 mt-1">
          <li>Posting updated Terms on our website</li>
          <li>Providing notice through the Customer Portal</li>
          <li>Sending email notification to your registered address</li>
          <li>Providing thirty (30) days advance notice for material changes</li>
        </ul>
        <h4 className="font-semibold mt-3">Acceptance of Changes</h4>
        <p className="text-pretty">
          Your continued use of the Services after the effective date of modified Terms constitutes acceptance of the
          changes. If you do not agree to the modified Terms, you must discontinue use of the Services.
        </p>
        <h4 className="font-semibold mt-3">Version Control</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Current version date is indicated at the top of these Terms</li>
          <li>Previous versions may be available upon request</li>
          <li>Material changes will be highlighted in notifications</li>
        </ul>
      </>
    ),
  },
  {
    id: "general-provisions",
    title: "General Provisions",
    content: (
      <>
        <h4 className="font-semibold">Entire Agreement</h4>
        <p className="text-pretty">
          These Terms, together with our Privacy Policy and any additional agreements, constitute the entire agreement
          between you and AI2me regarding the Services.
        </p>
        <h4 className="font-semibold mt-3">Severability</h4>
        <p className="text-pretty">
          If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full
          force and effect.
        </p>
        <h4 className="font-semibold mt-3">Assignment</h4>
        <p className="text-pretty">
          You may not assign or transfer your rights under these Terms without our written consent. We may assign our
          rights and obligations without restriction.
        </p>
        <h4 className="font-semibold mt-3">Force Majeure</h4>
        <p className="text-pretty">
          Neither party will be liable for any failure to perform due to causes beyond their reasonable control,
          including natural disasters, war, terrorism, or government actions.
        </p>
        <h4 className="font-semibold mt-3">Waiver</h4>
        <p className="text-pretty">
          Our failure to enforce any provision of these Terms does not constitute a waiver of our right to enforce such
          provision in the future.
        </p>
        <h4 className="font-semibold mt-3">Notices</h4>
        <p className="text-pretty">
          All notices must be in writing and delivered to the addresses specified in the Contact Information section.
        </p>
        <h4 className="font-semibold mt-3">Independent Contractors</h4>
        <p className="text-pretty">
          The parties are independent contractors. These Terms do not create a partnership, joint venture, or agency
          relationship.
        </p>
      </>
    ),
  },
  {
    id: "contact-information",
    title: "Contact Information",
    content: (
      <>
        <h4 className="font-semibold">General Inquiries</h4>
        <p>AI2me LLC</p>
        <p>Email: legal@ai2me.com</p>
        <p>Phone: +1 (555) 123-4567</p>
        <p>Address: [Company Address]</p>

        <h4 className="font-semibold mt-4">Legal Notices</h4>
        <p>Email: legal@ai2me.com</p>
        <p>Address: AI2me LLC, Legal Department, [Company Address]</p>

        <h4 className="font-semibold mt-4">Technical Support</h4>
        <p>Email: support@ai2me.com</p>
        <p>Phone: +1 (555) 123-4569</p>
        <p>Support Portal: [Support Portal URL]</p>

        <h4 className="font-semibold mt-4">Billing and Payment Issues</h4>
        <p>Email: billing@ai2me.com</p>
        <p>Phone: +1 (555) 123-4570</p>

        <p className="mt-4 text-pretty">
          These Terms and Conditions are effective as of the date stated above. By using AI2me’s Services, you
          acknowledge that you have read, understood, and agree to be bound by these Terms.
        </p>
        <p className="mt-2">© {new Date().getFullYear()} AI2me LLC. All rights reserved.</p>
      </>
    ),
  },
]

export function PolicySections() {
  return (
    <div className="space-y-16">
      {sections.map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-32">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2 group">
            {s.title}
            <a
              href={`#${s.id}`}
              aria-label={`Link to ${s.title}`}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-[#0033AF] text-sm font-medium"
            >
              #
            </a>
          </h2>
          <div className="mt-6 text-slate-600 leading-8 space-y-4 text-lg [&_h4]:text-slate-900 [&_h4]:font-bold [&_h4]:mt-8 [&_h4]:mb-4 [&_h4]:text-xl [&_strong]:text-slate-900 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-4 [&_li]:pl-2">
            {s.content}
          </div>
        </section>
      ))}
    </div>
  )
}
