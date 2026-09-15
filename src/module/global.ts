import type {} from '../../node_modules/fvtt-types/src/configuration/configuration.d.mts';

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
    namespace globalThis {
        const GURPS: { executeOTF: (command: string) => void };
    }
}

declare module 'fvtt-types/configuration' {
    /* ---------------------------------------- */
    interface SettingConfig {
        'GURPSRulesLookup.IncludeDFRPG': 'no' | 'only' | 'both';
    }
}
