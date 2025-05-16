import { CommandMap } from '../bindings/input/tex';
import { MathHaxMethods } from './MathHaxMethods';
import { MATH_HAX } from '../main';


/**
 * The MathHax macros
 */
export function createMathHaxMap() {
	new CommandMap(MATH_HAX, {
		rnum: 'Rnum'
	}, MathHaxMethods);
	return MATH_HAX;
}