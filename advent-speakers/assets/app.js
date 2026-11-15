/* The speakers' advent wall · v2 · the speakers' landing (MET-2443). One classic script, raw WebGL2 for the wall, no network, no audio.
   Kept from the 8/10 wall: the advent dust medium (grains, three verbs: drift · gather · burst), the five colours, the 24 windows, the throw, the snow.
   New: the photos stay still (no talking), the line is set as a poster off the face, the metaidea of the line forms by the Eidolon effect (assets/ideas.js),
   a rhythm of 8 paces + 1 little pause, pause/play, a small landing per speaker, 24 badges as a profile with two currencies, phone layout.
   Two clocks: T = the chain (stops on pause), A = the air (never stops: the dust breathes while paused). ?t= freezes · ?w= jumps · ?pause=1 opens paused. */
(function () {
'use strict';
var D = window.AW_DATA, ORDER = D.order, CAST = D.cast, NW = ORDER.length;
var $ = function (s) { return document.querySelector(s); };
var qs = function (k) { var m = location.search.match(new RegExp('[?&]' + k + '=([^&]*)')); return m ? decodeURIComponent(m[1]) : null; };
var clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
var sst = function (a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
var back = function (x) { x = clamp(x, 0, 1) - 1; return 1 + 2.70158 * x * x * x + 1.70158 * x * x; };
function rng(seed) { var a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ── the rhythm, in his order (15.11): 8 paces + 1 little pause. ONE table. Seconds = one window, from its doors to the landing of its throw. ── */
var PACE = { 'fast': 4.4, 'moderato': 5.8, 'fast-moderato': 5.0, 'little pause': 1.5, 'slow': 7.2 };   /* r8 · his „Some previous are too fast“ (was 3.0 · 4.8 · 3.8); window 21, a slow one, is his „top“ */
var RHYTHM = ['fast', 'moderato', 'fast-moderato', 'little pause', 'fast', 'slow', 'fast', 'moderato', 'fast'];   /* 24 windows = 3 cycles; the little pause = 1.5 s of stillness after the third window */
(function () { var k = 0; ORDER.forEach(function (o) { if (RHYTHM[k % 9] === 'little pause') k++; o.pace = RHYTHM[k % 9]; o.then = RHYTHM[(k + 1) % 9] === 'little pause' ? 'little pause' : null; k++; }); })();
var ASM0 = 0.2, ASM1 = 0.15, ASM_MAX = 3.0;   /* his word 15.11: smooth and visible, „but not too slow“: a forming lasts at most 3 s */
//   /* the metaidea's ramp: from 0.2 s before the first word to 0.15 s after the line is whole (the grains ease in and out inside it) */
var INTRO = 3.3, T_STEP0 = 0.45, T_STEP = 0.5, T_VOICE = 0.85, FLY = 0.55, FIN_LEN = 8.2;
var ICON_POS = ['p-br', 'p-tl', 'p-c', 'p-tr', 'p-bl'], IMG = {};

/* ── DOM: the wall ── */
var wall = $('#wall'), names = $('#names'), capEl = { L: $('#capL'), R: $('#capR') }, finEl = $('#fin'), cells = [], nameEls = [];
ORDER.forEach(function (o, i) {
  var b = document.createElement('button'); b.type = 'button'; b.className = 'day ' + ICON_POS[(i * 7) % 5];
  b.setAttribute('aria-label', 'Прозорец ' + o.n);
  b.innerHTML = '<svg aria-hidden="true"><use href="#i' + (i % 12) + '"/></svg><span class="num" aria-hidden="true">' + o.n + '</span>';
  b.addEventListener('click', function () { cellClick(i); });
  wall.appendChild(b); cells.push(b);
  var nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = o.kind === 'speaker' ? CAST[o.id].name : ''; names.appendChild(nm); nameEls.push(nm);
});
var posterEl = $('#poster'), heroHit = $('#heroHit'), footEl = $('.foot');
var qEl = document.createElement('div'); qEl.id = 'qup'; $('#over').insertBefore(qEl, posterEl);   /* his word 15.11: the question sits above the image */
var W = 0, H = 0, G = {}, RECT = [], PORT = false, TOPY = {}, PHH = {}, PFS = {}, QH = {}, Q2 = {};
var PSH = { sp: 0.56, air: 0.1, img: 0.96, tb: 92, mb: 10, gap: 3 };   /* phone stage: speaker's lower edge (share of H) · air above the hair (share of H) · image size in its band · text band px · bottom margin px · gap px */
function layout() {
  W = innerWidth; H = innerHeight; PORT = W < H * 0.8; document.body.classList.toggle('port', PORT);
  var cols = PORT ? 4 : 6, rows = PORT ? 6 : 4, top = PORT ? Math.max(66, H * 0.085) : Math.max(60, H * 0.066), bot = PORT ? Math.max(30, H * 0.04) : Math.max(28, H * 0.034), g = PORT ? 8 : clamp(H * 0.013, 6, 14);
  var s = Math.min((H - top - bot - (rows - 1) * g) / rows, (W * (PORT ? 0.94 : 0.95) - (cols - 1) * g) / cols), gw = cols * s + (cols - 1) * g, gh = rows * s + (rows - 1) * g;
  G = { s: s, g: g, x: (W - gw) / 2, y: top + (H - top - bot - gh) / 2, gw: gw, gh: gh };
  ORDER.forEach(function (o, i) {   /* phone: the 6x4 wall turned into 4x6 */
    var cc = PORT ? o.row : o.col, rr = PORT ? o.col : o.row, r = { x: G.x + cc * (s + g), y: G.y + rr * (s + g), s: s }; r.cx = r.x + s / 2; r.cy = r.y + s / 2; RECT[i] = r;
    var st = cells[i].style; st.left = r.x + 'px'; st.top = r.y + 'px'; st.width = st.height = s + 'px';
    cells[i].querySelector('.num').style.fontSize = (s * 0.21) + 'px';
    var n = nameEls[i].style; n.left = (r.x + 4) + 'px'; n.width = (s - 8) + 'px'; n.top = (r.y + s - (PORT ? 15 : 20)) + 'px'; n.fontSize = clamp(s * 0.043, PORT ? 6 : 7, 10.5) + 'px';
  });
  ['L', 'R'].forEach(function (k) { var c = capEl[k].style; c.left = (PORT ? 0.04 : (k === 'L' ? 0.03 : 0.53)) * W + 'px'; c.width = (PORT ? 0.92 : 0.44) * W + 'px'; });
  finEl.style.top = (H * (PORT ? 0.56 : 0.635)) + 'px'; finEl.style.fontSize = (PORT ? W * 0.062 : H * 0.05) + 'px';
  PHH = {}; PFS = {}; QH = {}; Q2 = {}; if (PORT) { var pst = posterEl.style; pst.left = W * 0.05 + 'px'; pst.width = W * 0.9 + 'px'; pst.top = '0px'; pst.height = '';
    PSH.tb = Math.round(H * 0.115); PSH.mb = Math.max(10, Math.round(H * 0.012));   /* the text band: 0.9 W x 11.5 % of H = 10.4 % of the screen (line + name; the question is above the image) */
    ORDER.forEach(function (o, i) { if (o.kind !== 'speaker') return; var fs = posterFS(o);   /* the line shrinks until question + line + name fit the band */
      for (var k = 0; k < 30; k++) { posterEl.innerHTML = posterHTML(o, fs); if (posterEl.offsetHeight <= PSH.tb) break; fs *= 0.95; } PFS[o.id] = fs; PHH[o.id] = posterEl.offsetHeight;
      var qs = clamp(W * 0.038, 13, 16), qq = qEl.style; qEl.textContent = D.qlabel[o.q]; qq.fontSize = qs + 'px'; qq.width = W * 0.9 + 'px'; qEl.classList.remove('q2');   /* a question too long for one line (the screen edge cut it) wraps to two, tighter, and the image starts below it */
      if (qEl.scrollWidth > W * 0.9 + 1 || qEl.offsetHeight > qs * 1.6) { qEl.classList.add('q2'); Q2[o.id] = 1; } QH[o.id] = qEl.offsetHeight; qEl.classList.remove('q2'); }); posterEl.innerHTML = ''; qEl.textContent = ''; }
  posterEl.dataset.i = ''; capEl.L.dataset.i = ''; capEl.R.dataset.i = '';
}
/* the stage of one speaker: where the still photo, the metaidea (about 60 % of the space) and the poster sit. The words never touch the face or the image. */
function stageGeom(o) {
  var S = {}, lm = o.kind === 'speaker' ? CAST[o.id].lm : null;
  if (PORT) {   /* his shares (15.11): „Speaker top 55%, image of word 21-34%, text 8-13%“. Top to bottom: speaker · image · words; none on another */
    var yB = H * PSH.sp, tB = H - PSH.mb - PSH.tb, headTop = lm ? Math.max(0, lm.box[1] - 0.42 * lm.box[3]) : 0.08;
    if (lm && EDGE[o.id]) { if (TOPY[o.id] === undefined) { var mn = 1; EDGE[o.id].forEach(function (p) { if (p[1] < mn) mn = p[1]; }); TOPY[o.id] = mn; } headTop = TOPY[o.id]; }   /* the true top of the hair */
    var h = Math.min(W * 1.25, (yB - H * PSH.air) / (1 - headTop)), w = h * 0.8;   /* his word 15.11: about 10 % of air between the head and the top of the frame, the speaker not filling the whole frame */
    S.hero = { x: (W - w) / 2, y: yB - h, w: w, h: h }; S.hairY = S.hero.y + headTop * h;
    S.text = { left: W * 0.05, width: W * 0.9, top: tB, height: PSH.tb };
    var qs2 = clamp(W * 0.038, 13, 16); S.q = { cx: W / 2, top: yB + 6, fs: qs2 }; var i0 = yB + 6 + ((o.kind === 'speaker' && QH[o.id]) || qs2 * 1.3) + 6, i1 = tB - PSH.gap, ir = Math.min(W * 0.48, (i1 - i0) / 2) * PSH.img;   /* his word: the image a little smaller */
    S.idea = { cx: W / 2, cy: (i0 + i1) / 2, r: ir, dcx: W / 2, dcy: H * 0.7, dw: W * 0.42, dh: H * 0.3 / 1.3 };   /* the image forms from dust in the lower 60 % of the screen (the shell reaches 1.3 x dw, dh) */
    if (lm) { S.idea.hx = S.hero.x + lm.fcx * w; S.idea.hy = S.hero.y + (lm.box[1] + lm.box[3] * 0.5) * h; S.idea.hr = lm.box[3] * h * 0.6; }
  } else { var L = o.side === 'L', hh = H * 0.93, hw = hh * 0.8; if (hw > W * 0.4) { hw = W * 0.4; hh = hw / 0.8; } var cx = L ? W * 0.215 : W * 0.785, ix = L ? W * 0.7 : W * 0.3;
    S.hero = { x: cx - hw / 2, y: H - hh, w: hw, h: hh };   /* r6/r7: centre at 21.5 % (was 20 %): the photo off the screen edge, the words still clear of it */
    var ht = lm ? Math.max(0, lm.box[1] - 0.42 * lm.box[3]) : 0.08; if (lm && EDGE[o.id]) { if (TOPY[o.id] === undefined) { var mn2 = 1; EDGE[o.id].forEach(function (p) { if (p[1] < mn2) mn2 = p[1]; }); TOPY[o.id] = mn2; } ht = TOPY[o.id]; } S.hairY = S.hero.y + ht * hh; var lift = clamp(S.hairY - H * 0.10, 0, H * 0.09); S.hero.y -= lift; S.hairY -= lift;   /* r5: his „air about 10 % above the head“ on the laptop too (was 12–22 %): the photo is lifted, its bottom already fades */
    S.idea = { cx: ix, cy: H * 0.40, r: Math.min(W * 0.26, H * 0.325) * 0.85, dcx: ix, dcy: H * 0.5, dw: W * 0.3 / 1.3, dh: H * 0.5 / 1.3 };   /* the dust field = the 60 % side of the screen, top to bottom */
    S.text = { left: ix - W * 0.265, width: W * 0.53, top: H * 0.685, height: H * 0.27 };
    var qs3 = clamp(H * 0.022, 13, 24); S.q = { cx: ix, top: S.idea.cy - S.idea.r - qs3 * 1.3 - 14, fs: qs3 };
  }
  S.ax = lm ? lm.fcx : 0.5; S.ay = PORT ? 1 : lm ? lm.box[1] + lm.box[3] * 0.5 : 0.4; return S;   /* phone: the push-in grows up from the 55 % line, never down into the image */
}
function thumbV0(lm) { return clamp(lm.box[1] + lm.box[3] * 0.45 - 0.4, 0, 0.2); }

/* ── WebGL ── */
var cv = $('#fx'), gl = cv.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'high-performance' });
var DPR = Math.min(window.devicePixelRatio || 1, 2), RES = 1, PXS = 1;
function resize() { layout(); PXS = DPR * RES; cv.width = Math.round(W * PXS); cv.height = Math.round(H * PXS); gl.viewport(0, 0, cv.width, cv.height); geomDirty = true; if (window.AW_IDEA) AW_IDEA.resize(W, H, PXS); }
function prog(vs, fs) {
  function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, '#version 300 es\nprecision highp float;\n' + s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o) + '\n' + s); return o; }
  var p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS), i; for (i = 0; i < n; i++) { var nm = gl.getActiveUniform(p, i).name.replace('[0]', ''); u[nm] = gl.getUniformLocation(p, nm); }
  return { p: p, u: u };
}
var NOISE = 'float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}' +
  'float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}' +
  'float fbm(vec2 p){return .55*vn(p)+.3*vn(p*2.1+7.)+.15*vn(p*4.3+3.);}';


/* dust: one program, four modes (0 frame · 1 door · 2 snow · 3 throw); 16 floats per grain. T moves the chain, A moves the air. */
var PD = prog(
  'layout(location=0) in vec4 a0; layout(location=1) in vec4 a1; layout(location=2) in vec4 a2; layout(location=3) in vec4 a3;' +
  'uniform int uMode; uniform float uT,uA,uPx,uFin,uTau,uThrowT,uVoice,uIntro,uSc; uniform vec2 uRes,uHeadShift; uniform vec4 uHead,uRip,uWv[4]; uniform vec3 uZm; uniform float uOpenT[24]; uniform vec2 uCell[24]; uniform vec3 uPal[6];' +
  'out vec3 vCol; out float vA; out float vCross;' +
  'float bk(float x){x=clamp(x,0.,1.)-1.;return 1.+2.70158*x*x*x+1.70158*x*x;}' +
  'float ss(float x){x=clamp(x,0.,1.);return x*x*(3.-2.*x);}' +
  'vec2 wallfx(vec2 p,inout float a){vec2 dh=p-uHead.xy;float gh=exp(-dot(dh,dh)/(uHead.z*uHead.z));p+=normalize(dh+vec2(.001))*gh*uHead.w;a+=gh*uHead.w*.03;' +
  ' float rd=length(p-uRip.xy),rt=uRip.z;float ring=rt>0.?exp(-pow((rd-rt*1500.*uSc)/(80.*uSc),2.))*exp(-rt*2.4):0.;p+=normalize(p-uRip.xy+vec2(.001))*ring*16.*uSc;a+=ring*.9;for(int i=0;i<4;i++){vec4 w=uWv[i];if(w.z>0.){float rg=exp(-pow((length(p-w.xy)-w.z*1500.*uSc)/(95.*uSc),2.))*w.w;p+=normalize(p-w.xy+vec2(.001))*rg*12.*uSc;a+=rg*.8;}}return p;}' +
  'void main(){float T=uT,A=uA,s1=a1.z,s2=a1.w,sz=a2.x,a=1.;int wi=int(a2.z+.5);vec2 p;vec3 col=uPal[int(a2.y+.5)];vCross=0.;' +
  ' if(uMode==0){' +
  '  float e1=bk((T-.3-s1*.5-float(wi)*.018)/.95),e2=bk((T-1.75-s2*.4)/1.0);' +
  '  vec2 st=a0.xy+vec2(sin(A*1.3+s1*40.)*14.,T*22.+cos(A*1.1+s2*40.)*10.);' +
  '  p=mix(mix(st,a0.zw,e1),a1.xy,e2);a=clamp(T/.5,0.,1.);' +
  '  p+=vec2(sin(A*2.3+s1*91.),cos(A*1.9+s2*77.))*1.1*uSc;' +
  '  float tw=.5+.5*sin(A*(2.4+s1*5.)+s2*50.),ot=uOpenT[wi],fl=ot>0.?exp(-ot*2.6):0.;' +
  '  p+=normalize(a1.xy-uCell[wi])*fl*(8.+46.*s1*s1)*uSc;' +
  '  a*=(ot>0.?.34+.66*tw:.16+.5*tw)+fl*1.4;sz*=1.+fl*.8;if(ot>0.&&s1>.6)col=uPal[2];' +
  '  p=wallfx(p,a);' +
  ' }else if(uMode==1){' +
  '  float ot=uOpenT[wi],kind=a2.w;' +
  '  if(ot<0.){p=a0.xy+vec2(sin(A*.9+s1*60.),cos(A*.8+s2*60.))*4.*uSc;a=kind<.5?(.07+.3*pow(.5+.5*sin(A*(1.+s1*2.6)+s2*40.),3.))*uIntro:0.;p=wallfx(p,a);a*=step(.5,uIntro+.5)*(kind<.5?1.:0.);}' +
  '  else{float k=3.4,q=(1.-exp(-k*ot))/k;p=a0.xy+a0.zw*q+vec2(sin(A*1.6+s1*30.)*10.*ot,90.*ot*ot)*uSc;' +
  '   float life=.5+s2*.7;a=(1.-ss((ot-.18)/life))*1.25;sz*=1.+.9*exp(-ot*5.);' +
  '   if(s1<.07){a=max(a,.55*(1.-ss((ot-2.)/3.5)));p.y+=ot*(14.+30.*s2)*uSc;}}' +
  ' }else if(uMode==2){' +
  '  p=vec2(a0.x+sin(A*.8+s1*6.28)*a0.w,mod(a0.y+a0.z*A,uRes.y+60.)-30.);a=a1.x*clamp(T/2.,0.,1.);vCross=sz>2.5?1.:0.;' +
  ' }else{' +
  '  float kind=a2.z,tau=uTau;vec2 hold=a0.zw,C=a1.xy;' +
  '  if(kind>1.5){float life=tau-a2.w;p=hold+a3.xy*life*(1.-.45*life)+vec2(sin(A*5.+s1*30.),cos(A*4.+s2*30.))*10.*life*uSc;a=(life<0.||life>1.)?0.:(1.-life)*.95*smoothstep(.05,.22,life);sz*=1.+life;}' +
  '  else{' +
  '   float g=bk((tau-.42-s1*.34)/.6);float tw=.5+.5*sin(A*(2.+s1*4.)+s2*40.);' +
  '   if(kind<.5){hold=uZm.xy+(hold-uZm.xy)*uZm.z;hold+=a3.xy*(1.5+9.*s2*s2+uVoice*(6.+22.*s1))*uSc+vec2(sin(A*3.1+s1*50.),cos(A*2.7+s2*50.))*2.2*uSc+uHeadShift*a2.w;a=clamp(g,0.,1.)*(.28+.5*tw+uVoice*.6);}' +
  '   else{hold+=vec2(sin(A*2.6+s1*50.),cos(A*2.2+s2*50.))*.8*uSc;a=clamp(g,0.,1.)*a3.w*(.25+.5*tw*tw)*(1.-.55*ss((tau-1.25)/.4));sz*=.8;}' +
  '   p=mix(a0.xy,hold,g);' +
  '   float th=tau-uThrowT-a3.z*.24;' +
  '   if(th>0.){float dur=.26+s2*.13,u=th/dur;vec2 d=C-hold;vec2 mid=hold+d*.5+vec2(-d.y,d.x)*(s1-.5)*.2+vec2(0.,-80.*uSc)*(.5+.6*s2);' +
  '    float e=pow(clamp(u,0.,1.),1.8);vec2 q1=mix(hold,mid,e),q2=mix(mid,C,e);p=mix(q1,q2,e);a=max(a,.9)*(1.+.6*sin(3.14*clamp(u,0.,1.)));sz*=1.25;' +
  '    if(u>1.){float o2=(u-1.)*dur;vec2 v=normalize(C-mid)*(260.+620.*s1)+vec2(cos(s2*6.28),sin(s2*6.28))*(120.+300.*s1);p=C+v*uSc*(1.-exp(-4.5*o2))/4.5+vec2(0.,80.*o2*o2)*uSc;a*=1.-ss((o2-.05)/(.3+.5*s2));}}' +
  '  }' +
  ' }' +
  ' if(uFin>0.&&uMode<2){float ef=ss((uFin-a3.z*.9)/1.25);vec2 tg=a3.xy+vec2(sin(A*2.1+s1*70.),cos(A*1.8+s2*70.))*.9*uSc;vec2 d=tg-p;p=p+d*ef+vec2(-d.y,d.x)*sin(ef*3.1416)*(s1-.5)*.6;' +
  '  a=mix(a,.55+.45*sin(A*(1.5+s1*3.)+s2*50.)*.6+.25,ef)*(uMode==1?ef:1.);col=mix(col,uPal[int(a3.w+.5)],ef);sz=mix(sz,sz*.9,ef);}' +
  ' vCol=col;vA=a;gl_Position=vec4(p.x/uRes.x*2.-1.,1.-p.y/uRes.y*2.,0.,1.);gl_PointSize=max(1.5,sz*uPx*3.4);}',
  'in vec3 vCol; in float vA; in float vCross; out vec4 o;' +
  'void main(){vec2 c=gl_PointCoord*2.-1.;float r2=dot(c,c);float i=exp(-r2*9.)+exp(-r2*2.6)*.3;' +
  ' if(vCross>.5){float ax=max(exp(-abs(c.x)*16.)*(1.-abs(c.y)),exp(-abs(c.y)*16.)*(1.-abs(c.x)));vec2 d=vec2(c.x+c.y,c.x-c.y)*.7071;ax=max(ax,.6*max(exp(-abs(d.x)*16.)*(1.-abs(d.y)/.6),exp(-abs(d.y)*16.)*(1.-abs(d.x)/.6)));i=max(i*.6,ax);}' +
  ' float I=i*max(vA,0.);o=vec4(vCol*I,min(1.,I*.85));}');
var PAL = [0.902, 0.169, 0.118, 1, 0.353, 0.278, 0.984, 0.984, 0.984, 1, 1, 1, 0.839, 0.133, 0.082, 0.953, 0.953, 0.953];
function palIdx(r) { var x = r(); return (x * 6) | 0; }

/* photo in a window */
var PT = prog(
  'layout(location=0) in vec2 aQ; uniform vec4 uRect; uniform vec2 uRes; out vec2 vQ; void main(){vQ=aQ;vec2 p=uRect.xy+aQ*uRect.zw;gl_Position=vec4(p.x/uRes.x*2.-1.,1.-p.y/uRes.y*2.,0.,1.);}',
  NOISE + 'in vec2 vQ; out vec4 o; uniform sampler2D uTex; uniform vec4 uRect,uUv,uWv[4]; uniform float uReveal,uDim,uRad,uSeed,uSc;' +
  'void main(){vec2 p=(vQ-.5)*uRect.zw,b=uRect.zw*.5-uRad;float d=length(max(abs(p)-b,0.))-uRad;float a=clamp(.5-d,0.,1.);' +
  ' float z=1.+.1*(1.-uReveal);vec2 uv=mix(uUv.xy,uUv.zw,(vQ-.5)/z+.5);vec3 c=texture(uTex,uv).rgb;' +
  ' float n=fbm(vQ*5.+uSeed)+length(vQ-.5)*.7,x=uReveal*1.9-.25-n;float vis=smoothstep(-.02,.05,x);float edge=(1.-clamp(abs(x)*9.,0.,1.))*step(.001,uReveal)*step(uReveal,.999);' +
  ' c*=mix(1.,.34,smoothstep(.6,1.,vQ.y));vec2 px=uRect.xy+vQ*uRect.zw;float rg=0.;for(int i=0;i<4;i++){vec4 w=uWv[i];if(w.z>0.)rg+=exp(-pow((length(px-w.xy)-w.z*1500.*uSc)/(95.*uSc),2.))*w.w;}c=c*(1.+.6*rg)+vec3(.45,.05,.035)*rg*.5;float gr=step(.45,h21(floor(vQ*uRect.zw*.5)+uSeed));c=mix(c*uDim,mix(vec3(.9,.17,.12),vec3(.98),step(.8,h21(floor(vQ*uRect.zw*.5)+7.))),edge*gr);float al=a*max(vis,edge*gr);o=vec4(c*al,al*step(.001,uReveal));}');

/* veil behind the speaker's half */
var PV = prog(
  'layout(location=0) in vec2 aQ; out vec2 vQ; void main(){vQ=aQ;gl_Position=vec4(aQ.x*2.-1.,1.-aQ.y*2.,0.,1.);}',
  'in vec2 vQ; out vec4 o; uniform vec2 uAmt; void main(){float l=uAmt.x*(1.-smoothstep(.42,.56,vQ.x)),r=uAmt.y*smoothstep(.44,.58,vQ.x);float a=clamp(max(l,r),0.,1.)*.93;o=vec4(vec3(.035,.03,.03)*a,a);}');

/* the speaker: the real photo, still and sharp. Alive only through a slow key light on the relief, the red rim, the dust on the edge and a push-in. No mouth, no warp. */
var PH = prog(
  'layout(location=0) in vec2 aQ; uniform vec4 uRect; uniform vec2 uRes; out vec2 vUv; void main(){vUv=aQ;vec2 p=uRect.xy+aQ*uRect.zw;gl_Position=vec4(p.x/uRes.x*2.-1.,1.-p.y/uRes.y*2.,0.,1.);}',
  NOISE + 'in vec2 vUv; out vec4 o; uniform sampler2D uTex,uAux; uniform float uIn,uSide,uBreath,uFade,uEdge; uniform vec3 uKey;' +
  'void main(){vec2 uv=vUv;vec3 col=texture(uTex,uv).rgb;vec3 aux=texture(uAux,uv).rgb;float mk=aux.b;' +
  ' vec2 tx=vec2(1./320.,1./400.)*1.5;float gx=texture(uAux,uv+vec2(tx.x,0.)).r-texture(uAux,uv-vec2(tx.x,0.)).r,gy=texture(uAux,uv+vec2(0.,tx.y)).r-texture(uAux,uv-vec2(0.,tx.y)).r;' +
  ' vec3 n=normalize(vec3(-gx*9.,-gy*9.,1.));float dif=clamp(dot(n,normalize(uKey)),0.,1.);col*=.86+.3*dif;' +
  ' float rim=pow(clamp(n.x*uSide,0.,1.),1.6)*(1.-smoothstep(.0,.5,aux.r)*.5);col+=vec3(.95,.16,.1)*rim*(.3+.4*uBreath);' +
  ' col*=mix(1.,uFade,smoothstep(.7,.99,uv.y));float ed=1.-smoothstep(.5,.92,mk);col+=vec3(1.,.3,.2)*ed*.3*(.6+uBreath);' +
  ' float nz=.5*fbm(uv*vec2(9.,11.)+3.)+.5*h21(floor(uv*vec2(400.,500.))),x=uIn*1.5-.25-nz*.6-(.5+(uv.x-.5)*uSide)*.4;float vis=smoothstep(-.02,.02,x),burn=(1.-clamp(abs(x)*16.,0.,1.))*step(uIn,.999);' +
  ' col=mix(col,vec3(.95,.2,.13),burn*.85);float al=smoothstep(.42,.6,mk)*max(vis,burn)*(1.-smoothstep(.9,.998,uv.y))*smoothstep(0.,.05,uv.y)*smoothstep(0.,uEdge,uv.x)*smoothstep(1.,1.-uEdge,uv.x);o=vec4(col*al,al);}');   /* phone: the box is narrower than the screen, so its sides fade wide (no straight cut); r7: the top 5 % fades too, so a head cut flat by its photo has no hard edge */

var quad = gl.createVertexArray(); gl.bindVertexArray(quad); var qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
function dustBuf() { var o = { vao: gl.createVertexArray(), buf: gl.createBuffer(), n: 0 }; gl.bindVertexArray(o.vao); gl.bindBuffer(gl.ARRAY_BUFFER, o.buf); for (var i = 0; i < 4; i++) { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, 4, gl.FLOAT, false, 64, i * 16); } return o; }
function fill(o, arr) { gl.bindBuffer(gl.ARRAY_BUFFER, o.buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.DYNAMIC_DRAW); o.n = arr.length / 16; }
function tex(src, mip) { var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  if (mip) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); } else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); return t; }

/* ── textures: speakers' photos + aux maps (data URIs, so file:// works), and the event windows drawn as text ── */
var TX = {}, EDGE = {};
Object.keys(CAST).forEach(function (id) {
  var c = CAST[id], im = new Image(); im.onload = function () { TX[id] = TX[id] || {}; TX[id].photo = tex(im, true); IMG[id] = im; }; im.src = c.photo;
  var ax = new Image(); ax.onload = function () {
    TX[id] = TX[id] || {}; TX[id].aux = tex(ax, false);
    var k = document.createElement('canvas'); k.width = 160; k.height = 200; var g = k.getContext('2d', { willReadFrequently: true }); g.drawImage(ax, 0, 0, 160, 200);
    var d = g.getImageData(0, 0, 160, 200).data, pts = [], x, y, m = function (x, y) { return (x < 0 || y < 0 || x > 159) ? 0 : d[(Math.min(y, 199) * 160 + x) * 4 + 2] / 255; };
    for (y = 1; y < 197; y++) for (x = 1; x < 159; x++) if (m(x, y) > 0.5 && (m(x - 1, y) < 0.5 || m(x + 1, y) < 0.5 || m(x, y - 1) < 0.5 || m(x, y + 1) < 0.5)) {
      var gx = m(x + 2, y) - m(x - 2, y), gy = m(x, y + 2) - m(x, y - 2), l = Math.hypot(gx, gy) || 1; pts.push([(x + 0.5) / 160, (y + 0.5) / 200, -gx / l, -gy / l]); }
    EDGE[id] = pts;
  }; ax.src = c.aux;
});
function textTex(draw) { var k = document.createElement('canvas'); k.width = k.height = 512; var g = k.getContext('2d'); g.fillStyle = '#0f0d0d'; g.fillRect(0, 0, 512, 512);
  var gr = g.createRadialGradient(256, 60, 10, 256, 200, 420); gr.addColorStop(0, 'rgba(230,43,30,.5)'); gr.addColorStop(1, 'rgba(230,43,30,0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  g.textAlign = 'center'; g.textBaseline = 'middle'; draw(g); return tex(k, true); }
var SERIF = '"Cormorant Garamond",Georgia,"Times New Roman",serif', SANS = '"Helvetica Neue",Helvetica,Arial,sans-serif';
function logoDraw(g, cx, cy, fs) {   /* the TEDxSofia word mark: red bold TED + raised x, white Sofia */
  g.textBaseline = 'alphabetic'; g.textAlign = 'left'; g.font = '700 ' + fs + 'px ' + SANS; var w1 = g.measureText('TED').width; g.font = '700 ' + fs * 0.56 + 'px ' + SANS; var w2 = g.measureText('x').width;
  g.font = '400 ' + fs * 0.94 + 'px ' + SANS; var w3 = g.measureText('Sofia').width, gap = fs * 0.12, x = cx - (w1 + w2 + gap + w3) / 2, y = cy + fs * 0.36;
  g.fillStyle = '#E62B1E'; g.font = '700 ' + fs + 'px ' + SANS; g.fillText('TED', x, y); g.font = '700 ' + fs * 0.56 + 'px ' + SANS; g.fillText('x', x + w1, y - fs * 0.36);
  g.fillStyle = '#FBFBFB'; g.font = '400 ' + fs * 0.94 + 'px ' + SANS; g.fillText('Sofia', x + w1 + w2 + gap, y); return { x: x, w: w1 + w2 };
}
TX.logo = { photo: textTex(function (g) { logoDraw(g, 256, 215, 96); g.textAlign = 'center'; g.fillStyle = '#f6f4f2'; g.font = 'italic 600 46px ' + SERIF; g.fillText('Смисълът да даваш', 256, 330); }) };
TX.q1 = { photo: textTex(function (g) { g.fillStyle = '#f6f4f2'; g.font = 'italic 600 104px ' + SERIF; g.fillText('Кой си', 256, 205); g.fillStyle = '#E62B1E'; g.fillText('ти?', 256, 315); }) };
TX.q2 = { photo: textTex(function (g) { g.fillStyle = '#f6f4f2'; g.font = 'italic 600 84px ' + SERIF; g.fillText('Смисълът', 256, 190); g.fillStyle = '#E62B1E'; g.fillText('да даваш…', 256, 290); }) };
TX.fin = { photo: textTex(function (g) { g.fillStyle = '#E62B1E'; g.font = '700 150px ' + SERIF; g.fillText('2026', 256, 205); g.fillStyle = '#f6f4f2'; g.font = 'italic 600 70px ' + SERIF; g.fillText('Лекторите', 256, 320); }) };

/* ── static dust: frames, doors, snow, finale targets ── */
var B_FRAME = dustBuf(), B_DOOR = dustBuf(), B_SNOW = dustBuf(), geomDirty = true, FIN_PTS = [];
function rrPoint(r, rad, rn) { var w = r.s - 2, per = 4 * w, d = rn() * per, x, y;
  if (d < w) { x = d; y = 0; } else if (d < 2 * w) { x = w; y = d - w; } else if (d < 3 * w) { x = w - (d - 2 * w); y = w; } else { x = 0; y = w - (d - 3 * w); }
  var cx = x < rad ? rad : x > w - rad ? w - rad : x, cy = y < rad ? rad : y > w - rad ? w - rad : y;
  if (cx !== x && cy !== y) { var l = Math.hypot(x - cx, y - cy) || 1; x = cx + (x - cx) / l * rad; y = cy + (y - cy) / l * rad; }
  return [r.x + 1 + x + (rn() - 0.5) * 1.6, r.y + 1 + y + (rn() - 0.5) * 1.6]; }
function glyphPts(text, font, w, h, step) { var c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); var g = c.getContext('2d', { willReadFrequently: true });
  g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(text, c.width / 2, c.height / 2);
  var d = g.getImageData(0, 0, c.width, c.height).data, pts = [], x, y; for (y = 0; y < c.height; y += step) for (x = 0; x < c.width; x += step) if (d[(y * c.width + x) * 4 + 3] > 110) pts.push([x - c.width / 2, y - c.height / 2]); return pts; }
function finaleTargets() {   /* the logo and the line the wall assembles when all 24 are open: [x, y, colourIndex] */
  var c = document.createElement('canvas'); c.width = Math.round(W); c.height = Math.round(H); var g = c.getContext('2d', { willReadFrequently: true });
  var fs = Math.min(H * 0.26, W * 0.15); logoDraw(g, W / 2, H * 0.43, fs);
  var d = g.getImageData(0, 0, c.width, c.height).data, pts = [], x, y, st = Math.max(1, Math.round(fs / 110));
  for (y = 0; y < c.height; y += st) for (x = 0; x < c.width; x += st) { var i = (y * c.width + x) * 4; if (d[i + 3] > 100) pts.push([x, y, d[i + 1] < 120 ? (((x * 7919 + y * 104729) % 11) < 8 ? 0 : 1) : 2]); }
  return pts; }
function buildStatic() {
  var rn = rng(7), sc = G.s / 230, i, k, fr = [], dr = [], shuf = ORDER.map(function (_, i) { return i; });
  for (k = NW - 1; k > 0; k--) { var j = (rn() * (k + 1)) | 0, t = shuf[k]; shuf[k] = shuf[j]; shuf[j] = t; }
  FIN_PTS = finaleTargets(); var fr2 = rng(99), fpt = function () { return FIN_PTS[(fr2() * FIN_PTS.length) | 0] || [W / 2, H / 2, 2]; };
  for (i = 0; i < NW; i++) {
    var r = RECT[i], rj = RECT[shuf[i]], NF = 330, ND = 760, num = cells[i].querySelector('.num'), nr = num.getBoundingClientRect();
    for (k = 0; k < NF; k++) { var p = rrPoint(r, 14, rn), f = fpt();
      fr.push(rn() * W, rn() * H * 1.2 - H * 0.2, p[0] + rj.x - r.x, p[1] + rj.y - r.y, p[0], p[1], rn(), rn(), 1.1 + rn() * 1.2, rn() < 0.55 ? (rn() < 0.7 ? 0 : 1) : (rn() < 0.5 ? 2 : 4), i, 0, f[0], f[1], rn(), f[2]); }
    var gp = glyphPts(String(ORDER[i].n), '700 ' + (G.s * 0.21) + 'px ' + SERIF, nr.width + 20, nr.height + 20, 1), gcx = nr.left + nr.width / 2, gcy = nr.top + nr.height / 2;
    for (k = 0; k < ND; k++) { var kind = k < 240 ? 0 : 1, x, y;
      if (kind === 1 && k < 520 && gp.length) { var q = gp[(rn() * gp.length) | 0]; x = gcx + q[0]; y = gcy + q[1]; } else { x = r.x + 3 + rn() * (r.s - 6); y = r.y + 3 + rn() * (r.s - 6); }
      var an = Math.atan2(y - r.cy, x - r.cx) + (rn() - 0.5) * 1.5, sp = (160 + 820 * rn() * rn()) * sc, f2 = fpt();
      dr.push(x, y, Math.cos(an) * sp, Math.sin(an) * sp - 60 * sc, 0, 0, rn(), rn(), 1 + rn() * 1.5, kind === 0 ? (rn() < 0.7 ? 0 : 4) : (rn() < 0.5 ? 2 : (rn() < 0.6 ? 0 : 1)), i, kind, f2[0], f2[1], rn(), f2[2]); }
  }
  fill(B_FRAME, fr); fill(B_DOOR, dr);
  var sn = [], NS = 520; for (k = 0; k < NS; k++) { var big = rn() < 0.12; sn.push(rn() * W, rn() * (H + 60), 22 + rn() * 52, 6 + rn() * 16, big ? 0.5 + rn() * 0.4 : 0.25 + rn() * 0.5, 0, rn(), rn(), big ? 2.8 + rn() * 1.6 : 0.8 + rn() * 1.1, rn() < 0.22 ? 0 : 3, 0, 0, 0, 0, 0, 0); }
  fill(B_SNOW, sn); THROW = {}; geomDirty = false;
}

/* ── text: the event captions (as v1) and the poster of a speaker's line; the grains sampled from their glyphs ── */
function posterFS(o) { var n = o.shown.length; return PORT ? W * (n > 46 ? 0.056 : n > 26 ? 0.066 : 0.086) : H * (n > 46 ? 0.047 : n > 26 ? 0.056 : 0.07); }
function posterHTML(o, fsIn) {   /* question, line, name. On a phone: fitted to the text band, no credit line (it is on the landing) */
  var c = CAST[o.id], fs = fsIn || (PORT && PFS[o.id]) || posterFS(o), sm = PORT ? clamp(W * 0.036, 12, 15) : clamp(H * 0.021, 12, 24);   /* question and name: his word 15.11 „too small, not readable“ */
  var ws = ('„' + o.shown + '“').split(' ').map(function (w, k) { return '<span class="w">' + (k === 0 ? '<span class="qm">„</span>' + w.slice(1) : w) + ' </span>'; }).join('');
  return '<div class="ln" style="font-size:' + fs + 'px">' + ws + '</div><div class="who" style="font-size:' + sm + 'px">' + c.name + '</div>' + (c.credit && !PORT ? '<div class="cr">' + c.credit + '</div>' : '');
}
function words(s) { return s.split(' ').map(function (w) { return '<span class="w">' + w + ' </span>'; }).join(''); }
function fillCaption(e) {
  var o = ORDER[e.i], h;
  if (o.kind === 'speaker') {   /* the poster: question, line, name. Set in the text band of the stage. */
    var S = stageGeom(o); posterEl.innerHTML = posterHTML(o);
    qEl.textContent = D.qlabel[o.q]; qEl.classList.toggle('q2', PORT && !!Q2[o.id]); var qst = qEl.style; qst.fontSize = S.q.fs + 'px'; qst.top = S.q.top + 'px'; qst.left = (S.q.cx - W * 0.45) + 'px'; qst.width = W * 0.9 + 'px';
    var ps = posterEl.style; ps.left = S.text.left + 'px'; ps.width = S.text.width + 'px'; ps.top = S.text.top + 'px'; ps.height = S.text.height + 'px'; posterEl.dataset.i = e.i; posterEl.__w = posterEl.querySelectorAll('.ln .w'); return;
  }
  var el = capEl[o.side], big = PORT ? W * 0.17 : H * 0.125, k1 = clamp((PORT ? W * 0.03 : H * 0.0135), 9, 15);
  if (o.id === 'logo') h = '<div class="kick" style="font-size:' + k1 + 'px">28.11.2026 · Дом на киното</div><div class="big logo" style="font-size:' + big + 'px"><span class="w r">TED<sup>x</sup></span><span class="w s">Sofia</span></div><div class="sub" style="font-size:' + big * 0.5 + 'px">' + words('Смисълът да даваш') + '</div>';
  else if (o.id === 'q1') h = '<div class="kick" style="font-size:' + k1 + 'px">въпрос първи</div><div class="big" style="font-size:' + big * 1.25 + 'px"><em><span class="w">Кой </span><span class="w">си </span><span class="w r">ти?</span></em></div>';
  else if (o.id === 'q2') h = '<div class="kick" style="font-size:' + k1 + 'px">довърши изречението</div><div class="big" style="font-size:' + big * 0.92 + 'px"><em><span class="w">Смисълът </span><br><span class="w r">да </span><span class="w r">даваш…</span></em></div>';
  else h = '<div class="kick" style="font-size:' + k1 + 'px">TEDxSofia 2026</div><div class="big" style="font-size:' + big * 1.15 + 'px"><em><span class="w">Лекторите</span></em></div>';
  el.style.bottom = ''; el.style.top = PORT ? '40%' : '50%'; el.style.transform = 'translateY(-50%)'; el.innerHTML = h; el.dataset.i = e.i;
}
function captionPts(node, n, rn) {
  var out = [], sp = node.querySelectorAll('.w'), tot = 0, list = [];
  sp.forEach(function (s) { var r = s.getBoundingClientRect(), cs = getComputedStyle(s); if (r.width < 2) return;
    var pts = glyphPts(s.textContent.trim(), cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily, r.width + 16, r.height + 16, 1);
    var tw = s.textContent.length - s.textContent.trim().length ? parseFloat(cs.fontSize) * 0.12 : 0;
    list.push({ pts: pts, cx: r.left + r.width / 2 - tw, cy: r.top + r.height / 2, red: /230, 43, 30/.test(cs.color) }); tot += pts.length; });
  list.forEach(function (l) { var m = Math.round(n * l.pts.length / Math.max(1, tot)); for (var k = 0; k < m; k++) { var p = l.pts[(rn() * l.pts.length) | 0]; out.push([l.cx + p[0] + rn() - 0.5, l.cy + p[1] + rn() - 0.5, l.red ? 0 : 2]); } });
  return out;
}

/* ── the throw group of one window: grains gather on the speaker's edge (and, unseen, on the poster's letters), hold, then fly to the next window ── */
var THROW = {};
function buildThrow(e) {
  var o = ORDER[e.i], key = e.i + '>' + e.next + '>' + W + 'x' + H; if (THROW[e.i] && THROW[e.i].key === key) return THROW[e.i];
  if (o.kind === 'speaker' && !EDGE[o.id]) return null;
  var rn = rng(1000 + e.i * 77), src = RECT[e.i], S = stageGeom(o), R = S.hero, arr = [], k, node = o.kind === 'speaker' ? posterEl : capEl[o.side];
  if (node.dataset.i !== String(e.i)) fillCaption(e);
  var tgt = e.next >= 0 ? RECT[e.next] : null;
  var target = function () { if (!tgt) { var f = FIN_PTS[(rn() * FIN_PTS.length) | 0] || [W / 2, H / 2]; return [f[0], f[1]]; } if (rn() < 0.55) return rrPoint(tgt, 14, rn); return [tgt.x + rn() * tgt.s, tgt.y + rn() * tgt.s]; };
  var holds = [];
  if (o.kind === 'speaker') { var E = EDGE[o.id], NE = PORT ? 3600 : 5600;
    for (k = 0; k < NE; k++) { var p = E[(rn() * E.length) | 0]; if (p[1] > 0.9 || (p[1] < 0.08 && p[3] < -0.85)) continue;   /* r7: no outline dust where the photo fades (lowest 10 %) or on a flat top cut of the head: both drew a stray straight line */ var py = R.y + p[1] * R.h; if (py > H + 6) continue;
      holds.push([R.x + p[0] * R.w, py, 0, 0, p[2], p[3], rn() < 0.5 ? (rn() < 0.7 ? 0 : 1) : 2, 0]); }
    captionPts(node, PORT ? 1500 : 2600, rn).forEach(function (c) { holds.push([c[0], c[1], 1, 0, 0, 0, c[2], 0]); });
  } else captionPts(node, PORT ? 6000 : 11000, rn).forEach(function (c) { holds.push([c[0], c[1], 1, 0, 0, 0, c[2], o.id === 'logo' ? 0.22 : 1]); });
  var tc = tgt ? [tgt.cx, tgt.cy] : [W / 2, H * 0.43], dmin = 1e9, dmax = 0; holds.forEach(function (h) { h.d = Math.hypot(h[0] - tc[0], h[1] - tc[1]); if (h.d < dmin) dmin = h.d; if (h.d > dmax) dmax = h.d; });
  holds.forEach(function (h) { var t = target(); arr.push(src.x + rn() * src.s, src.y + rn() * src.s, h[0], h[1], t[0], t[1], rn(), rn(), (h[2] ? 1.0 : 1.15) + rn() * 1.25, h[6], h[2], h[3], h[4], h[5], (h.d - dmin) / (dmax - dmin + 1), h[7]); });
  var b = THROW[e.i] ? THROW[e.i].buf : dustBuf(); fill(b, arr); THROW[e.i] = { key: key, buf: b, R: R, S: S }; return THROW[e.i];
}

/* ── schedule: every window lasts its pace; the line is whole a beat before the throw; a little pause holds everything still ── */
var SCHED = null, opened = {}, frozen = null, clockT = 0, amb = 0, paused = false, sheet = null;
function plan(list, t0, pre) {
  var en = pre ? pre.slice() : [], t = t0;
  list.forEach(function (i) { var o = ORDER[i], P = PACE[o.pace], rest = o.then ? PACE[o.then] : 0, e = { i: i, t0: t, P: P, tv: t + T_VOICE };
    e.tThrow = t + P - FLY + rest; e.tWhole = t + P - FLY - clamp(P * 0.3, 0.9, 1.6);   /* the image and the line stay whole 0.9–1.6 s (+ the little pause) before the throw */ e.tEnd = e.tThrow + FLY; t = e.tEnd; en.push(e); });
  en.forEach(function (e, k) { e.next = k + 1 < en.length ? en[k + 1].i : -1; });
  return { en: en, fin: t, end: t + FIN_LEN };
}
function now() { return frozen !== null ? frozen : clockT; }
function setNow(t) { clockT = t; }
function curEntry(T) { var c = null; SCHED.en.forEach(function (e) { if (e.t0 <= T) c = e; }); return c; }
function restart() { opened = {}; SCHED = plan(ORDER.map(function (_, i) { return i; }), INTRO); setNow(0); THROW = {}; }
function isOpen(i, T) { return !!opened[i] || SCHED.en.some(function (e) { return e.i === i && e.t0 + 0.3 <= T; }); }
function jumpTo(k, fromClick) {
  if (frozen !== null) return; var T = now();
  if (T < INTRO) { setNow(INTRO); T = INTRO; }
  if (T >= SCHED.fin) { if (!fromClick) restart(); return; }
  var cur = curEntry(T); if (cur && cur.i === k) return;
  if (opened[k] || SCHED.en.some(function (e) { return e.i === k && e.t0 <= T; })) return;       /* only closed windows */
  SCHED.en.forEach(function (e) { if (e.t0 <= T && e !== cur) opened[e.i] = 1; });
  var pre = [], st = T + 0.1;
  if (cur && T < cur.tEnd) { if (T < cur.tThrow) { cur.tThrow = Math.max(T, cur.t0 + 0.2); cur.tWhole = Math.min(cur.tWhole, cur.tThrow); } cur.tEnd = cur.tThrow + FLY; st = cur.tEnd; pre = [cur]; } else if (cur) opened[cur.i] = 1;
  var rest = []; for (var j = 0; j < NW; j++) { var i = (k + j) % NW; if (!opened[i] && !(pre.length && pre[0].i === i) && i !== NW - 1) rest.push(i); }
  if (!opened[NW - 1] && !(pre.length && pre[0].i === NW - 1)) { if (k === NW - 1) rest.unshift(NW - 1); else rest.push(NW - 1); }
  SCHED = plan(rest, st, pre); delete THROW[pre.length ? pre[0].i : -9];
}
function skip() { var T = now(); if (T < INTRO) return jumpTo(0); if (T >= SCHED.fin) return restart(); for (var k = 0; k < SCHED.en.length; k++) if (SCHED.en[k].t0 > T) return jumpTo(SCHED.en[k].i); setNow(SCHED.fin); }

/* ── pause · the speaker's small landing · the profile (24 badges, two currencies: „meaning“ and „giving“) ── */
var ppL = $('#ppL'), hintEl = $('#hint');
function setPaused(p) { paused = !!p; document.body.classList.toggle('paused', paused); ppL.textContent = paused ? 'Продължи' : 'Пауза'; $('#pp').setAttribute('aria-label', paused ? 'Продължи' : 'Пауза');
  hintEl.textContent = paused ? 'Пауза · избери лектор' : 'Отвори всички 24 прозореца'; }
function cellClick(i) {   /* an open speaker → his landing; a closed window → the chain jumps there */
  var o = ORDER[i]; if (isOpen(i, now())) { if (o.kind === 'speaker') openLanding(o.id); return; }
  if (paused) setPaused(false); jumpTo(i, true);
}
var ST = { b: {}, m: {}, g: {} }, LSK = 'aw2-profile', BADGE = {};
try { var raw = localStorage.getItem(LSK), pj = raw ? JSON.parse(raw) : null; if (pj) ['b', 'm', 'g'].forEach(function (k) { if (pj[k] && typeof pj[k] === 'object') ST[k] = pj[k]; }); } catch (err) {}
function saveST() { try { localStorage.setItem(LSK, JSON.stringify(ST)); } catch (err) {} }
function cnt(k) { return Object.keys(ST[k]).length; }
function chip(bump) { $('#cN').textContent = cnt('b'); $('#cM').textContent = cnt('m'); $('#cG').textContent = cnt('g'); if (bump) { var c = $('#chip'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); } if (sheet === 'prof') fillProfile(); }
function earn(k, id) { if (ST[k][id]) return; ST[k][id] = 1; saveST(); chip(true); }
function badge(i) {   /* a face in the dust style: a red-and-white duotone under stippled grains, in a ring of dust */
  if (BADGE[i]) return BADGE[i]; var o = ORDER[i], px = 176, k = document.createElement('canvas'); k.width = k.height = px; var g = k.getContext('2d', { willReadFrequently: true }), rn = rng(900 + i * 13), x, y, n;
  if (o.kind === 'speaker') { var im = IMG[o.id]; if (!im) return ''; var b = CAST[o.id].lm.box, s = Math.max(b[2] * im.width, b[3] * im.height) * 1.55; g.drawImage(im, (b[0] + b[2] / 2) * im.width - s / 2, (b[1] + b[3] * 0.44) * im.height - s / 2, s, s, 0, 0, px, px); }
  else { g.fillStyle = '#241a1a'; g.fillRect(0, 0, px, px); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'italic 700 ' + px * 0.7 + 'px ' + SERIF; g.fillText({ logo: 'x', q1: '?', q2: '…', fin: '✦' }[o.id] || '·', px / 2, px * (o.id === 'q2' ? 0.4 : 0.54)); }
  var d = g.getImageData(0, 0, px, px), a = d.data, lum = new Float32Array(px * px), lo = 1, hi = 0;
  for (n = 0; n < px * px; n++) { lum[n] = (a[n * 4] * 0.3 + a[n * 4 + 1] * 0.59 + a[n * 4 + 2] * 0.11) / 255; if (lum[n] < lo) lo = lum[n]; if (lum[n] > hi) hi = lum[n]; }
  for (n = 0; n < px * px; n++) { var t = Math.pow(clamp((lum[n] - lo) / (hi - lo + 0.001), 0, 1), 1.1), dx = (n % px) - px / 2 + 0.5, dy = ((n / px) | 0) - px / 2 + 0.5, rr = Math.hypot(dx, dy) / (px / 2), c0 = [21, 16, 16], c1 = [214, 34, 21], c2 = [251, 251, 251], u = t < 0.55 ? t / 0.55 : (t - 0.55) / 0.45, A0 = t < 0.55 ? c0 : c1, A1 = t < 0.55 ? c1 : c2;
    lum[n] = t; a[n * 4] = (A0[0] + (A1[0] - A0[0]) * u) * 0.72; a[n * 4 + 1] = (A0[1] + (A1[1] - A0[1]) * u) * 0.72; a[n * 4 + 2] = (A0[2] + (A1[2] - A0[2]) * u) * 0.72; a[n * 4 + 3] = rr > 0.97 ? 0 : 255; }
  g.putImageData(d, 0, 0); g.globalCompositeOperation = 'lighter';
  for (n = 0; n < 5200; n++) { x = rn() * px; y = rn() * px; if (Math.hypot(x - px / 2, y - px / 2) > px * 0.47) continue; var l = lum[((y | 0) * px + (x | 0))]; if (rn() > Math.pow(l, 1.3) + 0.03) continue;
    g.fillStyle = l > 0.62 || rn() < 0.3 ? 'rgba(255,255,255,.75)' : 'rgba(255,90,71,.8)'; g.beginPath(); g.arc(x, y, 0.6 + rn() * 0.9, 0, 6.3); g.fill(); }
  for (n = 0; n < 420; n++) { var an = rn() * 6.283, q = px * (0.475 + (rn() - 0.5) * 0.03); g.fillStyle = rn() < 0.6 ? 'rgba(230,43,30,.9)' : 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(px / 2 + q * Math.cos(an), px / 2 + q * Math.sin(an), 0.6 + rn() * 1.1, 0, 6.3); g.fill(); }
  BADGE[i] = k.toDataURL('image/png'); return BADGE[i];
}
var idxOf = {}; ORDER.forEach(function (o, i) { idxOf[o.id] = i; });
var EVLBL = { logo: 'TEDxSofia', q1: 'кой си ти', q2: 'да даваш', fin: 'лекторите' };
function fillProfile() {
  $('#pN').textContent = cnt('b'); $('#pM').textContent = cnt('m'); $('#pG').textContent = cnt('g'); var grid = $('#pGrid'); grid.innerHTML = '';
  ORDER.forEach(function (o, i) { var got = !!ST.b[o.id], sp = o.kind === 'speaker', b = document.createElement('button'); b.type = 'button'; b.className = 'bd' + (got ? ' got' : '') + (sp ? ' sp' : '') + (ST.m[o.id] ? ' read' : '');
    var src = got ? badge(i) : ''; b.innerHTML = '<i>' + (src ? '<img alt="" src="' + src + '">' : o.n) + '</i><span>' + (got ? (sp ? CAST[o.id].topic : EVLBL[o.id]) : '· · ·') + '</span>';
    if (got && sp) { b.setAttribute('aria-label', CAST[o.id].name); b.addEventListener('click', function () { closeSheet(false); openLanding(o.id); }); } grid.appendChild(b); });
}
function openSheet(name) { if (sheet) $('#' + sheet).classList.remove('on'); sheet = name; $('#' + name).classList.add('on'); }
function closeSheet(resume) { if (!sheet) return; if (sheet === 'land') { var v = $('#lVid'); try { v.pause(); } catch (err) {} v.removeAttribute('src'); v.load(); } $('#' + sheet).classList.remove('on'); sheet = null; if (resume) setPaused(false); }
function openLanding(id) {
  var c = CAST[id], i = idxOf[id], o = ORDER[i]; if (!c) return; earn('m', id);   /* reading a speaker's page earns „meaning“ */
  $('#lPic').src = c.photo; $('#lCr').textContent = c.credit || ''; $('#lKick').textContent = 'лектор · прозорец ' + o.n; $('#lName').textContent = c.name; $('#lTopic').textContent = c.topic; $('#lBadge').src = badge(i) || '';
  $('#lLine').textContent = '„' + o.shown + '“';
  $('#lArts').innerHTML = c.arts.map(function (a) { return '<div class="art"><div class="aq">' + a.ql + '</div><div class="at">„' + a.t + '“</div></div>'; }).join('');
  var slot = $('#lSlot'), v = $('#lVid'); slot.classList.remove('has'); v.onloadedmetadata = function () { slot.classList.add('has'); }; v.onerror = function () { slot.classList.remove('has'); }; v.src = 'intro/' + id + '.mp4';   /* plays when the file is there; the calm placeholder when it is not */
  $('#land .land-body').scrollTop = 0; $('#land .card').scrollTop = 0; openSheet('land');
}
$('#pp').addEventListener('click', function () { setPaused(!paused); });
$('#chip').addEventListener('click', function () { fillProfile(); openSheet('prof'); });
$('#lGo').addEventListener('click', function () { closeSheet(true); }); $('#pGo').addEventListener('click', function () { closeSheet(true); });
$('#pReset').addEventListener('click', function () { ST = { b: {}, m: {}, g: {} }; saveST(); chip(); closeSheet(false); setPaused(false); restart(); });
document.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', function () { closeSheet(false); }); });
document.querySelectorAll('.sheet').forEach(function (s) { s.addEventListener('click', function (ev) { if (ev.target === s) closeSheet(false); }); });
heroHit.addEventListener('click', function () { if (heroHit.dataset.id) openLanding(heroHit.dataset.id); });
addEventListener('keydown', function (ev) {
  if (ev.key === 'Escape') { closeSheet(false); return; } if (sheet) return;
  if (ev.code === 'Space' || ev.key === 'k' || ev.key === 'к') { ev.preventDefault(); setPaused(!paused); }
  else if (ev.key === 'ArrowRight' || ev.key === 'n') { if (paused) setPaused(false); skip(); }
  else if (ev.key === 'r' || ev.key === 'R' || ev.key === 'р' || ev.key === 'Р') { setPaused(false); restart(); }
});
/* the speaking-clip slot (for later): speak/<id>.mp4, muted, in place of the still photo, when the file exists */
var SPEAK = {}, speakBox = $('#speak');
function probeSpeak(id) { if (SPEAK[id] !== undefined) return; SPEAK[id] = null; var v = document.createElement('video'); v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto';
  v.addEventListener('loadeddata', function () { SPEAK[id] = v; speakBox.appendChild(v); }); v.addEventListener('error', function () { SPEAK[id] = null; }); v.src = 'speak/' + id + '.mp4'; }

/* ── per-frame ── */
var pz = 0, UOPEN = new Float32Array(24), UCELL = new Float32Array(48), domCache = {}, PUNCH = [], WV = new Float32Array(16), ZM = {};
function setStyle(el, k, v) { var id = el.__id || (el.__id = Math.random()), key = id + k; if (domCache[key] !== v) { domCache[key] = v; el.style[k] = v; } }
function frame(T, A, dt) {
  if (geomDirty) buildStatic();
  var en = SCHED.en, i, tF = T - SCHED.fin, act = [], live = frozen === null;
  for (i = 0; i < NW; i++) { UOPEN[i] = opened[i] ? 1000 : -1; UCELL[2 * i] = RECT[i].cx; UCELL[2 * i + 1] = RECT[i].cy; }
  var rip = [0, 0, -1, 0], head = [0, 0, 1, 0];
  en.forEach(function (e) { if (e.t0 <= T) { var o = ORDER[e.i]; UOPEN[e.i] = Math.max(0.0001, T - e.t0); if (T - e.t0 < 1.6) rip = [RECT[e.i].cx, RECT[e.i].cy, T - e.t0, 0]; if (T < e.tEnd + 0.9) act.push(e);
    if (live && T > e.t0 + 0.4) { earn('b', o.id); if (o.giving && T >= e.tWhole) earn('g', o.id); } } });   /* a window opened = a badge; a line about giving reached = „giving“ */
  /* DOM state, straight from T */
  var veil = { L: 0, R: 0 }, capOn = { L: null, R: null }, pe = null, ie = null, he = null;
  act.forEach(function (e) { var o = ORDER[e.i], tau = T - e.t0, th = T - e.tThrow, pres = sst(0.4, 0.95, tau) * (1 - sst(0.05, 0.5, th)), sp = o.kind === 'speaker';
    if (sp || PORT) { var ot = o.side === 'L' ? 'R' : 'L'; veil[o.side] = Math.max(veil[o.side], pres); veil[ot] = Math.max(veil[ot], pres * (PORT ? 1 : 0.97)); } else veil[o.side] = Math.max(veil[o.side], pres);
    if (tau >= 0 && th < 0.12) { if (sp) pe = e; else capOn[o.side] = e; }
    if (sp && tau >= T_STEP0 && th < 0.55) he = e;
    if (sp && tau >= T_VOICE - 0.25 && th < 0.75) ie = e; });
  pz += ((paused && !sheet ? 1 : 0) - pz) * Math.min(1, dt * 5); if (!PORT) { veil.L *= 1 - 0.36 * pz; veil.R *= 1 - 0.36 * pz; }
  setStyle(footEl, 'opacity', PORT ? (1 - Math.max(veil.L, veil.R)).toFixed(2) : '1');
  var introA = sst(2.55, 3.15, T), dimF = 1 - 0.5 * sst(0, 1.3, tF);
  for (i = 0; i < NW; i++) { var ot = UOPEN[i], isO = ot > 0.06, sd = ORDER[i].side, vl = Math.max(veil.L, veil.R) > 0 ? (PORT ? Math.max(veil.L, veil.R) : veil[RECT[i].cx < W / 2 ? 'L' : 'R']) : 0;
    setStyle(cells[i], 'opacity', (introA * (tF > 0 ? Math.max(0.25, dimF) : 1)).toFixed(3));
    PUNCH[i] = ot > 0 && ot < 0.7 ? 1 + 0.09 * Math.exp(-ot * 7.5) * Math.cos(ot * 24) : 1; setStyle(cells[i], 'transform', PUNCH[i] === 1 ? '' : 'scale(' + PUNCH[i].toFixed(4) + ')');
    var inner = isO ? '0' : '1'; setStyle(cells[i].firstChild, 'opacity', inner); setStyle(cells[i].lastChild, 'opacity', inner);
    if (isO !== cells[i].__open) { cells[i].__open = isO; cells[i].classList.toggle('open', isO); if (isO && ORDER[i].kind === 'speaker') { cells[i].classList.add('sp'); probeSpeak(ORDER[i].id); } }
    setStyle(nameEls[i], 'opacity', (sst(0.25, 0.6, ot) * (1 - vl) * (tF > 0 ? Math.max(0, 1 - tF / 0.8) : 1)).toFixed(3)); }
  ['L', 'R'].forEach(function (s) { var e = capOn[s], el = capEl[s]; if (!e) { setStyle(el, 'opacity', '0'); return; }
    if (el.dataset.i !== String(e.i)) fillCaption(e);
    var tau = T - e.t0, th = T - e.tThrow; setStyle(el, 'opacity', (sst(0.95, 1.25, tau) * 0.96 * (1 - sst(-0.02, 0.07, th))).toFixed(3)); });
  if (!pe) { setStyle(posterEl, 'opacity', '0'); setStyle(qEl, 'opacity', '0'); }
  else { if (posterEl.dataset.i !== String(pe.i)) fillCaption(pe);
    var ptau = T - pe.t0, pth = T - pe.tThrow, sp2 = posterEl.__w, nw = sp2.length, span = Math.max(0.2, pe.tWhole - pe.tv - 0.3);
    setStyle(posterEl, 'opacity', (sst(0.5, 0.8, ptau) * (1 - sst(-0.02, 0.08, pth))).toFixed(3)); setStyle(qEl, 'opacity', (0.92 * sst(0.45, 0.75, ptau) * (1 - sst(-0.02, 0.08, pth))).toFixed(3));
    for (var j = 0; j < nw; j++) { var wv = sst(0, 0.34, T - pe.tv - Math.min(span / Math.max(1, nw - 1), 0.5) * j);   /* words lead (at most 0.5 s apart), the image follows */ setStyle(sp2[j], 'opacity', wv.toFixed(2)); setStyle(sp2[j], 'filter', wv > 0.98 ? '' : 'blur(' + ((1 - wv) * 7).toFixed(1) + 'px)'); } }
  if (he) { var HR = stageGeom(ORDER[he.i]).hero, hy = Math.max(HR.y + HR.h * 0.06, 0); heroHit.dataset.id = ORDER[he.i].id; setStyle(heroHit, 'display', 'block'); setStyle(heroHit, 'left', (HR.x + HR.w * 0.14) + 'px'); setStyle(heroHit, 'top', hy + 'px'); setStyle(heroHit, 'width', (HR.w * 0.72) + 'px'); setStyle(heroHit, 'height', (Math.min(H, HR.y + HR.h) - hy) + 'px'); }
  else setStyle(heroHit, 'display', 'none');
  if (tF > 0 && !finEl.innerHTML) finEl.innerHTML = '<b>TEDxSofia</b> 2026 · Лекторите'; setStyle(finEl, 'opacity', (sst(1.3, 2.2, tF) * (1 - sst(FIN_LEN - 0.9, FIN_LEN - 0.1, tF))).toFixed(3));

  /* GL */
  gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  /* photos in the open windows */
  gl.useProgram(PT.p); gl.bindVertexArray(quad); gl.uniform2f(PT.u.uRes, W, H); gl.uniform1i(PT.u.uTex, 0); gl.activeTexture(gl.TEXTURE0);
  for (i = 0; i < NW; i++) { var ot2 = UOPEN[i]; if (ot2 <= 0.1) continue; var o2 = ORDER[i], t = TX[o2.id]; if (!t || !t.photo) continue; var r = RECT[i], rev = sst(0.1, 0.62, ot2);
    var ps = (r.s - 4) * PUNCH[i]; gl.bindTexture(gl.TEXTURE_2D, t.photo); gl.uniform4f(PT.u.uRect, r.cx - ps / 2, r.cy - ps / 2, ps, ps);
    if (o2.kind === 'speaker') { var v0 = thumbV0(CAST[o2.id].lm); gl.uniform4f(PT.u.uUv, 0, v0, 1, v0 + 0.8); } else gl.uniform4f(PT.u.uUv, 0, 0, 1, 1);
    gl.uniform4fv(PT.u.uWv, WV); gl.uniform1f(PT.u.uSc, G.s / 230); gl.uniform1f(PT.u.uReveal, rev); gl.uniform1f(PT.u.uDim, o2.kind === 'speaker' ? dimF : dimF * (1 - 0.6 * sst(0, 1.3, tF))); gl.uniform1f(PT.u.uRad, 12.5); gl.uniform1f(PT.u.uSeed, i * 3.7); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }
  /* the comet head pushes the wall grains */
  act.forEach(function (e) { var th = T - e.tThrow; if (th > 0 && th < 0.5 && e.next >= 0) { var S = stageGeom(ORDER[e.i]), sp = ORDER[e.i].kind === 'speaker', u = Math.pow(clamp(th / 0.4, 0, 1), 1.8), a = sp ? [S.idea.cx, S.idea.cy] : [S.hero.x + S.hero.w / 2, S.hero.y + S.hero.h * 0.4], b = [RECT[e.next].cx, RECT[e.next].cy];
    head = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - Math.sin(u * Math.PI) * 70, 150 * G.s / 230, 34 * Math.sin(Math.PI * u) * G.s / 230]; } });
  /* wall dust */
  gl.useProgram(PD.p); gl.uniform1f(PD.u.uT, T); gl.uniform1f(PD.u.uA, A); gl.uniform1f(PD.u.uPx, PXS); gl.uniform2f(PD.u.uRes, W, H); gl.uniform1f(PD.u.uSc, G.s / 230); gl.uniform1f(PD.u.uFin, Math.max(0, tF)); gl.uniform1f(PD.u.uIntro, introA);
  gl.uniform1fv(PD.u.uOpenT, UOPEN); gl.uniform2fv(PD.u.uCell, UCELL); gl.uniform3fv(PD.u.uPal, PAL); gl.uniform4fv(PD.u.uHead, head); gl.uniform4fv(PD.u.uRip, rip); gl.uniform4fv(PD.u.uWv, WV); gl.uniform3f(PD.u.uZm, 0, 0, 1);
  gl.uniform1i(PD.u.uMode, 0); gl.bindVertexArray(B_FRAME.vao); gl.drawArrays(gl.POINTS, 0, B_FRAME.n);
  gl.uniform1i(PD.u.uMode, 1); gl.bindVertexArray(B_DOOR.vao); gl.drawArrays(gl.POINTS, 0, B_DOOR.n);
  /* veil + the still speaker */
  if (veil.L > 0.003 || veil.R > 0.003) { gl.useProgram(PV.p); gl.bindVertexArray(quad); gl.uniform2f(PV.u.uAmt, veil.L, veil.R); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }
  var breath = 0.5 + 0.5 * Math.sin(A * 1.3), clip = null;
  act.forEach(function (e) { var o = ORDER[e.i]; if (o.kind !== 'speaker') return; var t = TX[o.id]; if (!t || !t.photo || !t.aux) return; var tau = T - e.t0, th = T - e.tThrow; if (tau < T_STEP0 || th > 0.55) return;
    var lm = CAST[o.id].lm, c = RECT[e.i], S = stageGeom(o), R = S.hero, v0 = thumbV0(lm), k = back((tau - T_STEP0) / (T_STEP + 0.12)), sd = PORT ? 1 : (o.side === 'L' ? 1 : -1);
    var x = c.x + (R.x - c.x) * k, y = (c.y - v0 * c.s / 0.8) + (R.y - (c.y - v0 * c.s / 0.8)) * k, w = c.s + (R.w - c.s) * k, h = c.s / 0.8 + (R.h - c.s / 0.8) * k;
    var zm = 1 + 0.07 * clamp((T - e.tv + 0.3) / Math.max(0.8, e.tThrow - e.tv + 0.3), 0, 1); ZM[e.i] = zm; x -= w * (zm - 1) * S.ax; y -= h * (zm - 1) * S.ay; w *= zm; h *= zm;   /* the slow push-in, on the face */
    var vin = sst(0, 0.5, tau - T_STEP0) * (1 - sst(0.02, 0.4, th));
    if (SPEAK[o.id]) { clip = { v: SPEAK[o.id], x: x, y: y, w: w, h: h, a: vin }; return; }
    gl.useProgram(PH.p); gl.bindVertexArray(quad); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, t.photo); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, t.aux);
    var u = PH.u; gl.uniform1i(u.uTex, 0); gl.uniform1i(u.uAux, 1); gl.uniform4f(u.uRect, x, y, w, h); gl.uniform2f(u.uRes, W, H); gl.uniform1f(u.uIn, vin); gl.uniform1f(u.uSide, sd); gl.uniform1f(u.uBreath, breath); gl.uniform1f(u.uFade, PORT ? 0.6 : 0.42); gl.uniform1f(u.uEdge, PORT ? 0.14 : 0.09);
    gl.uniform3f(u.uKey, -0.55 * sd + 0.4 * Math.sin(A * 0.45), -0.5 + 0.12 * Math.cos(A * 0.31), 0.75);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.activeTexture(gl.TEXTURE0); });
  for (var id in SPEAK) { var sv = SPEAK[id]; if (!sv) continue; if (clip && clip.v === sv) { var cs = sv.style; cs.left = clip.x + 'px'; cs.top = clip.y + 'px'; cs.width = clip.w + 'px'; cs.height = clip.h + 'px'; cs.opacity = clip.a.toFixed(3); if (sv.paused) { var pr = sv.play(); if (pr && pr.catch) pr.catch(function () {}); } } else if (sv.style.opacity !== '0') { sv.style.opacity = '0'; sv.pause(); } }
  /* throws, snow */
  gl.useProgram(PD.p); gl.uniform1i(PD.u.uMode, 3); gl.uniform1f(PD.u.uFin, 0);
  act.forEach(function (e) { var g = buildThrow(e); if (!g) return; var R = g.R, zm = ZM[e.i] || 1, sp = ORDER[e.i].kind === 'speaker'; gl.uniform1f(PD.u.uTau, T - e.t0); gl.uniform1f(PD.u.uThrowT, e.tThrow - e.t0); gl.uniform1f(PD.u.uVoice, sp ? 0.1 + 0.16 * breath : 0.12);
    gl.uniform3f(PD.u.uZm, R.x + R.w * g.S.ax, R.y + R.h * g.S.ay, sp ? zm : 1); gl.uniform2f(PD.u.uHeadShift, 0, 0); gl.bindVertexArray(g.buf.vao); gl.drawArrays(gl.POINTS, 0, g.buf.n); });
  gl.uniform1i(PD.u.uMode, 2); gl.bindVertexArray(B_SNOW.vao); gl.drawArrays(gl.POINTS, 0, B_SNOW.n);

  /* the metaidea: starts forming with the first word, whole when the line ends, stays a beat, exhales into the dust that opens the next window */
  var st = null;
  if (ie) { var o3 = ORDER[ie.i], S3 = stageGeom(o3), tau3 = T - ie.t0, th3 = T - ie.tThrow, nx = ie.next >= 0 ? RECT[ie.next] : { cx: W / 2, cy: H * 0.43 };
    st = { id: o3.id, cx: S3.idea.cx, cy: S3.idea.cy, r: S3.idea.r, dw: S3.idea.dw, dh: S3.idea.dh, dcx: S3.idea.dcx, dcy: S3.idea.dcy, hx: S3.idea.hx, hy: S3.idea.hy, hr: S3.idea.hr, tx: nx.cx, ty: nx.cy, A: A, T: Math.max(0, T - ie.tv),
      asm: clamp((T - ie.tv + ASM0) / clamp(ie.tWhole - ie.tv + ASM0 + ASM1, 0.6, ASM_MAX), 0, 1), pres: sst(T_VOICE - 0.25, T_VOICE + 0.3, tau3) * (1 - sst(0.6, 0.74, th3)), thr: th3 > 0 ? th3 / 0.5 : 0 }; }
  AW_IDEA.frame(st, dt);
}

/* ── loop, adaptive resolution, time control ── */
var fpsEMA = 60, lastNow = 0, slow = 0, fastc = 0, frames = 0;
function tick(n) {
  var dt = n - lastNow; lastNow = n; frames++; if (dt > 0 && dt < 500) fpsEMA += (1000 / dt - fpsEMA) * 0.05; var ds = clamp(dt / 1000, 0, 0.1);
  if (frozen === null) { if (dt > 24) slow++; else slow = Math.max(0, slow - 1); if (dt < 14) fastc++; else fastc = 0;
    if (slow > 40 && RES > 0.5) { RES = Math.max(0.5, RES * 0.85); slow = 0; resize(); } else if (fastc > 600 && RES < 1) { RES = Math.min(1, RES / 0.85); fastc = 0; resize(); }
    amb += ds; if (!paused && !sheet) clockT += ds; }
  var T = now(); if (frozen === null && T > SCHED.end) { restart(); T = 0; }
  frame(T, frozen !== null ? frozen : amb, ds); requestAnimationFrame(tick);
}
AW_IDEA.init($('#idea'));
addEventListener('resize', resize);
resize(); SCHED = plan(ORDER.map(function (_, i) { return i; }), INTRO); chip();
var qw = qs('w'), qt = qs('t'), qp = qs('pause') === '1';
if (qw === null && qt === null && qp) qw = '9';   /* ?pause=1 alone: paused on window 9, its line whole, eight windows open to click */
if (qw !== null) { var e0 = SCHED.en[clamp((+qw | 0) - 1, 0, NW - 1)]; if (qt !== null) frozen = e0.t0 + (+qt); else setNow(qp ? e0.tWhole + 0.1 : e0.t0 - 0.15); } else if (qt !== null) frozen = +qt;
if (qp) setPaused(true);
if (qs('land') && CAST[qs('land')]) { var li = new Image(); li.onload = function () { setTimeout(function () { openLanding(qs('land')); }, 60); }; li.src = CAST[qs('land')].photo; }
if (qs('profile') === '1') setTimeout(function () { fillProfile(); openSheet('prof'); }, 700);
window.__aw = { seek: function (t) { frozen = t; frame(t, t, 0.016); }, play: function (t) { frozen = null; setNow(t || 0); }, fps: function () { return fpsEMA; }, frames: function () { return frames; }, res: function () { return RES; }, sched: function () { return SCHED; },
  pause: setPaused, paused: function () { return paused; }, now: now, state: function () { return { b: cnt('b'), m: cnt('m'), g: cnt('g'), sheet: sheet, paused: paused, T: now() }; }, land: openLanding, profile: function () { fillProfile(); openSheet('prof'); }, close: closeSheet,
  rect: function (i) { return RECT[i]; }, stage: function (i) { return stageGeom(ORDER[i]); }, pace: PACE, rhythm: RHYTHM,
  info: function () { var d = gl.getExtension('WEBGL_debug_renderer_info'); return { renderer: d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : '?', w: W, h: H, dpr: DPR, res: RES, cw: cv.width, ch: cv.height, port: PORT, grains: AW_IDEA.n, tex: Object.keys(TX).length, edge: Object.keys(EDGE).length }; } };
requestAnimationFrame(tick);
})();
