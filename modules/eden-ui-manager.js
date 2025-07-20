// Eden Bounty Planning System - UI Management Module
// This module handles all UI updates, notifications, and user interactions

window.EdenBounty = window.EdenBounty || {};

window.EdenBounty.UIManager = {
    state: null,
    notificationQueue: [],
    countdownInterval: null,

    init(state) {
        this.state = state;
        this.setupEventListeners();
        this.initializeUI();
        this.startCountdown();
    },

    // Initialize UI components
    initializeUI() {
        // Apply saved settings
        this.applySavedSettings();
        
        // Initialize tooltips
        this.initializeTooltips();
        
        // Initialize tabs
        this.initializeTabs();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Initialize timeline
        this.updateTimeline();
        
        // Update initial UI state
        this.updateUI();
    },

    // Setup global event listeners
    setupEventListeners() {
        // Eden configuration
        const edenStartDate = document.getElementById('edenStartDate');
        const userFaction = document.getElementById('userFaction');
        
        if (edenStartDate) {
            edenStartDate.addEventListener('change', (e) => this.handleStartDateChange(e));
        }
        if (userFaction) {
            userFaction.addEventListener('change', (e) => this.handleFactionChange(e));
        }
        
        // Settings checkboxes
        const settingIds = ['compactMode', 'animationsEnabled', 'soundEnabled', 
                           'notifyOccupation', 'notifyConflict', 'notifyStructure'];
        
        settingIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', (e) => this.handleSettingChange(e));
            }
        });
        
        // Search overlay
        const searchOverlay = document.getElementById('searchOverlay');
        if (searchOverlay) {
            searchOverlay.addEventListener('click', (e) => {
                if (e.target.id === 'searchOverlay') {
                    this.toggleSearch();
                }
            });
        }
        
        const globalSearch = document.getElementById('globalSearch');
        if (globalSearch) {
            globalSearch.addEventListener('input', (e) => {
                this.state.debounce('search', () => this.performGlobalSearch(e.target.value));
            });
        }
        
        // Window resize
        window.addEventListener('resize', () => {
            this.state.debounce('resize', () => this.handleResize());
        });
    },

    // Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + F - Global Search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                this.toggleSearch();
            }
            
            // Ctrl/Cmd + S - Quick Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.quickSave();
            }
            
            // Ctrl/Cmd + Z - Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undoAction();
            }
            
            // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z - Redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                this.redoAction();
            }
            
            // Escape - Close modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    },

    // Tab navigation
    initializeTabs() {
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
    },

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Show/hide content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        
        const tabContent = document.getElementById(`${tabName}Tab`);
        if (tabContent) {
            tabContent.classList.remove('hidden');
            
            // Tab-specific initialization
            switch (tabName) {
                case 'map':
                    if (window.EdenBounty.MapManager) {
                        window.EdenBounty.MapManager.updateMap();
                    }
                    break;
                case 'analytics':
                    if (window.EdenBounty.ChartManager) {
                        window.EdenBounty.ChartManager.updateCharts();
                    }
                    break;
                case 'simulator':
                    if (window.EdenBounty.Simulator) {
                        window.EdenBounty.Simulator.initializeSimulator();
                    }
                    break;
            }
        }
    },

    // Update all UI components
    updateUI() {
        this.updateEdenInfo();
        this.updateTimeline();
        this.updateStatistics();
        this.updateNotificationBadges();
        this.checkOccupationDayNotifications();
    },

    // Update Eden information display
    updateEdenInfo() {
        const currentDayElement = document.getElementById('currentDay');
        const nextOccupationElement = document.getElementById('nextOccupationDay');
        
        if (!this.state.data.edenStartDate) {
            if (currentDayElement) currentDayElement.textContent = '-';
            if (nextOccupationElement) nextOccupationElement.textContent = '-';
            return;
        }

        const currentDay = window.EdenBounty.Utils.getCurrentEdenDay();
        if (currentDayElement) {
            currentDayElement.textContent = currentDay;
        }

        const nextOccDay = window.EdenBounty.Utils.findNextOccupationDay();
        if (nextOccupationElement) {
            nextOccupationElement.textContent = nextOccDay;
        }
    },

    // Update timeline display
    updateTimeline() {
        const timeline = document.getElementById('timeline');
        if (!timeline) return;
        
        timeline.innerHTML = '';
        
        if (!this.state.data.edenStartDate) return;
        
        const start = new Date(this.state.data.edenStartDate);
        const today = new Date();
        const currentWeek = Math.floor((today - start) / (1000 * 60 * 60 * 24 * 7)) + 1;
        
        for (let week = 1; week <= 6; week++) {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            
            if (week === currentWeek) {
                item.classList.add('active');
            }
            
            if (this.state.data.selectedWeek === week) {
                item.classList.add('active');
            }
            
            if (week === currentWeek && window.EdenBounty.Utils.isOccupationDay()) {
                item.classList.add('occupation-day');
            }
            
            // Check for conflicts in this week
            const weekConflicts = this.getWeekConflicts(week);
            if (weekConflicts > 0) {
                const badge = document.createElement('div');
                badge.className = 'conflict-badge';
                badge.textContent = weekConflicts;
                item.appendChild(badge);
            }
            
            item.innerHTML += `
                <h4>Week ${week}</h4>
                <p>${window.EdenBounty.Utils.getWeekDescription(week)}</p>
                <small>Day ${(week - 1) * 7 + 1} - ${week * 7}</small>
            `;
            
            item.addEventListener('click', () => {
                if (window.EdenBounty.TableManager) {
                    window.EdenBounty.TableManager.filterByWeek(week);
                }
            });
            
            timeline.appendChild(item);
        }
    },

    // Get conflicts for a specific week
    getWeekConflicts(week) {
        const startDay = (week - 1) * 7 + 1;
        const endDay = week * 7;
        
        let conflicts = 0;
        Object.keys(this.state.data.conflicts).forEach(structureIndex => {
            const structure = this.state.data.edenData[structureIndex];
            const day = parseInt(structure.Day);
            if (day >= startDay && day <= endDay) {
                conflicts++;
            }
        });
        
        return conflicts;
    },

    // Update statistics display
    updateStatistics() {
        const stats = window.EdenBounty.ChartManager ? 
            window.EdenBounty.ChartManager.calculateStatistics() : 
            { totalStats: {}, factionStats: { North: {}, South: {} } };
        
        // Update quick stats
        const elements = {
            totalStructures: this.state.data.edenData.length,
            availableToday: stats.totalStats.availableToday || 0,
            plannedCount: stats.totalStats.plannedCount || 0,
            guildsCount: stats.totalStats.guildsCount || 0,
            totalFactionPoints: stats.totalStats.totalFactionPoints || 0,
            chaosProduction: `+${stats.totalStats.totalChaosBase || 0}`,
            chaosPercent: (stats.totalStats.totalChaosPercent || 0).toFixed(1)
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        // Update faction lead
        const northPoints = stats.factionStats.North.totalPoints || 0;
        const southPoints = stats.factionStats.South.totalPoints || 0;
        const leadElement = document.getElementById('factionLead');
        
        if (leadElement) {
            const lead = northPoints > southPoints ? 
                `North leads by ${northPoints - southPoints}` : 
                southPoints > northPoints ?
                `South leads by ${southPoints - northPoints}` :
                'Tied';
            leadElement.textContent = lead;
        }
        
        // Update detailed stats sections
        this.updateGuildStats(stats.guildStats || {});
        this.updateFactionStats(stats.factionStats || {});
    },

    // Update guild statistics display
    updateGuildStats(guildStats) {
        const section = document.getElementById('guildStatsSection');
        const content = document.getElementById('guildStatsContent');
        
        if (!section || !content) return;
        
        if (Object.keys(guildStats).length === 0) {
            section.classList.add('hidden');
            return;
        }
        
        section.classList.remove('hidden');
        
        let html = '<div class="grid-2">';
        
        Object.entries(guildStats).forEach(([guild, stats]) => {
            const factionIcon = stats.guildFaction === 'North' ? '🔴' : '🔵';
            
            html += `
                <div class="stat-card">
                    <button class="favorite-btn ${this.state.data.favorites.has(guild) ? 'active' : ''}" 
                            onclick="window.EdenBounty.UIManager.toggleFavoriteGuild('${guild}')">⭐</button>
                    <h4>${factionIcon} ${guild}</h4>
                    <p><strong>Faction Points:</strong> <span class="stat-value">${stats.factionPoints}</span></p>
                    <p><strong>Guild Points:</strong> <span class="stat-value">${stats.guildPoints}</span></p>
                    <p><strong>Chaos Production:</strong> <span class="stat-value">+${stats.chaosBase} (+${stats.chaosPercent}%)</span></p>
                    <p><strong>Structures:</strong> ${stats.structures.length}</p>
                </div>
            `;
        });
        
        html += '</div>';
        content.innerHTML = html;
    },

    // Update faction statistics display
    updateFactionStats(factionStats) {
        const section = document.getElementById('factionStatsSection');
        const content = document.getElementById('factionStatsContent');
        
        if (!section || !content) return;
        
        if (!factionStats.North || (factionStats.North.structuresPlanned === 0 && factionStats.South.structuresPlanned === 0)) {
            section.classList.add('hidden');
            return;
        }
        
        section.classList.remove('hidden');
        
        const html = `
            <div class="grid-2">
                <div class="stat-card" style="border-left-color: var(--primary-red);">
                    <h4>🔴 North Faction</h4>
                    <p><strong>Total Points:</strong> <span class="stat-value">${factionStats.North.totalPoints}</span></p>
                    <p><strong>Structures:</strong> ${factionStats.North.structuresPlanned}</p>
                    <p><strong>Guilds:</strong> ${factionStats.North.guildsInvolved.size}</p>
                    <p><strong>Available Today:</strong> ${factionStats.North.availableToday}</p>
                </div>
                <div class="stat-card" style="border-left-color: var(--primary-blue);">
                    <h4>🔵 South Faction</h4>
                    <p><strong>Total Points:</strong> <span class="stat-value">${factionStats.South.totalPoints}</span></p>
                    <p><strong>Structures:</strong> ${factionStats.South.structuresPlanned}</p>
                    <p><strong>Guilds:</strong> ${factionStats.South.guildsInvolved.size}</p>
                    <p><strong>Available Today:</strong> ${factionStats.South.availableToday}</p>
                </div>
            </div>
        `;
        
        content.innerHTML = html;
    },

    // Notification system
    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notificationsContainer');
        if (!container) return;
        
        if (!this.state.data.settings.animationsEnabled) {
            duration = 0;
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        
        notification.innerHTML = `
            <span class="notification-icon">${icons[type]}</span>
            <div class="notification-content">
                <h4>${message}</h4>
                <p>${new Date().toLocaleTimeString()}</p>
            </div>
            <span class="notification-close" onclick="this.parentElement.remove()">×</span>
        `;
        
        container.appendChild(notification);
        
        // Play sound if enabled
        if (this.state.data.settings.soundEnabled && this.state.data.settings.notificationSound !== 'none') {
            this.playNotificationSound(this.state.data.settings.notificationSound);
        }
        
        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.style.animation = 'slideOutRight 0.3s ease forwards';
                    setTimeout(() => {
                        if (notification.parentElement) {
                            notification.remove();
                        }
                    }, 300);
                }
            }, duration);
        }
    },

    // Play notification sound
    playNotificationSound(soundType) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            switch (soundType) {
                case 'bell':
                    oscillator.frequency.value = 800;
                    oscillator.type = 'sine';
                    break;
                case 'chime':
                    oscillator.frequency.value = 1200;
                    oscillator.type = 'triangle';
                    break;
                default:
                    oscillator.frequency.value = 600;
                    oscillator.type = 'square';
            }
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.error('Error playing notification sound:', error);
        }
    },

    // Update sync status indicator
    updateSyncStatus(status) {
        const syncDiv = document.getElementById('syncStatus');
        if (!syncDiv) return;
        
        const indicator = syncDiv.querySelector('.connection-indicator');
        const text = syncDiv.querySelector('span:last-child');
        
        if (!indicator || !text) return;
        
        syncDiv.className = 'sync-status';
        indicator.className = 'connection-indicator';
        
        switch (status) {
            case 'connected':
                text.textContent = 'Connected';
                break;
            case 'syncing':
                text.textContent = 'Syncing...';
                indicator.classList.add('syncing');
                syncDiv.classList.add('syncing');
                break;
            case 'error':
                text.textContent = 'Offline Mode';
                indicator.classList.add('offline');
                syncDiv.classList.add('error');
                break;
            case 'offline':
                text.textContent = 'Offline';
                indicator.classList.add('offline');
                break;
        }
    },

    // Update notification badges
    updateNotificationBadges() {
        const planningBadge = document.getElementById('planningBadge');
        if (!planningBadge) return;
        
        const planningCount = Object.keys(this.state.data.plannings).length;
        
        if (planningCount > 0) {
            planningBadge.textContent = planningCount;
            planningBadge.classList.remove('hidden');
        } else {
            planningBadge.classList.add('hidden');
        }
    },

    // Check occupation day notifications
    checkOccupationDayNotifications() {
        if (!this.state.data.settings.notifyOccupation) return;
        
        if (window.EdenBounty.Utils.isOccupationDay()) {
            const availableCount = this.getAvailableTodayCount();
            if (availableCount > 0) {
                this.showNotification(`🎯 Occupation Day! ${availableCount} structures available`, 'warning', 10000);
            }
        }
    },

    // Get available today count
    getAvailableTodayCount() {
        let count = 0;
        this.state.data.edenData.forEach((structure, index) => {
            const status = window.EdenBounty.Utils.getStructureStatus(structure, index);
            if (status.status === 'occupation') {
                count++;
            }
        });
        return count;
    },

    // Countdown timer
    startCountdown() {
        this.updateCountdown();
        this.countdownInterval = setInterval(() => this.updateCountdown(), 1000);
    },

    updateCountdown() {
        const countdownEl = document.getElementById('countdown');
        if (!countdownEl) return;
        
        const now = new Date();
        const nextReset = new Date();
        
        // Game time is 1 hour ahead of Brazil time
        nextReset.setHours(23, 0, 0, 0); // 23:00 local time (BRT)
        
        if (now.getHours() >= 23) {
            nextReset.setDate(nextReset.getDate() + 1);
        }
        
        const diff = nextReset - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        countdownEl.textContent = `Next Reset: ${hours}h ${minutes}m ${seconds}s (Game Time: ${window.EdenBounty.Utils.getGameTime()})`;
    },

    // Settings handlers
    applySavedSettings() {
        const settings = this.state.data.settings;
        
        // Apply compact mode
        if (settings.compactMode) {
            document.body.classList.add('compact-mode');
        }
        
        // Apply animations
        document.body.style.setProperty('--animation-speed', settings.animationsEnabled ? '0.3s' : '0s');
        
        // Update setting checkboxes
        Object.entries(settings).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element && element.type === 'checkbox') {
                element.checked = value;
            } else if (element) {
                element.value = value;
            }
        });
    },

    handleSettingChange(event) {
        const settingName = event.target.id;
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        
        this.state.data.settings[settingName] = value;
        this.state.saveSettings();
        
        // Apply setting changes
        if (settingName === 'compactMode') {
            document.body.classList.toggle('compact-mode', value);
        } else if (settingName === 'animationsEnabled') {
            document.body.style.setProperty('--animation-speed', value ? '0.3s' : '0s');
        } else if (settingName === 'itemsPerPage') {
            this.state.data.itemsPerPage = parseInt(value);
            if (window.EdenBounty.TableManager) {
                window.EdenBounty.TableManager.renderTable();
            }
        }
    },

    // Event handlers
    handleStartDateChange(event) {
        this.state.data.edenStartDate = event.target.value;
        this.state.saveEdenConfig();
        this.updateUI();
    },

    handleFactionChange(event) {
        this.state.data.userFaction = event.target.value;
        this.state.saveEdenConfig();
        this.updateStatistics();
    },

    // Global search
    toggleSearch() {
        const overlay = document.getElementById('searchOverlay');
        const searchInput = document.getElementById('globalSearch');
        
        if (!overlay) return;
        
        if (overlay.style.display === 'flex') {
            overlay.style.display = 'none';
        } else {
            overlay.style.display = 'flex';
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
    },

    performGlobalSearch(query) {
        const results = document.getElementById('searchResults');
        if (!results) return;
        
        if (!query) {
            results.innerHTML = '';
            return;
        }
        
        const lowerQuery = query.toLowerCase();
        const matches = [];
        
        this.state.data.edenData.forEach((structure, index) => {
            let match = false;
            let matchedFields = [];
            
            // Search in structure data
            if (structure.Occupation.toLowerCase().includes(lowerQuery)) {
                match = true;
                matchedFields.push('Structure');
            }
            if (`${structure.X}:${structure.Y}`.includes(query)) {
                match = true;
                matchedFields.push('Coordinates');
            }
            if (structure.Faction.toLowerCase().includes(lowerQuery)) {
                match = true;
                matchedFields.push('Faction');
            }
            
            // Search in planning data
            const planning = this.state.data.plannings[index];
            if (planning) {
                if (planning.guild.toLowerCase().includes(lowerQuery)) {
                    match = true;
                    matchedFields.push('Guild');
                }
                if (planning.banner && planning.banner.toLowerCase().includes(lowerQuery)) {
                    match = true;
                    matchedFields.push('Banner');
                }
                if (planning.notes && planning.notes.toLowerCase().includes(lowerQuery)) {
                    match = true;
                    matchedFields.push('Notes');
                }
            }
            
            if (match) {
                matches.push({ structure, index, matchedFields, planning });
            }
        });
        
        if (matches.length === 0) {
            results.innerHTML = '<div class="search-result">No results found</div>';
            return;
        }
        
        results.innerHTML = matches.slice(0, 20).map(({ structure, index, matchedFields, planning }) => `
            <div class="search-result" onclick="window.EdenBounty.UIManager.goToStructure(${index})">
                <h4>${structure.Occupation} (${structure.X}:${structure.Y})</h4>
                <p>Matched: ${matchedFields.join(', ')}</p>
                ${planning ? `<p>Guild: ${planning.guild}</p>` : ''}
            </div>
        `).join('');
    },

    goToStructure(index) {
        this.toggleSearch();
        
        // Switch to planning tab
        this.switchTab('planning');
        
        // Clear filters and navigate to structure
        if (window.EdenBounty.TableManager) {
            window.EdenBounty.TableManager.clearAllFilters();
            
            // Find page containing structure
            const itemsPerPage = this.state.data.itemsPerPage;
            const page = Math.floor(index / itemsPerPage) + 1;
            
            this.state.data.currentPage = page;
            window.EdenBounty.TableManager.renderTable();
            
            // Highlight row
            setTimeout(() => {
                const structure = this.state.data.edenData[index];
                const rows = document.querySelectorAll('#structureTableBody tr');
                
                rows.forEach(row => {
                    if (row.textContent.includes(structure.Occupation) && 
                        row.textContent.includes(`${structure.X}:${structure.Y}`)) {
                        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        row.style.background = 'rgba(79, 195, 247, 0.3)';
                        row.style.transition = 'background 2s ease';
                        
                        setTimeout(() => {
                            row.style.background = '';
                        }, 3000);
                    }
                });
            }, 300);
        }
    },

    // Quick actions
    quickSave() {
        window.EdenBounty.DataManager.saveAllData();
        this.showNotification('All data saved!', 'success');
    },

    toggleCompactMode() {
        document.body.classList.toggle('compact-mode');
        this.state.data.settings.compactMode = document.body.classList.contains('compact-mode');
        this.state.saveSettings();
    },

    async exportImage() {
        this.showNotification('Preparing image export...', 'info');
        
        // Check if html2canvas is available
        if (typeof html2canvas === 'undefined') {
            // Try to load it
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            document.head.appendChild(script);
            
            script.onload = async () => {
                await this.captureAndExportImage();
            };
            
            script.onerror = () => {
                this.showNotification('Failed to load html2canvas library', 'error');
            };
        } else {
            await this.captureAndExportImage();
        }
    },

    async captureAndExportImage() {
        try {
            const element = document.querySelector('.container');
            const canvas = await html2canvas(element, {
                backgroundColor: '#1a1a2e',
                scale: 2
            });
            
            const link = document.createElement('a');
            link.download = `eden-planning-${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL();
            link.click();
            
            this.showNotification('Image exported successfully!', 'success');
        } catch (error) {
            this.showNotification('Failed to export image', 'error');
        }
    },

    // Undo/Redo
    undoAction() {
        const action = this.state.undo();
        if (!action) {
            this.showNotification('Nothing to undo', 'info');
            return;
        }
        
        this.applyAction(action, true);
        this.showUndoToast('Action undone');
    },

    redoAction() {
        const action = this.state.redo();
        if (!action) {
            this.showNotification('Nothing to redo', 'info');
            return;
        }
        
        this.applyAction(action, false);
        this.showUndoToast('Action redone');
    },

    applyAction(action, isUndo) {
        switch (action.type) {
            case 'planning':
                if (isUndo) {
                    if (action.action === 'add') {
                        delete this.state.data.plannings[action.index];
                    } else if (action.action === 'edit' || action.action === 'remove') {
                        if (action.oldValue) {
                            this.state.data.plannings[action.index] = action.oldValue;
                        } else {
                            delete this.state.data.plannings[action.index];
                        }
                    }
                } else {
                    if (action.action === 'remove') {
                        delete this.state.data.plannings[action.index];
                    } else {
                        this.state.data.plannings[action.index] = action.newValue;
                    }
                }
                break;
        }
        
        this.state.savePlannings();
        window.EdenBounty.Utils.detectConflicts();
        this.updateUI();
        
        if (window.EdenBounty.TableManager) {
            window.EdenBounty.TableManager.renderTable();
        }
    },

    showUndoToast(message) {
        const toast = document.getElementById('undoToast');
        const messageEl = document.getElementById('undoMessage');
        
        if (!toast || !messageEl) return;
        
        messageEl.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    },

    // Favorites
    toggleFavoriteGuild(guild) {
        if (this.state.data.favorites.has(guild)) {
            this.state.data.favorites.delete(guild);
        } else {
            this.state.data.favorites.add(guild);
        }
        
        this.state.saveFavorites();
        this.updateGuildStats(window.EdenBounty.ChartManager.calculateGuildStats());
    },

    // Modal management
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        
        if (window.EdenBounty.PlanningManager) {
            window.EdenBounty.PlanningManager.currentStructureIndex = null;
        }
    },

    // Responsive handling
    handleResize() {
        // Update map if visible
        if (!document.getElementById('mapTab').classList.contains('hidden')) {
            if (window.EdenBounty.MapManager) {
                window.EdenBounty.MapManager.updateMap();
            }
        }
        
        // Update charts if visible
        if (!document.getElementById('analyticsTab').classList.contains('hidden')) {
            if (window.EdenBounty.ChartManager) {
                window.EdenBounty.ChartManager.updateCharts();
            }
        }
    },

    // Initialize tooltips
    initializeTooltips() {
        // This would initialize any tooltip library if needed
        // For now, CSS tooltips are used
    },

    // Loading states
    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.classList.add('skeleton');
        element.innerHTML = '<div style="padding: 20px;">Loading...</div>';
    },

    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.classList.remove('skeleton');
    },

    // Cleanup
    destroy() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
    }
};