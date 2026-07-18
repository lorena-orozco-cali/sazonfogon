const baileys = require('@whiskeysockets/baileys');
const makeWASocket = baileys.default;
const { useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = baileys;
const qrcode = require('qrcode');
const express = require('express');
const pino = require('pino');

let qrImageData = null;
let botConectado = false;
let sock = null;
const sesiones = {};

const MENUS = {
  1:{nombre:'Lunes',sopas:['Sancocho de Res','Sopa de pollo'],principio:['Frijoles','Lentejas','Espaguetis con atún','Papa francesa'],carnes:['Carne sudada','Chuleta de pollo','Chuleta de cerdo','Pollo salsa bechamel','Lomo de cerdo a la plancha'],ensalada:'Batavia, tomate, zanahoria, pepino y vinagreta',almuerzo:16500,bandeja:15000,especial:22500},
  2:{nombre:'Martes',sopas:['Sancocho de pollo','Sopa de pastas'],principio:['Frijoles','Arvejas','Puré de papa','Papa francesa'],carnes:['Carne goulash','Albóndigas salsa chimichurri','Pechuga a la plancha','Chuleta de cerdo','Chuleta de pollo'],ensalada:'Tomate, cebolla y limón',almuerzo:16500,bandeja:15000,especial:22500},
  3:{nombre:'Miércoles',sopas:['Sancocho de plátano frito','Sopa campesina'],principio:['Frijol','Lentejas','Macarrones en salsa de queso','Papa francesa'],carnes:['Chicharrón','Carne molida','Cerdo al ajillo','Chuleta de pollo','Chuleta de cerdo'],ensalada:'Ensalada roja',almuerzo:16500,bandeja:15000,especial:22500},
  4:{nombre:'Jueves',sopas:['Caldo de costilla','Sancocho de espinazo'],principio:['Frijoles','Blanquillos','Verduras salteadas','Papa a la francesa'],carnes:['Pollo salsa maracuyá','Carne desmechada','Pechuga a la plancha','Chuleta de pollo','Chuleta de cerdo'],ensalada:'Batavia, tomate, zanahoria, pepino y vinagreta',almuerzo:16500,bandeja:15000,especial:25500},
  5:{nombre:'Viernes',sopas:['Sancocho de res','Sopa de mondongo'],principio:['Frijoles','Blanquillos','Papa salsa de ajo','Papa francesa'],carnes:['Pollo sudado','Hígado encebollado','Carne asada','Chuleta de pollo','Chuleta de cerdo'],ensalada:'Repollo, lechuga crespa, zanahoria y vinagreta',almuerzo:16500,bandeja:15000,especial:22500},
  6:{nombre:'Sábado',sopas:['Sancocho trifásico','Sancocho de pescado'],principio:['Frijoles','Arvejas','Tostadas con hogado','Papa francesa'],carnes:['Sobrebarriga a la criolla','Costilla BBQ','Pechuga a la plancha','Chuleta de pescado','Chuleta de pollo','Chuleta de cerdo'],ensalada:'Ensalada dulce',almuerzo:16500,bandeja:15000,especial:22500}
};

const FAQ={
  'precio':'💰 Almuerzo completo *$16.500* · Bandeja *$15.000* · Especial chuleta desde *$22.500*',
  'costo':'💰 Almuerzo completo *$16.500* · Bandeja *$15.000*',
  'pago':'🏦 *Bancolombia Ahorros*\nCuenta: 91200492060\nCC: 59.862.699\nJohana Fernández Bravo',
  'bancolombia':'🏦 *Bancolombia Ahorros*\nCuenta: 91200492060\nCC: 59.862.699\nJohana Fernández Bravo',
  'horario':'🕐 Atendemos de *Lunes a Sábado* en horario de almuerzo 😊',
  'direccion':'📍 *Cra. 22 No. 3-81*, B/ Los Libertadores, Tras el Club Noel, Cali.',
  'domicilio':'🛵 ¡Sí manejamos domicilio! Te pregunto la dirección durante el pedido.',
  'jugo':'🥤 Jugo Natural *$5.000* · Jugo del Valle *$2.500* · Frutal *$3.500*',
  'gaseosa':'🥤 Gaseosa / Coca-Cola *$3.500*',
};

const app = express();
const PORT = process.env.PORT || 8080;
app.get('/',(req,res)=>{
  if(botConectado){res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#111;color:#fff;text-align:center}</style></head><body><div><div style="font-size:80px">✅</div><h1 style="color:#25D366">Bot Fogón Sazón Conectado</h1><p style="color:#8696a0">Activo en WhatsApp 🍲</p></div></body></html>`);}
  else if(qrImageData){res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="refresh" content="20"><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#111;color:#fff;text-align:center}img{border-radius:16px;padding:20px;background:#fff;margin-top:20px}</style></head><body><div><h1 style="color:#25D366">🍲 Fogón Sazón</h1><p>Escanea con el WhatsApp del restaurante</p><br><img src="${qrImageData}" width="300"><br><p style="margin-top:16px;color:#8696a0;font-size:13px">⚠️ 60 segundos para escanear</p></div></body></html>`);}
  else{res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="refresh" content="3"><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#111;color:#fff;text-align:center}</style></head><body><div><h1>🍲 Fogón Sazón</h1><p style="color:#8696a0">Generando QR... ⏳</p></div></body></html>`);}
});
app.listen(PORT,()=>console.log('Puerto',PORT));

function getMenu(){return MENUS[new Date().getDay()]||null;}

function menuTexto(m){
  return `☀️ *Menú del ${m.nombre}*\n\n🫕 *Sopas:* ${m.sopas.join(' · ')}\n🥘 *Principio:* ${m.principio.join(' · ')}\n🍗 *Carnes:* ${m.carnes.join(' · ')}\n🥗 *Ensalada:* ${m.ensalada}\n\n💰 Almuerzo: *$${m.almuerzo.toLocaleString('es-CO')}*\n💰 Bandeja: *$${m.bandeja.toLocaleString('es-CO')}*\n💰 Especial chuleta: *$${m.especial.toLocaleString('es-CO')}*`;
}

function generarComanda(s){
  const m=getMenu();
  const precio=s.tipo==='almuerzo'?m.almuerzo:s.tipo==='bandeja'?m.bandeja:m.especial;
  const fecha=new Date().toLocaleDateString('es-CO',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  const hora=new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'});
  let txt=`🧾 *COMANDA — FOGÓN SAZÓN*\n📅 ${fecha}\n👤 Cliente: ${s.nombre}\n`;
  txt+=`🍽️ ${s.tipo==='almuerzo'?'Almuerzo completo':s.tipo==='bandeja'?'Bandeja':'Especial chuleta'}\n`;
  txt+=`🫕 Sopa: ${s.sopa}\n🥩 Carne: ${s.carne}\n`;
  if(s.bebida)txt+=`🥤 ${s.bebida}\n`;
  if(s.dir)txt+=`📍 ${s.dir}\n📱 ${s.tel}\n`;
  else txt+=`🏪 Recoger en tienda\n`;
  if(s.obs&&!['no','n','ninguna'].includes(s.obs.toLowerCase()))txt+=`📝 ${s.obs}\n`;
  txt+=`\n💰 TOTAL: $${precio.toLocaleString('es-CO')}\n⏰ ${hora}`;
  return txt;
}

async function responder(from,texto){
  if(!sock){console.log('sock no disponible');return;}
  if(!sesiones[from])sesiones[from]={paso:'inicio'};
  const s=sesiones[from];
  const menu=getMenu();
  const t=texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const delay=ms=>new Promise(r=>setTimeout(r,ms));
  const send=async(txt)=>{await delay(1500);
    await sock.sendMessage(from,{text:txt});
    console.log(`ENVIADO: ${txt.substring(0,60)}`);
  };

  for(const k in FAQ){if(t.includes(k)){await send(FAQ[k]);if(s.paso&&s.paso!=='inicio'&&s.paso!=='fin')await send('¿Continuamos? 😊');return;}}
  if(s.paso==='inicio'){s.paso='nombre';if(!menu){await send('☀️ ¡Hola! Soy el asistente de *Fogón Sazón* 🍲\n\nHoy es domingo y descansamos 😴\n¡Te esperamos el lunes!');return;}await send('☀️ ¡Hola! Bienvenido a *Fogón Sazón* 🍲\nRestaurante y Cenadero · Cali 🇨🇴\n\n¿Cómo te llamas? 😊');return;}
  if(s.paso==='nombre'){s.nombre=texto.trim().split(' ')[0];s.paso='tipo';await send(`¡Qué gusto *${s.nombre}*! 😄\n\n${menuTexto(menu)}`);await send(`¿Qué vas a pedir?\n\n1️⃣ Almuerzo completo — $${menu.almuerzo.toLocaleString('es-CO')}\n2️⃣ Bandeja — $${menu.bandeja.toLocaleString('es-CO')}\n3️⃣ Especial chuleta — $${menu.especial.toLocaleString('es-CO')}`);return;}
  if(s.paso==='tipo'){if(t==='1'||t.includes('almuerzo'))s.tipo='almuerzo';else if(t==='2'||t.includes('bandeja'))s.tipo='bandeja';else if(t==='3'||t.includes('especial')||t.includes('chuleta'))s.tipo='especial';else{await send('Responde *1*, *2* o *3* 😊');return;}s.paso='sopa';await send(`¿Cuál sopa? 🫕\n\n${menu.sopas.map((x,i)=>`${i+1}️⃣ ${x}`).join('\n')}`);return;}
  if(s.paso==='sopa'){const idx=parseInt(t)-1;if(idx>=0&&idx<menu.sopas.length)s.sopa=menu.sopas[idx];else{await send(`Responde con el número:\n${menu.sopas.map((x,i)=>`${i+1}️⃣ ${x}`).join('\n')}`);return;}s.paso='carne';await send(`¡Rica! 😋 ¿Cuál carne? 🍗\n\n${menu.carnes.map((x,i)=>`${i+1}️⃣ ${x}`).join('\n')}`);return;}
  if(s.paso==='carne'){const idx=parseInt(t)-1;if(idx>=0&&idx<menu.carnes.length)s.carne=menu.carnes[idx];else{await send(`Responde con el número:\n${menu.carnes.map((x,i)=>`${i+1}️⃣ ${x}`).join('\n')}`);return;}s.paso='bebida';await send(`¿Qué tomas? 🥤\n\n1️⃣ Jugo Natural — $5.000\n2️⃣ Jugo del Valle — $2.500\n3️⃣ Frutal del Valle — $3.500\n4️⃣ Gaseosa — $3.500\n5️⃣ Sin bebida`);return;}
  if(s.paso==='bebida'){const bebs=['Jugo Natural $5.000','Jugo del Valle $2.500','Frutal del Valle $3.500','Gaseosa $3.500',''];const idx=parseInt(t)-1;if(idx>=0&&idx<bebs.length)s.bebida=bebs[idx];else{await send('Responde del 1 al 5 😊');return;}s.paso='entrega';await send('¿Cómo lo recibes?\n\n1️⃣ Domicilio\n2️⃣ Recoger en el restaurante');return;}
  if(s.paso==='entrega'){if(t==='1'||t.includes('domicilio')){s.entrega='domicilio';s.paso='dir';await send('¿Cuál es tu dirección? 📍');}else if(t==='2'||t.includes('recoger')){s.entrega='tienda';s.paso='obs';await send('¿Alguna observación? 📝 Si no, escribe *No*');}else{await send('Responde *1* o *2* 😊');}return;}
  if(s.paso==='dir'){s.dir=texto.trim();s.paso='tel';await send('¿Tu teléfono? 📱');return;}
  if(s.paso==='tel'){s.tel=texto.trim();s.paso='obs';await send('¿Alguna observación? 📝 Si no, escribe *No*');return;}
  if(s.paso==='obs'){s.obs=texto.trim();s.paso='conf';await send(generarComanda(s));await send('¿Confirmamos? ✅\n\n1️⃣ Sí\n2️⃣ Modificar');return;}
  if(s.paso==='conf'){
    if(t==='1'||t.includes('si')||t.includes('confirm')){
      await send(`🎉 *¡Pedido confirmado, ${s.nombre}!* 🔥`);
      if(s.entrega==='domicilio')await send(`Te llevamos a *${s.dir}* 🛵 En 30-45 min.`);
      else await send('Listo para recoger en *Cra. 22 No. 3-81* 📍');
      await send('¡Gracias por elegir *Fogón Sazón*! 🍲💛');
      delete sesiones[from];
    }else{s.paso='tipo';await send('¿Qué cambias?\n\n1️⃣ Almuerzo\n2️⃣ Bandeja\n3️⃣ Especial chuleta');}
    return;
  }
}

async function conectar(){
  const {state,saveCreds}=await useMultiFileAuthState('auth_info');
  const {version}=await fetchLatestBaileysVersion();
  console.log('Usando Baileys versión WA:',version);
  sock=makeWASocket({
    version,
    auth:state,
    logger:pino({level:'silent'}),
    printQRInTerminal:false,
    browser:Browsers.baileys('Desktop'),
    getMessage:async()=>undefined,
    syncFullHistory:false,
  });
  sock.ev.on('connection.update',async({connection,lastDisconnect,qr})=>{
    if(qr){qrImageData=await qrcode.toDataURL(qr);console.log('QR listo');}
    if(connection==='open'){botConectado=true;qrImageData=null;console.log('✅ Conectado!');}
    if(connection==='close'){
      botConectado=false;
      const code=lastDisconnect?.error?.output?.statusCode;
      console.log('Desconectado código:',code);
      if(code!==DisconnectReason.loggedOut){setTimeout(conectar,3000);}
    }
  });
  sock.ev.on('creds.update',saveCreds);
  sock.ev.on('messages.upsert',async(m)=>{
    for(const msg of m.messages){
      try{
        if(!msg.message)continue;
        if(msg.key.fromMe)continue;
        const from=msg.key.remoteJid;
        if(!from||from.endsWith('@g.us'))continue;
        const texto=msg.message?.conversation||msg.message?.extendedTextMessage?.text||'';
        if(!texto.trim())continue;
        console.log(`RECIBIDO de ${from}: "${texto}"`);
        await responder(from,texto);
      }catch(e){console.error('ERROR:',e.message);}
    }
  });
}

conectar().catch(console.error);
