import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowUp, ArrowUpRight, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import Logo from './Logo';
import { foundation } from '../data/foundation';

const nav = [
  ['Home', '/'],
  ['About', '/about'],
  ['Programs', '/programs'],
  ['Compliance', '/compliance'],
  ['Contact', '/contact'],
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // Single passive scroll listener, throttled to one read per frame, drives
  // both the compact header and the back-to-top button.
  useEffect(() => {
    let frame = 0;

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        setStuck(y > 20);
        setShowTop(y > 620);
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  // Escape closes the mobile menu.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="site-shell">
      <header className={`site-header${stuck ? ' is-stuck' : ''}`}>
        <div className="topbar">
          <div className="container topbar-inner">
            <span>Registered charitable trust • Chennai, Tamil Nadu</span>
            <div className="topbar-links">
              <a href={`mailto:${foundation.email}`}><Mail size={14} /> {foundation.email}</a>
              <a href={`tel:${foundation.phone.replace(/\s/g, '')}`}><Phone size={14} /> {foundation.phone}</a>
            </div>
          </div>
        </div>
        <div className="nav-wrap">
          <div className="container nav-inner">
            <Logo />
            <nav className="desktop-nav" aria-label="Primary navigation">
              {nav.map(([label, to]) => (
                <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}>{label}</NavLink>
              ))}
            </nav>
            <Link to="/contact" className="btn btn-dark nav-cta">Partner with us <ArrowUpRight size={17} /></Link>
            <button
              className={`menu-btn${open ? ' is-open' : ''}`}
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              aria-expanded={open}
              aria-controls="mobile-nav"
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
          <div id="mobile-nav" className={`mobile-nav${open ? ' is-open' : ''}`}>
            <div className="mobile-nav-inner container">
              {nav.map(([label, to], i) => (
                <NavLink key={to} to={to} style={{ transitionDelay: open ? `${60 + i * 45}ms` : '0ms' }}>{label}</NavLink>
              ))}
              <Link className="btn btn-dark" to="/contact">Partner with us</Link>
            </div>
          </div>
        </div>
      </header>

      <main><Outlet /></main>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <Logo light />
            <p className="footer-intro">Advancing education, women empowerment, healthcare, community welfare and sustainable livelihoods with dignity at the centre.</p>
          </div>
          <div className="footer-links">
            <h4>Explore</h4>
            <Link to="/about">About the Foundation</Link>
            <Link to="/programs">Our Programs</Link>
            <Link to="/compliance">Compliance</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div className="footer-contact">
            <h4>Contact</h4>
            <p><MapPin size={16} /> {foundation.address}</p>
            <a href={`tel:${foundation.phone.replace(/\s/g, '')}`}><Phone size={16} /> {foundation.phone}</a>
            <a href={`mailto:${foundation.email}`}><Mail size={16} /> {foundation.email}</a>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} Sri Sai Foundation. All rights reserved.</span>
          <span>Trust Reg. No. {foundation.registrationNo} • CSR {foundation.csrNo}</span>
        </div>
      </footer>

      <button
        type="button"
        className={`to-top${showTop ? ' is-visible' : ''}`}
        onClick={scrollTop}
        aria-label="Back to top"
        tabIndex={showTop ? 0 : -1}
      >
        <ArrowUp size={18} />
      </button>
    </div>
  );
}
