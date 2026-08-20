import React from 'react';
import { Link } from 'react-router-dom';

interface AgeBracketProps {
  stage: '6-8' | '9-11' | '12-14' | '15-17';
}

const STAGE_DATA = {
  '6-8': {
    title: 'Early Childhood (Ages 6–8): Tangible & Visual Basics',
    badge: 'Stage 1 • Concrete & Tactile',
    color: '#FFA033',
    description: 'At this stage, children learn through concrete, tactile experiences rather than abstract numbers. Focusing on physical money recognition, differentiating needs vs. wants, and 4 visual jars.',
    topics: [
      'Physical money recognition (coins and bills)',
      'Differentiating needs vs. wants through stories',
      'Basic categorization using visual jars: Earn, Save, Spend, Give',
      'Immediate rewards for simple household tasks & saving toward short-term goals',
    ],
    icon: '🪙',
  },
  '9-11': {
    title: 'Tweens (Ages 9–11): Relational & Comparative Money',
    badge: 'Stage 2 • Comparative Reasoning',
    color: '#FFA033',
    description: 'Children begin to grasp digital money representations, skill-based earning, comparison shopping, and setting medium-term financial goals.',
    topics: [
      'How income is earned through work, creativity & skills',
      'Basic budgeting & value assessment (store brand vs. name brand)',
      'Introduction to basic interest and simple investment concepts',
      'Managing a basic allowance & budgeting for a specific device over weeks/months',
    ],
    icon: '📊',
  },
  '12-14': {
    title: 'Early Teens (Ages 12–14): Banking & Digital Literacy',
    badge: 'Stage 3 • Digital Autonomy',
    color: '#9333EA',
    description: 'Teens develop critical reasoning needed to handle digital financial tools, youth cards, compound growth, and marketing awareness.',
    topics: [
      'Operating prepaid debit cards & youth bank accounts',
      'Foundations of compound interest and stock market concepts (Invest jar)',
      'Identifying advertising tactics & consumer traps',
      'Tracking personal spending via apps & setting up automatic savings transfers',
    ],
    icon: '💳',
  },
  '15-17': {
    title: 'Older Teens (Ages 15–17): Autonomy & Real-World Systems',
    badge: 'Stage 4 • Independence & Systems',
    color: '#9333EA',
    description: 'Near-adults require practical preparation for independence, earned income, paystubs, taxes, credit scores, and wealth preservation.',
    topics: [
      'Earned income, paystubs, taxes & budgeting for life expenses (fuel, subscriptions)',
      'Credit scores, debt risks & borrowing costs',
      'Index funds, asset allocation & custodial brokerage accounts',
      'Managing side-hustle income, filing basic mock taxes & micro-business creation',
    ],
    icon: '🚀',
  },
};

export const AgeBracketPage: React.FC<AgeBracketProps> = ({ stage }) => {
  const data = STAGE_DATA[stage];

  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
      <div className="max-w-4xl mx-auto">
        <span
          className="inline-block border text-xs font-extrabold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-4"
          style={{ color: data.color, borderColor: data.color, backgroundColor: '#FFF3EB' }}
        >
          {data.badge}
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#3A2E2B] mb-4">
          {data.title}
        </h1>
        <p className="text-base text-[#3A2E2B] font-semibold leading-relaxed mb-8">
          {data.description}
        </p>

        <div className="bg-[#FFFDF7] border border-[#F3EAD8] rounded-3xl p-8 shadow-sm mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">{data.icon}</span>
            <h2 className="text-xl font-extrabold text-[#3A2E2B]">Key Learning Focus Areas</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.topics.map((topic, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-[#F3EAD8] flex items-start gap-3">
                <span className="text-[#FF5B3B] font-extrabold text-base">✓</span>
                <span className="text-xs font-bold text-[#3A2E2B] leading-relaxed">{topic}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link
            to="/moneewise"
            className="bg-[#FF5B3B] text-white font-extrabold text-xs py-3 px-6 rounded-full hover:bg-[#E04A2B] transition-all no-underline shadow-sm"
          >
            Connect to MoneeWise Vault ➔
          </Link>
          <Link
            to="/shop"
            className="bg-transparent border-2 border-[#3A2E2B] text-[#3A2E2B] text-xs font-extrabold py-2.5 px-6 rounded-xl hover:bg-[#3A2E2B] hover:text-white transition-all no-underline"
          >
            Browse Age-Appropriate Shop Kits
          </Link>
        </div>
      </div>
    </main>
  );
};

export default AgeBracketPage;
