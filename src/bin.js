#!/usr/bin/env node
"use strict";
const lib = require('./lib');

let procStep = 0,
    started = false;
const args = process.argv.splice(2),
    space = ' ',
    
    startFolder = args.length ? args[0] : '.',
    symb = s => `${space}${s}`,
    print = (arr, level) => {
        let i = 0, k = null, s = null;
        const l = arr.length;
        for (null; i < l; i++) {
            if (typeof arr[i] === 'string') {
                s = (i == l - 1) ? symb('╙╴') : symb('╟╴');
                console.log(`${level}${s}${space}${arr[i]}`);
            } else
                if (typeof arr[i] === 'object') {
                    k = Object.keys(arr[i])[0];
                    s = /*(l == 1) ? " " :*/ (i == l - 1) ? symb('╚═') : symb(started ? '╠═' : '╔═');
                    started = true;
                    console.log(`${level}${s}${space}${k}`);
                    print(arr[i][k], level + symb(
                        (
                            l > 1
                            &&
                            i !== l - 1 // not the last one
                        ) ? '║ ' : '  '));
                }
        }
    },

    formatSize = (s) => {
        if (s == 0) return '0 B';
        let n = 0, nInt = 0;
        const sizes = {
            GB: 2 << 29,
            MB: 2 << 19,
            KB: 2 << 9,
            B: 1
        };
        for (let i in sizes) {
            if (s > sizes[i]) {
                n = parseFloat((s / sizes[i]).toFixed(2), 10);
                nInt = parseInt(n, 10);
                n =  n == nInt ? nInt : n;
                return `${n} ${i}`;
            }
        }
    },

    report = (count) => {
        var msg = {
            files: {
                visible: `Files: ${count.files}`,
                hidden: count.hiddenFiles ? `(+${count.hiddenFiles} hidden)` : ''
            },
            dirs: {
                visible: `Dirs: ${count.dirs}`,
                hidden: count.hiddenDirs ? `(+${count.hiddenDirs} hidden)` : ''
            },
            syml: {
                visible: `Syml: ${count.sym}`,
                hidden: count.hiddenSym ? `(+${count.hiddenSym} hidden)` : ''
            },
            other: {
                visible: `Other: ${count.other}`,
                hidden: count.hiddenOther ? `(+${count.hiddenOther} hidden)` : ''
            },
            total: {
                visible: `Size: ${formatSize(count.size)}`,
                hidden: count.hiddenSize ? `(+${formatSize(count.hiddenSize)} hidden)` : ''
            }
        }
        console.log('')
        console.log(`${msg.files.visible} ${msg.files.hidden}`);
        console.log(`${msg.dirs.visible} ${msg.dirs.hidden}`);
        console.log(`${msg.syml.visible} ${msg.syml.hidden}`);
        console.log(`${msg.other.visible} ${msg.other.hidden}`);
        console.log(`${msg.total.visible} ${msg.total.hidden}`);
        console.log('');
    };


lib.start(
    startFolder,
    (res, count) => {
        print(res, '');
        report(count);
    },
    (end) => {
        const symbs = ['\\', '|', '/', '-'],
            symbsLen = symbs.length;
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        procStep = (procStep + 1) % symbsLen;
        process.stdout.write(
            end ? '' : 'scan in progress ' + symbs[procStep]
        );
    },
    {hidden: true, size : formatSize}
);