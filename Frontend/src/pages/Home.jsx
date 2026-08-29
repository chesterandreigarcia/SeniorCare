import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  UserPlus,
  LogIn,
  Wallet,
  Gift,
  FileText,
  Megaphone,
  CalendarDays,
  Bell,
  ShieldCheck,
  QrCode,
  Users,
  Building2,
  Phone,
  ArrowRight,
  CheckCircle,
  ClipboardCheck,
  Menu,
  X,
  Award,
  HeartHandshake,
  HandCoins,
  BadgeCheck,
  Clock,
  UserCheck,
  MessageCircle,
  MapPin,
  HelpCircle,
} from "lucide-react";

// ---------------------------------------------
// Sample Data
// ---------------------------------------------

const aboutPoints = [
  { icon: Wallet, label: "Pension information" },
  { icon: Gift, label: "Benefits and assistance" },
  { icon: FileText, label: "Applications" },
  { icon: Megaphone, label: "Barangay announcements" },
  { icon: CalendarDays, label: "Social activities" },
  { icon: Bell, label: "Notifications" },
  { icon: HeartHandshake, label: "Senior citizen concerns" },
];

const services = [
  {
    icon: Wallet,
    name: "My Pension",
    desc: "View pension information, schedules, and claiming details.",
  },
  {
    icon: Gift,
    name: "My Benefits",
    desc: "See potentially applicable benefits and assistance programs.",
  },
  {
    icon: FileText,
    name: "My Applications",
    desc: "Track submitted applications and their status.",
  },
  {
    icon: Megaphone,
    name: "Announcements",
    desc: "Stay updated with barangay announcements and important notices.",
  },
  {
    icon: CalendarDays,
    name: "Social Activities",
    desc: "Discover upcoming senior citizen activities and community events.",
  },
  {
    icon: Bell,
    name: "Notifications",
    desc: "Receive updates on services, applications, schedules, and announcements.",
  },
];

const steps = [
  {
    icon: UserPlus,
    title: "Register",
    desc: "The senior citizen creates an account and provides the required information.",
  },
  {
    icon: ShieldCheck,
    title: "Verification",
    desc: "The barangay verifies the submitted information and documents.",
  },
  {
    icon: CheckCircle,
    title: "Approval",
    desc: "Once verified, the account is approved and activated.",
  },
  {
    icon: ClipboardCheck,
    title: "Access Services",
    desc: "The senior citizen can access the available SeniorCare services.",
  },
];

const eligibilityExamples = [
  { icon: Award, label: "Octogenarian", detail: "Ages 80–89" },
  { icon: BadgeCheck, label: "Nonagenarian", detail: "Ages 90–99" },
  { icon: HeartHandshake, label: "Centenarian", detail: "Ages 100+" },
  {
    icon: HandCoins,
    label: "Financial Assistance",
    detail: "Income-based programs",
  },
  {
    icon: Gift,
    label: "Other Programs",
    detail: "Additional barangay/LGU offers",
  },
];

const announcements = [
  {
    icon: CalendarDays,
    label: "Pension",
    title: "Pension Claiming Schedule",
    date: "Aug 2026",
    desc: "View this month's claiming dates and time slots for your barangay.",
  },
  {
    icon: HandCoins,
    label: "Assistance",
    title: "Financial Assistance Program",
    date: "Aug 2026",
    desc: "New assistance program open for qualified senior citizens.",
  },
  {
    icon: Megaphone,
    label: "Notice",
    title: "Barangay Notice",
    date: "Jul 2026",
    desc: "Updated office hours for senior citizen document processing.",
  },
  {
    icon: Users,
    label: "Activity",
    title: "Upcoming Senior Citizen Activity",
    date: "Jul 2026",
    desc: "Join our community wellness day this coming weekend.",
  },
];

// ---------------------------------------------
// Small Reusable Pieces
// ---------------------------------------------

function SectionLabel({ children }) {
  return (
    <p className="text-sm font-semibold tracking-wide uppercase text-[#2f6690] mb-3">
      {children}
    </p>
  );
}

function NavLink({ href, children, onClick }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="text-[#16425b] hover:text-[#2f6690] font-medium transition-colors"
    >
      {children}
    </a>
  );
}

// ---------------------------------------------
// Main Page
// ---------------------------------------------

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="bg-white text-[#16425b] font-sans scroll-smooth overflow-x-hidden">
      {/* ===== Navbar ===== */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#d9dcd6]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-4 flex items-center justify-between">
          <a
            href="#home"
            className="flex items-center gap-2"
            onClick={closeMenu}
          >
            <Heart className="w-7 h-7 text-[#2f6690]" strokeWidth={2} />
            <span className="font-serif text-2xl font-semibold text-[#16425b]">
              SeniorCare
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <NavLink href="#home">Home</NavLink>
            <NavLink href="#about">About</NavLink>
            <NavLink href="#services">Services</NavLink>
            <NavLink href="#announcements">Announcements</NavLink>
            <NavLink href="#contact">Contact</NavLink>
          </nav>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="flex items-center gap-2 px-5 py-2 rounded-full font-medium text-[#2f6690] border border-[#2f6690] hover:bg-[#2f6690] hover:text-white transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Login
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-2 px-5 py-2 rounded-full font-medium text-white bg-[#2f6690] hover:bg-[#16425b] transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Register
            </Link>
          </div>

          {/* Hamburger button (mobile only) */}
          <button
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg border border-[#d9dcd6] text-[#16425b]"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <div className="md:hidden border-t border-[#d9dcd6] bg-white px-5 py-4">
            <nav className="flex flex-col gap-4 mb-4">
              <NavLink href="#home" onClick={closeMenu}>
                Home
              </NavLink>
              <NavLink href="#about" onClick={closeMenu}>
                About
              </NavLink>
              <NavLink href="#services" onClick={closeMenu}>
                Services
              </NavLink>
              <NavLink href="#announcements" onClick={closeMenu}>
                Announcements
              </NavLink>
              <NavLink href="#contact" onClick={closeMenu}>
                Contact
              </NavLink>
            </nav>
            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                onClick={closeMenu}
                className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full font-medium text-[#2f6690] border border-[#2f6690]"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
              <Link
                to="/register"
                onClick={closeMenu}
                className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full font-medium text-white bg-[#2f6690]"
              >
                <UserPlus className="w-4 h-4" />
                Register
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ===== Hero Section ===== */}
      <section
        id="home"
        className="max-w-7xl mx-auto px-5 sm:px-6 py-14 md:py-24"
      >
        <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-center">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight text-[#16425b]">
              Caring for our seniors, connecting them to the services they
              deserve.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-[#16425b]/80 leading-relaxed">
              SeniorCare makes it easier for senior citizens to access barangay
              services — pensions, benefits, assistance, announcements, and
              community activities, all in one place.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-4">
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3 rounded-full font-semibold text-white bg-[#2f6690] hover:bg-[#16425b] transition-colors text-lg"
              >
                <UserPlus className="w-5 h-5" />
                Register as Senior Citizen
              </Link>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3 rounded-full font-semibold text-[#2f6690] border-2 border-[#2f6690] hover:bg-[#81c3d7]/20 transition-colors text-lg"
              >
                <LogIn className="w-5 h-5" />
                Login
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-lg border border-[#d9dcd6]">
              <img
                src="https://images.unsplash.com/photo-1584515933487-779824d29309?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Senior citizens smiling together in their community"
                className="w-full h-64 sm:h-80 md:h-96 object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-md px-5 py-4 border border-[#d9dcd6] hidden sm:block">
              <p className="text-sm text-[#16425b]/70">Serving</p>
              <p className="font-serif text-2xl font-semibold text-[#16425b]">
                Your Barangay
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== About Section ===== */}
      <section
        id="about"
        className="bg-[#d9dcd6]/40 py-16 md:py-20 border-y border-[#d9dcd6]"
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 grid md:grid-cols-2 gap-10 items-start">
          <div>
            <SectionLabel>About SeniorCare</SectionLabel>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-[#16425b] mb-4">
              A simple bridge between senior citizens and their barangay
            </h2>
            <p className="text-[#16425b]/80 leading-relaxed mb-6">
              SeniorCare is designed to connect senior citizens with their
              barangay and make important services easier to reach. It brings
              together the information and tools senior citizens need most,
              presented simply and clearly.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#81c3d7]/30 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-[#2f6690]" />
              </div>
              <div className="w-12 h-12 rounded-full bg-[#81c3d7]/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#2f6690]" />
              </div>
              <div className="w-12 h-12 rounded-full bg-[#81c3d7]/30 flex items-center justify-center">
                <Heart className="w-6 h-6 text-[#2f6690]" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {aboutPoints.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl bg-white border border-[#d9dcd6] px-4 py-3"
              >
                <Icon className="w-5 h-5 text-[#3a7ca5] shrink-0" />
                <span className="text-sm sm:text-base text-[#16425b] font-medium">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Services Section ===== */}
      <section id="services" className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="max-w-2xl mb-10 md:mb-12">
            <SectionLabel>Services</SectionLabel>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-[#16425b]">
              Services made easier for senior citizens
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {services.map(({ icon: Icon, name, desc }) => (
              <div
                key={name}
                className="rounded-2xl border border-[#d9dcd6] p-6 hover:shadow-md transition-shadow bg-white"
              >
                <div className="w-12 h-12 rounded-xl bg-[#81c3d7]/25 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#2f6690]" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-[#16425b] mb-2">
                  {name}
                </h3>
                <p className="text-[#16425b]/75 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How SeniorCare Works ===== */}
      <section className="bg-[#d9dcd6]/40 py-16 md:py-20 border-y border-[#d9dcd6]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="max-w-2xl mb-12 md:mb-14">
            <SectionLabel>How It Works</SectionLabel>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-[#16425b]">
              From registration to service, in four simple steps
            </h2>
          </div>

          <div className="relative grid sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
            <div className="hidden md:block absolute top-6 left-0 right-0 h-0.5 bg-[#81c3d7]" />

            {steps.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="relative">
                <div className="relative z-10 w-12 h-12 rounded-full bg-[#2f6690] text-white flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#3a7ca5] mb-1">
                  Step {i + 1}
                </p>
                <h3 className="font-serif text-xl font-semibold text-[#16425b] mb-2">
                  {title}
                </h3>
                <p className="text-[#16425b]/75 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Benefits / Eligibility Section ===== */}
      <section className="bg-[#16425b] py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="max-w-2xl mb-10">
            <p className="text-sm font-semibold tracking-wide uppercase text-[#81c3d7] mb-3">
              Benefits &amp; Assistance
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-white">
              Find out what you may be eligible for
            </h2>
            <p className="mt-4 text-[#d9dcd6] leading-relaxed">
              SeniorCare helps identify assistance programs that may apply to
              you based on your age and status. Actual eligibility depends on
              your barangay and LGU's available programs — not every senior
              citizen automatically qualifies for every program.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 sm:gap-4">
            {eligibilityExamples.map(({ icon: Icon, label, detail }) => (
              <div
                key={label}
                className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-5 sm:px-6 py-4 text-white"
              >
                <Icon className="w-6 h-6 text-[#81c3d7]" />
                <div>
                  <p className="font-serif text-base sm:text-lg font-semibold">
                    {label}
                  </p>
                  <p className="text-sm text-[#d9dcd6]">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Pension Feature Section ===== */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 grid md:grid-cols-2 gap-10 md:gap-12 items-center">
          <div>
            <SectionLabel>Pension Made Easy</SectionLabel>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-[#16425b] mb-6">
              Know your pension, claim it with ease
            </h2>
            <ul className="space-y-4">
              {[
                {
                  icon: Wallet,
                  text: "Check your pension information anytime",
                },
                {
                  icon: CalendarDays,
                  text: "View upcoming claiming schedules",
                },
                { icon: Clock, text: "Select an available claiming time slot" },
                {
                  icon: QrCode,
                  text: "Generate a QR claiming pass in seconds",
                },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <Icon className="w-5 h-5 mt-0.5 text-[#3a7ca5] shrink-0" />
                  <span className="text-[#16425b]/80 leading-relaxed">
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-[#d9dcd6]/40 border border-[#d9dcd6] p-8 sm:p-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#2f6690] flex items-center justify-center mb-4">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <p className="font-serif text-xl sm:text-2xl font-semibold text-[#16425b] mb-2">
              QR Claiming Pass
            </p>
            <p className="text-[#16425b]/75">
              Generate a simple pass to present at your barangay pension
              claiming schedule — no lines, no confusion.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Guardian / Representative Section ===== */}
      <section className="bg-[#d9dcd6]/40 py-16 md:py-20 border-y border-[#d9dcd6]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 text-center max-w-3xl">
          <SectionLabel>Guardian Support</SectionLabel>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-[#16425b] mb-4">
            Help from a trusted representative
          </h2>
          <p className="text-[#16425b]/80 leading-relaxed mb-8">
            An authorized guardian or representative can assist a senior citizen
            with pension claiming, document submission, assistance applications,
            and tracking application status — making the process easier and more
            trustworthy for everyone.
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {[
              { icon: Wallet, label: "Pension Claiming" },
              { icon: FileText, label: "Document Submission" },
              { icon: UserCheck, label: "Applications" },
              { icon: Users, label: "Application Tracking" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-white border border-[#d9dcd6] text-[#16425b] font-medium text-sm sm:text-base"
              >
                <Icon className="w-4 h-4 text-[#3a7ca5]" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Barangay Connection Section ===== */}
      <section className="bg-[#16425b] py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 text-center">
          <p className="text-sm font-semibold tracking-wide uppercase text-[#81c3d7] mb-3">
            Community
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-4">
            Connecting Seniors With Their Barangay
          </h2>
          <p className="max-w-2xl mx-auto text-[#d9dcd6] leading-relaxed mb-12">
            SeniorCare bridges senior citizens and their barangay — bringing
            services, verification, assistance, announcements, and activities
            together in one connected system.
          </p>

          <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
            {[
              { icon: Building2, label: "Services" },
              { icon: ShieldCheck, label: "Verification" },
              { icon: HeartHandshake, label: "Assistance" },
              { icon: Megaphone, label: "Announcements" },
              { icon: Users, label: "Activities" },
              { icon: MessageCircle, label: "Concerns" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 text-white"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[#81c3d7]" />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Announcements Section ===== */}
      <section id="announcements" className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="max-w-2xl mb-10 md:mb-12">
            <SectionLabel>Stay Informed</SectionLabel>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-[#16425b]">
              Latest Announcements
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {announcements.map(({ icon: Icon, label, title, date, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-[#d9dcd6] p-6 bg-[#d9dcd6]/30 flex flex-col"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-white bg-[#2f6690] rounded-full px-3 py-1">
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </span>
                </div>
                <p className="text-sm text-[#3a7ca5] font-semibold mb-2">
                  {date}
                </p>
                <h3 className="font-serif text-lg font-semibold text-[#16425b] mb-2">
                  {title}
                </h3>
                <p className="text-[#16425b]/75 text-sm leading-relaxed flex-1">
                  {desc}
                </p>
                <span className="mt-4 flex items-center gap-1 text-[#2f6690] font-medium text-sm">
                  View Details <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Help / Contact Section ===== */}
      <section
        id="contact"
        className="bg-[#d9dcd6]/40 py-16 md:py-20 border-y border-[#d9dcd6]"
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 text-center max-w-2xl">
          <div className="w-14 h-14 rounded-full bg-[#2f6690] flex items-center justify-center mx-auto mb-5">
            <HelpCircle className="w-7 h-7 text-white" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-[#16425b] mb-4">
            Need Help?
          </h2>
          <p className="text-[#16425b]/80 leading-relaxed mb-4">
            Your barangay office can help with registration, account
            verification, required documents, applications, and any other
            SeniorCare concerns.
          </p>
          <div className="flex items-center justify-center gap-6 text-[#16425b]/70 text-sm mb-8">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-[#3a7ca5]" /> Your Barangay Office
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="w-4 h-4 text-[#3a7ca5]" /> Local OSCA Desk
            </span>
          </div>
          <button className="inline-flex items-center gap-2 w-full sm:w-auto justify-center px-8 py-3 rounded-full font-semibold text-white bg-[#2f6690] hover:bg-[#16425b] transition-colors text-lg">
            <Phone className="w-5 h-5" />
            Contact Barangay Office
          </button>
        </div>
      </section>

      {/* ===== Final Call-to-Action ===== */}
      <section className="bg-[#3a7ca5] py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center">
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-4">
            Ready to Get Started With SeniorCare?
          </h2>
          <p className="text-white/90 leading-relaxed mb-8">
            Register today or log in to access the services available to you.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3 rounded-full font-semibold text-[#16425b] bg-white hover:bg-[#d9dcd6] transition-colors text-lg"
            >
              <UserPlus className="w-5 h-5" />
              Register as Senior Citizen
            </Link>
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-7 py-3 rounded-full font-semibold text-white border-2 border-white hover:bg-white/10 transition-colors text-lg"
            >
              <LogIn className="w-5 h-5" />
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-[#16425b] text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 grid sm:grid-cols-2 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-6 h-6 text-[#81c3d7]" />
              <span className="font-serif text-xl font-semibold">
                SeniorCare
              </span>
            </div>
            <p className="text-[#d9dcd6] text-sm leading-relaxed">
              Connecting senior citizens with their barangay for easier access
              to pensions, benefits, and community services.
            </p>
          </div>

          <div>
            <p className="font-semibold mb-3">Useful Links</p>
            <ul className="space-y-2 text-[#d9dcd6] text-sm">
              <li>
                <a href="#home" className="hover:text-white">
                  Home
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-white">
                  About
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-white">
                  Services
                </a>
              </li>
              <li>
                <a href="#announcements" className="hover:text-white">
                  Announcements
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-3">Support</p>
            <ul className="space-y-2 text-[#d9dcd6] text-sm">
              <li>
                <a href="#contact" className="hover:text-white">
                  Help
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-white">
                  Barangay Office
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-3">Legal</p>
            <ul className="space-y-2 text-[#d9dcd6] text-sm">
              <li>
                <a href="#" className="hover:text-white">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Terms of Use
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-6 mt-12 pt-6 border-t border-white/20 text-center text-sm text-[#d9dcd6]">
          © 2026 SeniorCare. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
