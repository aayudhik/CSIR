const fs=require('fs');
const path=require('path');
const vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const legacy=path.join(__dirname,'build-v591-expansion.js');
const temp=path.join('/tmp','build-v591-expansion-fixed.js');
let source=fs.readFileSync(legacy,'utf8');
// The legacy catalog uses escaped apostrophes inside single-quoted formula
// literals. Convert those display-only apostrophes to a safe Unicode mark so
// the generator can be parsed without changing the numerical content.
source=source.replace(/\\+'/g,'’');
try{new vm.Script(source,{filename:'build-v591-expansion.js'})}catch(e){console.error('Expansion generator remains syntactically invalid after safe normalization:',e.message);process.exit(1)}
fs.writeFileSync(temp,source,'utf8');
require(temp);
