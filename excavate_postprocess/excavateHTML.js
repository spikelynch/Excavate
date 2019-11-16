#!/usr/bin/env node

const htmlparser2 = require("htmlparser2");
const fs = require('fs');

const WORD_LIST = './from_excavate.json';
const HTML_SOURCE = './anatomy_of_melancholy.html';
const HTML_OUT = './excavate.html';



function highlightWords(wordlist, source, dest) {
    let outhtml = ''
    let i = 0;
    var words = wordlist['words'];

    const parser = new htmlparser2.Parser(
        {
            onopentag(name, attribs) {
                outhtml += '<' + name + '>';
            },
            ontext(text) {
                const ws = text.split(/\s+/);
                ws.map((w) => {
                    if( w ) {
                        if( words.length > 0 ) {
                            if( w.match('^' + words[0]) ) {
                                outhtml += '<span class="exc">' + w + '</span> ';
                                console.log(words[0]);
                                words.shift();
                            } else {
                                outhtml += w + ' ';
                            }
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

        fs.writeFile(dest, outhtml, (err) => {
            if( err ) {
                console.log("error writing ", err);
            } else {
                console.log("Done.");
            }
        })
    })
}


fs.readFile(WORD_LIST, 'utf8', (err, data) => {
    if( err ) {
        console.log("Error reading " + WORD_LIST);
        console.log(err);
        process.exit(-1);
    }
    const wl = JSON.parse(data);
//    console.log(JSON.stringify(wl));
    highlightWords(wl, HTML_SOURCE, HTML_OUT);
});

