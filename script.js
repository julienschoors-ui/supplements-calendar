// Logique principale (FR) – v2

function formatDate(d) { return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }); }
function pad(n) { return n < 10 ? '0' + n : '' + n; }
function toLocalISO(d) { return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
function addMinutes(d, mins){ const r=new Date(d); r.setMinutes(r.getMinutes()+mins); return r; }

// Modèle de supplément v2
const defaultSupps = [
  {
    name: 'Whey', dose: 30, unit: 'g', solubility: 'hydrosoluble',
    rules: {
      postWorkout: true,
      withMeal: false,
      restFallback: 'fixed', // 'none' | 'fixed' | 'meal'
      restFixedTime: '11:00'
    },
    notes: 'Prise après entraînement. Hydrosoluble; mélange eau/lait. En jour OFF: collation fixe (11:00 par défaut).'
  },
  {
    name: 'Créatine', dose: 5, unit: 'g', solubility: 'hydrosoluble',
    rules: {
      postWorkout: true,
      ensureDaily: true, // garantit 1 dose/jour
      dailyWhen: 'wake', // 'wake' | 'meal' | 'fixed'
      dailyFixedTime: ''
    },
    notes: '3–5 g / jour. Post-workout si entraînement, sinon dose quotidienne au réveil.'
  },
  {
    name: 'Magnésium (Metarelax)', dose: 1, unit: 'sachet', solubility: 'hydrosoluble',
    rules: { postWorkout: false, withMeal: true, atWake: false, beforeBed: true, fixedTime: '' },
    notes: 'Metarelax: 30 min avant coucher; avec repas si souhaité pour confort.'
  },
  {
    name: 'Vitamine B3 (niacine)', dose: 100, unit: 'mg', solubility: 'hydrosoluble',
    rules: { postWorkout: false, withMeal: true, atWake: false, beforeBed: false, fixedTime: '' },
    notes: 'Hydrosoluble; avec nourriture pour limiter le flush.'
  },
  {
    name: 'Oméga-3 (EPA/DHA)', dose: 2, unit: 'caps', solubility: 'liposoluble',
    rules: { postWorkout: false, withMeal: true, atWake: false, beforeBed: false, fixedTime: '' },
    notes: 'Liposoluble; avec repas contenant des graisses.'
  }
];

let workouts = [];
let supplements = JSON.parse(localStorage.getItem('supplements_v2')||'null') || defaultSupps;

function renderSupplements(){
  const root = document.getElementById('supplements');
  root.innerHTML='';
  supplements.forEach((s, idx)=>{
    const el = document.createElement('div');
    el.className='card';
    let extra = '';
    if(s.name.toLowerCase().includes('whey')){
      extra = `
        <div class="grid">
          <label>Jour sans entraînement – fallback
            <select data-idx="${idx}" data-field="restFallback">
              <option value="none" ${s.rules.restFallback==='none'?'selected':''}>Aucun</option>
              <option value="fixed" ${s.rules.restFallback==='fixed'?'selected':''}>Heure fixe</option>
              <option value="meal" ${s.rules.restFallback==='meal'?'selected':''}>Avec repas</option>
            </select>
          </label>
          <label>Heure fixe (jour OFF)
            <input type="time" value="${s.rules.restFixedTime||''}" data-idx="${idx}" data-field="restFixedTime" />
          </label>
        </div>`;
    } else if(s.name.toLowerCase().includes('créatine')){
      extra = `
        <div class="grid">
          <label>Assurer une dose quotidienne si pas d'entraînement
            <input type="checkbox" ${s.rules.ensureDaily?'checked':''} data-idx="${idx}" data-field="ensureDaily" />
          </label>
          <label>Moment de la dose quotidienne
            <select data-idx="${idx}" data-field="dailyWhen">
              <option value="wake" ${s.rules.dailyWhen==='wake'?'selected':''}>Au réveil</option>
              <option value="meal" ${s.rules.dailyWhen==='meal'?'selected':''}>Avec repas</option>
              <option value="fixed" ${s.rules.dailyWhen==='fixed'?'selected':''}>Heure fixe</option>
            </select>
          </label>
          <label>Heure fixe (si sélectionnée)
            <input type="time" value="${s.rules.dailyFixedTime||''}" data-idx="${idx}" data-field="dailyFixedTime" />
          </label>
        </div>`;
    }
    el.innerHTML = `
      <div class="grid">
        <label>Nom
          <input value="${s.name}" data-idx="${idx}" data-field="name" />
        </label>
        <label>Dosage
          <input type="number" value="${s.dose}" data-idx="${idx}" data-field="dose" step="0.1" />
        </label>
        <label>Unité
          <input value="${s.unit}" data-idx="${idx}" data-field="unit" />
        </label>
        <label>Solubilité
          <select data-idx="${idx}" data-field="solubility">
            <option value="hydrosoluble" ${s.solubility==='hydrosoluble'?'selected':''}>Hydrosoluble</option>
            <option value="liposoluble" ${s.solubility==='liposoluble'?'selected':''}>Liposoluble</option>
          </select>
        </label>
      </div>
      <div class="grid">
        <label><input type="checkbox" ${s.rules.postWorkout?'checked':''} data-idx="${idx}" data-field="postWorkout"> Après entraînement</label>
        <label><input type="checkbox" ${s.rules.withMeal?'checked':''} data-idx="${idx}" data-field="withMeal"> Avec repas</label>
        <label><input type="checkbox" ${s.rules.atWake?'checked':''} data-idx="${idx}" data-field="atWake"> Au réveil</label>
        <label><input type="checkbox" ${s.rules.beforeBed?'checked':''} data-idx="${idx}" data-field="beforeBed"> Avant le coucher</label>
        <label>Heure fixe (optionnelle)
          <input type="time" value="${s.rules.fixedTime||''}" data-idx="${idx}" data-field="fixedTime" />
        </label>
      </div>
      ${extra}
      <p class="small">${s.notes}</p>
    `;
    root.appendChild(el);
  });

  root.querySelectorAll('input, select').forEach(inp=>{
    inp.addEventListener('input', (e)=>{
      const i = parseInt(e.target.dataset.idx);
      const field = e.target.dataset.field;
      const val = e.target.type==='checkbox' ? e.target.checked : e.target.value;
      if(['name','unit','solubility'].includes(field)){
        supplements[i][field] = val;
      } else if(field==='dose'){
        supplements[i][field] = Number(val);
      } else if(['postWorkout','withMeal','atWake','beforeBed','fixedTime','restFallback','restFixedTime','ensureDaily','dailyWhen','dailyFixedTime'].includes(field)){
        supplements[i].rules[field] = val;
      }
      localStorage.setItem('supplements_v2', JSON.stringify(supplements));
    });
  });
}

function addWorkout(){
  const s = document.getElementById('woStart').value;
  const e = document.getElementById('woEnd').value;
  if(!s || !e){ alert('Veuillez saisir début et fin.'); return; }
  const start = new Date(s);
  const end = new Date(e);
  if(end <= start){ alert('La fin doit être après le début.'); return; }
  workouts.push({ start, end });
  renderWorkouts();
}

function renderWorkouts(){
  const ul = document.getElementById('workoutList');
  ul.innerHTML = '';
  workouts.sort((a,b)=>a.start-b.start);
  workouts.forEach((w, idx)=>{
    const li = document.createElement('li');
    li.innerHTML = `<div>
      <div><strong>${w.start.toLocaleString()}</strong> → <strong>${w.end.toLocaleString()}</strong></div>
      <div class="small">Durée: ${Math.round((w.end-w.start)/60000)} min</div>
    </div>
    <button data-idx="${idx}" class="secondary">Supprimer</button>`;
    ul.appendChild(li);
  });
  ul.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const i = parseInt(e.target.dataset.idx);
      workouts.splice(i,1);
      renderWorkouts();
    });
  });
}

function getCycleStatus(date, start, onCount, offCount){
  const msPerDay = 24*3600*1000;
  const daysDiff = Math.floor((date - start) / msPerDay);
  if(daysDiff < 0) return false;
  const cycleLen = onCount + offCount;
  const pos = daysDiff % cycleLen;
  return pos < onCount;
}

function parseTimeToDate(baseDate, timeStr){
  const [hh, mm] = timeStr.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(hh); d.setMinutes(mm); d.setSeconds(0); d.setMilliseconds(0);
  return d;
}

function generateAgenda(){
  const days = parseInt(document.getElementById('planDays').value || '21');
  const cycleStartStr = document.getElementById('cycleStart').value;
  const onCount = parseInt(document.getElementById('onCount').value || '4');
  const offCount = parseInt(document.getElementById('offCount').value || '4');
  if(!cycleStartStr){ alert('Veuillez définir la date/heure de début du cycle.'); return; }
  const cycleStart = new Date(cycleStartStr);

  const sleepWorkBed = document.getElementById('sleepWorkBed').value;
  const sleepWorkWake = document.getElementById('sleepWorkWake').value;
  const sleepOffBed = document.getElementById('sleepOffBed').value;
  const sleepOffWake = document.getElementById('sleepOffWake').value;

  const today = new Date();
  let daysList = [];

  for(let i=0;i<days;i++){
    const d = new Date(today);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate()+i);
    const worked = getCycleStatus(d, cycleStart, onCount, offCount);
    let bed, wake;
    if(worked){
      bed = parseTimeToDate(d, sleepWorkBed);
      wake = parseTimeToDate(d, sleepWorkWake);
    } else {
      bed = parseTimeToDate(d, sleepOffBed);
      wake = parseTimeToDate(d, sleepOffWake);
    }

    // Déterminer si ce jour contient un entraînement
    const dayWorkouts = workouts.filter(w=>{
      const wd = new Date(w.end);
      return wd.getFullYear()===d.getFullYear() && wd.getMonth()===d.getMonth() && wd.getDate()===d.getDate();
    });

    const events = [];

    supplements.forEach(s=>{
      const title = `${s.name} ${s.dose}${s.unit}`;
      const solBadge = s.solubility==='liposoluble'? ' (lipo)' : ' (hydro)';
      const pushEv = (t, extraTitle='')=> events.push({ start: t, end: addMinutes(t, 10), title: title + (extraTitle? ' – ' + extraTitle : '') + solBadge, desc: s.notes });

      // Heure fixe générique
      if(s.rules.fixedTime){ pushEv(parseTimeToDate(d, s.rules.fixedTime)); }
      if(s.rules.atWake){ pushEv(wake, 'au réveil'); }
      if(s.rules.beforeBed){
        const t = s.name.toLowerCase().includes('magnésium') ? addMinutes(bed, -30) : bed;
        pushEv(t, 'avant coucher');
      }
      if(s.rules.withMeal){
        const mealTime = worked ? parseTimeToDate(d, '20:00') : parseTimeToDate(d, '12:30');
        const extra = s.solubility==='liposoluble' ? 'avec repas (gras)' : 'avec repas';
        pushEv(mealTime, extra);
      }

      // Spécifiques whey & créatine
      if(s.name.toLowerCase().includes('whey')){
        if(s.rules.postWorkout){
          dayWorkouts.forEach(w=> pushEv(addMinutes(w.end, 10), 'post-entraînement'));
        }
        if(dayWorkouts.length===0){
          if(s.rules.restFallback==='fixed' && s.rules.restFixedTime){ pushEv(parseTimeToDate(d, s.rules.restFixedTime), 'jour OFF (collation)'); }
          else if(s.rules.restFallback==='meal'){ const mt = worked? parseTimeToDate(d,'20:00') : parseTimeToDate(d,'12:30'); pushEv(mt, 'jour OFF (avec repas)'); }
        }
      }

      if(s.name.toLowerCase().includes('créatine')){
        let creatineScheduled = false;
        if(s.rules.postWorkout && dayWorkouts.length){
          // 1 seule dose post-workout (si plusieurs entraînements, prendre après le dernier)
          const lastWO = dayWorkouts.sort((a,b)=>a.end-b.end)[dayWorkouts.length-1];
          pushEv(addMinutes(lastWO.end, 10), 'post-entraînement');
          creatineScheduled = true;
        }
        if(!creatineScheduled && s.rules.ensureDaily){
          if(s.rules.dailyWhen==='wake') pushEv(wake, 'dose quotidienne');
          else if(s.rules.dailyWhen==='meal'){ const mt = worked? parseTimeToDate(d,'20:00') : parseTimeToDate(d,'12:30'); pushEv(mt, 'dose quotidienne (repas)'); }
          else if(s.rules.dailyWhen==='fixed' && s.rules.dailyFixedTime){ pushEv(parseTimeToDate(d, s.rules.dailyFixedTime), 'dose quotidienne (heure fixe)'); }
        }
      }
    });

    daysList.push({ date: d, worked, bed, wake, events: events.sort((a,b)=>a.start-b.start) });
  }

  renderAgenda(daysList);
  window.currentAgenda = daysList;
}

function renderAgenda(daysList){
  const root = document.getElementById('agenda');
  root.innerHTML = '';
  daysList.forEach(day=>{
    const cont = document.createElement('div');
    cont.className='agenda-day';
    cont.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;">
      <div><strong>${formatDate(day.date)}</strong> <span class="badge">${day.worked? 'Nuit travaillée' : 'Nuit OFF'}</span></div>
      <div class="small">Réveil: ${day.wake.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} · Coucher: ${day.bed.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
    </div>`;
    day.events.forEach(ev=>{
      const el = document.createElement('div');
      const badgeClass = ev.title.includes('(lipo)') ? 'lipo' : 'hydro';
      el.className='event';
      el.innerHTML = `<div class="time">${ev.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
        <div class="title">${ev.title.replace(' (lipo)','').replace(' (hydro)','')}</div>
        <div class="badge ${badgeClass}">${badgeClass==='lipo'?'Liposoluble':'Hydrosoluble'}</div>`;
      cont.appendChild(el);
    });
    root.appendChild(cont);
  });
}

function exportICS(){
  const daysList = window.currentAgenda || [];
  if(!daysList.length){ alert('Générez d’abord le calendrier.'); return; }
  let ics = 'BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Suppléments Calendrier v2//FR//
';
  daysList.forEach(day=>{
    day.events.forEach(ev=>{
      const dtStart = ev.start.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
      const dtEnd = ev.end.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z';
      const uid = 'uid-' + Math.random().toString(36).slice(2) + '@supp-cal-v2';
      const summary = ev.title;
      const desc = ev.desc || '';
      ics += 'BEGIN:VEVENT
';
      ics += 'UID:' + uid + '
';
      ics += 'DTSTAMP:' + dtStart + '
';
      ics += 'DTSTART:' + dtStart + '
';
      ics += 'DTEND:' + dtEnd + '
';
      ics += 'SUMMARY:' + summary.replace(/
/g,' ') + '
';
      ics += 'DESCRIPTION:' + desc.replace(/
/g,' ') + '
';
      ics += 'END:VEVENT
';
    });
  });
  ics += 'END:VCALENDAR
';

  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'suppl-cal-v2.ics';
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
}

// Pré-remplissage
(function prefill(){
  try {
    const now = new Date();
    const assumed = new Date(now.getFullYear(), 11, 8, 22, 30); // 8 déc 22:30
    document.getElementById('cycleStart').value = toLocalISO(assumed);
  } catch(e) {}
})();

renderSupplements();
document.getElementById('addWorkout').addEventListener('click', addWorkout);
document.getElementById('generate').addEventListener('click', generateAgenda);
document.getElementById('exportICS').addEventListener('click', exportICS);
