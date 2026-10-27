import{J as p}from"./chunk-M76EZIVG.js";import{j as u}from"./chunk-K4ALXBGI.js";var y=(()=>{class h{constructor(){this.logo=null}money(e){return new Intl.NumberFormat("es-EC",{style:"currency",currency:"USD"}).format(e||0)}esc(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}fechaHora(e=new Date){let o=new Intl.DateTimeFormat("es-EC",{timeZone:"America/Guayaquil",day:"2-digit",month:"2-digit",year:"numeric"}).format(e),t=new Intl.DateTimeFormat("es-EC",{timeZone:"America/Guayaquil",hour:"2-digit",minute:"2-digit",hour12:!0}).format(e);return{fecha:o,hora:t}}buildDocument(e,o){return u(this,null,function*(){let t=yield this.getLogo();return`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>${this.esc(e)}</title>
<style>
  @page { size: 72mm 297mm; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; }
  body { width: 72mm; padding: 2mm 2.5mm; font-family: Arial, Helvetica, sans-serif; font-size: 11.5px; line-height: 1.3; }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  .logo { display: block; width: 52mm; margin: 1mm auto 2mm; }
  .brand { font-size: 15px; font-weight: 800; letter-spacing: 0.5px; }
  .small { font-size: 10.5px; }
  .tiny { font-size: 9.5px; }
  .sep { border-top: 1px dashed #000; margin: 2mm 0; }
  .sep-strong { border-top: 2px solid #000; margin: 2mm 0; }
  .title { font-size: 14px; font-weight: 800; }
  .row { display: flex; justify-content: space-between; gap: 2mm; }
  .item { margin-bottom: 1.5mm; }
  .desc { font-weight: 700; word-break: break-word; }
  .total { font-size: 16px; font-weight: 800; }
  .mono { font-family: 'Courier New', monospace; word-break: break-all; letter-spacing: 0.3px; }
</style></head>
<body>
  ${t?`<img class="logo" src="${t}" alt="ALTEC">`:""}
  ${o}
</body></html>`})}getLogo(){return this.logo?Promise.resolve(this.logo):new Promise(e=>{let o=new Image;o.onload=()=>{let t=document.createElement("canvas");t.width=o.naturalWidth,t.height=o.naturalHeight;let i=t.getContext("2d");if(!i)return e(null);i.drawImage(o,0,0);let m=i.getImageData(0,0,t.width,t.height),n=m.data,s=t.width,g=t.height,r=-1,f=-1;for(let l=0;l<t.height;l++)for(let c=0;c<t.width;c++){let d=(l*t.width+c)*4;n[d+3]>60?(n[d]=n[d+1]=n[d+2]=0,n[d+3]=255,c<s&&(s=c),c>r&&(r=c),l<g&&(g=l),l>f&&(f=l)):n[d+3]=0}if(r<0)return e(null);i.putImageData(m,0,0);let a=document.createElement("canvas");a.width=r-s+1,a.height=f-g+1,a.getContext("2d")?.drawImage(t,s,g,a.width,a.height,0,0,a.width,a.height),this.logo=a.toDataURL("image/png"),e(this.logo)},o.onerror=()=>e(null),o.src="assets/images/LOGIN.png"})}print(e){return new Promise(o=>{let t=document.createElement("iframe");t.style.cssText="position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;",document.body.appendChild(t);let i=t.contentDocument,m=t.contentWindow;if(!i||!m)return t.remove(),o();let n=!1,s=()=>{n||(n=!0,setTimeout(()=>t.remove(),1e3),o())};i.open(),i.write(e),i.close();let g=Array.from(i.images);Promise.all(g.map(r=>r.complete?Promise.resolve():new Promise(f=>{r.onload=r.onerror=f}))).then(()=>{m.onafterprint=s,m.focus(),m.print(),setTimeout(s,6e4)})})}static{this.\u0275fac=function(o){return new(o||h)}}static{this.\u0275prov=p({token:h,factory:h.\u0275fac,providedIn:"root"})}}return h})();export{y as a};
