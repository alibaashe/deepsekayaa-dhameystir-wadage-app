const fs=require('fs');
const s=fs.readFileSync('src/context/RideContext.tsx','utf8');
const start=s.indexOf('value={{');
const end=s.indexOf('}}', start);
const body=s.slice(start+8, end);
// split at depth 0 commas, respecting braces/brackets/parens/strings
let depth=0, cur='', parts=[];
for(let i=0;i<body.length;i++){
  const c=body[i];
  if(c==='{'||c==='['||c==='(') depth++;
  else if(c==='}'||c===']'||c===')') depth--;
  if(c===','&&depth===0){ parts.push(cur); cur=''; } else cur+=c;
}
if(cur.trim()) parts.push(cur);
const ids=[], odd=[];
for(const p of parts){
  const t=p.trim();
  if(!t) continue;
  if(/^[A-Za-z_$][\w$]*$/.test(t)) ids.push(t); else odd.push(t);
}
console.log('total entries:', parts.filter(p=>p.trim()).length, ' shorthand identifiers:', ids.length, ' NOT shorthand:', odd.length);
console.log('NON-SHORTHAND ENTRIES:'); console.log(odd.join('\n---\n'));
console.log('DUPLICATE IDS:', ids.filter((v,i)=>ids.indexOf(v)!==i).join(', ')||'none');
