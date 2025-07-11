import { MmlNode } from "mathjax-full/ts/core/MmlTree/MmlNode";
import { TexParser } from "../bindings/input/tex";
import TexParserImpl from "mathjax-full/ts/input/tex/TexParser";

// import { createQuantityProductMml } from "./qtyMethods";
import { displayOutputMml } from "./numDisplayMethods";
import { displayUnits, parseUnit } from "./unitMethods";
import { exponentListModeMap } from "./numlistMethods";
import { IOptions, findOptions } from "./options/options";
import { INumberPiece } from "./numMethods";
import { parseProductList } from "./numproductMethods";
import { postProcessNumber } from "./numPostProcessMethods";
import { unitListModeMap } from "./qtylistMethods";


const listNumberMap = new Map<number, (nums:INumberPiece[], unitLatex: string, parser: TexParserImpl, options: IOptions)=>MmlNode>([
	[1, (nums: INumberPiece[], unitLatex: string, parser: TexParserImpl, options: IOptions) => {
        const root = parser.create('node', 'inferredMrow', [], {});
        const node = displayOutputMml(nums[0], parser, options);
        root.appendChild(node);
        const unitNode = (new TexParser(unitLatex, parser.stack.env, parser.configuration)).mml();
        root.appendChild(unitNode);
        return root;
    }],  
	[3, (nums: INumberPiece[], unitLatex: string, parser: TexParserImpl, options: IOptions) => {
        const exponentMapItem = exponentListModeMap.get(options["list-exponents"]);
        const exponentResult = exponentMapItem(nums, parser, options);

        const unitsMapItem = unitListModeMap.get(options["product-units"]);
        const unitsResult = unitsMapItem(exponentResult, unitLatex, parser,options);

        const root = parser.create('node', 'inferredMrow', [], {});
        if (unitsResult.leading){
            root.appendChild(unitsResult.leading);
        }
        //total = total.concat(displayOutputMml(exponentResult.numbers[0], parser, options));
        root.appendChild(unitsResult.numbers[0]);
        for (let i=1; i< nums.length; i++){
            const separator = (new TexParser(options["product-mode"] === 'symbol' ? options["product-symbol"] : `\\text{${options["product-phrase"]}}`, parser.stack.env, parser.configuration)).mml();
            //const next = displayOutputMml(exponentResult.numbers[i], parser, options);
            root.appendChild(separator);
            root.appendChild(unitsResult.numbers[i]);
        }
        if (unitsResult.trailing){
            root.appendChild(unitsResult.trailing);
        }
        return root;
    }]
]);

export function processQuantityProduct(parser: TexParserImpl): void {
	const globalOptions: IOptions = { ...parser.options.siunitx as IOptions };

	const localOptions = findOptions(parser, globalOptions);

	Object.assign(globalOptions, localOptions);

	let text = parser.GetArgument('num');
    const unitString = parser.GetArgument('unit');
    const isLiteral = (unitString.indexOf('\\') === -1);
	const unitPieces = parseUnit(parser, unitString, globalOptions, localOptions, isLiteral);

	if (globalOptions["parse-numbers"]) {

		// going to assume evaluate expression is processed first, THEN the result is parsed normally
		if (globalOptions["evaluate-expression"]) {
			// TODO Sanitize Evaluate Expression!
			let expression = globalOptions.expression
			expression = expression.replace('#1', text);
			text= eval(expression).toString();
		}

		const numlist = parseProductList(parser, text, globalOptions);
        if (globalOptions["product-exponents"] === 'individual'){
            numlist.forEach(v=>{
                postProcessNumber(parser, v, globalOptions);
            });
        } else {
            const targetExponent = numlist[0].exponentSign + numlist[0].exponent;
            const altOptions = Object.assign(globalOptions, { exponentMode: 'fixed', fixedExponent: targetExponent });
            numlist.forEach((v,i)=>{
                if (i === 0){
                    postProcessNumber(parser, v, globalOptions);
                } else {
                    postProcessNumber(parser, v, altOptions);
                }
            });
        }

        // Need to process this after number because some options alter unit prefixes
        if (globalOptions["product-units"] === 'power' || globalOptions["product-units"] === 'bracket-power'){
            const multiplier = numlist.length;
            unitPieces.forEach(v=>{
                if (v.power){
                    v.power = v.power*multiplier;
                } else {
                    v.power = multiplier;
                }
            })
        }

        const unitLatex = displayUnits(parser, unitPieces, globalOptions, isLiteral);

        const mapItem = listNumberMap.get(numlist.length) ?? listNumberMap.get(3);
        const mmlNode = mapItem(numlist, unitLatex, parser, globalOptions);
        parser.Push(mmlNode);
		
	} else {
		const mml = (new TexParser(text, parser.stack.env, parser.configuration)).mml();
        parser.Push(mml);
		//return [mml];
	}

}
