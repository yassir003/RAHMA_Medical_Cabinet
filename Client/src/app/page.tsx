"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/Logo';
import { 
  Building2, Pill, Monitor, Heart, Activity, 
  Stethoscope, Shield, FlaskConical, Syringe, CheckCircle2
} from 'lucide-react';
import { useAuth, defaultRouteForRole } from '@/context/AuthContext';
import { getMedecins, Medecin } from '@/lib/api';

export default function LandingPage() {
  const { user } = useAuth();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [doctors, setDoctors] = useState<Medecin[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const response = await getMedecins(0, 4);
        setDoctors(response.content);
      } catch (error) {
        console.error("Failed to fetch doctors", error);
      } finally {
        setLoadingDoctors(false);
      }
    }
    fetchDoctors();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)' }}>
      
      {/* Top Banner */}
      <div style={{ backgroundColor: 'var(--primary)', color: 'white', textAlign: 'center', padding: '10px 20px', fontSize: '12px', fontWeight: 500 }}>
        The health and well-being of our patients and their health care team will always be our priority, so we follow the best practices for cleanliness.
      </div>

      {/* Navbar */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 60px', background: 'white', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <Logo light={true} />
        <nav style={{ display: 'flex', gap: '30px', fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' }}>
          <Link href="/doctors" style={{ color: 'var(--primary)', fontWeight: 600 }}>Our Doctors</Link>
          <Link href="/services">Services</Link>
          <Link href="/about">About Us</Link>
          <Link href="/login">Patient Portal</Link>
          <Link href="/contact">Contact Us</Link>
        </nav>
        {user ? (
          <Link href={defaultRouteForRole(user.role)} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--secondary)' }}>Mon Espace</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.role}</span>
            </div>
          </Link>
        ) : (
          <Link href="/login" className="btn-primary" style={{ padding: '10px 24px', borderRadius: '8px' }}>
            Login / Signup
          </Link>
        )}
      </header>

      {/* Hero Section */}
      <section style={{ backgroundColor: '#f0f8ff', padding: '60px 60px 0 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div style={{ flex: 1, paddingBottom: '100px' }}>
            <h2 style={{ color: 'var(--foreground)', fontSize: '20px', fontWeight: 600, marginBottom: '10px' }}>Your Health, Our Priority</h2>
            <h1 style={{ fontSize: '56px', color: 'var(--secondary)', lineHeight: 1.1, marginBottom: '20px', fontWeight: 800 }}>
              Book Your<br/>
              <span style={{ color: 'var(--primary)' }}>Appointment</span> Today
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '40px', maxWidth: '450px', lineHeight: 1.6 }}>
              The health and well-being of our patients and health care team will always be our priority, so we follow the best practices for cleanliness.
            </p>
            <Link href="/doctors" className="btn-primary" style={{ padding: '14px 32px', fontSize: '16px', borderRadius: '8px', display: 'inline-block' }}>
              Find Doctors
            </Link>
          </div>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
             <div style={{ width: '450px', height: '400px', position: 'relative', borderTopLeftRadius: '200px', borderTopRightRadius: '200px', borderBottomRightRadius: '20px', borderBottomLeftRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <Image src="/images/doctor 73.png" alt="Doctor" fill style={{ objectFit: 'cover' }} />
             </div>
                <div style={{ backgroundColor: 'white', padding: '8px 16px', borderRadius: '20px', position: 'absolute', top: '100px', right: '-20px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', zIndex: 10 }}>
                  <Shield size={16} color="var(--primary)" /> <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--secondary)' }}>Best Doctors</span>
                </div>
          </div>
        </div>
      </section>

      {/* Search Floating Card */}
      <div style={{ maxWidth: '900px', margin: '-50px auto 80px auto', position: 'relative', zIndex: 10, background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', color: 'var(--secondary)', fontWeight: 600, marginBottom: '20px', fontSize: '18px' }}>Contact Us Today For</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {[
            { icon: Activity, title: 'Dental' },
            { icon: Heart, title: 'Cardiology' },
            { icon: Pill, title: 'Pharmacy' },
            { icon: Syringe, title: 'Blood Test' }
          ].map((item, i) => (
             <div key={i} style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
               <div style={{ color: 'var(--primary)' }}><item.icon size={32} /></div>
               <div style={{ color: 'var(--primary)', fontWeight: 500, fontSize: '14px' }}>{item.title}</div>
             </div>
          ))}
        </div>

      </div>

      {/* Specialisations */}
      <section id="services" style={{ padding: '60px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
        <h2 style={{ fontSize: '32px', color: 'var(--secondary)', marginBottom: '40px', fontWeight: 700 }}>Find By Specialisation</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
          {[
            { icon: Activity, title: 'Dentistry' },
            { icon: Stethoscope, title: 'Primary Care' },
            { icon: Heart, title: 'Cardiology' },
            { icon: Monitor, title: 'MRI Resonance' },
            { icon: Syringe, title: 'Blood Test' },
            { icon: Shield, title: 'Piscologist' },
            { icon: FlaskConical, title: 'Laboratory' },
            { icon: Shield, title: 'X-Ray' }
          ].map((spec, i) => (
            <div key={i} style={{ background: 'white', padding: '30px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
              <div style={{ color: 'var(--primary)' }}>
                <spec.icon size={40} strokeWidth={1.5} />
              </div>
              <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>{spec.title}</span>
            </div>
          ))}
        </div>
        <Link href="/services">
          <button className="btn-primary" style={{ marginTop: '40px', padding: '12px 32px', display: 'inline-flex' }}>View All</button>
        </Link>
      </section>

      {/* Our Medical Specialist */}
      <section style={{ padding: '80px 60px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '32px', color: 'var(--secondary)', marginBottom: '50px', fontWeight: 700 }}>Our Medical Specialist</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '30px', maxWidth: '1100px', margin: '0 auto' }}>
          {loadingDoctors ? (
            <div style={{ gridColumn: 'span 4', color: 'var(--text-muted)' }}>Loading specialists...</div>
          ) : doctors.length > 0 ? (
            doctors.map((doc, index) => (
             <div key={doc.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
               <div style={{ width: '220px', height: '280px', borderTopLeftRadius: '110px', borderTopRightRadius: '110px', marginBottom: '20px', overflow: 'hidden', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
                 <Image src={`/images/specialist_doc${(index % 4) + 1}.png`} alt={`Dr. ${doc.prenom} ${doc.nom}`} fill style={{ objectFit: 'cover' }} />
               </div>
               <div style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '18px' }}>Dr. {doc.prenom} {doc.nom}</div>
               <div style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: 500 }}>{doc.specialite}</div>
             </div>
            ))
          ) : (
            <div style={{ gridColumn: 'span 4', color: 'var(--text-muted)' }}>No specialists available at the moment.</div>
          )}
        </div>
      </section>

      {/* Patient Caring */}
      <section id="about" style={{ backgroundColor: '#f0f8ff', padding: '100px 60px', display: 'flex', gap: '80px', justifyContent: 'center' }}>
        <div style={{ flex: 1, maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative', height: '500px' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '350px', height: '300px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 15px 30px rgba(0,0,0,0.1)' }}>
              <Image src="/images/patient_care1.png" alt="Patient Care" fill style={{ objectFit: 'cover' }} />
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '300px', height: '250px', borderRadius: '20px', border: '10px solid #f0f8ff', overflow: 'hidden', boxShadow: '0 15px 30px rgba(0,0,0,0.1)' }}>
              <Image src="/images/hero_doctor.png" alt="Modern Clinic" fill style={{ objectFit: 'cover' }} />
            </div>
            <div style={{ position: 'absolute', top: '120px', left: '-30px', backgroundColor: 'white', padding: '16px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 10 }}>
              <Heart color="var(--primary)" size={24} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>Free Consultation</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Call us to know more</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, maxWidth: '500px', paddingTop: '40px' }}>
          <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>HELPING PATIENTS FROM AROUND THE GLOBE</div>
          <h2 style={{ fontSize: '40px', color: 'var(--secondary)', fontWeight: 800, marginBottom: '24px', lineHeight: 1.2 }}>
            Patient <span style={{ color: 'var(--primary)' }}>Caring</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '30px' }}>
            Our goal is to deliver quality of care in a courteous, respectful, and compassionate manner. We hope you will allow us to care for you and strive to be the first and best choice for your healthcare.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {['Stay Updated About Your Health', 'Check Your Results Online', 'Manage Your Appointments'].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 500, color: 'var(--secondary)' }}>
                <CheckCircle2 color="var(--primary)" fill="#e0f2fe" size={20} /> {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{ padding: '80px 60px', textAlign: 'center', backgroundColor: 'white' }}>
        <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>EASY STEPS</div>
        <h2 style={{ fontSize: '32px', color: 'var(--secondary)', marginBottom: '50px', fontWeight: 700 }}>How It Works</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', maxWidth: '1100px', margin: '0 auto' }}>
          {[
            { img: '/images/man_in%20front_of_laptop.jpg', title: 'Find your doctor', desc: 'Search and filter to find your ideal medical expert.' },
            { img: '/images/nurse.jpg', title: 'Schedule appointment', desc: 'Choose a suitable time slot and confirm your booking.' },
            { img: '/images/doctors.webp', title: 'Get your treatment', desc: 'Visit the clinic or consult online with ease.' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '100%', height: '200px', position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                 <Image src={item.img} alt={item.title} fill style={{ objectFit: 'cover' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--secondary)' }}>{item.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '250px' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '80px 60px', backgroundColor: 'var(--background)', display: 'flex', justifyContent: 'center', gap: '80px' }}>
        <div style={{ maxWidth: '400px' }}>
          <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>CARING FOR THE HEALTH OF YOU AND YOUR FAMILY.</div>
          <h2 style={{ fontSize: '36px', color: 'var(--secondary)', fontWeight: 800, marginBottom: '20px' }}>Our Families</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>We will work with you to develop individualized care plans, including management of chronic diseases. If we cannot assist, we can provide referrals or advice about the type of practitioner you require.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {[
            { icon: Heart, num: '1200+', label: 'Happy Patients', color: 'var(--primary)', bg: '#e0f2fe' },
            { icon: Building2, num: '10+', label: 'Hospitals Room', color: '#ff7a7a', bg: '#ffe5e5' },
            { icon: Activity, num: '1000+', label: 'Lab Reports', color: '#ffb347', bg: '#fff2e0' },
            { icon: Activity, num: '700+', label: 'Expert Doctors', color: 'var(--success)', bg: '#dcfce7' },
          ].map((stat, i) => (
            <div key={i} style={{ background: 'white', padding: '30px 40px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <stat.icon size={28} />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--secondary)' }}>{stat.num}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ & CTA */}
      <section style={{ padding: '80px 60px', backgroundColor: '#f0f8ff', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontSize: '32px', color: 'var(--secondary)', marginBottom: '50px', fontWeight: 700, textAlign: 'center' }}>Frequently Asked Questions</h2>
        
        <div style={{ display: 'flex', gap: '60px', maxWidth: '1100px', width: '100%', marginBottom: '100px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
             <div style={{ width: '100%', height: '400px', position: 'relative', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
               <Image src="/images/patient_care1.png" alt="Doctor and Patient" fill style={{ objectFit: 'cover' }} />
             </div>
             <div style={{ position: 'absolute', bottom: '30px', left: '-20px', backgroundColor: 'white', padding: '12px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
               <div style={{ fontSize: '24px' }}>😊</div>
               <div>
                 <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>Happy</div>
                 <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Patients</div>
               </div>
             </div>
             <div style={{ position: 'absolute', top: '30px', right: '-20px', backgroundColor: 'white', padding: '12px', borderRadius: '50%', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
               <Heart color="#ff7a7a" size={24} fill="#ff7a7a" />
             </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
            {[
              { q: 'Why choose our medical for your family?', a: 'We offer comprehensive care with a team of specialized professionals dedicated to your health and well-being.' },
              { q: 'Why we are different from others?', a: 'Our commitment to advanced technology combined with personalized, compassionate care sets us apart from standard clinics.' },
              { q: 'Trusted & experience senior care & love', a: 'We have dedicated programs and highly experienced staff specializing in geriatric care to support your elders.' },
              { q: 'How to get appointment for emergency cases?', a: 'For urgent medical situations, please call our 24/7 hotline directly or visit our emergency department immediately.' }
            ].map((faq, i) => (
               <div key={i} onClick={() => setActiveFaq(activeFaq === i ? null : i)} style={{ background: 'white', padding: '20px 24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', fontWeight: '500', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ color: 'var(--secondary)' }}>{faq.q}</span>
                   <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '18px' }}>{activeFaq === i ? '-' : '+'}</span>
                 </div>
                 {activeFaq === i && (
                   <div style={{ marginTop: '16px', color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6, fontWeight: 400 }}>
                     {faq.a}
                   </div>
                 )}
               </div>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '40px 60px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '40px', maxWidth: '1000px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
           <div style={{ flex: '0 0 350px', position: 'relative', height: '250px' }}>
             <Image src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800" alt="Laptop" fill style={{ objectFit: 'contain' }} />
           </div>
           <div style={{ flex: 1, textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
             <h2 style={{ fontSize: '36px', color: 'var(--secondary)', fontWeight: 800, marginBottom: '16px', lineHeight: 1.2 }}>
               Book your<br/>
               <span style={{ color: 'var(--primary)' }}>Appointment</span> Now
             </h2>
             <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '300px' }}>Get the right care you need easily and securely today.</p>
             <button className="btn-primary" style={{ padding: '14px 32px' }}>Book Appointment</button>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" style={{ backgroundColor: '#1a427f', color: 'white', padding: '60px', marginTop: 'auto' }}>
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
              <Link href="/about">About Us</Link>
              <Link href="/services">Services</Link>
              <Link href="/doctors">Our Doctors</Link>
              <Link href="/contact">Contact Us</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', opacity: 0.8 }}>
              <Link href="/login">Patient Portal</Link>
              <Link href="/login">Book Appointment</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
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
