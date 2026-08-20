import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#3A2E2B] text-white pt-12 pb-8 px-4 lg:px-8 mt-20 border-t-4 border-[#FF5B3B]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        
        {/* Brand Column */}
        <div>
          <div className="flex items-center gap-2 text-2xl font-extrabold text-white mb-3">
            <span>🐢</span>
            <span>
              Ajapas<span className="text-[#FFA033]">World</span>
            </span>
          </div>
          <p className="text-xs text-gray-200 leading-relaxed mb-4 font-medium">
            A lifestyle brand empowering families, sparking young minds, and building a future of confident MoneeWise citizens across all 4 developmental stages.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <a
              href="https://www.youtube.com/@AjapasWorldChildren"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#FF0000] text-white px-3 py-1.5 rounded-full font-bold hover:opacity-90 no-underline"
            >
              Ajapsi Kids YT
            </a>
            <a
              href="https://www.youtube.com/@ajapaworldonline1969"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#9333EA] text-white px-3 py-1.5 rounded-full font-bold hover:opacity-90 no-underline"
            >
              Parents YT
            </a>
          </div>
        </div>

        {/* Age Brackets */}
        <div>
          <h4 className="text-xs font-extrabold text-[#FFA033] uppercase tracking-wider mb-3">
            Developmental Stages
          </h4>
          <ul className="space-y-2 text-xs text-gray-200 list-none p-0 font-medium">
            <li><Link to="/ages-6-8" className="hover:text-[#FF5B3B] text-gray-200 no-underline">Early Childhood (Ages 6–8)</Link></li>
            <li><Link to="/ages-9-11" className="hover:text-[#FF5B3B] text-gray-200 no-underline">Tweens (Ages 9–11)</Link></li>
            <li><Link to="/ages-12-14" className="hover:text-[#FF5B3B] text-gray-200 no-underline">Early Teens (Ages 12–14)</Link></li>
            <li><Link to="/ages-15-17" className="hover:text-[#FF5B3B] text-gray-200 no-underline">Older Teens (Ages 15–17)</Link></li>
          </ul>
        </div>

        {/* Ecosystem */}
        <div>
          <h4 className="text-xs font-extrabold text-[#FFA033] uppercase tracking-wider mb-3">
            Ecosystem & Shop
          </h4>
          <ul className="space-y-2 text-xs text-gray-200 list-none p-0 font-medium">
            <li><Link to="/moneewise" className="hover:text-[#FF5B3B] text-gray-200 no-underline">MoneeWise App & Vault</Link></li>
            <li><Link to="/shop" className="hover:text-[#FF5B3B] text-gray-200 no-underline">AjapasWorld Shop</Link></li>
            <li><a href="#book-call" className="hover:text-[#FF5B3B] text-gray-200 no-underline">Book a Call</a></li>
            <li><Link to="/moneewise" className="hover:text-[#FF5B3B] text-gray-200 no-underline">Join the Vault</Link></li>
          </ul>
        </div>

        {/* Compliance & Child Safety */}
        <div>
          <h4 className="text-xs font-extrabold text-[#FFA033] uppercase tracking-wider mb-3">
            Child Protection & Privacy
          </h4>
          <p className="text-[11px] text-gray-200 leading-relaxed mb-3 font-medium">
            COPPA & GDPR-K compliant. We protect child privacy with verified parental consent and zero behavioral tracking.
          </p>
          <div className="space-y-1 text-xs">
            <div>
              <Link to="/privacy-child-protection" className="text-[#FF5B3B] font-extrabold hover:underline">
                Child Data Protection Policy ➔
              </Link>
            </div>
            <div>
              <a href="#parental-controls" className="text-gray-200 hover:text-white no-underline font-medium">
                Parental Consent & Controls
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto pt-6 border-t border-gray-700 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-300 gap-4 font-medium">
        <div>
          © {new Date().getFullYear()} AjapasWorld. All rights reserved. Family Financial Stewardship.
        </div>
        <div className="flex gap-4">
          <Link to="/privacy-child-protection" className="hover:text-white text-gray-300 no-underline">Privacy Policy</Link>
          <span>|</span>
          <a href="#terms" className="hover:text-white text-gray-300 no-underline">Terms of Service</a>
          <span>|</span>
          <a href="#security" className="hover:text-white text-gray-300 no-underline">Security</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
