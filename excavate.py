#!/usr/bin/env python

import torchrnn
from itertools import chain
import sys, re
import argparse, json
import random
from operator import itemgetter
from nltk.metrics.distance import edit_distance
from fuzzywuzzy import fuzz


MODEL = './cv/Fort1cp_440000.t7'
FILTER = './Fort1.json'
SAMPLE = 1000
TEMP = 0.5
DISTANCE = 100
WEIGHT1 = 10
WEIGHT2 = 0.01
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

def token_filter(f, text):
    return ''.join([c for c in text if c in f])

def next_target_word(model, seed):
    k = REPEAT
    while k:
        text = torchrnn.run_sample(model, TEMP, seed, SAMPLE).decode('utf-8')
        text = text[len(seed):]
        words = text.split()
        if words:
            return words[0]
        k -= 1
    return next_target_word(model, "")


def match_edit_distance(i, w1, w2):
    return edit_distance(w1, w2)


def match_weight_edit_distance(i, w1, w2):
    return (i + WEIGHT1) * WEIGHT2 * edit_distance(w1, w2)


def match_fuzzy(i, w1, w2):
    return (i + WEIGHT1) * WEIGHT2 * fuzz.ratio(w1, w2)


def match_headfirst(i, w1, w2):
    print(w1, w2)
    for c1, c2 in zip(w1.lower(), w2.lower()):
        if c1 == c2:
            m += 1
        else:
            break
    return m / len(w1)


def find_next_match(primary, target):
    r = range(min(len(primary), DISTANCE))
    words = [ (i, primary[i], match_fuzzy(i, target, primary[i])) for i in r ]
    words.sort(key=itemgetter(2), reverse=True)
    ( j, match, value ) = words[0]
    k = j + 1
    return j, match, primary[k:]

def excavate(primary, model, tokens):
    idx = 0
    results = []
    line = ''
    while primary and len(results) < LENGTH_TARGET:
        seed = ' '.join(results[-BACKTRACK:])
        if tokens:
            seed = token_filter(tokens, seed)
        word = next_target_word(model, seed)
        ( i, match, primary ) = find_next_match(primary, word)
        idx += i + 1
        prev = match
        results.append(match)
        if line:
            line += ' '
        line += match
        if len(line) > 65:
            print("[{}] {}".format(idx, line), flush=True)
            line = ''
    return results




if __name__ == '__main__':
    parser = argparse.ArgumentParser() 
    parser.add_argument("-m", "--model", type=str, default=MODEL, help="Model")
    parser.add_argument("-t", "--tokens", type=str, default='', help="Token index")
    parser.add_argument("-p", "--primary", type=str, help="Primary text")

    args = parser.parse_args()


    primary = load_primary(args.primary)
    if args.tokens:
        tokens = load_tokens(args.tokens)
    else:
        tokens = None
    results = excavate(primary, args.model, tokens)
