// --- APPLICATION STATE ---
let currentUser = null;
let tasks = [];
let currentView = 'list';
let currentFilter = 'all';
let currentSort = 'dueDate';
let currentDate = new Date();
let isDarkMode = false;
let chartInstance = null; // To hold the chart object

// --- DOM ELEMENTS ---
const loginContainer = document.getElementById('login-container');
const registerContainer = document.getElementById('register-container');
const forgotPasswordContainer = document.getElementById('forgot-password-container');
const appContainer = document.getElementById('app-container');

// --- AUTHENTICATION FUNCTIONS ---

/**
 * Initializes the authentication flow.
 * Checks for a user in sessionStorage and either shows the app or the login screen.
 */
function initAuth() {
    // Check if user is already logged in via session storage
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showApp();
        loadUserData();
        return;
    }
    
    // If no session, clear any lingering local storage and show login
    localStorage.removeItem('currentUser');
    showLogin();
}

/**
 * Logs in a user after verifying credentials.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 */
function loginUser(email, password) {
    // In a real app, this would be an API call
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === CryptoJS.MD5(password).toString());
    
    if (user) {
        currentUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture || null
        };
        
        // Use sessionStorage to keep user logged in only for the session
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showApp();
        loadUserData();
    } else {
        alert('Invalid email or password');
    }
}

/**
 * Registers a new user and logs them in.
 * @param {string} name - The user's full name.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 */
function registerUser(name, email, password) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.some(u => u.email === email)) {
        alert('User with this email already exists');
        return;
    }
    
    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password: CryptoJS.MD5(password).toString(), // In a real app, use proper hashing
        profilePicture: null, // Initialize profile picture
        settings: getDefaultSettings(),
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Auto login after registration
    loginUser(email, password);
}

/**
 * Simulates sending a password reset email.
 * @param {string} email - The user's email.
 */
function resetPassword(email) {
    // In a real app, this would send an email
    alert(`Password reset instructions have been sent to ${email}`);
    showLogin();
}

/**
 * Logs out the current user, clearing session and showing the login screen.
 */
function logoutUser() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    // Also clear local storage just in case
    localStorage.removeItem('currentUser');
    showLogin();
}

/**
 * Toggles the visibility of a password input field.
 * @param {string} inputId - The ID of the password input.
 * @param {HTMLElement} toggleElement - The eye icon element.
 */
function togglePasswordVisibility(inputId, toggleElement) {
    const passwordInput = document.getElementById(inputId);
    const icon = toggleElement.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// --- UI VISIBILITY FUNCTIONS ---

function showLogin() {
    loginContainer.style.display = 'flex';
    registerContainer.style.display = 'none';
    forgotPasswordContainer.style.display = 'none';
    appContainer.style.display = 'none';
}

function showRegister() {
    loginContainer.style.display = 'none';
    registerContainer.style.display = 'flex';
    forgotPasswordContainer.style.display = 'none';
    appContainer.style.display = 'none';
}

function showForgotPassword() {
    loginContainer.style.display = 'none';
    registerContainer.style.display = 'none';
    forgotPasswordContainer.style.display = 'flex';
    appContainer.style.display = 'none';
}

function showApp() {
    loginContainer.style.display = 'none';
    registerContainer.style.display = 'none';
    forgotPasswordContainer.style.display = 'none';
    appContainer.style.display = 'flex';
}

// --- USER DATA MANAGEMENT ---

/**
 * Loads tasks and settings for the current user from localStorage.
 */
function loadUserData() {
    if (!currentUser) return;
    const userData = JSON.parse(localStorage.getItem(`userData_${currentUser.id}`) || '{}');
    
    tasks = userData.tasks || [];
    
    // Apply user settings
    applyUserSettings(userData.settings || getDefaultSettings());
    
    // Initialize UI
    updateStats();
    renderTasks();
    initCalendar();
}

/**
 * Saves the current tasks and settings for the user to localStorage.
 */
function saveUserData() {
    if (!currentUser) return;
    const settings = {
        darkMode: isDarkMode,
        defaultView: document.getElementById('setting-default-view').value,
        startPage: document.getElementById('setting-start-page').value,
        autoDarkMode: document.getElementById('setting-auto-dark').checked,
        taskReminders: document.getElementById('setting-task-reminders').checked,
        dailyDigest: document.getElementById('setting-daily-digest').checked,
        overdueAlerts: document.getElementById('setting-overdue-alerts').checked,
        confirmDelete: document.getElementById('setting-confirm-delete').checked,
        autoArchive: document.getElementById('setting-auto-archive').checked,
        defaultPriority: document.getElementById('setting-default-priority').value,
        dataBackup: document.getElementById('setting-data-backup').checked,
    };
    
    const userData = { tasks, settings };
    localStorage.setItem(`userData_${currentUser.id}`, JSON.stringify(userData));
}

/**
 * Returns a default settings object for new users.
 */
function getDefaultSettings() {
    return {
        darkMode: false,
        defaultView: 'list',
        startPage: 'today',
        autoDarkMode: false,
        taskReminders: true,
        dailyDigest: false,
        overdueAlerts: true,
        confirmDelete: true,
        autoArchive: false,
        defaultPriority: 'medium',
        dataBackup: false
    };
}

/**
 * Applies user settings to the UI.
 * @param {object} settings - The user's settings object.
 */
function applyUserSettings(settings) {
    if (!settings) return;
    
    // Apply dark mode
    isDarkMode = settings.darkMode || false;
    document.body.classList.toggle('dark-mode', isDarkMode);
    updateThemeToggleIcon();
    
    // Apply other settings as needed
}

// --- TASK MANAGEMENT ---

function addTask(task) {
    const newTask = {
        id: Date.now().toString(),
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate || null,
        dueTime: task.dueTime || null,
        priority: task.priority || 'medium',
        category: task.category || 'work',
        completed: false,
        important: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    saveUserData();
    renderTasks();
    updateStats();
}

function updateTask(taskId, updates) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], ...updates, updatedAt: new Date().toISOString() };
        saveUserData();
        renderTasks();
        updateStats();
    }
}

function deleteTask(taskId) {
    const userData = JSON.parse(localStorage.getItem(`userData_${currentUser.id}`) || '{}');
    const settings = userData.settings || getDefaultSettings();
    
    if (settings.confirmDelete && !confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    tasks = tasks.filter(task => task.id !== taskId);
    saveUserData();
    renderTasks();
    updateStats();
}

function toggleTaskCompletion(taskId) {
    const task = tasks.find(task => task.id === taskId);
    if (task) {
        updateTask(taskId, { completed: !task.completed });
    }
}

function toggleTaskImportance(taskId) {
    const task = tasks.find(task => task.id === taskId);
    if (task) {
        updateTask(taskId, { important: !task.important });
    }
}

function getFilteredTasks() {
    let filteredTasks = [...tasks];
    
    // Apply filter
    switch (currentFilter) {
        case 'important':
            filteredTasks = filteredTasks.filter(task => task.important && !task.completed);
            break;
        case 'today':
            const today = new Date().toDateString();
            filteredTasks = filteredTasks.filter(task => {
                if (!task.dueDate) return false;
                return new Date(task.dueDate).toDateString() === today;
            });
            break;
        case 'upcoming':
            const tomorrow = new Date();
            tomorrow.setHours(0, 0, 0, 0);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            filteredTasks = filteredTasks.filter(task => {
                if (!task.dueDate) return false;
                const dueDate = new Date(task.dueDate);
                return dueDate >= tomorrow;
            });
            break;
        case 'completed':
            filteredTasks = filteredTasks.filter(task => task.completed);
            break;
    }
    
    // Apply search
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    if (searchTerm) {
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(searchTerm) || 
            (task.description && task.description.toLowerCase().includes(searchTerm))
        );
    }
    
    // Apply sorting
    filteredTasks.sort((a, b) => {
        switch (currentSort) {
            case 'dueDate':
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            case 'priority':
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            case 'title':
                return a.title.localeCompare(b.title);
            case 'created':
                return new Date(b.createdAt) - new Date(a.createdAt); // Newest first
            default:
                return 0;
        }
    });
    
    return filteredTasks;
}

// --- UI RENDERING ---

function renderTasks() {
    const tasksToRender = getFilteredTasks();
    
    if (currentView === 'list' || currentView === 'grid') {
        renderListView(tasksToRender);
        document.getElementById('task-list').style.display = 'flex';
        document.getElementById('board-view').style.display = 'none';
        document.getElementById('calendar-view').style.display = 'none';
        document.getElementById('stats-view').style.display = 'none';
    } else if (currentView === 'board') {
        renderBoardView(tasksToRender);
        document.getElementById('task-list').style.display = 'none';
        document.getElementById('board-view').style.display = 'grid';
        document.getElementById('calendar-view').style.display = 'none';
        document.getElementById('stats-view').style.display = 'none';
    } else if (currentView === 'calendar') {
        renderCalendar();
        document.getElementById('task-list').style.display = 'none';
        document.getElementById('board-view').style.display = 'none';
        document.getElementById('calendar-view').style.display = 'block';
        document.getElementById('stats-view').style.display = 'none';
    } else if (currentView === 'stats') {
        renderStatsView();
        document.getElementById('task-list').style.display = 'none';
        document.getElementById('board-view').style.display = 'none';
        document.getElementById('calendar-view').style.display = 'none';
        document.getElementById('stats-view').style.display = 'block';
    }
}

function renderListView(tasksToRender) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    
    if (tasksToRender.length === 0) {
        taskList.innerHTML = `<p>No tasks found. Try changing your filters or add a new task!</p>`;
        return;
    }
    
    tasksToRender.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskElement.dataset.id = task.id;
        
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const formattedDate = dueDate ? dueDate.toLocaleDateString() : 'No due date';
        
        taskElement.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-content">
                <div class="task-title">${task.title}</div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                <div class="task-meta">
                    <div class="task-date"><i class="fas fa-calendar"></i> ${formattedDate}</div>
                    <div class="task-category"><i class="fas fa-tag"></i> ${task.category}</div>
                    <div class="task-priority ${task.priority}"><i class="fas fa-flag"></i> ${task.priority}</div>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-important"><i class="fas fa-star ${task.important ? 'active' : ''}"></i></button>
                <button class="task-edit"><i class="fas fa-edit"></i></button>
                <button class="task-delete"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        taskList.appendChild(taskElement);
    });
}

function renderBoardView(tasksToRender) {
    const todoColumn = document.getElementById('todo-column');
    const progressColumn = document.getElementById('progress-column');
    const completedColumn = document.getElementById('completed-column');
    
    todoColumn.innerHTML = '';
    progressColumn.innerHTML = '';
    completedColumn.innerHTML = '';
    
    tasksToRender.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'board-task';
        taskElement.dataset.id = task.id;
        taskElement.draggable = true;
        
        taskElement.innerHTML = `
            <div class="task-title">${task.title}</div>
            <div class="task-priority ${task.priority}">${task.priority}</div>
        `;
        
        if (task.completed) {
            completedColumn.appendChild(taskElement);
        } else {
            todoColumn.appendChild(taskElement);
        }
    });
}

function renderCalendar() {
    const calendarDays = document.getElementById('calendar-days');
    const monthYear = document.getElementById('calendar-month-year');
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    monthYear.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    calendarDays.innerHTML = '';
    
    for (let i = firstDay; i > 0; i--) {
        calendarDays.innerHTML += `<div class="calendar-day other-month">${daysInPrevMonth - i + 1}</div>`;
    }
    
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        let classes = 'calendar-day';
        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            classes += ' today';
        }
        
        const hasTasks = tasks.some(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return taskDate.getDate() === i && taskDate.getMonth() === month && taskDate.getFullYear() === year;
        });
        
        if (hasTasks) {
            classes += ' has-tasks';
        }
        
        calendarDays.innerHTML += `<div class="${classes}" data-date="${year}-${month + 1}-${i}">${i}</div>`;
    }
}

function renderStatsView() {
    if (chartInstance) {
        chartInstance.destroy();
    }
    initTaskChart();
}

function initTaskChart() {
    const ctx = document.getElementById('task-chart').getContext('2d');
    const categories = ['work', 'personal', 'health', 'shopping', 'other'];
    const data = categories.map(category => tasks.filter(task => task.category === category).length);
    
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1)),
            datasets: [{
                label: 'Tasks by Category',
                data: data,
                backgroundColor: ['#4361ee', '#7209b7', '#06d6a0', '#ffd166', '#ef476f'],
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

function updateStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const overdueTasks = tasks.filter(task => !task.completed && task.dueDate && new Date(task.dueDate) < new Date()).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    document.getElementById('total-tasks').textContent = totalTasks;
    document.getElementById('completed-tasks').textContent = completedTasks;
    document.getElementById('overdue-tasks').textContent = overdueTasks;
    document.getElementById('productivity').textContent = `${completionRate}%`;
    document.getElementById('completion-rate').textContent = `${completionRate}% completion rate`;
}

// --- MODAL FUNCTIONS ---

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function openEditTaskModal(task) {
    document.getElementById('edit-task-id').value = task.id;
    document.getElementById('edit-task-title').value = task.title;
    document.getElementById('edit-task-description').value = task.description || '';
    document.getElementById('edit-task-date').value = task.dueDate || '';
    document.getElementById('edit-task-time').value = task.dueTime || '';
    document.getElementById('edit-task-priority').value = task.priority;
    document.getElementById('edit-task-category').value = task.category;
    openModal('edit-task-modal');
}

function openDayTasksModal(dateString) {
    const date = new Date(dateString);
    const dayTasks = tasks.filter(task => task.dueDate && new Date(task.dueDate).toDateString() === date.toDateString());
    
    document.getElementById('day-tasks-title').textContent = `Tasks for ${date.toLocaleDateString()}`;
    const list = document.getElementById('day-tasks-list');
    list.innerHTML = '';
    
    if (dayTasks.length > 0) {
        dayTasks.forEach(task => {
            list.innerHTML += `<div class="task-item ${task.completed ? 'completed' : ''}">${task.title}</div>`;
        });
    } else {
        list.innerHTML = '<p>No tasks for this day.</p>';
    }
    
    openModal('day-tasks-modal');
}

function openProfileModal() {
    const user = JSON.parse(localStorage.getItem('users')).find(u => u.id === currentUser.id);
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('profile-name-input').value = user.name;
    document.getElementById('profile-email-input').value = user.email;
    document.getElementById('profile-avatar-img').src = user.profilePicture || 'https://placehold.co/100x100/E9ECEF/6C757D?text=User';
    openModal('profile-modal');
}

function openSettingsModal() {
    const userData = JSON.parse(localStorage.getItem(`userData_${currentUser.id}`) || '{}');
    const settings = userData.settings || getDefaultSettings();
    
    Object.keys(settings).forEach(key => {
        const element = document.getElementById(`setting-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = settings[key];
            } else {
                element.value = settings[key];
            }
        }
    });
    openModal('settings-modal');
}

// --- THEME, VIEW, & FILTER SWITCHING ---

function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    updateThemeToggleIcon();
    saveUserData();
}

function updateThemeToggleIcon() {
    const themeIcon = document.querySelector('#theme-toggle i');
    const themeText = document.querySelector('#theme-toggle span');
    if (isDarkMode) {
        themeIcon.classList.replace('fa-moon', 'fa-sun');
        themeText.textContent = 'Light Mode';
    } else {
        themeIcon.classList.replace('fa-sun', 'fa-moon');
        themeText.textContent = 'Dark Mode';
    }
}

function switchView(view) {
    currentView = view;
    document.querySelectorAll('.view-btn, .nav-item[data-view]').forEach(el => {
        el.classList.toggle('active', el.dataset.view === view);
    });
    renderTasks();
}

function switchFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.nav-item[data-filter]').forEach(el => {
        el.classList.toggle('active', el.dataset.filter === filter);
    });
    renderTasks();
}

/**
 * Initializes calendar-related event listeners.
 */
function initCalendar() {
    document.getElementById('prev-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    document.getElementById('next-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    document.getElementById('calendar-days').addEventListener('click', e => {
        if (e.target.classList.contains('calendar-day') && e.target.dataset.date) {
            openDayTasksModal(e.target.dataset.date);
        }
    });
}

// --- EVENT LISTENERS INITIALIZATION ---

function initEventListeners() {
    // --- Auth Forms ---
    document.getElementById('login-form').addEventListener('submit', e => {
        e.preventDefault();
        loginUser(document.getElementById('login-email').value, document.getElementById('login-password').value);
    });
    document.getElementById('register-form').addEventListener('submit', e => {
        e.preventDefault();
        const pass = document.getElementById('register-password').value;
        if (pass !== document.getElementById('register-confirm-password').value) {
            alert('Passwords do not match');
            return;
        }
        registerUser(document.getElementById('register-name').value, document.getElementById('register-email').value, pass);
    });
    document.getElementById('forgot-password-form').addEventListener('submit', e => {
        e.preventDefault();
        resetPassword(document.getElementById('reset-email').value);
    });

    // --- Auth Navigation ---
    document.getElementById('show-register').addEventListener('click', e => { e.preventDefault(); showRegister(); });
    document.getElementById('show-login').addEventListener('click', e => { e.preventDefault(); showLogin(); });
    document.getElementById('forgot-password').addEventListener('click', e => { e.preventDefault(); showForgotPassword(); });
    document.getElementById('back-to-login').addEventListener('click', e => { e.preventDefault(); showLogin(); });
    document.getElementById('logout-btn').addEventListener('click', logoutUser);

    // --- Password Toggles ---
    document.getElementById('password-toggle').addEventListener('click', function() { togglePasswordVisibility('login-password', this); });
    document.getElementById('register-password-toggle').addEventListener('click', function() { togglePasswordVisibility('register-password', this); });

    // --- Main App Actions ---
    document.getElementById('add-task-btn').addEventListener('click', () => openModal('task-modal'));
    document.getElementById('search-btn').addEventListener('click', () => {
        const bar = document.getElementById('search-bar');
        bar.style.display = bar.style.display === 'none' ? 'flex' : 'none';
    });
    document.getElementById('close-search').addEventListener('click', () => {
        document.getElementById('search-bar').style.display = 'none';
    });
    document.getElementById('search-input').addEventListener('input', renderTasks);

    // --- Filter Actions ---
    document.getElementById('filter-btn').addEventListener('click', () => {
        const bar = document.getElementById('filter-bar');
        bar.style.display = bar.style.display === 'none' ? 'flex' : 'none';
    });
    document.getElementById('apply-filters').addEventListener('click', () => {
        currentSort = document.getElementById('filter-sort').value;
        renderTasks();
        document.getElementById('filter-bar').style.display = 'none';
    });
    document.getElementById('clear-filters').addEventListener('click', () => {
        document.getElementById('filter-priority').value = 'all';
        document.getElementById('filter-category').value = 'all';
        document.getElementById('filter-status').value = 'all';
        document.getElementById('filter-sort').value = 'dueDate';
        currentFilter = 'all';
        currentSort = 'dueDate';
        document.querySelectorAll('.nav-item[data-filter]').forEach(el => {
            el.classList.remove('active');
        });
        document.querySelector('.nav-item[data-filter="all"]')?.classList.add('active');
        renderTasks();
        document.getElementById('filter-bar').style.display = 'none';
    });

    // --- Task List Actions (Event Delegation) ---
    document.getElementById('task-list').addEventListener('click', e => {
        const target = e.target;
        const taskItem = target.closest('.task-item');
        if (!taskItem) return;
        const taskId = taskItem.dataset.id;
        
        if (target.closest('.task-checkbox')) {
            toggleTaskCompletion(taskId);
        } else if (target.closest('.task-important')) {
            toggleTaskImportance(taskId);
        } else if (target.closest('.task-edit')) {
            const task = tasks.find(t => t.id === taskId);
            if (task) openEditTaskModal(task);
        } else if (target.closest('.task-delete')) {
            deleteTask(taskId);
        }
    });

    // --- Modals ---
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) {
                overlay.style.display = 'none';
            }
        });
    });
    document.querySelectorAll('.modal-close, [id^="cancel-"], #close-day-tasks').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal-overlay').style.display = 'none';
        });
    });

    // --- Modal Forms ---
    document.getElementById('task-form').addEventListener('submit', e => {
        e.preventDefault();
        addTask({
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            dueDate: document.getElementById('task-date').value,
            dueTime: document.getElementById('task-time').value,
            priority: document.getElementById('task-priority').value,
            category: document.getElementById('task-category').value
        });
        e.target.reset();
        closeModal('task-modal');
    });
    document.getElementById('edit-task-form').addEventListener('submit', e => {
        e.preventDefault();
        updateTask(document.getElementById('edit-task-id').value, {
            title: document.getElementById('edit-task-title').value,
            description: document.getElementById('edit-task-description').value,
            dueDate: document.getElementById('edit-task-date').value,
            dueTime: document.getElementById('edit-task-time').value,
            priority: document.getElementById('edit-task-priority').value,
            category: document.getElementById('edit-task-category').value
        });
        closeModal('edit-task-modal');
    });
    document.getElementById('profile-form').addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('profile-name-input').value;
        const currentPassword = document.getElementById('profile-current-password').value;
        const newPassword = document.getElementById('profile-new-password').value;
        const confirmPassword = document.getElementById('profile-confirm-password').value;
        const profilePicData = document.getElementById('profile-avatar-img').src;

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === currentUser.id);

        if (userIndex !== -1) {
            users[userIndex].name = name;
            users[userIndex].profilePicture = profilePicData;

            if (currentPassword && newPassword) {
                if (newPassword !== confirmPassword) {
                    return alert('New passwords do not match.');
                }
                if (users[userIndex].password !== CryptoJS.MD5(currentPassword).toString()) {
                    return alert('Current password is incorrect.');
                }
                users[userIndex].password = CryptoJS.MD5(newPassword).toString();
            }
            localStorage.setItem('users', JSON.stringify(users));
            currentUser.name = name;
            currentUser.profilePicture = profilePicData;
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            alert('Profile updated!');
            closeModal('profile-modal');
        }
    });
    document.getElementById('settings-form').addEventListener('submit', e => {
        e.preventDefault();
        saveUserData();
        alert('Settings saved!');
        closeModal('settings-modal');
    });
    
    // --- Profile Picture Upload ---
    document.getElementById('profile-picture-input').addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('profile-avatar-img').src = event.target.result;
            }
            reader.readAsDataURL(file);
        }
    });
    
    // --- Sidebar and View Navigation ---
    document.querySelectorAll('.nav-item[data-view], .view-btn').forEach(el => {
        el.addEventListener('click', () => switchView(el.dataset.view));
    });
    document.querySelectorAll('.nav-item[data-filter]').forEach(el => {
        el.addEventListener('click', () => switchFilter(el.dataset.filter));
    });
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('profile-btn').addEventListener('click', openProfileModal);
    document.getElementById('settings-btn').addEventListener('click', openSettingsModal);
}

// --- INITIALIZE THE APPLICATION ---
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    initAuth();
});