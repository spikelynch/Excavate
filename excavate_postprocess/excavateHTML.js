#!/usr/bin/env node

const htmlparser2 = require("htmlparser2");
const fs = require('fs');
const mustache = require('mustache');
const ArgumentParser = require('argparse').ArgumentParser;

const DEFAULT_IN = '../Samples/long4.json';
const DEFAULT_VOCAB = '../Input/anatomy_of_melancholy.html';
const HTML_TEMPLATE = '../Input/template.html';
const DEFAULT_OUT = '../Output/excavate_test.html';


function checkWords(wordlist) {
    var j = 0;
    const newList = [];
    wordlist.forEach((wi) => {
        const i = wi[0];
        const w = wi[1];
        if( i <= j ) {
            console.log(`Removed duplicate ${i} ${w}`)
        } else {
            newList.push(wi);
            j = wi[0];
        }
    });
    return newList;
}



function highlightWords(wordlist, source, dest) {
    let outhtml = ''
    let i = 0;
    var words = wordlist['words'];


    const parser = new htmlparser2.Parser(
        {
            onopentag(name, attribs) {
                const atts = [];
                Object.keys(attribs).forEach((k) => {
                    atts.push(`${k}="${attribs[k]}"`);
                })
                if( atts.length > 0 ) {
                    outhtml += `<${name} ${atts}>`;
                } else {
                    outhtml += `<${name}>`;
                }
            },
            ontext(text) {
                const ws = text.split(/\s+/);
                ws.map((w) => {
                    if( w ) {
                        i++;
                        if( words.length > 0 ) {
                            const next_word = words[0][1];
                            const m = w.match('^' + next_word + '(.*)');
                            if ( m ) {
                                console.log(`M> ${words[0][0]} ${next_word} / ${i} ${w}`);
                                outhtml += '<span class="exc">' + next_word + '</span>' + m[1] + ' ';
                                words.shift();
                            } else {
                                outhtml += w + ' ';
                            }
                        } else {
                            outhtml += w + ' ';
                        }
                        if( i % 10000 === 0 ) {
                            console.log(`${i} words...`);
                        }
                    }
                });
            },
            onclosetag(tagname) {
                outhtml += '</' + tagname + '>';
            }
        },
        { decodeEntities: true }
    );

    const htmlStream = fs.createReadStream(source);

    htmlStream.on('readable', () => {
        var chunk;
        while( (chunk = htmlStream.read()) !== null ) {
            parser.write(chunk);
        }
    }).on('end', () => {
        parser.end();
        writeOutput(dest, outhtml);
    });
}



function extractWords(source, dest) {
    const words = [];
    let i = 0;

    const parser = new htmlparser2.Parser(
        {
            ontext(text) {
                const ws = text.split(/\s+/);
                ws.map((w) => {
                    i++;
                    words.push([ i, w ])
                });
            }
        },
        { decodeEntities: true }
    );

    const htmlStream = fs.createReadStream(source);

    htmlStream.on('readable', () => {
        var chunk;
        while( (chunk = htmlStream.read()) !== null ) {
            parser.write(chunk);
        }
    }).on('end', () => {
        parser.end();
        fs.writeFile(dest, JSON.stringify({ words: words }, null, 4), (err) => {
            if( err ) {
                console.log("Error writing to " + dest);
                console.log(err);
                process.exit(-1);
            }
        });
    });
}




function writeOutput(dest, html) {
    fs.readFile(HTML_TEMPLATE, 'utf8', (err, template) => {
        if( err ) {
            console.log("Template load error ");
            console.log(err);
            process.exit(-1);
        }
        const outhtml = mustache.render(template, { body: html });
        fs.writeFile(dest, outhtml, (err) => {
            if( err ) {
                console.log("error writing ", err);
            } else {
                console.log("Wrote output to " + dest);
            }
        })

    })
}

const parser = new ArgumentParser({
    version: "0.0.1",
    addHelp: true,
    description: "excavate pre- and post-processor"
});

parser.addArgument( [ '-w', '--wordlist' ], { defaultValue: DEFAULT_IN, help: "Word list from RNN" });
parser.addArgument( [ '-p', '--primary' ], { defaultValue: DEFAULT_VOCAB, help: "Primary HTML vocab document" });
parser.addArgument( [ '-e', '--extract' ], { defaultValue: null, help: "Extract vocab list" });
parser.addArgument( [ '-o', '--output' ], { defaultValue: DEFAULT_OUT, help: "Output HTML"} );

const args = parser.parseArgs();

if( args.extract ) {
    extractWords(args.primary, args.extract);
} else {

    fs.readFile(DEFAULT_IN, 'utf8', (err, data) => {
        if( err ) {
            console.log("Error reading " + DEFAULT_IN);
            console.log(err);
            process.exit(-1);
        }
        const wl = JSON.parse(data);
        wl['words'] = checkWords(wl['words']);
        console.log(`Deduplicated word list has ${wl['words'].length} words`);
        highlightWords(wl, args.primary, args.output);
    });
}

