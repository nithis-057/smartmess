import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// --- 1. MAIN APP CONTROLLER ---
export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- CONFIG: ENSURE THIS MATCHES YOUR LOGIN EMAIL EXACTLY ---
  const ADMIN_EMAIL = 'nithispandiyan24110332@snuchennai.edu.in'; 

  useEffect(() => {
    // Check initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 font-black tracking-widest text-xs">
      INITIALIZING SMARTMESS...
    </div>
  );

  if (!session) return <AuthPage />;

  // Case-insensitive check to prevent login fails
  const isUserAdmin = session.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return isUserAdmin ? <AdminDashboard /> : <StudentLeavePage user={session.user} />;
}

// --- 2. AUTH PAGE ---
function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password }) 
      : await supabase.auth.signInWithPassword({ email, password });
    
    if (error) alert(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 p-4 font-sans">
      <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-2xl border border-zinc-200">
        <h1 className="text-4xl font-black text-zinc-900 tracking-tighter italic text-center mb-10 uppercase">Smart Mess</h1>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="email" placeholder="University Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-4 bg-zinc-50 border rounded-2xl outline-none" required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-4 bg-zinc-50 border rounded-2xl outline-none" required />
          <button className="w-full py-5 bg-zinc-900 text-white font-black rounded-2xl uppercase tracking-widest hover:bg-zinc-800 transition-all">
            {isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>
        <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-6 text-xs font-bold text-zinc-400 hover:text-zinc-900 underline">
          {isSignUp ? "Already have an account? Login" : "Need an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}

// --- 3. STUDENT PAGE ---
function StudentLeavePage({ user }) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const studentId = user.email.split('@')[0];
    const { error } = await supabase.from('leaves').insert([{ 
      student_id: studentId, 
      start_date: start, 
      end_date: end, 
      reason: reason, 
      status: 'pending' 
    }]);
    if (error) alert(error.message);
    else {
      setStatus("Submitted successfully!");
      setStart(''); setEnd(''); setReason('');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl border border-zinc-200">
        <div className="flex justify-between mb-8">
          <h1 className="text-2xl font-black italic">APPLY LEAVE</h1>
          <button onClick={() => supabase.auth.signOut()} className="text-[10px] font-black bg-zinc-100 px-4 py-2 rounded-full">LOGOUT</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full p-4 bg-zinc-50 border rounded-xl" required />
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full p-4 bg-zinc-50 border rounded-xl" required />
          </div>
          <textarea placeholder="Reason for leave" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-4 bg-zinc-50 border rounded-xl h-24" />
          <button className="w-full py-4 bg-zinc-900 text-white font-black rounded-xl uppercase shadow-lg hover:bg-zinc-800 transition-all">Submit Request</button>
        </form>
        {status && <p className="mt-4 text-center text-green-600 font-bold">{status}</p>}
      </div>
    </div>
  );
}

// --- 4. ADMIN DASHBOARD ---
function AdminDashboard() {
  const [pending, setPending] = useState([]);
  const [activeLeaves, setActiveLeaves] = useState(0);
  
  const TOTAL_STUDENTS = 500;
  const KG_SAVED_PER_STUDENT = 0.45;

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'leaves' }, fetchData).subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchData() {
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch pending requests
    const { data } = await supabase.from('leaves').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    if (data) setPending(data);

    // Fetch approved leaves for today
    const { count } = await supabase.from('leaves').select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .lte('start_date', today)
      .gte('end_date', today);
    setActiveLeaves(count || 0);
  }

  async function updateStatus(id, status) {
    await supabase.from('leaves').update({ status }).eq('id', id);
    fetchData();
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black italic tracking-tighter">WARDEN PANEL</h1>
          <button onClick={() => supabase.auth.signOut()} className="bg-zinc-900 text-white px-8 py-3 rounded-full font-black text-xs uppercase">LOGOUT</button>
        </header>

        {/* Smart Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Plates to Prepare</p>
            <h2 className="text-5xl font-black text-zinc-900 mt-2">{TOTAL_STUDENTS - activeLeaves}</h2>
          </div>
          <div className="bg-zinc-900 p-8 rounded-[2rem] shadow-2xl text-white">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Leaves Today</p>
            <h2 className="text-5xl font-black mt-2">{activeLeaves}</h2>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-zinc-200 shadow-sm">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Waste Saved Today</p>
            <h2 className="text-5xl font-black text-zinc-900 mt-2">{(activeLeaves * KG_SAVED_PER_STUDENT).toFixed(1)}kg</h2>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-zinc-200 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 text-[10px] font-black uppercase text-zinc-400 tracking-widest">
              <tr><th className="px-8 py-6">Student</th><th className="px-8 py-6">Date Range</th><th className="px-8 py-6 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {pending.map(req => (
                <tr key={req.id} className="hover:bg-zinc-50">
                  <td className="px-8 py-6 font-bold">{req.student_id}</td>
                  <td className="px-8 py-6 text-sm text-zinc-500">{req.start_date} → {req.end_date}</td>
                  <td className="px-8 py-6 text-right space-x-3">
                    <button onClick={() => updateStatus(req.id, 'approved')} className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-green-600 hover:text-white transition-all">APPROVE</button>
                    <button onClick={() => updateStatus(req.id, 'rejected')} className="bg-red-100 text-red-700 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-red-600 hover:text-white transition-all">REJECT</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pending.length === 0 && (
            <div className="p-20 text-center text-zinc-300 font-black uppercase tracking-widest">Queue Clear</div>
          )}
        </div>
      </div>
    </div>
  );
}