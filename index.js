const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const MENUS = {
  1: {
    nombre:'Lunes',
    sopas:['Sancocho de Res','Sopa de pollo'],
    principio:['Frijoles','Lentejas','Espaguetis con atún','Papa francesa'],
    carnes:['Carne sudada','Chuleta de pollo','Chuleta de cerdo','Pollo salsa bechamel','Lomo de cerdo a la plancha'],
    ensalada:'Batavia, tomate, zanahoria, pepino y vinagreta',
    almuerzo:16500, bandeja:15000, especial:22500
  },
  2: {
    nombre:'Martes',
    sopas:['Sancocho de pollo','Sopa de pastas'],
    principio:['Frijoles','Arvejas','Puré de papa','Papa francesa'],
    carnes:['Carne goulash','Albóndigas salsa chimichurri','Pechuga a la plancha','Chuleta de cerdo','Chuleta de pollo'],
    ensalada:'Tomate, cebolla y limón',
    almuerzo:16500, bandeja:15000, especial:22500
  },
  3: {
    nombre:'Miércoles',
    sopas:['Sancocho de plátano frito','Sopa campesina'],
    principio:['Frijol','Lentejas','Macarrones en salsa de queso','Papa francesa'],
    carnes:['Chicharrón','Carne molida','Cerdo al ajillo','Chuleta de pollo','Chuleta de cerdo'],
    ensalada:'Ensalada roja',
    almuerzo:16500, bandeja:15000, especial:22500
  },
  4: {
    nombre:'Jueves',
    sopas:['Caldo de costilla','Sancocho de espinazo'],
    principio:['Frijoles','Blanquillos','Verduras salteadas','Papa a la francesa'],
    carnes:['Pollo salsa maracuyá','Carne desmechada','Pechuga a la plancha','Chuleta de pollo','Chuleta de cerdo'],
    ensalada:'Batavia, tomate, zanahoria, pepino y vinagreta',
    almuerzo:16500, bandeja:15000, especial:25500
  },
  5: {
    nombre:'Viernes',
    sopas:['Sancocho de res','Sopa de mondongo'],
    principio:['Frijoles','Blanquillos','Papa salsa de ajo','Papa francesa'],
    carnes:['Pollo sudado','Hígado encebollado','Carne asada','Chuleta de pollo','Chuleta de cerdo'],
    ensalada:'Repollo, lechuga crespa, zanahoria y vinagreta',
    almuerzo:16500, bandeja:15000, especial:22500
  },
  6: {
    nombre:'Sábado',
    sopas:['Sancocho trifásico','Sancocho de pescado'],
    principio:['Frijoles','Arvejas','Tostadas con hogado','Papa francesa'],
    carnes:['Sobrebarriga a la criolla','Costilla BBQ','Pechuga a la plancha','Chuleta de pescado','Chuleta de pollo','Chuleta de cerdo'],
    ensalada:'Ensalada dulce',
    almuerzo:16500, bandeja:15000, especial:22500
  }
};

const sesiones = {};

function getMenu() {
  const dia = new Date().getDay();
  return MENUS[dia] || null;
}

function menuTexto(m) {
  return `☀️ *Menú del ${m.nombre}*\n\n` +
    `🫕 *Sopas:* ${m.sopas.join(' · ')}\n` +
    `🥘 *Principio:* ${m.principio.join(' · ')}\n` +
    `🍗 *Carnes:* ${m.carnes.join(' · ')}\n` +
    `🥗 *Ensalada:* ${m.ensalada}\n\n` +
    `💰 Almuerzo: *$${m.almuerzo.toLocaleString('es-CO')}*\n` +
    `💰 Bandeja: *$${m.bandeja.toLocaleString('es-CO')}*\n` +
    `💰 Especial chuleta: *$${m.especial.toLocaleString('es-CO')}*`;
}

function generarComanda(s) {
  const m = getMenu();
  const precio = s.tipo === 'almuerzo' ? m.almuerzo : s.tipo === 'bandeja' ? m.bandeja : m.especial;
  const fecha = new Date().toLocaleDateString('es-CO', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
  const hora = new Date().toLocaleTimeString('es-CO', {hour:'2-digit', minute:'2-digit'});
  let txt = `🧾 *COMANDA — FOGÓN SAZÓN*\n`;
  txt += `📅 ${fecha}\n`;
  txt += `👤 Cliente: ${s.nombre}\n`;
  txt += `🍽️ Pedido: ${s.tipo === 'almuerzo' ? 'Almuerzo completo' : s.tipo === 'bandeja' ? 'Bandeja' : 'Especial chuleta'}\n`;
  txt += `🫕 Sopa: ${s.sopa}\n`;
  txt += `🥩 Carne: ${s.carne}\n`;
  if (s.bebida) txt += `🥤 Bebida: ${s.bebida}\n`;
  if (s.dir) {
    txt += `📍 Dirección: ${s.dir}\n`;
    txt += `📱 Teléfono: ${s.tel}\n`;
  } else {
    txt += `🏪 Modalidad: Recoger en tienda\n`;
  }
  if (s.obs && !['no','n','ninguna'].includes(s.obs.toLowerCase())) txt += `📝 Obs: ${s.obs}\n`;
  txt += `\n💰 TOTAL: $${precio.toLocaleString('es-CO')}`;
  txt += `\n⏰ Hora: ${hora}`;
  return txt;
}

async function responder(client, msg, s) {
  const chat = await msg.getChat();
  const send = (txt) => client.sendMessage(msg.from, txt);
  const menu = getMenu();
  const t = msg.body.trim().toLowerCase();

  // FAQ
  const faq = {
    'precio': '💰 Almuerzo completo *$16.500* · Bandeja *$15.000* · Especial chuleta desde *$22.500*',
    'costo': '💰 Almuerzo completo *$16.500* · Bandeja *$15.000*',
    'pago': '🏦 *Bancolombia Ahorros*\nCuenta: 91200492060\nCC: 59.862.699\nJohana Fernández Bravo',
    'bancolombia': '🏦 *Bancolombia Ahorros*\nCuenta: 91200492060\nCC: 59.862.699\nJohana Fernández Bravo',
    'transferencia': '🏦 *Bancolombia Ahorros*\nCuenta: 91200492060\nCC: 59.862.699\nJohana Fernández Bravo',
    'horario': '🕐 Atendemos de *Lunes a Sábado* en horario de almuerzo 😊',
    'direccion': '📍 *Cra. 22 No. 3-81*, B/ Los Libertadores, Tras el Club Noel, Cali.',
    'domicilio': '🛵 Sí manejamos domicilio. Te pregunto la dirección durante el pedido.',
    'jugo': '🥤 Jugo Natural *$5.000* · Jugo del Valle *$2.500* · Frutal *$3.500*',
    'bebida': '🥤 Jugo Natural *$5.000* · Jugo del Valle *$2.500* · Gaseosa *$3.500*',
  };

  for (const k in faq) {
    if (t.includes(k)) {
      await send(faq[k]);
      if (s.paso && s.paso !== 'inicio') await send('¿Continuamos con tu pedido? 😊');
      return;
    }
  }

  if (s.paso === 'inicio' || !s.paso) {
    s.paso = 'nombre';
    if (!menu) {
      await send('☀️ ¡Hola! Soy el asistente de *Fogón Sazón* 🍲\n\nHoy es domingo y estamos descansando 😴\n¡Te esperamos el lunes con todo el sazón!');
      return;
    }
    await send('☀️ ¡Hola! Bienvenido a *Fogón Sazón* 🍲\nRestaurante y Cenadero · Cali 🇨🇴\n\n¿Con quién tengo el gusto? ¿Cómo te llamas? 😊');
    return;
  }

  if (s.paso === 'nombre') {
    s.nombre = msg.body.trim().split(' ')[0];
    s.paso = 'tipo';
    await send(`¡Qué gusto *${s.nombre}*! 😄 Mira el menú de hoy:\n\n${menuTexto(menu)}`);
    await send(`¿Qué vas a pedir?\n\n1️⃣ Almuerzo completo — $${menu.almuerzo.toLocaleString('es-CO')}\n2️⃣ Bandeja — $${menu.bandeja.toLocaleString('es-CO')}\n3️⃣ Especial chuleta — $${menu.especial.toLocaleString('es-CO')}\n\nResponde con el número 👆`);
    return;
  }

  if (s.paso === 'tipo') {
    if (t === '1' || t.includes('almuerzo')) { s.tipo = 'almuerzo'; }
    else if (t === '2' || t.includes('bandeja')) { s.tipo = 'bandeja'; }
    else if (t === '3' || t.includes('especial') || t.includes('chuleta')) { s.tipo = 'especial'; }
    else { await send('Por favor responde *1*, *2* o *3* 😊'); return; }
    s.paso = 'sopa';
    await send(`¿Cuál sopa prefieres? 🫕\n\n${menu.sopas.map((s,i)=>`${i+1}️⃣ ${s}`).join('\n')}\n\nResponde con el número 👆`);
    return;
  }

  if (s.paso === 'sopa') {
    const idx = parseInt(t) - 1;
    if (idx >= 0 && idx < menu.sopas.length) { s.sopa = menu.sopas[idx]; }
    else if (menu.sopas.some(x => t.includes(x.toLowerCase()))) { s.sopa = menu.sopas.find(x => t.includes(x.toLowerCase())); }
    else { await send(`Responde con el número de la sopa:\n${menu.sopas.map((s,i)=>`${i+1}️⃣ ${s}`).join('\n')}`); return; }
    s.paso = 'carne';
    await send(`¡Rica elección! 😋 ¿Cuál carne te provoca? 🍗\n\n${menu.carnes.map((c,i)=>`${i+1}️⃣ ${c}`).join('\n')}\n\nResponde con el número 👆`);
    return;
  }

  if (s.paso === 'carne') {
    const idx = parseInt(t) - 1;
    if (idx >= 0 && idx < menu.carnes.length) { s.carne = menu.carnes[idx]; }
    else { await send(`Responde con el número de la carne:\n${menu.carnes.map((c,i)=>`${i+1}️⃣ ${c}`).join('\n')}`); return; }
    s.paso = 'bebida';
    await send(`¿Qué vas a tomar? 🥤\n\n1️⃣ Jugo Natural — $5.000\n2️⃣ Jugo del Valle — $2.500\n3️⃣ Frutal del Valle — $3.500\n4️⃣ Gaseosa / Coca-Cola — $3.500\n5️⃣ Sin bebida\n\nResponde con el número 👆`);
    return;
  }

  if (s.paso === 'bebida') {
    const bebs = ['Jugo Natural $5.000','Jugo del Valle $2.500','Frutal del Valle $3.500','Gaseosa $3.500',''];
    const idx = parseInt(t) - 1;
    if (idx >= 0 && idx < bebs.length) { s.bebida = bebs[idx]; }
    else { await send('Responde con el número de la bebida (1-5) 😊'); return; }
    s.paso = 'entrega';
    await send('¿Cómo lo prefieres recibir? 🛵\n\n1️⃣ Domicilio\n2️⃣ Recoger en el restaurante\n\nResponde con el número 👆');
    return;
  }

  if (s.paso === 'entrega') {
    if (t === '1' || t.includes('domicilio')) { s.entrega = 'domicilio'; s.paso = 'dir'; await send('¿Cuál es tu dirección de entrega? 📍'); }
    else if (t === '2' || t.includes('recoger') || t.includes('tienda')) { s.entrega = 'tienda'; s.paso = 'obs'; await send('¿Alguna observación especial? 📝\nSi no tienes escribe *No*'); }
    else { await send('Responde *1* para domicilio o *2* para recoger 😊'); }
    return;
  }

  if (s.paso === 'dir') { s.dir = msg.body.trim(); s.paso = 'tel'; await send('¿Tu número de teléfono? 📱'); return; }
  if (s.paso === 'tel') { s.tel = msg.body.trim(); s.paso = 'obs'; await send('¿Alguna observación especial? 📝\nSi no tienes escribe *No*'); return; }

  if (s.paso === 'obs') {
    s.obs = msg.body.trim();
    s.paso = 'conf';
    await send(generarComanda(s));
    await send('¿Confirmamos tu pedido? ✅\n\n1️⃣ Sí, confirmar\n2️⃣ Modificar algo');
    return;
  }

  if (s.paso === 'conf') {
    if (t === '1' || t.includes('si') || t.includes('sí') || t.includes('confirmar')) {
      s.paso = 'fin';
      await send(`🎉 *¡Pedido confirmado, ${s.nombre}!* Ya está en preparación 🔥`);
      if (s.entrega === 'domicilio') await send(`Te llevamos el pedido a *${s.dir}* 🛵\nTiempo estimado: 30-45 min. ¡Ya vamos!`);
      else await send('¡Listo! Tu pedido estará listo para recoger en breve en *Cra. 22 No. 3-81* 📍');
      await send('¡Gracias por elegir *Fogón Sazón*! 🍲💛 Que lo disfrutes mucho.');
      delete sesiones[msg.from];
    } else {
      s.paso = 'tipo';
      await send(`¿Qué quieres modificar?\n\n1️⃣ Almuerzo completo\n2️⃣ Bandeja\n3️⃣ Especial chuleta`);
    }
    return;
  }
}

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  }
});

client.on('qr', qr => {
  console.log('Escanea este QR con WhatsApp:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ Bot Fogón Sazón conectado y listo!');
});

client.on('message', async msg => {
  if (msg.isGroupMsg) return;
  if (!sesiones[msg.from]) sesiones[msg.from] = { paso: 'inicio' };
  await responder(client, msg, sesiones[msg.from]);
});

client.initialize();
