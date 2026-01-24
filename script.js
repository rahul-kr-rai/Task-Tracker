// CONFIG
const DATA_KEY = "Challenge_Data_V7";
const CONFIG_KEY = "Challenge_Config_V7";

let config = {
    days: 100,
    start: "2026-01-24",
    tasks: ["College Study", "GSoC Prep", "DSA Practice"]
};

let challengeData = [];
let currentTab = 'today';

// --- CHECKBOX COLOR PALETTE ---
// We use these colors via the 'style' attribute to bypass Tailwind JIT limitations
const RAW_COLORS = [
    "rgb(79, 70, 229)",  // 1. Indigo
    "rgb(249, 115, 22)", // 2. Orange
    "#07a04c",           // 3. Green
    "#e11d48",           // 5. Rose
    "#9333ea",           // 6. Purple
    "#0d9488",           // 7. Teal
    "#ca8a04"            // 8. Dark Yellow
];

function formatDate(date) {
    const d = new Date(date);
    return `${d.getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]} ${d.getFullYear()}`;
}

// --- SMART ICON & CONTEXT COLOR ---
// Controls the Stats Grid Icon & Text color (Contextual)
function getTaskIcon(taskName) {
    const n = taskName.toLowerCase();
    let style = { icon: 'fa-star', color: 'text-slate-600', bg: 'bg-slate-50' };

    if(n.includes('code') || n.includes('dsa') || n.includes('dev') || n.includes('web')) 
        style = { icon: 'fa-code', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    else if(n.includes('study') || n.includes('college') || n.includes('read') || n.includes('book')) 
        style = { icon: 'fa-graduation-cap', color: 'text-indigo-600', bg: 'bg-indigo-50' };
    else if(n.includes('gsoc') || n.includes('google')) 
        style = { icon: 'fa-brands fa-google', color: 'text-orange-600', bg: 'bg-orange-50' };
    else if(n.includes('gym') || n.includes('workout') || n.includes('run') || n.includes('fit')) 
        style = { icon: 'fa-dumbbell', color: 'text-rose-600', bg: 'bg-rose-50' };
    else if(n.includes('medita') || n.includes('yoga')) 
        style = { icon: 'fa-spa', color: 'text-teal-600', bg: 'bg-teal-50' };
    else if(n.includes('write') || n.includes('journal')) 
        style = { icon: 'fa-pen-nib', color: 'text-amber-600', bg: 'bg-amber-50' };
    else if(n.includes('water') || n.includes('drink')) 
        style = { icon: 'fa-glass-water', color: 'text-sky-600', bg: 'bg-sky-50' };

    return style;
}

// --- INIT APP ---
function initApp() {
    const savedConfig = localStorage.getItem(CONFIG_KEY);
    
    // CASE 1: Returning User
    if (savedConfig) {
        config = JSON.parse(savedConfig);
        document.getElementById('challengeTitle').innerText = `${config.days} Days Challenge`;
        
        const startDate = new Date(config.start);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + config.days - 1);
        document.getElementById('dateRangeDisplay').innerText = `${formatDate(startDate)} - ${formatDate(endDate)}`;

        const savedData = localStorage.getItem(DATA_KEY);
        if (savedData) {
            challengeData = JSON.parse(savedData);
            if(challengeData.length !== config.days) generateData();
            else {
                const dataKeys = Object.keys(challengeData[0]);
                if(config.tasks.length > (dataKeys.filter(k => k.startsWith('task')).length)) {
                    patchDataForNewTasks();
                }
            }
        } else {
            generateData();
        }
        
        renderStats();
        render();
    } 
    // CASE 2: Fresh Start
    else {
        config.tasks = ["", "", ""]; 
        document.getElementById('challengeTitle').innerText = "Welcome";
        document.getElementById('dateRangeDisplay').innerText = "Set up your goal to begin";
        
        const statsGrid = document.getElementById('statsGrid');
        if(statsGrid) statsGrid.style.display = 'none';

        openSetupModal();
    }
}

function generateData() {
    challengeData = [];
    const startDate = new Date(config.start);
    for (let i = 0; i < config.days; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        let dayObj = {
            day: i + 1,
            date: currentDate.toISOString(),
            goalMet: false,
            notes: ""
        };
        
        config.tasks.forEach((_, idx) => {
            dayObj[`task${idx + 1}`] = false;
        });
        
        challengeData.push(dayObj);
    }
    saveData();
}

function patchDataForNewTasks() {
    const today = new Date(); today.setHours(0,0,0,0);
    
    challengeData.forEach(day => {
        const cDate = new Date(day.date); cDate.setHours(0,0,0,0);
        
        config.tasks.forEach((_, idx) => {
            const key = `task${idx + 1}`;
            if (!(key in day)) {
                if (cDate >= today) {
                    day[key] = false; 
                }
            }
        });
    });
    saveData();
}

function saveData() {
    localStorage.setItem(DATA_KEY, JSON.stringify(challengeData));
    updateStats();
}

// --- ADD TASK MODAL ---
function openAddTaskModal() {
    toggleMobileMenu(false);
    document.getElementById('newTaskInput').value = "";
    const modal = document.getElementById('addTaskModal');
    modal.classList.remove('hidden');
    setTimeout(() => { 
        document.getElementById('addTaskBackdrop').classList.add('fade-in'); 
        document.getElementById('addTaskPanel').classList.add('scale-in'); 
    }, 10);
}

function closeAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    document.getElementById('addTaskBackdrop').classList.remove('fade-in');
    document.getElementById('addTaskPanel').classList.remove('scale-in');
    setTimeout(() => modal.classList.add('hidden'), 200);
}

function confirmAddTask() {
    const taskName = document.getElementById('newTaskInput').value;
    if(taskName) {
        config.tasks.push(taskName);
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
        
        const today = new Date(); today.setHours(0,0,0,0);
        const key = `task${config.tasks.length}`;
        
        challengeData.forEach(day => {
            const cDate = new Date(day.date); cDate.setHours(0,0,0,0);
            if (cDate >= today) {
                day[key] = false;
            } 
        });
        
        saveData();
        renderStats(); 
        render();      
        closeAddTaskModal();
    }
}

// --- SETUP MODAL LOGIC ---
function toggleMobileMenu(force) {
    const menu = document.getElementById('mobileMenu');
    if(force === false) menu.classList.add('hidden');
    else menu.classList.toggle('hidden');
}

function openSetupModal() {
    toggleMobileMenu(false);
    const today = new Date().toISOString().split('T')[0];
    
    document.getElementById('inputDays').value = config.days;
    document.getElementById('inputDate').value = config.start || today;
    document.getElementById('taskName1').value = config.tasks[0] || "";
    document.getElementById('taskName2').value = config.tasks[1] || "";
    document.getElementById('taskName3').value = config.tasks[2] || "";

    const modal = document.getElementById('setupModal');
    modal.classList.remove('hidden');
    setTimeout(() => { 
        document.getElementById('setupBackdrop').classList.add('fade-in'); 
        document.getElementById('setupPanel').classList.add('scale-in'); 
    }, 10);
}

function closeSetupModal() {
    const modal = document.getElementById('setupModal');
    document.getElementById('setupBackdrop').classList.remove('fade-in');
    document.getElementById('setupPanel').classList.remove('scale-in');
    setTimeout(() => modal.classList.add('hidden'), 200);
}

function startNewChallenge() {
    const days = parseInt(document.getElementById('inputDays').value) || 100;
    const start = document.getElementById('inputDate').value;
    let tasks = [];
    if(document.getElementById('taskName1').value) tasks.push(document.getElementById('taskName1').value);
    if(document.getElementById('taskName2').value) tasks.push(document.getElementById('taskName2').value);
    if(document.getElementById('taskName3').value) tasks.push(document.getElementById('taskName3').value);
    if(tasks.length === 0) tasks = ["Task 1"];

    if (!start) { alert("Please select a start date"); return; }

    config = { days, start, tasks };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    generateData(); 
    closeSetupModal();
    location.reload(); 
}

// --- RESET LOGIC ---
function openResetModal() {
    toggleMobileMenu(false);
    const modal = document.getElementById('resetModal');
    modal.classList.remove('hidden');
    setTimeout(() => { 
        document.getElementById('resetBackdrop').classList.add('fade-in'); 
        document.getElementById('resetPanel').classList.add('scale-in'); 
    }, 10);
}

function closeResetModal() {
    const modal = document.getElementById('resetModal');
    document.getElementById('resetBackdrop').classList.remove('fade-in');
    document.getElementById('resetPanel').classList.remove('scale-in');
    setTimeout(() => modal.classList.add('hidden'), 200);
}

function confirmReset() {
    // 1. Clear Data
    localStorage.removeItem(DATA_KEY);
    localStorage.removeItem(CONFIG_KEY);
    
    // 2. Hide Reset Modal
    closeResetModal();

    // 3. Show Success Modal
    const modal = document.getElementById('successModal');
    modal.classList.remove('hidden');
    setTimeout(() => { 
        document.getElementById('successBackdrop').classList.add('fade-in'); 
        document.getElementById('successPanel').classList.add('scale-in'); 
    }, 10);

    // 4. Redirect after 2 seconds
    setTimeout(() => {
        window.location.href = "index.html";
    }, 2000);
}

// --- CELEBRATION EFFECTS ---

// 1. Small Puff for checking a single task
function triggerSmallCelebration() {
    confetti({
        particleCount: 20,
        spread: 30,
        startVelocity: 30,
        origin: { y: 0.7 },
        scalar: 0.7,
        colors: ['#6366f1', '#a5b4fc'], // Indigo shades
        disableForReducedMotion: true
    });
}

// 2. Big Celebration for finishing a Day
function triggerBigCelebration() {
    const duration = 1500;
    const end = Date.now() + duration;
    const colors = ['#4f46e5', '#16a34a', '#f97316', '#e11d48']; // Brand colors

    // Side Cannons Loop
    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.8 },
            colors: colors
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.8 },
            colors: colors
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
    
    // Final center burst
    setTimeout(() => {
        confetti({ 
            particleCount: 120, 
            spread: 100, 
            origin: { y: 0.6 }, 
            colors: colors,
            startVelocity: 45
        });
    }, duration / 3);
}

// --- CORE LOGIC ---
function setTab(t) { currentTab = t; render(); }

function getFilteredData() {
    const today = new Date(); today.setHours(0,0,0,0);
    return challengeData.filter(day => {
        const cDate = new Date(day.date); cDate.setHours(0,0,0,0);
        if (currentTab === 'today') return cDate.getTime() === today.getTime();
        if (currentTab === 'upcoming') return cDate > today;
        if (currentTab === 'achieved') return cDate < today && day.goalMet;
        if (currentTab === 'missed') return cDate < today && !day.goalMet;
        return false;
    });
}

function calculateStreak(taskKey) {
    let streak = 0;
    const todayStr = new Date().toDateString();
    let idx = challengeData.findIndex(d => new Date(d.date).toDateString() === todayStr);
    if (idx === -1 && new Date() > new Date(config.start)) idx = challengeData.length - 1;
    if (idx === -1) return 0;

    for (let i = idx; i >= 0; i--) {
        const day = challengeData[i];
        const done = (taskKey === 'global') ? day.goalMet : day[taskKey];
        if (done) streak++; else if (i !== idx) break;
    }
    return streak;
}

function renderStats() {
    const grid = document.getElementById('statsGrid');
    if(!grid) return; 
    grid.style.display = 'grid'; 

    const totalCard = `
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div class="flex justify-between items-start mb-2">
            <p class="text-sm font-medium text-slate-500">Total Progress</p>
            <div class="p-2 bg-blue-50 rounded-lg text-blue-600"><i class="fa-solid fa-chart-pie"></i></div>
        </div>
        <h2 class="text-3xl font-bold text-slate-900" id="totalPercent">0%</h2>
        <div class="w-full bg-slate-100 rounded-full h-2.5 mt-3">
            <div id="progressBar" class="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style="width: 0%"></div>
        </div>
    </div>`;
    
    let html = totalCard;
    
    config.tasks.forEach((taskName, idx) => {
        const key = `task${idx+1}`;
        // Use CONTEXTUAL style for the Stats Grid (Icon & Text color)
        const style = getTaskIcon(taskName);
        
        const validDays = challengeData.filter(d => d[key] !== undefined).length;
        
        html += `
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
            <div class="flex justify-between items-start mb-2">
                <p class="text-sm font-medium text-slate-500 truncate pr-2">${taskName}</p>
                <div class="p-2 ${style.bg} ${style.color} rounded-lg"><i class="fa-solid ${style.icon}"></i></div>
            </div>
            <div class="flex items-baseline gap-2">
                <h2 class="text-2xl font-bold text-slate-900"><span id="count${key}">0</span>/<span class="target-days">${validDays}</span></h2>
            </div>
            <div class="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <i class="fa-solid fa-fire streak-fire" id="fire${key}"></i> <span id="streak${key}">0</span> Streak
            </div>
        </div>`;
    });
    
    grid.innerHTML = html;
    updateStats();
}

function updateStats() {
    let totalTasks = 0;
    let totalDone = 0;
    
    config.tasks.forEach((_, idx) => {
        const key = `task${idx+1}`;
        const count = challengeData.filter(d => d[key] === true).length;
        const validDays = challengeData.filter(d => d[key] !== undefined).length;
        
        totalDone += count;
        totalTasks += validDays; 
        
        const countEl = document.getElementById(`count${key}`);
        if(countEl) countEl.innerText = count;
        
        const streak = calculateStreak(key);
        const streakEl = document.getElementById(`streak${key}`);
        if(streakEl) streakEl.innerText = streak;
        
        const fireEl = document.getElementById(`fire${key}`);
        if(fireEl) {
            streak > 0 ? fireEl.classList.add('streak-active') : fireEl.classList.remove('streak-active');
            
            // Re-apply contextual color to the fire icon
            const style = getTaskIcon("dummy"); 
            fireEl.className = "fa-solid fa-fire streak-fire"; 
            if(streak > 0) {
                fireEl.classList.add('streak-active');
                fireEl.classList.add('text-orange-500'); // Fire is always orange in analytics
            }
        }
    });

    let pct = 0;
    if (totalTasks > 0) {
        pct = (totalDone / totalTasks) * 100;
    }

    const displayPct = (pct > 0 && pct < 10) ? pct.toFixed(1) : Math.round(pct);

    document.getElementById('totalPercent').innerText = `${displayPct}%`;
    document.getElementById('progressBar').style.width = `${pct}%`;

    const gStreak = calculateStreak('global');
    document.getElementById('globalStreak').innerText = gStreak;
    document.getElementById('mainFireIcon').classList.toggle('streak-active', gStreak > 0);
}

function toggleTask(index, type) {
    const day = challengeData[index];
    const today = new Date(); today.setHours(0,0,0,0);
    const cDate = new Date(day.date); cDate.setHours(0,0,0,0);

    if (cDate > today || (cDate < today && !day.goalMet)) return;

    const wasMet = day.goalMet;
    
    // Toggle the value
    day[type] = !day[type];
    
    // Check for success condition
    let allDone = true;
    config.tasks.forEach((_, idx) => {
        const k = `task${idx+1}`;
        if(day[k] !== undefined && !day[k]) allDone = false;
    });
    day.goalMet = allDone;

    // CELEBRATION LOGIC
    if (day.goalMet && !wasMet) {
        // CASE 1: Big Celebration (Day Finished)
        triggerBigCelebration();
        
        // Streak Pop Animation
        const b = document.getElementById('mainStreakContainer');
        b.classList.remove('streak-pop'); void b.offsetWidth; b.classList.add('streak-pop');
    } else if (day[type] === true) {
        // CASE 2: Mini Celebration (Task Checked)
        triggerSmallCelebration();
    }

    saveData();
    if((currentTab === 'missed' && day.goalMet) || (currentTab === 'achieved' && !day.goalMet)) render();
    else renderCard(index);
}

function updateNote(index, value) {
    challengeData[index].notes = value;
    saveData();
}

function getCardHTML(day, index) {
    const today = new Date(); today.setHours(0,0,0,0);
    const cDate = new Date(day.date); cDate.setHours(0,0,0,0);

    const isToday = cDate.getTime() === today.getTime();
    const isFuture = cDate > today;
    const isMissed = cDate < today && !day.goalMet;
    const isDisabled = isFuture || isMissed;

    let cardClass = 'bg-white border-slate-200';
    if (day.goalMet) cardClass = 'card-checked border-emerald-400';
    else if (isDisabled) cardClass = 'card-disabled';

    const badge = day.goalMet 
        ? `<span class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">Done</span>` 
        : `<span class="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full">Pending</span>`;
    
    const todayBadge = isToday ? `<span class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold animate-pulse">Today</span>` : '';
    const lockIcon = isMissed ? `<i class="fa-solid fa-lock text-slate-400 text-xs ml-2"></i>` : '';

    let checkboxes = '';
    config.tasks.forEach((taskName, idx) => {
        const key = `task${idx+1}`;
        if(day[key] === undefined) return;
        
        // 1. Get Color from Cycle
        const color = RAW_COLORS[idx % RAW_COLORS.length];

        // 2. USE STYLE ATTRIBUTE + bg-current
        // This bypasses the Tailwind scanner by setting the color dynamically via style
        // and using 'checked:bg-current' which relies on that inherited color.
        checkboxes += `
        <label class="flex items-center space-x-3 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer group'}">
            <div class="relative flex items-center">
                <input type="checkbox" 
                    style="color: ${color}"
                    class="peer appearance-none h-5 w-5 border-2 border-slate-300 rounded-md checked:bg-current checked:border-current transition-colors"
                    ${day[key] ? 'checked' : ''} ${isDisabled ? 'disabled' : ''} onchange="toggleTask(${index}, '${key}')">
                <i class="fa-solid fa-check text-white absolute left-0.5 opacity-0 peer-checked:opacity-100 text-xs pointer-events-none"></i>
            </div>
            <span class="text-sm text-slate-600 truncate">${taskName}</span>
        </label>`;
    });

    return `
        <div class="rounded-xl border shadow-sm p-5 transition-all duration-300 ${cardClass} flex flex-col h-full" id="card-${index}">
            <div class="flex justify-between items-center mb-4">
                <div class="flex gap-2 items-center">
                    <h4 class="font-bold text-lg text-slate-800">Day ${day.day}</h4>
                    ${todayBadge} ${lockIcon}
                </div>
                <div class="text-right">
                    ${badge}
                    <p class="text-[10px] text-slate-400 mt-1">${formatDate(day.date)}</p>
                </div>
            </div>
            <div class="space-y-3 mb-4 ${isDisabled ? 'opacity-60 pointer-events-none' : ''}">
                ${checkboxes}
            </div>
            <div class="mt-auto pt-3 border-t border-slate-100">
                <textarea 
                    class="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 placeholder-slate-400 focus:outline-none"
                    rows="2" 
                    placeholder="Add note..."
                    ${isDisabled ? 'disabled' : ''}
                    onchange="updateNote(${index}, this.value)">${day.notes || ''}</textarea>
            </div>
        </div>
    `;
}

function render() {
    const grid = document.getElementById('daysGrid');
    const data = getFilteredData();
    
    const today = new Date(); today.setHours(0,0,0,0);
    
    const todayCount = challengeData.filter(d => { const dt = new Date(d.date); dt.setHours(0,0,0,0); return dt.getTime() === today.getTime(); }).length;
    const upcomingCount = challengeData.filter(d => { const dt = new Date(d.date); dt.setHours(0,0,0,0); return dt > today; }).length;
    const achievedCount = challengeData.filter(d => { const dt = new Date(d.date); dt.setHours(0,0,0,0); return dt < today && d.goalMet; }).length;
    const missedCount = challengeData.filter(d => { const dt = new Date(d.date); dt.setHours(0,0,0,0); return dt < today && !d.goalMet; }).length;

    document.getElementById('badge-today').innerText = todayCount;
    document.getElementById('badge-upcoming').innerText = upcomingCount;
    document.getElementById('badge-achieved').innerText = achievedCount;
    document.getElementById('badge-missed').innerText = missedCount;

    ['today','upcoming','achieved','missed'].forEach(t => {
        document.getElementById(`tab-${t}`).className = `tab-btn flex-1 py-2 px-4 rounded-lg text-sm font-medium whitespace-nowrap flex items-center justify-center gap-2 ${currentTab===t ? 'tab-active' : 'tab-inactive'}`;
    });

    if (data.length === 0) {
        grid.innerHTML = '';
        document.getElementById('emptyState').classList.remove('hidden');
        const msgs = { 'today': "No tasks for Today!", 'upcoming': "Challenge finished!", 'achieved': "Start completing tasks!", 'missed': "No missed days!" };
        document.getElementById('emptyStateMsg').innerText = msgs[currentTab];
    } else {
        document.getElementById('emptyState').classList.add('hidden');
        grid.innerHTML = data.map(day => getCardHTML(day, challengeData.findIndex(d => d.day === day.day))).join('');
    }
    updateStats();
}

function renderCard(index) {
    const el = document.getElementById(`card-${index}`);
    if (el) {
        const tmp = document.createElement('div');
        tmp.innerHTML = getCardHTML(challengeData[index], index);
        el.replaceWith(tmp.firstElementChild);
    }
    updateStats();
}

initApp();