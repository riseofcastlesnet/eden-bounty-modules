// Eden Bounty Planning System - State Management Module
// This module handles all state management and data persistence

window.EdenBounty = window.EdenBounty || {};

window.EdenBounty.State = class AppState {
    constructor() {
        this.data = new Proxy({
            edenData: [],
            plannings: {},
            favorites: new Set(),
            conflicts: {},
            edenStartDate: null,
            userFaction: 'North',
            currentPage: 1,
            itemsPerPage: window.EdenBounty.Config.DEFAULT_ITEMS_PER_PAGE,
            filters: {},
            settings: this.loadSettings(),
            history: [],
            historyIndex: -1,
            cache: new Map(),
            syncStatus: 'offline',
            selectedWeek: null
        }, {
            set: (target, property, value) => {
                const oldValue = target[property];
                target[property] = value;
                this.notify(property, value, oldValue);
                return true;
            }
        });
        
        this.listeners = new Map();
        this.debounceTimers = new Map();
    }

    // Observer Pattern Implementation
    subscribe(property, callback) {
        if (!this.listeners.has(property)) {
            this.listeners.set(property, []);
        }
        this.listeners.get(property).push(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(property);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    notify(property, value, oldValue) {
        if (this.listeners.has(property)) {
            this.listeners.get(property).forEach(cb => {
                try {
                    cb(value, oldValue);
                } catch (error) {
                    console.error('Error in state listener:', error);
                }
            });
        }
    }

    // History Management
    addToHistory(action) {
        // Remove future history if we're not at the end
        if (this.data.historyIndex < this.data.history.length - 1) {
            this.data.history = this.data.history.slice(0, this.data.historyIndex + 1);
        }
        
        this.data.history.push({
            ...action,
            timestamp: Date.now()
        });
        this.data.historyIndex++;
        
        // Limit history size
        if (this.data.history.length > 50) {
            this.data.history.shift();
            this.data.historyIndex--;
        }
    }

    undo() {
        if (this.data.historyIndex >= 0) {
            const action = this.data.history[this.data.historyIndex];
            this.data.historyIndex--;
            return action;
        }
        return null;
    }

    redo() {
        if (this.data.historyIndex < this.data.history.length - 1) {
            this.data.historyIndex++;
            const action = this.data.history[this.data.historyIndex];
            return action;
        }
        return null;
    }

    // Settings Management
    loadSettings() {
        try {
            const saved = localStorage.getItem('edenSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                // Merge with defaults to ensure all properties exist
                return { ...window.EdenBounty.Config.DEFAULT_SETTINGS, ...settings };
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        return { ...window.EdenBounty.Config.DEFAULT_SETTINGS };
    }

    saveSettings() {
        try {
            localStorage.setItem('edenSettings', JSON.stringify(this.data.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    // Data Persistence
    savePlannings() {
        try {
            localStorage.setItem('edenPlannings', JSON.stringify(this.data.plannings));
        } catch (error) {
            console.error('Error saving plannings:', error);
        }
    }

    loadPlannings() {
        try {
            const saved = localStorage.getItem('edenPlannings');
            if (saved) {
                this.data.plannings = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading plannings:', error);
        }
    }

    saveFavorites() {
        try {
            localStorage.setItem('edenFavorites', JSON.stringify(Array.from(this.data.favorites)));
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    }

    loadFavorites() {
        try {
            const saved = localStorage.getItem('edenFavorites');
            if (saved) {
                this.data.favorites = new Set(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    }

    saveEdenConfig() {
        try {
            localStorage.setItem('edenStartDate', this.data.edenStartDate || '');
            localStorage.setItem('userFaction', this.data.userFaction);
        } catch (error) {
            console.error('Error saving Eden config:', error);
        }
    }

    loadEdenConfig() {
        try {
            const savedDate = localStorage.getItem('edenStartDate');
            const savedFaction = localStorage.getItem('userFaction');
            
            if (savedDate) this.data.edenStartDate = savedDate;
            if (savedFaction) this.data.userFaction = savedFaction;
        } catch (error) {
            console.error('Error loading Eden config:', error);
        }
    }

    // Cache Management
    setCache(key, value, ttl = null) {
        const expiresAt = ttl ? Date.now() + ttl : null;
        this.data.cache.set(key, { value, expiresAt });
    }

    getCache(key) {
        const cached = this.data.cache.get(key);
        if (!cached) return null;
        
        if (cached.expiresAt && Date.now() > cached.expiresAt) {
            this.data.cache.delete(key);
            return null;
        }
        
        return cached.value;
    }

    clearCache() {
        this.data.cache.clear();
    }

    // Debounce Utility
    debounce(key, callback, delay = 300) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }
        
        const timer = setTimeout(() => {
            callback();
            this.debounceTimers.delete(key);
        }, delay);
        
        this.debounceTimers.set(key, timer);
    }

    // Reset Methods
    resetAll() {
        this.data.plannings = {};
        this.data.favorites = new Set();
        this.data.conflicts = {};
        this.data.history = [];
        this.data.historyIndex = -1;
        this.clearCache();
        this.savePlannings();
        this.saveFavorites();
    }

    // Export/Import State
    exportState() {
        return {
            plannings: this.data.plannings,
            favorites: Array.from(this.data.favorites),
            edenStartDate: this.data.edenStartDate,
            userFaction: this.data.userFaction,
            settings: this.data.settings,
            version: window.EdenBounty.Config.VERSION
        };
    }

    importState(stateData) {
        if (stateData.plannings) this.data.plannings = stateData.plannings;
        if (stateData.favorites) this.data.favorites = new Set(stateData.favorites);
        if (stateData.edenStartDate) this.data.edenStartDate = stateData.edenStartDate;
        if (stateData.userFaction) this.data.userFaction = stateData.userFaction;
        if (stateData.settings) {
            this.data.settings = { ...window.EdenBounty.Config.DEFAULT_SETTINGS, ...stateData.settings };
        }
        
        // Save all imported data
        this.savePlannings();
        this.saveFavorites();
        this.saveEdenConfig();
        this.saveSettings();
    }
};

// Create singleton instance
window.EdenBounty.state = null;

window.EdenBounty.getState = function() {
    if (!window.EdenBounty.state) {
        window.EdenBounty.state = new window.EdenBounty.State();
    }
    return window.EdenBounty.state;
};