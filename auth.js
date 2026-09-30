const tabs = { signin: document.querySelector('#tab-signin'), signup: document.querySelector('#tab-signup') };
const forms = { signin: document.querySelector('#form-signin'), signup: document.querySelector('#form-signup') };
const title = document.querySelector('#auth-title');
const sub = document.querySelector('#auth-sub');
const role = () => document.querySelector('input[name="role"]:checked').value;
const goDashboard = () => { window.location.href = 'dashboard.html'; };

// Already signed in: offer the dashboard or switching accounts instead of redirecting.
const current = Auth.session();
if (current) {
  const note = document.createElement('div');
  note.className = 'signed-in';
  note.innerHTML = `<span>You're signed in as <b>${esc(current.name)}</b> (${ROLES[current.role].label}).</span>
    <div><a class="btn small primary" href="dashboard.html">Go to dashboard</a><button class="btn small" type="button">Sign out to switch</button></div>`;
  note.querySelector('button').addEventListener('click', () => { Auth.signOut(); note.remove(); });
  document.querySelector('.tabs').before(note);
}

function setMode(mode) {
  for (const key of Object.keys(tabs)) {
    tabs[key].setAttribute('aria-selected', String(key === mode));
    forms[key].hidden = key !== mode;
  }
  title.textContent = mode === 'signin' ? 'Welcome back' : 'Create your ASTRA account';
  updateCopy();
}

function updateCopy() {
  const mode = forms.signin.hidden ? 'signup' : 'signin';
  const label = ROLES[role()].label.toLowerCase();
  sub.textContent = mode === 'signin' ? `Sign in to your ${label} dashboard.` : `Sign up as ${/^[aeiou]/.test(label) ? 'an' : 'a'} ${label}. ${ROLES[role()].blurb}.`;
  for (const group of forms.signup.querySelectorAll('[data-role]')) group.hidden = group.dataset.role !== role();
}

function showError(form, message) {
  const el = form.querySelector('.error');
  el.textContent = message;
  el.hidden = !message;
}

tabs.signin.addEventListener('click', () => setMode('signin'));
tabs.signup.addEventListener('click', () => setMode('signup'));
for (const input of document.querySelectorAll('input[name="role"]')) input.addEventListener('change', updateCopy);

forms.signin.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(forms.signin);
  if (!data.get('id').trim() || !data.get('password')) return showError(forms.signin, 'Enter your email or phone and password.');
  try { Auth.signIn(data.get('id'), data.get('password'), role()); goDashboard(); }
  catch (error) { showError(forms.signin, error.message); }
});

forms.signup.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(forms.signup));
  const r = role();
  if (!data.name.trim() || !data.id.trim()) return showError(forms.signup, 'Enter your name and an email or phone number.');
  if (data.password.length < 6) return showError(forms.signup, 'Use a password of at least 6 characters.');
  const required = { student: [['grade', 'your class'], ['language', 'a preferred language']], mentor: [['mentorType', 'a mentor type'], ['focus', 'what else you can help with']], admin: [] }[r];
  const missing = required.find(([key]) => !data[key]);
  if (missing) return showError(forms.signup, `Please select ${missing[1]}.`);
  if (r === 'admin' && data.code.trim().toUpperCase() !== 'ASTRA-ADMIN') return showError(forms.signup, 'Admin sign-up needs an access code. For this demo, use ASTRA-ADMIN.');
  const fields = { student: ['grade', 'language', 'district', 'hub'], mentor: ['mentorType', 'subjects', 'languages', 'focus'], admin: ['org'] }[r];
  const extra = Object.fromEntries(fields.map((f) => [f, (data[f] || '').trim()]));
  if (r === 'mentor') extra.verified = false;
  try { Auth.signUp({ name: data.name.trim(), email: data.id, password: data.password, role: r, extra }); goDashboard(); }
  catch (error) { showError(forms.signup, error.message); }
});

for (const button of document.querySelectorAll('[data-demo]')) {
  button.addEventListener('click', () => {
    const user = Auth.users().find((u) => u.role === button.dataset.demo && u.email.endsWith('@astra.demo'));
    Auth.start(user);
    goDashboard();
  });
}

const params = new URLSearchParams(window.location.search);
const startRole = params.get('role');
if (startRole && ROLES[startRole]) document.querySelector(`input[name="role"][value="${startRole}"]`).checked = true;
setMode(params.get('mode') === 'signup' ? 'signup' : 'signin');
