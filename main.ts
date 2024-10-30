import { Plugin } from 'obsidian';

import { inspect } from 'util' // or directly

// import { ParseMethod } from 'mathjax-full/js/input/tex/Types'
// import TexParser from 'mathjax-full/js/input/tex/TexParser';
// Remember to rename these classes and interfaces!
type AllowValue = "all" | "safe" | "none";



interface MJAXFont {
	cssFamilyPrefix: string;
	cssFontMap: any;
}

interface MathJax {
	startup: {
		ready: () => void;
		pageReady: () => void;
		output: {
			font: MJAXFont;
			options: {
				font: MJAXFont;
				matchFontHeight: boolean;
				mathmlSpacing: boolean;
				merrorFont: string;
				merrorInheritFont: boolean;
				minScale: number;
				mtextFont: string;
				mtextInheritFont: boolean;
			};
			factory: {
				jax: {
					document: {
						safe: {
							allow: {
								URLs: AllowValue;
								classes: AllowValue;
								classIDs: AllowValue;
								styles: AllowValue;
							}
						}
					}
				}
			}
		}
	};
	config: any;
	_: any;
}

declare global {
	interface Window { MathJax: MathJax; }
}


// Namespace
// const MathHaxMethods: Record<string, ParseMethod> = {};

// MathHaxMethods.Machine = function (parser: TexParser, name: string, machine: 'tex' | 'ce' | 'pu') {

// }

export default class MyPlugin extends Plugin {
	intervalId: number;

	async onload() {
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

		console.log(inspect(window.MathJax.startup, false, 10, false));
	}

	registerExtension() {
		console.log("attempted registering");
		window.clearInterval(this.intervalId);
	}

	hijackMathJax(mjx: MathJax) {
		// Deactivate Safe mode because we want power!
		mjx.startup.output.factory.jax.document.safe.allow = {
			URLs: "safe",
			classes: "all",
			classIDs: "all",
			styles: "all"
		}


		// Inject a Font into MathJax
		const defaultView = document.defaultView;
		if (defaultView) {
			// We can inject our font
			const fontStr = defaultView.getComputedStyle(this.app.workspace.containerEl).getPropertyValue("--font-text")
			const fonts = fontStr.split(/,\s?(?=(?:[^"']*["'][^"']*["'])*[^"']*$)/g);
			mjx.startup.output.options.mtextFont = fonts[0];
		}

		// Create a CommandMap because why not
		// new mjx._.input.tex.SymbolMap.CommandMap()
	}

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
	}
}