"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/Logo";
import { useAuth, defaultRouteForRole } from "@/context/AuthContext";
import {
  CheckCircle2,
  HeartHandshake,
  ShieldCheck,
  Stethoscope,
  Users,
  Clock3,
} from "lucide-react";

export default function AboutPage() {
  const { user } = useAuth();

  const values = [
    {
      icon: HeartHandshake,
      title: "Compassionate Care",
      desc: "We provide personalized healthcare with empathy and professionalism.",
    },
    {
      icon: ShieldCheck,
      title: "Trusted Expertise",
      desc: "Experienced specialists delivering modern and effective treatments.",
    },
    {
      icon: Users,
      title: "Patient Focused",
      desc: "Every decision we make is centered around patient comfort and wellness.",
    },
    {
      icon: Clock3,
      title: "24/7 Assistance",
      desc: "Our dedicated team is always ready to support your healthcare journey.",
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
        Your health and comfort remain our highest priority every single day.
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
          <Link href="/services">Services</Link>
          <Link
            href="/about"
            style={{ color: "var(--primary)", fontWeight: 700 }}
          >
            About Us
          </Link>
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
                padding: "10px 18px",
                borderRadius: "999px",
                background: "#dbeafe",
                color: "var(--primary)",
                fontWeight: 600,
                marginBottom: "24px",
                fontSize: "14px",
              }}
            >
              <Stethoscope size={16} />
              Trusted Healthcare Since 2020
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
              Caring For Your
              <br />
              <span style={{ color: "var(--primary)" }}>
                Health & Happiness
              </span>
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
              At RAHMA Medical Cabinet, we combine advanced medical expertise
              with compassionate patient care to create a healthcare experience
              built on trust, comfort, and excellence.
            </p>

            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <Link
                href="/doctors"
                className="btn-primary"
                style={{
                  padding: "14px 30px",
                  borderRadius: "12px",
                  fontWeight: 600,
                }}
              >
                Meet Our Doctors
              </Link>

              <Link
                href="/contact"
                style={{
                  padding: "14px 30px",
                  borderRadius: "12px",
                  fontWeight: 600,
                  border: "1px solid #dbeafe",
                  color: "var(--secondary)",
                  textDecoration: "none",
                  background: "white",
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
                position: "relative",
                borderRadius: "40px",
                overflow: "hidden",
                boxShadow: "0 30px 60px rgba(0,0,0,0.12)",
              }}
            >
              <Image
                src="/images/hero_doctor.png"
                alt="Doctor"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>

            <div
              style={{
                position: "absolute",
                bottom: "40px",
                left: "-10px",
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
                10K+
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--text-muted)",
                }}
              >
                Happy Patients
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                top: "40px",
                right: "-10px",
                background: "white",
                borderRadius: "20px",
                padding: "18px 22px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
              }}
            >
              <ShieldCheck color="var(--primary)" size={28} />
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "var(--secondary)",
                  }}
                >
                  Certified Care
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                  }}
                >
                  Modern medical services
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Content */}
      <section
        style={{
          padding: "100px 60px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "80px",
            alignItems: "center",
          }}
        >
          {/* Images */}
          <div
            style={{
              position: "relative",
              height: "560px",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "75%",
                height: "360px",
                borderRadius: "30px",
                overflow: "hidden",
                boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
              }}
            >
              <Image
                src="/images/patient_care1.png"
                alt="Clinic"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>

            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: "65%",
                height: "300px",
                borderRadius: "30px",
                overflow: "hidden",
                border: "12px solid white",
                boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
              }}
            >
              <Image
                src="/images/hero_doctor.png"
                alt="Doctor"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>

          {/* Text */}
          <div>
            <div
              style={{
                color: "var(--primary)",
                fontWeight: 700,
                marginBottom: "12px",
                letterSpacing: "1px",
              }}
            >
              ABOUT OUR CLINIC
            </div>

            <h2
              style={{
                fontSize: "42px",
                fontWeight: 800,
                lineHeight: 1.2,
                color: "var(--secondary)",
                marginBottom: "24px",
              }}
            >
              Excellence In Healthcare,
              <span style={{ color: "var(--primary)" }}>
                {" "}
                Built Around You
              </span>
            </h2>

            <p
              style={{
                color: "var(--text-muted)",
                lineHeight: 1.9,
                marginBottom: "24px",
              }}
            >
              We are committed to delivering exceptional medical services with
              integrity, professionalism, and compassion. Our experienced team
              works closely with every patient to provide modern healthcare
              solutions tailored to individual needs.
            </p>

            <p
              style={{
                color: "var(--text-muted)",
                lineHeight: 1.9,
                marginBottom: "36px",
              }}
            >
              From preventive care to specialized treatments, RAHMA Medical
              Cabinet focuses on creating a safe, welcoming, and innovative
              environment where patients always come first.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "18px",
              }}
            >
              {[
                "Experienced Specialists",
                "Modern Equipment",
                "Emergency Support",
                "Personalized Treatments",
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    fontWeight: 600,
                    color: "var(--secondary)",
                  }}
                >
                  <CheckCircle2
                    color="var(--primary)"
                    fill="#dbeafe"
                    size={22}
                  />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section
        style={{
          padding: "100px 60px",
          background: "#f0f8ff",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: "var(--primary)",
              fontWeight: 700,
              marginBottom: "10px",
            }}
          >
            WHY CHOOSE US
          </div>

          <h2
            style={{
              fontSize: "40px",
              fontWeight: 800,
              color: "var(--secondary)",
              marginBottom: "60px",
            }}
          >
            Our Core Values
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "24px",
            }}
          >
            {values.map((item, i) => (
              <div
                key={i}
                style={{
                  background: "white",
                  padding: "40px 28px",
                  borderRadius: "24px",
                  textAlign: "left",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "20px",
                    background: "#e0f2fe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "24px",
                    color: "var(--primary)",
                  }}
                >
                  <item.icon size={32} />
                </div>

                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "var(--secondary)",
                    marginBottom: "14px",
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    color: "var(--text-muted)",
                    lineHeight: 1.7,
                    fontSize: "14px",
                  }}
                >
                  {item.desc}
                </p>
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
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "40px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "42px",
                lineHeight: 1.2,
                fontWeight: 800,
                marginBottom: "20px",
              }}
            >
              Ready To Prioritize
              <br />
              Your Health?
            </h2>

            <p
              style={{
                opacity: 0.8,
                maxWidth: "500px",
                lineHeight: 1.7,
              }}
            >
              Book your appointment today and experience compassionate,
              high-quality healthcare from our trusted specialists.
            </p>
          </div>

          <Link
            href="/doctors"
            style={{
              background: "white",
              color: "#1e3a8a",
              padding: "16px 34px",
              borderRadius: "14px",
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Book Appointment
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
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