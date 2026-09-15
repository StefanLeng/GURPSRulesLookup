// SPDX-FileCopyrightText: 2022 Johannes Loher
//
// SPDX-License-Identifier: MIT

export function registerSettings(): void {
    // Register any custom module settings here
    game.settings?.register('GURPSRulesLookup', 'IncludeDFRPG', {
        name: 'include Dungeon Fantasy RGP',
        hint: 'Show Rules from the Dungeon Fantasy RGP (DFRPG) in search results.',
        scope: 'world',
        config: true,
        requiresReload: true,
        type: String,
        choices: {
            // If choices are defined, the resulting setting will be a select menu
            no: 'Only GURPS rules',
            only: 'Only DFRPG rules',
            both: 'Both GURPS AND DFRPG rules',
        },
        default: 'both',
    });
}
