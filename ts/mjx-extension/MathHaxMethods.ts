/**
 * @fileoverview Parse methods and helper functions for the MathHacks package.
 *
 * @author heinrich26
 */

import { NewcommandUtil, ParseUtil, TexError, TexParser } from '../bindings/input/tex';
import { TEXCLASS } from '../bindings/core/MmlTree';

import { ParseMethod } from 'mathjax-full/ts/input/tex/Types';
import TexParserImpl from 'mathjax-full/ts/input/tex/TexParser';

import { romanize } from 'romans';


export const MathHaxMethods: Record<string, ParseMethod> = {};


MathHaxMethods.Rnum = function (parser: TexParserImpl, name: string) {
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

MathHaxMethods.Series = function (parser: TexParserImpl, name: string) {
    // template and separator are not trimmed, thus allowing them to interact with surrounding tokens
    let repeatS = ParseUtil.trimSpaces(parser.GetBrackets(name, '2'));
    if (!repeatS.match(/^\d+$/) || repeatS == '0') throw new TexError('InvalidRepetitionNumber', 'Invalid integer: %1', repeatS);

    const template = parser.GetArgument(name);
    const separator = parser.GetArgument(name);
    const upperBound = ParseUtil.trimSpaces(parser.GetArgument(name));

    if (!upperBound.match(/^(\.\.\w+|\.\.\.\w+|\d+)$/) || upperBound == '0') {
        throw new TexError('InvalidUpperBound', 'Invalid upper bound: %1', upperBound);
    }

    function f(index: string | number): string {
        return template.replace(/#1/g, `{${index}}`);
    }
    
    let s = '';
    if (upperBound.startsWith('..')) {
        const end = upperBound.slice(upperBound.startsWith('...') ? 3 : 2);
        s = `${separator}\\dots${separator}${f(end)}`;
    } else {
        repeatS = upperBound;
    }
    s = [...Array(parseInt(repeatS, 10)).keys()].map((_, i) => f(i+1)).join(separator) + s;

    parser.Push(new TexParser(s, parser.stack.env, parser.configuration).mml());
} as ParseMethod;

MathHaxMethods.VecRange = function (parser: TexParserImpl, name: string) {
    // same as Series, but with brackets around and default separator of comma
    let repeatS = ParseUtil.trimSpaces(parser.GetBrackets(name, '2'));
    if (!repeatS.match(/^\d+$/) || repeatS == '0') throw new TexError('InvalidRepetitionNumber', 'Invalid integer: %1', repeatS);

    const template = ParseUtil.trimSpaces(parser.GetArgument(name));
    const upperBound = ParseUtil.trimSpaces(parser.GetArgument(name));

    if (!upperBound.match(/^(\.\.\w+|\.\.\.\w+|\d+)$/) || upperBound == '0') {
        throw new TexError('InvalidUpperBound', 'Invalid upper bound: %1', upperBound);
    }

    function f(index: string | number): string {
        return template.replace(/#1/g, `{${index}}`);
    }
    
    let s = '';
    if (upperBound.startsWith('..')) {
        const end = upperBound.slice(upperBound.startsWith('...') ? 3 : 2);
        s = `,\\dots,${f(end)}`;
    } else {
        repeatS = upperBound;
    }
    s = [...Array(parseInt(repeatS, 10)).keys()].map((_, i) => f(i+1)).join(',') + s;

    parser.Push(new TexParser('\\left[' + s + '\\right]', parser.stack.env, parser.configuration).mml());
} as ParseMethod;