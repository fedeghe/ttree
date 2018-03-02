"use strict";
const fs = require('fs'),
    path = require('path');



let processing = () => { },
    options = {};

const x = null,

    ScanResult = [],

    count = {
        files: 0,
        dirs: 0,
        sym: 0, 
        hiddenFiles: 0,
        hiddenDirs: 0,
        hiddenSym: 0,
        other: 0,
        size: 0,
        hiddenSize: 0
    },

    scan = (folder, location, level, hiddenForce) => {
        return new Promise((solve, reject) => {
            fs.readdir(folder, (err, files) => {
                errCheck (err);
                let l = files.length;
                const maybeSolve = () => {
                    --l == 0 && solve([ScanResult, count]);
                };
                if (l === 0) solve([ScanResult, count]);
                processing();
                files.forEach(file => {
                    const filePath = path.resolve(`${folder}/${file}`),
                        isHidden = hiddenForce || file.match(/^\./);
                    fs.lstat(
                        filePath,
                        (err, stats) => {
                            if (options.size) {
                                file = `${file} [${options.size(stats.size)}]`;
                            }
                            switch (true) {
                                case stats.isDirectory():
                                    let o = {};
                                    o[file] = [];

                                    if (isHidden) {
                                        if (options.hidden) {
                                            location.push(o);
                                        }
                                        count.hiddenDirs++;
                                        count.hiddenSize += stats.size;
                                        
                                        scan(filePath, o[file], level + 1, true).then(maybeSolve);
                                    } else {
                                        location.push(o);
                                        count.dirs++;
                                        scan(filePath, o[file], level + 1).then(maybeSolve);
                                    }
                                    break;
                                case stats.isFile():
                                    if (isHidden) {
                                        if (options.hidden) {
                                            location.push(file);
                                        }
                                        count.hiddenFiles++;
                                        count.hiddenSize += stats.size;

                                    } else {
                                        location.push(file);
                                        count.files++;
                                        count.size += stats.size;
                                    }
                                    maybeSolve();
                                    break;
                                case stats.isSymbolicLink():
                                    try {
                                        let target = fs.readlinkSync(file);
                                        if (isHidden) {
                                            if (options.hidden) {
                                                location.push(`${file} -> ${target}`);
                                            }
                                            count.hiddenSym++;
                                            count.hiddenSize += stats.size;
                                        } else {
                                            location.push(`${file} -> ${target}`);
                                            count.sym++;
                                            count.size += stats.size;
                                        }
                                    } catch (e) {
                                        // ssssh !
                                    }
                                    maybeSolve();
                                    break;
                                default:
                                    if (isHidden) {
                                        count.hiddenOthers++;
                                        count.hiddenSize += stats.size;
                                    } else {
                                        count.others++;
                                        count.size += stats.size;
                                    }
                                    break;
                            }
                        }
                    );
                });
            });
        });
    },

    errCheck = (e) => {
        if (e) {
            console.log(err);
            process.exit(1);
        }
    },

    start = (StartFolder, callback, _processing, _options) => {
        processing = _processing || processing;
        options = _options || options;

        try {
            // first empty line
            console.log('');

            // start scan`
            scan(StartFolder, ScanResult, 0).then((result) => {

                const res = result[0],
                    count = result[1];
                
                processing(true);

                const orderIn = (a) => {
                        for (let k in a) a[k] = order(a[k]);
                        return a;
                    },

                    // order, first folders, then files
                    //
                    order = (arr) => (
                        arr.sort((a, b) => {
                            const tofa = typeof a,
                                tofb = typeof b;
                            let aKeys, bKeys;
                            switch (true) {
                                case tofa === 'string' && tofb === 'string':
                                    return tofa > tofb ? 1 : -1;
                                case tofa === 'object' && tofb === 'object':
                                    a = orderIn(a);
                                    b = orderIn(b);
                                    aKeys = Object.keys(a);
                                    bKeys = Object.keys(b);
                                    return aKeys[0] > bKeys[0] ? 1 : -1;
                                case tofa === 'object' && tofb === 'string':
                                    a = orderIn(a);
                                    return -1;
                                case tofa === 'string' && tofb === 'object':
                                    b = orderIn(b);
                                    return 1;
                            }
                        })
                    );

                callback(order(res), count);

            });
        } catch (err) {
            console.log(err)
        }
    };
    
module.exports = {
    start: start
};

