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
    var absInputFile = path.resolve(paramInputFile);

    solc(absInputFile).then((contractData) => {
      var outputFile = absInputFile.replace(/.sol$/, '.js')
      if (paramOutputFile) {
        outputFile = paramOutputFile;
      }
      fs.writeFileSync(outputFile, 'module.exports = ' + util.inspect(contractData, false, 99999) , 'utf-8');
    });
  });

commander.parse(process.argv);

function solc(inputFile, outputTypes = ['abi', 'bin'], pathToCompiler = 'solc') {
  return new Promise((resolve, reject) => {
    exec(pathToCompiler + ' --combined-json ' + outputTypes.join(',') +' ' + inputFile,[], (error, stdout, stderr) => {
      if (error) reject(error)
      if (stderr) reject(stderr);

      const compilerOutput = JSON.parse(stdout)
      const targetObjectName = path.basename(inputFile).split('.sol')[0]
      const contractDataID = inputFile + ':' + targetObjectName

      var contractData = {}
      outputTypes.forEach(outputType => {
        switch(outputType) {
          case 'abi':
            contractData.abi = null
            if (compilerOutput.contracts[contractDataID].abi) {
              contractData.abi = JSON.parse(compilerOutput.contracts[contractDataID].abi)
            }
            break
          case 'bin':
            contractData.bin = null
            if (compilerOutput.contracts[contractDataID].bin) {
              contractData.bin = '0x' + compilerOutput.contracts[contractDataID].bin
            }
        }
      });
      
      resolve(contractData)
    })
  })
}