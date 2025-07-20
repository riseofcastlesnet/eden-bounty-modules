// Eden Bounty Planning System - Utilities Module
// This module contains helper functions used across the application

window.EdenBounty = window.EdenBounty || {};

window.EdenBounty.Utils = {
    // Get the state instance
    getState() {
        return window.EdenBounty.getState();
    },

    // Check if occupation is a lobby
    isLobby(occupation) {
        const lobbyNames = Object.keys(window.EdenBounty.Config.LOBBY_BONUSES);
        return lobbyNames.some(lobbyName => 
            occupation.includes(lobbyName) || occupation.includes('Lobby')
        );
    },

    // Get structure bonus
    getStructureBonus(occupation) {
        for (let [key, bonus] of Object.entries(window.EdenBounty.Config.STRUCTURE_BONUSES)) {
            if (occupation.includes(key)) {
                return bonus;
            }
        }
        return null;
    },

    // Get faction icon
    getFactionIcon(faction) {
        const factionLower = faction.toLowerCase();
        if (factionLower.includes('north')) return window.EdenBounty.Config.ICONS.north;
        if (factionLower.includes('south')) return window.EdenBounty.Config.ICONS.south;
        return window.EdenBounty.Config.ICONS.neutral;
    },

    // Get faction class for styling
    getFactionClass(faction) {
        const factionLower = faction.toLowerCase();
        if (factionLower.includes('north')) return 'faction-north';
        if (factionLower.includes('south')) return 'faction-south';
        return 'faction-neutral';
    },

    // Check if today is occupation day
    isOccupationDay() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        return [0, 2, 4].includes(dayOfWeek); // Sunday, Tuesday, Thursday
    },

    // Find next occupation day
    findNextOccupationDay() {
        const state = this.getState();
        if (!state.data.edenStartDate) return '-';
        
        const today = new Date();
        const dayOfWeek = today.getDay();
        const occupationDays = [0, 2, 4]; // Sunday, Tuesday, Thursday
        
        for (let i = 0; i < 7; i++) {
            const checkDay = (dayOfWeek + i) % 7;
            if (occupationDays.includes(checkDay)) {
                const nextDate = new Date(today);
                nextDate.setDate(today.getDate() + i);
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                return nextDate.toLocaleDateString() + ' (' + dayNames[checkDay] + ')';
            }
        }
        
        return '-';
    },

    // Get current Eden day
    getCurrentEdenDay() {
        const state = this.getState();
        if (!state.data.edenStartDate) return 0;

        const start = new Date(state.data.edenStartDate);
        const now = new Date();
        const diffTime = Math.abs(now - start);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        return diffDays;
    },

    // Get structure status
    getStructureStatus(structure, index) {
        const state = this.getState();
        const config = window.EdenBounty.Config;
        
        if (!state.data.edenStartDate) {
            return { status: 'locked', class: 'status-locked', icon: config.ICONS.locked };
        }
        
        const currentDay = this.getCurrentEdenDay();
        const openingDay = parseInt(structure.Day);
        
        if (state.data.plannings[index]) {
            if (state.data.conflicts[index] && state.data.conflicts[index].length > 1) {
                return { status: 'conflict', class: 'status-conflict', icon: config.ICONS.conflict };
            }
            return { status: 'planned', class: 'status-planned', icon: config.ICONS.planned };
        }
        
        if (currentDay >= openingDay && this.isOccupationDay()) {
            return { status: 'occupation', class: 'status-occupation', icon: config.ICONS.occupation };
        }
        
        if (currentDay >= openingDay) {
            return { status: 'available', class: 'status-available', icon: config.ICONS.available };
        }
        
        return { status: 'locked', class: 'status-locked', icon: config.ICONS.locked };
    },

    // Get time remaining until structure opens
    getTimeRemaining(structure) {
        const state = this.getState();
        if (!state.data.edenStartDate) return '-';
        
        const start = new Date(state.data.edenStartDate);
        const now = new Date();
        const currentTime = now.getTime();
        const startTime = start.getTime();
        
        const openingDay = parseInt(structure.Day);
        const targetTime = startTime + (openingDay - 1) * 24 * 60 * 60 * 1000;
        const remainingMs = targetTime - currentTime;
        
        if (remainingMs <= 0) {
            return 'Available';
        }
        
        const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
        const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
        
        if (days > 0) {
            return `${days}d ${hours}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    },

    // Format date and time for display
    formatDateTime(dateStr, timeStr) {
        if (!dateStr || !timeStr) return '-';
        
        const date = new Date(dateStr);
        const [hours, minutes] = timeStr.split(':');
        const formattedDate = date.toLocaleDateString();
        
        let resetTime = '';
        if (hours === '00' && minutes === '00') {
            resetTime = 'Reset';
        } else if (minutes === '00') {
            resetTime = `Reset +${parseInt(hours)}`;
        } else {
            resetTime = `Reset +${hours}:${minutes}`;
        }
        
        return `${formattedDate} ${resetTime}`;
    },

    // Get game time (1 hour ahead of local time)
    getGameTime() {
        const now = new Date();
        const gameTime = new Date(now.getTime() + (60 * 60 * 1000)); // Add 1 hour
        return gameTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    },

    // Copy text to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                document.execCommand('copy');
                document.body.removeChild(textarea);
                return true;
            } catch (e) {
                document.body.removeChild(textarea);
                return false;
            }
        }
    },

    // Detect conflicts in planning
    detectConflicts() {
        const state = this.getState();
        const conflicts = {};
        
        Object.entries(state.data.plannings).forEach(([index, planning]) => {
            const key = index;
            if (!conflicts[key]) {
                conflicts[key] = [];
            }
            conflicts[key].push(planning.guild);
        });
        
        // Filter out non-conflicts
        Object.keys(conflicts).forEach(key => {
            if (conflicts[key].length <= 1) {
                delete conflicts[key];
            }
        });
        
        state.data.conflicts = conflicts;
        return conflicts;
    },

    // Calculate lobby bonuses
    calculateLobbyBonuses(lobbies) {
        const bonusByType = {};
        const duplicateWarnings = [];
        const lobbyCount = {};
        
        lobbies.forEach(lobby => {
            const lobbyName = this.getLobbyName(lobby.name);
            const lobbyData = window.EdenBounty.Config.LOBBY_BONUSES[lobbyName];
            if (!lobbyData) return;
            
            const bonusType = lobbyData.type;
            
            if (!lobbyCount[lobbyName]) {
                lobbyCount[lobbyName] = 0;
            }
            lobbyCount[lobbyName]++;
            
            if (!bonusByType[bonusType]) {
                bonusByType[bonusType] = {
                    totalBonus: 0,
                    maxBonus: 0,
                    lobbies: [],
                    unit: lobbyData.unit
                };
            }
            
            if (lobbyCount[lobbyName] > 1) {
                if (lobbyCount[lobbyName] === 2) {
                    duplicateWarnings.push(`${lobbyName} is duplicated (only counts once)`);
                }
                return;
            }
            
            bonusByType[bonusType].totalBonus += lobbyData.min;
            bonusByType[bonusType].maxBonus += lobbyData.max;
            bonusByType[bonusType].lobbies.push(lobbyName);
        });
        
        return { bonusByType, duplicateWarnings };
    },

    // Get lobby name from occupation string
    getLobbyName(occupation) {
        for (let lobbyName of Object.keys(window.EdenBounty.Config.LOBBY_BONUSES)) {
            if (occupation.includes(lobbyName)) {
                return lobbyName;
            }
        }
        return null;
    },

    // Convert cartesian to isometric coordinates
    cartesianToIsometric(x, y) {
        const isoX = (x - y) * 0.5;
        const isoY = (x + y) * 0.25;
        return { x: isoX, y: isoY };
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Deep clone object
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Format number with separators
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    // Parse query parameters
    parseQueryParams() {
        const params = {};
        const searchParams = new URLSearchParams(window.location.search);
        for (let [key, value] of searchParams) {
            params[key] = value;
        }
        return params;
    },

    // Check mobile device
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    // Get week from Eden day
    getWeekFromDay(day) {
        return Math.ceil(day / 7);
    },

    // Get week description
    getWeekDescription(week) {
        return window.EdenBounty.Config.WEEK_DESCRIPTIONS[week] || `Week ${week}`;
    }
};