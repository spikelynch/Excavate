TODO
====


* Try to see if a version can work without the RNN - just pull words from the secondary text and look for the nearest match, which will be much faster, and potentially have better results, since the plain secondary text will make more sense than the RNN output

* A "graphic" render of the output a la Humument which displays the text with only the excavated words visible

## TODO

* consolidate the input and output data in this directory -- done

* generation -- experiment with lookahead length and long runs

* generation -- dump the text and wordlist as separate output files

* postprocessing - markup words from the text -- // needs debugging - is overshooting and failing on longish text // better now

* postprocessing - pagination

* postprocessing - use a Musketeers image as obscure background? -- Can do, needs refining

## Debugging

* Get the vocab from the same HTML used to display it - to stop the overshooting problem

* Short lookaheads produce bad results, might have to loop through the source text

* Why does the excavate.lau routine stutter so much with short lookaheads?
