#!/usr/bin/env python

import subprocess

TORCHRNN = '/Users/mike/torch/torch-rnn'
TRCMD = [ 'th', 'sample.lua' ]
TRARGS = { '-gpu': '-1' }

def run_sample(model, temperature, start, nchars):
    cmd = list(TRCMD)
    args = dict(TRARGS)
    args['-checkpoint'] = model
    args['-temperature'] = str(temperature)
    args['-length'] = str(nchars)
    args['-start_text'] = start
    for k, v in args.items():
        cmd.append(k)
        cmd.append(v)
    try:
        output = subprocess.check_output(cmd, cwd=TORCHRNN)
        return output
    except subprocess.CalledProcessError as e:
        output = e.output
        return output 

