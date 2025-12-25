
import React, { useState, useEffect } from 'react';
import { nexusStore } from '../services/nexusStore';
import { OrganizationType, CompanySize, AppModule, Role } from '../types';
import { getIndustrySetup } from '../services/ai';
import { 
  Building2, Utensils, ShoppingBag, Briefcase, 
  CheckCircle2, ArrowRight, Truck, Factory, Zap, Check, Plus, Trash2, Box, Bot, Image as ImageIcon, User, MapPin, Phone, Award
} from 'lucide-react';

interface SetupWizardProps {
  onComplete: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [isConfiguring, setIsConfiguring] = useState(false);
  
  const [repName, setRepName] = useState(nexusStore.currentUser?.name || '');
  const [repTitle, setRepTitle] = useState('Administrator');
  const [repPhone, setRepPhone] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<OrganizationType>('General');
  const [orgSize, setOrgSize] = useState<CompanySize>('Small (11-50)');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [brandColor, setBrandColor] = useState('#00ff9d');
  const [selectedModules, setSelectedModules] = useState<AppModule[]>(['CRM', 'Reports']);
  const [invites, setInvites] = useState<{ email: string; role: Role }[]>([]);

  const handleFinish = () => {
    setIsConfiguring(true);
    setTimeout(() => {
      nexusStore.completeSetup({ 
        name: orgName,
        type: orgType, 
        size: orgSize,
        brandColor,
        address,
        firs_tin: taxId,
        contactPhone: repPhone,
        contactPerson: { name: repName, email: nexusStore.currentUser?.email || '', jobTitle: repTitle },
        enabledModules: selectedModules,
      }, invites);
      onComplete();
    }, 2000); 
  };

  if (isConfiguring) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Zap size={64} className="text-[#00ff9d] animate-pulse mb-8" />
        <h2 className="text-3xl font-black uppercase tracking-tighter">Initializing Neural Hub...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto border border-slate-100">
        <div className="w-full md:w-80 bg-slate-950 text-white p-10 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-12">
            <Box size={32} className="text-[#00ff9d] animate-spin-slow" />
            <span className="font-black text-xl uppercase tracking-tighter">PXI CORE</span>
          </div>
          <div className="space-y-6">
             {[1, 2, 3, 4, 5].map(s => (
                <div key={s} className="flex items-center gap-4">
                   <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${step === s ? 'bg-[#00ff9d] text-slate-950 shadow-lg' : 'bg-slate-800 text-slate-500'}`}>{s}</div>
                   <span className={`text-[10px] font-black uppercase tracking-widest ${step === s ? 'text-white' : 'text-slate-600'}`}>Stage {s}</span>
                </div>
             ))}
          </div>
        </div>

        <div className="flex-1 p-14 relative overflow-y-auto bg-white">
           {step === 1 && (
              <div className="animate-in slide-in-from-right duration-300 space-y-10">
                 <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Admin Verification.</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <input className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" placeholder="Full Name" value={repName} onChange={e => setRepName(e.target.value)}/>
                    <input className="w-full p-4 bg-slate-50 border rounded-2xl font-bold" placeholder="Title" value={repTitle} onChange={e => setRepTitle(e.target.value)}/>
                 </div>
              </div>
           )}
           
           {step === 2 && (
              <div className="animate-in slide-in-from-right duration-300 space-y-10">
                 <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Entity Registration.</h2>
                 <input className="w-full p-4 bg-slate-50 border rounded-2xl font-black uppercase" placeholder="Company Name" value={orgName} onChange={e => setOrgName(e.target.value)}/>
              </div>
           )}

           <div className="absolute bottom-10 right-14 flex gap-4">
              {step > 1 && <button onClick={() => setStep(step - 1)} className="px-6 py-3 font-black text-slate-400 uppercase text-xs">Back</button>}
              <button onClick={() => step < 5 ? setStep(step + 1) : handleFinish()} className="bg-slate-950 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-xl">
                 {step < 5 ? 'Continue' : 'Initialize OS'} <ArrowRight size={16}/>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
