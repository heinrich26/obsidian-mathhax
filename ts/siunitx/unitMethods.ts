import { MmlNode } from "mathjax-full/ts/core/MmlTree/MmlNode";
import { TexError, TexParser } from "../bindings/input/tex";
import TexParserImpl from "mathjax-full/ts/input/tex/TexParser";

import { siunitxError } from "./error/errors";
import { findOptions, IOptions } from "./options/options";
import { IUnitOptions, QualifierMode } from "./options/unitOptions";
import { UserDefinedUnitOptionsKey, UserDefinedUnitsKey } from "./siunitx";
import { prefixSymbol, unitSymbol, unitSymbolsWithShortcuts } from "./units";
// import { createQuantityProductMml } from "./qtyMethods";

export interface IUnitPiece {
	symbol?: string;
	prefix?: string;
	position?: 'numerator' | 'denominator', // used as an override for power.  i.e. can make power negative if denominator.
	power?: number;
	qualifier?: string;
	cancel?: boolean;
	highlight?: string; // color
}

interface IUnitMacroProcessResult {
	type: 'prefix' | 'unit' | 'previous' | 'next';  // either a prefix, unit, or modifier for previous or next unit
	result: IUnitPiece;
	options?: Partial<IOptions>;
}

const modifierMacros: Array<string> = new Array<string>(
	'square',
	'cubic',
	'squared',
	'cubed',
	'tothe',
	'raiseto',
	'per',
	'of',
	'cancel',
	'highlight'
);

function processUnitMacro(macro: string, parser: TexParserImpl): IUnitMacroProcessResult {
	macro = macro.substring(1);
	if (modifierMacros.includes(macro)) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return modifierMacroMap.get(macro)!(macro, parser);
	}

	if (prefixSymbol.has(macro)) {
		return { type: 'prefix', result: { prefix: prefixSymbol.get(macro) } };
	}

	const userDefinedUnits = parser.configuration.packageData.get('siunitx')[UserDefinedUnitsKey] as Map<string, string>;
	if (userDefinedUnits.has('\\' + macro)) {
		const result = userDefinedUnits.get('\\' + macro);
		const userDefinedUnitOptions = parser.configuration.packageData.get('siunitx')[UserDefinedUnitOptionsKey] as Map<string, Partial<IOptions>>;
		const options = userDefinedUnitOptions.get('\\' + macro);
		return { type: 'unit', result: { symbol: result as string, prefix: '' }, options: options };
	}

	if (unitSymbolsWithShortcuts.has(macro)) {
		const result = unitSymbolsWithShortcuts.get(macro);
		return { type: 'unit', result: { symbol: result as string, prefix: '' } };
	}

	throw siunitxError.NoInterpretationForUnitMacro('\\' + macro);
}

const modifierMacroMap = new Map<string, (macro: string, parser: TexParserImpl) => IUnitMacroProcessResult>([
	['square', (): IUnitMacroProcessResult => { return { type: "next", result: { power: 2 } }; }],
	['cubic', (): IUnitMacroProcessResult => { return { type: "next", result: { power: 3 } }; }],
	['squared', (): IUnitMacroProcessResult => { return { type: "previous", result: { power: 2 } }; }],
	['cubed', (): IUnitMacroProcessResult => { return { type: "previous", result: { power: 3 } }; }],
	['tothe', (macro: string, parser: TexParserImpl): IUnitMacroProcessResult => {
		const arg = parser.GetArgument('tothe', true);
		return { type: "previous", result: { power: +arg } };
	}],
	['raiseto', (macro: string, parser: TexParserImpl): IUnitMacroProcessResult => {
		const arg = parser.GetArgument('raiseto');
		return { type: "next", result: { power: +arg } };
	}],
	['per', (): IUnitMacroProcessResult => { return { type: "next", result: { position: 'denominator' } }; }],
	['of', (macro: string, parser: TexParserImpl): IUnitMacroProcessResult => {
		const arg = parser.GetArgument('of');
		return { type: "previous", result: { qualifier: arg } };
	}],
	['cancel', (): IUnitMacroProcessResult => { return { type: "next", result: { cancel: true } }; }],
	['highlight', (macro: string, parser: TexParserImpl): IUnitMacroProcessResult => {
		const arg = parser.GetArgument('highlight');
		return { type: "next", result: { highlight: arg } };
	}],
]);

const qualiferMethod = new Map<QualifierMode, (qualifer: string, phrase?: string) => string>([
	['subscript', (qualifer: string): string => { return '_{' + qualifer + '}'; }],
	['bracket', (qualifer: string): string => { return '(' + qualifer + ')'; }],
	['combine', (qualifer: string): string => { return qualifer; }],
	['phrase', (qualifer: string, phrase?: string): string => { return phrase + qualifer; }],
]);

function unitLatex(unitPiece: IUnitPiece, options: IUnitOptions, absPower = false): { latex: string, superscriptPresent: boolean } {
	let unitLatex = '';
	if (unitPiece.cancel) {
		unitLatex += '\\cancel{';
	}
	if (unitPiece.highlight) {
		unitLatex += `{\\color{${unitPiece.highlight}}`;
	}
	unitLatex += options["unit-font-command"] + '{';
	//check for square root
	if (options["power-half-as-sqrt"] && unitPiece.power && unitPiece.power === 0.5) {
		unitLatex += `\\sqrt{\\class{MathML-Unit}{${unitPiece.prefix}${unitPiece.symbol}}}`;
		unitPiece.power = null;
	} else {
		unitLatex += `\\class{MathML-Unit}{${unitPiece.prefix}${unitPiece.symbol}}`;
	}
	if (unitPiece.qualifier) {
		unitLatex += qualiferMethod.get(options["qualifier-mode"])?.(unitPiece.qualifier, options["qualifier-phrase"]);
	}
	unitLatex += '}';
	const power = (unitPiece.power !== undefined && unitPiece.power !== null)
		? (absPower
			? Math.abs(unitPiece.power * (unitPiece.position === 'denominator' ? -1 : 1))
			: unitPiece.power * (unitPiece.position === 'denominator' ? -1 : 1))
		: (absPower
			? Math.abs(1 * (unitPiece.position === 'denominator' ? -1 : 1))
			: 1 * (unitPiece.position === 'denominator' ? -1 : 1));
	if (power !== null && power !== undefined && power !== 1) {
		unitLatex += '^{' + power + '}';
	}
	if (unitPiece.cancel) {
		unitLatex += '}';
	}
	if (unitPiece.highlight) {
		unitLatex += '}';
	}
	return { latex: unitLatex, superscriptPresent: power !== 1 };
}

export function displayUnits(parser: TexParserImpl, unitPieces: Array<IUnitPiece>, options: IOptions, isLiteral: boolean): string {
	let closeColor = false;
	let texString = '';
	if (options["unit-color"] !== '') {
		texString += `{\\color{${options["unit-color"]}}`;
		closeColor = true;
	} else if (options.color !== '') {
		texString += `{\\color{${options.color}}`;
		closeColor = true;
	}
	let perForSingle = false;
	if (unitPieces.length >= 2 && unitPieces.filter((v) => {
		const power = (v.power !== null && v.power !== undefined)
			? (v.power * (v.position === 'denominator' ? -1 : 1))
			: 1;
		return Math.sign(power) === -1;
	}).length === 1 && options["per-mode"] === 'single-symbol') {
		perForSingle = true;
	}

	if (isLiteral) {
		let latex = '';
		let startsSlash: IUnitPiece = null;
		unitPieces.every(p => {
			if (p.position === 'denominator') {

				startsSlash = p;
				return false;
			} else {
				return true;
			}
		});
		unitPieces.forEach((v) => {
			if (v === startsSlash) {
				latex += ' / ';
			}
			const latexResult = unitLatex(v, options);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			if (latex !== '') {
				latex += options["inter-unit-product"];
			}
			latex += latexResult.latex;

		});
		texString += latex;

	} else {
		// useful for bracket-unit-denominator with perMode=symbol
		// also useful for perMode=single-symbol
		let numeratorCount = 0;
		let denominatorCount = 0;
		unitPieces.forEach((v) => {
			if (v.position === 'denominator' || (v.power !== null && v.power !== undefined && v.power < 0)) {
				denominatorCount++;
			} else {
				numeratorCount++;
			}
		}, 0);

		if (options["per-mode"] === 'fraction' || options["per-mode"] === 'symbol'
			|| options["per-mode"] === 'repeated-symbol' || perForSingle || (options["per-mode"] === 'single-symbol' && denominatorCount === 1 && numeratorCount > 0)) {
			let numerator = '';
			let denominator = '';
			let lastNumeratorHadSuperscript = false;
			unitPieces.forEach((v) => {
				let latexResult;
				if (v.position === 'denominator' || (v.power !== null && v.power !== undefined && v.power < 0)) {
					latexResult = unitLatex(v, options, options["per-mode"] === 'fraction' || options["per-mode"] === 'symbol' || options["per-mode"] === 'repeated-symbol' || options["per-mode"] === "single-symbol" || perForSingle);

					if (denominator !== '') {
						if (options["per-mode"] === 'repeated-symbol') {
							if (latexResult.superscriptPresent) {
								denominator += options["per-symbol-script-correction"];
							}
							denominator += options["per-symbol"];
						} else {
							denominator += options["inter-unit-product"];
						}
					}
					denominator += latexResult.latex;
				} else {
					latexResult = unitLatex(v, options, options["per-mode"] === 'fraction' || options["per-mode"] === 'symbol' || options["per-mode"] === 'repeated-symbol' || options["per-mode"] === "single-symbol" || perForSingle);
					lastNumeratorHadSuperscript = latexResult.superscriptPresent;
					if (numerator !== '') {
						numerator += options["inter-unit-product"];
					}
					numerator += latexResult.latex;
				}
			});

			// if no numerator, use 1... but use nothing if denominator is empty, too
			if (numerator === '' && denominator !== '') {
				numerator = '1';
			}
			// if no denominator, then no fraction needed.
			if (denominator !== '') {
				//adjust denominator if brackets are needed
				if (denominatorCount > 1 && options["per-mode"] === 'symbol' && options["bracket-unit-denominator"]) {
					denominator = '(' + denominator + ')';
				}
				if (options["per-mode"] === 'fraction') {
					texString += options["fraction-command"] + '{' + numerator + '}{' + denominator + '}';
				}
				else if (options["per-mode"] === 'repeated-symbol' || options["per-mode"] === 'symbol' || perForSingle || options["per-mode"] === 'single-symbol') {
					texString += numerator + (lastNumeratorHadSuperscript ? options["per-symbol-script-correction"] : '') + options["per-symbol"] + denominator;
				}
				else {
					throw siunitxError.DenominatorParsingError(denominator, options["per-mode"]);
				}
			} else {
				texString += numerator;
			}

		} else {
			if (options["per-mode"] === 'power-positive-first') {
				unitPieces = unitPieces.sort((x, y) => {
					let a = (x.power !== null && x.power !== undefined) ? x : 1;
					if (x.position === 'denominator') {
						a = -a;
					}
					let b = (y.power !== null && y.power !== undefined) ? y : 1;
					if (y.position === 'denominator') {
						b = -b;
					}
					if (a < b) return 1;
					else if (a > b) return -1;
					else return 0;
				});
			}
			let latex = '';
			//let lastHadSuperscript = false;
			unitPieces.forEach((v) => {
				const latexResult = unitLatex(v, options);
				//lastHadSuperscript = latexResult.superscriptPresent;
				if (latex !== '') {
					latex += options["inter-unit-product"];
				}
				latex += latexResult.latex;

			});

			texString += latex;
		}

	}
	if (closeColor) {
		texString += '}';
	}

	return texString;

}



export function parseUnit(parser: TexParserImpl, text: string, globalOptions: IOptions, localOptions: Partial<IOptions>, isLiteral: boolean): Array<IUnitPiece> {
	const unitPieces: Array<IUnitPiece> = new Array<IUnitPiece>();

	// argument contains either macros or it's just plain text
	if (!isLiteral) {
		const subParser = new TexParser(text, parser.stack.env, parser.configuration)
		subParser.i = 0;
		let nextModifier: IUnitPiece | null = null;
		while (subParser.i < subParser.string.length) {
			const macro = subParser.GetArgument('unit');
			const processedMacro = processUnitMacro(macro, subParser);
			// check for user defined options
			if (processedMacro.options !== undefined) {
				Object.assign(globalOptions, processedMacro.options);
			}
			// apply immediate options here
			Object.assign(globalOptions, localOptions);

			switch (processedMacro.type) {
				case 'next':
				case 'prefix':
					if (nextModifier !== null) {
						nextModifier = Object.assign(nextModifier, processedMacro.result);
					} else {
						nextModifier = processedMacro.result;
					}
					break;
				case 'previous':
					{
						if (unitPieces.length === 0) {
							throw new TexError("MissingPreviousMacro", "There is no previous macro for %1 to modify.", macro);
						}
						let last = unitPieces[unitPieces.length - 1];
						last = Object.assign(last, processedMacro.result);
						break;
					}
				case 'unit':
					{
						if (nextModifier !== null) {
							processedMacro.result = Object.assign(processedMacro.result, nextModifier);
							// TODO: WHY IS THIS parser.options and not globaloptions???
							// Is this even needed?  repeated-symbol is a display option, not a parsing option.
							if ((parser.options.siunitx as IOptions)["per-mode"]=== 'repeated-symbol' || globalOptions["sticky-per"]) {
								const denom = nextModifier.position === 'denominator';
								nextModifier = null;
								if (denom) {
									nextModifier = { position: 'denominator' };
								}
							} else {
								nextModifier = null;
							}
						}
						unitPieces.push(processedMacro.result);
						break;
					}
			}
		}

	} else {
		unitPieces.push(...parsePlainTextUnits(parser, text));
	}
	return unitPieces;
}

export function processUnit(parser: TexParserImpl): MmlNode {
	const globalOptions: IOptions = { ...parser.options.siunitx as IOptions };

	// TODO: may be better done a different way. double check.
	const localOptions = findOptions(parser, globalOptions);

	if ((localOptions["parse-units"] === undefined || localOptions["parse-units"] === true) &&
		globalOptions["parse-units"] === true
	) {

		const text = parser.GetArgument('unit');

		// There are no switches to change internally that indicates the unit was literal vs interpreted. 
		// If literal, we do NOT apply per-mode settings.
		// We'll check if text had backslashes and pass that result to the next functions.

		const isLiteral = (text.indexOf('\\') === -1);
		// This will only be a global option.  
		if (globalOptions["forbid-literal-units"]) {
			throw siunitxError.LiteralUnitsForbidden(text);
		}

		const unitPieces = parseUnit(parser, text, globalOptions, localOptions, isLiteral);

		const texString = displayUnits(parser, unitPieces, globalOptions, isLiteral);
		return (new TexParser(texString, parser.stack.env, parser.configuration)).mml();
	} else {
		return parser.mml();
	}

}

function joinValues(values: IterableIterator<string>, joinString: string): string {
	return Array.from(values).filter((e, i, a) => i === a.indexOf(e)).sort((a, b) => a.length - b.length).join(joinString);
}


function processPrefixUnitCombo(text: string, unitPiece: IUnitPiece): void {
	const prefixes = joinValues(prefixSymbol.values(), '|');
	const units = joinValues(unitSymbol.values(), '|');
	// TODO: Do I need to sort regex options from long string to short string?  
	// I don't think so since we're parsing a single unit at a time...but I should verify.

	const regex = new RegExp('(' + prefixes + ')?(' + units + ')');
	const result = regex.exec(text);

	if (result === null) {
		return;
	}

	if (result[1] !== undefined && result[1] !== null) {
		unitPiece.prefix = result[1];
	} else {
		unitPiece.prefix = '';
	}
	unitPiece.symbol = result[2];
}

function parsePlainTextUnits(parser: TexParserImpl, text: string): Array<IUnitPiece> {
	const unitPieces: Array<IUnitPiece> = new Array<IUnitPiece>();
	const subParser = new TexParser(text, parser.stack.env, parser.configuration);
	subParser.i = 0;

	let unitPiece: IUnitPiece = { position: 'numerator' };
	let isDenominator = false;
	let prefixUnit = '';
	while (subParser.i < subParser.string.length) {
		switch (subParser.string.charAt(subParser.i)) {
			case '~':
			case '.':
				//process prefix-unit string into unitPiece
				processPrefixUnitCombo(prefixUnit, unitPiece);
				unitPieces.push(unitPiece);
				prefixUnit = ''
				unitPiece = { position: isDenominator ? 'denominator' : 'numerator' };
				break;
			case '/':
				//process prefix-unit string into unitPiece
				processPrefixUnitCombo(prefixUnit, unitPiece);
				unitPieces.push(unitPiece);
				prefixUnit = ''
				isDenominator = true;
				unitPiece = { position: isDenominator ? 'denominator' : 'numerator' };
				break;
			case '^':
				{
					//power
					let next = subParser.string.charAt(++subParser.i);
					let power = '';
					if (next === '{') {
						while ((next = subParser.string.charAt(++subParser.i)) !== '}') {
							power += next;
						}
					} else {
						power = next;
					}
					unitPiece.power = +power;
					break;
				}
			case '_':
				{
					//of
					let next = subParser.string.charAt(++subParser.i);
					let qualifier = '';
					if (next === '{') {
						while ((next = subParser.string.charAt(++subParser.i)) !== '}') {
							qualifier += next;
						}
					} else {
						qualifier = next;
					}
					unitPiece.qualifier = qualifier;
					break;
				}
			default:
				//add char to prefix-unit string
				prefixUnit += subParser.string.charAt(subParser.i);
				break;
		}
		subParser.i++;
		//return parser.string.slice(j, parser.i -1);
	}

	processPrefixUnitCombo(prefixUnit, unitPiece);
	unitPieces.push(unitPiece);
	// throw new TexError('MissingCloseBracket',
	// 'Could not find closing \']\' for argument to %1', parser.currentCS);

	return unitPieces;
}
