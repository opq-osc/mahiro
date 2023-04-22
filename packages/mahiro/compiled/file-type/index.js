(()=>{var e={53:(e,t)=>{
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
t.i=function(e,t,i,r,n){var a,s;var o=n*8-r-1;var c=(1<<o)-1;var f=c>>1;var m=-7;var p=i?n-1:0;var u=i?-1:1;var h=e[t+p];p+=u;a=h&(1<<-m)-1;h>>=-m;m+=o;for(;m>0;a=a*256+e[t+p],p+=u,m-=8){}s=a&(1<<-m)-1;a>>=-m;m+=r;for(;m>0;s=s*256+e[t+p],p+=u,m-=8){}if(a===0){a=1-f}else if(a===c){return s?NaN:(h?-1:1)*Infinity}else{s=s+Math.pow(2,r);a=a-f}return(h?-1:1)*s*Math.pow(2,a-r)};t.c=function(e,t,i,r,n,a){var s,o,c;var f=a*8-n-1;var m=(1<<f)-1;var p=m>>1;var u=n===23?Math.pow(2,-24)-Math.pow(2,-77):0;var h=r?0:a-1;var l=r?1:-1;var d=t<0||t===0&&1/t<0?1:0;t=Math.abs(t);if(isNaN(t)||t===Infinity){o=isNaN(t)?1:0;s=m}else{s=Math.floor(Math.log(t)/Math.LN2);if(t*(c=Math.pow(2,-s))<1){s--;c*=2}if(s+p>=1){t+=u/c}else{t+=u*Math.pow(2,1-p)}if(t*c>=2){s++;c/=2}if(s+p>=m){o=0;s=m}else if(s+p>=1){o=(t*c-1)*Math.pow(2,n);s=s+p}else{o=t*Math.pow(2,p-1)*Math.pow(2,n);s=0}}for(;n>=8;e[i+h]=o&255,h+=l,o/=256,n-=8){}s=s<<n|o;f+=n;for(;f>0;e[i+h]=s&255,h+=l,s/=256,f-=8){}e[i+h-l]|=d*128}},492:e=>{"use strict";e.exports=require("node:stream")}};var t={};function __nccwpck_require__(i){var r=t[i];if(r!==undefined){return r.exports}var n=t[i]={exports:{}};var a=true;try{e[i](n,n.exports,__nccwpck_require__);a=false}finally{if(a)delete t[i]}return n.exports}(()=>{var e=Object.getPrototypeOf?e=>Object.getPrototypeOf(e):e=>e.__proto__;var t;__nccwpck_require__.t=function(i,r){if(r&1)i=this(i);if(r&8)return i;if(typeof i==="object"&&i){if(r&4&&i.__esModule)return i;if(r&16&&typeof i.then==="function")return i}var n=Object.create(null);__nccwpck_require__.r(n);var a={};t=t||[null,e({}),e([]),e(e)];for(var s=r&2&&i;typeof s=="object"&&!~t.indexOf(s);s=e(s)){Object.getOwnPropertyNames(s).forEach((e=>a[e]=()=>i[e]))}a["default"]=()=>i;__nccwpck_require__.d(n,a);return n}})();(()=>{__nccwpck_require__.d=(e,t)=>{for(var i in t){if(__nccwpck_require__.o(t,i)&&!__nccwpck_require__.o(e,i)){Object.defineProperty(e,i,{enumerable:true,get:t[i]})}}}})();(()=>{__nccwpck_require__.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t)})();(()=>{__nccwpck_require__.r=e=>{if(typeof Symbol!=="undefined"&&Symbol.toStringTag){Object.defineProperty(e,Symbol.toStringTag,{value:"Module"})}Object.defineProperty(e,"__esModule",{value:true})}})();if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var i={};(()=>{"use strict";__nccwpck_require__.r(i);__nccwpck_require__.d(i,{fileTypeFromBuffer:()=>fileTypeFromBuffer,fileTypeFromFile:()=>fileTypeFromFile,fileTypeFromStream:()=>fileTypeFromStream,fileTypeFromTokenizer:()=>fileTypeFromTokenizer,fileTypeStream:()=>fileTypeStream,supportedExtensions:()=>R,supportedMimeTypes:()=>C});const e=require("node:fs");const t=e.existsSync;const r=e.createReadStream;async function FsPromise_stat(t){return new Promise(((i,r)=>{e.stat(t,((e,t)=>{if(e)r(e);else i(t)}))}))}async function FsPromise_close(t){return new Promise(((i,r)=>{e.close(t,(e=>{if(e)r(e);else i()}))}))}async function FsPromise_open(t,i){return new Promise(((r,n)=>{e.open(t,i,((e,t)=>{if(e)n(e);else r(t)}))}))}async function read(t,i,r,n,a){return new Promise(((s,o)=>{e.read(t,i,r,n,a,((e,t,i)=>{if(e)o(e);else s({bytesRead:t,buffer:i})}))}))}async function writeFile(e,t){return new Promise(((i,r)=>{fs.writeFile(e,t,(e=>{if(e)r(e);else i()}))}))}function writeFileSync(e,t){fs.writeFileSync(e,t)}async function readFile(e){return new Promise(((t,i)=>{fs.readFile(e,((e,r)=>{if(e)i(e);else t(r)}))}))}const n="End-Of-Stream";class EndOfStreamError extends Error{constructor(){super(n)}}class Deferred{constructor(){this.resolve=()=>null;this.reject=()=>null;this.promise=new Promise(((e,t)=>{this.reject=t;this.resolve=e}))}}const a=1*1024*1024;class StreamReader{constructor(e){this.s=e;this.deferred=null;this.endOfStream=false;this.peekQueue=[];if(!e.read||!e.once){throw new Error("Expected an instance of stream.Readable")}this.s.once("end",(()=>this.reject(new EndOfStreamError)));this.s.once("error",(e=>this.reject(e)));this.s.once("close",(()=>this.reject(new Error("Stream closed"))))}async peek(e,t,i){const r=await this.read(e,t,i);this.peekQueue.push(e.subarray(t,t+r));return r}async read(e,t,i){if(i===0){return 0}if(this.peekQueue.length===0&&this.endOfStream){throw new EndOfStreamError}let r=i;let n=0;while(this.peekQueue.length>0&&r>0){const i=this.peekQueue.pop();if(!i)throw new Error("peekData should be defined");const a=Math.min(i.length,r);e.set(i.subarray(0,a),t+n);n+=a;r-=a;if(a<i.length){this.peekQueue.push(i.subarray(a))}}while(r>0&&!this.endOfStream){const i=Math.min(r,a);const s=await this.readFromStream(e,t+n,i);n+=s;if(s<i)break;r-=s}return n}async readFromStream(e,t,i){const r=this.s.read(i);if(r){e.set(r,t);return r.length}else{const r={buffer:e,offset:t,length:i,deferred:new Deferred};this.deferred=r.deferred;this.s.once("readable",(()=>{this.readDeferred(r)}));return r.deferred.promise}}readDeferred(e){const t=this.s.read(e.length);if(t){e.buffer.set(t,e.offset);e.deferred.resolve(t.length);this.deferred=null}else{this.s.once("readable",(()=>{this.readDeferred(e)}))}}reject(e){this.endOfStream=true;if(this.deferred){this.deferred.reject(e);this.deferred=null}}}const s=require("node:buffer");class AbstractTokenizer{constructor(e){this.position=0;this.numBuffer=new Uint8Array(8);this.fileInfo=e?e:{}}async readToken(e,t=this.position){const i=s.Buffer.alloc(e.len);const r=await this.readBuffer(i,{position:t});if(r<e.len)throw new EndOfStreamError;return e.get(i,0)}async peekToken(e,t=this.position){const i=s.Buffer.alloc(e.len);const r=await this.peekBuffer(i,{position:t});if(r<e.len)throw new EndOfStreamError;return e.get(i,0)}async readNumber(e){const t=await this.readBuffer(this.numBuffer,{length:e.len});if(t<e.len)throw new EndOfStreamError;return e.get(this.numBuffer,0)}async peekNumber(e){const t=await this.peekBuffer(this.numBuffer,{length:e.len});if(t<e.len)throw new EndOfStreamError;return e.get(this.numBuffer,0)}async ignore(e){if(this.fileInfo.size!==undefined){const t=this.fileInfo.size-this.position;if(e>t){this.position+=t;return t}}this.position+=e;return e}async close(){}normalizeOptions(e,t){if(t&&t.position!==undefined&&t.position<this.position){throw new Error("`options.position` must be equal or greater than `tokenizer.position`")}if(t){return{mayBeLess:t.mayBeLess===true,offset:t.offset?t.offset:0,length:t.length?t.length:e.length-(t.offset?t.offset:0),position:t.position?t.position:this.position}}return{mayBeLess:false,offset:0,length:e.length,position:this.position}}}const o=256e3;class ReadStreamTokenizer extends AbstractTokenizer{constructor(e,t){super(t);this.streamReader=new StreamReader(e)}async getFileInfo(){return this.fileInfo}async readBuffer(e,t){const i=this.normalizeOptions(e,t);const r=i.position-this.position;if(r>0){await this.ignore(r);return this.readBuffer(e,t)}else if(r<0){throw new Error("`options.position` must be equal or greater than `tokenizer.position`")}if(i.length===0){return 0}const n=await this.streamReader.read(e,i.offset,i.length);this.position+=n;if((!t||!t.mayBeLess)&&n<i.length){throw new EndOfStreamError}return n}async peekBuffer(e,t){const i=this.normalizeOptions(e,t);let r=0;if(i.position){const t=i.position-this.position;if(t>0){const n=new Uint8Array(i.length+t);r=await this.peekBuffer(n,{mayBeLess:i.mayBeLess});e.set(n.subarray(t),i.offset);return r-t}else if(t<0){throw new Error("Cannot peek from a negative offset in a stream")}}if(i.length>0){try{r=await this.streamReader.peek(e,i.offset,i.length)}catch(e){if(t&&t.mayBeLess&&e instanceof EndOfStreamError){return 0}throw e}if(!i.mayBeLess&&r<i.length){throw new EndOfStreamError}}return r}async ignore(e){const t=Math.min(o,e);const i=new Uint8Array(t);let r=0;while(r<e){const n=e-r;const a=await this.readBuffer(i,{length:Math.min(t,n)});if(a<0){return a}r+=a}return r}}class BufferTokenizer extends AbstractTokenizer{constructor(e,t){super(t);this.uint8Array=e;this.fileInfo.size=this.fileInfo.size?this.fileInfo.size:e.length}async readBuffer(e,t){if(t&&t.position){if(t.position<this.position){throw new Error("`options.position` must be equal or greater than `tokenizer.position`")}this.position=t.position}const i=await this.peekBuffer(e,t);this.position+=i;return i}async peekBuffer(e,t){const i=this.normalizeOptions(e,t);const r=Math.min(this.uint8Array.length-i.position,i.length);if(!i.mayBeLess&&r<i.length){throw new EndOfStreamError}else{e.set(this.uint8Array.subarray(i.position,i.position+r),i.offset);return r}}async close(){}}function fromStream(e,t){t=t?t:{};return new ReadStreamTokenizer(e,t)}function fromBuffer(e,t){return new BufferTokenizer(e,t)}class FileTokenizer extends AbstractTokenizer{constructor(e,t){super(t);this.fd=e}async readBuffer(e,t){const i=this.normalizeOptions(e,t);this.position=i.position;const r=await read(this.fd,e,i.offset,i.length,i.position);this.position+=r.bytesRead;if(r.bytesRead<i.length&&(!t||!t.mayBeLess)){throw new EndOfStreamError}return r.bytesRead}async peekBuffer(e,t){const i=this.normalizeOptions(e,t);const r=await read(this.fd,e,i.offset,i.length,i.position);if(!i.mayBeLess&&r.bytesRead<i.length){throw new EndOfStreamError}return r.bytesRead}async close(){return FsPromise_close(this.fd)}}async function fromFile(e){const t=await FsPromise_stat(e);if(!t.isFile){throw new Error(`File not a file: ${e}`)}const i=await FsPromise_open(e,"r");return new FileTokenizer(i,{path:e,size:t.size})}async function lib_fromStream(e,t){t=t?t:{};if(e.path){const i=await fs.stat(e.path);t.path=e.path;t.size=i.size}return core.fromStream(e,t)}var c=__nccwpck_require__(53);function dv(e){return new DataView(e.buffer,e.byteOffset)}const f={len:1,get(e,t){return dv(e).getUint8(t)},put(e,t,i){dv(e).setUint8(t,i);return t+1}};const m={len:2,get(e,t){return dv(e).getUint16(t,true)},put(e,t,i){dv(e).setUint16(t,i,true);return t+2}};const p={len:2,get(e,t){return dv(e).getUint16(t)},put(e,t,i){dv(e).setUint16(t,i);return t+2}};const u={len:3,get(e,t){const i=dv(e);return i.getUint8(t)+(i.getUint16(t+1,true)<<8)},put(e,t,i){const r=dv(e);r.setUint8(t,i&255);r.setUint16(t+1,i>>8,true);return t+3}};const h={len:3,get(e,t){const i=dv(e);return(i.getUint16(t)<<8)+i.getUint8(t+2)},put(e,t,i){const r=dv(e);r.setUint16(t,i>>8);r.setUint8(t+2,i&255);return t+3}};const l={len:4,get(e,t){return dv(e).getUint32(t,true)},put(e,t,i){dv(e).setUint32(t,i,true);return t+4}};const d={len:4,get(e,t){return dv(e).getUint32(t)},put(e,t,i){dv(e).setUint32(t,i);return t+4}};const g={len:1,get(e,t){return dv(e).getInt8(t)},put(e,t,i){dv(e).setInt8(t,i);return t+1}};const x={len:2,get(e,t){return dv(e).getInt16(t)},put(e,t,i){dv(e).setInt16(t,i);return t+2}};const k={len:2,get(e,t){return dv(e).getInt16(t,true)},put(e,t,i){dv(e).setInt16(t,i,true);return t+2}};const w={len:3,get(e,t){const i=u.get(e,t);return i>8388607?i-16777216:i},put(e,t,i){const r=dv(e);r.setUint8(t,i&255);r.setUint16(t+1,i>>8,true);return t+3}};const v={len:3,get(e,t){const i=h.get(e,t);return i>8388607?i-16777216:i},put(e,t,i){const r=dv(e);r.setUint16(t,i>>8);r.setUint8(t+2,i&255);return t+3}};const y={len:4,get(e,t){return dv(e).getInt32(t)},put(e,t,i){dv(e).setInt32(t,i);return t+4}};const b={len:4,get(e,t){return dv(e).getInt32(t,true)},put(e,t,i){dv(e).setInt32(t,i,true);return t+4}};const S={len:8,get(e,t){return dv(e).getBigUint64(t,true)},put(e,t,i){dv(e).setBigUint64(t,i,true);return t+8}};const _={len:8,get(e,t){return dv(e).getBigInt64(t,true)},put(e,t,i){dv(e).setBigInt64(t,i,true);return t+8}};const z={len:8,get(e,t){return dv(e).getBigUint64(t)},put(e,t,i){dv(e).setBigUint64(t,i);return t+8}};const T={len:8,get(e,t){return dv(e).getBigInt64(t)},put(e,t,i){dv(e).setBigInt64(t,i);return t+8}};const B={len:2,get(e,t){return c.i(e,t,false,10,this.len)},put(e,t,i){c.c(e,i,t,false,10,this.len);return t+this.len}};const F={len:2,get(e,t){return c.i(e,t,true,10,this.len)},put(e,t,i){c.c(e,i,t,true,10,this.len);return t+this.len}};const E={len:4,get(e,t){return dv(e).getFloat32(t)},put(e,t,i){dv(e).setFloat32(t,i);return t+4}};const I={len:4,get(e,t){return dv(e).getFloat32(t,true)},put(e,t,i){dv(e).setFloat32(t,i,true);return t+4}};const j={len:8,get(e,t){return dv(e).getFloat64(t)},put(e,t,i){dv(e).setFloat64(t,i);return t+8}};const M={len:8,get(e,t){return dv(e).getFloat64(t,true)},put(e,t,i){dv(e).setFloat64(t,i,true);return t+8}};const O={len:10,get(e,t){return c.i(e,t,false,63,this.len)},put(e,t,i){c.c(e,i,t,false,63,this.len);return t+this.len}};const P={len:10,get(e,t){return c.i(e,t,true,63,this.len)},put(e,t,i){c.c(e,i,t,true,63,this.len);return t+this.len}};class IgnoreType{constructor(e){this.len=e}get(e,t){}}class Uint8ArrayType{constructor(e){this.len=e}get(e,t){return e.subarray(t,t+this.len)}}class BufferType{constructor(e){this.len=e}get(e,t){return Buffer.from(e.subarray(t,t+this.len))}}class StringType{constructor(e,t){this.len=e;this.encoding=t}get(e,t){return s.Buffer.from(e).toString(this.encoding,t,t+this.len)}}class AnsiStringType{constructor(e){this.len=e}static decode(e,t,i){let r="";for(let n=t;n<i;++n){r+=AnsiStringType.codePointToString(AnsiStringType.singleByteDecoder(e[n]))}return r}static inRange(e,t,i){return t<=e&&e<=i}static codePointToString(e){if(e<=65535){return String.fromCharCode(e)}else{e-=65536;return String.fromCharCode((e>>10)+55296,(e&1023)+56320)}}static singleByteDecoder(e){if(AnsiStringType.inRange(e,0,127)){return e}const t=AnsiStringType.windows1252[e-128];if(t===null){throw Error("invaliding encoding")}return t}get(e,t=0){return AnsiStringType.decode(e,t,t+this.len)}}AnsiStringType.windows1252=[8364,129,8218,402,8222,8230,8224,8225,710,8240,352,8249,338,141,381,143,144,8216,8217,8220,8221,8226,8211,8212,732,8482,353,8250,339,157,382,376,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255];function stringToBytes(e){return[...e].map((e=>e.charCodeAt(0)))}function tarHeaderChecksumMatches(e,t=0){const i=Number.parseInt(e.toString("utf8",148,154).replace(/\0.*$/,"").trim(),8);if(Number.isNaN(i)){return false}let r=8*32;for(let i=t;i<t+148;i++){r+=e[i]}for(let i=t+156;i<t+512;i++){r+=e[i]}return i===r}const q={get:(e,t)=>e[t+3]&127|e[t+2]<<7|e[t+1]<<14|e[t]<<21,len:4};const A=["jpg","png","apng","gif","webp","flif","xcf","cr2","cr3","orf","arw","dng","nef","rw2","raf","tif","bmp","icns","jxr","psd","indd","zip","tar","rar","gz","bz2","7z","dmg","mp4","mid","mkv","webm","mov","avi","mpg","mp2","mp3","m4a","oga","ogg","ogv","opus","flac","wav","spx","amr","pdf","epub","elf","exe","swf","rtf","wasm","woff","woff2","eot","ttf","otf","ico","flv","ps","xz","sqlite","nes","crx","xpi","cab","deb","ar","rpm","Z","lz","cfb","mxf","mts","blend","bpg","docx","pptx","xlsx","3gp","3g2","jp2","jpm","jpx","mj2","aif","qcp","odt","ods","odp","xml","mobi","heic","cur","ktx","ape","wv","dcm","ics","glb","pcap","dsf","lnk","alias","voc","ac3","m4v","m4p","m4b","f4v","f4p","f4b","f4a","mie","asf","ogm","ogx","mpc","arrow","shp","aac","mp1","it","s3m","xm","ai","skp","avif","eps","lzh","pgp","asar","stl","chm","3mf","zst","jxl","vcf","jls","pst","dwg","parquet"];const U=["image/jpeg","image/png","image/gif","image/webp","image/flif","image/x-xcf","image/x-canon-cr2","image/x-canon-cr3","image/tiff","image/bmp","image/vnd.ms-photo","image/vnd.adobe.photoshop","application/x-indesign","application/epub+zip","application/x-xpinstall","application/vnd.oasis.opendocument.text","application/vnd.oasis.opendocument.spreadsheet","application/vnd.oasis.opendocument.presentation","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.openxmlformats-officedocument.presentationml.presentation","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/zip","application/x-tar","application/x-rar-compressed","application/gzip","application/x-bzip2","application/x-7z-compressed","application/x-apple-diskimage","application/x-apache-arrow","video/mp4","audio/midi","video/x-matroska","video/webm","video/quicktime","video/vnd.avi","audio/vnd.wave","audio/qcelp","audio/x-ms-asf","video/x-ms-asf","application/vnd.ms-asf","video/mpeg","video/3gpp","audio/mpeg","audio/mp4","audio/opus","video/ogg","audio/ogg","application/ogg","audio/x-flac","audio/ape","audio/wavpack","audio/amr","application/pdf","application/x-elf","application/x-msdownload","application/x-shockwave-flash","application/rtf","application/wasm","font/woff","font/woff2","application/vnd.ms-fontobject","font/ttf","font/otf","image/x-icon","video/x-flv","application/postscript","application/eps","application/x-xz","application/x-sqlite3","application/x-nintendo-nes-rom","application/x-google-chrome-extension","application/vnd.ms-cab-compressed","application/x-deb","application/x-unix-archive","application/x-rpm","application/x-compress","application/x-lzip","application/x-cfb","application/x-mie","application/mxf","video/mp2t","application/x-blender","image/bpg","image/jp2","image/jpx","image/jpm","image/mj2","audio/aiff","application/xml","application/x-mobipocket-ebook","image/heif","image/heif-sequence","image/heic","image/heic-sequence","image/icns","image/ktx","application/dicom","audio/x-musepack","text/calendar","text/vcard","model/gltf-binary","application/vnd.tcpdump.pcap","audio/x-dsf","application/x.ms.shortcut","application/x.apple.alias","audio/x-voc","audio/vnd.dolby.dd-raw","audio/x-m4a","image/apng","image/x-olympus-orf","image/x-sony-arw","image/x-adobe-dng","image/x-nikon-nef","image/x-panasonic-rw2","image/x-fujifilm-raf","video/x-m4v","video/3gpp2","application/x-esri-shape","audio/aac","audio/x-it","audio/x-s3m","audio/x-xm","video/MP1S","video/MP2P","application/vnd.sketchup.skp","image/avif","application/x-lzh-compressed","application/pgp-encrypted","application/x-asar","model/stl","application/vnd.ms-htmlhelp","model/3mf","image/jxl","application/zstd","image/jls","application/vnd.ms-outlook","image/vnd.dwg","application/x-parquet"];const L=4100;async function fileTypeFromStream(e){const t=await fromStream(e);try{return await fileTypeFromTokenizer(t)}finally{await t.close()}}async function fileTypeFromBuffer(e){if(!(e instanceof Uint8Array||e instanceof ArrayBuffer)){throw new TypeError(`Expected the \`input\` argument to be of type \`Uint8Array\` or \`Buffer\` or \`ArrayBuffer\`, got \`${typeof e}\``)}const t=e instanceof Uint8Array?e:new Uint8Array(e);if(!(t?.length>1)){return}return fileTypeFromTokenizer(fromBuffer(t))}function _check(e,t,i){i={offset:0,...i};for(const[r,n]of t.entries()){if(i.mask){if(n!==(i.mask[r]&e[r+i.offset])){return false}}else if(n!==e[r+i.offset]){return false}}return true}async function fileTypeFromTokenizer(e){try{return(new FileTypeParser).parse(e)}catch(e){if(!(e instanceof EndOfStreamError)){throw e}}}class FileTypeParser{check(e,t){return _check(this.buffer,e,t)}checkString(e,t){return this.check(stringToBytes(e),t)}async parse(e){this.buffer=s.Buffer.alloc(L);if(e.fileInfo.size===undefined){e.fileInfo.size=Number.MAX_SAFE_INTEGER}this.tokenizer=e;await e.peekBuffer(this.buffer,{length:12,mayBeLess:true});if(this.check([66,77])){return{ext:"bmp",mime:"image/bmp"}}if(this.check([11,119])){return{ext:"ac3",mime:"audio/vnd.dolby.dd-raw"}}if(this.check([120,1])){return{ext:"dmg",mime:"application/x-apple-diskimage"}}if(this.check([77,90])){return{ext:"exe",mime:"application/x-msdownload"}}if(this.check([37,33])){await e.peekBuffer(this.buffer,{length:24,mayBeLess:true});if(this.checkString("PS-Adobe-",{offset:2})&&this.checkString(" EPSF-",{offset:14})){return{ext:"eps",mime:"application/eps"}}return{ext:"ps",mime:"application/postscript"}}if(this.check([31,160])||this.check([31,157])){return{ext:"Z",mime:"application/x-compress"}}if(this.check([239,187,191])){this.tokenizer.ignore(3);return this.parse(e)}if(this.check([71,73,70])){return{ext:"gif",mime:"image/gif"}}if(this.check([73,73,188])){return{ext:"jxr",mime:"image/vnd.ms-photo"}}if(this.check([31,139,8])){return{ext:"gz",mime:"application/gzip"}}if(this.check([66,90,104])){return{ext:"bz2",mime:"application/x-bzip2"}}if(this.checkString("ID3")){await e.ignore(6);const t=await e.readToken(q);if(e.position+t>e.fileInfo.size){return{ext:"mp3",mime:"audio/mpeg"}}await e.ignore(t);return fileTypeFromTokenizer(e)}if(this.checkString("MP+")){return{ext:"mpc",mime:"audio/x-musepack"}}if((this.buffer[0]===67||this.buffer[0]===70)&&this.check([87,83],{offset:1})){return{ext:"swf",mime:"application/x-shockwave-flash"}}if(this.check([255,216,255])){if(this.check([247],{offset:3})){return{ext:"jls",mime:"image/jls"}}return{ext:"jpg",mime:"image/jpeg"}}if(this.checkString("FLIF")){return{ext:"flif",mime:"image/flif"}}if(this.checkString("8BPS")){return{ext:"psd",mime:"image/vnd.adobe.photoshop"}}if(this.checkString("WEBP",{offset:8})){return{ext:"webp",mime:"image/webp"}}if(this.checkString("MPCK")){return{ext:"mpc",mime:"audio/x-musepack"}}if(this.checkString("FORM")){return{ext:"aif",mime:"audio/aiff"}}if(this.checkString("icns",{offset:0})){return{ext:"icns",mime:"image/icns"}}if(this.check([80,75,3,4])){try{while(e.position+30<e.fileInfo.size){await e.readBuffer(this.buffer,{length:30});const t={compressedSize:this.buffer.readUInt32LE(18),uncompressedSize:this.buffer.readUInt32LE(22),filenameLength:this.buffer.readUInt16LE(26),extraFieldLength:this.buffer.readUInt16LE(28)};t.filename=await e.readToken(new StringType(t.filenameLength,"utf-8"));await e.ignore(t.extraFieldLength);if(t.filename==="META-INF/mozilla.rsa"){return{ext:"xpi",mime:"application/x-xpinstall"}}if(t.filename.endsWith(".rels")||t.filename.endsWith(".xml")){const e=t.filename.split("/")[0];switch(e){case"_rels":break;case"word":return{ext:"docx",mime:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"};case"ppt":return{ext:"pptx",mime:"application/vnd.openxmlformats-officedocument.presentationml.presentation"};case"xl":return{ext:"xlsx",mime:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"};default:break}}if(t.filename.startsWith("xl/")){return{ext:"xlsx",mime:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}}if(t.filename.startsWith("3D/")&&t.filename.endsWith(".model")){return{ext:"3mf",mime:"model/3mf"}}if(t.filename==="mimetype"&&t.compressedSize===t.uncompressedSize){let i=await e.readToken(new StringType(t.compressedSize,"utf-8"));i=i.trim();switch(i){case"application/epub+zip":return{ext:"epub",mime:"application/epub+zip"};case"application/vnd.oasis.opendocument.text":return{ext:"odt",mime:"application/vnd.oasis.opendocument.text"};case"application/vnd.oasis.opendocument.spreadsheet":return{ext:"ods",mime:"application/vnd.oasis.opendocument.spreadsheet"};case"application/vnd.oasis.opendocument.presentation":return{ext:"odp",mime:"application/vnd.oasis.opendocument.presentation"};default:}}if(t.compressedSize===0){let t=-1;while(t<0&&e.position<e.fileInfo.size){await e.peekBuffer(this.buffer,{mayBeLess:true});t=this.buffer.indexOf("504B0304",0,"hex");await e.ignore(t>=0?t:this.buffer.length)}}else{await e.ignore(t.compressedSize)}}}catch(e){if(!(e instanceof EndOfStreamError)){throw e}}return{ext:"zip",mime:"application/zip"}}if(this.checkString("OggS")){await e.ignore(28);const t=s.Buffer.alloc(8);await e.readBuffer(t);if(_check(t,[79,112,117,115,72,101,97,100])){return{ext:"opus",mime:"audio/opus"}}if(_check(t,[128,116,104,101,111,114,97])){return{ext:"ogv",mime:"video/ogg"}}if(_check(t,[1,118,105,100,101,111,0])){return{ext:"ogm",mime:"video/ogg"}}if(_check(t,[127,70,76,65,67])){return{ext:"oga",mime:"audio/ogg"}}if(_check(t,[83,112,101,101,120,32,32])){return{ext:"spx",mime:"audio/ogg"}}if(_check(t,[1,118,111,114,98,105,115])){return{ext:"ogg",mime:"audio/ogg"}}return{ext:"ogx",mime:"application/ogg"}}if(this.check([80,75])&&(this.buffer[2]===3||this.buffer[2]===5||this.buffer[2]===7)&&(this.buffer[3]===4||this.buffer[3]===6||this.buffer[3]===8)){return{ext:"zip",mime:"application/zip"}}if(this.checkString("ftyp",{offset:4})&&(this.buffer[8]&96)!==0){const e=this.buffer.toString("binary",8,12).replace("\0"," ").trim();switch(e){case"avif":case"avis":return{ext:"avif",mime:"image/avif"};case"mif1":return{ext:"heic",mime:"image/heif"};case"msf1":return{ext:"heic",mime:"image/heif-sequence"};case"heic":case"heix":return{ext:"heic",mime:"image/heic"};case"hevc":case"hevx":return{ext:"heic",mime:"image/heic-sequence"};case"qt":return{ext:"mov",mime:"video/quicktime"};case"M4V":case"M4VH":case"M4VP":return{ext:"m4v",mime:"video/x-m4v"};case"M4P":return{ext:"m4p",mime:"video/mp4"};case"M4B":return{ext:"m4b",mime:"audio/mp4"};case"M4A":return{ext:"m4a",mime:"audio/x-m4a"};case"F4V":return{ext:"f4v",mime:"video/mp4"};case"F4P":return{ext:"f4p",mime:"video/mp4"};case"F4A":return{ext:"f4a",mime:"audio/mp4"};case"F4B":return{ext:"f4b",mime:"audio/mp4"};case"crx":return{ext:"cr3",mime:"image/x-canon-cr3"};default:if(e.startsWith("3g")){if(e.startsWith("3g2")){return{ext:"3g2",mime:"video/3gpp2"}}return{ext:"3gp",mime:"video/3gpp"}}return{ext:"mp4",mime:"video/mp4"}}}if(this.checkString("MThd")){return{ext:"mid",mime:"audio/midi"}}if(this.checkString("wOFF")&&(this.check([0,1,0,0],{offset:4})||this.checkString("OTTO",{offset:4}))){return{ext:"woff",mime:"font/woff"}}if(this.checkString("wOF2")&&(this.check([0,1,0,0],{offset:4})||this.checkString("OTTO",{offset:4}))){return{ext:"woff2",mime:"font/woff2"}}if(this.check([212,195,178,161])||this.check([161,178,195,212])){return{ext:"pcap",mime:"application/vnd.tcpdump.pcap"}}if(this.checkString("DSD ")){return{ext:"dsf",mime:"audio/x-dsf"}}if(this.checkString("LZIP")){return{ext:"lz",mime:"application/x-lzip"}}if(this.checkString("fLaC")){return{ext:"flac",mime:"audio/x-flac"}}if(this.check([66,80,71,251])){return{ext:"bpg",mime:"image/bpg"}}if(this.checkString("wvpk")){return{ext:"wv",mime:"audio/wavpack"}}if(this.checkString("%PDF")){try{await e.ignore(1350);const t=10*1024*1024;const i=s.Buffer.alloc(Math.min(t,e.fileInfo.size));await e.readBuffer(i,{mayBeLess:true});if(i.includes(s.Buffer.from("AIPrivateData"))){return{ext:"ai",mime:"application/postscript"}}}catch(e){if(!(e instanceof EndOfStreamError)){throw e}}return{ext:"pdf",mime:"application/pdf"}}if(this.check([0,97,115,109])){return{ext:"wasm",mime:"application/wasm"}}if(this.check([73,73])){const e=await this.readTiffHeader(false);if(e){return e}}if(this.check([77,77])){const e=await this.readTiffHeader(true);if(e){return e}}if(this.checkString("MAC ")){return{ext:"ape",mime:"audio/ape"}}if(this.check([26,69,223,163])){async function readField(){const t=await e.peekNumber(f);let i=128;let r=0;while((t&i)===0&&i!==0){++r;i>>=1}const n=s.Buffer.alloc(r+1);await e.readBuffer(n);return n}async function readElement(){const e=await readField();const t=await readField();t[0]^=128>>t.length-1;const i=Math.min(6,t.length);return{id:e.readUIntBE(0,e.length),len:t.readUIntBE(t.length-i,i)}}async function readChildren(t){while(t>0){const i=await readElement();if(i.id===17026){const t=await e.readToken(new StringType(i.len,"utf-8"));return t.replace(/\00.*$/g,"")}await e.ignore(i.len);--t}}const t=await readElement();const i=await readChildren(t.len);switch(i){case"webm":return{ext:"webm",mime:"video/webm"};case"matroska":return{ext:"mkv",mime:"video/x-matroska"};default:return}}if(this.check([82,73,70,70])){if(this.check([65,86,73],{offset:8})){return{ext:"avi",mime:"video/vnd.avi"}}if(this.check([87,65,86,69],{offset:8})){return{ext:"wav",mime:"audio/vnd.wave"}}if(this.check([81,76,67,77],{offset:8})){return{ext:"qcp",mime:"audio/qcelp"}}}if(this.checkString("SQLi")){return{ext:"sqlite",mime:"application/x-sqlite3"}}if(this.check([78,69,83,26])){return{ext:"nes",mime:"application/x-nintendo-nes-rom"}}if(this.checkString("Cr24")){return{ext:"crx",mime:"application/x-google-chrome-extension"}}if(this.checkString("MSCF")||this.checkString("ISc(")){return{ext:"cab",mime:"application/vnd.ms-cab-compressed"}}if(this.check([237,171,238,219])){return{ext:"rpm",mime:"application/x-rpm"}}if(this.check([197,208,211,198])){return{ext:"eps",mime:"application/eps"}}if(this.check([40,181,47,253])){return{ext:"zst",mime:"application/zstd"}}if(this.check([127,69,76,70])){return{ext:"elf",mime:"application/x-elf"}}if(this.check([33,66,68,78])){return{ext:"pst",mime:"application/vnd.ms-outlook"}}if(this.checkString("PAR1")){return{ext:"parquet",mime:"application/x-parquet"}}if(this.check([79,84,84,79,0])){return{ext:"otf",mime:"font/otf"}}if(this.checkString("#!AMR")){return{ext:"amr",mime:"audio/amr"}}if(this.checkString("{\\rtf")){return{ext:"rtf",mime:"application/rtf"}}if(this.check([70,76,86,1])){return{ext:"flv",mime:"video/x-flv"}}if(this.checkString("IMPM")){return{ext:"it",mime:"audio/x-it"}}if(this.checkString("-lh0-",{offset:2})||this.checkString("-lh1-",{offset:2})||this.checkString("-lh2-",{offset:2})||this.checkString("-lh3-",{offset:2})||this.checkString("-lh4-",{offset:2})||this.checkString("-lh5-",{offset:2})||this.checkString("-lh6-",{offset:2})||this.checkString("-lh7-",{offset:2})||this.checkString("-lzs-",{offset:2})||this.checkString("-lz4-",{offset:2})||this.checkString("-lz5-",{offset:2})||this.checkString("-lhd-",{offset:2})){return{ext:"lzh",mime:"application/x-lzh-compressed"}}if(this.check([0,0,1,186])){if(this.check([33],{offset:4,mask:[241]})){return{ext:"mpg",mime:"video/MP1S"}}if(this.check([68],{offset:4,mask:[196]})){return{ext:"mpg",mime:"video/MP2P"}}}if(this.checkString("ITSF")){return{ext:"chm",mime:"application/vnd.ms-htmlhelp"}}if(this.check([253,55,122,88,90,0])){return{ext:"xz",mime:"application/x-xz"}}if(this.checkString("<?xml ")){return{ext:"xml",mime:"application/xml"}}if(this.check([55,122,188,175,39,28])){return{ext:"7z",mime:"application/x-7z-compressed"}}if(this.check([82,97,114,33,26,7])&&(this.buffer[6]===0||this.buffer[6]===1)){return{ext:"rar",mime:"application/x-rar-compressed"}}if(this.checkString("solid ")){return{ext:"stl",mime:"model/stl"}}if(this.checkString("AC")){const e=this.buffer.toString("binary",2,6);if(e.match("^d*")&&e>=1e3&&e<=1050){return{ext:"dwg",mime:"image/vnd.dwg"}}}if(this.checkString("BLENDER")){return{ext:"blend",mime:"application/x-blender"}}if(this.checkString("!<arch>")){await e.ignore(8);const t=await e.readToken(new StringType(13,"ascii"));if(t==="debian-binary"){return{ext:"deb",mime:"application/x-deb"}}return{ext:"ar",mime:"application/x-unix-archive"}}if(this.check([137,80,78,71,13,10,26,10])){await e.ignore(8);async function readChunkHeader(){return{length:await e.readToken(y),type:await e.readToken(new StringType(4,"binary"))}}do{const t=await readChunkHeader();if(t.length<0){return}switch(t.type){case"IDAT":return{ext:"png",mime:"image/png"};case"acTL":return{ext:"apng",mime:"image/apng"};default:await e.ignore(t.length+4)}}while(e.position+8<e.fileInfo.size);return{ext:"png",mime:"image/png"}}if(this.check([65,82,82,79,87,49,0,0])){return{ext:"arrow",mime:"application/x-apache-arrow"}}if(this.check([103,108,84,70,2,0,0,0])){return{ext:"glb",mime:"model/gltf-binary"}}if(this.check([102,114,101,101],{offset:4})||this.check([109,100,97,116],{offset:4})||this.check([109,111,111,118],{offset:4})||this.check([119,105,100,101],{offset:4})){return{ext:"mov",mime:"video/quicktime"}}if(this.check([73,73,82,79,8,0,0,0,24])){return{ext:"orf",mime:"image/x-olympus-orf"}}if(this.checkString("gimp xcf ")){return{ext:"xcf",mime:"image/x-xcf"}}if(this.check([73,73,85,0,24,0,0,0,136,231,116,216])){return{ext:"rw2",mime:"image/x-panasonic-rw2"}}if(this.check([48,38,178,117,142,102,207,17,166,217])){async function readHeader(){const t=s.Buffer.alloc(16);await e.readBuffer(t);return{id:t,size:Number(await e.readToken(S))}}await e.ignore(30);while(e.position+24<e.fileInfo.size){const t=await readHeader();let i=t.size-24;if(_check(t.id,[145,7,220,183,183,169,207,17,142,230,0,192,12,32,83,101])){const t=s.Buffer.alloc(16);i-=await e.readBuffer(t);if(_check(t,[64,158,105,248,77,91,207,17,168,253,0,128,95,92,68,43])){return{ext:"asf",mime:"audio/x-ms-asf"}}if(_check(t,[192,239,25,188,77,91,207,17,168,253,0,128,95,92,68,43])){return{ext:"asf",mime:"video/x-ms-asf"}}break}await e.ignore(i)}return{ext:"asf",mime:"application/vnd.ms-asf"}}if(this.check([171,75,84,88,32,49,49,187,13,10,26,10])){return{ext:"ktx",mime:"image/ktx"}}if((this.check([126,16,4])||this.check([126,24,4]))&&this.check([48,77,73,69],{offset:4})){return{ext:"mie",mime:"application/x-mie"}}if(this.check([39,10,0,0,0,0,0,0,0,0,0,0],{offset:2})){return{ext:"shp",mime:"application/x-esri-shape"}}if(this.check([0,0,0,12,106,80,32,32,13,10,135,10])){await e.ignore(20);const t=await e.readToken(new StringType(4,"ascii"));switch(t){case"jp2 ":return{ext:"jp2",mime:"image/jp2"};case"jpx ":return{ext:"jpx",mime:"image/jpx"};case"jpm ":return{ext:"jpm",mime:"image/jpm"};case"mjp2":return{ext:"mj2",mime:"image/mj2"};default:return}}if(this.check([255,10])||this.check([0,0,0,12,74,88,76,32,13,10,135,10])){return{ext:"jxl",mime:"image/jxl"}}if(this.check([254,255])){if(this.check([0,60,0,63,0,120,0,109,0,108],{offset:2})){return{ext:"xml",mime:"application/xml"}}return undefined}if(this.check([0,0,1,186])||this.check([0,0,1,179])){return{ext:"mpg",mime:"video/mpeg"}}if(this.check([0,1,0,0,0])){return{ext:"ttf",mime:"font/ttf"}}if(this.check([0,0,1,0])){return{ext:"ico",mime:"image/x-icon"}}if(this.check([0,0,2,0])){return{ext:"cur",mime:"image/x-icon"}}if(this.check([208,207,17,224,161,177,26,225])){return{ext:"cfb",mime:"application/x-cfb"}}await e.peekBuffer(this.buffer,{length:Math.min(256,e.fileInfo.size),mayBeLess:true});if(this.checkString("BEGIN:")){if(this.checkString("VCARD",{offset:6})){return{ext:"vcf",mime:"text/vcard"}}if(this.checkString("VCALENDAR",{offset:6})){return{ext:"ics",mime:"text/calendar"}}}if(this.checkString("FUJIFILMCCD-RAW")){return{ext:"raf",mime:"image/x-fujifilm-raf"}}if(this.checkString("Extended Module:")){return{ext:"xm",mime:"audio/x-xm"}}if(this.checkString("Creative Voice File")){return{ext:"voc",mime:"audio/x-voc"}}if(this.check([4,0,0,0])&&this.buffer.length>=16){const e=this.buffer.readUInt32LE(12);if(e>12&&this.buffer.length>=e+16){try{const t=this.buffer.slice(16,e+16).toString();const i=JSON.parse(t);if(i.files){return{ext:"asar",mime:"application/x-asar"}}}catch{}}}if(this.check([6,14,43,52,2,5,1,1,13,1,2,1,1,2])){return{ext:"mxf",mime:"application/mxf"}}if(this.checkString("SCRM",{offset:44})){return{ext:"s3m",mime:"audio/x-s3m"}}if(this.check([71])&&this.check([71],{offset:188})){return{ext:"mts",mime:"video/mp2t"}}if(this.check([71],{offset:4})&&this.check([71],{offset:196})){return{ext:"mts",mime:"video/mp2t"}}if(this.check([66,79,79,75,77,79,66,73],{offset:60})){return{ext:"mobi",mime:"application/x-mobipocket-ebook"}}if(this.check([68,73,67,77],{offset:128})){return{ext:"dcm",mime:"application/dicom"}}if(this.check([76,0,0,0,1,20,2,0,0,0,0,0,192,0,0,0,0,0,0,70])){return{ext:"lnk",mime:"application/x.ms.shortcut"}}if(this.check([98,111,111,107,0,0,0,0,109,97,114,107,0,0,0,0])){return{ext:"alias",mime:"application/x.apple.alias"}}if(this.check([76,80],{offset:34})&&(this.check([0,0,1],{offset:8})||this.check([1,0,2],{offset:8})||this.check([2,0,2],{offset:8}))){return{ext:"eot",mime:"application/vnd.ms-fontobject"}}if(this.check([6,6,237,245,216,29,70,229,189,49,239,231,254,116,183,29])){return{ext:"indd",mime:"application/x-indesign"}}await e.peekBuffer(this.buffer,{length:Math.min(512,e.fileInfo.size),mayBeLess:true});if(tarHeaderChecksumMatches(this.buffer)){return{ext:"tar",mime:"application/x-tar"}}if(this.check([255,254])){if(this.check([60,0,63,0,120,0,109,0,108,0],{offset:2})){return{ext:"xml",mime:"application/xml"}}if(this.check([255,14,83,0,107,0,101,0,116,0,99,0,104,0,85,0,112,0,32,0,77,0,111,0,100,0,101,0,108,0],{offset:2})){return{ext:"skp",mime:"application/vnd.sketchup.skp"}}return undefined}if(this.checkString("-----BEGIN PGP MESSAGE-----")){return{ext:"pgp",mime:"application/pgp-encrypted"}}if(this.buffer.length>=2&&this.check([255,224],{offset:0,mask:[255,224]})){if(this.check([16],{offset:1,mask:[22]})){if(this.check([8],{offset:1,mask:[8]})){return{ext:"aac",mime:"audio/aac"}}return{ext:"aac",mime:"audio/aac"}}if(this.check([2],{offset:1,mask:[6]})){return{ext:"mp3",mime:"audio/mpeg"}}if(this.check([4],{offset:1,mask:[6]})){return{ext:"mp2",mime:"audio/mpeg"}}if(this.check([6],{offset:1,mask:[6]})){return{ext:"mp1",mime:"audio/mpeg"}}}}async readTiffTag(e){const t=await this.tokenizer.readToken(e?p:m);this.tokenizer.ignore(10);switch(t){case 50341:return{ext:"arw",mime:"image/x-sony-arw"};case 50706:return{ext:"dng",mime:"image/x-adobe-dng"};default:}}async readTiffIFD(e){const t=await this.tokenizer.readToken(e?p:m);for(let i=0;i<t;++i){const t=await this.readTiffTag(e);if(t){return t}}}async readTiffHeader(e){const t=(e?p:m).get(this.buffer,2);const i=(e?d:l).get(this.buffer,4);if(t===42){if(i>=6){if(this.checkString("CR",{offset:8})){return{ext:"cr2",mime:"image/x-canon-cr2"}}if(i>=8&&(this.check([28,0,254,0],{offset:8})||this.check([31,0,11,0],{offset:8}))){return{ext:"nef",mime:"image/x-nikon-nef"}}}await this.tokenizer.ignore(i);const t=await this.readTiffIFD(e);return t??{ext:"tif",mime:"image/tiff"}}if(t===43){return{ext:"tif",mime:"image/tiff"}}}}async function fileTypeStream(e,{sampleSize:t=L}={}){const{default:i}=await Promise.resolve().then(__nccwpck_require__.t.bind(__nccwpck_require__,492,19));return new Promise(((r,n)=>{e.on("error",n);e.once("readable",(()=>{(async()=>{try{const a=new i.PassThrough;const o=i.pipeline?i.pipeline(e,a,(()=>{})):e.pipe(a);const c=e.read(t)??e.read()??s.Buffer.alloc(0);try{const e=await fileTypeFromBuffer(c);a.fileType=e}catch(e){if(e instanceof EndOfStreamError){a.fileType=undefined}else{n(e)}}r(o)}catch(e){n(e)}})()}))}))}const R=new Set(A);const C=new Set(U);async function fileTypeFromFile(e){const t=await fromFile(e);try{return await fileTypeFromTokenizer(t)}finally{await t.close()}}})();module.exports=i})();