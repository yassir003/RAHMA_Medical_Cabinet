"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { Search, MapPin, ThumbsUp, ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { getMedecins, createRendezVous, getMyProfile, type Medecin } from '@/lib/api';
import { useAuth, defaultRouteForRole } from '@/context/AuthContext';

function parseDateTime(dateObj: Date, timeStr: string) {
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  const d = new Date(dateObj);
  d.setHours(hours, minutes, 0, 0);
  
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
}

export default function DoctorsPage() {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<number | null>(null); // ← initially no schedule open
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const router = useRouter();

  const [doctors, setDoctors] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const day3 = new Date(today); day3.setDate(today.getDate() + 2);
  const dates = [today, tomorrow, day3];
  const dateLabels = ['Today', 'Tomorrow', day3.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })];

  useEffect(() => {
    setLoading(true);
    getMedecins(page, 10, searchQuery).then(res => {
      setDoctors(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [page, searchQuery]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(0);
  };

  const handleBookVisit = (doctorId: number) => {
    // Toggle: close if already open, otherwise open this doctor's schedule
    setExpandedId(prev => (prev === doctorId ? null : doctorId));
  };

  const handleTimeSlotClick = async (doctorId: number, dateObj: Date, timeStr: string) => {
    const dateTime = parseDateTime(dateObj, timeStr);
    const pending = { doctorId, dateTime };
    
    const isLoggedIn = localStorage.getItem('rahma_auth_user');
    if (!isLoggedIn) {
      localStorage.setItem('pending_rendezvous', JSON.stringify(pending));
      router.push('/register');
    } else {
      try {
        const profile = await getMyProfile();
        await createRendezVous({
          patientId: profile.id,
          medecinId: doctorId,
          dateHeure: dateTime,
          motif: 'Consultation'
        });
        alert('Rendez-vous réservé avec succès !');
        router.push('/dashboard/patient');
      } catch (err) {
        console.error(err);
        alert('Erreur lors de la réservation.');
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fafbfd' }}>
      
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
          <Link
            href="/doctors"
            style={{
              color: "var(--primary)",
              fontWeight: 700,
            }}
          >
            Our Doctors
          </Link>
          <Link href="/services">Services</Link>
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

      {/* Search Header Area */}
      <div style={{ background: 'var(--primary)', padding: '30px 60px 50px 60px' }}>
         <div style={{ maxWidth: '1200px', margin: '0 auto', background: 'white', display: 'flex', borderRadius: '12px', padding: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '0 16px', gap: '12px' }}>
              <Search size={20} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Dr. Doctor, Specialty" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                style={{ border: 'none', width: '100%', outline: 'none', fontSize: '15px' }} 
              />
            </div>
            <button onClick={handleSearch} className="btn-primary" style={{ padding: '12px 32px', borderRadius: '8px' }}>Search</button>
         </div>
      </div>

      {/* Filters (Overlapping or tight below the blue) */}
      <div style={{ maxWidth: '1200px', margin: '-30px auto 30px auto', width: '100%', padding: '0 60px' }}>
         <div style={{ background: 'white', display: 'inline-flex', gap: '16px', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
           <select style={{ border: 'none', outline: 'none', background: 'transparent', fontWeight: 500, color: 'var(--secondary)', fontSize: '14px' }}><option>Availability</option></select>
           <div style={{ width: '1px', background: 'var(--border)' }}></div>
           <select style={{ border: 'none', outline: 'none', background: 'transparent', fontWeight: 500, color: 'var(--secondary)', fontSize: '14px' }}><option>Filter</option></select>
           <div style={{ width: '1px', background: 'var(--border)' }}></div>
           <select style={{ border: 'none', outline: 'none', background: 'transparent', fontWeight: 500, color: 'var(--secondary)', fontSize: '14px' }}><option>Sort By: Relevance</option></select>
         </div>
      </div>

      {/* Main Layout */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 60px', display: 'flex', gap: '30px', width: '100%' }}>
        
        {/* Left Column - Doctors List */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', color: 'var(--secondary)', fontWeight: 700, marginBottom: '6px' }}>{totalElements} doctors available</h2>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="var(--text-muted)" /> Book appointments with minimum wait-time & verified doctor details
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <Loader2 size={32} color="var(--primary)" style={{ animation: "spin 1s linear infinite" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : doctors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              No doctors found matching your criteria.
            </div>
          ) : doctors.map(doc => (
            <div key={doc.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '24px', display: 'flex', gap: '20px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {doc.prenom?.charAt(0)}{doc.nom?.charAt(0)}
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'white', borderRadius: '50%', padding: '2px' }}>
                    <CheckCircle2 color="var(--primary)" fill="white" size={20} />
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ color: 'var(--primary)', fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>Dr. {doc.prenom} {doc.nom}</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--secondary)' }}>{doc.specialite}</span><br/>
                    {doc.email || 'Email not provided'}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--secondary)', marginBottom: '8px' }}>
                    Cabinet RAHMA<br/>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{doc.telephone || 'Phone not provided'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', marginBottom: '12px' }}>
                    <span style={{ color: 'var(--foreground)' }}>Consultation at clinic</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--success)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>
                      <ThumbsUp size={12} /> 99%
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--secondary)', fontWeight: 600 }}>100+ Patient Stories</span>
                  </div>
                </div>

                <div style={{ width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '10px' }}>
                  <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: '14px', marginBottom: '12px' }}>Available Today</div>
                  {/* Updated onClick: pass doctor id */}
                  <button onClick={() => handleBookVisit(doc.id)} className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '13px', borderRadius: '8px' }}>
                    Book Clinic Visit
                  </button>
                </div>
              </div>

              {/* Expandable Schedule Area - only shown when expandedId matches doc.id */}
              {expandedId === doc.id && (
                <div style={{ borderTop: '1px solid #e2e8f0', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <button style={{ border: '1px solid #e2e8f0', background: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronLeft size={16}/></button>
                    <div style={{ display: 'flex', gap: '40px' }}>
                      {dates.map((d, i) => (
                        <button 
                          key={i} 
                          type="button"
                          onClick={() => setSelectedDateIndex(i)}
                          style={{ 
                            textAlign: 'center', 
                            borderBottom: selectedDateIndex === i ? '2px solid var(--primary)' : 'none', 
                            paddingBottom: '8px', 
                            color: selectedDateIndex === i ? 'var(--primary)' : 'var(--text-muted)',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent'
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: '15px', color: selectedDateIndex === i ? 'var(--primary)' : 'var(--secondary)' }}>{dateLabels[i]}</div>
                          <div style={{ fontSize: '12px', fontWeight: 500 }}>Slots Available</div>
                        </button>
                      ))}
                    </div>
                    <button style={{ border: '1px solid #e2e8f0', background: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronRight size={16}/></button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--secondary)', width: '80px' }}>Morning</span>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {['09:00 AM', '10:00 AM', '11:00 AM', '11:30 AM'].map(time => (
                          <button key={time} type="button" onClick={() => handleTimeSlotClick(doc.id, dates[selectedDateIndex], time)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', color: 'var(--primary)', fontWeight: 500, cursor: 'pointer', background: 'white', outline: 'none' }}>{time}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--secondary)', width: '80px' }}>Afternoon</span>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {['12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM'].map(time => (
                          <button key={time} type="button" onClick={() => handleTimeSlotClick(doc.id, dates[selectedDateIndex], time)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', color: 'var(--primary)', fontWeight: 500, cursor: 'pointer', background: 'white', outline: 'none' }}>{time}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--secondary)', width: '80px' }}>Evening</span>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {['06:00 PM', '06:30 PM', '07:00 PM'].map(time => (
                          <button key={time} type="button" onClick={() => handleTimeSlotClick(doc.id, dates[selectedDateIndex], time)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', color: 'var(--primary)', fontWeight: 500, cursor: 'pointer', background: 'white', outline: 'none' }}>{time}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
              <button 
                disabled={page === 0} 
                onClick={() => setPage(p => p - 1)}
                style={{ padding: '8px 12px', background: 'white', borderRadius: '4px', border: '1px solid #e2e8f0', color: page === 0 ? '#cbd5e1' : 'var(--secondary)', cursor: page === 0 ? 'not-allowed' : 'pointer' }}
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button 
                  key={i} 
                  type="button"
                  onClick={() => setPage(i)}
                  style={{ 
                    padding: '8px 12px', 
                    background: page === i ? 'var(--primary)' : 'white', 
                    color: page === i ? 'white' : 'var(--secondary)', 
                    borderRadius: '4px', 
                    border: page === i ? 'none' : '1px solid #e2e8f0', 
                    fontWeight: page === i ? 600 : 400,
                    outline: 'none'
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                disabled={page >= totalPages - 1} 
                onClick={() => setPage(p => p + 1)}
                style={{ padding: '8px 12px', background: 'white', borderRadius: '4px', border: '1px solid #e2e8f0', color: page >= totalPages - 1 ? '#cbd5e1' : 'var(--secondary)', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
              >
                &gt;
              </button>
            </div>
          )}
        </div>

        {/* Right Column - Ads & Widgets */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '15px', color: 'var(--secondary)', fontWeight: 700, marginBottom: '8px' }}>Provide current location to see Doctors near you</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>You are seeing results from 30 miles</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              <span style={{ padding: '6px 16px', border: '1px solid #e2e8f0', borderRadius: '20px', fontSize: '12px', color: 'var(--secondary)', fontWeight: 500, cursor: 'pointer' }}>Andheri West</span>
              <span style={{ padding: '6px 16px', border: '1px solid #e2e8f0', borderRadius: '20px', fontSize: '12px', color: 'var(--secondary)', fontWeight: 500, cursor: 'pointer' }}>Powai West</span>
              <span style={{ padding: '6px 16px', border: '1px solid #e2e8f0', borderRadius: '20px', fontSize: '12px', color: 'var(--secondary)', fontWeight: 500, cursor: 'pointer' }}>Bandra West</span>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ flex: 1, padding: '10px', fontSize: '13px', color: 'var(--primary)', background: 'transparent', border: '1px solid var(--primary)', borderRadius: '8px', fontWeight: 600 }}>Locate</button>
              <button className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: '13px', borderRadius: '8px' }}>Current Location</button>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', backgroundImage: 'linear-gradient(to bottom, #ffffff, #f0f8ff)' }}>
            <div style={{ fontSize: '14px', color: 'var(--secondary)', fontWeight: 500, marginBottom: '8px' }}>This World Oral Health Day,</div>
            <h3 style={{ fontSize: '22px', color: 'var(--secondary)', lineHeight: 1.3, marginBottom: '16px', fontWeight: 800 }}>
              Get an Appointment<br/>with Top Doctors.
            </h3>
            <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', display: 'inline-block', fontWeight: 700, marginBottom: '20px' }}>
              LIMITED PERIOD OFFER
            </div>
            <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>#UnleashTheHeroWithin</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>*Terms and conditions apply</div>
          </div>

        </div>
      </div>

      {/* Footer / FAQ similar setup */}
      <section style={{ padding: '80px 60px', backgroundColor: 'transparent', textAlign: 'center', marginTop: '40px' }}>
        <h2 style={{ fontSize: '32px', color: 'var(--secondary)', marginBottom: '40px', fontWeight: 700 }}>Frequently Asked Questions</h2>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left', marginBottom: '80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { q: 'Why choose our medical for your family?', a: 'We offer comprehensive care with a team of specialized professionals dedicated to your health and well-being.' },
            { q: 'Why we are different from others?', a: 'Our commitment to advanced technology combined with personalized, compassionate care sets us apart from standard clinics.' },
            { q: 'Trusted & experience senior care & love', a: 'We have dedicated programs and highly experienced staff specializing in geriatric care to support your elders.' },
            { q: 'How to get appointment for emergency cases?', a: 'For urgent medical situations, please call our 24/7 hotline directly or visit our emergency department immediately.' }
          ].map((faq, i) => (
             <button key={i} type="button" onClick={() => setActiveFaq(activeFaq === i ? null : i)} style={{ background: 'white', padding: '20px 24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', fontWeight: '500', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', transition: 'all 0.3s ease', border: 'none', textAlign: 'left', outline: 'none' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <span style={{ color: 'var(--secondary)' }}>{faq.q}</span>
                 <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '18px' }}>{activeFaq === i ? '-' : '+'}</span>
               </div>
               {activeFaq === i && (
                 <div style={{ marginTop: '16px', color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6, fontWeight: 400 }}>
                   {faq.a}
                 </div>
               )}
             </button>
          ))}
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