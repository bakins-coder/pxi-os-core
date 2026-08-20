import React from 'react';

export const ChildProtectionPage: React.FC = () => {
  return (
    <main className="max-w-4xl mx-auto px-4 lg:px-8 py-10">
      <span className="inline-block bg-[#FFF3EB] border border-[#FFDCC7] text-[#FF5B3B] text-xs font-extrabold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-4">
        🛡️ COMPLIANCE & SAFETY
      </span>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#3A2E2B] mb-4">
        Children's Data Protection & Privacy Policy
      </h1>
      <p className="text-sm text-[#3A2E2B] font-semibold leading-relaxed mb-8">
        Last updated: August 2026 • Compliant with COPPA (US) & GDPR-K (EU/UK)
      </p>

      <div className="space-y-8 bg-[#FFFDF7] border border-[#F3EAD8] rounded-3xl p-8 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-[#3A2E2B] mb-2">1. Commitment to Child Protection</h2>
          <p className="text-xs text-[#3A2E2B] font-medium leading-relaxed">
            At AjapasWorld and MoneeWise, protecting the privacy and safety of children is our highest priority. We design all our digital tools, games, and learning applications to adhere strictly to the Children's Online Privacy Protection Act (COPPA) and the General Data Protection Regulation for Kids (GDPR-K).
          </p>
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-[#3A2E2B] mb-2">2. Verified Parental Consent</h2>
          <p className="text-xs text-[#3A2E2B] font-medium leading-relaxed">
            We require explicit, verified parental or guardian consent before creating accounts for children under 13 (or under 16 depending on jurisdiction). Parents maintain complete oversight and control over their child’s profile, jars, and activity.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-[#3A2E2B] mb-2">3. Data Minimization & No Behavioral Ads</h2>
          <p className="text-xs text-[#3A2E2B] font-medium leading-relaxed">
            We only collect the absolute minimum personal data necessary to provide our educational and financial stewardship services. We never sell child data, and we do not serve targeted or behavioral advertisements to children.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-[#3A2E2B] mb-2">4. Parental Rights & Control</h2>
          <p className="text-xs text-[#3A2E2B] font-medium leading-relaxed">
            Parents have the right to review, edit, or delete any personal information collected about their child at any time through the Parent Vault Dashboard or by contacting our dedicated privacy officer at <span className="font-extrabold text-[#FF5B3B]">privacy@ajapasworld.com</span>.
          </p>
        </div>
      </div>
    </main>
  );
};

export default ChildProtectionPage;
