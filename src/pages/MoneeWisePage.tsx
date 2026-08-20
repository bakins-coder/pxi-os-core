import React from 'react';
import { Link } from 'react-router-dom';

export const MoneeWisePage: React.FC = () => {
  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      {/* Summer Challenge Announcement Pill */}
      <div className="text-center my-4">
        <Link
          to="/moneewise"
          className="inline-flex items-center gap-2 bg-[#FFF3EB] border border-[#FFDCC7] text-[#FF5B3B] text-xs font-extrabold px-4 py-2 rounded-full tracking-wide uppercase hover:bg-[#FFDCC7] transition-all no-underline shadow-sm"
        >
          ☀️ MONEEWISE SUMMER STEWARDSHIP CHALLENGE IS LIVE! ➔
        </Link>
      </div>

      {/* Main Hero Grid matching Screenshot with 100% Original Photo */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center my-8">
        <div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#3A2E2B] leading-[1.1] mb-6">
            Stewardship for the <span className="text-[#FF5B3B]">AI Generation</span>
          </h1>
          <p className="text-base sm:text-lg text-[#3A2E2B] font-semibold leading-relaxed mb-8">
            The smart app, 5-jar digital vault, and AI tutor that empowers kids and teens to earn, save, and build real-world businesses.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/moneewise"
              className="bg-[#FF5B3B] text-white font-extrabold text-sm py-3.5 px-8 rounded-full hover:bg-[#E04A2B] shadow-md transition-all no-underline"
            >
              Join the Vault (Try for Free)
            </Link>
            <a
              href="#book-call"
              className="bg-transparent border-2 border-[#3A2E2B] text-[#3A2E2B] font-extrabold text-sm py-3 px-8 rounded-xl hover:bg-[#3A2E2B] hover:text-white transition-all no-underline"
            >
              Book a Call
            </a>
          </div>
        </div>

        {/* 100% Original Photo of Family + Ajapa Mascot in Graduation Cap */}
        <div className="rounded-3xl overflow-hidden shadow-lg border-2 border-[#FBE8D3]">
          <img
            src="/assets/family_vault_hero-BmpYgoO5.png"
            alt="The MoneeWise Family Vault - Building Generational Wealth"
            className="w-full h-auto object-cover rounded-3xl"
          />
        </div>
      </section>

      {/* Interactive Feature Cards */}
      <section className="my-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl font-extrabold text-[#3A2E2B]">
            Adventure with the AI Storytelling Tortoise
          </h2>
          <p className="text-sm font-semibold text-[#3A2E2B] mt-2">
            Meet Ajapa, the legendary sage who guides children through gamified chore tracking, saving challenges, and the Harvest Simulator.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#FFFDF7] border border-[#F3EAD8] rounded-2xl p-6 shadow-sm text-center">
            <img src="/assets/5_jar_system_csr-D4_d1ER7.png" alt="5 Jar System" className="h-32 mx-auto mb-3 object-contain" />
            <h3 className="text-lg font-extrabold text-[#3A2E2B] mb-2">Interactive Chore Quests</h3>
            <p className="text-xs text-[#3A2E2B] font-medium">
              Kids earn shell tokens by completing household responsibility quests.
            </p>
          </div>
          <div className="bg-[#FFFDF7] border border-[#F3EAD8] rounded-2xl p-6 shadow-sm text-center">
            <img src="/assets/3d_tortoise_bank-QFGRj6nP.png" alt="3D Tortoise Bank" className="h-32 mx-auto mb-3 object-contain" />
            <h3 className="text-lg font-extrabold text-[#3A2E2B] mb-2">Compound Interest Games</h3>
            <p className="text-xs text-[#3A2E2B] font-medium">
              Visual games that demonstrate how money grows over time.
            </p>
          </div>
          <div className="bg-[#FFFDF7] border border-[#F3EAD8] rounded-2xl p-6 shadow-sm text-center">
            <img src="/assets/tortoise-treasury-BmyugQOt.png" alt="Tortoise Treasury" className="h-32 mx-auto mb-3 object-contain" />
            <h3 className="text-lg font-extrabold text-[#3A2E2B] mb-2">Avatar Customization</h3>
            <p className="text-xs text-[#3A2E2B] font-medium">
              Customize Ajapa and avatar gear with earned savings tokens.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default MoneeWisePage;
