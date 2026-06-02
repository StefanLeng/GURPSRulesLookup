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
    #categories: { cat: string }[] = [];
    #selectedCategories: string[] = [];
    #message: string = 'To many results found. Please refine your search.';

    async loadRules() {
        try {
            const res = await fetch(`modules/GURPSRulesLookup/assets/gurps_rules.json`);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            this.#rules = await res.json().then((data) => {
                return data.map((entry: any) => {
                    return {
                        ...entry,
                        //normalize category to always be an array
                        Category: Array.isArray(entry.Category)
                            ? entry.Category.flatMap((cat: string) => cat.split(';').map((c: string) => c.trim()))
                            : entry.Category.split(';').map((c: string) => c.trim()),
                    };
                });
            });
            if (this.#rules) {
                this.#categories = Array.from(new Set(this.#rules.flatMap((r) => r.Category)))
                    .sort()
                    .map((cat) => {
                        return { cat: cat };
                    });
            }
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
        if (!this.#rules) await this.loadRules();
        const SuperContext = await super._prepareContext(options);
        const context = {
            ...SuperContext,
            results: this.#results,
            searchTerm: this.#searchTerm,
            categories: this.#categories.map((c) => {
                return { cat: c.cat, selected: this.#selectedCategories.includes(c.cat) };
            }),
            message: this.#message,
        };
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
                this.search();
            });
        }
        const categorySelect = this.element.querySelector<HTMLSelectElement>('multi-select[data-action="category"]');
        if (categorySelect) {
            categorySelect.addEventListener('change', (event) => {
                event.preventDefault();
                const target = event.currentTarget as HTMLSelectElement;
                const values = Array.from(target.value);
                if (JSON.stringify(values) === JSON.stringify(this.#selectedCategories)) return;
                this.#selectedCategories = values;
                this.search();
            });
        }
    }

    private search() {
        if (!this.#rules) return;
        this.#results = this.#rules.filter((r: RulesEntry) => {
            return (
                r.Rule.toLowerCase().includes(this.#searchTerm.toLowerCase()) &&
                (this.#selectedCategories.length === 0 ||
                    r.Category.some((cat) => this.#selectedCategories.includes(cat)))
            );
        });
        if (this.#results.length === 0) {
            this.#message = 'No results found.';
        }
        if (this.#results.length > 80) {
            this.#results = [];
            this.#message = 'To many results found. Please refine your search.';
        }
        this.render({ parts: ['results'] });
    }
}
