"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/Logo";
import { useAuth, defaultRouteForRole } from "@/context/AuthContext";
import {
  Activity,
  Heart,
  Pill,
  Syringe,
  Stethoscope,
  Monitor,
  FlaskConical,
  Shield,
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  Clock3,
} from "lucide-react";

export default function ServicesPage() {
  const { user } = useAuth();

  const services = [
    {
      icon: Activity,
      title: "Dentistry",
      desc: "Comprehensive dental care including checkups, cleaning, and advanced oral treatments.",
    },
    {
      icon: Stethoscope,
      title: "Primary Care",
      desc: "General health consultations and personalized care plans for your family.",
    },
    {
      icon: Heart,
      title: "Cardiology",
      desc: "Advanced heart diagnostics, ECG monitoring, and preventive cardiac care.",
    },
    {
      icon: Monitor,
      title: "MRI & Imaging",
      desc: "Modern imaging technologies providing fast and accurate diagnosis.",
    },
    {
      icon: Syringe,
      title: "Blood Test",
      desc: "Reliable laboratory testing with fast and secure medical results.",
    },
    {
      icon: Shield,
      title: "Psychology",
      desc: "Mental wellness support through counseling and therapy sessions.",
    },
    {
      icon: FlaskConical,
      title: "Laboratory",
      desc: "State-of-the-art laboratory services with precise medical analysis.",
    },
    {
      icon: Pill,
      title: "Pharmacy",
      desc: "On-site pharmacy services for convenient access to medications.",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f8fbff",
      }}
    >
      {/* Top Banner */}
      <div
        style={{
          backgroundColor: "var(--primary)",
          color: "white",
          textAlign: "center",
          padding: "10px 20px",
          fontSize: "12px",
          fontWeight: 500,
        }}
      >
        Trusted healthcare services designed for your comfort, safety, and
        well-being.
      </div>

      {/* Navbar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 60px",
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(10px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          borderBottom: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <Logo light={true} />
        </Link>

        <nav
          style={{
            display: "flex",
            gap: "30px",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          <Link href="/doctors">Our Doctors</Link>

          <Link
            href="/services"
            style={{
              color: "var(--primary)",
              fontWeight: 700,
            }}
          >
            Services
          </Link>

          <Link href="/about">About Us</Link>
          <Link href="/login">Patient Portal</Link>
          <Link href="/contact">Contact Us</Link>
        </nav>

        {user ? (
          <Link
            href={defaultRouteForRole(user.role)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              {user.email.charAt(0).toUpperCase()}
            </div>

            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "var(--secondary)",
                }}
              >
                Mon Espace
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                {user.role}
              </div>
            </div>
          </Link>
        ) : (
          <Link
            href="/login"
            className="btn-primary"
            style={{
              padding: "12px 24px",
              borderRadius: "10px",
            }}
          >
            Login / Signup
          </Link>
        )}
      </header>

        {/* Hero Section */}
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "100px 60px",
            background:
              "linear-gradient(135deg, #eff8ff 0%, #f8fbff 50%, #ffffff 100%)",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              gap: "80px",
            }}
          >
            {/* Left */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "#dbeafe",
                  color: "var(--primary)",
                  padding: "10px 18px",
                  borderRadius: "999px",
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "24px",
                }}
              >
                <HeartHandshake size={16} />
                Modern Healthcare Solutions
              </div>

              <h1
                style={{
                  fontSize: "58px",
                  lineHeight: 1.1,
                  color: "var(--secondary)",
                  fontWeight: 800,
                  marginBottom: "24px",
                }}
              >
                Exceptional Medical
                <br />
                <span style={{ color: "var(--primary)" }}>Services For You</span>
              </h1>

              <p
                style={{
                  color: "var(--text-muted)",
                  lineHeight: 1.8,
                  fontSize: "16px",
                  maxWidth: "540px",
                  marginBottom: "36px",
                }}
              >
                Discover world-class healthcare services delivered with
                compassion, advanced technology, and experienced medical
                professionals dedicated to your wellness.
              </p>

              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <Link
                  href="/doctors"
                  className="btn-primary"
                  style={{
                    padding: "14px 32px",
                    borderRadius: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  Find Doctors
                  <ArrowRight size={18} />
                </Link>

                <Link
                  href="/contact"
                  style={{
                    padding: "14px 32px",
                    borderRadius: "12px",
                    border: "1px solid #dbeafe",
                    background: "white",
                    textDecoration: "none",
                    color: "var(--secondary)",
                    fontWeight: 600,
                  }}
                >
                  Contact Us
                </Link>
              </div>
            </div>

            {/* Right */}
            <div
              style={{
                flex: 1,
                position: "relative",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "500px",
                  height: "580px",
                  borderRadius: "40px",
                  overflow: "hidden",
                  position: "relative",
                  boxShadow: "0 30px 60px rgba(0,0,0,0.12)",
                }}
              >
                <Image
                  src="/images/doctors.webp"
                  alt="Medical Services"
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: "40px",
                  left: "-20px",
                  background: "white",
                  borderRadius: "20px",
                  padding: "20px 24px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "var(--secondary)",
                  }}
                >
                  24/7
                </div>

                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--text-muted)",
                  }}
                >
                  Medical Support
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  top: "40px",
                  right: "-20px",
                  background: "white",
                  borderRadius: "20px",
                  padding: "18px 22px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                }}
              >
                <Clock3 color="var(--primary)" size={26} />

                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "var(--secondary)",
                    }}
                  >
                    Fast Care
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                    }}
                  >
                    Minimal waiting time
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* Services Section */}
      <section
        style={{
          padding: "100px 60px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: "70px",
            }}
          >
            <div
              style={{
                color: "var(--primary)",
                fontWeight: 700,
                marginBottom: "12px",
                letterSpacing: "1px",
              }}
            >
              OUR SPECIALITIES
            </div>

            <h2
              style={{
                fontSize: "42px",
                fontWeight: 800,
                color: "var(--secondary)",
                marginBottom: "18px",
              }}
            >
              Medical Services We Provide
            </h2>

            <p
              style={{
                color: "var(--text-muted)",
                maxWidth: "700px",
                margin: "0 auto",
                lineHeight: 1.8,
              }}
            >
              We offer comprehensive healthcare services designed to support
              your physical and mental well-being with modern facilities and
              experienced professionals.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "28px",
            }}
          >
            {services.map((srv, i) => (
              <div
                key={i}
                style={{
                  background: "white",
                  borderRadius: "28px",
                  padding: "38px 32px",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  border: "1px solid rgba(0,0,0,0.04)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow =
                    "0 25px 50px rgba(14,165,233,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 30px rgba(0,0,0,0.04)";
                }}
              >
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "22px",
                    background: "#e0f2fe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--primary)",
                    marginBottom: "28px",
                  }}
                >
                  <srv.icon size={34} strokeWidth={1.8} />
                </div>

                <h3
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "var(--secondary)",
                    marginBottom: "16px",
                  }}
                >
                  {srv.title}
                </h3>

                <p
                  style={{
                    color: "var(--text-muted)",
                    lineHeight: 1.8,
                    fontSize: "14px",
                    marginBottom: "24px",
                  }}
                >
                  {srv.desc}
                </p>


                <div
                  style={{
                    position: "absolute",
                    top: "-40px",
                    right: "-40px",
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    background: "rgba(14,165,233,0.05)",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "100px 60px",
          background: "white",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            background:
              "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
            borderRadius: "36px",
            padding: "70px 60px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "40px",
            color: "white",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "42px",
                fontWeight: 800,
                lineHeight: 1.2,
                marginBottom: "18px",
              }}
            >
              Need Medical Assistance?
            </h2>

            <p
              style={{
                opacity: 0.8,
                maxWidth: "520px",
                lineHeight: 1.8,
              }}
            >
              Schedule your appointment today and let our experienced medical
              team provide the care and attention you deserve.
            </p>
          </div>

          <Link
            href="/doctors"
            style={{
              background: "white",
              color: "#1e3a8a",
              padding: "16px 34px",
              borderRadius: "14px",
              textDecoration: "none",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            Book Appointment
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="contact"
        style={{
          backgroundColor: "#1a427f",
          color: "white",
          padding: "60px",
          marginTop: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div>
            <Logo light={false} />

            <p
              style={{
                marginTop: "20px",
                maxWidth: "300px",
                opacity: 0.8,
                fontSize: "14px",
                lineHeight: 1.7,
              }}
            >
              Rue Agdal Targa, Marrakech, Maroc
              <br />
              40000
              <br />
              +212 6 88 55 11 44
              <br />
              info@rahmaclinic.com
            </p>
          </div>

          <div style={{ display: "flex", gap: "80px" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                fontSize: "14px",
                opacity: 0.85,
              }}
            >
              <Link href="/about">About Us</Link>
              <Link href="/services">Services</Link>
              <Link href="/doctors">Our Doctors</Link>
              <Link href="/contact">Contact Us</Link>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                fontSize: "14px",
                opacity: 0.85,
              }}
            >
              <Link href="/login">Patient Portal</Link>
              <Link href="/login">Book Appointment</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            marginTop: "60px",
            paddingTop: "20px",
            textAlign: "center",
            fontSize: "14px",
            opacity: 0.6,
          }}
        >
          Copyright © 2026 RAHMA Medical Cabinet. All Rights Reserved
        </div>
      </footer>
    </div>
  );
}