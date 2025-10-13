## MathHax

This Obsidian-plugin tampers with the included MathJax-configuration to allow more customizability and provides some useful extensions.

### Features

- Checkbox setting to load the `physics` extension
- Adds the [siunitx-package](https://github.com/limefrogyank/siunitx-pcc) by _limefrogyank_ and allows full customization
- Use the Obsdian text-font for `\text{...}` (or a custom one)
- Configure the `tagSide` of equation-tags
- Adds two niche Macros:
  - `\rnum{number}` converts an Integer to its roman-numeral representation: `\rnum{12} -> XII`
  - `\vecRange[n]{template}{bound}` creates an array of repeated entries like: 
    - `\vecRange{x_#1}{..n}    -> [x_1, x_2, ..., x_n]`
    - `\vecRange{x_#1}{..5}    -> [x_1, x_2, ..., x_5]`
    - `\vecRange[4]{x_#1}{..n} -> [x_1, x_2, x_3, x_4, ..., x_n]`
    - `\vecRange{x_#1}{5}      -> [x_1, x_2, x_3, x_4, x_5]`
- Implements some fixes for MathJax bugs ([\#3365](https://github.com/mathjax/MathJax/issues/3365))


## Contributing

Feel free to submit your Ideas as **Issues** or **Pull-Requests**.