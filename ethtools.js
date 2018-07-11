#!/usr/bin/env node
'use strict';

const { exec } = require('child_process')
const commander = require('commander')
const fs = require('fs')
const util = require('util')
const path = require('path')
const Web3 = require('web3');

commander
  .version('0.1.0', '-v, --version')

commander
  .command('soltojs <inputFile> [outputfile]')
  .action((paramInputFile, paramOutputFile) => {
    var absInputFile = path.resolve(paramInputFile);

    solc(absInputFile).then((contractData) => {
      var outputFile = absInputFile.replace(/.sol$/, '.js')
      if (paramOutputFile) {
        outputFile = paramOutputFile;
      }
      fs.writeFileSync(outputFile, 'module.exports = ' + util.inspect(contractData, false, 99999) , 'utf-8');
    }).catch((error) => {
      console.log();
      console.log(error)
    })
  })

commander
  .command('deploy <inputFile> <ethnode> <chainid> <privatekey> [gas]')
  .action((paramInputFile, paramEthNode, paramChainId, paramPrivateKey, paramGas=4700000) => {
    var absInputFile = path.resolve(paramInputFile)

    solc(absInputFile).then(async (contractData) => {
      const web3 = new Web3(paramEthNode)
      const contract = new web3.eth.Contract(contractData.abi, null, null)
      const deploy = contract.deploy({data: contractData.bin})
  
      const trx = {
        chainId: paramChainId,
        gas: paramGas,
        data: deploy._deployData
      };

      var privateKey = paramPrivateKey
      const abspathPrivateKey = path.resolve(paramPrivateKey)
      if (fs.existsSync(abspathPrivateKey)) {
        privateKey = fs.readFileSync(abspathPrivateKey).toString('utf8')
      }

      const receipt = await web3.eth.accounts.signTransaction(trx, privateKey)
      .then((sgnTrx) => {
        return web3.eth.sendSignedTransaction(sgnTrx.rawTransaction)
      })

      console.log(receipt)

      process.exit()
    }).catch((error) => {
      console.log();
      console.log(error)
    })
  })

commander.parse(process.argv)


function solc(inputFile, outputTypes = ['abi', 'bin'], pathToCompiler = 'solc') {
  return new Promise((resolve, reject) => {
    exec(pathToCompiler + ' --combined-json ' + outputTypes.join(',') +' ' + inputFile,[], (error, stdout, stderr) => {
      if (error) return reject(error)
      if (stderr) return reject(stderr)

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