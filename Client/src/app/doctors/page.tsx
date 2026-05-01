"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { Search, MapPin, ThumbsUp, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function DoctorsPage() {
  const [expandedId, setExpandedId] = useState<number | null>(null); // ← initially no schedule open
  const router = useRouter();

  // Modified: accepts doctorId and toggles schedule after login check
  const handleBookVisit = (doctorId: number) => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      router.push('/login');
    } else {
      // Toggle: close if already open, otherwise open this doctor's schedule
      setExpandedId(prev => (prev === doctorId ? null : doctorId));
    }
  };

  const doctors = [
    { id: 1, name: 'Dr. Shantanu Jambhekar', type: 'Dentist', exp: '16 years experience overall', clinic: 'Smilesense Center For Advanced Dentistry', loc: 'Pune, Mumbai', fee: '500', stories: '93 Patient Stories', percent: '99%' },
    { id: 2, name: 'Dr. Shantanu Jambhekar', type: 'Dentist', exp: '16 years experience overall', clinic: 'Smilesense Center For Advanced Dentistry', loc: 'Pune, Mumbai', fee: '500', stories: '93 Patient Stories', percent: '99%' },
    { id: 3, name: 'Dr. Shantanu Jambhekar', type: 'Dentist', exp: '16 years experience overall', clinic: 'Smilesense Center For Advanced Dentistry', loc: 'Pune, Mumbai', fee: '500', stories: '93 Patient Stories', percent: '99%' },
    { id: 4, name: 'Dr. Shantanu Jambhekar', type: 'Dentist', exp: '16 years experience overall', clinic: 'Smilesense Center For Advanced Dentistry', loc: 'Pune, Mumbai', fee: '500', stories: '93 Patient Stories', percent: '99%' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fafbfd' }}>
      
      {/* Top Banner */}
      <div style={{ backgroundColor: 'var(--primary)', color: 'white', textAlign: 'center', padding: '10px 20px', fontSize: '12px', fontWeight: 500 }}>
        The health and well-being of our patients and their health care team will always be our priority, so we follow the best practices for cleanliness.
      </div>

      {/* Navbar */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 60px', background: 'white' }}>
        <Logo light={true} />
        <nav style={{ display: 'flex', gap: '30px', fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' }}>
          <Link href="/doctors" style={{ color: 'var(--primary)', fontWeight: 600 }}>Find Doctors</Link>
          <Link href="#">Hospitals</Link>
          <Link href="#">Medicines</Link>
          <Link href="#">Surgeries</Link>
          <Link href="#">Software For Provider</Link>
          <Link href="#">Facilities</Link>
        </nav>
        <Link href="/login" className="btn-primary" style={{ padding: '10px 24px', borderRadius: '8px' }}>
          Login / Signup
        </Link>
      </header>

      {/* Search Header Area */}
      <div style={{ background: 'var(--primary)', padding: '30px 60px 50px 60px' }}>
         <div style={{ maxWidth: '1200px', margin: '0 auto', background: 'white', display: 'flex', borderRadius: '12px', padding: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '0 16px', gap: '12px' }}>
              <Search size={20} color="var(--text-muted)" />
              <input type="text" placeholder="Dr. Doctor, Hospital" style={{ border: 'none', width: '100%', outline: 'none', fontSize: '15px' }} />
            </div>
            <button className="btn-primary" style={{ padding: '12px 32px', borderRadius: '8px' }}>Search</button>
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
            <h2 style={{ fontSize: '20px', color: 'var(--secondary)', fontWeight: 700, marginBottom: '6px' }}>55 doctors available in Andheri west</h2>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="var(--text-muted)" /> Book appointments with minimum wait-time & verified doctor details
            </div>
          </div>

          {doctors.map(doc => (
            <div key={doc.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '24px', display: 'flex', gap: '20px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: '#e0f2fe', backgroundImage: 'url("https://ui-avatars.com/api/?name=Doc+Shan&background=e0f2fe&color=0284c7")', backgroundSize: 'cover' }}></div>
                  <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'white', borderRadius: '50%', padding: '2px' }}>
                    <CheckCircle2 color="var(--primary)" fill="white" size={20} />
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ color: 'var(--primary)', fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{doc.name}</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--secondary)' }}>{doc.type}</span><br/>
                    {doc.exp}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--secondary)', marginBottom: '8px' }}>
                    {doc.loc}<br/>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{doc.clinic} + 1 more</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', marginBottom: '12px' }}>
                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>FREE</span>
                    <span style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{doc.fee}</span>
                    <span style={{ color: 'var(--foreground)' }}>Consultation fee at clinic</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--success)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>
                      <ThumbsUp size={12} /> {doc.percent}
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--secondary)', fontWeight: 600 }}>{doc.stories}</span>
                  </div>
                </div>

                <div style={{ width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '10px' }}>
                  <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: '14px', marginBottom: '12px' }}>Available Today</div>
                  {/* Updated onClick: pass doctor id */}
                  <button onClick={() => handleBookVisit(doc.id)} className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '13px', borderRadius: '8px' }}>
                    Book FREE Clinic Visit
                  </button>
                </div>
              </div>

              {/* Expandable Schedule Area - only shown when expandedId matches doc.id */}
              {expandedId === doc.id && (
                <div style={{ borderTop: '1px solid #e2e8f0', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <button style={{ border: '1px solid #e2e8f0', background: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronLeft size={16}/></button>
                    <div style={{ display: 'flex', gap: '40px' }}>
                      <div style={{ textAlign: 'center', borderBottom: '2px solid var(--primary)', paddingBottom: '8px', color: 'var(--primary)' }}>
                        <div style={{ fontWeight: 600, fontSize: '15px' }}>Today</div>
                        <div style={{ fontSize: '12px', fontWeight: 500 }}>11 Slots Available</div>
                      </div>
                      <div style={{ textAlign: 'center', paddingBottom: '8px', color: 'var(--text-muted)' }}>
                        <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--secondary)' }}>Tomorrow</div>
                        <div style={{ fontSize: '12px', fontWeight: 500 }}>17 Slots Available</div>
                      </div>
                      <div style={{ textAlign: 'center', paddingBottom: '8px', color: 'var(--text-muted)' }}>
                        <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--secondary)' }}>Fri, 5 May</div>
                        <div style={{ fontSize: '12px', fontWeight: 500 }}>18 Slots Available</div>
                      </div>
                    </div>
                    <button style={{ border: '1px solid #e2e8f0', background: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronRight size={16}/></button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--secondary)', width: '80px' }}>Morning</span>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <span style={{ padding: '8px 16px', border: '1px solid var(--primary)', borderRadius: '6px', fontSize: '13px', color: 'var(--primary)', fontWeight: 500, cursor: 'pointer' }}>11:30 AM</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--secondary)', width: '80px' }}>Afternoon</span>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {['12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM'].map(time => (
                          <span key={time} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', color: 'var(--primary)', fontWeight: 500, cursor: 'pointer' }}>{time}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--secondary)', width: '80px' }}>Evening</span>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {['06:00 PM', '06:30 PM', '07:00 PM'].map(time => (
                          <span key={time} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', color: 'var(--primary)', fontWeight: 500, cursor: 'pointer' }}>{time}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
            <span style={{ padding: '8px 12px', background: 'white', borderRadius: '4px', border: '1px solid #e2e8f0', color: 'var(--text-muted)', cursor: 'pointer' }}>&lt;</span>
            <span style={{ padding: '8px 12px', background: 'var(--primary)', color: 'white', borderRadius: '4px', fontWeight: 600 }}>1</span>
            <span style={{ padding: '8px 12px', background: 'white', borderRadius: '4px', border: '1px solid #e2e8f0', color: 'var(--secondary)', cursor: 'pointer' }}>2</span>
            <span style={{ padding: '8px 12px', background: 'white', borderRadius: '4px', border: '1px solid #e2e8f0', color: 'var(--secondary)', cursor: 'pointer' }}>3</span>
            <span style={{ color: 'var(--text-muted)' }}>...</span>
            <span style={{ padding: '8px 12px', background: 'white', borderRadius: '4px', border: '1px solid #e2e8f0', color: 'var(--secondary)', cursor: 'pointer' }}>10</span>
            <span style={{ padding: '8px 12px', background: 'white', borderRadius: '4px', border: '1px solid #e2e8f0', color: 'var(--secondary)', cursor: 'pointer' }}>&gt;</span>
          </div>
        </div>

        {/* Right Column - Ads & Widgets */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '15px', color: 'var(--secondary)', fontWeight: 700, marginBottom: '8px' }}>Provide current location to see Dentist near you</h3>
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
              Get a <span style={{ color: 'var(--primary)' }}>FREE</span> Appointment*<br/>with Top Dentists.
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
          {['Why choose our medical for your family?', 'Why we are different from others?', 'Trusted & experience senior care & love', 'How to get appointment for emergency cases?'].map((q, i) => (
             <div key={i} style={{ background: 'white', padding: '20px 24px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '500', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', cursor: 'pointer' }}>
               <span style={{ color: 'var(--secondary)' }}>{q}</span>
               <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+</span>
             </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: '#1a427f', color: 'white', padding: '60px', marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto' }}>
          <div>
            <Logo light={false} />
            <p style={{ marginTop: '20px', maxWidth: '300px', opacity: 0.8, fontSize: '14px', lineHeight: 1.6 }}>
              Rue Agdal Targa, Marrakech, Maroc<br/>
              40000<br/>
              +212 6 88 55 11 44<br/>
              info@rahmaclinic.com
            </p>
          </div>
          <div style={{ display: 'flex', gap: '80px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', opacity: 0.8 }}>
              <Link href="#">About Us</Link>
              <Link href="#">Our Pricing</Link>
              <Link href="#">Our Gallery</Link>
              <Link href="#">Appointment</Link>
              <Link href="#">Privacy Policy</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', opacity: 0.8 }}>
              <Link href="#">Orthocology</Link>
              <Link href="#">Neurology</Link>
              <Link href="#">Dental Care</Link>
              <Link href="#">Opthalmology</Link>
              <Link href="#">Cardiology</Link>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '60px', paddingTop: '20px', textAlign: 'center', fontSize: '14px', opacity: 0.6 }}>
          Copyright © 2026 RAHMA Medical Cabinet. All Rights Reserved
        </div>
      </footer>
    </div>
  );
}