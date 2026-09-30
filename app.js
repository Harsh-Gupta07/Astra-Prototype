// ASTRA demo store. Everything lives in this browser's localStorage — there is no server.
// Passwords are kept in plain text on purpose: this is a clickable prototype, not real auth.
const Store = (() => {
  const mem = {};
  const read = (key, fallback) => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch { return key in mem ? mem[key] : fallback; }
  };
  const write = (key, value) => {
    mem[key] = value;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked: keep in memory */ }
  };
  const remove = (key) => { delete mem[key]; try { localStorage.removeItem(key); } catch {} };
  return { read, write, remove };
})();

const ROLES = {
  student: { label: 'Student', blurb: 'Learn offline, ask doubts, track progress' },
  mentor: { label: 'Mentor', blurb: 'Resolve doubts, counsel careers and parents' },
  admin: { label: 'Admin', blurb: 'Manage hubs, content and mentor verification' },
};

const DEMO_USERS = [
  { name: 'Ravi Hansda', email: 'student@astra.demo', password: 'demo1234', role: 'student', extra: { grade: 'Class 10', district: 'Ranchi, Jharkhand', language: 'Hindi' } },
  { name: 'Sunita Oraon', email: 'mentor@astra.demo', password: 'demo1234', role: 'mentor', extra: { mentorType: 'Trained female mentor', subjects: 'Physics, Maths', languages: 'Hindi, Kurukh' } },
  { name: 'Hub Admin', email: 'admin@astra.demo', password: 'demo1234', role: 'admin', extra: { org: 'Gumla Community Learning Hub' } },
];

const Auth = {
  users() {
    const list = Store.read('astra.users', null);
    if (list) return list;
    Store.write('astra.users', DEMO_USERS);
    return DEMO_USERS;
  },
  find(email, role) {
    const id = email.trim().toLowerCase();
    return this.users().find((u) => u.email.toLowerCase() === id && (!role || u.role === role));
  },
  signUp(user) {
    const users = this.users();
    if (users.some((u) => u.email.toLowerCase() === user.email.trim().toLowerCase() && u.role === user.role)) {
      throw new Error(`An ${ROLES[user.role].label.toLowerCase()} account with this email or phone already exists. Sign in instead.`);
    }
    const saved = { ...user, email: user.email.trim() };
    Store.write('astra.users', [...users, saved]);
    this.start(saved);
    return saved;
  },
  signIn(email, password, role) {
    const user = this.find(email, role);
    if (!user || user.password !== password) throw new Error('That email/phone, password and role do not match. Try the demo accounts below.');
    this.start(user);
    return user;
  },
  start(user) { Store.write('astra.session', { email: user.email, role: user.role, name: user.name, extra: user.extra || {}, at: Date.now() }); },
  session() { return Store.read('astra.session', null); },
  signOut() { Store.remove('astra.session'); },
};

// Seed data for the dashboards. Persisted so actions (answering, approving) survive a reload.
function seedData() {
  return {
    doubts: [
      { id: 'd1', student: 'Ravi H.', subject: 'Physics', topic: 'Newton’s third law — why don’t forces cancel?', language: 'Hindi', waiting: '2h', status: 'open', mine: true },
      { id: 'd2', student: 'Salomi T.', subject: 'Maths', topic: 'Quadratic equations: discriminant sign', language: 'Kurukh', waiting: '5h', status: 'open' },
      { id: 'd3', student: 'Ramesh H.', subject: 'Chemistry', topic: 'Balancing redox equations', language: 'Hindi', waiting: '1d', status: 'open' },
      { id: 'd4', student: 'Ravi H.', subject: 'Maths', topic: 'Trigonometry identities (saved offline)', language: 'Hindi', waiting: 'pending sync', status: 'queued', mine: true },
    ],
    sessions: [
      { id: 's1', kind: 'Doubt resolution', who: 'Ravi H. · Physics', when: 'Today, 5:30 pm', mode: 'Voice call (low bandwidth)' },
      { id: 's2', kind: 'Career counselling', who: 'Anita K. · Class 12', when: 'Tomorrow, 11:00 am', mode: 'Community hub' },
      { id: 's3', kind: 'Parent counselling', who: 'Kujur family · daughter in Class 9', when: 'Sat, 4:00 pm', mode: 'Home visit with ASHA worker' },
    ],
    verifications: [
      { id: 'v1', name: 'Pradeep Gond', type: 'Alumni mentor', subjects: 'Maths, Career guidance', docs: 'ID + degree uploaded', status: 'pending' },
      { id: 'v2', name: 'Meena Soren', type: 'Trained female mentor', subjects: 'Biology, Girls’ awareness', docs: 'ID + training certificate', status: 'pending' },
      { id: 'v3', name: 'R. Tirkey', type: 'Guest faculty', subjects: 'Physics', docs: 'ID uploaded, degree missing', status: 'pending' },
    ],
    packs: [
      { id: 'p1', name: 'Class 10 Science (Hindi)', size: '182 MB', version: 'v3.2', installs: 1240, status: 'Published' },
      { id: 'p2', name: 'Class 10 Maths (Odia)', size: '96 MB', version: 'v2.0', installs: 610, status: 'Published' },
      { id: 'p3', name: 'Class 12 Career Pathways', size: '44 MB', version: 'v1.1', installs: 388, status: 'Review' },
      { id: 'p4', name: 'Girls’ Education Awareness (Santali audio)', size: '28 MB', version: 'v1.0', installs: 215, status: 'Published' },
    ],
    hubs: [
      { name: 'Gumla Community Hub', district: 'Gumla, JH', devices: 64, lastSync: '12 min ago', health: 'Healthy' },
      { name: 'Koraput Ashram School', district: 'Koraput, OD', devices: 118, lastSync: '3 h ago', health: 'Healthy' },
      { name: 'Dantewada Village Hub', district: 'Dantewada, CG', devices: 37, lastSync: '2 days ago', health: 'Needs sync' },
      { name: 'Nandurbar Local AI Hub', district: 'Nandurbar, MH', devices: 52, lastSync: '45 min ago', health: 'Healthy' },
    ],
  };
}
const Data = {
  get() { return Store.read('astra.data', null) || this.reset(); },
  save(d) { Store.write('astra.data', d); },
  reset() { const d = seedData(); Store.write('astra.data', d); return d; },
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
