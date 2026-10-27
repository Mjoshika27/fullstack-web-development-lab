import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, CalendarDays, Check, CheckCircle2, ChevronDown, Clock3,
  FileText, HeartPulse, LogOut, RefreshCw, ShieldCheck, Sparkles,
  UserRound, BriefcaseBusiness, XCircle, Info, Plus, LoaderCircle,
  ClipboardCheck, Users, MessageSquareText, CircleCheck, CircleX
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'leave-management-token';
const DAY_MS = 24 * 60 * 60 * 1000;

async function api(path, { token, ...options } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
  } catch {
    throw new Error(`Cannot reach the backend at ${API_BASE}. Start the backend and check the MongoDB service.`);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
  return data;
}

function dateInputValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function countDays(start, end) {
  if (!start || !end || end < start) return 0;
  const a = new Date(`${start}T00:00:00Z`).getTime();
  const b = new Date(`${end}T00:00:00Z`).getTime();
  return Math.round((b - a) / DAY_MS) + 1;
}

function prettyDate(value) {
  if (!value) return '—';
  const date = String(value).slice(0, 10);
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}

function initials(name = 'User') {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('');
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onClose, 4200);
    return () => clearTimeout(timer);
  }, [toast, onClose]);
  if (!toast) return null;
  return <div className={`toast toast-${toast.type || 'success'}`} role="status">
    {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
    <span>{toast.message}</span><button className="toast-close" onClick={onClose} aria-label="Dismiss message"><XCircle size={15} /></button>
  </div>;
}

function AuthScreen({ onAuthenticated, onToast }) {
  const [mode, setMode] = useState('employeeLogin');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', rollNumber: '', password: '', initialCasualLeave: 10, initialMedicalLeave: 10 });
  const isRegister = mode === 'register';
  const isManagerLogin = mode === 'managerLogin';
  const update = (key, value) => setForm(previous => ({ ...previous, [key]: value }));

  async function signInWith(payload, endpoint, successMessage) {
    setBusy(true);
    try {
      const result = await api(`/auth/${endpoint}`, { method: 'POST', body: JSON.stringify(payload) });
      localStorage.setItem(TOKEN_KEY, result.token);
      onAuthenticated(result.token, result.user);
      onToast({ message: successMessage(result.user) });
    } catch (error) {
      onToast({ type: 'error', message: error.message });
    } finally { setBusy(false); }
  }

  async function submit(event) {
    event.preventDefault();
    if (isRegister) {
      await signInWith({
        username: form.username,
        email: form.email,
        rollNumber: form.rollNumber,
        password: form.password,
        initialCasualLeave: Number(form.initialCasualLeave),
        initialMedicalLeave: Number(form.initialMedicalLeave)
      }, 'register', () => 'Your employee account has been created.');
      return;
    }
    await signInWith(
      { identifier: form.email, password: form.password },
      isManagerLogin ? 'manager-login' : 'login',
      user => isManagerLogin ? `Welcome, ${user.username}. Manager workspace opened.` : `Welcome back, ${user.username}!`
    );
  }

  async function demoLogin() {
    const manager = isManagerLogin;
    await signInWith(
      manager
        ? { identifier: 'manager@leaveease.com', password: 'manager12345' }
        : { identifier: 'kamali@demo.com', password: 'demo12345' },
      manager ? 'manager-login' : 'login',
      user => `Signed in as ${user.username}.`
    );
  }

  return <div className="auth-page">
    <div className="auth-topbar"><div className="brand"><span className="brand-icon"><CalendarDays size={22} /></span><span>Leave<span className="brand-blue">Ease</span><small>LEAVE MANAGEMENT SYSTEM</small></span></div><span className="secure-label"><ShieldCheck size={15} /> Simple · Secure · Organized</span></div>
    <main className="auth-layout">
      <section className="auth-story">
        <div className="story-pill"><Sparkles size={14} /> YOUR TIME MATTERS</div>
        <h1>Time off,<br /><span>made simple.</span></h1>
        <p>Keep your leave balances in view, submit a request in a few steps, and stay organized without the paperwork.</p>
        <div className="story-list">
          <div><span className="story-check"><Check size={15} /></span><span><strong>Know your balance</strong><small>Casual and medical leave at a glance.</small></span></div>
          <div><span className="story-check"><Check size={15} /></span><span><strong>Apply in minutes</strong><small>Choose dates and submit your request.</small></span></div>
          <div><span className="story-check"><Check size={15} /></span><span><strong>Manager review</strong><small>Track approval decisions in one place.</small></span></div>
        </div>
        <div className="story-decoration"><div className="decoration-ring ring-a" /><div className="decoration-ring ring-b" /><div className="floating-calendar"><CalendarDays size={30} /><span>Take a breath.<br />We've got the dates.</span><div className="calendar-dots"><i /><i /><i /><i /><i /><i /></div></div></div>
      </section>
      <section className="auth-card">
        <div className="auth-card-heading"><div className="auth-icon">{isManagerLogin ? <ShieldCheck size={22} /> : <UserRound size={22} />}</div><div><h2>{isRegister ? 'Create employee account' : isManagerLogin ? 'Manager sign in' : 'Employee sign in'}</h2><p>{isRegister ? 'Set up your details to get started.' : isManagerLogin ? 'Sign in to review and decide on leave requests.' : 'Sign in to apply for leave and track its status.'}</p></div></div>
        <div className="auth-tabs auth-tabs-three">
          <button type="button" className={mode === 'employeeLogin' ? 'active' : ''} onClick={() => setMode('employeeLogin')}>Employee</button>
          <button type="button" className={mode === 'managerLogin' ? 'active' : ''} onClick={() => setMode('managerLogin')}>Manager</button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create user</button>
        </div>
        <form onSubmit={submit} className="auth-form">
          {isRegister && <>
            <label>Username<input required value={form.username} onChange={e => update('username', e.target.value)} placeholder="e.g. Kamali" minLength="2" maxLength="50" /></label>
            <label>Roll number<input required value={form.rollNumber} onChange={e => update('rollNumber', e.target.value)} placeholder="e.g. IT2026-01" /></label>
          </>}
          <label>Email address<input required type="email" autoComplete="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder={isManagerLogin ? 'manager@company.com' : 'you@example.com'} /></label>
          <label>Password<input required type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength="6" value={form.password} onChange={e => update('password', e.target.value)} placeholder={isRegister ? 'At least 6 characters' : 'Enter your password'} /></label>
          {isRegister && <div className="initial-balance-fields"><div className="field-section-label">Initial leave balance <span>days</span></div><label>Casual Leave<input type="number" min="0" max="60" step="1" required value={form.initialCasualLeave} onChange={e => update('initialCasualLeave', e.target.value)} /></label><label>Medical Leave<input type="number" min="0" max="60" step="1" required value={form.initialMedicalLeave} onChange={e => update('initialMedicalLeave', e.target.value)} /></label></div>}
          <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : null}{isRegister ? 'Create employee account' : isManagerLogin ? 'Sign in as manager' : 'Sign in as employee'} <ArrowRight size={17} /></button>
        </form>
        {!isRegister && <><div className="auth-divider"><span>OR USE DEMO ACCOUNT</span></div><button type="button" className="button button-demo" onClick={demoLogin} disabled={busy}>{isManagerLogin ? 'Continue with demo manager' : 'Continue with demo employee'} <ArrowRight size={16} /></button><p className="demo-credentials">{isManagerLogin ? <>Demo manager: <strong>manager@leaveease.com</strong> · <strong>manager12345</strong></> : <>Demo employee: <strong>kamali@demo.com</strong> · <strong>demo12345</strong></>}</p></>}
        <p className="auth-footnote"><ShieldCheck size={14} /> Manager permissions are checked by the server.</p>
      </section>
    </main>
    <footer className="auth-footer">LEAVE MANAGEMENT SYSTEM <span>•</span> PLAN YOUR TIME WITH CONFIDENCE</footer>
  </div>;
}

function BalanceCard({ type, amount, onClick }) {
  const casual = type === 'casual';
  return <button className={`balance-card ${casual ? 'balance-casual' : 'balance-medical'}`} onClick={onClick} type="button">
    <span className="balance-icon">{casual ? <BriefcaseBusiness size={21} /> : <HeartPulse size={21} />}</span>
    <span className="balance-copy"><small>AVAILABLE BALANCE</small><strong>{amount}<em>days</em></strong><span>{casual ? 'Casual Leave' : 'Medical Leave'}</span></span>
    <span className="balance-arrow"><ArrowRight size={17} /></span>
  </button>;
}

function StatusChip({ status }) {
  const safeStatus = status || 'Pending';
  return <span className={`status-chip status-${safeStatus.toLowerCase()}`}>{safeStatus}</span>;
}

function LeaveCard({ request, onCancel, busyId }) {
  const canCancel = ['Pending', 'Approved'].includes(request.status);
  return <article className={`leave-item ${request.status === 'Cancelled' ? 'leave-cancelled' : ''}`}>
    <div className={`leave-item-icon ${request.leaveType === 'Medical Leave' ? 'medical' : 'casual'}`}>{request.leaveType === 'Medical Leave' ? <HeartPulse size={19} /> : <BriefcaseBusiness size={19} />}</div>
    <div className="leave-item-main"><div className="leave-item-title-row"><strong>{request.leaveType}</strong><StatusChip status={request.status} /></div><p><CalendarDays size={13} /> {prettyDate(request.startDate)} – {prettyDate(request.endDate)}</p>{request.reason ? <small>{request.reason}</small> : null}{request.managerRemarks ? <small className="manager-note-inline">Manager note: {request.managerRemarks}</small> : null}</div>
    <div className="leave-item-days"><strong>{request.totalDays}</strong><span>{request.totalDays === 1 ? 'day' : 'days'}</span></div>
    {canCancel && <button type="button" className="cancel-request" onClick={() => onCancel(request)} disabled={busyId === request.id} title="Cancel application">{busyId === request.id ? <LoaderCircle size={15} className="spin" /> : <XCircle size={16} />}<span>{request.status === 'Approved' ? 'Withdraw' : 'Cancel'}</span></button>}
  </article>;
}

function Dashboard({ token, user, onLogout, onToast, onUserUpdate }) {
  const [view, setView] = useState('overview');
  const [data, setData] = useState({ balance: { casual: user.casualLeaveBalance ?? 10, medical: user.medicalLeaveBalance ?? 10 }, requests: [] });
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [form, setForm] = useState({ leaveType: 'Casual Leave', startDate: dateInputValue(), endDate: dateInputValue(), reason: '' });
  const days = useMemo(() => countDays(form.startDate, form.endDate), [form.startDate, form.endDate]);

  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      const [result, current] = await Promise.all([api('/leaves', { token }), api('/auth/me', { token })]);
      setData(result);
      onUserUpdate(current.user);
    } catch (error) {
      onToast({ type: 'error', message: error.message });
      if (/session has expired|sign in to continue|account not found/i.test(error.message)) onLogout();
    } finally { setRefreshing(false); }
  }, [token, onToast, onLogout, onUserUpdate]);

  useEffect(() => { loadData(true); }, [loadData]);

  async function submitLeave(event) {
    event.preventDefault();
    if (!days) return onToast({ type: 'error', message: 'Please choose a valid date range.' });
    setSubmitting(true);
    try {
      const result = await api('/leaves', { token, method: 'POST', body: JSON.stringify(form) });
      setData({ balance: result.balance, requests: result.requests });
      onUserUpdate({ ...user, casualLeaveBalance: user.casualLeaveBalance, medicalLeaveBalance: user.medicalLeaveBalance });
      setForm({ leaveType: 'Casual Leave', startDate: dateInputValue(), endDate: dateInputValue(), reason: '' });
      onToast({ message: result.message || 'Leave application submitted and is pending review.' });
      setView('history');
    } catch (error) { onToast({ type: 'error', message: error.message }); }
    finally { setSubmitting(false); }
  }

  async function cancelRequest(request) {
    const confirmation = request.status === 'Approved'
      ? `Withdraw this approved leave and restore ${request.totalDays} day(s) to your balance?`
      : 'Cancel this pending leave application?';
    if (!window.confirm(confirmation)) return;
    setBusyId(request.id);
    try {
      const result = await api(`/leaves/${request.id}`, { token, method: 'DELETE' });
      setData({ balance: result.balance, requests: result.requests });
      onToast({ message: result.message });
    } catch (error) { onToast({ type: 'error', message: error.message }); }
    finally { setBusyId(''); }
  }

  const activeRequests = data.requests.filter(item => ['Pending', 'Approved'].includes(item.status));
  const upcomingRequests = activeRequests.filter(item => item.endDate >= dateInputValue()).slice(0, 3);
  const balanceForSelectedType = form.leaveType === 'Casual Leave' ? data.balance.casual : data.balance.medical;

  return <div className="dashboard-page">
    <header className="app-header"><div className="header-inner"><button className="brand brand-button" onClick={() => setView('overview')}><span className="brand-icon"><CalendarDays size={22} /></span><span>Leave<span className="brand-blue">Ease</span><small>LEAVE MANAGEMENT SYSTEM</small></span></button><nav className="main-nav"><button className={view === 'overview' ? 'nav-active' : ''} onClick={() => setView('overview')}>Dashboard</button><button className={view === 'history' ? 'nav-active' : ''} onClick={() => setView('history')}>My applications <span className="nav-count">{data.requests.length}</span></button></nav><div className="header-user"><span className="header-avatar">{initials(user.username)}</span><span className="header-user-copy"><strong>{user.username}</strong><small>{user.rollNumber}</small></span><button className="icon-button logout-button" onClick={onLogout} title="Log out" aria-label="Log out"><LogOut size={18} /></button></div><button className="mobile-logout" onClick={onLogout} aria-label="Log out"><LogOut size={18} /></button></div></header>
    <main className="dashboard-content">
      <div className="breadcrumb"><span>Employee workspace</span><span>/</span><strong>{view === 'overview' ? 'Dashboard' : 'My applications'}</strong></div>
      {view === 'overview' ? <>
        <section className="welcome-row"><div><div className="eyebrow"><Sparkles size={13} /> YOUR LEAVE, AT A GLANCE</div><h1>Welcome, {user.username}<span className="title-period">.</span></h1><p>Apply for leave and follow every request through manager review.</p></div><button className="button button-outline refresh-button" type="button" onClick={() => loadData()} disabled={refreshing}>{refreshing ? <LoaderCircle size={16} className="spin" /> : <RefreshCw size={16} />} Refresh balances</button></section>
        <section className="balance-grid"><BalanceCard type="casual" amount={data.balance.casual} onClick={() => { setForm(f => ({ ...f, leaveType: 'Casual Leave' })); document.getElementById('apply-leave')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} /><BalanceCard type="medical" amount={data.balance.medical} onClick={() => { setForm(f => ({ ...f, leaveType: 'Medical Leave' })); document.getElementById('apply-leave')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} /><div className="balance-note"><span className="note-icon"><Info size={17} /></span><span><strong>Keep your balance in mind</strong><small>Pending requests reserve days; leave is deducted when a manager approves.</small></span></div></section>
        <div className="dashboard-columns"><section className="panel apply-panel" id="apply-leave"><div className="panel-heading"><div><span className="panel-icon blue"><Plus size={18} /></span><div><h2>Apply for leave</h2><p>Complete the details and send your request to the manager.</p></div></div><span className="required-note">* Required fields</span></div>
          <form className="leave-form" onSubmit={submitLeave}>
            <label className="form-field full-field"><span>Leave type <b>*</b></span><div className="select-wrap"><select required value={form.leaveType} onChange={e => setForm(f => ({ ...f, leaveType: e.target.value }))}><option>Casual Leave</option><option>Medical Leave</option></select><ChevronDown size={17} /></div><small className="field-help">Available after pending requests: <strong>{balanceForSelectedType} day(s)</strong></small></label>
            <label className="form-field"><span>From date <b>*</b></span><div className="date-input"><CalendarDays size={16} /><input required type="date" min={dateInputValue()} value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value, endDate: f.endDate && f.endDate < e.target.value ? e.target.value : f.endDate }))} /></div></label>
            <label className="form-field"><span>To date <b>*</b></span><div className="date-input"><CalendarDays size={16} /><input required type="date" min={form.startDate || dateInputValue()} value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div></label>
            <div className="duration-summary"><span className="duration-icon"><Clock3 size={17} /></span><span><small>Selected period</small><strong>{days ? `${days} ${days === 1 ? 'day' : 'days'}` : 'Choose valid dates'}</strong></span><span className="duration-note">Inclusive calendar days</span></div>
            <label className="form-field full-field"><span>Reason <small>(optional)</small></span><textarea rows="3" maxLength="500" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Add a brief note for the manager…" /><small className="character-count">{form.reason.length}/500</small></label>
            <div className="form-footer"><p><ShieldCheck size={15} /> Your request will remain pending until the manager reviews it.</p><button className="button button-primary apply-button" type="submit" disabled={submitting || !days}>{submitting ? <LoaderCircle size={17} className="spin" /> : <CalendarDays size={17} />} Submit request <ArrowRight size={16} /></button></div>
          </form>
        </section>
        <aside className="dashboard-side"><section className="panel mini-profile"><div className="profile-banner" /><div className="profile-details"><div className="profile-large-avatar">{initials(user.username)}</div><h3>{user.username}</h3><p>{user.email}</p><span className="profile-roll">Roll No. {user.rollNumber}</span></div><div className="profile-stats"><div><strong>{data.requests.length}</strong><span>Total applications</span></div><div><strong>{activeRequests.length}</strong><span>Active requests</span></div></div><div className="profile-tip"><Sparkles size={16} /><span>Keep track of pending, approved and rejected requests.</span></div></section>
          <section className="panel upcoming-panel"><div className="small-panel-heading"><div><h3>Upcoming leave</h3><p>Your next active requests</p></div><button onClick={() => setView('history')} aria-label="View all applications">View all <ArrowRight size={14} /></button></div>{upcomingRequests.length ? <div className="upcoming-list">{upcomingRequests.map(item => <div className="upcoming-item" key={item.id}><span className={`upcoming-dot ${item.leaveType === 'Medical Leave' ? 'dot-medical' : ''}`} /><div><strong>{item.leaveType}</strong><small>{prettyDate(item.startDate)} – {prettyDate(item.endDate)}</small><small><StatusChip status={item.status} /></small></div><b>{item.totalDays}d</b></div>)}</div> : <div className="empty-mini"><CalendarDays size={22} /><span>No upcoming applications</span><small>Your new requests will appear here.</small></div>}</section></aside></div>
      </> : <section className="panel history-panel"><div className="panel-heading"><div><span className="panel-icon blue"><FileText size={18} /></span><div><h2>My leave applications</h2><p>Review status and manager remarks for your leave requests.</p></div></div><button className="button button-outline" onClick={() => setView('overview')}><Plus size={16} /> New application</button></div>{data.requests.length ? <div className="leave-list">{data.requests.map(item => <LeaveCard key={item.id} request={item} onCancel={cancelRequest} busyId={busyId} />)}</div> : <div className="empty-state"><div className="empty-state-icon"><FileText size={26} /></div><h3>No applications yet</h3><p>Your submitted leave applications will appear here.</p><button className="button button-primary" onClick={() => setView('overview')}>Apply for leave <ArrowRight size={16} /></button></div>}</section>}
      <footer className="dashboard-footer"><span>LeaveEase <span className="footer-dot">•</span> Leave Management System</span><span>Made to keep things simple</span></footer>
    </main>
  </div>;
}

function ManagerDashboard({ token, user, onLogout, onToast }) {
  const [filter, setFilter] = useState('Pending');
  const [data, setData] = useState({ counts: { all: 0, Pending: 0, Approved: 0, Rejected: 0, Cancelled: 0 }, requests: [] });
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [remarks, setRemarks] = useState({});

  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      const result = await api(`/leaves/manager/requests?status=${encodeURIComponent(filter)}`, { token });
      setData(result);
    } catch (error) {
      onToast({ type: 'error', message: error.message });
      if (/session has expired|sign in to continue|account not found/i.test(error.message)) onLogout();
    } finally { setRefreshing(false); }
  }, [token, filter, onToast, onLogout]);

  useEffect(() => { loadData(true); }, [loadData]);

  async function decide(request, decision) {
    const label = decision === 'Approved' ? 'approve' : 'reject';
    if (!window.confirm(`${label[0].toUpperCase()}${label.slice(1)} ${request.employee?.username || 'this employee'}'s ${request.leaveType.toLowerCase()} request for ${request.totalDays} day(s)?`)) return;
    setBusyId(request.id);
    try {
      const result = await api(`/leaves/manager/requests/${request.id}/decision`, {
        token,
        method: 'PATCH',
        body: JSON.stringify({ decision, remarks: remarks[request.id] || '' })
      });
      onToast({ message: result.message });
      setRemarks(current => { const next = { ...current }; delete next[request.id]; return next; });
      await loadData(true);
    } catch (error) { onToast({ type: 'error', message: error.message }); }
    finally { setBusyId(''); }
  }

  const filters = ['Pending', 'All', 'Approved', 'Rejected', 'Cancelled'];
  return <div className="dashboard-page manager-page">
    <header className="app-header"><div className="header-inner"><div className="brand"><span className="brand-icon manager-brand-icon"><ShieldCheck size={22} /></span><span>Leave<span className="brand-blue">Ease</span><small>MANAGER WORKSPACE</small></span></div><nav className="main-nav"><button className="nav-active" type="button">Leave requests</button></nav><div className="header-user"><span className="header-avatar manager-avatar">{initials(user.username)}</span><span className="header-user-copy"><strong>{user.username}</strong><small>Manager</small></span><button className="icon-button logout-button" onClick={onLogout} title="Log out" aria-label="Log out"><LogOut size={18} /></button></div><button className="mobile-logout" onClick={onLogout} aria-label="Log out"><LogOut size={18} /></button></div></header>
    <main className="dashboard-content manager-content">
      <div className="breadcrumb"><span>Manager workspace</span><span>/</span><strong>Leave approvals</strong></div>
      <section className="welcome-row"><div><div className="eyebrow manager-eyebrow"><ShieldCheck size={13} /> REVIEW & DECIDE</div><h1>Leave approvals<span className="title-period">.</span></h1><p>Review employee requests and approve or reject pending leave.</p></div><button className="button button-outline refresh-button" type="button" onClick={() => loadData()} disabled={refreshing}>{refreshing ? <LoaderCircle size={16} className="spin" /> : <RefreshCw size={16} />} Refresh requests</button></section>
      <section className="manager-summary-grid">
        <div className="manager-summary-card summary-total"><span className="manager-summary-icon"><Users size={19} /></span><div><small>TOTAL REQUESTS</small><strong>{data.counts.all}</strong><span>All employee applications</span></div></div>
        <div className="manager-summary-card summary-pending"><span className="manager-summary-icon"><Clock3 size={19} /></span><div><small>PENDING REVIEW</small><strong>{data.counts.Pending}</strong><span>Awaiting a decision</span></div></div>
        <div className="manager-summary-card summary-approved"><span className="manager-summary-icon"><CircleCheck size={19} /></span><div><small>APPROVED</small><strong>{data.counts.Approved}</strong><span>Accepted requests</span></div></div>
        <div className="manager-summary-card summary-rejected"><span className="manager-summary-icon"><CircleX size={19} /></span><div><small>REJECTED</small><strong>{data.counts.Rejected}</strong><span>Declined requests</span></div></div>
      </section>
      <section className="panel manager-requests-panel">
        <div className="panel-heading"><div><span className="panel-icon manager-panel-icon"><ClipboardCheck size={18} /></span><div><h2>Employee applications</h2><p>Review each request before making a decision.</p></div></div><span className="required-note">{data.requests.length} shown</span></div>
        <div className="manager-filter-row">{filters.map(item => <button type="button" key={item} className={`manager-filter-button ${filter === item ? 'selected' : ''}`} onClick={() => setFilter(item)}>{item}<span>{item === 'All' ? data.counts.all : data.counts[item]}</span></button>)}</div>
        {refreshing && !data.requests.length ? <div className="empty-state"><LoaderCircle className="spin" size={24} /><p>Loading leave requests…</p></div> : data.requests.length ? <div className="manager-request-list">{data.requests.map(request => <article className="manager-request-card" key={request.id}>
          <div className="manager-request-top"><div className="manager-employee-avatar">{initials(request.employee?.username || 'Employee')}</div><div className="manager-employee-copy"><strong>{request.employee?.username || 'Unknown employee'}</strong><span>{request.employee?.email || 'Employee account unavailable'} · {request.employee?.rollNumber || 'No roll number'}</span></div><StatusChip status={request.status} /></div>
          <div className="manager-request-main"><div className="manager-leave-type"><span className={`leave-item-icon ${request.leaveType === 'Medical Leave' ? 'medical' : 'casual'}`}>{request.leaveType === 'Medical Leave' ? <HeartPulse size={18} /> : <BriefcaseBusiness size={18} />}</span><div><strong>{request.leaveType}</strong><span><CalendarDays size={13} /> {prettyDate(request.startDate)} – {prettyDate(request.endDate)}</span></div></div><div className="manager-days"><strong>{request.totalDays}</strong><span>{request.totalDays === 1 ? 'day requested' : 'days requested'}</span></div></div>
          {request.reason ? <div className="manager-reason"><span>Employee reason</span><p>{request.reason}</p></div> : <div className="manager-reason manager-reason-muted"><span>Employee reason</span><p>No reason added.</p></div>}
          {request.managerRemarks ? <div className="manager-previous-note"><MessageSquareText size={14} /> Previous manager note: {request.managerRemarks}</div> : null}
          {request.status === 'Pending' ? <div className="manager-decision-area"><label className="manager-remarks-label">Decision note <span>(optional)</span><textarea rows="2" maxLength="500" value={remarks[request.id] || ''} onChange={event => setRemarks(current => ({ ...current, [request.id]: event.target.value }))} placeholder="Add a note for the employee…" /></label><div className="manager-action-buttons"><button className="button manager-reject-button" type="button" disabled={busyId === request.id} onClick={() => decide(request, 'Rejected')}>{busyId === request.id ? <LoaderCircle size={15} className="spin" /> : <XCircle size={15} />} Reject</button><button className="button manager-approve-button" type="button" disabled={busyId === request.id} onClick={() => decide(request, 'Approved')}>{busyId === request.id ? <LoaderCircle size={15} className="spin" /> : <CheckCircle2 size={15} />} Approve leave</button></div></div> : <div className="manager-reviewed-line"><CheckCircle2 size={14} /> {request.status === 'Approved' ? 'Approved' : request.status === 'Rejected' ? 'Rejected' : 'Cancelled'}{request.reviewedAt ? ` on ${prettyDate(String(request.reviewedAt).slice(0, 10))}` : ''}</div>}
        </article>)}</div> : <div className="empty-state"><div className="empty-state-icon"><ClipboardCheck size={26} /></div><h3>No {filter === 'All' ? '' : `${filter.toLowerCase()} `}applications found</h3><p>Requests matching this filter will appear here.</p></div>}
      </section>
      <footer className="dashboard-footer"><span>LeaveEase <span className="footer-dot">•</span> Manager workspace</span><span>Review decisions are recorded for each request.</span></footer>
    </main>
  </div>;
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));
  const [toast, setToast] = useState(null);
  const showToast = useCallback(value => setToast(value), []);
  const hideToast = useCallback(() => setToast(null), []);
  const handleAuthenticated = useCallback((newToken, nextUser) => { setToken(newToken); setUser(nextUser); setBooting(false); }, []);
  const handleUserUpdate = useCallback(nextUser => setUser(nextUser), []);
  const logout = useCallback(() => { localStorage.removeItem(TOKEN_KEY); setToken(''); setUser(null); setBooting(false); }, []);

  useEffect(() => {
    let cancelled = false;
    const existingToken = localStorage.getItem(TOKEN_KEY);
    if (!existingToken) { setBooting(false); return undefined; }
    (async () => {
      try {
        const result = await api('/auth/me', { token: existingToken });
        if (!cancelled) { setToken(existingToken); setUser(result.user); }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        if (!cancelled) { setToken(''); setUser(null); }
      } finally { if (!cancelled) setBooting(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  if (booting) return <div className="loading-screen"><div className="loading-mark"><CalendarDays size={25} /></div><LoaderCircle size={22} className="spin" /><span>Opening your workspace…</span></div>;

  return <>
    {token && user ? (user.role === 'manager'
      ? <ManagerDashboard key={user.id || user._id || user.email} token={token} user={user} onLogout={logout} onToast={showToast} />
      : <Dashboard key={user.id || user._id || user.email} token={token} user={user} onLogout={logout} onToast={showToast} onUserUpdate={handleUserUpdate} />)
      : <AuthScreen onAuthenticated={handleAuthenticated} onToast={showToast} />}
    <Toast toast={toast} onClose={hideToast} />
  </>;
}
