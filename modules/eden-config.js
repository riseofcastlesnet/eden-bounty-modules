// Eden Bounty Planning System - Configuration Module
// This module contains all constants and configuration values

window.EdenBounty = window.EdenBounty || {};

window.EdenBounty.Config = {
    // Data Source
    CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQmCMUCPHjxB2JspQ19cO1L19SGuHlSNI-tgU0ZCtnxyVMEdN0wsuT2na1aSU8zUj1LthLcf7N-92Gl/pub?output=csv',
    
    // Map Configuration
    MAP_SIZE: 1600,
    SECTOR_SIZE: 800,
    NORTH_ZONE_HEIGHT: 133.33, // 800 / 6
    NEUTRAL_ZONE_WIDTH: 320,
    NEUTRAL_ZONE_HEIGHT: 160,
    
    // Tiled Map URL
    TILED_MAP_URL: 'https://raw.githubusercontent.com/riseofcastlesnet/eden-minimap/main/Map%20Isometric%201600x1600.tmj',
    
    // Structure Bonuses
    STRUCTURE_BONUSES: {
        'Stronghold': { base: 20, percent: 0.5 },
        'Small Town Lv1': { base: 20, percent: 0.5 },
        'Small Town Lv2': { base: 40, percent: 1 },
        'Large Town Lv4': { base: 100, percent: 2 },
        'Capitol Lv5': { base: 200, percent: 5 },
        'Capitol Lv6': { base: 200, percent: 5 },
        'Capitol Lv7': { base: 200, percent: 5 },
        'World Center Lv.8': { base: 400, percent: 8 },
        'Check Point Lv1': { base: 0, percent: 0 },
        'Check Point Lv2': { base: 0, percent: 0 },
        'Check Point Lv3': { base: 0, percent: 0 }
    },
    
    // Lobby Bonuses
    LOBBY_BONUSES: {
        'King Cnut': { type: 'Frontline Workshop', min: 2, max: 20, unit: '%' },
        'Rozen Blade': { type: 'Frontline Workshop', min: 2, max: 20, unit: '%' },
        'Jeanne d\'Arc': { type: 'Frontline Workshop', min: 2, max: 20, unit: '%' },
        'Clovis I': { type: 'Troop Might', min: 5, max: 50, unit: '%' },
        'John I': { type: 'Troop Might', min: 5, max: 50, unit: '%' },
        'Lionheart': { type: 'Troop Resistance', min: 5, max: 50, unit: '%' },
        'Gnaeus Pompey': { type: 'Troop Resistance', min: 5, max: 50, unit: '%' },
        'Louis IX': { type: 'Healing Speed', min: 5, max: 50, unit: '%' },
        'Peace Bringer': { type: 'Damage', min: 0.5, max: 5, unit: '%' }
    },
    
    // UI Configuration
    ANIMATION_SPEED: '0.3s',
    DEFAULT_ITEMS_PER_PAGE: 20,
    NOTIFICATION_DURATION: 5000,
    CACHE_DURATION: 5, // minutes
    
    // Default Settings
    DEFAULT_SETTINGS: {
        compactMode: false,
        animationsEnabled: true,
        soundEnabled: false,
        notifyOccupation: true,
        notifyConflict: true,
        notifyStructure: true,
        notificationSound: 'default',
        virtualScroll: true,
        lazyLoad: true,
        cacheDuration: 5,
        realtimeSync: false,
        showUserCursors: false,
        syncServer: '',
        itemsPerPage: 20
    },
    
    // Colors and Styles
    COLORS: {
        north: '#f44336',
        south: '#4fc3f7',
        neutral: '#ffffff',
        primary: '#4fc3f7',
        secondary: '#66bb6a',
        danger: '#f44336',
        warning: '#ff9800',
        bgDark: '#1a1a2e',
        bgDarker: '#16213e'
    },
    
    // Icons
    ICONS: {
        north: '🔴',
        south: '🔵',
        neutral: '⚪',
        locked: '🔒',
        available: '🔓',
        planned: '📋',
        occupation: '🎯',
        conflict: '⚠️',
        favorite: '⭐',
        calendar: '📅'
    },
    
    // Week Descriptions
    WEEK_DESCRIPTIONS: {
        1: 'Eden Opens - Initial Zones',
        2: 'Territory Expansion Phase',
        3: 'E/W Sectors Open - Lv4+ Focus',
        4: 'Central Sectors - Lv7 Capitol',
        5: 'Lv6 Gates - Temple Race',
        6: 'Final Battle - World Center'
    },
    
    // Version
    VERSION: '2.0',
    
    // API Endpoints (for future backend integration)
    API_ENDPOINTS: {
        base: '/api/eden',
        data: '/api/eden/data',
        plannings: '/api/eden/plannings',
        sync: '/api/eden/sync'
    }
};

// Freeze config to prevent modifications
Object.freeze(window.EdenBounty.Config);
Object.freeze(window.EdenBounty.Config.STRUCTURE_BONUSES);
Object.freeze(window.EdenBounty.Config.LOBBY_BONUSES);
Object.freeze(window.EdenBounty.Config.DEFAULT_SETTINGS);
Object.freeze(window.EdenBounty.Config.COLORS);
Object.freeze(window.EdenBounty.Config.ICONS);
Object.freeze(window.EdenBounty.Config.WEEK_DESCRIPTIONS);