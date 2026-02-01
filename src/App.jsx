import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Users, AlertCircle, RefreshCw, Calendar, History, LogOut, CheckCircle, XCircle } from 'lucide-react'

// --- COMPONENT 1: AUTH SCREEN ---
function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) alert(error.message)
      else alert('Account created! Logging you in...')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-100 relative">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-96 border border-zinc-200 z-10">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tighter mb-1">SmartMess</h1>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Team ODD10UT • Campus Dining</p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">University Email</label>
            <input
              className="w-full p-3 mt-1 border border-zinc-200 rounded-xl focus:ring-4 focus:ring-yellow-100 focus:border-yellow-400 outline-none bg-zinc-50 transition"
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Password</label>
            <input
              className="w-full p-3 mt-1 border border-zinc-200 rounded-xl focus:ring-4 focus:ring-yellow-100 focus:border-yellow-400 outline-none bg-zinc-50 transition"
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-zinc-900 py-3.5 rounded-xl font-black uppercase tracking-wider shadow-lg shadow-yellow-200 transform active:scale-95 transition-all"
            disabled={loading}
          >
            {loading ? 'Verifying...' : (isSignUp ? 'Create ID' : 'Sign In')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-zinc-500 hover:text-zinc-900 font-bold uppercase tracking-tight">
            {isSignUp ? 'Switch to Login' : 'Need an Account? Register'}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- COMPONENT 2: STUDENT DASHBOARD ---
function StudentDashboard({ session }) {
  const [leaves, setLeaves] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchHistory()
    const channel = supabase.channel('student-view').on('postgres_changes', { event: '*', schema: 'public', table: 'leaves' }, () => fetchHistory()).subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchHistory() {
    const { data } = await supabase.from('leaves').select('*').eq('student_id', session.user.id).order('created_at', { ascending: false })
    if (data) setLeaves(data)
  }

  async function applyLeave(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('leaves').insert([{ student_id: session.user.id, start_date: startDate, end_date: endDate, status: 'pending' }])
    if (!error) { setStartDate(''); setEndDate(''); alert('Request Sent!') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
        <div className="bg-zinc-900 text-white px-6 py-8 shadow-xl">
            <div className="max-w-md mx-auto flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-black text-yellow-400 uppercase tracking-tighter">Nithis Pandiyan</h1>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">CSE (IoT) • 24110332</p>
                </div>
                <button onClick={() => supabase.auth.signOut()} className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:text-red-400 transition">
                    <LogOut size={20} />
                </button>
            </div>
        </div>

      <div className="max-w-md mx-auto p-6 space-y-8">
        <div className="bg-white p-6 rounded-2xl shadow-xl shadow-zinc-200 border border-zinc-100">
            <h2 className="text-sm font-black text-zinc-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Calendar className="text-yellow-500" size={18}/> New Leave
            </h2>
            <form onSubmit={applyLeave} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-zinc-400 uppercase">Start</label>
                        <input type="date" required className="w-full mt-1 p-3 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-sm outline-none focus:border-yellow-500 transition"
                        value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-zinc-400 uppercase">End</label>
                        <input type="date" required className="w-full mt-1 p-3 bg-zinc-50 border border-zinc-200 rounded-xl font-bold text-sm outline-none focus:border-yellow-500 transition"
                        value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                </div>
                <button disabled={loading} className="w-full bg-yellow-400 text-zinc-900 py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-yellow-100 hover:bg-yellow-500 transition-all active:scale-95">
                    {loading ? 'Submitting...' : 'Apply Leave'}
                </button>
            </form>
        </div>

        <div>
            <h3 className="text-zinc-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Request Log</h3>
            <div className="space-y-3">
            {leaves.map((leave) => (
                <div key={leave.id} className="bg-white p-4 rounded-xl border border-zinc-100 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className={`w-2 h-10 rounded-full ${leave.status === 'approved' ? 'bg-yellow-400' : 'bg-zinc-200'}`}></div>
                        <div>
                            <p className="font-black text-zinc-800 text-sm tracking-tight">{leave.start_date} — {leave.end_date}</p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase">{leave.status}</p>
                        </div>
                    </div>
                </div>
            ))}
            </div>
        </div>
      </div>
    </div>
  )
}

// --- COMPONENT 3: ADMIN DASHBOARD ---
function AdminDashboard() {
  const [totalStudents] = useState(450)
  const [activeLeaves, setActiveLeaves] = useState(0)
  const [pendingRequests, setPendingRequests] = useState([])
  
  useEffect(() => {
    fetchStats(); fetchRequests()
    const channel = supabase.channel('admin-view').on('postgres_changes', { event: '*', schema: 'public', table: 'leaves' }, () => { fetchStats(); fetchRequests() }).subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchStats() {
    const today = new Date().toISOString().split('T')[0]
    const { count } = await supabase.from('leaves').select('*', { count: 'exact', head: true }).lte('start_date', today).gte('end_date', today).eq('status', 'approved')
    setActiveLeaves(count || 0)
  }

  async function fetchRequests() {
    const { data } = await supabase.from('leaves').select('*, profiles:student_id (email)').eq('status', 'pending').order('created_at', { ascending: true })
    if (data) setPendingRequests(data)
  }

  async function updateStatus(id, newStatus) {
    await supabase.from('leaves').update({ status: newStatus }).eq('id', id)
  }

  return (
    <div className="min-h-screen bg-zinc-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-black text-zinc-900 tracking-tighter italic">ADMIN<span className="text-yellow-500">.CORE</span></h1>
          <button onClick={() => supabase.auth.signOut()} className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-red-500 transition">Logout</button>
        </header>

        <div className="bg-zinc-900 text-white p-10 rounded-3xl shadow-2xl mb-12 flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-400 rounded-full blur-[100px] opacity-20"></div>
            <div>
               <h3 className="text-yellow-500 font-black uppercase text-[10px] tracking-[0.3em] mb-2">Expected Headcount</h3>
               <div className="flex items-baseline gap-4">
                 <span className="text-7xl font-black">{totalStudents - activeLeaves}</span>
                 <span className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Students</span>
               </div>
            </div>
            <div className="text-right">
                <p className="text-zinc-500 text-[10px] font-black uppercase mb-1">Active Absences</p>
                <p className="text-2xl font-black text-white">{activeLeaves}</p>
            </div>
        </div>

        <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] mb-6">Pending Approvals</h2>
        <div className="space-y-4">
            {pendingRequests.map((req) => (
              <div key={req.id} className="bg-white p-6 rounded-2xl border border-zinc-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center font-black text-zinc-400 uppercase tracking-tighter">
                        {req.profiles?.email?.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-black text-zinc-900 text-lg tracking-tight">{req.profiles?.email?.split('@')[0]}</h3>
                        <p className="text-xs text-zinc-400 font-bold">{req.start_date} to {req.end_date}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => updateStatus(req.id, 'rejected')} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-red-500 transition">Reject</button>
                  <button onClick={() => updateStatus(req.id, 'approved')} className="px-8 py-3 text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-zinc-900 rounded-xl hover:bg-yellow-500 shadow-lg shadow-yellow-100">Approve</button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

// --- MAIN APP COMPONENT ---
export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // UPDATED: Sets the Browser Tab Name
    document.title = "SmartMess";

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else { setRole(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchRole(userId) {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (data) setRole(data.role);
    setLoading(false);
  }

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-zinc-900">
        <div className="w-12 h-1 border-t-2 border-yellow-400 animate-pulse"></div>
        <p className="text-yellow-400 font-black tracking-[0.5em] text-[10px] uppercase mt-4">Syncing SmartMess</p>
    </div>
  )
  if (!session) return <Auth />
  return role === 'admin' ? <AdminDashboard /> : <StudentDashboard session={session} />
}