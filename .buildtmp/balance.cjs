// Lightweight TSX brace/paren/bracket balance checker that skips strings,
// template literals, regex-ish and comments.
const fs=require('fs'),path=require('path');
function walk(d,out=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p,out);else if(/\.(tsx|ts)$/.test(e.name))out.push(p);}return out;}
const files=walk('src');
let bad=0;
for(const f of files){
  const s=fs.readFileSync(f,'utf8');
  let i=0, stack=[], state='code', tplDepth=0;
  const pairs={'(':')','[':']','{':'}'};
  const closers={')':'(',']':'[','}':'{'};
  let line=1, err=null;
  while(i<s.length){
    const c=s[i], n=s[i+1];
    if(c==='\n') line++;
    if(state==='code'){
      if(c==='/'&&n==='/'){ while(i<s.length&&s[i]!=='\n')i++; continue; }
      if(c==='/'&&n==='*'){ i+=2; while(i<s.length&&!(s[i]==='*'&&s[i+1]==='/')){ if(s[i]==='\n')line++; i++; } i+=2; continue; }
      if(c==='"'||c==="'"){ const q=c; i++; while(i<s.length){ if(s[i]==='\\'){i+=2;continue;} if(s[i]===q){i++;break;} if(s[i]==='\n'){err='unterminated string line '+line;break;} i++; } if(err)break; continue; }
      if(c==='`'){ state='tpl'; i++; continue; }
      if(pairs[c]){ stack.push({c,line}); i++; continue; }
      if(closers[c]){ const top=stack.pop(); if(!top||top.c!==closers[c]){ err='mismatch '+c+' at line '+line+(top?' (open '+top.c+' at '+top.line+')':' (empty stack)'); break; } i++; continue; }
      i++; continue;
    } else if(state==='tpl'){
      if(c==='\\'){ i+=2; continue; }
      if(c==='$'&&n==='{'){ // template expression: treat as code until matching }
        i+=2; let depth=1;
        while(i<s.length&&depth>0){
          const cc=s[i];
          if(cc==='\n')line++;
          if(cc==='"'||cc==="'"){const q=cc;i++;while(i<s.length&&s[i]!==q){if(s[i]==='\\')i++;i++;}i++;continue;}
          if(cc==='`'){ i++; let d2=1; while(i<s.length&&d2>0){ if(s[i]==='\\'){i+=2;continue;} if(s[i]==='`'){i++;break;} if(s[i]==='$'&&s[i+1]==='{'){d2++;i+=2;continue;} if(s[i]==='}'){d2--;i++;continue;} i++; } continue; }
          if(cc==='{')depth++;
          else if(cc==='}'){depth--; if(depth===0){i++;break;}}
          i++;
        }
        continue;
      }
      if(c==='`'){ state='code'; i++; continue; }
      i++; continue;
    }
  }
  if(err) { console.log('BROKEN '+f+' -> '+err); bad++; }
  else if(stack.length) { console.log('UNCLOSED '+f+' -> '+stack.length+' unclosed, first '+stack[0].c+' at line '+stack[0].line); bad++; }
}
console.log(bad===0?('OK: all '+files.length+' files balanced'):('PROBLEMS: '+bad));
