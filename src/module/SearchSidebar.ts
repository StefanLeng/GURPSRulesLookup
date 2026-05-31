import { DeepPartial } from 'fvtt-types/utils';

interface RulesEntry {
    Rule: string;
    Category: string[];
    Book: string;
    Page: string;
    Link: string;
}

interface SearchSidebarRenderContext extends foundry.applications.sidebar.AbstractSidebarTab.RenderContext {
    results: RulesEntry[];
    searchTerm: string;
}

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { AbstractSidebarTab } = foundry.applications.sidebar;

export class SearchSidebar extends HandlebarsApplicationMixin(AbstractSidebarTab)<
    SearchSidebarRenderContext,
    foundry.applications.sidebar.Sidebar.Configuration,
    foundry.applications.sidebar.Sidebar.RenderOptions
> {
    #rules: RulesEntry[] | null = null;
    #results: RulesEntry[] = [];
    #searchTerm: string = '';

    async loadRules() {
        try {
            const res = await fetch(`modules/GURPSRulesLookup/assets/gurps_rules.json`);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            this.#rules = await res.json();
        } catch (err: any) {
            ui?.notifications?.error('GURPS Rules Lookup: Could not load Rules Database' + err.message);
            return;
        }
    }

    static override tabName = `rulesSearch`;

    static override DEFAULT_OPTIONS = {
        classes: [`RulesLookupSidebar`],
        window: {},
        actions: {
            pdf: SearchSidebar.#onPDF,
        },
    };

    static override PARTS = {
        search: {
            template: `modules/GURPSRulesLookup/templates/search.hbs`,
        },
        results: {
            template: `modules/GURPSRulesLookup/templates/results.hbs`,
        },
    };

    override async _prepareContext(
        options: foundry.applications.sidebar.Sidebar.RenderOptions,
    ): Promise<SearchSidebarRenderContext> {
        const SuperContext = await super._prepareContext(options);
        const context = { ...SuperContext, results: this.#results, searchTerm: this.#searchTerm };
        return context;
    }

    static async #onPDF(this: SearchSidebarRenderContext, event: PointerEvent, target: HTMLElement): Promise<void> {
        event.preventDefault();
        const pdf = target.dataset.pdf;

        if (!pdf) {
            console.error('No PDF link found on target element');
            return;
        }
        GURPS.executeOTF('[PDF:' + pdf + ']');
    }

    protected override async _onRender(
        context: DeepPartial<SearchSidebarRenderContext>,
        options: DeepPartial<foundry.applications.sidebar.Sidebar.RenderOptions>,
    ): Promise<void> {
        super._onRender(context, options);
        if (!this.#rules) await this.loadRules();

        const searchInput = this.element.querySelector<HTMLInputElement>('input[data-action="search"]');
        if (searchInput) {
            searchInput.addEventListener('input', (event) => {
                event.preventDefault();
                const target = event.currentTarget as HTMLInputElement;
                const value = target.value || '';
                if (value === this.#searchTerm) return;
                this.#searchTerm = value;
                if (value.trim() === '') {
                    this.#results = [];
                    this.render({ parts: ['results'] });
                    return;
                }
                if (!this.#rules) return;
                this.#results = this.#rules.filter((r: RulesEntry) =>
                    r.Rule.toLowerCase().includes(value.toLowerCase()),
                );
                if (this.#results.length > 35) {
                    this.#results = [];
                }
                this.render({ parts: ['results'] });
            });
        }
    }
}
