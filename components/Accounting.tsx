import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { getCFOAdvice, suggestCOAForTransaction } from '../services/ai';
import { 
  BookOpen, TrendingUp, ShieldCheck, Download, Plus, 
  Bot, Sparkles, Activity, Landmark, 
  RefreshCw, FileText, Calculator, Lock, ChevronRight, CheckCircle2, AlertTriangle, ShieldAlert, Zap
} from 'lucide-react';

export const Accounting = () => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'advisor' | 'reconcile' | 'firs' | 'watchdog'>('ledger');
  const [coa, setCoa] = useState(db.chartOfAccounts);
  const [cfoInsight, setCfoInsight] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [bankLines, setBankLines] = useState(db.bankStatementLines);
  const [selectedLine, setSelectedLine] = useState<any>(null);
  const [aiMatchId, setAiMatchId] = useState<string | null>(null);

  // Watchdog State
  const [anomalies, setAnomalies] = useState<{id: string, type: string, message: string, severity: 'Medium' | 'High'}[]>([]);

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setCoa([...db.chartOfAccounts]);
      setBankLines([...db.bankStatementLines]);
    });
    fetchAdvisor();
    runWatchdog();
    return unsubscribe;
  }, []);

  const fetchAdvisor = async () => {
    setIsSyncing(true);
    const insight = await getCFOAdvice();
    setCfoInsight(insight);
    setIsSyncing(false);
  };

  const runWatchdog = () => {
    const findings: any[] = [];
    // 1. Detect Duplicates
    const seen = new Set();
    db.bankStatementLines.forEach(l => {
      const key = `${l.description}-${l.amountCents}-${l.type}`;
      if (seen.has(key)) {
        findings.push({ id: `dup-${l.id}`, type: 'Duplicate Record', message: `Possible duplicate entry detected for "${l.description}" (₦${(l.amountCents/100).toLocaleString()})`, severity: 'Medium' });
      }
      seen.add(key);
    });
    // 2. Large Cash Outflows
    db.bankStatementLines.filter(l => l.type === 'Debit' && l.amountCents > 100000000).forEach(l => {
       findings.push({ id: `high-${l.id}`, type: 'Large Outflow', message: `Unusual large outflow of ₦${(l.amountCents/100).toLocaleString()} to "${l.description}"`, severity: 'High' });
    });
    setAnomalies(findings);
  };

  const handleMatch = (lineId: string, accountId: string) => {
    db.reconcileMatch(lineId, accountId);
    setSelectedLine(null);
    setAiMatchId(null);
  };

  const runMatchAI = async (line: any) => {
    setIsSyncing(true);
    const suggestion = await suggestCOAForTransaction(line.description);
    setAiMatchId(suggestion);
    setIsSyncing(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-24">
      <div className="bg-slate-950 p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00ff9d]/20 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-tr from-[#00ff9d] to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                   <BookOpen size={36} className="text-slate-950" />
                </div>
                <div>
                   <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">LedgerAI Central</h1>
                   <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1.5 bg-[#00ff9d]/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[#00ff9d] border border-[#00ff9d]/20">
                         <ShieldCheck size={12}/> Double-Entry Engine Verified
                      </span>
                   </div>
                </div>
             </div>

             <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md overflow-x-auto max-w-full">
                {[
                  { id: 'ledger', label: 'GL', icon: BookOpen },
                  { id: 'advisor', label: 'CFO Advisor', icon: Bot },
                  { id: 'reconcile', label: 'Reconcile', icon: Landmark },
                  { id: 'watchdog', label: 'The Watchdog', icon: ShieldAlert },
                  { id: 'firs', label: 'FIRS Filing', icon: FileText }
                ].map(tab => (
                   <button 
                      key={tab.id} 
                      onClick={() => setActiveTab(tab.id as any)} 
                      className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-[#00ff9d] text-slate-950 shadow-lg' : 'text-white/50 hover:text-white'}`}
                   >
                      <tab.icon size={14}/> {tab.label}
                      {tab.id === 'watchdog' && anomalies.length > 0 && <span className="bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-pulse">{anomalies.length}</span>}
                   </button>
                ))}
             </div>
          </div>
       </div>

      {activeTab === 'ledger' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                 <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Chart of Accounts</h2>
                    <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Plus size={14}/> New Account</button>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                       <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest">
                          <tr>
                             <th className="px-8 py-4">Code / Account</th>
                             <th className="px-8 py-4">Type</th>
                             <th className="px-8 py-4 text-right">Balance</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {coa.map(account => (
                             <tr key={account.id} className="hover:bg-indigo-50/20 transition-all group">
                                <td className="px-8 py-6">
                                   <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-50 font-mono text-xs">{account.code}</div>
                                      <div className="font-black text-slate-800 uppercase text-sm">{account.name}</div>
                                   </div>
                                </td>
                                <td className="px-8 py-6">
                                   <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                      account.type === 'Asset' ? 'bg-blue-50 text-blue-600' :
                                      account.type === 'Revenue' ? 'bg-emerald-50 text-emerald-600' :
                                      account.type === 'Expense' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                                   }`}>{account.type}</span>
                                </td>
                                <td className="px-8 py-6 text-right font-black text-slate-900">
                                   {account.currency === 'USD' ? '$' : '₦'}{(account.balanceCents / 100).toLocaleString()}
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
           <div className="space-y-8">
              <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff9d]/10 rounded-full blur-2xl"></div>
                 <h3 className="text-[10px] font-black text-[#00ff9d] uppercase tracking-[0.3em] mb-6">Financial Vitality</h3>
                 <div className="space-y-6">
                    <div>
                       <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Estimated Runway</p>
                       <h4 className="text-4xl font-black text-white tracking-tighter">{db.getRunwayMonths()} Months</h4>
                    </div>
                    <div className="pt-6 border-t border-white/10">
                       <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Burn Rate (Monthly)</p>
                       <h4 className="text-xl font-bold text-rose-400">₦{(db.getNetBurnRate() / 100).toLocaleString()}</h4>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'watchdog' && (
         <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="bg-slate-900 p-8 rounded-[3rem] text-white relative overflow-hidden border border-white/5 shadow-2xl">
               <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl"></div>
               <div className="relative z-10 flex items-center gap-6">
                  <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-xl animate-pulse">
                     <ShieldAlert size={32}/>
                  </div>
                  <div>
                     <h2 className="text-2xl font-black uppercase tracking-tight">The Watchdog Active</h2>
                     <p className="text-rose-200 text-sm font-medium">Scanning for duplicates, anomalies, and liquidity risks in real-time.</p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {anomalies.map(ano => (
                  <div key={ano.id} className={`p-8 rounded-[2.5rem] bg-white border-2 flex items-start gap-6 transition-all shadow-sm hover:shadow-xl ${ano.severity === 'High' ? 'border-rose-100' : 'border-amber-100'}`}>
                     <div className={`p-4 rounded-2xl ${ano.severity === 'High' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
                        {ano.severity === 'High' ? <AlertTriangle size={24}/> : <Zap size={24}/>}
                     </div>
                     <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                           <span className={`text-[10px] font-black uppercase tracking-widest ${ano.severity === 'High' ? 'text-rose-600' : 'text-amber-600'}`}>{ano.type}</span>
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${ano.severity === 'High' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}`}>{ano.severity} Severity</span>
                        </div>
                        <p className="font-bold text-slate-800 text-lg leading-tight mb-4">{ano.message}</p>
                        <div className="flex gap-2">
                           <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Audit Entry</button>
                           <button className="bg-slate-50 text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Ignore</button>
                        </div>
                     </div>
                  </div>
               ))}
               {anomalies.length === 0 && (
                  <div className="col-span-2 p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                     <CheckCircle2 size={64} className="mx-auto text-emerald-500 mb-6 opacity-30"/>
                     <p className="text-xl font-bold text-slate-400 uppercase tracking-widest">No Anomalies Detected</p>
                  </div>
               )}
            </div>
         </div>
      )}

      {activeTab === 'advisor' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-[#00ff9d]/5 rounded-full blur-3xl"></div>
                 <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                       <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-[#00ff9d] shadow-2xl animate-float">
                          <Bot size={40}/>
                       </div>
                       <div>
                          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Agentic CFO Feed</h2>
                          <p className="text-slate-500 font-medium">Real-time tax strategy & compliance monitoring.</p>
                       </div>
                    </div>
                    <button onClick={fetchAdvisor} disabled={isSyncing} className="bg-[#00ff9d] text-slate-950 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all active:scale-95">
                       {isSyncing ? <RefreshCw className="animate-spin" size={16}/> : <RefreshCw size={16}/>} Refresh Insights
                    </button>
                 </div>

                 {cfoInsight && (
                    <div className="mt-12 space-y-8 animate-in slide-in-from-top-4">
                       <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                          <p className="text-slate-700 font-medium text-lg leading-relaxed italic">"{cfoInsight.summary}"</p>
                          <div className="mt-4 flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full animate-pulse ${cfoInsight.sentiment === 'Healthy' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                             <span className="text-[10px] font-black uppercase text-slate-400">Health Index: {cfoInsight.sentiment}</span>
                          </div>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'reconcile' && (
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row h-[700px]">
           <div className="w-full md:w-96 bg-slate-50 border-r border-slate-100 flex flex-col">
              <div className="p-8 border-b border-slate-200">
                 <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight mb-1">Bank Feed</h3>
                 <p className="text-xs text-slate-500 font-bold uppercase">Mono API Linked</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {bankLines.filter((l: any) => !l.isMatched).map((line: any) => (
                    <div 
                      key={line.id} 
                      onClick={() => setSelectedLine(line)}
                      className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${selectedLine?.id === line.id ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white border-white hover:border-indigo-100 shadow-sm'}`}
                    >
                       <div className="flex justify-between items-start mb-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${line.type === 'Credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{line.type}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{line.date}</span>
                       </div>
                       <h4 className="font-black text-sm uppercase leading-tight mb-4">{line.description}</h4>
                       <div className="text-xl font-black">₦{(line.amountCents / 100).toLocaleString()}</div>
                    </div>
                 ))}
              </div>
           </div>
           <div className="flex-1 flex flex-col bg-white">
              {selectedLine ? (
                 <div className="p-12 space-y-12 animate-in slide-in-from-right-4">
                    <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Reconciliation Node</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="p-8 bg-slate-900 text-white rounded-[2.5rem]">
                          <Landmark className="text-[#00ff9d] mb-4" size={24}/>
                          <h4 className="text-xl font-bold mb-2">{selectedLine.description}</h4>
                          <div className="text-3xl font-black">₦{(selectedLine.amountCents / 100).toLocaleString()}</div>
                          <button onClick={() => runMatchAI(selectedLine)} className="mt-8 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                             {isSyncing ? <RefreshCw className="animate-spin" size={14}/> : <Bot size={14}/>} Ask Agent for Match
                          </button>
                       </div>
                       <div className="space-y-4">
                          {coa.filter(a => ['Revenue', 'Expense'].includes(a.type)).map(acc => (
                             <button key={acc.id} onClick={() => handleMatch(selectedLine.id, acc.id)} className={`w-full p-6 rounded-3xl border-2 text-left flex justify-between items-center ${aiMatchId === acc.id ? 'border-[#00ff9d] bg-[#00ff9d]/5' : 'border-slate-50 bg-slate-50'}`}>
                                <div>
                                   <div className="text-sm font-black text-slate-800 uppercase">{acc.name}</div>
                                   <div className="text-[10px] text-slate-400 font-bold uppercase">{acc.code}</div>
                                </div>
                                <ChevronRight className="text-slate-300"/>
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>
              ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-20">
                    <Activity size={80} className="mb-6 opacity-10"/>
                    <p className="text-xl font-bold uppercase tracking-widest">Select a line to begin reconciliation</p>
                 </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};