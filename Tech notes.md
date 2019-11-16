Tech notes

Extending the hack on LanguageModel.lua to try to use it to implement Excavate.

Outline of algorithm.

P = primary text.

Separate the primary text business out from the idea of constraining the output of the the RNN - just a bag of words that matches - or (better) something that yields a weighing distribution across tokens

coroutines https://www.lua.org/pil/9.1.html

A version of sample which takes a coroutine or generator that can return the following when it gets called:

M - a probability mask to apply to the weights for the next character
  - this can be 'neutral' - ie it doesn't affect the weights - ie this word is done, start again

nil - it's over, we've run out of whatever (source text), stop sampling even if you
      haven't reached the word limit

Possibility - make the RNN sampler a coroutine?