/* ── Tooltip ────────────────────────────────── */
const tip = document.getElementById('tip');
const tipN = document.getElementById('tip-n');
const tipD = document.getElementById('tip-d');

function showTip(e, count, date) {
  tipN.textContent = count === 0 ? 'No' : count;
  tipD.textContent = `contribution${count !== 1 ? 's' : ''} on ${date}`;
  tip.classList.add('on');
  moveTip(e);
}
function moveTip(e) {
  const x = e.clientX + 14, y = e.clientY - 38;
  tip.style.left = Math.min(x, innerWidth - tip.offsetWidth - 8) + 'px';
  tip.style.top  = Math.max(y, 8) + 'px';
}
document.addEventListener('mousemove', moveTip);

/* ── Level mapping ──────────────────────────── */
function getLevel(count, max) {
  if (!count) return 0;
  if (max === 0) return 0;
  const r = count / max;
  if (r < .1)  return 1;
  if (r < .3)  return 2;
  if (r < .6)  return 3;
  if (r < .85) return 4;
  return 5;
}

/* ── Build graph DOM ─────────────────────────
   days: [{date:'YYYY-MM-DD', count:N}] sorted ascending
   Strategy: build a week-column layout.
   Month labels are positioned absolutely by measuring column offsets.
──────────────────────────────────────────── */
function buildGraph(days) {
  const CELL = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell')) || 12;
  const GAP  = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gap'))  || 3;
  const COL_W = CELL + GAP;

  const max = Math.max(...days.map(d => d.count));

  // Group into week columns (0=Sun … 6=Sat)
  const weeks = [];
  let week = new Array(7).fill(null);
  let firstWeek = true;

  days.forEach(d => {
    const dow = new Date(d.date + 'T12:00:00').getDay();
    if (!firstWeek && dow === 0) { weeks.push(week); week = new Array(7).fill(null); }
    week[dow] = d;
    firstWeek = false;
  });
  if (week.some(c => c)) weeks.push(week);

  // ── Month label positions ──
  // For each week column, find the first valid day and track month changes.
  // A month label is placed at the week column where that month first appears.
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthMarkers = []; // {colIndex, name}
  let lastMonth = -1;
  weeks.forEach((w, wi) => {
    const first = w.find(c => c);
    if (!first) return;
    const m = new Date(first.date + 'T12:00:00').getMonth();
    if (m !== lastMonth) {
      monthMarkers.push({ col: wi, name: MONTHS[m] });
      lastMonth = m;
    }
  });

  // ── Root container ──
  const section = document.getElementById('graphSection');
  section.innerHTML = '';

  const titleEl = document.createElement('div');
  titleEl.className = 'graph-title';
  titleEl.textContent = 'Contribution Activity';
  section.appendChild(titleEl);

  const scrollDiv = document.createElement('div');
  scrollDiv.className = 'graph-scroll';
  section.appendChild(scrollDiv);

  const canvas = document.createElement('div');
  canvas.className = 'graph-canvas';
  scrollDiv.appendChild(canvas);

  // ── Month row (absolutely positioned labels) ──
  const DAY_LABEL_W = 26; // px (width of day-label column + gap)
  const monthRowEl = document.createElement('div');
  monthRowEl.className = 'month-row';
  // Total canvas width so the row stretches
  const totalW = DAY_LABEL_W + weeks.length * COL_W;
  monthRowEl.style.width = totalW + 'px';
  monthRowEl.style.position = 'relative';

  monthMarkers.forEach((m, i) => {
    const lbl = document.createElement('span');
    lbl.className = 'month-label';
    lbl.textContent = m.name;
    const xPos = DAY_LABEL_W + m.col * COL_W;
    lbl.style.left = xPos + 'px';
    // Hide if too close to previous label (< 3 cols)
    if (i > 0 && (m.col - monthMarkers[i-1].col) < 3) {
      lbl.style.display = 'none';
    }
    monthRowEl.appendChild(lbl);
  });
  canvas.appendChild(monthRowEl);

  // ── Day grid ──
  const dayGrid = document.createElement('div');
  dayGrid.className = 'day-grid';

  // Day labels column
  const dayLblCol = document.createElement('div');
  dayLblCol.className = 'day-label-col';
  ['','Mon','','Wed','','Fri',''].forEach(lbl => {
    const el = document.createElement('div');
    el.className = 'day-lbl';
    el.textContent = lbl;
    dayLblCol.appendChild(el);
  });
  dayGrid.appendChild(dayLblCol);

  // Weeks
  const weeksGrid = document.createElement('div');
  weeksGrid.className = 'weeks-grid';
  weeks.forEach(w => {
    const col = document.createElement('div');
    col.className = 'week-col';
    for (let dow = 0; dow < 7; dow++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      const day = w[dow];
      if (day) {
        cell.dataset.l = getLevel(day.count, max);
        const dateLabel = new Intl.DateTimeFormat('en-US', { month:'short', day:'numeric', year:'numeric' })
          .format(new Date(day.date + 'T12:00:00'));
        cell.addEventListener('mouseenter', e => showTip(e, day.count, dateLabel));
        cell.addEventListener('mouseleave', () => tip.classList.remove('on'));
      } else {
        cell.style.visibility = 'hidden';
      }
      col.appendChild(cell);
    }
    weeksGrid.appendChild(col);
  });
  dayGrid.appendChild(weeksGrid);
  canvas.appendChild(dayGrid);

  // Stagger-animate cells in
  const cells = canvas.querySelectorAll('.cell:not([style*="hidden"])');
  cells.forEach((c, i) => {
    c.style.opacity = '0';
    c.style.transform = 'scale(0.4)';
    c.style.transition = `opacity .3s ${i * 2}ms, transform .3s ${i * 2}ms`;
    requestAnimationFrame(() => {
      c.style.opacity = '1';
      c.style.transform = c.dataset.l >= 4 ? '' : '';
    });
  });

  document.getElementById('legendRow').style.display = 'flex';
}

/* ── Streak ─────────────────────────────────── */
function streak(days) {
  const today = new Date().toISOString().slice(0,10);
  let s = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].date > today) continue;
    if (days[i].count > 0) s++;
    else break;
  }
  return s;
}

/* ── Fetch ──────────────────────────────────── */
async function fetchData(username) {
  const url = `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status === 404 ? 'User not found.' : `Error ${r.status}`);
  return r.json();
}
async function fetchProfile(username) {
  const r = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
  if (!r.ok) return null;
  return r.json();
}

/* ── Load ───────────────────────────────────── */
async function load() {
  const username = 'saqib-cipher';

  document.getElementById('profileRow').style.display = 'none';
  document.getElementById('statsRow').style.display = 'none';
  document.getElementById('legendRow').style.display = 'none';
  if (document.getElementById('dividerLine')) {
    document.getElementById('dividerLine').style.display = 'none';
  }

  document.getElementById('graphSection').innerHTML =
    `<div class="status" id="statusMsg"><div class="ring-loader"></div> Loading profile…</div>`;

  try {
    const [data, profile] = await Promise.all([fetchData(username), fetchProfile(username)]);
    const days = data.contributions;
    const total = days.reduce((s,d) => s + d.count, 0);
    const best  = Math.max(...days.map(d => d.count));
    const s     = streak(days);

    // Profile
    if (profile) {
      document.getElementById('avImg').src = profile.avatar_url;
      document.getElementById('pName').textContent = profile.name || username;
      document.getElementById('profileRow').style.display = 'flex';
    }

    // Stats
    document.getElementById('sTotal').textContent = total.toLocaleString();
    document.getElementById('sStreak').textContent = s;
    document.getElementById('sBest').textContent = best;
    document.getElementById('statsRow').style.display = 'grid';

    // Graph
    buildGraph(days);
    if (document.getElementById('dividerLine')) {
      document.getElementById('dividerLine').style.display = 'block';
    }

  } catch(err) {
    document.getElementById('graphSection').innerHTML =
      `<div class="status err">⚠ ${err.message || 'Failed to load.'}</div>`;
  }
}

// Auto-load a demo
load();