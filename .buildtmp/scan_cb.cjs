const fs=require('fs');
const s=fs.readFileSync('src/context/RideContext.tsx','utf8');
const lines=s.split('\n');
const re=/^\s*const\s+([A-Za-z0-9_]+)\s*=\s*(useCallback\(|async\s*\(|\([^)]*\)\s*=>|function)/;
let plain=[],cb=0,memo=0,total=0;
lines.forEach((l,i)=>{
  const m=l.match(re);
  if(m){ total++;
    if(m[2]==='useCallback(') cb++; else plain.push((i+1)+': '+l.trim().slice(0,90));
  }
});
console.log('const fn declarations:',total,' useCallback:',cb,' NOT memoized:',plain.length);
console.log(plain.join('\n'));
