import MathHaxPlugin from './main';
import { App, PluginSettingTab, Setting } from 'obsidian';
// import { UnitOptionDefaults } from './siunitx/options/unitOptions';
import { siunitxDefaults } from './siunitx/options/options';
import { PrefixMode, SeparateUncertaintyUnits } from './siunitx/options/quantityOptions';
import { PerMode, QualifierMode } from './siunitx/options/unitOptions';
import { ExponentMode, RoundMode, GroupDigits, UncertaintyMode } from './siunitx/options/numberOptions';
import { ExponentsMode, UnitsModeProduct } from './siunitx/options/listOptions';


const PerModeOptions: PerMode[] = ['power', 'fraction', 'symbol', 'power-positive-first', 'repeated-symbol', 'single-symbol', 'perMode'];
const QualifierModeOptions: QualifierMode[] = ['subscript', 'bracket', 'combine', 'phrase'];
const PrefixModeOptions: PrefixMode[] = ['input', 'combine-exponent', 'extract-exponent'];
const SeparateUncertaintyUnitsOptions: SeparateUncertaintyUnits[] = ['bracket', 'repeat', 'single'];
const ExponentModeOptions: ExponentMode[] = ['input', 'fixed', 'engineering', 'scientific', 'threshold'];
const RoundModeOptions: RoundMode[] = ['none', 'figures', 'places', 'uncertainty'];
const GroupDigitsOptions: GroupDigits[] = ['all', 'none', 'decimal', 'integer'];
const UncertaintyModeOptions: UncertaintyMode[] = ['separate', 'compact', 'full', 'compact-marker'];
const ExponentsModeOptions: ExponentsMode[] = ['individual', 'combine-bracket', 'combine'];
const UnitsModeProductOptions: UnitsModeProduct[] = ['repeat', 'bracket', 'single', 'bracket-power', 'power'];

const OPTION_CHOICES: Record<string, string[]> = {
    "per-mode": PerModeOptions,
	"display-per-mode": PerModeOptions,
	"inline-per-mode": PerModeOptions,
    "qualifier-mode": QualifierModeOptions,
    "prefix-mode": PrefixModeOptions,
    "separate-uncertainty-units": SeparateUncertaintyUnitsOptions,
	"exponent-mode": ExponentModeOptions,
    "round-mode": RoundModeOptions,
    "group-digits": GroupDigitsOptions,
    "uncertainty-mode": UncertaintyModeOptions,

    "list-exponents": ExponentsModeOptions,
    "list-units": SeparateUncertaintyUnitsOptions,
    "product-exponents": ExponentsModeOptions,
    "product-mode": ['symbol', 'phrase'],
    "product-units": UnitsModeProductOptions,
    "range-exponents": ExponentsModeOptions,
    "range-units": SeparateUncertaintyUnitsOptions,

    "complex-angle-unit": ['degrees', 'radians'],
	"complex-mode": ['input', 'cartesian', 'polar'],
	"complex-root-position": ['before-number', 'after-number']
}

const IGNORED_OPTIONS = [
    "uncertainty-descriptor-mode", "bracket-ambiguous-numbers", 'evaluate-expression', 'expression',
     "display-per-mode", "inline-per-mode", 'mode', 'numberMode', 'unitMode', "allow-quantity-breaks", 
     'mode', 'numberMode', 'unitMode', 'resetTextFamily', 'resetTextSeries', 'resetTextShape', 
     'propagateMathFont', 'resetMathVersion', 'textFamilyToMath', 'textFontCommand', 'textSubscriptCommand', 
     'textSuperscriptCommand', 'textSeriesToMath'
];


export class MathHaxSettingTab extends PluginSettingTab {
    plugin: MathHaxPlugin;

    constructor(app: App, plugin: MathHaxPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Date format')
            .setDesc('Default date format')
            .addDropdown((dropdown) =>
                dropdown.addOptions({
                    'left': 'Left',
                    'right': 'Right',
                })
                .setValue(this.plugin.settings.tagSide)
                .onChange(async (value) => {
                    this.plugin.settings.tagSide = (value as any); // @ts-ignore
                    await this.plugin.saveSettings();
                })
            );

        
        new Setting(containerEl)
            .setName('SIUnitx Configuration')
            .setHeading();

        for (const [key, defaultValue] of Object.entries(siunitxDefaults)) {
            if (IGNORED_OPTIONS.includes(key)) {
                continue;
            }

            const s = new Setting(containerEl)
                .setName(key);
            
            switch (typeof defaultValue) {
                case 'boolean':
                    s.addToggle((toggle) => { 
                        toggle
                            .setValue((this.plugin.settings.siunitx as any)[key] ?? defaultValue)
                            .onChange(async (value) => await this.updateSIValue(key, value, defaultValue))
                    });
                    break;
                case 'string':
                    if (key in OPTION_CHOICES) {
                        s.addDropdown((dropdown) => { 
                            dropdown
                                .addOptions(OPTION_CHOICES[key].reduce((prev, cur, _) => {
                                    prev[cur] = cur;
                                    return prev;
                                }, {} as Record<string, string>))
                                .setValue((this.plugin.settings.siunitx as any)[key] ?? defaultValue)
                                .onChange(async (value) => await this.updateSIValue(key, value, defaultValue))
                        });
                        break;
                    }
                    s.addText((text) => { 
                        text
                            .setValue((this.plugin.settings.siunitx as any)[key] ?? defaultValue)
                            .onChange(async (value) => await this.updateSIValue(key, value, defaultValue))
                    });
                    break;
                case 'number':
                    s.addText((text) => { 
                        text
                            .setPlaceholder('number')
                            .setValue((this.plugin.settings.siunitx as any)[key] ?? defaultValue)
                            .onChange(async (value) => {
                                // Validate the input as a number
                                let numValue: number;
                                try {
                                    numValue = parseFloat(value);
                                } catch (error) {
                                    // TODO: indicate error
                                }
                                await this.updateSIValue(key, value, numValue);
                            });
                    });
                    break;
            }
        }
    }
    
    private async updateSIValue(key: string, value: any, defaultValue: any) {
        if (value != defaultValue) {
        (this.plugin.settings.siunitx as any)[key] = value;
        } else if (key in this.plugin.settings.siunitx) {
            // If the value is the same as the default, delete it from the settings
            delete (this.plugin.settings.siunitx as any)[key];
        }

        // update config value for MathJax
        window.MathJax.startup.input[0]._parseOptions.options.siunitx[key] = value;
        
        await this.plugin.saveSettings();
    }
}
