import React from "react";

// ─── Reusable Sub-components ──────────────────────────────────────────────────

const SectionHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p
        style={{
            fontWeight: "bold",
            textTransform: "uppercase",
            fontSize: "11pt",
            color: "#0056b3",
            marginTop: "18px",
            marginBottom: "6px",
            letterSpacing: "0.3px",
            fontFamily: "Arial, Helvetica, sans-serif",
        }}
    >
        {children}
    </p>
);

const BlockQuote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p
        style={{
            fontStyle: "italic",
            margin: "12px 0 12px 20px",
            paddingLeft: "14px",
            borderLeft: "3px solid #0056b3",
            color: "#333",
            fontSize: "10pt",
            lineHeight: 1.5,
            textAlign: "justify",
            fontFamily: "Arial, Helvetica, sans-serif",
        }}
    >
        {children}
    </p>
);

// ─── Shared Styles ────────────────────────────────────────────────────────────

const bodyText: React.CSSProperties = {
    fontSize: "10pt",
    marginBottom: "10pt",
    textAlign: "justify",
    lineHeight: 1.5,
    color: "#000",
    fontFamily: "Arial, Helvetica, sans-serif",
};

const listStyle: React.CSSProperties = {
    marginLeft: "36px",
    marginBottom: "10pt",
    paddingLeft: "0",
};

const listItemStyle: React.CSSProperties = {
    fontSize: "10pt",
    marginBottom: "4pt",
    lineHeight: 1.5,
    color: "#000",
    fontFamily: "Arial, Helvetica, sans-serif",
    listStyleType: "square",
};

// ─── Page Component ───────────────────────────────────────────────────────────

export default function Page() {
    return (
        <div
            style={{
                maxWidth: "1280px",
                margin: "0 auto",
                padding: "80px 24px",
                backgroundColor: "#ffffff",
                color: "#000000",
                fontFamily: "Arial, Helvetica, sans-serif",
                lineHeight: 1.5,
                boxSizing: "border-box",
                minHeight: "100vh",
            }}
        >
            {/* ── Logo ──────────────────────────────────────────────────────────── */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", paddingTop: "30px" }}>
                <img
                    src="/images/logo2.png"
                    alt="AI2me Logo"
                    style={{ maxWidth: "120px", height: "auto" }}
                />
            </div>

            {/* ── FOR IMMEDIATE RELEASE ─────────────────────────────────────────── */}
            <p
                style={{
                    fontWeight: "bold",
                    fontSize: "10pt",
                    color: "#000",
                    marginBottom: "16px",
                    fontFamily: "Arial, Helvetica, sans-serif",
                }}
            >
                FOR IMMEDIATE RELEASE
            </p>

            {/* ── Divider ───────────────────────────────────────────────────────── */}
            <hr style={{ border: "none", borderTop: "1.5px solid #0056b3", marginBottom: "22px" }} />

            {/* ── Headline ──────────────────────────────────────────────────────── */}
            <h1
                style={{
                    fontSize: "20pt",
                    fontWeight: "bold",
                    textAlign: "center",
                    marginBottom: "10px",
                    lineHeight: 1.25,
                    color: "#000",
                    fontFamily: "Arial, Helvetica, sans-serif",
                }}
            >
                AI2me Unveils Complete AI C-Suite at Mobile World Congress Barcelona
            </h1>

            {/* ── Subheadline ───────────────────────────────────────────────────── */}
            <p
                style={{
                    fontSize: "11pt",
                    fontStyle: "italic",
                    textAlign: "center",
                    color: "#000",
                    marginBottom: "20px",
                    fontWeight: "normal",
                    fontFamily: "Arial, Helvetica, sans-serif",
                    lineHeight: 1.4,
                }}
            >
                Revolutionary Platform Delivers 10 Specialized AI Executives to Businesses Worldwide
            </p>

            {/* ── Dateline + Intro ──────────────────────────────────────────────── */}
            <p style={bodyText}>
                <strong>BARCELONA, Spain — March 2, 2026 —</strong> AI2me, the world&apos;s first complete
                AI C-Suite platform, today announced its pre-launch at Mobile World Congress Barcelona
                (MWC26), introducing a groundbreaking approach to AI productivity that goes far beyond
                traditional chatbots.
            </p>

            <p style={bodyText}>
                Unlike single-assistant AI tools, AI2me provides businesses with 10 specialized AI
                executives — CEO, CFO, CTO, CMO, COO, and five more — working together as a unified team.
                Each executive brings domain expertise, collaborative intelligence, and 24/7 availability at
                a fraction of the cost of human hires.
            </p>

            <BlockQuote>
                &quot;Most AI tools give you one assistant. We give you a complete C-suite,&quot; said
                Carlos Cuevas Olivar, Founder &amp; CEO of AI2me. &quot;Our platform delivers the strategic
                thinking, financial analysis, technical guidance, and operational support that growing
                businesses need — without the overhead.&quot;
            </BlockQuote>

            {/* ── Section: Beyond AI Agents ─────────────────────────────────────── */}
            <SectionHeader>Beyond AI Agents: A Complete Business Operating System</SectionHeader>

            <p style={bodyText}>
                AI2me combines its AI executive team with nine integrated productivity tools:
            </p>
            <ul style={listStyle}>
                {[
                    { name: "Web Builder", desc: "Full-stack code generation and deployment" },
                    { name: "ClearView BI", desc: "Business intelligence and analytics" },
                    { name: "Boardroom", desc: "Real-time multi-executive collaboration" },
                    { name: "Docs, Slides, Sheets", desc: "AI-powered content creation" },
                    { name: "Mail, Image, Video", desc: "Communication and media tools" },
                ].map(({ name, desc }) => (
                    <li key={name} style={listItemStyle}>
                        <strong>{name}</strong> — {desc}
                    </li>
                ))}
            </ul>

            <p style={bodyText}>
                The platform features AUTO LLM, intelligent routing across 12+ AI models from eight
                providers (OpenAI GPT-5, Claude Opus, Gemini Pro, and more), automatically selecting the
                best model for each task.
            </p>

            {/* ── Section: Enterprise-Ready ─────────────────────────────────────── */}
            <SectionHeader>Enterprise-Ready from Day One</SectionHeader>

            <p style={bodyText}>Built for businesses of all sizes, AI2me offers:</p>
            <ul style={listStyle}>
                {[
                    "SOC 2 compliance with blockchain-backed audit trails",
                    "Real-time cost tracking down to the individual request",
                    "Multi-user collaboration with role-based access",
                    "API access for custom integrations",
                ].map((item) => (
                    <li key={item} style={listItemStyle}>
                        {item}
                    </li>
                ))}
            </ul>

            <BlockQuote>
                &quot;The goal is not to replace people, but to enhance their capabilities,&quot; Cuevas
                emphasized. &quot;AI2me empowers teams to focus on what humans do best — creativity,
                relationships, and strategic vision — while our AI executives handle the analysis,
                execution, and operational heavy lifting.&quot;
            </BlockQuote>

            {/* ── Section: Strategic Partnerships ──────────────────────────────── */}
            <SectionHeader>Strategic Partnerships &amp; Market Validation</SectionHeader>

            <p style={bodyText}>
                AI2me&apos;s approach has attracted attention from major telecommunications and technology
                partners. The Miami-based company is backed by investors with deep expertise in AI,
                enterprise software, and digital transformation.
            </p>
            <p style={bodyText}>
                The platform is currently in pre-launch with limited early access for forward-thinking
                businesses seeking competitive advantage through AI.
            </p>

            {/* ── Section: MWC Barcelona Showcase ──────────────────────────────── */}
            <SectionHeader>MWC Barcelona 2026 Showcase</SectionHeader>

            <p style={bodyText}>At MWC Barcelona (March 2–5, 2026), AI2me is demonstrating:</p>
            <ul style={listStyle}>
                {[
                    "Live Boardroom sessions with all 10 AI executives",
                    "Real-time code generation via AI Developer",
                    "Voice interaction — Call and speak with AI executives via phone (+1-917-997-6650)",
                    "Meet the team — See the faces and personalities behind each AI executive",
                    "Cost transparency dashboard showing enterprise-grade financial controls",
                    "Custom AI agent demonstrations for industry-specific use cases",
                ].map((item) => (
                    <li key={item} style={listItemStyle}>
                        {item}
                    </li>
                ))}
            </ul>

            {/* ── Exclusive Offer Box ───────────────────────────────────────────── */}
            <div
                style={{
                    backgroundColor: "#eef5fc",
                    border: "1px solid #cce5ff",
                    padding: "12px 16px",
                    margin: "14px 0",
                }}
            >
                <p
                    style={{
                        fontWeight: "bold",
                        fontSize: "10pt",
                        color: "#004085",
                        marginBottom: "8px",
                        marginTop: 0,
                        fontFamily: "Arial, Helvetica, sans-serif",
                    }}
                >
                    Exclusive MWC Offer:
                </p>
                <ul style={{ ...listStyle, marginBottom: 0 }}>
                    {[
                        "500 bonus credits (5x normal signup)",
                        "30-day Pro trial (vs. standard 7 days)",
                        "Lifetime premium features for early adopters",
                        "Private Boardroom consultation with the full AI executive team",
                        "Complimentary AI agent customization assessment",
                    ].map((item) => (
                        <li key={item} style={listItemStyle}>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>

            {/* ── Section: Availability ─────────────────────────────────────────── */}
            <SectionHeader>Availability</SectionHeader>

            <p style={bodyText}>
                AI2me pre-launch access is available now at{" "}
                <a href="https://ai2me.com/mwc" style={{ color: "#0056b3" }}>
                    ai2me.com/mwc
                </a>
                . The platform launches publicly in Q2 2026.
            </p>

            {/* ── Section: About ────────────────────────────────────────────────── */}
            <SectionHeader>About AI2me</SectionHeader>

            <p style={bodyText}>
                AI2me LLC is an American company on a mission to enhance human capabilities through AI, not
                replace them. By delivering complete AI C-Suite teams with distinct personalities, faces,
                and voices, AI2me creates AI relationships that feel natural and human. The platform
                empowers professionals to focus on creativity, relationships, and strategic vision while AI
                executives handle analysis, execution, and operational complexity. Built on principles of
                human-AI collaboration, transparency, and genuine business value, AI2me provides the
                executive-level intelligence and productivity tools that modern teams need to compete in an
                AI-driven world. Founded in 2025 and headquartered in Miami, Florida, AI2me is backed by
                EternitAI Group and serves customers across telecommunications, finance, retail, and
                technology sectors.
            </p>

            {/* ── End Mark ──────────────────────────────────────────────────────── */}
            <p
                style={{
                    textAlign: "center",
                    marginTop: "22px",
                    marginBottom: "20px",
                    fontWeight: "bold",
                    color: "#555",
                    fontSize: "11pt",
                    fontFamily: "Arial, Helvetica, sans-serif",
                }}
            >
                ###
            </p>

            {/* ── Follow the Announcement ───────────────────────────────────────── */}
            <p style={{ ...bodyText, marginBottom: "2px" }}>
                <strong>Follow the Announcement:</strong>
            </p>
            <p style={{ ...bodyText, marginBottom: "20px" }}>
                Read Carlos Cuevas Olivar&apos;s LinkedIn post:{" "}
                <a
                    href="https://www.linkedin.com/posts/carlos-cuevas-olivar_mwc26-ai-enterprise-activity-7434114899745812480-W1z1"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#0056b3", fontWeight: 600, textDecoration: "none" }}
                >
                    View on LinkedIn →
                </a>
            </p>

            {/* ── Media Contact Box ─────────────────────────────────────────────── */}
            <div
                style={{
                    border: "1px solid #ccc",
                    padding: "12px 16px",
                    marginTop: "6px",
                    backgroundColor: "#fff",
                }}
            >
                <p
                    style={{
                        fontWeight: "bold",
                        fontSize: "9pt",
                        textTransform: "uppercase",
                        marginBottom: "8px",
                        marginTop: 0,
                        fontFamily: "Arial, Helvetica, sans-serif",
                        color: "#000",
                    }}
                >
                    Media Contact:
                </p>
                <p style={{ margin: "2px 0", fontSize: "9pt", fontFamily: "Arial, Helvetica, sans-serif" }}>
                    <strong>AI2me Communications</strong>
                </p>
                <p style={{ margin: "2px 0", fontSize: "9pt", fontFamily: "Arial, Helvetica, sans-serif" }}>
                    Email:{" "}
                    <a href="mailto:press@ai2me.com" style={{ color: "#0056b3", textDecoration: "none" }}>
                        press@ai2me.com
                    </a>
                </p>
                <p style={{ margin: "2px 0", fontSize: "9pt", fontFamily: "Arial, Helvetica, sans-serif" }}>
                    Phone:{" "}
                    <a href="tel:+19179976650" style={{ color: "#0056b3", textDecoration: "none" }}>
                        +1 (917) 997-6650
                    </a>
                </p>
                <p style={{ margin: "2px 0", fontSize: "9pt", fontFamily: "Arial, Helvetica, sans-serif" }}>
                    Web:{" "}
                    <a href="https://ai2me.com" style={{ color: "#0056b3", textDecoration: "none" }}>
                        ai2me.com
                    </a>
                </p>
            </div>

            {/* ── Social Media Box ──────────────────────────────────────────────── */}
            <div
                style={{
                    border: "1px solid #ccc",
                    borderTop: "none",
                    padding: "12px 16px",
                    backgroundColor: "#fff",
                }}
            >
                <p
                    style={{
                        fontWeight: "bold",
                        fontSize: "9pt",
                        textTransform: "uppercase",
                        marginBottom: "8px",
                        marginTop: 0,
                        fontFamily: "Arial, Helvetica, sans-serif",
                        color: "#000",
                    }}
                >
                    Social Media:
                </p>
                <p style={{ margin: "2px 0", fontSize: "9pt", fontFamily: "Arial, Helvetic, sans-serif" }}>
                    X (Twitter):{" "}
                    <a
                        href="https://twitter.com/AI2meTeam"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#0056b3", textDecoration: "none" }}
                    >
                        @AI2meTeam
                    </a>
                </p>
                <p style={{ margin: "2px 0", fontSize: "9pt", fontFamily: "Arial, Helvetica, sans-serif" }}>
                    LinkedIn:{" "}
                    <a
                        href="https://linkedin.com/company/ai2me"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#0056b3", textDecoration: "none" }}
                    >
                        linkedin.com/company/ai2me
                    </a>
                </p>
                <p style={{ margin: "2px 0", fontSize: "9pt", fontFamily: "Arial, Helvetica, sans-serif" }}>
                    Hashtags: #AI2me #MWCBarcelona #AIExecutives #FutureOfWork #EnterpriseAI #HumanizedAI
                </p>
            </div>
        </div>
    );
}