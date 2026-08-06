import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Us | Eternitai Group",
  description:
    "Eternitai Group is an enterprise-grade AI solutions and consulting firm dedicated to transforming how organizations innovate, operate, and create value through artificial intelligence.",
};

const TEAM = [
  {
    name: "Victoria Chen",
    role: "CHIEF EXECUTIVE OFFICER",
    bio: "Visionary leader with extensive experience driving digital transformation and scaling technology companies. Previously led strategic initiatives at Fortune 500 companies, delivering significant revenue growth through innovative AI and data-driven solutions.",
    expertise: ["Strategic Leadership", "Digital Transformation", "Enterprise AI", "Business Growth"],
    image: "/about-us/Victoria Chen CEO.jpg",
  },
  {
    name: "Sandra Okonkwo",
    role: "CHIEF OPERATING OFFICER",
    bio: "Operations excellence expert specializing in scaling high-growth technology companies. Led operational transformations across multiple industries, optimizing processes and building world-class teams that drive efficiency and innovation.",
    expertise: ["Operations Management", "Process Optimization", "Team Building", "Scalability"],
    image: "/about-us/Patricia Hayes CCO.jpg",
  },
  {
    name: "Marcus Webb",
    role: "CHIEF FINANCIAL OFFICER",
    bio: "Financial strategist with extensive experience in venture-backed startups and public companies. Expert in capital allocation, financial planning, and M&A transactions. Successfully raised significant funding and managed P&L for large-scale organizations.",
    expertise: ["Financial Strategy", "Capital Markets", "M&A", "FP&A"],
    image: "/about-us/Marcus Webb CFO.jpg",
  },
  {
    name: "Raj Krishnamurthy",
    role: "CHIEF TECHNOLOGY OFFICER",
    bio: "Technology innovator and AI architect with deep expertise in machine learning, cloud infrastructure, and enterprise software. Built scalable platforms serving large user bases. Former engineering leader at top tech companies, specializing in AI/ML systems and distributed computing.",
    expertise: ["AI/ML Systems", "Cloud Architecture", "Software Engineering", "Platform Development"],
    image: "/about-us/Raj Krishnamurthy.jpg",
  },
  {
    name: "Elena Rodriguez",
    role: "CHIEF MARKETING OFFICER",
    bio: "Brand strategist and growth marketer with proven track record building global brands and driving customer acquisition. Expert in data-driven marketing, brand positioning, and go-to-market strategies. Significantly increased brand awareness and customer base at previous companies.",
    expertise: ["Brand Strategy", "Growth Marketing", "Digital Marketing", "Customer Acquisition"],
    image: "/about-us/Elena Rodriguez CMO.jpg",
  },
  {
    name: "James Mitchell",
    role: "CHIEF STRATEGY OFFICER",
    bio: "Strategic advisor and business transformation expert. Former management consultant at top-tier firms, advising C-suite executives on market entry, competitive strategy, and organizational transformation. Led strategic planning for companies across technology, healthcare, and financial services.",
    expertise: ["Strategic Planning", "Business Transformation", "Market Analysis", "Corporate Strategy"],
    image: "/about-us/James MItchell CSO.jpg",
  },
  {
    name: "Michelle Thompson",
    role: "CHIEF HR OFFICER",
    bio: "People and culture leader focused on building high-performing teams and inclusive workplaces. Designed talent strategies, leadership development programs, and organizational cultures that attract top talent. Significantly reduced turnover and improved employee engagement scores.",
    expertise: ["Talent Acquisition", "Organizational Development", "Culture Building", "Leadership Development"],
    image: "/about-us/Michelle Thompson CHRO.jpg",
  },
  {
    name: "David Nakamura",
    role: "CHIEF LEGAL OFFICER",
    bio: "Legal executive with expertise in technology law, intellectual property, and corporate governance. Former partner at leading law firms, specializing in tech transactions, data privacy, and regulatory compliance. Successfully navigated complex legal challenges for high-growth technology companies.",
    expertise: ["Technology Law", "IP Strategy", "Corporate Governance", "Regulatory Compliance"],
    image: "/about-us/David Nakamura.jpg",
  },
  {
    name: "Patricia Hayes",
    role: "CHIEF COMPLIANCE OFFICER",
    bio: "Compliance and risk management expert with deep knowledge of regulatory frameworks across multiple industries. Built comprehensive compliance programs for financial services and technology companies, ensuring adherence to GDPR, SOC 2, and industry-specific regulations.",
    expertise: ["Risk Management", "Regulatory Compliance", "Data Privacy", "Audit & Controls"],
    image: "/about-us/Sandra Okonkwo.jpg",
  },
  {
    name: "Amaya Sinclair",
    role: "CHIEF OF STAFF",
    bio: "Strategic operations leader and executive advisor with expertise in cross-functional coordination and organizational effectiveness. Drives key initiatives, manages executive operations, and ensures alignment across leadership teams. Previously supported C-suite executives at Fortune 500 companies.",
    expertise: ["Executive Operations", "Strategic Coordination", "Program Management", "Stakeholder Management"],
    image: "/about-us/Amaya Sinclair COS.jpg",
  },
];

const COFOUNDERS = {
  en: [
    { name: "Nico Cuevas", title: "CO-FOUNDER", image: "/about-us/Nico.png", linkedin: "#", bio: "Co-founder with a passion for innovation and technology. Born in Miami, Florida, bringing fresh perspectives and entrepreneurial vision to drive the company's mission forward. Focused on building transformative AI solutions and creating value for enterprises and creators worldwide.", expertise: ["Entrepreneurship", "Innovation", "Strategic Vision", "Business Development"], experience: "5+ years of experience" },
    { name: "Santino Cuevas", title: "CO-FOUNDER", image: "/about-us/Santino.png", linkedin: "#", bio: "Co-founder dedicated to advancing AI technology and digital transformation. Based in Miami, Florida, combining technical insight with business acumen to shape the future of enterprise AI solutions. Committed to delivering innovative platforms that empower organizations to achieve their goals.", expertise: ["Technology Strategy", "Product Development", "Digital Innovation", "Strategic Partnerships"], experience: "3+ years of experience" },
  ],
  es: [
    { name: "Nico Cuevas", title: "CO-FUNDADOR", image: "/about-us/Nico.png", linkedin: "#", bio: "Co-fundador con pasión por la innovación y la tecnología. Nacido en Miami, Florida, aporta perspectivas frescas y visión empresarial para impulsar la misión de la empresa. Enfocado en construir soluciones de IA transformadoras y crear valor para empresas y creadores en todo el mundo.", expertise: ["Emprendimiento", "Innovación", "Visión Estratégica", "Desarrollo de Negocios"], experience: "5+ años de experiencia" },
    { name: "Santino Cuevas", title: "CO-FUNDADOR", image: "/about-us/Santino.png", linkedin: "#", bio: "Co-fundador dedicado a avanzar en tecnología de IA y transformación digital. Con sede en Miami, Florida, combina visión técnica con perspicacia empresarial para dar forma al futuro de las soluciones de IA empresarial. Comprometido con la entrega de plataformas innovadoras que empoderan a las organizaciones para alcanzar sus objetivos.", expertise: ["Estrategia Tecnológica", "Desarrollo de Productos", "Innovación Digital", "Alianzas Estratégicas"], experience: "3+ años de experiencia" },
  ],
};

const COFOUNDERS_LIST = COFOUNDERS.en;

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-[#F7F8F9]">
      <section className="pt-24 pb-12 md:pt-28 md:pb-16 px-4 sm:px-4 lg:px-6">
        <div className="container max-w-6xl mx-auto mt-[100px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div className="space-y-6 lg:space-y-8">
              <h1 className="text-[32px] sm:text-[40px] md:text-[48px] font-bold text-[#121416] text-left">
                About Us
              </h1>
              <p className="text-base sm:text-lg text-[#626970] leading-relaxed">
                Eternitai Group is an enterprise-grade AI solutions and consulting firm dedicated to
                transforming how organizations innovate, operate, and create value through artificial
                intelligence.
              </p>

              <div className="rounded-xl bg-[#121416] p-6 sm:p-8 text-white border border-[#C3CAD180] shadow-sm">
                <h2 className="text-lg font-bold mb-2">What We Do</h2>
                <p className="text-sm text-white/90 leading-relaxed">
                  We collaborate with enterprises and creators across industries such as finance,
                  healthcare, retail, and education, providing strategic AI advisory, secure
                  infrastructure, intelligent automation, creative multimedia platforms, cybersecurity
                  solutions, and data-driven analytics.
                </p>
              </div>

              <div className="rounded-xl bg-[#121416] p-6 sm:p-8 text-white border border-[#C3CAD180] shadow-sm">
                <h2 className="text-lg font-bold mb-2">How We Work</h2>
                <p className="text-sm text-white/90 leading-relaxed">
                  From proof-of-concept to enterprise-scale deployment, we take an end-to-end approach
                  by identifying high-impact AI opportunities, building organizational capabilities, and
                  delivering measurable outcomes in a fast-evolving digital environment.
                </p>
              </div>

              <h2 className="text-2xl font-bold text-[#121416]">Team & Leadership</h2>
              <p className="text-[#626970] leading-relaxed">
                Led by <strong className="text-[#121416]">Carlos Cuevas Olivar</strong>: A visionary
                entrepreneur with extensive global experience in building and scaling innovative
                companies across multiple industries.
              </p>
              <ul className="list-disc list-inside text-[#626970] space-y-2">
                <li>
                  <strong className="text-[#121416]">Proven executive leadership:</strong> Brings a
                  strong track record of successful exits, deep expertise in AI and strategic
                  transformation, and an extensive network of C-level executives worldwide.
                </li>
                <li>
                  <strong className="text-[#121416]">Highly qualified professional team:</strong>{" "}
                  Includes experienced entrepreneurs, industry advisors, creative innovators, and
                  skilled developers combining technical excellence with strategic insight.
                </li>
                <li>
                  <strong className="text-[#121416]">Enterprise-grade AI development and
                  partnerships:</strong> Specializes in architecting and deploying enterprise-grade AI
                  solutions, supported by a C-level network across Fortune 500 and emerging
                  enterprises.
                </li>
              </ul>
              <div className="flex flex-wrap gap-3">
                {/* <Button
                  variant="filledBlack"
                  size="lg"
                  className="!rounded-md"
                  asChild
                >
                  <Link href="#biography">Biography</Link>
                </Button>
                <Button
                  variant="outlineBlack"
                  size="lg"
                  className="!rounded-md border-[#121416] text-[#121416] hover:bg-[#121416] hover:text-white"
                  asChild
                >
                  <Link href="/blog">View Articles</Link>
                </Button> */}
              </div>
            </div>

            <div className="flex flex-col items-center lg:items-end">
              <div className="relative w-full max-w-sm rounded-xl overflow-hidden mt-[200px]">
                <Image
                  src="/about-us/founder.png"
                  alt="Carlos Cuevas Olivar, Founder & CEO"
                  width={384}
                  height={512}
                  className="w-full h-auto"
                  sizes="(max-width: 1024px) 100vw, 384px"
                  priority
                />
              </div>
              <div className="flex items-center justify-between w-full max-w-sm mt-4">
                <Link
                  href="https://www.linkedin.com/in/carlos-cuevas-olivar/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full border hover:bg-muted inline-flex flex-shrink-0"
                  aria-label="Carlos Cuevas Olivar on LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </Link>
                <div className="text-right">
                  <p className="font-semibold text-[#121416]">Carlos Cuevas Olivar</p>
                  <p className="text-sm text-[#626970]">Founder & CEO</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-4 lg:px-6 pb-12 md:pb-20">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-[#121416] text-center">
            Co-Founders
          </h2>
          <p className="text-[#626970] text-center mb-10 md:mb-14">Where AI meets real productivity</p>
          <div className="space-y-8 md:space-y-10">
            {COFOUNDERS_LIST.map((member, index) => {
              const imageFirst = index % 2 === 0;
              return (
                <article
                  key={member.name}
                  className="bg-white rounded-xl border border-[#C3CAD180] p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-6 md:gap-8 items-center"
                >
                  <div
                    className={`relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-[#E5E7EB] flex-shrink-0 order-1 ${!imageFirst ? "md:order-2" : ""}`}
                  >
                    {member.image ? (
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-2xl font-bold text-[#626970]"
                        aria-hidden
                      >
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                    )}
                  </div>
                  <div className={`flex-1 min-w-0 order-2 ${!imageFirst ? "md:order-1" : ""}`}>
                    <h3 className="text-lg md:text-xl font-bold text-[#121416]">{member.name}</h3>
                    <p className="text-xs font-semibold text-[#0033AF] uppercase tracking-wide mt-1 mb-1">
                      {member.title}
                    </p>
                    {member.experience && (
                      <p className="text-xs text-[#626970] mb-3">{member.experience}</p>
                    )}
                    <p className="text-sm text-[#626970] leading-relaxed mb-4">{member.bio}</p>
                    <p className="text-xs font-semibold text-[#121416] mb-2">Areas of Expertise</p>
                    <ul className="flex flex-wrap gap-1.5" role="list">
                      {member.expertise.map((e) => (
                        <li
                          key={e}
                          className="text-xs px-2 py-1 rounded-md bg-[#F7F8F9] text-[#626970]"
                        >
                          {e}
                        </li>
                      ))}
                    </ul>
                    {member.linkedin && member.linkedin !== "#" && (
                      <Link
                        href={member.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex mt-3 p-2 rounded-full border border-[#C3CAD180] hover:bg-[#F7F8F9]"
                        aria-label={`${member.name} on LinkedIn`}
                      >
                        <Linkedin className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-4 lg:px-6 pb-12 md:pb-20">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-[#121416] text-center">
            AI Executive Team
          </h2>
          <p className="text-[#626970] text-center mb-10 md:mb-14">Where AI meets real productivity</p>

          <div className="space-y-8 md:space-y-10">
            {TEAM.map((member, index) => {
              const imageFirst = index % 2 === 0;
              return (
                <article
                  key={member.name}
                  className="bg-white rounded-xl border border-[#C3CAD180] p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-6 md:gap-8 items-center"
                >
                  <div
                    className={`relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-[#E5E7EB] flex-shrink-0 order-1 ${!imageFirst ? "md:order-2" : ""}`}
                  >
                    {member.image ? (
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-2xl font-bold text-[#626970]"
                        aria-hidden
                      >
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                    )}
                  </div>
                  <div className={`flex-1 min-w-0 order-2 ${!imageFirst ? "md:order-1" : ""}`}>
                    <h3 className="text-lg md:text-xl font-bold text-[#121416]">{member.name}</h3>
                    <p className="text-xs font-semibold text-[#0033AF] uppercase tracking-wide mt-1 mb-3">
                      {member.role}
                    </p>
                    <p className="text-sm text-[#626970] leading-relaxed mb-4">{member.bio}</p>
                    <p className="text-xs font-semibold text-[#121416] mb-2">Areas of Expertise</p>
                    <ul className="flex flex-wrap gap-1.5" role="list">
                      {member.expertise.map((e) => (
                        <li
                          key={e}
                          className="text-xs px-2 py-1 rounded-md bg-[#F7F8F9] text-[#626970]"
                        >
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-4 lg:px-6 pb-16 md:pb-24">
        <div className="container max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 text-[#121416]">Contact Us</h2>
          <p className="text-[#626970] mb-6">Our Services</p>
          <Button
            asChild
            size="lg"
            className="bg-[#0033AF] hover:bg-[#002a8c] text-white !rounded-md"
          >
            <Link href="/contact">Get in Touch</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
