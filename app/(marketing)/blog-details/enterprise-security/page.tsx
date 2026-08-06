import Image from "next/image";

export default function EnterpriseSecurityBlog() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 mt-20">
      {/* Blog Image */}
      <div className="mb-8">
        <Image
          src="/images/security_ai.png"
          height={500}
          width={800}
          className="h-[500px] !w-full object-cover rounded-2xl"
          alt="Enterprise Security in the Age of AI"
        />
      </div>

      {/* Meta Info */}
      <div className="flex items-center text-sm text-gray-500 mb-6 space-x-4">
        <span>October 13, 2025</span>
        <span>By Carlos Cuevas Olivar</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
        Enterprise Security in the Age of AI: Why Audit Trails and Compliance Are Critical
      </h1>

      {/* Content */}
      <div className="prose max-w-none text-gray-700 leading-relaxed space-y-6">
        <p>
          As enterprises scale their AI usage, security and compliance move to the forefront. 
          From customer data flowing through LLMs to regulatory expectations, the AI stack has 
          become both a new attack surface and an area for audit scrutiny.
        </p>

        <p>
          AI2ME helps enterprises build secure, compliant, and auditable AI systems, ensuring every 
          inference is tracked, protected, and aligned with regulations.
        </p>

        <h4 className="mt-8 mb-4">Why Security & Compliance Matter</h4>
        <p>AI models often process sensitive data. Without proper security measures, risks include:</p>
        <ul className="list-disc list-inside space-y-2">
          <li>Data leakage through prompts or logs</li>
          <li>Non-compliance with GDPR, HIPAA, or internal policies</li>
          <li>Shadow AI usage without IT oversight</li>
          <li>Untraceable decisions in regulated industries</li>
        </ul>

        <table className="table-auto border border-gray-300 w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 p-2">Challenge</th>
              <th className="border border-gray-300 p-2">Risk</th>
              <th className="border border-gray-300 p-2">Required Control</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-2">Lack of audit trails</td>
              <td className="border border-gray-300 p-2">Inability to trace model usage</td>
              <td className="border border-gray-300 p-2">Centralized logging & session tracking</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2">Unencrypted data flow</td>
              <td className="border border-gray-300 p-2">Exposure of sensitive information</td>
              <td className="border border-gray-300 p-2">End-to-end encryption</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2">Unvetted providers</td>
              <td className="border border-gray-300 p-2">Regulatory non-compliance</td>
              <td className="border border-gray-300 p-2">Provider registry & access policy</td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-2">Decentralized usage</td>
              <td className="border border-gray-300 p-2">Data governance breakdown</td>
              <td className="border border-gray-300 p-2">Role-based access & enforcement</td>
            </tr>
          </tbody>
        </table>

        <h4 className="mt-8 mb-4">How AI2ME Secures the Stack</h4>
        <ul className="list-disc list-inside space-y-2">
          <li>Centralized audit trails for every model interaction</li>
          <li>Policy enforcement to ensure only approved providers are used</li>
          <li>Real-time monitoring for anomalies or misuse</li>
          <li>Compliance dashboards to prove adherence to regulations</li>
        </ul>

        <h4 className="mt-8 mb-4">Real-World Impact</h4>
        <ul className="list-disc list-inside space-y-2">
          <li>A financial institution uses AI2ME to monitor and log every prompt for GDPR compliance.</li>
          <li>A healthcare company implements role-based access to control PHI routing.</li>
          <li>A global enterprise uses AI2ME’s dashboards to pass regulatory audits faster.</li>
        </ul>

        <h4 className="mt-8 mb-4">Conclusion</h4>
        <p>
          In the age of AI, security is not optional — it’s foundational. Audit trails, encryption, and access 
          control are must-haves for responsible AI adoption. AI2ME gives enterprises the confidence, visibility, 
          and control they need to innovate with AI — securely and compliantly.
        </p>
      </div>
    </div>
  );
}
