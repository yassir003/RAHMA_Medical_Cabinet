"use client";
import React from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useAuth, defaultRouteForRole } from "@/context/AuthContext";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  HeartHandshake,
} from "lucide-react";

export default function ContactPage() {
  const { user } = useAuth();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
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
        The health and well-being of our patients and their health care team
        will always be our priority.
      </div>

      {/* Navbar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 60px",
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <Logo light={true} />
        </Link>

        <nav
          style={{
            display: "flex",
            gap: "32px",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          <Link href="/doctors">Our Doctors</Link>
          <Link href="/services">Services</Link>
          <Link href="/about">About Us</Link>
          <Link href="/login">Patient Portal</Link>
          <Link
            href="/contact"
            style={{
              color: "var(--primary)",
              fontWeight: 700,
            }}
          >
            Contact Us
          </Link>
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
                backgroundColor: "var(--primary)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              {user.email.charAt(0).toUpperCase()}
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "var(--secondary)",
                }}
              >
                Mon Espace
              </span>

              <span
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                {user.role}
              </span>
            </div>
          </Link>
        ) : (
          <Link
            href="/login"
            className="btn-primary"
            style={{
              padding: "12px 24px",
              borderRadius: "12px",
            }}
          >
            Login / Signup
          </Link>
        )}
      </header>

      {/* Hero */}
      <section
        style={{
          padding: "110px 60px 80px",
          background:
            "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
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
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 18px",
              borderRadius: "999px",
              background: "#eff6ff",
              color: "var(--primary)",
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "28px",
            }}
          >
            <HeartHandshake size={16} />
            We're Here To Help
          </div>

          <h1
            style={{
              fontSize: "64px",
              lineHeight: 1,
              fontWeight: 800,
              color: "var(--secondary)",
              marginBottom: "24px",
              letterSpacing: "-2px",
            }}
          >
            Contact
            <span style={{ color: "var(--primary)" }}> Us</span>
          </h1>

          <p
            style={{
              maxWidth: "680px",
              margin: "0 auto",
              color: "var(--text-muted)",
              lineHeight: 1.8,
              fontSize: "16px",
            }}
          >
            Reach out to our team for appointments, inquiries, or medical
            assistance. We’re always ready to support your healthcare journey.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section
        style={{
          padding: "0 60px 100px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "420px 1fr",
            gap: "40px",
            alignItems: "start",
          }}
        >
          {/* Left Info */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {[
              {
                icon: MapPin,
                title: "Our Location",
                desc: "Rue Agdal Targa, Marrakech, Maroc 40000",
              },
              {
                icon: Phone,
                title: "Phone Number",
                desc: "+212 6 88 55 11 44",
              },
              {
                icon: Mail,
                title: "Email Address",
                desc: "info@rahmaclinic.com",
              },
              {
                icon: Clock,
                title: "Working Hours",
                desc: "Mon - Fri : 08:00 AM - 08:00 PM",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  background: "#ffffff",
                  border: "1px solid #eef2f7",
                  borderRadius: "24px",
                  padding: "28px",
                  display: "flex",
                  gap: "18px",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "18px",
                    background: "#eff6ff",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <item.icon size={24} />
                </div>

                <div>
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "var(--secondary)",
                    }}
                  >
                    {item.title}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: "var(--text-muted)",
                      lineHeight: 1.7,
                      fontSize: "14px",
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #eef2f7",
              borderRadius: "32px",
              padding: "50px",
            }}
          >
            <div style={{ marginBottom: "36px" }}>
              <h2
                style={{
                  fontSize: "38px",
                  fontWeight: 800,
                  color: "var(--secondary)",
                  marginBottom: "12px",
                  letterSpacing: "-1px",
                }}
              >
                Send a Message
              </h2>

              <p
                style={{
                  color: "var(--text-muted)",
                  lineHeight: 1.7,
                  fontSize: "15px",
                }}
              >
                Fill out the form below and our medical team will contact you
                shortly.
              </p>
            </div>

            <form
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "22px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
              >
                <input
                  type="text"
                  placeholder="First Name"
                  style={inputStyle}
                />

                <input
                  type="text"
                  placeholder="Last Name"
                  style={inputStyle}
                />
              </div>

              <input
                type="email"
                placeholder="Email Address"
                style={inputStyle}
              />

              <textarea
                placeholder="Write your message..."
                rows={6}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  paddingTop: "18px",
                }}
              />

              <button
                type="submit"
                className="btn-primary"
                style={{
                  padding: "16px 26px",
                  borderRadius: "14px",
                  fontSize: "15px",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  alignSelf: "flex-start",
                }}
              >
                Send Message
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: "#1a427f",
          color: "white",
          padding: "70px 60px 30px",
          marginTop: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            maxWidth: "1200px",
            margin: "0 auto",
            gap: "60px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <Logo light={false} />

            <p
              style={{
                marginTop: "24px",
                maxWidth: "320px",
                opacity: 0.7,
                fontSize: "14px",
                lineHeight: 1.8,
              }}
            >
              Professional healthcare services with compassionate doctors and
              modern medical technologies.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "80px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                Company
              </span>

              <Link href="/about">About Us</Link>
              <Link href="/services">Services</Link>
              <Link href="/doctors">Doctors</Link>
              <Link href="/contact">Contact</Link>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                Support
              </span>

              <Link href="/login">Patient Portal</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            marginTop: "60px",
            paddingTop: "24px",
            textAlign: "center",
            fontSize: "14px",
            opacity: 0.5,
          }}
        >
          Copyright © 2026 RAHMA Medical Cabinet. All Rights Reserved
        </div>
      </footer>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px 18px",
  borderRadius: "14px",
  border: "1px solid #e2e8f0",
  outline: "none",
  fontSize: "15px",
  background: "#f8fafc",
  color: "var(--secondary)",
};