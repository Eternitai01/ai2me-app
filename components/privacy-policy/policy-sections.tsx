"use client"

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
    id: "introduction",
    title: "Introduction",
    content: (
      <>
        <p className="text-pretty">
          AI2me LLC (&quot;AI2me,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting the privacy and security of personal
          information. This Privacy Policy explains how we collect, use, disclose, and safeguard information when you
          use our artificial intelligence and API services.
        </p>
        <p className="text-pretty">
          AI2me provides AI-powered API services to businesses across multiple industries including banking, healthcare,
          retail, manufacturing, and other sectors. We enable organizations to integrate advanced AI capabilities into
          their systems while maintaining the highest standards of data privacy and security.
        </p>
        <p className="text-pretty">
          This Privacy Policy applies to all AI2me services, including our APIs, developer tools, websites, and related
          services (collectively, the &quot;Services&quot;).
        </p>
      </>
    ),
  },
  {
    id: "definitions",
    title: "Definitions",
    content: (
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Personal Data:</strong> Any information that identifies, relates to, describes, or could reasonably be
          associated with an identified or identifiable individual.
        </li>
        <li>
          <strong>API Client:</strong> Any business, organization, or developer that integrates with or uses
          AI2me&apos;s API services.
        </li>
        <li>
          <strong>End User:</strong> An individual who interacts with systems or applications that use AI2me&apos;s
          Services, typically customers or users of our API Clients.
        </li>
        <li>
          <strong>API Data:</strong> All data transmitted to, processed by, or received from AI2me&apos;s APIs,
          including both personal and non-personal data.
        </li>
        <li>
          <strong>Training Data:</strong> Data used to develop, train, improve, or maintain AI2me&apos;s machine
          learning models and algorithms.
        </li>
        <li>
          <strong>Processing:</strong> Any operation or set of operations performed on personal data, including
          collection, recording, organization, structuring, storage, adaptation, retrieval, consultation, use,
          disclosure, dissemination, restriction, erasure, or destruction.
        </li>
        <li>
          <strong>AI Models:</strong> Machine learning algorithms, neural networks, and other artificial intelligence
          systems developed or operated by AI2me.
        </li>
        <li>
          <strong>Services:</strong> All AI2me products, services, APIs, applications, websites, and related offerings.
        </li>
      </ul>
    ),
  },
  {
    id: "scope-and-application",
    title: "Scope and Application",
    content: (
      <>
        <p>This Privacy Policy applies to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>AI2me Websites:</strong> Our primary website (ai2me.com) and related domains
          </li>
          <li>
            <strong>API Services:</strong> All AI2me APIs and related infrastructure
          </li>
          <li>
            <strong>Developer Tools:</strong> Documentation, SDKs, testing environments, and developer resources
          </li>
          <li>
            <strong>Customer Portals:</strong> Account management and billing systems
          </li>
          <li>
            <strong>Support Services:</strong> Customer support interactions and communications
          </li>
        </ul>
        <p className="mt-2">
          This policy covers personal data we collect directly from you and personal data we process on behalf of our
          API Clients.
        </p>
      </>
    ),
  },
  {
    id: "data-controller-and-processor-roles",
    title: "Data Controller and Processor Roles",
    content: (
      <>
        <p>AI2me may act as either a &quot;Data Controller&quot; or &quot;Data Processor&quot; depending on the circumstances:</p>
        <h4 className="font-semibold mt-3">As Data Controller</h4>
        <p>We determine the purposes and means of processing when:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Collecting information through our websites and marketing activities</li>
          <li>Managing customer accounts and billing</li>
          <li>Providing customer support</li>
          <li>Developing and improving our Services</li>
          <li>Conducting security monitoring and fraud prevention</li>
        </ul>
        <h4 className="font-semibold mt-3">As Data Processor</h4>
        <p>We process personal data on behalf of API Clients when:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Processing API requests containing personal data</li>
          <li>Storing or transmitting data as part of our Services</li>
          <li>Providing AI analysis or processing as instructed by API Clients</li>
        </ul>
        <p className="mt-2">
          When acting as a Data Processor, we process personal data only according to documented instructions from our
          API Clients and in accordance with applicable data processing agreements.
        </p>
      </>
    ),
  },
  {
    id: "information-we-collect",
    title: "Information We Collect",
    content: (
      <>
        <h4 className="font-semibold">Information from API Clients</h4>
        <p className="mt-1">
          <strong>Account Information:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Company name and business details</li>
          <li>Contact information (name, email, phone, address)</li>
          <li>Billing and payment information</li>
          <li>Technical contact information</li>
          <li>API keys and authentication credentials</li>
        </ul>
        <p className="mt-2">
          <strong>Service Usage Data:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>API call logs and metrics</li>
          <li>Performance and error data</li>
          <li>Feature usage analytics</li>
          <li>Integration and configuration data</li>
        </ul>

        <h4 className="font-semibold mt-4">Information from End Users (via API Clients)</h4>
        <p className="mt-1">
          <strong>API Data:</strong> When API Clients send requests to our Services, we may process:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Text data for natural language processing</li>
          <li>Image data for computer vision tasks</li>
          <li>Audio data for speech processing</li>
          <li>Structured data for analysis and predictions</li>
          <li>Transaction data for financial services APIs</li>
          <li>Healthcare data for medical AI services</li>
          <li>Customer data for recommendation systems</li>
        </ul>
        <p className="mt-2 text-muted-foreground">
          Important: The specific personal data we process depends on how our API Clients use our Services and what data
          they choose to send to our APIs.
        </p>

        <h4 className="font-semibold mt-4">Automatically Collected Information</h4>
        <p className="mt-1">
          <strong>Website and Service Usage:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>IP addresses and device identifiers</li>
          <li>Browser type and version</li>
          <li>Operating system information</li>
          <li>Referrer URLs and page views</li>
          <li>Access times and session duration</li>
          <li>Geographic location (country/region level)</li>
        </ul>
        <p className="mt-2">
          <strong>API Performance Data:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Request/response metadata</li>
          <li>Processing times and resource usage</li>
          <li>Error rates and system performance metrics</li>
          <li>Security monitoring data</li>
        </ul>

        <h4 className="font-semibold mt-4">Information from Third Parties</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Information from payment processors for billing</li>
          <li>Data from security service providers</li>
          <li>Business information from data enrichment services</li>
          <li>Compliance and verification data from screening services</li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use-information",
    title: "How We Use Information",
    content: (
      <>
        <h4 className="font-semibold">Service Provision and Support</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>API Services:</strong> Process and respond to API requests from clients
          </li>
          <li>
            <strong>Account Management:</strong> Maintain customer accounts and provide access to Services
          </li>
          <li>
            <strong>Customer Support:</strong> Respond to inquiries and provide technical assistance
          </li>
          <li>
            <strong>Billing and Payments:</strong> Process payments and maintain billing records
          </li>
          <li>
            <strong>Service Communications:</strong> Send service-related notifications and updates
          </li>
        </ul>

        <h4 className="font-semibold mt-4">AI Model Development and Improvement</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Model Training:</strong> Develop and improve AI models using aggregated and anonymized data
          </li>
          <li>
            <strong>Performance Optimization:</strong> Enhance accuracy, speed, and reliability of AI Services
          </li>
          <li>
            <strong>New Feature Development:</strong> Create new AI capabilities and API endpoints
          </li>
          <li>
            <strong>Quality Assurance:</strong> Test and validate AI model performance
          </li>
        </ul>
        <p className="mt-2 text-muted-foreground">
          Important: We do not use personal data from API requests to train our AI models unless explicitly authorized
          by the API Client through separate agreements.
        </p>

        <h4 className="font-semibold mt-4">Security and Fraud Prevention</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Threat Detection:</strong> Monitor for security threats and suspicious activities
          </li>
          <li>
            <strong>Fraud Prevention:</strong> Identify and prevent fraudulent use of our Services
          </li>
          <li>
            <strong>System Security:</strong> Protect the integrity and availability of our infrastructure
          </li>
          <li>
            <strong>Compliance Monitoring:</strong> Ensure adherence to security standards and regulations
          </li>
        </ul>

        <h4 className="font-semibold mt-4">Analytics and Business Operations</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Usage Analytics:</strong> Understand how our Services are used to improve performance
          </li>
          <li>
            <strong>Business Intelligence:</strong> Analyze trends and patterns to inform business decisions
          </li>
          <li>
            <strong>Market Research:</strong> Study industry trends and customer needs
          </li>
          <li>
            <strong>Product Development:</strong> Guide development of new features and services
          </li>
        </ul>

        <h4 className="font-semibold mt-4">Legal and Regulatory Compliance</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Legal Obligations:</strong> Comply with applicable laws and regulations
          </li>
          <li>
            <strong>Industry Standards:</strong> Meet industry-specific compliance requirements
          </li>
          <li>
            <strong>Audit and Reporting:</strong> Support regulatory audits and required reporting
          </li>
          <li>
            <strong>Data Subject Rights:</strong> Respond to individual rights requests
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-share-information",
    title: "How We Share Information",
    content: (
      <>
        <h4 className="font-semibold">With API Clients</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>API Responses:</strong> Return processed data and AI insights as requested
          </li>
          <li>
            <strong>Service Data:</strong> Provide usage analytics and performance metrics
          </li>
          <li>
            <strong>Support Information:</strong> Share relevant data for troubleshooting and support
          </li>
        </ul>

        <h4 className="font-semibold mt-4">With Service Providers</h4>
        <p>We share information with trusted third-party service providers who assist us in:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Cloud Infrastructure: AWS, Google Cloud, Microsoft Azure for hosting and computing</li>
          <li>Payment Processing: Stripe, PayPal for billing and payment services</li>
          <li>Security Services: Cloudflare, security monitoring providers</li>
          <li>Customer Support: Help desk and ticketing systems</li>
          <li>Analytics: Performance monitoring and business intelligence tools</li>
        </ul>
        <p className="mt-2">
          All service providers are contractually bound to protect the confidentiality and security of personal data.
        </p>

        <h4 className="font-semibold mt-4">For Legal and Safety Reasons</h4>
        <p>We may disclose information when we believe it&apos;s necessary to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Comply with Law:</strong> Respond to valid legal requests from authorities
          </li>
          <li>
            <strong>Protect Rights:</strong> Enforce our terms of service and protect our legal rights
          </li>
          <li>
            <strong>Prevent Harm:</strong> Protect the safety and security of individuals or our Services
          </li>
          <li>
            <strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales
          </li>
        </ul>

        <h4 className="font-semibold mt-4">With Your Consent</h4>
        <p>We may share information with third parties when you provide explicit consent for specific purposes.</p>
      </>
    ),
  },
  {
    id: "ai-and-machine-learning",
    title: "AI and Machine Learning",
    content: (
      <>
        <h4 className="font-semibold">Data Used for AI Development</h4>
        <p className="mt-1">
          <strong>Training Data Sources:</strong> We use various data sources to train our AI models:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Publicly available datasets</li>
          <li>Commercially licensed data</li>
          <li>Synthetic and artificially generated data</li>
          <li>Aggregated, anonymized usage data (with appropriate safeguards)</li>
        </ul>
        <p className="mt-2">
          <strong>Personal Data Restrictions:</strong> We do not use personal data from API requests for model training
          unless:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Explicitly authorized by the API Client</li>
          <li>Data is properly anonymized or aggregated</li>
          <li>Appropriate legal basis exists</li>
        </ul>

        <h4 className="font-semibold mt-4">AI Model Transparency</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Model Capabilities:</strong> We provide documentation about our AI models&apos; capabilities and
            limitations
          </li>
          <li>
            <strong>Bias Prevention:</strong> We implement measures to identify and mitigate bias in our AI systems
          </li>
          <li>
            <strong>Accuracy Information:</strong> We provide guidance on expected accuracy and appropriate use cases
          </li>
          <li>
            <strong>Limitation Disclosure:</strong> We clearly communicate the limitations and potential risks of our AI
            Services
          </li>
        </ul>

        <h4 className="font-semibold mt-4">Automated Decision Making</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>API Client Control:</strong> Our APIs typically provide insights and recommendations, with final
            decisions remaining with API Clients
          </li>
          <li>
            <strong>Human Oversight:</strong> We encourage API Clients to implement human review for high-impact
            decisions
          </li>
          <li>
            <strong>Explanation Rights:</strong> Where applicable, we provide information about the logic behind AI
            outputs
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "data-security-and-protection",
    title: "Data Security and Protection",
    content: (
      <>
        <h4 className="font-semibold">Technical Safeguards</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Encryption: Data in transit and at rest is protected using industry-standard encryption</li>
          <li>Access Controls: Multi-factor authentication and role-based access controls</li>
          <li>Network Security: Firewalls, intrusion detection, and network monitoring</li>
          <li>API Security: Rate limiting, authentication, and input validation</li>
          <li>Regular Updates: Security patches and system updates are applied promptly</li>
        </ul>

        <h4 className="font-semibold mt-4">Organizational Measures</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Employee Training: Regular privacy and security training for all personnel</li>
          <li>Background Checks: Screening for employees with access to personal data</li>
          <li>Incident Response: Documented procedures for security incident response</li>
          <li>Third-Party Assessment: Regular security audits and penetration testing</li>
          <li>Compliance Certifications: SOC 2, ISO 27001, and other relevant certifications</li>
        </ul>

        <h4 className="font-semibold mt-4">Data Minimization</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Collection Limitation: We collect only data necessary for providing our Services</li>
          <li>Purpose Limitation: Data is used only for specified, legitimate purposes</li>
          <li>Storage Limitation: Data is retained only as long as necessary</li>
          <li>Access Limitation: Access to personal data is restricted to authorized personnel</li>
        </ul>
      </>
    ),
  },
  {
    id: "data-retention",
    title: "Data Retention",
    content: (
      <>
        <h4 className="font-semibold">General Retention Principles</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Service-Related Data: Retained while providing Services to API Clients</li>
          <li>Legal Requirements: Retained as required by applicable laws and regulations</li>
          <li>Legitimate Interests: Retained for security, fraud prevention, and business operations</li>
        </ul>

        <h4 className="font-semibold mt-4">Specific Retention Periods</h4>
        <p>
          <strong>Account Information:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Active accounts: Throughout the customer relationship</li>
          <li>Closed accounts: Up to 7 years for legal and business purposes</li>
        </ul>
        <p className="mt-2">
          <strong>API Data:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Request/response data: Typically processed and not stored long-term</li>
          <li>Logs and metadata: 90 days to 2 years depending on type and purpose</li>
          <li>Aggregated analytics: Indefinitely in anonymized form</li>
        </ul>
        <p className="mt-2">
          <strong>Website Data:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Activity logs: 90 days</li>
          <li>Support communications: 3 years</li>
          <li>Marketing data: Until consent is withdrawn or account closure</li>
        </ul>

        <h4 className="font-semibold mt-4">Data Deletion</h4>
        <p>Upon termination of Services or valid deletion requests:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Personal data is securely deleted within 30 days</li>
          <li>Backups containing personal data are purged within 90 days</li>
          <li>Anonymized data may be retained for analytical purposes</li>
        </ul>
      </>
    ),
  },
  {
    id: "international-data-transfers",
    title: "International Data Transfers",
    content: (
      <>
        <p>
          AI2me operates globally and may transfer personal data across international borders. We implement appropriate
          safeguards for international transfers:
        </p>
        <h4 className="font-semibold mt-3">Adequacy Decisions</h4>
        <p>Transfers to countries with adequacy decisions from relevant authorities</p>

        <h4 className="font-semibold mt-3">Standard Contractual Clauses</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>EU Standard Contractual Clauses for transfers from the EEA</li>
          <li>UK International Data Transfer Agreement for transfers from the UK</li>
          <li>Other approved transfer mechanisms as required</li>
        </ul>

        <h4 className="font-semibold mt-3">Data Privacy Frameworks</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>EU-U.S. Data Privacy Framework (when available)</li>
          <li>Swiss-U.S. Data Privacy Framework (when available)</li>
        </ul>

        <h4 className="font-semibold mt-3">Additional Safeguards</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Encryption of data in transit and at rest</li>
          <li>Access controls and authentication requirements</li>
          <li>Regular security assessments and audits</li>
        </ul>
      </>
    ),
  },
  {
    id: "your-rights-and-choices",
    title: "Your Rights and Choices",
    content: (
      <>
        <h4 className="font-semibold">
          Depending on your location and applicable laws, you may have the following rights:
        </h4>
        <h4 className="mt-2 font-medium">Access and Information Rights</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Right to Know:</strong> Information about what personal data we collect and how we use it
          </li>
          <li>
            <strong>Right of Access:</strong> Copies of your personal data in our possession
          </li>
          <li>
            <strong>Data Portability:</strong> Your data in a structured, machine-readable format
          </li>
        </ul>
        <h4 className="mt-2 font-medium">Control and Correction Rights</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Right to Rectification:</strong> Correction of inaccurate or incomplete personal data
          </li>
          <li>
            <strong>Right to Erasure:</strong> Deletion of your personal data in certain circumstances
          </li>
          <li>
            <strong>Right to Restriction:</strong> Limitation of processing in certain circumstances
          </li>
        </ul>
        <h4 className="mt-2 font-medium">Objection and Withdrawal Rights</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Right to Object:</strong> Object to processing based on legitimate interests
          </li>
          <li>
            <strong>Consent Withdrawal:</strong> Withdraw consent where processing is based on consent
          </li>
          <li>
            <strong>Marketing Opt-out:</strong> Unsubscribe from marketing communications
          </li>
        </ul>

        <h4 className="font-semibold mt-4">How to Exercise Your Rights</h4>
        <p>
          To exercise your rights, contact us at:
          <br />- Email: privacy@ai2me.com
          <br />- Data Protection Officer: dpo@ai2me.com
          <br />- Written Request: AI2me LLC, Attn: Privacy Team, [Address]
        </p>
        <p className="mt-2">
          <strong>For End Users:</strong> If you are an End User whose data is processed through our APIs, please
          contact the API Client (the business you interact with) directly, as they control how your data is processed.
        </p>
        <h4 className="font-semibold mt-4">Response Timeline</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>30 days for most requests</li>
          <li>45 days for complex requests (with notification of extension)</li>
          <li>As required by applicable local laws</li>
        </ul>
      </>
    ),
  },
  {
    id: "industry-specific-provisions",
    title: "Industry-Specific Provisions",
    content: (
      <>
        <h4 className="font-semibold">Financial Services</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Regulatory Compliance: Compliance with banking regulations (SOX, PCI DSS, etc.)</li>
          <li>KYC/AML Support: Anti-money laundering and know-your-customer processes</li>
          <li>Fraud Detection: Enhanced security measures for financial data</li>
          <li>Audit Requirements: Support for regulatory audits and examinations</li>
        </ul>

        <h4 className="font-semibold mt-4">Healthcare</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>HIPAA Compliance: Business Associate Agreements for covered entities</li>
          <li>Medical Data Security: Enhanced protections for protected health information</li>
          <li>Consent Management: Support for patient consent and authorization</li>
          <li>Clinical Standards: Compliance with healthcare industry standards (HL7, FHIR)</li>
        </ul>

        <h4 className="font-semibold mt-4">Retail and E-commerce</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>PCI DSS Compliance: Payment card data security standards</li>
          <li>Customer Analytics: Privacy-preserving customer behavior analysis</li>
          <li>Recommendation Systems: Transparent and fair algorithmic recommendations</li>
        </ul>

        <h4 className="font-semibold mt-4">Manufacturing and Industrial</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>Trade Secret Protection: Safeguards for proprietary business information</li>
          <li>IoT Security: Security measures for connected device data</li>
          <li>Supply Chain Privacy: Protection of supplier and vendor information</li>
        </ul>
      </>
    ),
  },
  {
    id: "childrens-privacy",
    title: "Children's Privacy",
    content: (
      <>
        <p>
          AI2me&apos;s Services are not directed to children under 13 years of age, and we do not knowingly collect
          personal information from children under 13. If we become aware that we have collected personal information
          from a child under 13, we will take steps to delete such information.
        </p>
        <p className="mt-2">
          For users in the EU, we do not knowingly process personal data of children under 16 without parental consent.
        </p>
      </>
    ),
  },
  {
    id: "changes-to-this-policy",
    title: "Changes to This Policy",
    content: (
      <>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal
          requirements, or other factors. When we make changes:
        </p>
        <ul className="list-disc pl-6 space-y-1 mt-1">
          <li>
            <strong>Notice:</strong> We will post the updated policy on our website
          </li>
          <li>
            <strong>Effective Date:</strong> Changes will include a new effective date
          </li>
          <li>
            <strong>Material Changes:</strong> Significant changes will be communicated via email or prominent notice
          </li>
          <li>
            <strong>Continued Use:</strong> Your continued use of our Services constitutes acceptance of the updated
            policy
          </li>
        </ul>
        <p className="mt-2">
          We encourage you to review this Privacy Policy periodically to stay informed about our privacy practices.
        </p>
      </>
    ),
  },
  {
    id: "contact-information",
    title: "Contact Information",
    content: (
      <>
        <h4 className="font-semibold">General Privacy Inquiries</h4>
        <p>AI2me LLC</p>
        <p>Email: privacy@ai2me.com</p>
        <p>Phone: +1 (555) 123-4567</p>
        <p>Address: [Company Address]</p>

        <h4 className="font-semibold mt-4">Data Protection Officer</h4>
        <p>Email: dpo@ai2me.com</p>
        <p>Phone: +1 (555) 123-4568</p>

        <h4 className="font-semibold mt-4">Regional Representatives</h4>
        <p>
          <strong>European Union</strong>
        </p>
        <p>EU Representative: [Name]</p>
        <p>Email: eu-privacy@ai2me.com</p>
        <p>Address: [EU Address]</p>
        <p className="mt-2">
          <strong>United Kingdom</strong>
        </p>
        <p>UK Representative: [Name]</p>
        <p>Email: uk-privacy@ai2me.com</p>
        <p>Address: [UK Address]</p>
      </>
    ),
  },
  {
    id: "regional-privacy-notices",
    title: "Regional Privacy Notices",
    content: (
      <>
        <h4 className="font-semibold">For California Residents (CCPA/CPRA)</h4>
        <p className="mt-1">
          <strong>Categories of Personal Information Collected:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Identifiers (name, email, IP address)</li>
          <li>Commercial information (purchase history, API usage)</li>
          <li>Internet activity (website usage, API interactions)</li>
          <li>Professional information (business contacts, company data)</li>
        </ul>
        <p className="mt-2">
          <strong>Sources of Personal Information:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Directly from you</li>
          <li>From your use of our Services</li>
          <li>From API Clients (when acting as service provider)</li>
          <li>From third-party business partners</li>
        </ul>
        <p className="mt-2">
          <strong>Business Purposes for Processing:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Providing and improving Services</li>
          <li>Customer support and communications</li>
          <li>Security and fraud prevention</li>
          <li>Legal compliance and business operations</li>
        </ul>
        <p className="mt-2">
          <strong>Categories of Third Parties We Share With:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Service providers and contractors</li>
          <li>Professional advisors (legal, accounting)</li>
          <li>Government entities (when required by law)</li>
        </ul>
        <p className="mt-2">
          <strong>California Rights:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Right to Know: Categories and specific pieces of personal information</li>
          <li>Right to Delete: Request deletion of personal information</li>
          <li>Right to Opt-Out: Opt-out of &quot;sale&quot; or &quot;sharing&quot; of personal information</li>
          <li>Right to Limit: Limit use of sensitive personal information</li>
          <li>Right to Non-Discrimination: Not be discriminated against for exercising rights</li>
        </ul>
        <p className="mt-2">
          How to Exercise Rights: Submit requests via privacy@ai2me.com or our online form. We may require verification
          of identity before processing requests.
        </p>
        <p className="mt-2">
          <strong>Sale and Sharing:</strong> We do not &quot;sell&quot; personal information as traditionally understood. We may
          &quot;share&quot; information with advertising partners, which you can opt-out of through our privacy settings.
        </p>

        <h4 className="font-semibold mt-6">For EU/UK Residents (GDPR/UK GDPR)</h4>
        <p className="mt-1">
          <strong>Legal Bases for Processing:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Contract: Performance of our Services agreement</li>
          <li>Legitimate Interests: Business operations, security, improvement of Services</li>
          <li>Legal Obligation: Compliance with applicable laws</li>
          <li>Consent: Where explicitly provided (e.g., marketing communications)</li>
        </ul>
        <p className="mt-2">
          <strong>Additional Rights:</strong>
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Right to Rectification: Correct inaccurate personal data</li>
          <li>Right to Restriction: Restrict processing in certain circumstances</li>
          <li>Right to Data Portability: Receive data in portable format</li>
          <li>Right to Object: Object to processing based on legitimate interests</li>
        </ul>
        <p className="mt-2">
          <strong>Supervisory Authority Complaints:</strong> You may lodge complaints with:
          <br />- EU: Your local data protection authority
          <br />- UK: Information Commissioner&apos;s Office (ICO)
        </p>

        <h4 className="font-semibold mt-6">For Canadian Residents (PIPEDA)</h4>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Purposes for Collection:</strong> Personal information is collected for specific, identified
            purposes related to providing our Services.
          </li>
          <li>
            <strong>Consent:</strong> We obtain meaningful consent for collection, use, and disclosure of personal
            information.
          </li>
          <li>
            <strong>Access Rights:</strong> You may request access to personal information we hold about you and
            challenge its accuracy.
          </li>
          <li>
            <strong>Complaints:</strong> You may file complaints with the Privacy Commissioner of Canada.
          </li>
        </ul>

        <p className="mt-4 text-muted-foreground">
          This Privacy Policy is effective as of the date stated above and governs our collection, use, and disclosure
          of personal information. By using AI2me&apos;s Services, you acknowledge that you have read and understand
          this Privacy Policy.
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
