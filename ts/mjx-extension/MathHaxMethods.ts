/**
 * @fileoverview Parse methods and helper functions for the MathHacks package.
 *
 * @author heinrich26
 */

import { ParseUtil, TexError } from '../bindings/input/tex';
import { TEXCLASS } from '../bindings/core/MmlTree';

import { ParseMethod } from 'mathjax-full/ts/input/tex/Types';
import TexParser from 'mathjax-full/ts/input/tex/TexParser';

import { romanize } from 'romans';


export const MathHaxMethods: Record<string, ParseMethod> = {};


MathHaxMethods.Rnum = function (parser: TexParser, name: string) {
    let number: string;

    const s = ParseUtil.trimSpaces(parser.GetArgument(name));

    // Check if the number is a valid Roman numeral
    if (!s.match(/^\d+$/)) throw new TexError('InvalidRomanNumeral', 'Invalid number: %1', s);

    try {
        number = romanize(parseInt(s, 10));
    } catch (_) {
        throw new TexError('InvalidRomanNumeral', 'Invalid number: %1', s);
    }

    const mml = parser.create('token', 'mn', { texClass: TEXCLASS.ORD }, number);
    parser.Push(parser.itemFactory.create('fn', mml));
} as ParseMethod;