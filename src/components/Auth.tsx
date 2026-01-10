
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  Mail, Lock, ArrowRight, Loader2, AlertCircle, Box, User, ShieldCheck, Sparkles, Building, RefreshCw, UserCircle, CheckCircle2
} from 'lucide-react';
import { Role } from '../types';

export const Login = ({ onSuccess, onSwitch }: { onSuccess: () => void, onSwitch: () => void }) => {
  const { login, signup } = useAuthStore();
  const { partialSetupData, settings } = useSettingsStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasDraft, setHasDraft] = useState(false);
  const [targetOrg, setTargetOrg] = useState('');

  useEffect(() => {
    if (partialSetupData && !settings.setupComplete) {
      setHasDraft(true);
      if (partialSetupData.email) {
        setEmail(partialSetupData.email);
        setIsSignUp(true); // Assume continuing means signing up/finishing
      }
      if (partialSetupData.orgName) {
        setTargetOrg(partialSetupData.orgName);
      } else if (partialSetupData.email === 'toxsyyb@yahoo.co.uk') {
        setTargetOrg('Xquisite Celebrations Limited');
      }
    }
  }, [partialSetupData, settings.setupComplete]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    let authIdentifier = email.trim();

    // Phone Number Logic: If it looks like a phone number (digits), treat as phone-based user
    const isPhoneNumber = /^[0-9+]+$/.test(authIdentifier);
    if (isPhoneNumber) {
      // Strip non-digits just in case, though regex checks it
      const cleanPhone = authIdentifier.replace(/\D/g, '');
      authIdentifier = `${cleanPhone}@xquisite.staff`;
    }

    try {
      if (isSignUp) {
        if (!name) throw new Error('Name is required for signup.');
        // For phone users, we might want to ensure a role or specific setup, but basic signup works the same
        await signup(name, authIdentifier, password);
      } else {
        await login(authIdentifier, password);
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Smart Context Assistant Logic
  const getContextAdvice = () => {
    if (!email) return null;

    const isDigits = /^\d+$/.test(email);
    if (isDigits) {
      if (email.length < 11) return { text: `Enter ${11 - email.length} more digits for a valid local number`, color: 'text-yellow-500' };
      if (email.length > 11) return { text: `Number seems too long (Standard is 11 digits)`, color: 'text-yellow-500' };
      return { text: 'Valid Phone Number Format Detected', color: 'text-[#00ff9d]' };
    }

    if (!email.includes('@')) return { text: 'Enter a valid email address (missing @)', color: 'text-yellow-500' };
    if (!email.includes('.')) return { text: 'Enter a valid domain (missing .com, .ng, etc)', color: 'text-yellow-500' };

    return { text: 'Valid Email Format Detected', color: 'text-[#00ff9d]' };
  };

  const advice = getContextAdvice();

  return (
    <div className="w-full max-sm animate-in fade-in slide-in-from-bottom-4">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-black text-white tracking-tighter mb-3 uppercase">{isSignUp ? 'Create Workspace' : 'Welcome Back.'}</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{isSignUp ? 'Launch your new digital headquarters.' : 'Securely access your business workspace.'}</p>
      </div>

      <form onSubmit={handleAuth} className="flex flex-col space-y-6">
        {hasDraft && (
          <div className="p-5 bg-[#00ff9d]/5 border border-[#00ff9d]/20 rounded-3xl space-y-3 animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3 text-[#00ff9d] text-[10px] font-black uppercase tracking-widest">
              <RefreshCw size={14} className="animate-spin-slow" /> Setup in progress detected
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00ff9d] flex items-center justify-center text-slate-950">
                <Building size={20} />
              </div>
              <div>
                <p className="text-[11px] font-black text-white uppercase tracking-tight">{targetOrg || 'Active Node'}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase">Resuming Identity for {email}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {isSignUp && (
          <div className="relative group w-1/2 mx-auto animate-in slide-in-from-left-4">
            <label className="block text-[10px] font-black text-[#00ff9d] uppercase tracking-[0.3em] mb-3 text-center">Full Name</label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                required={isSignUp}
                className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-[#00ff9d] outline-none font-bold transition-all placeholder:text-slate-700"
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="relative group w-1/2 mx-auto">
          <label className="block text-[10px] font-black text-[#00ff9d] uppercase tracking-[0.3em] mb-3 text-center">Business Email or Phone</label>
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              required
              className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-[#00ff9d] outline-none font-bold transition-all placeholder:text-slate-700"
              placeholder="email@company.com OR 0801234..."
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            {advice && (
              <div className={`absolute -bottom-6 left-0 w-full text-center text-[9px] font-bold uppercase tracking-widest ${advice.color} animate-in fade-in slide-in-from-top-1`}>
                {advice.text}
              </div>
            )}
          </div>
        </div>

        <div className="relative group w-1/2 mx-auto">
          <label className="block text-[10px] font-black text-[#00ff9d] uppercase tracking-[0.3em] mb-3 text-center">Password</label>
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="password"
              required
              className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white focus:border-[#00ff9d] outline-none font-bold transition-all placeholder:text-slate-700"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-1/3 mx-auto bg-[#00ff9d] py-5 rounded-2xl font-black text-slate-950 uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50 text-[10px]"
        >
          {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : isSignUp ? 'Create Workspace' : 'Sign In'}
        </button>

        <div className="flex flex-col gap-4 mt-8 text-center">
          <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-[11px] font-black text-slate-500 uppercase hover:text-white transition-colors">
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create Workspace"}
          </button>
          <div className="h-px bg-white/5 w-full my-2"></div>
          <button type="button" onClick={() => login('guest@paradigm-xi.com').then(onSuccess)} className="w-full py-4 bg-white/5 rounded-2xl font-black text-[#00ff9d] uppercase text-[11px] border border-white/10 flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
            <Sparkles size={14} /> Explore Guest Demo
          </button>
          <button type="button" onClick={() => window.location.hash = '/brochure'} className="w-full py-4 bg-indigo-600/10 rounded-2xl font-black text-indigo-400 uppercase text-[11px] border border-indigo-500/20 flex items-center justify-center gap-2 hover:bg-indigo-600/20 transition-all">
            Plan Custom Event
          </button>
        </div>
      </form>
    </div>
  );
};

export const Signup = ({ onSuccess, onSwitch }: { onSuccess: () => void, onSwitch: () => void }) => {
  const { signup } = useAuthStore();
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('Mr');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const name = `${title} ${firstName} ${lastName}`.trim();
      await signup(name, email.trim(), Role.ADMIN);
      onSuccess();
    } catch (err) {
      setError('Registration node failed. Please try a different email.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full pl-6 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-[#00ff9d] transition-all placeholder:text-slate-700 text-sm";
  const labelClasses = "block text-[9px] font-black text-[#00ff9d] uppercase tracking-widest mb-2 ml-1";

  return (
    <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-black text-white tracking-tighter mb-3 uppercase">Get Started.</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Launch your company's smart operations hub.</p>
      </div>
      <form onSubmit={handleSignup} className="space-y-6">
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-xs font-bold uppercase tracking-widest">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 relative">
            <label className={labelClasses}>Work Email Address</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                required
                type="email"
                className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-[#00ff9d] transition-all placeholder:text-slate-700 text-sm"
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Title</label>
            <select
              className="w-full px-6 py-4 bg-[#0f172a] border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-[#00ff9d] transition-all text-sm appearance-none"
              value={title}
              onChange={e => setTitle(e.target.value)}
            >
              <option value="Mr">Mr.</option>
              <option value="Ms">Ms.</option>
              <option value="Mrs">Mrs.</option>
              <option value="Dr">Dr.</option>
            </select>
          </div>

          <div>
            <label className={labelClasses}>Gender</label>
            <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl">
              <button
                type="button"
                onClick={() => setGender('Male')}
                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${gender === 'Male' ? 'bg-[#00ff9d] text-slate-950 shadow-lg' : 'text-slate-500'}`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => setGender('Female')}
                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${gender === 'Female' ? 'bg-[#00ff9d] text-slate-950 shadow-lg' : 'text-slate-500'}`}
              >
                Female
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClasses}>First Name</label>
            <input required className={inputClasses} placeholder="First" value={firstName} onChange={e => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className={labelClasses}>Middle Name</label>
            <input className={inputClasses} placeholder="Middle" value={middleName} onChange={e => setMiddleName(e.target.value)} />
          </div>
          <div>
            <label className={labelClasses}>Surname</label>
            <input required className={inputClasses} placeholder="Surname" value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
        </div>

        <div className="bg-[#00ff9d]/5 border border-[#00ff9d]/10 p-4 rounded-2xl mb-2">
          <p className="text-[9px] text-[#00ff9d] font-black uppercase tracking-widest mb-1 flex items-center gap-2">
            <ShieldCheck size={12} /> Enterprise Security
          </p>
          <p className="text-[8px] text-slate-500 font-bold leading-tight uppercase">You will be designated as the Account Administrator. Your workspace will be private and secure.</p>
        </div>

        <button disabled={isLoading} className="w-full bg-[#00ff9d] py-5 rounded-2xl font-black text-slate-950 uppercase shadow-xl active:scale-95 transition-all text-sm tracking-widest">
          {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Create Workspace'}
        </button>
        <button type="button" onClick={onSwitch} className="w-full mt-4 text-[11px] font-black text-slate-500 uppercase hover:text-white transition-colors">Already registered? Sign in to your account</button>
      </form>
    </div>
  );
};

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  return (
    <div className="min-h-screen bg-[#020617] flex">
      <div className="hidden lg:flex w-3/5 bg-slate-950 text-white p-24 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000')] opacity-10 bg-cover bg-center"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-5 mb-20">
            <Box size={40} className="text-[#00ff9d] animate-pulse" />
            <h1 className="text-4xl font-black uppercase tracking-tighter">Paradigm-Xi</h1>
          </div>
          <h2 className="text-8xl font-black tracking-tighter uppercase leading-[0.85]">Smart<br /><span className="text-[#00ff9d]">Operations.</span></h2>
          <div className="mt-12 flex flex-wrap gap-4">
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#00ff9d]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Secure Data Isolation</span>
            </div>
            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#00ff9d]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Automated Operations</span>
            </div>
          </div>
        </div>
        <div className="relative z-10 text-[10px] font-black uppercase tracking-[0.5em] text-slate-600">© 2025 PARADIGM-XI • BUSINESS OPERATING SYSTEM</div>
      </div>
      <div className="w-full lg:w-2/5 flex flex-col items-center justify-center p-12 bg-[#020617] border-l border-white/5 shadow-2xl">
        {isLogin ? (
          <Login onSuccess={() => window.location.hash = '/'} onSwitch={() => setIsLogin(false)} />
        ) : (
          <Signup onSuccess={() => window.location.hash = '/'} onSwitch={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
};
