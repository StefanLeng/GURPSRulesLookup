// SPDX-FileCopyrightText: 2022 Johannes Loher
//
// SPDX-License-Identifier: MIT

import { SearchSidebar } from './SearchSidebar.ts';
import { registerSettings } from './settings.ts';

/**
 * This is your TypeScript entry file for Foundry VTT.
 * Register custom settings, sheets, and constants using the Foundry API.
 * Change this heading to be more descriptive to your module, or remove it.
 * Author: [your name]
 * Content License: [copyright and-or license] If using an existing system
 * 					you may want to put a (link to a) license or copyright
 * 					notice here (e.g. the OGL).
 * Software License: [your license] Put your desired license here, which
 * 					 determines how others may use and modify your module.
 */

// Import TypeScript modules

// Initialize module
Hooks.once('init', async () => {
    console.log('GURPSRulesLookup | Initializing GURPSRulesLookup');

    // Register custom module settings
    registerSettings();

    CONFIG.ui.sidebar.TABS.rulesSearch = {
        //@ts-expect-error wait for fix in types
        icon: `fa-solid fa-search`,
        tooltip: `GURPS Rules Lookup`,
    };
    //@ts-expect-error custom property
    CONFIG.ui.rulesSearch = SearchSidebar;

    // Inject the custom tab right before settings
    const temp = CONFIG.ui.sidebar.TABS.settings;
    delete CONFIG.ui.sidebar.TABS.settings;
    CONFIG.ui.sidebar.TABS.settings = temp;
});

// Setup module
Hooks.once('setup', async () => {
    // Do anything after initialization but before
    // ready
});

// When ready
Hooks.once('ready', async () => {
    // Do anything once the module is ready
});

// Add any additional hooks if necessary
