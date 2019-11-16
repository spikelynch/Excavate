#!/usr/bin/env python

import torchrnn
from itertools import chain
import sys, re
import argparse, json
import random
from operator import itemgetter
from fuzzywuzzy import fuzz
from textdistance import jaro_winkler
from string import ascii_lowercase

MODEL = './cv/Fort1cp_440000.t7'
DEFAULT_CHARS = ' abcdefghijklmnopqrstuvwxyz01234567890():;.-'
SAMPLE = 1000
TEMP = 0.5
DISTANCE = 500
DECAY = .2
REPEAT = 5
BACKTRACK = 20
LENGTH_TARGET = 5000

# NOTE: default filter: normalise to lower case and remove anything but a-z

def load_primary(sourcefile):
    with open(sourcefile, 'r') as fh:
        wn = [ l.split() for l in fh.readlines() ]
        return list(chain.from_iterable(wn))

def load_tokens(tfile):
    with open(tfile, 'r') as tfh:
        jstokens = json.load(tfh)
        return jstokens['token_to_idx']

def default_tokens():
    return { c:1 for c in DEFAULT_CHARS }

def token_filter(f, text):
    return ''.join([c for c in text if c in f])

def next_target_word(model, seed, debug):
    k = REPEAT
    while k:
        text = torchrnn.run_sample(model, TEMP, seed, SAMPLE).decode('utf-8')
        text = text[len(seed):]
        if debug:
            print("[RNN] " + text[:80])
        words = text.split()
        if words:
            return words[0]
        k -= 1
    return next_target_word(model, "", debug)



def decay(i):
    return 1 + i * -DECAY / DISTANCE


def matcher(i, w1, w2):
    return decay(i) * jaro_winkler(w1, w2)




def find_next_match(primary, target, debug):
    r = range(min(len(primary), DISTANCE))
    words = [ (i, primary[i], matcher(i, target, primary[i])) for i in r ]
    words.sort(key=itemgetter(2), reverse=True)
    if debug:
        print(words[:8])
    ( j, match, value ) = words[0]
    k = j + 1
    return j, match, primary[k:]

def excavate(primary, model, tokens, lines, debug):
    idx = 0
    results = []
    line = ''
    while primary and len(results) < LENGTH_TARGET:
        seed = ' '.join(results[-BACKTRACK:])
        if tokens:
            seed = token_filter(tokens, seed)
        if debug:
            print("[SEED] " + seed)
        word = next_target_word(model, seed, debug)
        ( i, match, primary ) = find_next_match(primary, word, debug)
        idx += i + 1
        prev = match
        results.append(match)
        if lines:
            if line:
                line += ' '
            line += match
            if len(line) > 65:
                if debug:
                    print("[{}] {}".format(idx, line), flush=True)
                else:
                    print(line, flush=True)
                line = ''
        else:
            if debug:
                print("{} -> {}".format(word, match))
            else:
                print(word)
    return results




if __name__ == '__main__':
    parser = argparse.ArgumentParser() 
    parser.add_argument("-m", "--model", type=str, default=MODEL, help="Model")
    parser.add_argument("-t", "--tokens", type=str, default='', help="Token index")
    parser.add_argument("-p", "--primary", type=str, help="Primary text")
    parser.add_argument("-d", "--debug", action='store_true', help="Print debugging output")
    parser.add_argument("-l", "--lines", action='store_true', help="Print lines, not words")

    args = parser.parse_args()


    primary = load_primary(args.primary)
    if args.tokens:
        tokens = load_tokens(args.tokens)
    else:
        tokens = default_tokens()

    params = {
        'generated_by': 'excavate.py',
        'primary': args.primary,
        'tokens': args.tokens,
        'model': args.model,
        'distance': DISTANCE,
        'decay': DECAY,
    }

    print(json.dumps(params, indent=4), flush=True)

    results = excavate(primary, args.model, tokens, args.lines, args.debug)
