/* eslint-disable @typescript-eslint/no-explicit-any */

import { Configuration, ParserConfiguration } from 'mathjax-full/ts/input/tex/Configuration';
import { MapHandler } from 'mathjax-full/ts/input/tex/MapHandler';
import NewcommandUtil from 'mathjax-full/ts/input/tex/newcommand/NewcommandUtil';
import NewcommandMethods from 'mathjax-full/ts/input/tex/newcommand/NewcommandMethods';
import NodeUtil from 'mathjax-full/ts/input/tex/NodeUtil';
import ParseOptions from 'mathjax-full/ts/input/tex/ParseOptions';
import ParseUtil from 'mathjax-full/ts/input/tex/ParseUtil';
import TexError from 'mathjax-full/ts/input/tex/TexError';
import TexParserImpl from 'mathjax-full/ts/input/tex/TexParser';
import { 
    SymbolMap as SymbolMapImpl,
    CharacterMap as CharacterMapImpl,
    CommandMap as CommandMapImpl
} from 'mathjax-full/ts/input/tex/SymbolMap';
import { MmlNode, TEXCLASS } from 'mathjax-full/ts/core/MmlTree/MmlNode';
import { Symbol, Macro } from 'mathjax-full/ts/input/tex/Symbol';
import { TexConstant } from 'mathjax-full/ts/input/tex/TexConstants';

export type AllowValue = "all" | "safe" | "none";

export interface MJAXFont {
    cssFamilyPrefix: string;
    cssFontMap: any;
}

export interface MathJax {
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
        },
        input: /* TeX<any, any, any>[] & */ {
            _parseOptions: ParseOptions & {
                options: {
                    tagSide: 'left' | 'right';
                    packages: string[];
                }
            },
            options: {
                tagSide: 'left' | 'right';
                packages: string[];
            },
            configuration: ParserConfiguration;

        }[]
    };
    config: any
    _: {
        input: {
            tex: {
                Configuration: {
                    Configuration: typeof Configuration;
                    ParserConfiguration: typeof ParserConfiguration;
                }
                newcommand: {
                    NewcommandUtil: { default: typeof NewcommandUtil },
                    NewcommandMethods: { default: typeof NewcommandMethods }
                },
                NodeUtil: { default: typeof NodeUtil },
                MapHandler: { MapHandler: typeof MapHandler },
                Symbol: typeof Symbol & { Macro: typeof Macro },
                ParseUtil: { default: typeof ParseUtil },
                SymbolMap: SymbolMapImpl & {
                    CharacterMap: typeof CharacterMapImpl,
                    CommandMap: typeof CommandMapImpl
                },
                TexConstants: { TexConstant: typeof TexConstant },
                TexError: { default: typeof TexError },
                TexParser: { default: typeof TexParserImpl },
                [key: string]: any
            }
        },
        core: {
            MmlTree:  {
                MmlNode: MmlNode & {
                    TEXCLASS: typeof TEXCLASS
                }
            }
        },
        util: any
    };
}

declare global {
    interface Window { MathJax: MathJax; }
}