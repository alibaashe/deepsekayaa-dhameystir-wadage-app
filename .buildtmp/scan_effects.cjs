const fs=require('fs'),path=require('path');
function walk(d,out=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p,out);else if(/\.(tsx|ts)$/.test(e.name))out.push(p);}return out;}
for(const f of walk('src')){
  const s=fs.readFileSync(f,'utf8');
  const re=/useEffect\(\s*\(\s*\)\s*=>\s*\{/g;let m;
  while((m=re.exec(s))){
    let depth=1,j=re.lastIndex;
    while(j<s.length&&depth>0){const c=s[j];if(c==='{')depth++;else if(c==='}')depth--;j++;}
    const rest=s.slice(j,j+30);
    if(/^\s*\)\s*;/.test(rest)){
      const line=s.slice(0,m.index).split('\n').length;
      console.log(f+':'+line+'  useEffect has NO dependency array');
    }
  }
}
