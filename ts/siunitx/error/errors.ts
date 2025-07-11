import { TexError } from "../../bindings/input/tex";
import * as data from "./resource.en.json";

export class siunitxError {

	static BadOptionChars = (option: string) =>  new TexError('siunitx:badOptionChars', data.badOptionsChars, option);
	
	static ComparatorAlreadySet = (existing: string, toBeAdded: string) => new TexError('siunitx:comparatorAlreadySet', data.comparatorAlreadySet, existing, toBeAdded);

	static ExponentThresholdsError = (option: string) => new TexError('sinunitx:exponentThresholdsError', data.exponentThresholdsError, option);
	
	static ExtraSemicolon = () => new TexError('siunitx:extraSemicolon', data.extraSemicolon);

	static InvalidAngArgument = (arg: string) => new TexError('siunitx:invalidAngArgument', data.invalidAngArgument, arg)

	static InvalidNumArgument = (arg: string) => new TexError('siunitx:invalidNumArgument', data.invalidNumArgument, arg);

	static InvalidOptionValue = (key: string, type:string) => new TexError('siunitx:invalidOptionValue', data.invalidOptionValue, key, type)
	
	static LiteralUnitsForbidden = (macro: string) => new TexError('siunitx:literalUnitsForbidden', data.literalUnitsForbidden, macro);

	static NoInterpretationForUnitMacro = (macro: string) => new TexError('siunitx:macroNotDefined', data.macroNotDefined, macro);
	
	static NoUncertaintyToClose = () => new TexError('siunitx:noUncertaintyToClose', data.noUncertaintyToClose);

	static UncertaintyAlreadyClosed = () => new TexError('siunitx:uncertaintyAlreadyClosed', data.uncertaintyAlreadyClosed);

	static DenominatorParsingError = (denominator:string, permode:string) => new TexError('siunitx:denominatorParsingError', data.denominatorParsingError, denominator, permode);
	
}
