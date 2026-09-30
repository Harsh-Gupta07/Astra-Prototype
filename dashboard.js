const session = Auth.session();
if (!session) window.location.replace('auth.html?mode=signin');

const $ = (s) => document.querySelector(s);
const view = $('#view');
let data = Data.get();

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { el.hidden = true; }, 3200);
}

const panel = (id, title, body, { size = '', hint = '', extra = '', cls = '' } = {}) => `
  <section class="panel ${size} ${cls}" id="${id}">
    <div class="panel-head"><div><h2>${title}</h2>${hint ? `<p class="hint">${hint}</p>` : ''}</div>${extra}</div>
    ${body}
  </section>`;
const stat = (label, value, note) => `<div class="stat"><span>${label}</span><b>${value}</b>${note ? `<small>${note}</small>` : ''}</div>`;
const meter = (pct, warm) => `<div class="meter${warm ? ' warm' : ''}" role="img" aria-label="${pct}%"><i style="width:${pct}%"></i></div>`;
const statusPill = (s) => ({ open: '<span class="pill warm">Waiting for mentor</span>', queued: '<span class="pill muted">Saved offline · syncs later</span>', answered: '<span class="pill">Answered</span>' }[s] || `<span class="pill">${esc(s)}</span>`);

/* ---------------- Student ---------------- */
function studentView() {
  const mine = data.doubts.filter((d) => d.mine);
  const x = session.extra || {};
  return {
    nav: [['overview', 'Overview'], ['packs', 'Offline study packs'], ['doubts', 'My doubts'], ['sessions', 'Mentor sessions'], ['scholarships', 'Scholarships'], ['career', 'Career path'], ['girls', 'Support for girls']],
    html: `
      <div class="cards" id="overview">
        ${stat('Syllabus completed', '68%', '+6% this week')}
        ${stat('Study packs on phone', '3', '412 MB · works offline')}
        ${stat('Open doubts', mine.filter((d) => d.status !== 'answered').length, 'Mentor replies sync automatically')}
        ${stat('Learning streak', '6 days', 'Keep it going!')}
      </div>
      <div class="panels">
        ${panel('passport', 'Learning State Passport', `
          ${meter(68)}
          <div class="next"><b>Next best action</b><span>Revise <b>Quadratic Equations</b> — you got 3 of 5 wrong yesterday. 10-minute practice set is saved offline.</span></div>
          <div><button class="btn small primary" data-action="practice">Start practice</button></div>`,
          { size: 'third', cls: 'passport-card', hint: `${esc(x.grade || 'Class 10')} · ${esc(x.language || 'Hindi')} · ${esc(x.district || 'Your district')}` })}
        ${panel('progress', 'Progress by subject', ['Physics|74', 'Maths|58|w', 'Chemistry|66', 'Biology|81', 'Hindi|90'].map((r) => {
          const [name, pct, w] = r.split('|');
          return `<div class="subject"><div><span>${name}</span><b>${pct}%</b></div>${meter(+pct, w)}</div>`;
        }).join(''), { size: 'two-thirds', hint: 'Calculated on your phone — no internet needed' })}

        ${panel('packs', 'Offline study packs', `<ul class="list">
          ${[['Class 10 Science (Hindi)', '182 MB · downloaded 12 Sep', 'Up to date'], ['Class 10 Maths (Hindi)', '96 MB · downloaded 12 Sep', 'Update available'], ['Career Pathways starter', '44 MB · downloaded 2 Sep', 'Up to date']].map(([n, m, s]) => `
            <li><div class="meta"><b>${n}</b><span>${m}</span></div><div class="row-actions"><span class="pill ${s === 'Update available' ? 'warm' : ''}">${s}</span><button class="btn small" data-action="share" data-name="${n}">Share nearby</button></div></li>`).join('')}
          </ul>`, { hint: 'Share packs with classmates over Bluetooth or Wi-Fi Direct — no data pack needed' })}

        ${panel('saved', 'Saved answers', `<ul class="list">
          <li><div class="meta"><b>Newton’s third law</b><span>Local AI hub · Physics ch. 3 · saved offline</span></div><button class="btn small" data-action="open-answer">Open</button></li>
          <li><div class="meta"><b>Photosynthesis in simple words</b><span>Mentor Sunita O. · Biology · saved offline</span></div><button class="btn small" data-action="open-answer">Open</button></li>
          <li><div class="meta"><b>How to find HCF quickly</b><span>Local AI hub · Maths · saved offline</span></div><button class="btn small" data-action="open-answer">Open</button></li>
        </ul>`, { hint: 'Answers stay on your phone so you can revise without a signal' })}

        ${panel('doubts', 'My doubts', `
          <form class="ask" data-form="ask" novalidate>
            <div class="grid-2">
              <div class="field"><label for="ask-subject">Subject</label><select id="ask-subject" name="subject" required><option value="" disabled selected hidden>Select a subject</option><option>Maths</option><option>Physics</option><option>Chemistry</option><option>Biology</option><option>English</option><option>Career</option></select></div>
              <div class="field"><label for="ask-lang">Language</label><select id="ask-lang" name="language" required><option value="" disabled selected hidden>Select a language</option><option>Hindi</option><option>English</option><option>Odia</option><option>Santali</option><option>Kurukh</option></select></div>
            </div>
            <div class="field"><label for="ask-q">Your question</label><textarea id="ask-q" name="topic" placeholder="Type or record your doubt…" required></textarea></div>
            <div><button class="btn small primary" type="submit">Ask a mentor</button></div>
          </form>
          <ul class="list">${mine.map((d) => `<li><div class="meta"><b>${esc(d.topic)}</b><span>${esc(d.subject)} · ${esc(d.language)}${d.answer ? ` · “${esc(d.answer)}”` : ''}</span></div>${statusPill(d.status)}</li>`).join('') || '<li class="empty">No doubts yet.</li>'}</ul>`,
          { hint: 'Doubts asked offline are saved and sent when you next sync' })}

        ${panel('sessions', 'Mentor sessions', `<ul class="list">${data.sessions.filter((s) => s.kind !== 'Parent counselling').map((s) => `<li><div class="meta"><b>${s.kind}</b><span>${s.when} · ${s.mode}</span></div><span class="pill">Mentor: Sunita O.</span></li>`).join('')}</ul>`,
          { hint: 'Verified mentors who speak your language' })}

        ${panel('scholarships', 'Scholarships for you', `<ul class="list">
          <li><div class="meta"><b>Post-Matric Scholarship for ST Students</b><span>Eligible · deadline 31 Oct · 2 of 4 documents ready</span></div><button class="btn small" data-action="docs">Checklist</button></li>
          <li><div class="meta"><b>National Means-cum-Merit Scholarship</b><span>Exam on 15 Nov · practice pack available offline</span></div><button class="btn small" data-action="docs">Checklist</button></li>
          <li><div class="meta"><b>State Pre-Matric Scholarship</b><span>Application saved offline · submit when online</span></div><span class="pill muted">Draft</span></li>
        </ul>`, { hint: 'Verified and date-checked. Progress is saved offline.' })}

        ${panel('career', 'Career pathway', `
          <div class="subject"><div><span>Discover → <b>Prepare</b> → Connect → Move forward</span><b>Step 2 of 4</b></div>${meter(40, true)}</div>
          <p class="hint">Interests: Science, Helping people. Suggested paths: ANM/GNM nursing, Polytechnic (Electrical), B.Sc Agriculture.</p>
          <div><button class="btn small" data-action="counselling">Book career counselling</button></div>`)}

        ${panel('girls', 'Support for girls', `
          <p class="hint">Talk privately to a trained female mentor, join an education awareness session, or request counselling for your parents about continuing your studies.</p>
          <div class="row-actions">
            <button class="btn small teal" data-action="female-mentor">Talk to a female mentor</button>
            <button class="btn small" data-action="parent">Request parent counselling</button>
          </div>`)}
      </div>`,
  };
}

/* ---------------- Mentor ---------------- */
function mentorView() {
  const x = session.extra || {};
  const queue = data.doubts.filter((d) => d.status === 'open');
  const answered = data.doubts.filter((d) => d.status === 'answered').length;
  const pending = x.verified === false;
  return {
    nav: [['overview', 'Overview'], ['queue', 'Doubt queue'], ['sessions', 'Sessions'], ['girls', 'Girls’ awareness'], ['profile', 'Profile']],
    html: `
      ${pending ? '<div class="banner"><span><b>Verification pending.</b> An admin will review your documents before students are matched with you. You can explore the dashboard meanwhile.</span><span class="pill warm">Pending</span></div>' : ''}
      <div class="cards" id="overview">
        ${stat('Open doubts', queue.length, 'Matched to your subjects')}
        ${stat('Answered this week', 14 + answered, 'Avg. reply 3.1 h')}
        ${stat('Sessions this week', data.sessions.length, '1 career · 1 parent')}
        ${stat('Student rating', '4.8 / 5', '52 reviews')}
      </div>
      <div class="panels">
        ${panel('queue', 'Doubt queue', `<ul class="list">${queue.map((d) => `
          <li data-id="${d.id}"><div class="meta"><b>${esc(d.topic)}</b><span>${esc(d.student)} · ${esc(d.subject)} · ${esc(d.language)} · waiting ${esc(d.waiting)}</span></div>
            <div class="row-actions"><button class="btn small primary" data-action="answer" data-id="${d.id}">Answer</button></div>
            <form class="ask" data-form="answer" data-id="${d.id}" novalidate hidden>
              <div class="field"><label for="ans-${d.id}">Your answer (sent as text + saved offline for the student)</label><textarea id="ans-${d.id}" name="answer" placeholder="Explain step by step in simple language…" required></textarea></div>
              <div class="row-actions"><button class="btn small primary" type="submit">Send answer</button><button class="btn small" type="button" data-action="cancel">Cancel</button></div>
            </form></li>`).join('') || '<li class="empty">All caught up — no open doubts.</li>'}</ul>`,
          { size: 'two-thirds', hint: 'Answers reach students on their next sync, even in low connectivity' })}

        ${panel('availability', 'Availability', `
          <label class="subject"><div><span>Accepting new requests</span><input type="checkbox" data-action="availability" checked /></div></label>
          <p class="hint">Mon–Fri 5–7 pm · Sat 10 am–1 pm</p>
          <p class="hint">Languages: ${esc(x.languages || 'Hindi')}<br>Subjects: ${esc(x.subjects || 'Physics, Maths')}</p>`, { size: 'third' })}

        ${panel('sessions', 'Upcoming sessions', `<ul class="list">${data.sessions.map((s) => `
          <li><div class="meta"><b>${s.kind}</b><span>${s.who} · ${s.when} · ${s.mode}</span></div><button class="btn small" data-action="join">Details</button></li>`).join('')}</ul>`,
          { hint: 'Doubt resolution, career counselling and parent counselling' })}

        ${panel('girls', 'Girls’ education awareness', `<ul class="list">
          <li><div class="meta"><b>Awareness session: “Why Class 11 matters”</b><span>Koraput Ashram School · 28 girls registered · Fri 3 pm</span></div><span class="pill">Host</span></li>
          <li><div class="meta"><b>Parent counselling request — Kujur family</b><span>Daughter in Class 9 may stop school after Class 10</span></div><button class="btn small teal" data-action="accept-parent">Accept</button></li>
          <li><div class="meta"><b>Private chat request — Anita K.</b><span>Asked for a female mentor · Career guidance</span></div><button class="btn small teal" data-action="accept-parent">Accept</button></li>
        </ul>`, { hint: 'Dedicated support for girls, with trained female mentors' })}

        ${panel('profile', 'Your mentor profile', `
          <p><b>${esc(session.name)}</b> · ${esc(x.mentorType || 'Mentor')}</p>
          <p class="hint">Focus: ${esc(x.focus || 'Doubt resolution, Career counselling')} · ${pending ? 'Verification pending' : 'Verified mentor ✓'}</p>`, { size: 'wide' })}
      </div>`,
  };
}

/* ---------------- Admin ---------------- */
function adminView() {
  const pendingV = data.verifications.filter((v) => v.status === 'pending');
  const users = Auth.users();
  return {
    nav: [['overview', 'Overview'], ['verify', 'Mentor verification'], ['hubs', 'Hubs & sync'], ['packs', 'Content packs'], ['girls', 'Girls’ programme'], ['users', 'Accounts']],
    html: `
      <div class="cards" id="overview">
        ${stat('Active students', '4,812', '+312 this month')}
        ${stat('Verified mentors', 136 + data.verifications.filter((v) => v.status === 'approved').length, `${pendingV.length} awaiting review`)}
        ${stat('Learning hubs', data.hubs.length, '271 devices connected')}
        ${stat('Devices waiting to sync', '212', 'Mostly Dantewada hub')}
      </div>
      <div class="panels">
        ${panel('verify', 'Mentor verification', `<ul class="list">${data.verifications.map((v) => `
          <li><div class="meta"><b>${esc(v.name)}</b><span>${esc(v.type)} · ${esc(v.subjects)} · ${esc(v.docs)}</span></div>
            ${v.status === 'pending' ? `<div class="row-actions"><button class="btn small teal" data-action="approve" data-id="${v.id}">Approve</button><button class="btn small" data-action="reject" data-id="${v.id}">Reject</button></div>` : `<span class="pill ${v.status === 'rejected' ? 'warm' : ''}">${v.status === 'approved' ? 'Approved' : 'Rejected'}</span>`}</li>`).join('')}</ul>`,
          { hint: 'Safety first: only verified mentors are matched with students' })}

        ${panel('girls', 'Girls’ education programme', `
          <div class="subject"><div><span>Girls continuing to Class 11</span><b>72%</b></div>${meter(72)}</div>
          <div class="subject"><div><span>Parent counselling sessions completed (target 150)</span><b>118</b></div>${meter(79, true)}</div>
          <div class="subject"><div><span>Trained female mentors (target 60)</span><b>41</b></div>${meter(68)}</div>`,
          { hint: 'Awareness sessions and parent counselling this term' })}

        ${panel('hubs', 'Hubs & sync status', `<div class="table-wrap"><table>
          <thead><tr><th>Hub</th><th>District</th><th>Devices</th><th>Last sync</th><th>Status</th></tr></thead>
          <tbody>${data.hubs.map((h) => `<tr><td>${esc(h.name)}</td><td>${esc(h.district)}</td><td>${h.devices}</td><td>${esc(h.lastSync)}</td><td><span class="pill ${h.health === 'Healthy' ? '' : 'warm'}">${esc(h.health)}</span></td></tr>`).join('')}</tbody>
        </table></div>`, { size: 'wide', hint: 'Local AI hubs and content caches' })}

        ${panel('packs', 'Content packs', `<div class="table-wrap"><table>
          <thead><tr><th>Pack</th><th>Size</th><th>Version</th><th>Installs</th><th></th></tr></thead>
          <tbody>${data.packs.map((p) => `<tr><td>${esc(p.name)}</td><td>${p.size}</td><td>${p.version}</td><td>${p.installs.toLocaleString('en-IN')}</td><td>${p.status === 'Review' ? `<button class="btn small primary" data-action="publish" data-id="${p.id}">Publish</button>` : '<span class="pill">Published</span>'}</td></tr>`).join('')}</tbody>
        </table></div>`, { size: 'wide', hint: 'Downloaded once, used offline, shared device-to-device' })}

        ${panel('users', 'Accounts in this demo', `<div class="table-wrap"><table>
          <thead><tr><th>Name</th><th>Email / phone</th><th>Role</th></tr></thead>
          <tbody>${users.map((u) => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${ROLES[u.role].label}${u.role === 'mentor' && u.extra && u.extra.verified === false ? ' <span class="pill warm">Unverified</span>' : ''}</td></tr>`).join('')}</tbody>
        </table></div>`, { size: 'wide', hint: 'Stored only in this browser' })}
      </div>`,
  };
}

/* ---------------- Shell ---------------- */
function render() {
  const v = { student: studentView, mentor: mentorView, admin: adminView }[session.role]();
  view.innerHTML = v.html;
  $('#side-nav').innerHTML = v.nav.map(([id, label], i) => `<a href="#${id}"${i === 0 ? ' class="active"' : ''}>${label}</a>`).join('');
}

function renderChrome() {
  const first = session.role === 'admin' ? session.name : session.name.split(' ')[0];
  const hour = new Date().getHours();
  $('#greeting').textContent = `${hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'}, ${first}`;
  $('#role-label').textContent = `${ROLES[session.role].label} dashboard`;
  $('#who').innerHTML = `<b>${esc(session.name)}</b><span>${esc(session.email)}</span><span class="pill">${ROLES[session.role].label}</span>`;
  document.title = `ASTRA — ${ROLES[session.role].label} dashboard`;
}

function updateSync(lastSynced) {
  const el = $('#sync');
  const online = navigator.onLine;
  el.classList.toggle('offline', !online);
  el.textContent = online ? `Online · synced ${lastSynced || 'just now'}` : 'Offline · changes saved on this device';
}

view.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  const messages = {
    practice: 'Practice set opened from your offline pack.',
    share: `Ready to share “${btn.dataset.name}” with nearby phones over Bluetooth / Wi-Fi Direct.`,
    'open-answer': 'Opening saved answer — available offline.',
    docs: 'Checklist: Aadhaar ✓, caste certificate ✓, income certificate, bank passbook.',
    counselling: 'Career counselling requested. A mentor will confirm a time.',
    'female-mentor': 'Request sent privately to a trained female mentor.',
    parent: 'Parent counselling requested. A mentor will contact your family.',
    join: 'Session details sent by SMS as a reminder.',
    'accept-parent': 'Accepted. The family will be notified by SMS.',
  };
  if (messages[action]) return toast(messages[action]);
  if (action === 'answer') { const li = btn.closest('li'); li.querySelector('form').hidden = false; li.querySelector('textarea').focus(); btn.hidden = true; }
  if (action === 'cancel') { const li = btn.closest('li'); li.querySelector('form').hidden = true; li.querySelector('[data-action="answer"]').hidden = false; }
  if (action === 'approve' || action === 'reject') {
    const v = data.verifications.find((x) => x.id === id);
    v.status = action === 'approve' ? 'approved' : 'rejected';
    Data.save(data); render(); toast(`${v.name} ${v.status}.`);
  }
  if (action === 'publish') {
    const p = data.packs.find((x) => x.id === id);
    p.status = 'Published'; Data.save(data); render(); toast(`${p.name} published to all hubs.`);
  }
});

view.addEventListener('change', (event) => {
  if (event.target.dataset.action === 'availability') toast(event.target.checked ? 'You are accepting new requests.' : 'New requests paused.');
});

view.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.target;
  const values = Object.fromEntries(new FormData(form));
  if (form.dataset.form === 'answer' && !String(values.answer || '').trim()) return toast('Type an answer before sending.');
  if (form.dataset.form === 'ask') {
    if (!values.subject || !values.language || !values.topic.trim()) return toast('Choose a subject and language, then type your question.');
    const online = navigator.onLine;
    data.doubts.push({ id: `d${Date.now()}`, student: session.name, subject: values.subject, language: values.language, topic: values.topic.trim(), waiting: 'just now', status: online ? 'open' : 'queued', mine: true });
    Data.save(data); render();
    toast(online ? 'Doubt sent to a matching mentor.' : 'Saved offline — it will reach a mentor when you sync.');
  }
  if (form.dataset.form === 'answer') {
    const d = data.doubts.find((x) => x.id === form.dataset.id);
    d.status = 'answered'; d.answer = values.answer.trim();
    Data.save(data); render(); toast(`Answer sent to ${d.student.replace(/\.$/, '')}.`);
  }
});

$('#sync-now').addEventListener('click', () => {
  if (!navigator.onLine) return toast('No connection yet. Everything is saved on this device.');
  let moved = 0;
  for (const d of data.doubts) if (d.status === 'queued') { d.status = 'open'; d.waiting = 'just now'; moved++; }
  Data.save(data); render();
  updateSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  toast(moved ? `Synced. ${moved} saved doubt${moved > 1 ? 's' : ''} sent to mentors.` : 'Synced. Everything is up to date.');
});
$('#reset-demo').addEventListener('click', () => { data = Data.reset(); render(); toast('Demo data restored.'); });
$('#sign-out').addEventListener('click', () => { Auth.signOut(); window.location.href = 'index.html'; });

const side = $('#side');
const menu = document.querySelector('.menu-toggle');
menu.addEventListener('click', () => { const open = side.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
$('#side-nav').addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link) return;
  for (const a of document.querySelectorAll('#side-nav a')) a.classList.toggle('active', a === link);
  side.classList.remove('open'); menu.setAttribute('aria-expanded', 'false');
});

window.addEventListener('online', () => updateSync());
window.addEventListener('offline', () => updateSync());

if (session) { renderChrome(); render(); updateSync(); }
