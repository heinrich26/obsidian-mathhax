  
import { Args, ParseMethod } from 'mathjax-full/ts/input/tex/Types';
import TexParser from 'mathjax-full/ts/input/tex/TexParser'; 
import { CommandMap } from 'mathjax-full/ts/input/tex/SymbolMap';

import { Macro } from '../bindings/input/tex';
import { MATH_HAX } from '../main';

/**
 * Adds a new macro as extension to the parser.
 * @param {TexParser} parser The current parser.
 * @param {string} cs The control sequence of the delimiter.
 * @param {ParseMethod} func The parse method for this macro.
 * @param {Args[]} attr The attributes needed for parsing.
 * @param {string=} symbol Optionally original symbol for macro, in case it is
 *     different from the control sequence.
 */
export function addMacro(parser: TexParser, cs: string, func: ParseMethod, attr: Args[],
                        symbol = '') {
    const handlers = parser.configuration.handlers;
    const handler = handlers.retrieve(MATH_HAX) as CommandMap;
    handler.add(cs, new Macro(symbol ? symbol : cs, func, attr));
}