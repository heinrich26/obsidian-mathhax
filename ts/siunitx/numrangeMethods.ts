
import { TexParser } from "../bindings/input/tex";
import TexParserImpl from "mathjax-full/ts/input/tex/TexParser";

import { IOptions, findOptions } from "./options/options";
import { parseNumber } from "./numMethods";
import { postProcessNumber } from "./numPostProcessMethods";
import { displayOutputMml } from "./numDisplayMethods";
import { exponentListModeMap } from "./numlistMethods";

export function processNumberRange(parser: TexParserImpl): void {
	const globalOptions: IOptions = { ...parser.options.siunitx as IOptions };

	const localOptions = findOptions(parser, globalOptions);

	Object.assign(globalOptions, localOptions);

	const first = parser.GetArgument('firstNum');
	const last = parser.GetArgument('lastNum');

	if (globalOptions["parse-numbers"]) {

		const firstNum = parseNumber(parser, first, globalOptions);
		const lastNum = parseNumber(parser, last, globalOptions);
        if (globalOptions["range-exponents"] === 'individual'){
            postProcessNumber(parser, firstNum, globalOptions);
            postProcessNumber(parser, lastNum, globalOptions);
        } else {
            const targetExponent = firstNum.exponentSign + firstNum.exponent;
            const altOptions = Object.assign(globalOptions, { exponentMode: 'fixed', fixedExponent: targetExponent });
            postProcessNumber(parser, firstNum, globalOptions);
            postProcessNumber(parser, lastNum, altOptions);
        }

        const exponentMapItem = exponentListModeMap.get(globalOptions["range-exponents"]);
        const exponentResult = exponentMapItem([firstNum, lastNum], parser, globalOptions);
        const firstMml = displayOutputMml(exponentResult.numbers[0], parser, globalOptions);
        const separator = (new TexParser(`\\text{${globalOptions["range-phrase"]}}`, parser.stack.env, parser.configuration)).mml();
        const lastMml = displayOutputMml(exponentResult.numbers[1], parser, globalOptions);
        let total = [];
        if (exponentResult.leading){
            total.push(exponentResult.leading);
        }
        total = total.concat(firstMml).concat(separator).concat(lastMml);
        if (exponentResult.trailing){
            total = total.concat(exponentResult.trailing);
        }
        
        total.forEach(v=>{
            parser.Push(v);
        });
		
	} else {
		const mml = (new TexParser(first + last, parser.stack.env, parser.configuration)).mml();
        parser.Push(mml);
		//return [mml];
	}

}
