const { exec } = require('child_process');
var fs = require('fs')
var util = require('util')

const fileName = process.argv[2];
const objName = fileName.split('.sol')[0];


const child = exec('solc  --combined-json abi,bin ' + fileName, [], (error, stdout, stderr) => {
  if (error) throw new Error(error);
  //if (stderr) throw new Error(stderr);
  
  const obj = JSON.parse(stdout);

  const contractDataName = fileName + ':' + objName;
  const contractData = {
    abi: JSON.parse(obj.contracts[contractDataName].abi),
    bin: '0x' + obj.contracts[contractDataName].bin
  };

  var outputFile = './' + objName + '.js';
  if (process.argv[3]) {
    outputFile = process.argv[3];
  }
  
  fs.writeFileSync(outputFile, 'module.exports = ' + util.inspect(contractData, false, 99999) , 'utf-8');
});
