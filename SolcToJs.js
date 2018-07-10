#!/usr/bin/env node
'use strict';

const { exec } = require('child_process')
const commander = require('commander')
const fs = require('fs')
const util = require('util')
const path = require('path')

commander
  .version('0.1.0', '-v, --version')
  .command('soltojs <inputFile> [outputfile]')
  .action((paramInputFile, paramOutputFile) => {

    const absInputFile = path.resolve(paramInputFile);

    const objName = path.basename(absInputFile).split('.sol')[0];

    const child = exec('solc  --combined-json abi,bin ' + absInputFile, [], (error, stdout, stderr) => {
      if (error) throw new Error(error);
      //if (stderr) throw new Error(stderr);
      
      const obj = JSON.parse(stdout);
      const contractDataName = absInputFile + ':' + objName;
      const contractData = {
        abi: JSON.parse(obj.contracts[contractDataName].abi),
        bin: '0x' + obj.contracts[contractDataName].bin
      };
    
      var outputFile = path.dirname(absInputFile) + path.sep + objName + '.js';
      if (paramOutputFile) {
        outputFile = paramOutputFile;
      }
      
      fs.writeFileSync(outputFile, 'module.exports = ' + util.inspect(contractData, false, 99999) , 'utf-8');
    });
  });
  commander.parse(process.argv);
