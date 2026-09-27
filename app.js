/**
 * Karthikeya Daily Task Tracker & Dad's Review Portal
 * App Logic & State Management
 */

// --- Default Demo Initial Data ---
const DEFAULT_TASKS = [
  {
    id: "task-1",
    date: getTodayDateString(),
    topic: "Mathematics",
    description: "Solved Quadratic Equations practice sheet (Problems 1 to 20). Reviewed discriminant formulas.",
    hours: 1,
    minutes: 30,
    status: "completed",
    createdAt: new Date().toISOString()
  },
  {
    id: "task-2",
    date: getTodayDateString(),
    topic: "Science",
    description: "Read Chapter 5: Electricity and Circuits. Made summary mind-map and notes on Ohm's Law.",
    hours: 1,
    minutes: 0,
    status: "completed",
    createdAt: new Date().toISOString()
  },
  {
    id: "task-3",
    date: getTodayDateString(),
    topic: "English",
    description: "Practiced 15 new vocabulary flashcards and completed essay writing draft on renewable energy.",
    hours: 0,
    minutes: 45,
    status: "in_progress",
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_COMMENTS = [
  {
    id: "comment-1",
    date: getTodayDateString(),
    author: "Dad",
    text: "Very proud of Karthikeya's dedicated math problem solving today! Keep up this high focus and take timely breaks.",
    approved: true,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

// --- Global Application State ---
let currentUser = null; // { username, role: 'student' | 'dad', displayName }
let selectedDate = getTodayDateString();
let tasks = [];
let dadComments = [];

// Stopwatch timer state
let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;

// --- Helper Functions ---
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(dateStr) {
  const todayStr = getTodayDateString();
  if (dateStr === todayStr) {
    return "Today, " + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  const dateObj = new Date(dateStr + "T00:00:00");
  return dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function getTopicBadgeInfo(topic) {
  switch (topic.toLowerCase()) {
    case 'mathematics':
      return { icon: 'fa-calculator', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'science':
      return { icon: 'fa-flask', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'english':
      return { icon: 'fa-book', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'social studies':
      return { icon: 'fa-earth-americas', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case 'programming':
      return { icon: 'fa-code', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
    case 'hindi':
      return { icon: 'fa-pen-nib', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    case 'homework':
      return { icon: 'fa-list-check', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    default:
      return { icon: 'fa-star', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
  }
}

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  // Set copyright year
  document.getElementById("footerYear").textContent = new Date().getFullYear();

  // Initialize date inputs
  const dateInput = document.getElementById("selectedDateInput");
  dateInput.value = selectedDate;

  // Load stored data or initialize defaults
  loadDataFromStorage();

  // Check URL parameters for instant phone sync connect
  handleUrlSyncParams();

  // Initialize Realtime Cloud Sync
  initCloudSync();

  // Check for remembered user session
  const storedUser = localStorage.getItem("karthikeya_auth_user");
  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser);
      showDashboard();
    } catch (e) {
      showLogin();
    }
  } else {
    showLogin();
  }
});

// --- Storage Handlers ---
function loadDataFromStorage() {
  const storedTasks = localStorage.getItem("karthikeya_tasks_data");
  if (storedTasks) {
    try {
      tasks = JSON.parse(storedTasks);
    } catch (e) {
      tasks = [...DEFAULT_TASKS];
    }
  } else {
    tasks = [...DEFAULT_TASKS];
    saveTasksToStorage(false);
  }

  const storedComments = localStorage.getItem("karthikeya_dad_comments");
  if (storedComments) {
    try {
      dadComments = JSON.parse(storedComments);
    } catch (e) {
      dadComments = [...DEFAULT_COMMENTS];
    }
  } else {
    dadComments = [...DEFAULT_COMMENTS];
    saveCommentsToStorage(false);
  }
}

function saveTasksToStorage(syncCloud = true) {
  localStorage.setItem("karthikeya_tasks_data", JSON.stringify(tasks));
  if (syncCloud && isCloudSyncActive && cloudDbRef) {
    cloudDbRef.child("tasks").set(tasks).catch(err => console.warn("Cloud sync tasks error:", err));
  }
}

function saveCommentsToStorage(syncCloud = true) {
  localStorage.setItem("karthikeya_dad_comments", JSON.stringify(dadComments));
  if (syncCloud && isCloudSyncActive && cloudDbRef) {
    cloudDbRef.child("dadComments").set(dadComments).catch(err => console.warn("Cloud sync comments error:", err));
  }
}

// --- Authentication & Role Switching ---
let currentLoginRole = 'student';

function selectLoginRole(role) {
  currentLoginRole = role;
  const studentTab = document.getElementById("roleTabStudent");
  const dadTab = document.getElementById("roleTabDad");
  const usernameInput = document.getElementById("loginUsername");
  const passwordInput = document.getElementById("loginPassword");
  const errorBox = document.getElementById("loginError");
  errorBox.classList.add("hidden");

  if (role === 'student') {
    studentTab.className = "py-2.5 rounded-xl transition flex items-center justify-center gap-2 bg-white text-indigo-700 shadow-sm";
    dadTab.className = "py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900";
    usernameInput.value = "karthikeya";
    passwordInput.value = "study123";
  } else {
    dadTab.className = "py-2.5 rounded-xl transition flex items-center justify-center gap-2 bg-white text-emerald-800 shadow-sm";
    studentTab.className = "py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900";
    usernameInput.value = "dad";
    passwordInput.value = "dad123";
  }
}

function quickLogin(role) {
  selectLoginRole(role);
  document.getElementById("loginForm").dispatchEvent(new Event("submit"));
}

function togglePasswordVisibility() {
  const pwd = document.getElementById("loginPassword");
  const icon = document.getElementById("togglePwdIcon");
  if (pwd.type === "password") {
    pwd.type = "text";
    icon.className = "fa-regular fa-eye-slash";
  } else {
    pwd.type = "password";
    icon.className = "fa-regular fa-eye";
  }
}

function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const errorBox = document.getElementById("loginError");
  const errorText = document.getElementById("loginErrorText");

  // Authentication check
  let valid = false;
  let userProfile = null;

  if (username.toLowerCase() === "karthikeya") {
    valid = true;
    userProfile = {
      username: "karthikeya",
      role: "student",
      displayName: "Karthikeya"
    };
  } else if (username.toLowerCase() === "dad") {
    valid = true;
    userProfile = {
      username: "dad",
      role: "dad",
      displayName: "Dad (Reviewer)"
    };
  } else if (username.length > 0 && password.length > 0) {
    // Custom user
    valid = true;
    userProfile = {
      username: username,
      role: currentLoginRole,
      displayName: username
    };
  }

  if (valid) {
    errorBox.classList.add("hidden");
    currentUser = userProfile;
    localStorage.setItem("karthikeya_auth_user", JSON.stringify(currentUser));
    showDashboard();
  } else {
    errorText.textContent = "Please enter a valid username and password.";
    errorBox.classList.remove("hidden");
  }
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem("karthikeya_auth_user");
  showLogin();
}

function showLogin() {
  document.getElementById("loginSection").classList.remove("hidden");
  document.getElementById("appContainer").classList.add("hidden");
}

function showDashboard() {
  document.getElementById("loginSection").classList.add("hidden");
  document.getElementById("appContainer").classList.remove("hidden");

  // Update User Badge in Header
  const avatarSpan = document.getElementById("userAvatar");
  const nameSpan = document.getElementById("userDisplayName");
  const dadModeBtnLabel = document.getElementById("dadModeBtnLabel");
  const postingAuthorName = document.getElementById("postingAuthorName");

  if (currentUser.role === 'dad') {
    avatarSpan.textContent = "👨‍👦";
    nameSpan.textContent = currentUser.displayName;
    dadModeBtnLabel.textContent = "Logged in as Dad ✓";
    postingAuthorName.textContent = "Dad (Active)";
  } else {
    avatarSpan.textContent = "👦";
    nameSpan.textContent = currentUser.displayName;
    dadModeBtnLabel.textContent = "Dad Review Mode";
    postingAuthorName.textContent = "Dad";
  }

  refreshAllUI();
}

function promptDadQuickMode() {
  if (currentUser && currentUser.role === 'dad') {
    alert("You are currently logged in as Dad! You can review all tasks and add comments below.");
    document.getElementById("dadCommentText").focus();
  } else {
    const confirmSwitch = confirm("Would you like to switch to Dad's profile to leave official reviews and approvals?");
    if (confirmSwitch) {
      currentUser = {
        username: "dad",
        role: "dad",
        displayName: "Dad (Reviewer)"
      };
      localStorage.setItem("karthikeya_auth_user", JSON.stringify(currentUser));
      showDashboard();
    }
  }
}

// --- Date Navigation ---
function handleDateChange(newDate) {
  selectedDate = newDate;
  refreshAllUI();
}

function goToToday() {
  selectedDate = getTodayDateString();
  document.getElementById("selectedDateInput").value = selectedDate;
  refreshAllUI();
}

// --- UI Refresh & Renderers ---
function refreshAllUI() {
  const isToday = (selectedDate === getTodayDateString());
  document.getElementById("selectedDateBadge").textContent = isToday ? "Today" : formatDateDisplay(selectedDate);
  document.getElementById("commentsDateLabel").textContent = isToday ? "Today" : formatDateDisplay(selectedDate);

  renderDashboardStatus();
  renderTaskSheet();
  renderDadComments();
}

// --- 1. Dashboard Status: "todays task updated tick mark" ---
function renderDashboardStatus() {
  const container = document.getElementById("statusBannerContainer");
  const isToday = (selectedDate === getTodayDateString());
  
  // Tasks for the selected date
  const dateTasks = tasks.filter(t => t.date === selectedDate);
  const totalTasks = dateTasks.length;
  const completedTasks = dateTasks.filter(t => t.status === "completed").length;
  const isUpdated = totalTasks > 0;

  // Calculate total time
  let totalMinutes = 0;
  const topicTimeMap = {};

  dateTasks.forEach(t => {
    const mins = (parseInt(t.hours) || 0) * 60 + (parseInt(t.minutes) || 0);
    totalMinutes += mins;
    topicTimeMap[t.topic] = (topicTimeMap[t.topic] || 0) + mins;
  });

  const totalHrs = Math.floor(totalMinutes / 60);
  const remMins = totalMinutes % 60;
  const totalTimeFormatted = `${totalHrs}h ${remMins}m`;

  // Determine top topic
  let topTopic = "None yet";
  let topTopicTime = 0;
  for (const [topic, mins] of Object.entries(topicTimeMap)) {
    if (mins > topTopicTime) {
      topTopicTime = mins;
      topTopic = topic;
    }
  }

  // Check Dad's approval on this date
  const dateComments = dadComments.filter(c => c.date === selectedDate);
  const hasDadApproval = dateComments.some(c => c.approved);

  // Render Status Hero Banner
  if (isUpdated) {
    container.innerHTML = `
      <div class="glass-card banner-updated p-5 sm:p-6 rounded-3xl border border-emerald-300 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 shadow-md">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-3xl shadow-lg shadow-emerald-600/30 flex-shrink-0 animate-bounce">
              <i class="fa-solid fa-check"></i>
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Today's Task Updated</span>
                  <span class="inline-flex items-center justify-center w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full text-sm font-extrabold">✓</span>
                </h2>
                <span class="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <i class="fa-solid fa-circle-check mr-1 text-emerald-600"></i> Up-to-date
                </span>
              </div>
              <p class="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                Excellent! Karthikeya has logged <span class="font-bold text-slate-900">${totalTasks} task${totalTasks > 1 ? 's' : ''}</span> with <span class="font-bold text-emerald-700">${totalTimeFormatted}</span> dedicated study time for ${isToday ? "today" : formatDateDisplay(selectedDate)}.
              </p>
            </div>
          </div>
          <button onclick="toggleAddTaskForm(true)" class="no-print self-end sm:self-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-2 flex-shrink-0">
            <i class="fa-solid fa-plus"></i>
            <span>Add More Tasks</span>
          </button>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="glass-card p-5 sm:p-6 rounded-3xl border border-amber-300 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/5 shadow-sm">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-3xl shadow-lg shadow-amber-500/30 flex-shrink-0">
              <i class="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-2xl font-black text-slate-900 tracking-tight">
                  Today's Task Not Updated Yet
                </h2>
                <span class="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  Pending Update
                </span>
              </div>
              <p class="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                No study tasks or time recorded yet for ${isToday ? "today" : formatDateDisplay(selectedDate)}. Please log your daily tasks below!
              </p>
            </div>
          </div>
          <button onclick="toggleAddTaskForm(true)" class="no-print self-end sm:self-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-2 flex-shrink-0">
            <i class="fa-solid fa-pen-nib"></i>
            <span>Update Today's Tasks</span>
          </button>
        </div>
      </div>
    `;
  }

  // Update Summary Metrics
  document.getElementById("statTotalTime").textContent = totalTimeFormatted;
  document.getElementById("statTimeSubtitle").textContent = `Across ${Object.keys(topicTimeMap).length} topic(s) on this date`;

  document.getElementById("statTasksCount").textContent = `${completedTasks} / ${totalTasks}`;
  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  document.getElementById("statProgressBar").style.width = `${pct}%`;

  document.getElementById("statTopSubject").textContent = topTopic;
  if (topTopicTime > 0) {
    const tHrs = Math.floor(topTopicTime / 60);
    const tMins = topTopicTime % 60;
    document.getElementById("statTopSubjectTime").textContent = `${tHrs > 0 ? tHrs + 'h ' : ''}${tMins}m invested`;
  } else {
    document.getElementById("statTopSubjectTime").textContent = "No time logged";
  }

  const dadApprovalEl = document.getElementById("statDadApproval");
  const dadCommentsCountEl = document.getElementById("statDadCommentsCount");

  if (hasDadApproval) {
    dadApprovalEl.innerHTML = `<span class="text-emerald-700 font-bold flex items-center gap-1"><i class="fa-solid fa-star text-amber-500"></i> Dad Approved ✓</span>`;
  } else if (dateComments.length > 0) {
    dadApprovalEl.innerHTML = `<span class="text-indigo-700 font-bold flex items-center gap-1"><i class="fa-solid fa-comment-dots text-indigo-500"></i> Reviewed by Dad</span>`;
  } else {
    dadApprovalEl.innerHTML = `<span class="text-amber-700 font-bold flex items-center gap-1">⏳ Awaiting Dad's Note</span>`;
  }
  dadCommentsCountEl.textContent = `${dateComments.length} review comment${dateComments.length === 1 ? '' : 's'}`;

  // Update Dad's Stamp Badge
  const dadStamp = document.getElementById("dadApprovalStamp");
  if (hasDadApproval) {
    dadStamp.classList.remove("hidden");
    dadStamp.innerHTML = `<i class="fa-solid fa-award mr-1 text-emerald-600"></i> Dad Approved ✓`;
  } else {
    dadStamp.classList.remove("hidden");
    dadStamp.innerHTML = `<i class="fa-solid fa-pen mr-1 text-amber-600"></i> Ready for Dad Review`;
  }
}

// --- 2. Daily Task Sheet Operations ---
function renderTaskSheet() {
  const tableBody = document.getElementById("taskTableBody");
  const emptyState = document.getElementById("emptyTaskState");
  const summaryText = document.getElementById("taskSheetSummaryText");

  const dateTasks = tasks.filter(t => t.date === selectedDate);

  if (dateTasks.length === 0) {
    tableBody.innerHTML = "";
    emptyState.classList.remove("hidden");
    summaryText.textContent = "No tasks recorded for this date.";
    return;
  }

  emptyState.classList.add("hidden");
  summaryText.textContent = `Total ${dateTasks.length} task(s) logged for ${formatDateDisplay(selectedDate)}`;

  tableBody.innerHTML = dateTasks.map(task => {
    const isCompleted = task.status === "completed";
    const topicBadge = getTopicBadgeInfo(task.topic);

    let statusBadge = "";
    if (task.status === "completed") {
      statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800"><i class="fa-solid fa-check"></i> Done</span>`;
    } else if (task.status === "in_progress") {
      statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800"><i class="fa-solid fa-spinner animate-spin"></i> In Progress</span>`;
    } else {
      statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800"><i class="fa-solid fa-circle-question"></i> Need Help</span>`;
    }

    const timeString = `${task.hours > 0 ? task.hours + ' hr ' : ''}${task.minutes} min`;

    return `
      <tr class="hover:bg-slate-50/80 transition ${isCompleted ? 'bg-emerald-50/30' : ''}">
        <!-- Checkmark Box -->
        <td class="py-3.5 px-4 text-center">
          <button onclick="toggleTaskCompletion('${task.id}')" title="Toggle Completion" class="w-6 h-6 rounded-lg border flex items-center justify-center transition ${
            isCompleted 
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
              : 'border-slate-300 bg-white hover:border-emerald-500 text-transparent'
          }">
            <i class="fa-solid fa-check text-xs"></i>
          </button>
        </td>

        <!-- Topic -->
        <td class="py-3.5 px-4">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${topicBadge.bg} ${topicBadge.text} ${topicBadge.border}">
            <i class="fa-solid ${topicBadge.icon}"></i>
            <span>${task.topic}</span>
          </span>
        </td>

        <!-- Task Description -->
        <td class="py-3.5 px-4">
          <p class="text-sm font-medium ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}">
            ${escapeHtml(task.description)}
          </p>
        </td>

        <!-- Time Spent -->
        <td class="py-3.5 px-4">
          <div class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-700">
            <i class="fa-regular fa-clock text-slate-400"></i>
            <span>${timeString}</span>
          </div>
        </td>

        <!-- Status -->
        <td class="py-3.5 px-4">
          ${statusBadge}
        </td>

        <!-- Actions -->
        <td class="py-3.5 px-4 text-center no-print">
          <div class="flex items-center justify-center gap-1">
            <button onclick="editTask('${task.id}')" title="Edit Task" class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
              <i class="fa-solid fa-pen text-xs"></i>
            </button>
            <button onclick="deleteTask('${task.id}')" title="Delete Task" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
              <i class="fa-solid fa-trash text-xs"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function toggleAddTaskForm(show = null) {
  const form = document.getElementById("taskForm");
  const isHidden = form.classList.contains("hidden");
  const targetState = show !== null ? show : isHidden;

  if (targetState) {
    // Reset form to Add mode
    document.getElementById("taskId").value = "";
    document.getElementById("formTitle").innerHTML = `<i class="fa-solid fa-pen-to-square text-indigo-600"></i> Log Daily Study / Task`;
    document.getElementById("saveBtnText").textContent = "Save Daily Task";
    document.getElementById("taskDescription").value = "";
    document.getElementById("taskHours").value = 0;
    document.getElementById("taskMinutes").value = 45;
    document.getElementById("taskStatus").value = "completed";
    document.getElementById("taskTopic").value = "Mathematics";
    document.getElementById("customTopicInput").classList.add("hidden");
    form.classList.remove("hidden");
    document.getElementById("taskDescription").focus();
  } else {
    form.classList.add("hidden");
  }
}

function handleTopicSelect(value) {
  const customInput = document.getElementById("customTopicInput");
  if (value === "Custom") {
    customInput.classList.remove("hidden");
    customInput.focus();
  } else {
    customInput.classList.add("hidden");
  }
}

function handleSaveTask(e) {
  e.preventDefault();
  const idInput = document.getElementById("taskId").value;
  let topic = document.getElementById("taskTopic").value;
  if (topic === "Custom") {
    topic = document.getElementById("customTopicInput").value.trim() || "General Study";
  }

  const hours = parseInt(document.getElementById("taskHours").value) || 0;
  const minutes = parseInt(document.getElementById("taskMinutes").value) || 0;
  const status = document.getElementById("taskStatus").value;
  const description = document.getElementById("taskDescription").value.trim();

  if (!description) return;

  if (idInput) {
    // Update existing task
    const taskIndex = tasks.findIndex(t => t.id === idInput);
    if (taskIndex !== -1) {
      tasks[taskIndex] = {
        ...tasks[taskIndex],
        topic,
        description,
        hours,
        minutes,
        status,
        updatedAt: new Date().toISOString()
      };
    }
  } else {
    // Create new task
    const newTask = {
      id: "task-" + Date.now(),
      date: selectedDate,
      topic,
      description,
      hours,
      minutes,
      status,
      createdAt: new Date().toISOString()
    };
    tasks.unshift(newTask);
  }

  saveTasksToStorage();
  toggleAddTaskForm(false);
  refreshAllUI();

  // If status is completed, fire celebration
  if (status === "completed") {
    triggerCelebration();
  }
}

function editTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  toggleAddTaskForm(true);
  document.getElementById("taskId").value = task.id;
  document.getElementById("formTitle").innerHTML = `<i class="fa-solid fa-pen text-indigo-600"></i> Edit Daily Task`;
  document.getElementById("saveBtnText").textContent = "Update Task";

  const topicSelect = document.getElementById("taskTopic");
  const customInput = document.getElementById("customTopicInput");
  
  // Check if topic is in predefined options
  const optionExists = Array.from(topicSelect.options).some(o => o.value === task.topic);
  if (optionExists) {
    topicSelect.value = task.topic;
    customInput.classList.add("hidden");
  } else {
    topicSelect.value = "Custom";
    customInput.value = task.topic;
    customInput.classList.remove("hidden");
  }

  document.getElementById("taskHours").value = task.hours;
  document.getElementById("taskMinutes").value = task.minutes;
  document.getElementById("taskStatus").value = task.status;
  document.getElementById("taskDescription").value = task.description;
}

function deleteTask(taskId) {
  if (confirm("Are you sure you want to remove this task?")) {
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasksToStorage();
    refreshAllUI();
  }
}

function toggleTaskCompletion(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  task.status = (task.status === "completed") ? "in_progress" : "completed";
  saveTasksToStorage();
  refreshAllUI();

  if (task.status === "completed") {
    triggerCelebration();
  }
}

// --- 3. Dad's Comments & Review Section ---
function renderDadComments() {
  const commentsList = document.getElementById("dadCommentsList");
  const emptyComments = document.getElementById("emptyCommentsState");

  const dateComments = dadComments.filter(c => c.date === selectedDate);

  if (dateComments.length === 0) {
    commentsList.innerHTML = "";
    emptyComments.classList.remove("hidden");
    return;
  }

  emptyComments.classList.add("hidden");
  commentsList.innerHTML = dateComments.map(comment => {
    return `
      <div class="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-sm transition hover:shadow">
        <div class="flex items-center justify-between gap-2 mb-2">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm shadow-inner">
              👨‍👦
            </span>
            <div>
              <span class="text-xs font-bold text-slate-800">${escapeHtml(comment.author || 'Dad')}</span>
              <span class="text-[10px] text-slate-400 ml-1.5">${comment.timestamp}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            ${comment.approved ? `
              <span class="stamp-badge text-[10px]">
                <i class="fa-solid fa-circle-check"></i> Approved by Dad ✓
              </span>
            ` : ''}
            <button onclick="deleteDadComment('${comment.id}')" title="Delete Comment" class="no-print text-slate-300 hover:text-rose-500 text-xs p-1 transition">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
        <p class="text-sm text-slate-700 font-normal pl-10 whitespace-pre-wrap leading-relaxed">
          ${escapeHtml(comment.text)}
        </p>
      </div>
    `;
  }).join("");
}

function insertDadTag(tagText) {
  const textarea = document.getElementById("dadCommentText");
  if (textarea.value.trim().length > 0) {
    textarea.value += " " + tagText;
  } else {
    textarea.value = tagText;
  }
  textarea.focus();
}

function handleSaveDadComment(e) {
  e.preventDefault();
  const text = document.getElementById("dadCommentText").value.trim();
  const markApproved = document.getElementById("dadMarkApproved").checked;

  if (!text) return;

  const newComment = {
    id: "comment-" + Date.now(),
    date: selectedDate,
    author: (currentUser && currentUser.role === 'dad') ? "Dad" : "Dad (via Karthikeya)",
    text: text,
    approved: markApproved,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  dadComments.unshift(newComment);
  saveCommentsToStorage();

  // Reset comment input
  document.getElementById("dadCommentText").value = "";
  refreshAllUI();

  if (markApproved) {
    triggerCelebration();
  }
}

function deleteDadComment(commentId) {
  if (confirm("Remove this comment from Dad?")) {
    dadComments = dadComments.filter(c => c.id !== commentId);
    saveCommentsToStorage();
    refreshAllUI();
  }
}

// --- 4. Study Stopwatch Timer Helper ---
function toggleTimer() {
  const btn = document.getElementById("timerToggleBtn");
  const icon = document.getElementById("timerBtnIcon");
  const text = document.getElementById("timerBtnText");

  if (isTimerRunning) {
    // Pause timer
    clearInterval(timerInterval);
    isTimerRunning = false;
    icon.className = "fa-solid fa-play";
    text.textContent = "Resume";
    btn.className = "px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5";
  } else {
    // Start timer
    isTimerRunning = true;
    timerInterval = setInterval(() => {
      timerSeconds++;
      updateTimerDisplay();
    }, 1000);
    icon.className = "fa-solid fa-pause";
    text.textContent = "Pause";
    btn.className = "px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5";
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  timerSeconds = 0;
  updateTimerDisplay();
  document.getElementById("timerBtnIcon").className = "fa-solid fa-play";
  document.getElementById("timerBtnText").textContent = "Start Timer";
  document.getElementById("timerToggleBtn").className = "px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5";
}

function updateTimerDisplay() {
  const hrs = Math.floor(timerSeconds / 3600);
  const mins = Math.floor((timerSeconds % 3600) / 60);
  const secs = timerSeconds % 60;
  const formatted = 
    String(hrs).padStart(2, '0') + ":" + 
    String(mins).padStart(2, '0') + ":" + 
    String(secs).padStart(2, '0');
  document.getElementById("timerDisplay").textContent = formatted;
}

function applyTimerToNewTask() {
  const hrs = Math.floor(timerSeconds / 3600);
  const mins = Math.max(1, Math.round((timerSeconds % 3600) / 60));

  toggleAddTaskForm(true);
  document.getElementById("taskHours").value = hrs;
  document.getElementById("taskMinutes").value = mins;
  alert(`Applied logged stopwatch time (${hrs}h ${mins}m) to task!`);
}

// --- 5. Export to CSV ---
function exportToCSV() {
  const dateTasks = tasks.filter(t => t.date === selectedDate);
  if (dateTasks.length === 0) {
    alert("No tasks logged on this date to export.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Date,Topic,Task Description,Hours,Minutes,Status\n";

  dateTasks.forEach(t => {
    const escapedDesc = `"${t.description.replace(/"/g, '""')}"`;
    csvContent += `${t.date},"${t.topic}",${escapedDesc},${t.hours},${t.minutes},${t.status}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `karthikeya_tasks_${selectedDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- 6. Celebration Confetti ---
function triggerCelebration() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

// --- Utility: Escape HTML for security ---
function escapeHtml(text) {
  if (!text) return "";
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// --- 7. Real-Time Cloud Sync with Dad's Phone ---
let cloudConfig = {
  dbUrl: "https://karthikeya-tracker-default-rtdb.firebaseio.com",
  syncKey: "karthikeya-study-family"
};
let isCloudSyncActive = false;
let cloudDbRef = null;

function handleUrlSyncParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const syncDb = urlParams.get("syncDb");
  const syncKey = urlParams.get("syncKey");

  if (syncDb && syncKey) {
    cloudConfig.dbUrl = decodeURIComponent(syncDb);
    cloudConfig.syncKey = decodeURIComponent(syncKey);
    localStorage.setItem("karthikeya_cloud_sync", JSON.stringify(cloudConfig));
    // Clean URL query without reload
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  } else {
    const saved = localStorage.getItem("karthikeya_cloud_sync");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.dbUrl) cloudConfig.dbUrl = parsed.dbUrl;
        if (parsed.syncKey) cloudConfig.syncKey = parsed.syncKey;
      } catch (e) {}
    } else {
      localStorage.setItem("karthikeya_cloud_sync", JSON.stringify(cloudConfig));
    }
  }
}

function initCloudSync() {
  if (!cloudConfig.dbUrl || typeof firebase === 'undefined') {
    updateSyncUI(false, "Local Offline Mode Active");
    return;
  }

  try {
    let app = firebase.apps.length ? firebase.app() : firebase.initializeApp({
      databaseURL: cloudConfig.dbUrl
    });

    const db = firebase.database(app);
    const cleanKey = (cloudConfig.syncKey || "karthikeya-study-family").replace(/[^a-zA-Z0-9_-]/g, "");
    cloudDbRef = db.ref("karthikeya_trackers/" + cleanKey);

    isCloudSyncActive = true;
    updateSyncUI(true, "Connected to Dad's Phone (Real-Time)");

    // Listen to live tasks updates
    cloudDbRef.child("tasks").on("value", snapshot => {
      if (snapshot.exists()) {
        const remoteTasks = snapshot.val();
        if (Array.isArray(remoteTasks)) {
          tasks = remoteTasks;
          localStorage.setItem("karthikeya_tasks_data", JSON.stringify(tasks));
          refreshAllUI();
        }
      } else {
        if (tasks.length > 0) {
          cloudDbRef.child("tasks").set(tasks);
        }
      }
    }, err => {
      console.warn("Cloud tasks listener error:", err);
    });

    // Listen to live Dad's comments updates
    cloudDbRef.child("dadComments").on("value", snapshot => {
      if (snapshot.exists()) {
        const remoteComments = snapshot.val();
        if (Array.isArray(remoteComments)) {
          const hadFewer = dadComments.length < remoteComments.length;
          dadComments = remoteComments;
          localStorage.setItem("karthikeya_dad_comments", JSON.stringify(dadComments));
          refreshAllUI();

          // If a new comment was posted by Dad, celebrate!
          if (hadFewer && currentUser && currentUser.role === 'student') {
            triggerCelebration();
          }
        }
      } else {
        if (dadComments.length > 0) {
          cloudDbRef.child("dadComments").set(dadComments);
        }
      }
    }, err => {
      console.warn("Cloud comments listener error:", err);
    });

  } catch (err) {
    console.error("Firebase init error:", err);
    isCloudSyncActive = false;
    updateSyncUI(false, "Connection Error: Check URL");
  }
}

function updateSyncUI(connected, statusText) {
  const btn = document.getElementById("cloudSyncStatusBtn");
  const dot = document.getElementById("cloudSyncDot");
  const ping = document.getElementById("cloudSyncPing");
  const text = document.getElementById("cloudSyncText");
  const banner = document.getElementById("syncStatusBanner");
  const detail = document.getElementById("syncStatusDetailedText");

  if (!btn) return;

  if (connected) {
    btn.className = "no-print flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-sm";
    dot.className = "relative inline-flex rounded-full h-2 w-2 bg-emerald-500";
    ping.classList.remove("hidden");
    text.textContent = "Live Cloud Sync ✓";
    
    if (banner) {
      banner.className = "p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between bg-emerald-50 border-emerald-200 text-emerald-900";
      detail.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-600 mr-1.5"></i> Connected to Real-Time Cloud! Tasks and comments sync live with Dad's phone.`;
    }
  } else {
    btn.className = "no-print flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 shadow-sm";
    dot.className = "relative inline-flex rounded-full h-2 w-2 bg-amber-500";
    ping.classList.add("hidden");
    text.textContent = "Connect Dad's Phone";

    if (banner) {
      banner.className = "p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between bg-amber-50 border-amber-200 text-amber-900";
      detail.innerHTML = `<i class="fa-solid fa-circle-exclamation text-amber-600 mr-1.5"></i> ${statusText || 'Running in Local Mode (Tasks saved on this computer only).'}`;
    }
  }
}

function openSyncModal() {
  document.getElementById("syncModal").classList.remove("hidden");
  document.getElementById("syncDbUrlInput").value = cloudConfig.dbUrl || "";
  document.getElementById("syncKeyInput").value = cloudConfig.syncKey || "karthikeya-study-family";
  renderSyncQrCode();
}

function closeSyncModal() {
  document.getElementById("syncModal").classList.add("hidden");
}

function getDadShareLink() {
  const currentBase = window.location.origin + window.location.pathname;
  const dbUrl = encodeURIComponent(cloudConfig.dbUrl || "");
  const syncKey = encodeURIComponent(cloudConfig.syncKey || "karthikeya-study-family");
  return `${currentBase}?syncDb=${dbUrl}&syncKey=${syncKey}`;
}

function renderSyncQrCode() {
  const qrContainer = document.getElementById("syncQrCode");
  if (!qrContainer) return;
  qrContainer.innerHTML = "";

  const link = getDadShareLink();
  if (typeof QRCode !== 'undefined') {
    new QRCode(qrContainer, {
      text: link,
      width: 120,
      height: 120,
      colorDark: "#312e81",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
  } else {
    qrContainer.innerHTML = `<p class="text-[10px] text-slate-400 text-center">QR Code Ready</p>`;
  }
}

function copyDadShareLink() {
  const link = getDadShareLink();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link).then(() => {
      const btn = document.getElementById("copyShareLinkBtn");
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `<i class="fa-solid fa-check"></i> <span>Copied Link!</span>`;
      btn.classList.add("bg-emerald-600");
      setTimeout(() => {
        btn.innerHTML = originalHtml;
        btn.classList.remove("bg-emerald-600");
      }, 2500);
    }).catch(() => {
      prompt("Copy Dad's invite link below:", link);
    });
  } else {
    prompt("Copy Dad's invite link below:", link);
  }
}

function openDadLinkInNewTab() {
  window.open(getDadShareLink(), "_blank");
}

function saveAndConnectCloudSync() {
  const dbUrl = document.getElementById("syncDbUrlInput").value.trim();
  const syncKey = document.getElementById("syncKeyInput").value.trim() || "karthikeya-study-family";

  if (!dbUrl) {
    alert("Please enter your Firebase Realtime Database URL (e.g. https://your-project-id-default-rtdb.firebaseio.com)");
    return;
  }

  cloudConfig.dbUrl = dbUrl;
  cloudConfig.syncKey = syncKey;
  localStorage.setItem("karthikeya_cloud_sync", JSON.stringify(cloudConfig));

  initCloudSync();
  renderSyncQrCode();
  alert("Real-Time Cloud Sync connected! You can now scan the QR code with Dad's phone or send him the link so his phone connects too.");
  closeSyncModal();
}

function disconnectCloudSync() {
  if (confirm("Disconnect Cloud Sync and revert to local storage?")) {
    cloudConfig.dbUrl = "";
    localStorage.removeItem("karthikeya_cloud_sync");
    if (cloudDbRef) {
      cloudDbRef.off();
    }
    isCloudSyncActive = false;
    updateSyncUI(false, "Local Offline Mode Active");
    closeSyncModal();
  }
}
