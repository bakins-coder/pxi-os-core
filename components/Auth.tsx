
import React, { useState } from 'react';
import { nexusStore } from '../services/nexusStore';
import { 
  Mail, Lock, ArrowRight, Loader2, AlertCircle, Box, PlayCircle, User
} from 'lucide-react';

export const Login = ({ onSuccess }: { onSuccess: () => void }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await nexusStore.login(email);
      onSuccess();
    } catch (err) {
      setError('Neural authorization failure');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-black text-white tracking-tighter mb-3 uppercase">Connect.</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Initialize secure neural handshake.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-[10px] font-black text-[#00ff9d] uppercase tracking-[0.3em] mb-3">Identity Token (Email)</label>
          <input type="email" required className="w-full px-6 py-5 bg-[#0f172a] border border-white/5 rounded-2xl text-white focus:border-[#00ff9d] outline-none font-bold" value={email} onChange={e => setEmail(e.target.value)}/>
        </div>
        <button type="submit" disabled={isLoading} className="w-full bg-[#00ff9d] py-5 rounded-2xl font-black text-slate-950 uppercase tracking-widest shadow-xl active:scale-95 transition-all">
           {isLoading ? <Loader2 className="animate-spin mx-auto" size={20}/> : 'Initiate Session'}
        </button>
        <button type="button" onClick={() => nexusStore.enterSandbox().then(onSuccess)} className="w-full bg-white/5 py-4 rounded-2xl font-black text-[#00ff9d] uppercase text-[9px] border border-white/5">Try Simulated Sandbox</button>
      </form>
    </div>
  );
};

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  return (
    <div className="min-h-screen bg-[#020617] flex">
      <div className="hidden lg:flex w-3/5 bg-slate-950 text-white p-24 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-5 mb-20">
            <Box size={40} className="text-[#00ff9d] animate-pulse" />
            <h1 className="text-4xl font-black uppercase tracking-tighter">Paradigm-Xi</h1>
          </div>
          <h2 className="text-8xl font-black tracking-tighter uppercase leading-[0.85]">Code The<br/><span className="text-[#00ff9d]">Future.</span></h2>
        </div>
      </div>
      <div className="w-full lg:w-2/5 flex flex-col items-center justify-center p-12 bg-[#020617] border-l border-white/5">
        {isLogin ? <Login onSuccess={() => window.location.hash = '/'} /> : <Signup onSuccess={() => window.location.hash = '/'} />}
        <button onClick={() => setIsLogin(!isLogin)} className="mt-8 text-[9px] font-black text-slate-500 uppercase hover:text-[#00ff9d]">{isLogin ? 'Create Account' : 'Back to Login'}</button>
      </div>
    </div>
  );
};

export const Signup = ({ onSuccess }: { onSuccess: () => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await nexusStore.signup(name, email);
    onSuccess();
    setLoading(false);
  };

  return (
     <form onSubmit={handleSignup} className="w-full space-y-6">
        <h2 className="text-4xl font-black text-white tracking-tighter mb-10 text-center uppercase">Evolve.</h2>
        <input className="w-full px-6 py-5 bg-[#0f172a] border border-white/5 rounded-2xl text-white font-bold" placeholder="Legal Name" value={name} onChange={e => setName(e.target.value)}/>
        <input className="w-full px-6 py-5 bg-[#0f172a] border border-white/5 rounded-2xl text-white font-bold" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}/>
        <button className="w-full bg-[#00ff9d] py-5 rounded-2xl font-black text-slate-950 uppercase shadow-xl">Join Nexus</button>
     </form>
  );
};
