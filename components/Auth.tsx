import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { Role, OrganizationSettings } from '../types';
import { 
  Building2, User, Mail, Lock, ArrowRight, Loader2, 
  CheckCircle2, AlertCircle, LayoutDashboard, ChevronRight, Search, Sparkles
} from 'lucide-react';

interface AuthProps {
  onSuccess: () => void;
}

export const Login = ({ onSuccess }: AuthProps) => {
  const [email, setEmail] = useState('admin@unified.app');
  const [password, setPassword] = useState('password');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentOrgs, setRecentOrgs] = useState<OrganizationSettings[]>([]);

  useEffect(() => {
    const orgs = db.organizations.filter(o => o.id !== 'org-default');
    setRecentOrgs(orgs);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await db.login(email);
      onSuccess();
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAccess = async (org: OrganizationSettings) => {
    setIsLoading(true);
    try {
      await db.login(org.contactPerson?.email || '');
      onSuccess();
    } catch (err) {
      setError('Could not access workspace');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Welcome Back.</h2>
        <p className="text-slate-500 font-medium">Enter your credentials to access your desk.</p>
      </div>

      {recentOrgs.length > 0 && (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Auto-Detected Workspaces</h3>
          <div className="space-y-3">
            {recentOrgs.map(org => (
              <button 
                key={org.id}
                onClick={() => handleQuickAccess(org)}
                className="w-full flex items-center justify-between p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl hover:bg-indigo-100 hover:shadow-lg transition-all group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 vibrant-gradient rounded-xl flex items-center justify-center text-white font-black text-lg">
                    {org.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-base font-bold text-indigo-950">{org.name}</div>
                    <div className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{org.type}</div>
                  </div>
                </div>
                <ChevronRight size={20} className="text-indigo-300 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-[9px] uppercase"><span className="bg-white px-4 text-slate-400 font-black tracking-[0.3em]">Manual Entry</span></div>
          </div>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="email"
              required
              className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium transition-all"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Security Key</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="password"
              required
              className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 text-sm font-bold text-rose-600 bg-rose-50 p-4 rounded-2xl border border-rose-100">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full vibrant-gradient hover:opacity-90 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-70 flex justify-center items-center gap-3 shadow-2xl shadow-indigo-600/20 active:scale-95"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In Now'}
          {!isLoading && <ArrowRight size={18}/>}
        </button>
      </form>
    </div>
  );
};

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:flex w-3/5 vibrant-gradient text-white p-20 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 57c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM16 12c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm67 16c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zM48 70c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zM16 80c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm67 16c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z\' fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }}></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-16">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-900 shadow-2xl">
               <Sparkles size={36} fill="currentColor"/>
            </div>
            <h1 className="text-3xl font-black tracking-tighter">PXI UNIFIED OS</h1>
          </div>
          <h2 className="text-7xl font-black leading-[0.9] mb-10 tracking-tighter">Scale Your<br/>Excellence.</h2>
          <p className="text-indigo-100 text-2xl font-medium max-w-lg leading-relaxed opacity-80">The definitive operating system for high-growth catering and professional service businesses.</p>
        </div>
        
        <div className="relative z-10 flex gap-10 text-sm font-black uppercase tracking-[0.3em] text-white/60">
          <span>Finance</span>
          <span>CRM</span>
          <span>Operations</span>
          <span>AI Agents</span>
        </div>
      </div>

      <div className="w-full lg:w-2/5 flex flex-col items-center justify-center p-12 bg-white relative">
        <div className="w-full max-w-md animate-in fade-in duration-700">
          {isLogin ? <Login onSuccess={() => window.location.hash = '/'} /> : <Signup onSuccess={() => window.location.hash = '/'} />}
          <div className="mt-12 text-center text-sm font-medium">
            <span className="text-slate-400">{isLogin ? "Need a fresh workspace?" : "Already have an account?"}</span>
            <button onClick={() => setIsLogin(!isLogin)} className="ml-2 font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-widest text-[10px]">
              {isLogin ? 'Create Account' : 'Sign In Instead'}
            </button>
          </div>
        </div>
        
        <div className="absolute bottom-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
          Powered by PXI OS
        </div>
      </div>
    </div>
  );
};

export const Signup = ({ onSuccess }: AuthProps) => {
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await db.signup(orgName, name, email);
    setIsLoading(false);
    onSuccess();
  };

  return (
    <div className="w-full">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Get Started.</h2>
        <p className="text-slate-500 font-medium">Create your unified business account in seconds.</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-5">
        {step === 1 && (
          <div className="animate-in slide-in-from-right space-y-5">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Company Name</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  autoFocus
                  className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium transition-all"
                  placeholder="Acme Celebrations LTD"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => orgName && setStep(2)}
              className="w-full vibrant-gradient hover:opacity-90 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex justify-center items-center gap-3 shadow-2xl shadow-indigo-600/20 active:scale-95"
            >
              Next Step <ArrowRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in slide-in-from-right space-y-5">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Administrator Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium transition-all"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Direct Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium transition-all"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Create Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium transition-all"
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="px-6 py-4 bg-slate-100 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 rounded-2xl transition-all"
              >
                Back
              </button>
              <button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 vibrant-gradient hover:opacity-90 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all disabled:opacity-70 flex justify-center items-center gap-3 shadow-2xl shadow-indigo-600/20 active:scale-95"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Establish Workspace'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};