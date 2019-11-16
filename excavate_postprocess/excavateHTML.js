#!/usr/bin/env node

const htmlparser2 = require("htmlparser2");
const fs = require('fs');
const mustache = require('mustache');

const WORD_LIST = '../Input/from_excavate.json';
const HTML_SOURCE = '../Input/anatomy_of_melancholy.html';
const HTML_TEMPLATE = '../Input/template.html';
const HTML_OUT = '../Output/excavate.html';



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
                        if( words.length > 0 ) {
                            const next_word = words[0][1];
                            if( w.match('^' + next_word) ) {
                                outhtml += '<span class="exc">' + w + '</span> ';
                                words.shift();
                            } else {
                                outhtml += w + ' ';
                            }
                        } else {
                            outhtml += w + ' ';
                        }
                        i++;
                        if( i % 1000 === 0 ) {
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

