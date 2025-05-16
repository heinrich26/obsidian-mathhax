import { Plugin } from 'obsidian';
import { MathHaxSettingTab } from './pluginSettings';
import { createMathHaxMap } from './mjx-extension/MathHaxConfiguration';
import { MathJax } from './bindings';

// import { PrioritizedList } from 'mathjax-full/ts/util/PrioritizedList';
import { createSIUnitxConfiguration} from './siunitx/siunitx';
import { IOptions } from './siunitx/options/options';


interface MathHaxPluginSettings {
	tagSide: 'left' | 'right',
	siunitx: Partial<IOptions>
}

const DEFAULT_SETTINGS: Partial<MathHaxPluginSettings> = {
	tagSide: 'right',
	siunitx: {}
};

export const MATH_HAX = 'mathhax';

export default class MathHaxPlugin extends Plugin {
	intervalId: number;
	settings: MathHaxPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new MathHaxSettingTab(this.app, this));

		// Check if MathJax is available
		if (typeof window.MathJax !== 'undefined' && typeof window.MathJax.config !== 'undefined') {
			console.log("MathHax Plugin was loaded!");
			this.hijackMathJax(window.MathJax);
		} else {
			console.warn("MathJax not loaded. Custom macros cannot be injected.");
			// Optionally, listen for an event indicating MathJax availability (if applicable)
		}

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.intervalId = window.setInterval(this.registerExtension, 10)
		// this.registerInterval(this.intervalId);
	}

	private hijackMathJax(mjx: MathJax) {
		// Deactivate Safe mode because we want power!
		mjx.startup.output.factory.jax.document.safe.allow = {
			URLs: "safe",
			classes: "all",
			classIDs: "all",
			styles: "all"
		}

		this.fixMathJax(mjx);


		// Inject a Font into MathJax
		const defaultView = document.defaultView;
		if (defaultView) {
			// We can inject our font
			const fontStr = defaultView.getComputedStyle(this.app.workspace.containerEl).getPropertyValue("--font-text")
			const fonts = fontStr.split(/,\s?(?=(?:[^"']*["'][^"']*["'])*[^"']*$)/g);
			mjx.startup.output.options.mtextFont = fonts[0];
			mjx.startup.output.options.merrorFont = 'var(--font-monospace)';
		}

		//
		// Change Tag placement
		//

		// Pre-Init
		this.updateTagSide(mjx);

		this.injectCustomMacros(mjx);
	}

	/**
	 * Updates the `tagSide` option of MathJax.
	 * 
	 * @param mjx MathJax instance
	 */

	private injectCustomMacros(mjx: MathJax) {
		// create and register our macro-map
		
		const handlers = mjx.startup.input.first()?.configuration.handlers
		if (handlers === undefined) return // Input object hasn't been initialized
		
		createSIUnitxConfiguration(mjx, this.settings); // configuration should probably be created before adding the maps

		handlers.get('macro').add([createMathHaxMap()], null, /* PrioritizedList.DEFAULTPRIORITY */ 5);
		
		/* Test with:
		MathJax.startup.input[0].configuration.handlers.get("macro").retrieve('mathhax');
		*/
	}

	private updateTagSide(mjx: MathJax) {
		mjx.startup.input.forEach((conf) => { 
			conf.options.tagSide = this.settings.tagSide;
			// Post-Init
			if ('_parseOptions' in conf) {
				conf._parseOptions.options.tagSide = this.settings.tagSide;
			} /* Input object hasn't been initialized */
		});
	}

	private fixMathJax(mjx: MathJax) {
		// Fixes Issue #3365
		const {Styles} = mjx._.util.Styles;
		Object.defineProperty(Styles.prototype, 'cssText', {
			get: function () {
				const styles = [];
				for (const name of Object.keys(this.styles)) {
					const parent = this.parentName(name);
					const cname = name.replace(/.*-/, '');
					if (!this.styles[parent] || !Styles.connect[parent]?.children?.includes(cname)) {
						styles.push(`${name}: ${this.styles[name]};`);
					}
				}
				return styles.join(' ');
			},
			enumerable: false,
			configurable: true,
		});
	}

	/**
	 * Called when the plugin is unloaded/disabled.
	 */
	onunload() {
		const mjx = window.MathJax;

		// Reactivate Safe mode
		mjx.startup.output.factory.jax.document.safe.allow = {
			URLs: "safe",
			classes: "safe",
			classIDs: "safe",
			styles: "safe"
		}

		mjx.startup.output.options.mtextFont = "";
		mjx.startup.output.options.merrorFont = "";

		// TODO: unload siunitx and mathhax-macros
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	
	async saveSettings() {
		await this.saveData(this.settings);

		this.updateTagSide(window.MathJax);
	}
}