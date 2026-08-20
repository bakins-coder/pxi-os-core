import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'6-8' | '9-11' | '12-14' | '15-17'>('6-8');

  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      {/* AjapasWorld Lifestyle Brand Hero Banner */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center my-8">
        <div>
          <span className="inline-block bg-[#FFF3EB] border border-[#FFDCC7] text-[#FF5B3B] text-xs font-extrabold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-4 shadow-sm">
            ☀️ AJAPASWORLD LIFESTYLE BRAND
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#3A2E2B] leading-[1.1] mb-6">
            Empower Families, Spark Young Minds & Build a <span className="text-[#FF5B3B]">MoneeWise Future</span>
          </h1>
          <p className="text-base sm:text-lg text-[#3A2E2B] font-semibold leading-relaxed mb-8">
            Ajapasworld is a lifestyle brand with a mission to empower youth financially through trained facilitators, proven Ajapa storytelling IP, physical & digital 5-jar vaults, and interactive learning.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/moneewise"
              className="bg-[#FF5B3B] text-white font-extrabold text-sm py-3.5 px-8 rounded-full hover:bg-[#E04A2B] shadow-md transition-all no-underline"
            >
              Explore MoneeWise Vault ➔
            </Link>
            <Link
              to="/shop"
              className="bg-transparent border-2 border-[#3A2E2B] text-[#3A2E2B] font-extrabold text-sm py-3 px-8 rounded-xl hover:bg-[#3A2E2B] hover:text-white transition-all no-underline"
            >
              Visit Wise Bazaar Shop
            </Link>
          </div>
        </div>

        {/* Original Children Activity Montage Asset */}
        <div className="rounded-3xl overflow-hidden shadow-lg border-2 border-[#FBE8D3] bg-white p-4">
          <img
            src="/assets/children_activity_montage-mirufQX0.png"
            alt="AjapasWorld Children Activities Montage"
            className="w-full h-auto object-cover rounded-2xl"
          />
        </div>
      </section>

      {/* Ecosystem Hub Cards */}
      <section className="my-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl font-extrabold text-[#3A2E2B]">
            Explore the AjapasWorld Ecosystem
          </h2>
          <p className="text-sm font-semibold text-[#3A2E2B] mt-2">
            Discover our specialized offerings for kids, pre-teens, teens, parents, and merchandise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Ajapsi Kids */}
          <div className="bg-[#FFFDF7] border border-[#F3EAD8] rounded-3xl p-6 text-center shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <img src="/assets/5_jar_system_csr-D4_d1ER7.png" alt="Ajapsi Kids World" className="h-40 mx-auto mb-4 object-contain" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#FFF3EB] text-[#FFA033] px-3 py-1 rounded-full border border-[#FFDCC7]">
                Kids (Ages 6–11)
              </span>
              <h3 className="text-xl font-extrabold text-[#3A2E2B] mt-3 mb-2">Ajapsi Kids World</h3>
              <p className="text-xs text-[#3A2E2B] font-medium mb-6 leading-relaxed">
                Your joyful storytelling guide to fun financial adventures! Fun games, activity workbooks, and physical/digital jar systems.
              </p>
            </div>
            <Link to="/ages-6-8" className="bg-[#FF5B3B] text-white text-xs font-extrabold py-3 px-6 rounded-full hover:bg-[#E04A2B] transition-all no-underline shadow-sm">
              Explore Kids World ➔
            </Link>
          </div>

          {/* Card 2: Ajapa Teens */}
          <div className="bg-[#FFFDF7] border border-[#F3EAD8] rounded-3xl p-6 text-center shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <img src="/assets/tortoise-treasury-BmyugQOt.png" alt="Ajapa Teens World" className="h-40 mx-auto mb-4 object-contain" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#FFF3EB] text-[#9333EA] px-3 py-1 rounded-full border border-[#FFDCC7]">
                Teens (Ages 12–17)
              </span>
              <h3 className="text-xl font-extrabold text-[#3A2E2B] mt-3 mb-2">Ajapa Teens World</h3>
              <p className="text-xs text-[#3A2E2B] font-medium mb-6 leading-relaxed">
                Master Your Future! Connect with ambitious teens, learn youth banking, compound growth, tax basics, and startup pitch competitions.
              </p>
            </div>
            <Link to="/ages-12-14" className="bg-[#FF5B3B] text-white text-xs font-extrabold py-3 px-6 rounded-full hover:bg-[#E04A2B] transition-all no-underline shadow-sm">
              Explore Teens World ➔
            </Link>
          </div>

          {/* Card 3: MoneeWise Vault */}
          <div className="bg-[#FFFDF7] border-2 border-[#FFDCC7] rounded-3xl p-6 text-center shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <img src="/assets/3d_tortoise_bank-QFGRj6nP.png" alt="MoneeWise Family Vault" className="h-40 mx-auto mb-4 object-contain" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#FFF3EB] text-[#FF5B3B] px-3 py-1 rounded-full border border-[#FFDCC7]">
                Flagship App & Vault
              </span>
              <h3 className="text-xl font-extrabold text-[#3A2E2B] mt-3 mb-2">MoneeWise Family Vault</h3>
              <p className="text-xs text-[#3A2E2B] font-medium mb-6 leading-relaxed">
                Stewardship for the AI Generation: The 5-jar digital vault, AI tutor Ajapa, and automated family allowance controls.
              </p>
            </div>
            <Link to="/moneewise" className="bg-[#FF5B3B] text-white text-xs font-extrabold py-3 px-6 rounded-full hover:bg-[#E04A2B] transition-all no-underline shadow-sm">
              Launch Family Vault ➔
            </Link>
          </div>

        </div>
      </section>

      {/* Age Segmentation Section */}
      <section className="my-16 bg-[#FFFDF7] border border-[#F3EAD8] rounded-3xl p-6 lg:p-10 shadow-sm">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="inline-block bg-[#FFF3EB] border border-[#FFDCC7] text-[#FF5B3B] text-xs font-extrabold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-2">
            🎯 AGE-APPROPRIATE ENGAGEMENT
          </span>
          <h2 className="text-3xl font-extrabold text-[#3A2E2B]">
            4 Developmental Age Brackets
          </h2>
          <p className="text-sm text-[#3A2E2B] font-semibold mt-2">
            Tailored learning experiences matched to cognitive maturity, mathematical understanding, and real-world autonomy.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 bg-[#F8F5EE] p-2 rounded-2xl border border-[#F3EAD8] max-w-3xl mx-auto">
          <button
            onClick={() => setActiveTab('6-8')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
              activeTab === '6-8'
                ? 'bg-[#FFA033] text-white shadow-sm scale-105'
                : 'text-[#3A2E2B] hover:bg-[#FFF3EB]'
            }`}
          >
            Ages 6–8 (Early Childhood)
          </button>
          <button
            onClick={() => setActiveTab('9-11')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
              activeTab === '9-11'
                ? 'bg-[#FFA033] text-white shadow-sm scale-105'
                : 'text-[#3A2E2B] hover:bg-[#FFF3EB]'
            }`}
          >
            Ages 9–11 (Tweens)
          </button>
          <button
            onClick={() => setActiveTab('12-14')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
              activeTab === '12-14'
                ? 'bg-[#9333EA] text-white shadow-sm scale-105'
                : 'text-[#3A2E2B] hover:bg-[#FFF3EB]'
            }`}
          >
            Ages 12–14 (Early Teens)
          </button>
          <button
            onClick={() => setActiveTab('15-17')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
              activeTab === '15-17'
                ? 'bg-[#9333EA] text-white shadow-sm scale-105'
                : 'text-[#3A2E2B] hover:bg-[#FFF3EB]'
            }`}
          >
            Ages 15–17 (Older Teens)
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="bg-white border border-[#F3EAD8] rounded-2xl p-6 lg:p-8">
          {activeTab === '6-8' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#FFA033] bg-[#FFF3EB] px-3 py-1 rounded-full border border-[#FFDCC7]">
                  Stage 1: Tangible & Visual Basics
                </span>
                <h3 className="text-2xl font-extrabold text-[#3A2E2B] mt-4 mb-3">
                  Ages 6–8: Learning Through Physical Money
                </h3>
                <p className="text-sm text-[#3A2E2B] font-medium leading-relaxed mb-4">
                  At this stage, children learn through concrete, tactile experiences rather than abstract numbers.
                </p>
                <ul className="space-y-2 text-xs text-[#3A2E2B] font-bold mb-6">
                  <li className="flex items-center gap-2">✓ Physical money recognition (coins & bills)</li>
                  <li className="flex items-center gap-2">✓ Needs vs. Wants differentiation</li>
                  <li className="flex items-center gap-2">✓ 4 Visual Jars: Earn, Save, Spend, Give</li>
                  <li className="flex items-center gap-2">✓ Immediate rewards for simple household chores</li>
                </ul>
                <Link
                  to="/ages-6-8"
                  className="inline-flex items-center gap-2 bg-[#FF5B3B] text-white text-xs font-extrabold px-6 py-3 rounded-full hover:bg-[#E04A2B] transition-all no-underline shadow-sm"
                >
                  Explore Ages 6–8 Portal ➔
                </Link>
              </div>

              <div className="bg-[#F8F5EE] border border-[#F3EAD8] rounded-2xl p-6 text-center">
                <img
                  src="/assets/5_jar_system_csr-D4_d1ER7.png"
                  alt="5 Jar System"
                  className="max-h-48 mx-auto mb-4 object-contain"
                />
                <h4 className="font-extrabold text-[#3A2E2B] text-base mb-1">Physical Jar Starter Pack</h4>
                <p className="text-xs text-[#3A2E2B] font-medium mb-4">Visual labeled jars to build lifelong saving habits early.</p>
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 bg-transparent border-2 border-[#3A2E2B] text-[#3A2E2B] text-xs font-extrabold px-4 py-2 rounded-xl hover:bg-[#3A2E2B] hover:text-white transition-all no-underline"
                >
                  View Jar Pack in Shop
                </Link>
              </div>
            </div>
          )}

          {activeTab === '9-11' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#FFA033] bg-[#FFF3EB] px-3 py-1 rounded-full border border-[#FFDCC7]">
                  Stage 2: Relational & Comparative Money
                </span>
                <h3 className="text-2xl font-extrabold text-[#3A2E2B] mt-4 mb-3">
                  Ages 9–11: Skill Income & Budgeting
                </h3>
                <p className="text-sm text-[#3A2E2B] font-medium leading-relaxed mb-4">
                  Children begin to grasp digital money representations, skill-based earning, and logical trade-offs.
                </p>
                <ul className="space-y-2 text-xs text-[#3A2E2B] font-bold mb-6">
                  <li className="flex items-center gap-2">✓ How income is earned through work & skills</li>
                  <li className="flex items-center gap-2">✓ Comparison shopping (brand vs. store brand)</li>
                  <li className="flex items-center gap-2">✓ Introduction to basic interest & simple investments</li>
                  <li className="flex items-center gap-2">✓ Setting medium-term goals for specific devices/toys</li>
                </ul>
                <Link
                  to="/ages-9-11"
                  className="inline-flex items-center gap-2 bg-[#FF5B3B] text-white text-xs font-extrabold px-6 py-3 rounded-full hover:bg-[#E04A2B] transition-all no-underline shadow-sm"
                >
                  Explore Ages 9–11 Portal ➔
                </Link>
              </div>

              <div className="bg-[#F8F5EE] border border-[#F3EAD8] rounded-2xl p-6 text-center">
                <img
                  src="/assets/3d_tortoise_bank-QFGRj6nP.png"
                  alt="3D Tortoise Bank"
                  className="max-h-48 mx-auto mb-4 object-contain"
                />
                <h4 className="font-extrabold text-[#3A2E2B] text-base mb-1">Harvest Simulator & Board Games</h4>
                <p className="text-xs text-[#3A2E2B] font-medium mb-4">Interactive games teaching compound interest and skill income.</p>
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 bg-transparent border-2 border-[#3A2E2B] text-[#3A2E2B] text-xs font-extrabold px-4 py-2 rounded-xl hover:bg-[#3A2E2B] hover:text-white transition-all no-underline"
                >
                  Get Family Board Game
                </Link>
              </div>
            </div>
          )}

          {activeTab === '12-14' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#9333EA] bg-[#FFF3EB] px-3 py-1 rounded-full border border-[#FFDCC7]">
                  Stage 3: Banking & Digital Literacy
                </span>
                <h3 className="text-2xl font-extrabold text-[#3A2E2B] mt-4 mb-3">
                  Ages 12–14: Youth Banking & Compound Growth
                </h3>
                <p className="text-sm text-[#3A2E2B] font-medium leading-relaxed mb-4">
                  Teens develop critical reasoning needed to handle digital financial tools, youth cards, and marketing awareness.
                </p>
                <ul className="space-y-2 text-xs text-[#3A2E2B] font-bold mb-6">
                  <li className="flex items-center gap-2">✓ Operating prepaid youth cards & digital tracking</li>
                  <li className="flex items-center gap-2">✓ Compound interest & stock market foundations</li>
                  <li className="flex items-center gap-2">✓ Identifying advertising tactics & consumer traps</li>
                  <li className="flex items-center gap-2">✓ Monthly budget tracking & automatic savings</li>
                </ul>
                <Link
                  to="/ages-12-14"
                  className="inline-flex items-center gap-2 bg-[#FF5B3B] text-white text-xs font-extrabold px-6 py-3 rounded-full hover:bg-[#E04A2B] transition-all no-underline shadow-sm"
                >
                  Explore Ages 12–14 Portal ➔
                </Link>
              </div>

              <div className="bg-[#F8F5EE] border border-[#F3EAD8] rounded-2xl p-6 text-center">
                <img
                  src="/assets/tortoise-treasury-BmyugQOt.png"
                  alt="Tortoise Treasury"
                  className="max-h-48 mx-auto mb-4 object-contain"
                />
                <h4 className="font-extrabold text-[#3A2E2B] text-base mb-1">MoneeWise Digital Youth Vault</h4>
                <p className="text-xs text-[#3A2E2B] font-medium mb-4">App-managed prepaid digital vault with automated transfers.</p>
                <Link
                  to="/moneewise"
                  className="inline-flex items-center gap-2 bg-transparent border-2 border-[#3A2E2B] text-[#3A2E2B] text-xs font-extrabold px-4 py-2 rounded-xl hover:bg-[#3A2E2B] hover:text-white transition-all no-underline"
                >
                  Learn About Youth Vault
                </Link>
              </div>
            </div>
          )}

          {activeTab === '15-17' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#9333EA] bg-[#FFF3EB] px-3 py-1 rounded-full border border-[#FFDCC7]">
                  Stage 4: Autonomy & Real-World Systems
                </span>
                <h3 className="text-2xl font-extrabold text-[#3A2E2B] mt-4 mb-3">
                  Ages 15–17: Earned Income, Taxes & Credit
                </h3>
                <p className="text-sm text-[#3A2E2B] font-medium leading-relaxed mb-4">
                  Near-adults require practical preparation for independence, earned income, taxes, and asset allocation.
                </p>
                <ul className="space-y-2 text-xs text-[#3A2E2B] font-bold mb-6">
                  <li className="flex items-center gap-2">✓ Earned income, paystubs, taxes & life budgeting</li>
                  <li className="flex items-center gap-2">✓ Credit scores, debt risks & borrowing costs</li>
                  <li className="flex items-center gap-2">✓ Index funds, asset allocation & custodial brokerage</li>
                  <li className="flex items-center gap-2">✓ Side-hustle creation & youth entrepreneurship</li>
                </ul>
                <Link
                  to="/ages-15-17"
                  className="inline-flex items-center gap-2 bg-[#FF5B3B] text-white text-xs font-extrabold px-6 py-3 rounded-full hover:bg-[#E04A2B] transition-all no-underline shadow-sm"
                >
                  Explore Ages 15–17 Portal ➔
                </Link>
              </div>

              <div className="bg-[#F8F5EE] border border-[#F3EAD8] rounded-2xl p-6 text-center">
                <img
                  src="/assets/children_activity_montage-mirufQX0.png"
                  alt="Children Activity Montage"
                  className="max-h-48 mx-auto mb-4 object-contain"
                />
                <h4 className="font-extrabold text-[#3A2E2B] text-base mb-1">Youth Entrepreneurship Pitch Club</h4>
                <p className="text-xs text-[#3A2E2B] font-medium mb-4">Launch real micro-businesses and compete in youth business challenges.</p>
                <Link
                  to="/ages-15-17"
                  className="inline-flex items-center gap-2 bg-transparent border-2 border-[#3A2E2B] text-[#3A2E2B] text-xs font-extrabold px-4 py-2 rounded-xl hover:bg-[#3A2E2B] hover:text-white transition-all no-underline"
                >
                  Explore Pitch Competition
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

    </main>
  );
};

export default Home;
