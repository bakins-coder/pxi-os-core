import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useDataStore } from '../store/useDataStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { OrganizationSettings, EmployeeStatus } from '../types';
import { Building2, Users, Shield, Save, Upload, Plus, Trash2, Mail, CheckCircle2 } from 'lucide-react';

export const ITPortal = () => {
    const { user } = useAuthStore();
    const { employees, updateEmployee, addEmployee } = useDataStore();
    const { settings, updateSettings } = useSettingsStore(); // Assuming this holds Org details for now

    const [activeTab, setActiveTab] = useState<'org' | 'staff' | 'access'>('org');

    // Org Form State
    const [orgName, setOrgName] = useState(settings.name || 'My Organization');
    const [orgAddress, setOrgAddress] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Staff Form State
    const [isAddingStaff, setIsAddingStaff] = useState(false);
    const [newStaff, setNewStaff] = useState({ firstName: '', lastName: '', email: '', role: 'Employee' as any });

    useEffect(() => {
        setOrgName(settings.name);
    }, [settings.name]);

    const handleSaveOrg = () => {
        setIsSaving(true);
        // Simulate API call to update organization table
        setTimeout(() => {
            updateSettings({ name: orgName });
            setIsSaving(false);
            alert('Organization Profile Updated');
        }, 1000);
    };

    const handleAddStaff = () => {
        if (!newStaff.firstName || !newStaff.email) return alert('Name and Email required');
        addEmployee({
            firstName: newStaff.firstName,
            lastName: newStaff.lastName,
            email: newStaff.email,
            role: newStaff.role,
            status: EmployeeStatus.ACTIVE,
            companyId: user?.companyId || 'org-xquisite' // Fallback for safety
        });
        setIsAddingStaff(false);
        setNewStaff({ firstName: '', lastName: '', email: '', role: 'Employee' });
    };

    if (!user || (user.role !== 'Admin' && user.role !== 'Super Admin')) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
                <div className="text-center">
                    <Shield size={48} className="mx-auto text-rose-500 mb-4" />
                    <h1 className="text-2xl font-black">ACCESS DENIED</h1>
                    <p className="text-slate-400 mt-2">Restricted to IT Administrators only.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/30">
            {/* Header */}
            <header className="bg-slate-900 text-white p-6 sticky top-0 z-50 shadow-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Building2 size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight uppercase">IT Control Center</h1>
                            <p className="text-xs text-indigo-300 font-mono tracking-wider">{user.companyId || 'UNKNOWN_ORG'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 bg-slate-800 p-1 rounded-xl">
                        {['org', 'staff', 'access'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                    }`}
                            >
                                {tab === 'org' ? 'Organization' : tab === 'staff' ? 'Staff Database' : 'User Access'}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 md:p-12">
                {activeTab === 'org' && (
                    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                <Building2 className="text-indigo-500" /> Organization Profile
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Organization Name</label>
                                    <input
                                        type="text"
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Billing Address</label>
                                    <textarea
                                        value={orgAddress}
                                        onChange={(e) => setOrgAddress(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 outline-none transition-colors h-32 resize-none"
                                        placeholder="123 Corporate Blvd..."
                                    />
                                </div>
                                <button
                                    onClick={handleSaveOrg}
                                    disabled={isSaving}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                                >
                                    {isSaving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'staff' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Personnel Database</h2>
                                <p className="text-slate-400 text-sm font-medium">Manage active employment records</p>
                            </div>
                            <div className="flex gap-3">
                                <button className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-colors flex items-center gap-2">
                                    <Upload size={16} /> Bulk Import
                                </button>
                                <button onClick={() => setIsAddingStaff(true)} className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2">
                                    <Plus size={16} /> Add Employee
                                </button>
                            </div>
                        </div>

                        {isAddingStaff && (
                            <div className="bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100 animate-in zoom-in-95">
                                <h3 className="text-lg font-black text-indigo-900 mb-6 uppercase tracking-tight">Onboard New Talent</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                    <input placeholder="First Name" className="p-4 rounded-xl border border-indigo-200" value={newStaff.firstName} onChange={e => setNewStaff({ ...newStaff, firstName: e.target.value })} />
                                    <input placeholder="Last Name" className="p-4 rounded-xl border border-indigo-200" value={newStaff.lastName} onChange={e => setNewStaff({ ...newStaff, lastName: e.target.value })} />
                                    <input placeholder="Email Address" className="p-4 rounded-xl border border-indigo-200" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} />
                                    <select className="p-4 rounded-xl border border-indigo-200" value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}>
                                        <option>Employee</option>
                                        <option>Manager</option>
                                        <option>Admin</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => setIsAddingStaff(false)} className="px-6 py-3 text-indigo-400 font-bold uppercase text-xs">Cancel</button>
                                    <button onClick={handleAddStaff} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs shadow-lg">Confirm Onboarding</button>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-400 font-black uppercase text-xs tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="p-6">Employee</th>
                                        <th className="p-6">Role</th>
                                        <th className="p-6">Email</th>
                                        <th className="p-6 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {employees.map(emp => (
                                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-6">
                                                <div className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</div>
                                                <div className="text-xs text-slate-400 font-mono scale-90 origin-left mt-1">ID: {emp.id.slice(-6)}</div>
                                            </td>
                                            <td className="p-6 text-sm font-medium text-slate-600">{emp.role}</td>
                                            <td className="p-6 text-sm text-slate-500">{emp.email}</td>
                                            <td className="p-6 text-right">
                                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">Active</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'access' && (
                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-indigo-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                            <Shield className="absolute -right-10 -bottom-10 text-indigo-800 opacity-50" size={200} />
                            <div className="relative z-10">
                                <h2 className="text-3xl font-black mb-2">Access Control</h2>
                                <p className="text-indigo-200 max-w-lg">Grant or revoke access to the Paradigm-Xi workspace. Users listed here can log in to your organization's environment.</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 text-center py-20">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Mail className="text-slate-300" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Invite New Users</h3>
                            <p className="text-slate-400 max-w-md mx-auto mb-8">Generate a unique onboarding link for new staff. They will click it to set up their account and password.</p>

                            <div className="max-w-md mx-auto space-y-4">
                                <div className="flex gap-2">
                                    <input
                                        placeholder="New User Email"
                                        className="flex-1 p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 focus:border-indigo-500 outline-none"
                                        id="invite-email"
                                    />
                                    <select className="p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 outline-none w-32" id="invite-role">
                                        <option value="Employee">Employee</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                <button
                                    onClick={() => {
                                        const email = (document.getElementById('invite-email') as HTMLInputElement).value;
                                        const role = (document.getElementById('invite-role') as HTMLSelectElement).value;
                                        if (!email) return alert("Please enter an email address");

                                        // Generate Link
                                        const inviteLink = `${window.location.origin}/#/welcome?invite=${btoa(email)}&role=${role}&org=${user?.companyId}`;
                                        navigator.clipboard.writeText(inviteLink);
                                        alert(`Invite Link Copied to Clipboard!\n\nSend this to the user:\n${inviteLink}`);
                                    }}
                                    className="w-full px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={18} /> Generate & Copy Link
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8">
                            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                <Users size={20} className="text-indigo-500" /> Active Users & Permissions
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-100">
                                        <tr>
                                            <th className="p-4">User</th>
                                            <th className="p-4">Assigned Role</th>
                                            <th className="p-4">Permissions Band</th>
                                            <th className="p-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {employees.map(user => (
                                            <tr key={user.id} className="hover:bg-indigo-50/10 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-900">{user.firstName} {user.lastName}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-1.5 rounded-full flex-1 max-w-[100px] ${['Admin', 'Manager'].includes(user.role) ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                                                        <span className="text-[10px] font-bold text-slate-400">
                                                            {['Admin', 'Manager'].includes(user.role) ? 'Elevated' : 'Standard'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button onClick={() => alert("Permission Editor Overlay would open here to granularly edit tags for " + user.firstName)} className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 hover:underline">
                                                        Edit Access
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};
