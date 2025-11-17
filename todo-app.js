// ==========================================
// Application State
// ==========================================
class TodoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentEditId = null;
        this.draggedElement = null;
        this.filters = {
            search: '',
            status: 'all',
            category: 'all',
            priority: 'all'
        };
        this.sortBy = 'created';
        this.counterIntervals = {}; // Track active counter animations

        this.init();
    }

    // ==========================================
    // Initialization
    // ==========================================
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.initTheme();
        this.renderTasks();
        this.updateStats();
        this.checkNotifications();

        // Check notifications every minute
        setInterval(() => this.checkNotifications(), 60000);
    }

    cacheDOM() {
        // Form elements
        this.taskForm = document.getElementById('taskForm');
        this.taskInput = document.getElementById('taskInput');
        this.taskCategory = document.getElementById('taskCategory');
        this.taskPriority = document.getElementById('taskPriority');
        this.taskDueDate = document.getElementById('taskDueDate');
        this.taskDueTime = document.getElementById('taskDueTime');

        // Search and filters
        this.searchInput = document.getElementById('searchInput');
        this.filterStatus = document.getElementById('filterStatus');
        this.filterCategory = document.getElementById('filterCategory');
        this.filterPriority = document.getElementById('filterPriority');
        this.clearFiltersBtn = document.getElementById('clearFilters');
        this.sortBySelect = document.getElementById('sortBy');

        // Task list
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');

        // Stats
        this.totalTasksEl = document.getElementById('totalTasks');
        this.activeTasksEl = document.getElementById('activeTasks');
        this.completedTasksEl = document.getElementById('completedTasks');

        // Theme toggle
        this.themeToggle = document.getElementById('themeToggle');

        // Modal
        this.editModal = document.getElementById('editModal');
        this.editForm = document.getElementById('editForm');
        this.editTaskInput = document.getElementById('editTaskInput');
        this.editTaskCategory = document.getElementById('editTaskCategory');
        this.editTaskPriority = document.getElementById('editTaskPriority');
        this.editTaskDueDate = document.getElementById('editTaskDueDate');
        this.editTaskDueTime = document.getElementById('editTaskDueTime');
        this.closeModalBtn = document.getElementById('closeModal');
        this.cancelEditBtn = document.getElementById('cancelEdit');
    }

    bindEvents() {
        // Form submission
        this.taskForm.addEventListener('submit', (e) => this.handleAddTask(e));

        // Search and filters
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
        this.filterStatus.addEventListener('change', () => this.handleFilterChange());
        this.filterCategory.addEventListener('change', () => this.handleFilterChange());
        this.filterPriority.addEventListener('change', () => this.handleFilterChange());
        this.clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        this.sortBySelect.addEventListener('change', (e) => this.handleSort(e));

        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Modal
        this.editForm.addEventListener('submit', (e) => this.handleEditTask(e));
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.cancelEditBtn.addEventListener('click', () => this.closeModal());
        this.editModal.addEventListener('click', (e) => {
            if (e.target === this.editModal) this.closeModal();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    // ==========================================
    // Theme Management
    // ==========================================
    initTheme() {
        // Check for saved theme preference or default to system preference
        const savedTheme = localStorage.getItem('theme');
        const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const theme = savedTheme || systemPreference;

        document.documentElement.setAttribute('data-theme', theme);

        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            }
        });
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

    // ==========================================
    // Task Management - CRUD Operations
    // ==========================================
    handleAddTask(e) {
        e.preventDefault();

        const task = {
            id: Date.now().toString(),
            title: this.taskInput.value.trim(),
            category: this.taskCategory.value,
            priority: this.taskPriority.value,
            dueDate: this.taskDueDate.value,
            dueTime: this.taskDueTime.value,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.taskForm.reset();
        this.taskInput.focus();

        this.showNotification('Task added successfully!', 'success');
    }

    openEditModal(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        this.currentEditId = id;
        this.editTaskInput.value = task.title;
        this.editTaskCategory.value = task.category;
        this.editTaskPriority.value = task.priority;
        this.editTaskDueDate.value = task.dueDate || '';
        this.editTaskDueTime.value = task.dueTime || '';

        this.editModal.classList.add('show');
        this.editModal.setAttribute('aria-hidden', 'false');
        this.editTaskInput.focus();
    }

    handleEditTask(e) {
        e.preventDefault();

        const taskIndex = this.tasks.findIndex(t => t.id === this.currentEditId);
        if (taskIndex === -1) return;

        this.tasks[taskIndex] = {
            ...this.tasks[taskIndex],
            title: this.editTaskInput.value.trim(),
            category: this.editTaskCategory.value,
            priority: this.editTaskPriority.value,
            dueDate: this.editTaskDueDate.value,
            dueTime: this.editTaskDueTime.value,
            updatedAt: new Date().toISOString()
        };

        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.closeModal();

        this.showNotification('Task updated successfully!', 'success');
    }

    deleteTask(id) {
        if (!confirm('Are you sure you want to delete this task?')) return;

        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();

        this.showNotification('Task deleted successfully!', 'success');
    }

    toggleComplete(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;

        this.saveTasks();
        this.renderTasks();
        this.updateStats();
    }

    closeModal() {
        this.editModal.classList.remove('show');
        this.editModal.setAttribute('aria-hidden', 'true');
        this.currentEditId = null;
        this.editForm.reset();
    }

    // ==========================================
    // Search and Filtering
    // ==========================================
    handleSearch(e) {
        this.filters.search = e.target.value.toLowerCase().trim();
        this.renderTasks();
    }

    handleFilterChange() {
        this.filters.status = this.filterStatus.value;
        this.filters.category = this.filterCategory.value;
        this.filters.priority = this.filterPriority.value;
        this.renderTasks();
    }

    clearFilters() {
        this.filters = {
            search: '',
            status: 'all',
            category: 'all',
            priority: 'all'
        };

        this.searchInput.value = '';
        this.filterStatus.value = 'all';
        this.filterCategory.value = 'all';
        this.filterPriority.value = 'all';

        this.renderTasks();
    }

    handleSort(e) {
        this.sortBy = e.target.value;
        this.renderTasks();
    }

    getFilteredTasks() {
        return this.tasks.filter(task => {
            // Search filter
            if (this.filters.search && !task.title.toLowerCase().includes(this.filters.search)) {
                return false;
            }

            // Status filter
            if (this.filters.status === 'active' && task.completed) return false;
            if (this.filters.status === 'completed' && !task.completed) return false;

            // Category filter
            if (this.filters.category !== 'all' && task.category !== this.filters.category) {
                return false;
            }

            // Priority filter
            if (this.filters.priority !== 'all' && task.priority !== this.filters.priority) {
                return false;
            }

            return true;
        });
    }

    getSortedTasks(tasks) {
        const sorted = [...tasks];

        switch (this.sortBy) {
            case 'created':
                return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            case 'dueDate':
                return sorted.sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate + ' ' + (a.dueTime || '00:00')) -
                           new Date(b.dueDate + ' ' + (b.dueTime || '00:00'));
                });

            case 'priority':
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

            case 'title':
                return sorted.sort((a, b) => a.title.localeCompare(b.title));

            default:
                return sorted;
        }
    }

    // ==========================================
    // Drag and Drop
    // ==========================================
    handleDragStart(e, id) {
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.innerHTML);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');

        // Remove all drag-over classes
        document.querySelectorAll('.task-item').forEach(item => {
            item.classList.remove('drag-over');
        });
    }

    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }

        e.dataTransfer.dropEffect = 'move';

        const afterElement = this.getDragAfterElement(e.clientY);
        const draggable = document.querySelector('.dragging');

        if (afterElement == null) {
            this.taskList.appendChild(draggable);
        } else {
            this.taskList.insertBefore(draggable, afterElement);
        }

        return false;
    }

    handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        // Reorder tasks based on DOM order
        const taskElements = Array.from(this.taskList.children);
        const newOrder = taskElements.map(el => el.dataset.id);

        this.tasks.sort((a, b) => {
            return newOrder.indexOf(a.id) - newOrder.indexOf(b.id);
        });

        this.saveTasks();
        this.renderTasks();

        return false;
    }

    getDragAfterElement(y) {
        const draggableElements = [...this.taskList.querySelectorAll('.task-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // ==========================================
    // Rendering
    // ==========================================
    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        const sortedTasks = this.getSortedTasks(filteredTasks);

        this.taskList.innerHTML = '';

        if (sortedTasks.length === 0) {
            this.emptyState.classList.add('show');
            return;
        }

        this.emptyState.classList.remove('show');

        sortedTasks.forEach(task => {
            const li = this.createTaskElement(task);
            this.taskList.appendChild(li);
        });
    }

    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item priority-${task.priority}${task.completed ? ' completed' : ''}`;
        li.dataset.id = task.id;
        li.draggable = true;

        // Drag events
        li.addEventListener('dragstart', (e) => this.handleDragStart(e, task.id));
        li.addEventListener('dragend', (e) => this.handleDragEnd(e));

        // Checkbox
        const checkbox = document.createElement('div');
        checkbox.className = `task-checkbox${task.completed ? ' checked' : ''}`;
        checkbox.draggable = false;
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.toggleComplete(task.id);
        });
        checkbox.addEventListener('dragstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        // Task details
        const details = document.createElement('div');
        details.className = 'task-details';

        const content = document.createElement('div');
        content.className = 'task-content';
        content.textContent = task.title;

        const meta = document.createElement('div');
        meta.className = 'task-meta';

        // Category badge
        const categoryBadge = document.createElement('span');
        categoryBadge.className = `task-badge category-badge category-${task.category}`;
        categoryBadge.textContent = task.category;
        meta.appendChild(categoryBadge);

        // Priority badge
        const priorityBadge = document.createElement('span');
        priorityBadge.className = `task-badge priority-badge priority-${task.priority}`;
        priorityBadge.textContent = task.priority;
        meta.appendChild(priorityBadge);

        // Due date badge
        if (task.dueDate) {
            const dueDateBadge = document.createElement('span');
            dueDateBadge.className = 'task-badge due-date-badge';

            const dueDateTime = new Date(task.dueDate + ' ' + (task.dueTime || '00:00'));
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const dueDay = new Date(dueDateTime.getFullYear(), dueDateTime.getMonth(), dueDateTime.getDate());

            if (dueDay < today && !task.completed) {
                dueDateBadge.classList.add('overdue');
                dueDateBadge.innerHTML = `
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    Overdue
                `;
            } else if (dueDay.getTime() === today.getTime()) {
                dueDateBadge.classList.add('today');
                dueDateBadge.innerHTML = `
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    Today
                `;
            } else {
                dueDateBadge.innerHTML = `
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Due: ${this.formatDate(dueDateTime)}
                `;
            }

            meta.appendChild(dueDateBadge);
        }

        details.appendChild(content);
        details.appendChild(meta);

        // Actions
        const actions = document.createElement('div');
        actions.className = 'task-actions';
        actions.draggable = false;
        actions.addEventListener('dragstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        const editBtn = document.createElement('button');
        editBtn.className = 'task-btn edit-btn';
        editBtn.draggable = false;
        editBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
        `;
        editBtn.setAttribute('aria-label', 'Edit task');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.openEditModal(task.id);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'task-btn delete-btn';
        deleteBtn.draggable = false;
        deleteBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
        `;
        deleteBtn.setAttribute('aria-label', 'Delete task');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.deleteTask(task.id);
        });

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(checkbox);
        li.appendChild(details);
        li.appendChild(actions);

        return li;
    }

    formatDate(date) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dueDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        let dateStr = '';
        if (dueDay.getTime() === today.getTime()) {
            dateStr = 'Today';
        } else if (dueDay.getTime() === tomorrow.getTime()) {
            dateStr = 'Tomorrow';
        } else {
            const options = { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined };
            dateStr = date.toLocaleDateString('en-US', options);
        }

        if (date.getHours() !== 0 || date.getMinutes() !== 0) {
            const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
            return `${dateStr} at ${date.toLocaleTimeString('en-US', timeOptions)}`;
        }

        return dateStr;
    }

    // ==========================================
    // Statistics
    // ==========================================
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const active = total - completed;

        this.animateCounter(this.totalTasksEl, total);
        this.animateCounter(this.activeTasksEl, active);
        this.animateCounter(this.completedTasksEl, completed);
    }

    animateCounter(element, target) {
        // Clear any existing animation for this element
        const elementId = element.id;
        if (this.counterIntervals[elementId]) {
            clearInterval(this.counterIntervals[elementId]);
            delete this.counterIntervals[elementId];
        }

        const current = parseInt(element.textContent) || 0;

        // If no change needed, just set the value
        if (current === target) {
            return;
        }

        const increment = target > current ? 1 : -1;
        const duration = 300;
        const steps = Math.abs(target - current);
        const stepDuration = steps > 0 ? duration / steps : 0;

        let count = current;
        this.counterIntervals[elementId] = setInterval(() => {
            count += increment;
            element.textContent = count;

            if (count === target) {
                clearInterval(this.counterIntervals[elementId]);
                delete this.counterIntervals[elementId];
            }
        }, stepDuration);
    }

    // ==========================================
    // Notifications
    // ==========================================
    checkNotifications() {
        if (!('Notification' in window)) return;

        // Request permission if not granted
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        if (Notification.permission !== 'granted') return;

        const now = new Date();
        const upcomingTasks = this.tasks.filter(task => {
            if (task.completed || !task.dueDate) return false;

            const dueDateTime = new Date(task.dueDate + ' ' + (task.dueTime || '00:00'));
            const timeDiff = dueDateTime - now;
            const minutesDiff = Math.floor(timeDiff / 60000);

            // Notify for tasks due in 30 minutes or less, but not already passed
            return minutesDiff > 0 && minutesDiff <= 30;
        });

        upcomingTasks.forEach(task => {
            // Check if we already notified about this task
            const notifiedKey = `notified_${task.id}`;
            if (sessionStorage.getItem(notifiedKey)) return;

            const dueDateTime = new Date(task.dueDate + ' ' + (task.dueTime || '00:00'));
            const timeDiff = dueDateTime - now;
            const minutesDiff = Math.floor(timeDiff / 60000);

            new Notification('Task Reminder', {
                body: `"${task.title}" is due in ${minutesDiff} minute${minutesDiff > 1 ? 's' : ''}!`,
                icon: '/favicon.ico',
                tag: task.id
            });

            // Mark as notified
            sessionStorage.setItem(notifiedKey, 'true');
        });
    }

    showNotification(message, type = 'info') {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 16px 24px;
            background-color: ${type === 'success' ? 'var(--success-color)' : 'var(--primary-color)'};
            color: white;
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-weight: 500;
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ==========================================
    // Keyboard Shortcuts
    // ==========================================
    handleKeyboard(e) {
        // Escape key to close modal
        if (e.key === 'Escape' && this.editModal.classList.contains('show')) {
            this.closeModal();
        }

        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.searchInput.focus();
        }
    }

    // ==========================================
    // LocalStorage Management
    // ==========================================
    saveTasks() {
        try {
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Error saving tasks:', error);
            this.showNotification('Error saving tasks. Storage might be full.', 'error');
        }
    }

    loadTasks() {
        try {
            const tasks = localStorage.getItem('tasks');
            return tasks ? JSON.parse(tasks) : [];
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    }
}

// ==========================================
// Initialize Application
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Add drag-over event to task list
    const taskList = document.getElementById('taskList');
    taskList.addEventListener('dragover', (e) => {
        if (e.preventDefault) {
            e.preventDefault();
        }
        return false;
    });

    taskList.addEventListener('drop', (e) => {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        return false;
    });

    // Initialize app
    window.todoApp = new TodoApp();
});

// Request notification permission on load
if ('Notification' in window && Notification.permission === 'default') {
    setTimeout(() => {
        Notification.requestPermission();
    }, 3000);
}
