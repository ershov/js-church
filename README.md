# js-church: Church encoding in javascript experiment

This is based on [Programming with Nothing](https://codon.com/programming-with-nothing)
article and the following links:

* [Programming with Nothing](https://codon.com/programming-with-nothing)
* Sources in Ruby: [pedant](https://github.com/tomstuart/nothing/blob/pedant/lib/nothing.rb)
and [story](https://github.com/tomstuart/nothing/blob/story/lib/nothing.rb)
* [Church Encoding in Wiki](https://en.wikipedia.org/wiki/Church_encoding)

### NB: Ruby to Javascript conversion

The code in Ruby was converted to Javascript using these commands in [Vim](https://www.vim.org/):

* .. from Ruby to JS:

      set ft=javascript
      %s/#/\/\/                                  " fix comments
      %s/\V[/(/g                                 " alter function call: [] -> ()
      %s/\V]/)/g                                 "
      %s/\v\s*\-\>\s*(\w+)\s*\{\s*/( \1 => /g    " alter function definition
      %s/\V}/)/g                                 " grouping (closing)
      %s/\v<_>/v/g                               " replace "_" variable with "v"
      w !node                                    " run with node js

  ... search for ((...)) and remove extra matching parens: search string: `\v\(\(` use macro: `%x``x`

* .. from JS to strings (js):

      set ft=javascript
      %s/\/\/.*//                                " strip comments
      %s/\v^(\w+)\s*\=\s*(.*)\s*$/\1 = `\2`;/    " function definitions
      %s/\v^@<!<([A-Z_]+)>/\$\{\1\}/g            " make use of string interpolation
      %s/\v(\w@<! )|( \w@!)//g                   " remove whitespace which is not between the letters
      $a                                         " append test code to file:
      console.log(`0\n(${TO_INTEGER})(${ZERO})`);
      console.log(`1\n(${TO_INTEGER})(${ONE})`);
      console.log(`10\n(${TO_INTEGER})(${TEN})`);
      console.log(`[1..10]\n${TO_ARRAY}(${RANGE}(${ONE})(${TEN})).map(${TO_INTEGER})`)
      console.log(`[1..100]\n${TO_ARRAY}(${RANGE}(${ONE})(${HUNDRED})).map(${TO_INTEGER})`)
      console.log(`fizzbuzz(100)\n${TO_ARRAY}(${FIZZBUZZ}(${HUNDRED})).map(${TO_STRING})`)
      .
      w !node                                    " run in Node

* .. from JS to strings (perl):

      set ft=perl
      %s/\/\/.*//                                " strip comments
      %s/\v^(\w+)\s*\=\s*(.*)\s*$/\1 = "\2";/    " function definitions
      %s/\v([A-Z_]+)/\$\1/g                      " make use of string interpolation
      $a                                         " append test code to file:
      print $FIZZBUZZ
      .
      w !perl                                    " run in perl

