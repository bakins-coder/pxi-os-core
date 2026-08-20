import React from 'react';
import { NavLink, Link } from 'react-router-dom';

export const NavBar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-[#F8F5EE] border-b border-[#E5D6C0] px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-sm">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2 text-2xl font-extrabold text-[#3A2E2B] no-underline">
        <span className="text-2xl">🐢</span>
        <span>
          Ajapas<span className="text-[#9333EA]">World</span>
        </span>
      </Link>

      {/* Navigation Links */}
      <nav className="hidden xl:flex items-center gap-1 bg-[#FFFDF7] border border-[#E5D6C0] px-3 py-1.5 rounded-full shadow-sm">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-full text-xs font-extrabold transition-all no-underline ${
              isActive
                ? 'bg-[#FF5B3B] text-white shadow-sm'
                : 'text-[#3A2E2B] hover:text-[#FF5B3B] hover:bg-[#FFF3EB]'
            }`
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/moneewise"
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-full text-xs font-extrabold transition-all no-underline ${
              isActive
                ? 'bg-[#FF5B3B] text-white shadow-sm'
                : 'text-[#3A2E2B] hover:text-[#FF5B3B] hover:bg-[#FFF3EB]'
            }`
          }
        >
          MoneeWise
        </NavLink>
        <NavLink
          to="/ages-6-8"
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-full text-xs font-extrabold transition-all no-underline ${
              isActive
                ? 'bg-[#FFA033] text-white shadow-sm'
                : 'text-[#3A2E2B] hover:text-[#FFA033] hover:bg-[#FFF3EB]'
            }`
          }
        >
          Ages 6–8
        </NavLink>
        <NavLink
          to="/ages-9-11"
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-full text-xs font-extrabold transition-all no-underline ${
              isActive
                ? 'bg-[#FFA033] text-white shadow-sm'
                : 'text-[#3A2E2B] hover:text-[#FFA033] hover:bg-[#FFF3EB]'
            }`
          }
        >
          Ages 9–11
        </NavLink>
        <NavLink
          to="/ages-12-14"
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-full text-xs font-extrabold transition-all no-underline ${
              isActive
                ? 'bg-[#9333EA] text-white shadow-sm'
                : 'text-[#3A2E2B] hover:text-[#9333EA] hover:bg-[#FFF3EB]'
            }`
          }
        >
          Ages 12–14
        </NavLink>
        <NavLink
          to="/ages-15-17"
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-full text-xs font-extrabold transition-all no-underline ${
              isActive
                ? 'bg-[#9333EA] text-white shadow-sm'
                : 'text-[#3A2E2B] hover:text-[#9333EA] hover:bg-[#FFF3EB]'
            }`
          }
        >
          Ages 15–17
        </NavLink>
        <NavLink
          to="/shop"
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-full text-xs font-extrabold transition-all no-underline ${
              isActive
                ? 'bg-[#FF5B3B] text-white shadow-sm'
                : 'text-[#3A2E2B] hover:text-[#FF5B3B] hover:bg-[#FFF3EB]'
            }`
          }
        >
          Shop
        </NavLink>
      </nav>

      {/* Action Buttons with High Contrast */}
      <div className="flex items-center gap-3">
        <a
          href="#book-call"
          className="bg-transparent border-2 border-[#3A2E2B] text-[#3A2E2B] font-extrabold text-xs py-2 px-4 rounded-xl hover:bg-[#3A2E2B] hover:text-white transition-all no-underline"
        >
          Book a Call
        </a>
        <Link
          to="/moneewise"
          className="bg-[#FF5B3B] text-white font-extrabold text-xs py-2 px-4 rounded-full hover:bg-[#E04A2B] shadow-md transition-all no-underline"
        >
          Join the Vault (Try for Free)
        </Link>
      </div>
    </header>
  );
};

export default NavBar;
