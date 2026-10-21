/* Farmacia Moraleda · demo de tienda (BiselLab). Sin dependencias; funciona abriendo index.html. */
(function(){
"use strict";
document.documentElement.classList.add("js");
var P = (window.CATALOGO||[]).slice();
var POR_ID = {}; P.forEach(function(p,i){ p.i=i; POR_ID[p.id]=p; });
var IMG = function(p){ return "assets/img/productos/"+p.id+".webp"; };
var M = "assets/img/marca/";
var WA = "34659429977";
var ENVIO_GRATIS = 50;
var eur = new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR"});
var fmt = function(n){ return eur.format(n); };
var nf = {format:function(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,"."); }};
function esc(s){ return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
function norm(s){ return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9+]+/g," ").trim(); }
P.forEach(function(p){ p.h = " "+norm(p.n+" "+p.b+" "+p.s+" "+p.c)+" "; p.nn = norm(p.n); p.bn = norm(p.b); });

/* Destacados de la portada actual de la farmacia (21/10/2026), con su estado real */
var DESTACADOS = [
  {n:"XLS MEDICAL PRO-7 90 STICKS SABOR PIÑA", antes:108.50, estado:"agotado"},
  {n:"XLS MEDICAL PRO-7 180 CAPSULAS", antes:107.95, estado:"ultimas"},
  {n:"ONIRIA 30 COMPRIMIDOS"},
  {n:"Aspolvit Flex Forte 60 Cápsulas"},
  {n:"Olistic Next Mujer 28 Ampollas"},
  {n:"Bioderma Sensibio H2O Solucion Micelar Duplo 2x500 ml", antes:21.95, estado:"agotado"}
];
var EXTRA = {}, destacados = [];
DESTACADOS.forEach(function(d){
  var p = P.find(function(x){ return x.n===d.n; });
  if(p){ EXTRA[p.id]={antes:d.antes,estado:d.estado}; destacados.push(p); }
});
function estado(p){ return (EXTRA[p.id]||{}).estado||""; }
function vendible(p){ return p.p>0 && estado(p)!=="agotado"; }

var CATS = {};
P.forEach(function(p){ var c=CATS[p.c]||(CATS[p.c]={n:p.c,total:0}); c.total++; });
var LISTA_CATS = Object.keys(CATS).map(function(k){return CATS[k];}).sort(function(a,b){return b.total-a.total;});
var ICONO_CAT = {"Mamás y bebés":"mamas-y-bebes","Cosmética facial":"cosmetica-facial","Cuidado bucal":"cuidado-bucal","Cuidado corporal":"cuidado-corporal","Solares":"solares","Dietética y nutrición":"dietetica-y-nutricion","Higiene":"higiene","Alimentación infantil":"alimentacion-infantil","Cuidado capilar":"cuidado-capilar","Fitoterapia":"fitoterapia","Salud sexual":"","Botiquín y sanitarios":"otros","Ortopedia":"ortopedia"};

/* ---------- horario (según su ficha de Google) ---------- */
function horarioHoy(d){
  var dia=d.getDay(), m=d.getHours()*60+d.getMinutes();
  if(dia===0) return {abierto:false, texto:"Hoy domingo cerramos. Abrimos el lunes a las 9:30."};
  var cierre = dia===6 ? 14*60 : 21*60+30, apertura = 9*60+30;
  if(m<apertura) return {abierto:false, texto:"Abrimos hoy a las 9:30."};
  if(m>=cierre) return {abierto:false, texto:"Ya hemos cerrado. Abrimos "+(dia===6?"el lunes":"mañana")+" a las 9:30."};
  return {abierto:true, texto:"Abierto hasta las "+(dia===6?"14:00":"21:30")+"."};
}

/* ---------- ticket (carrito) ---------- */
var CLAVE="moraleda-ticket", ticket = {};
try{ ticket = JSON.parse(localStorage.getItem(CLAVE)||"{}")||{}; }catch(e){ ticket={}; }
Object.keys(ticket).forEach(function(id){ if(!POR_ID[id]||!vendible(POR_ID[id])) delete ticket[id]; });
var ultimaLinea = null;
function guardar(){ try{ localStorage.setItem(CLAVE, JSON.stringify(ticket)); }catch(e){} }
function lineas(){ return Object.keys(ticket).map(function(id){ return {p:POR_ID[id], q:ticket[id]}; }); }
function subtotal(){ return lineas().reduce(function(s,l){ return s+l.p.p*l.q; },0); }
function unidades(){ return lineas().reduce(function(s,l){ return s+l.q; },0); }
function anadir(id,q){
  var p=POR_ID[id]; if(!p||!vendible(p)) return;
  ticket[id]=Math.min(99,(ticket[id]||0)+(q||1)); ultimaLinea=id; guardar(); pintarTicket();
  var b=document.getElementById("abrirTicket"); b.classList.remove("salta"); void b.offsetWidth; b.classList.add("salta");
  avisar('<svg aria-hidden="true"><use href="#i-check"/></svg><span>Añadido a tu ticket</span><button type="button" class="aviso__ver" data-abrir-ticket>Ver ticket</button>');
}
function cambiar(id,q){ if(q<=0) delete ticket[id]; else ticket[id]=Math.min(99,q); ultimaLinea=null; guardar(); pintarTicket(); }
function vaciar(){ ticket={}; guardar(); pintarTicket(); }
function barraEnvio(st){
  var falta = ENVIO_GRATIS-st, pct=Math.min(100, st/ENVIO_GRATIS*100);
  return '<div class="barra-envio'+(falta<=0?' barra-envio--ok':'')+'"><span>'+(falta<=0?'ENVÍO GRATIS CONSEGUIDO':'TE FALTAN '+fmt(falta)+' PARA ENVÍO GRATIS')+'</span><div class="barra-envio__pista" aria-hidden="true"><i style="clip-path:inset(0 '+(100-pct)+'% 0 0)"></i></div></div>';
}
function mensajeWA(){
  var t="Hola, me gustaría hacer este pedido en Farmacia Moraleda:\n";
  lineas().forEach(function(l){ t+="• "+l.q+" x "+l.p.n+" ("+fmt(l.p.p)+")\n"; });
  t+="Total productos: "+fmt(subtotal())+"\n¿Me confirmáis disponibilidad y envío? Gracias.";
  return "https://wa.me/"+WA+"?text="+encodeURIComponent(t);
}
function pintarTicket(){
  var ls=lineas(), st=subtotal(), u=unidades(), ahora=new Date();
  document.getElementById("ticketCuenta").textContent=u;
  document.getElementById("ticketTotal").textContent=fmt(st);
  var h='<div class="ticket__fecha"><span>'+ahora.toLocaleDateString("es-ES")+'</span><span>'+ahora.toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})+'</span></div>';
  if(!ls.length){
    h+='<div class="ticket__vacio"><p><strong>Tu ticket está en blanco.</strong></p><p>Añade productos desde la tienda y se irán imprimiendo aquí.</p></div><div class="ticket__acciones"><a class="boton" href="#/tienda" data-cerrar-ticket>Ir a la tienda</a></div>';
  } else {
    ls.forEach(function(l){
      h+='<div class="linea-ticket'+(l.p.id===ultimaLinea?' nueva':'')+'"><img src="'+IMG(l.p)+'" alt="" width="44" height="44" loading="lazy"><div><a class="linea-ticket__n" href="#/p/'+l.p.id+'" data-cerrar-ticket>'+esc(l.p.n)+'</a><div class="linea-ticket__ctrl"><button type="button" data-q="'+l.p.id+'" data-d="-1" aria-label="Quitar una unidad"><svg><use href="#i-menos"/></svg></button><output aria-label="Unidades">'+l.q+'</output><button type="button" data-q="'+l.p.id+'" data-d="1" aria-label="Añadir una unidad"><svg><use href="#i-mas"/></svg></button><button type="button" class="quitar" data-quitar="'+l.p.id+'">quitar</button></div></div><div class="linea-ticket__p">'+fmt(l.p.p*l.q)+(l.q>1?'<span class="linea-ticket__u">'+fmt(l.p.p)+' ud.</span>':'')+'</div></div>';
    });
    h+='<div class="ticket__sumas"><div class="recibo__linea"><span>ARTÍCULOS</span><span>'+u+'</span></div><div class="recibo__linea ticket__total"><span>SUBTOTAL</span><span>'+fmt(st)+'</span></div></div>'+barraEnvio(st);
    h+='<div class="ticket__acciones"><a class="boton boton--ancho" href="#/checkout" data-cerrar-ticket>Finalizar compra</a><a class="boton boton--wa boton--ancho" href="'+mensajeWA()+'" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-chat"/></svg>Pedir por WhatsApp</a></div>';
  }
  h+='<div class="ticket__codigo" aria-hidden="true"></div><p class="ticket__gracias">GRACIAS · CUIDAMOS DE TI</p>';
  document.getElementById("ticketPapel").innerHTML=h;
}
var ticketEl=document.getElementById("ticket"), capa=document.getElementById("ticketCapa"), ultimoFoco=null;
function abrirTicket(){ ultimoFoco=document.activeElement; capa.hidden=false; ticketEl.classList.add("abierto"); ticketEl.setAttribute("aria-hidden","false"); document.getElementById("abrirTicket").setAttribute("aria-expanded","true"); setTimeout(function(){ document.getElementById("cerrarTicket").focus(); },60); }
function cerrarTicket(){ if(!ticketEl.classList.contains("abierto")) return; capa.hidden=true; ticketEl.classList.remove("abierto"); ticketEl.setAttribute("aria-hidden","true"); document.getElementById("abrirTicket").setAttribute("aria-expanded","false"); if(ultimoFoco&&ultimoFoco.focus&&document.body.contains(ultimoFoco)) ultimoFoco.focus(); }
var avisoT;
function avisar(html){ var a=document.getElementById("aviso"); a.innerHTML=html; a.classList.add("ver"); clearTimeout(avisoT); avisoT=setTimeout(function(){ a.classList.remove("ver"); },3400); }

/* ---------- piezas ---------- */
function linkWA(txt){ return "https://wa.me/"+WA+"?text="+encodeURIComponent(txt); }
function precioHTML(p){
  if(!(p.p>0)) return '<span class="precio precio--consulta">Consultar precio</span>';
  var x=EXTRA[p.id]; return '<span class="precio">'+fmt(p.p)+(x&&x.antes?'<s>'+fmt(x.antes)+'</s>':'')+'</span>';
}
function sello(p){
  var e=estado(p); if(e==="agotado") return '<span class="sello sello--agotado">AGOTADO</span>';
  if(e==="ultimas") return '<span class="sello sello--ultimas">ÚLTIMAS UDS.</span>';
  var x=EXTRA[p.id]; if(x&&x.antes) return '<span class="sello">−'+Math.round((1-p.p/x.antes)*100)+' %</span>'; return "";
}
function botonAnadir(p){
  if(!(p.p>0)) return '<a class="anadir anadir--wa" href="'+linkWA("Hola, ¿me podéis dar el precio de: "+p.n+"?")+'" target="_blank" rel="noopener" aria-label="Preguntar precio de '+esc(p.n)+' por WhatsApp"><svg><use href="#i-chat"/></svg></a>';
  if(estado(p)==="agotado") return '<span class="anadir anadir--off" aria-label="Agotado" role="img"><svg><use href="#i-cerrar"/></svg></span>';
  return '<button type="button" class="anadir" data-anadir="'+p.id+'" aria-label="Añadir '+esc(p.n)+' al ticket"><svg><use href="#i-mas"/></svg></button>';
}
function tarjeta(p){
  return '<article class="tarjeta'+(estado(p)==="agotado"?' tarjeta--agotado':'')+'">'+sello(p)+
    '<a class="tarjeta__img" href="#/p/'+p.id+'" tabindex="-1" aria-hidden="true"><img src="'+IMG(p)+'" alt="" width="240" height="240" loading="lazy" decoding="async"></a>'+
    '<div class="tarjeta__cuerpo">'+(p.b?'<span class="tarjeta__marca">'+esc(p.b)+'</span>':'<span class="tarjeta__marca tarjeta__marca--sec">'+esc(p.s)+'</span>')+
    '<a class="tarjeta__nombre" href="#/p/'+p.id+'">'+esc(p.n)+'</a>'+
    '<div class="tarjeta__pie">'+precioHTML(p)+botonAnadir(p)+'</div></div></article>';
}
function buscadorHTML(id){
  return '<form class="buscador" role="search" data-buscador autocomplete="off"><div class="buscador__caja"><svg aria-hidden="true"><use href="#i-buscar"/></svg><label class="oculto" for="'+id+'">Busca un producto o una marca</label><input id="'+id+'" type="search" placeholder="Prueba: protector solar, Mustela, chupete…" role="combobox" aria-autocomplete="list" aria-controls="'+id+'-res" aria-expanded="false"><button class="boton" type="submit"><span>Buscar</span><svg aria-hidden="true"><use href="#i-flecha"/></svg></button></div><div class="resultados" id="'+id+'-res" role="listbox" aria-label="Sugerencias" hidden></div></form>';
}
function urlTienda(o){ var q=new URLSearchParams(); Object.keys(o).forEach(function(k){ if(o[k]!==""&&o[k]!=null) q.set(k,o[k]); }); var s=q.toString(); return "#/tienda"+(s?"?"+s:""); }
function buscar(q, lista){
  var t=norm(q).split(" ").filter(Boolean); if(!t.length) return (lista||P).slice();
  var res=[];
  (lista||P).forEach(function(p){
    var s=0;
    for(var k=0;k<t.length;k++){
      var tok=t[k]; if(p.h.indexOf(tok)<0) return;
      if(p.h.indexOf(" "+tok)>=0) s+=2; if(p.nn.indexOf(tok)===0) s+=3; if(p.bn===tok) s+=4;
    }
    res.push({p:p,s:s});
  });
  res.sort(function(a,b){ return b.s-a.s || a.p.n.length-b.p.n.length; });
  return res.map(function(r){ return r.p; });
}

/* ---------- portada ---------- */
var app=document.getElementById("app");
var MAPS="https://www.google.com/maps/search/?api=1&query=Calle+R%C3%ADo+Valdeyernos+4+45007+Toledo";
function vInicio(){
  var hh=horarioHoy(new Date());
  var nov=P.filter(function(p){ return p.s==="Novedades"&&p.p>0; }).slice(0,8);
  var chips=LISTA_CATS.slice(0,8), giros=[-2,1.5,-1,2,-1.5,1,-2.5,1.8];
  var insta=[["2026-09-25","instagram-2026-09-25-publicacion"],["2026-09-22","instagram-2026-09-22-publicacion"],["2026-09-01","instagram-2026-09-01-publicacion"],["2025-05-03","instagram-2025-05-03-publicacion-2"],["2025-05-03","instagram-2025-05-03-publicacion"],["2025-04-16","instagram-2025-04-16-publicacion"],["2025-03-22","instagram-2025-03-22-publicacion"],["2025-02-18","instagram-2025-02-18-publicacion"],["2024-05-29","instagram-2024-05-29-publicacion"],["2024-05-29","instagram-2024-05-29-portada-video-2"],["2024-04-02","instagram-2024-04-02-publicacion"],["2024-03-28","instagram-2024-03-28-publicacion"]];
  return ''+
  '<section class="mostrador-escena" aria-labelledby="h-inicio">'+
    '<div class="envoltura escena__grid">'+
      '<div class="pregunta">'+
        '<h1 id="h-inicio">¿Qué necesitas <em>hoy</em>?</h1>'+
        '<p class="pregunta__sub">Tu farmacia del Polígono de Toledo, también en casa: '+nf.format(P.length)+' productos de parafarmacia con el consejo de siempre.</p>'+
        buscadorHTML("qInicio")+
        '<ul class="respuestas" aria-label="Accesos rápidos por sección">'+chips.map(function(c,i){ return '<li><a style="--g:'+giros[i]+'deg" href="'+urlTienda({c:c.n})+'">'+esc(c.n)+' <small>'+c.total+'</small></a></li>'; }).join("")+'</ul>'+
      '</div>'+
      '<div class="escaparate">'+
        '<figure class="escaparate__foto"><img src="'+M+'foto-farmacia-interior-y-mostrador.webp" alt="Interior de Farmacia Moraleda con el mostrador y los lineales" width="600" height="400" fetchpriority="high"><figcaption class="escaparate__pie">Nuestro mostrador · C. Río Valdeyernos, 4</figcaption></figure>'+
        '<div class="nota nota--verde n2"><p class="nota__mano">Envío gratis</p><p>en pedidos desde 50 €. Si no, desde 2,99 €.</p></div>'+
        '<div class="nota nota--rosa n1"><p class="nota__mano">¿Antes de las 14:00?</p><p>Tu pedido sale hoy mismo.</p></div>'+
        '<div class="nota n3"><p class="nota__mano">¿Dudas?</p><p>Pregúntanos por WhatsApp: <a href="https://wa.me/'+WA+'" target="_blank" rel="noopener">659 429 977</a></p></div>'+
      '</div>'+
    '</div>'+
    '<div class="mostrador">'+
      '<div class="sobre-encimera"><div class="envoltura" role="list" aria-label="Destacados sobre el mostrador">'+
        destacados.map(function(p){ return '<a role="listitem" class="producto-en-pie" href="#/p/'+p.id+'"><span class="producto-en-pie__img">'+(estado(p)==="agotado"?'<span class="sello sello--agotado">AGOTADO</span>':'')+'<img src="'+IMG(p)+'" alt="" width="150" height="150"></span><span class="oculto">'+esc(p.n)+(estado(p)==="agotado"?' (agotado)':'')+'</span><span class="etiqueta-precio">'+(p.p>0?fmt(p.p):'Consultar')+'</span></a>'; }).join("")+
      '</div></div>'+
      '<div class="mostrador__encimera" aria-hidden="true"></div>'+
      '<div class="mostrador__frente"><div class="envoltura mostrador__datos">'+
        '<p class="estado'+(hh.abierto?'':' estado--cerrado')+'"><svg class="cruz'+(hh.abierto?' cruz--late':'')+'" aria-hidden="true"><use href="#i-cruz"/></svg>'+(hh.abierto?'Abierto':'Cerrado')+'</p>'+
        '<p class="mostrador__horario"><strong>'+hh.texto+'</strong><br>L–V 9:30–21:30 · S 9:30–14:00 · D cerrado</p>'+
        '<p class="mostrador__direccion"><a href="'+MAPS+'" target="_blank" rel="noopener">C. Río Valdeyernos, 4<br>45007 Toledo · Polígono</a></p>'+
      '</div></div>'+
    '</div>'+
  '</section>'+

  '<section class="seccion envoltura revela" aria-labelledby="h-dest">'+
    '<div class="seccion__cabeza"><div><h2 id="h-dest">Destacados de la farmacia</h2><p>Lo que la farmacia tiene hoy en portada, con su precio y su disponibilidad.</p></div><a class="enlace-flecha" href="#/tienda">Ver toda la tienda <svg><use href="#i-flecha"/></svg></a></div>'+
    '<div class="rejilla rejilla--6">'+destacados.map(tarjeta).join("")+'</div>'+
  '</section>'+

  '<section class="seccion envoltura revela" style="padding-top:0" aria-labelledby="h-pas">'+
    '<div class="seccion__cabeza"><div><h2 id="h-pas">Recorre los pasillos</h2><p>Trece secciones, de la cuna al botiquín. Entra en una y filtra por lo que necesitas.</p></div></div>'+
    '<div class="pasillos">'+LISTA_CATS.map(function(c){ return '<a class="pasillo" href="'+urlTienda({c:c.n})+'"><svg class="pasillo__cruz" aria-hidden="true"><use href="#i-cruz"/></svg><span class="pasillo__nombre">'+esc(c.n)+'</span><span class="pasillo__cuenta">'+c.total+' prod.</span></a>'; }).join("")+'</div>'+
  '</section>'+

  '<section class="envoltura revela" aria-label="Secciones especiales"><div class="dobles">'+
    '<a class="banner" href="'+urlTienda({c:"Mamás y bebés"})+'"><img src="'+M+'banner-especial-mamas-y-bebes.webp" alt="Especial mamás y bebés" width="570" height="220" loading="lazy"></a>'+
    '<a class="banner" href="#/consejos"><img src="'+M+'banner-consejos-de-salud-blog.webp" alt="Consejos de salud" width="570" height="220" loading="lazy"></a>'+
  '</div></section>'+

  (nov.length>=4?'<section class="seccion envoltura revela" aria-labelledby="h-nov"><div class="seccion__cabeza"><div><h2 id="h-nov">Novedades</h2><p>Lo último que ha entrado en la tienda online.</p></div><a class="enlace-flecha" href="'+urlTienda({s:"Novedades"})+'">Ver novedades <svg><use href="#i-flecha"/></svg></a></div><div class="rejilla">'+nov.map(tarjeta).join("")+'</div></section>':'')+

  '<section class="seccion revela" style="background:var(--mg-velo)" aria-labelledby="h-cond"><div class="envoltura condiciones">'+
    '<div><h2 id="h-cond" class="titulo-seccion">Comprar aquí es como venir al mostrador</h2>'+
      '<ol class="pasos">'+
        '<li><span class="pasos__ico"><svg><use href="#i-reloj"/></svg></span><div><h3>Sale el mismo día</h3><p>Los pedidos hechos antes de las 14:00 salen de la farmacia ese mismo día.</p></div></li>'+
        '<li><span class="pasos__ico"><svg><use href="#i-tienda"/></svg></span><div><h3>O recógelo tú</h3><p>Haz el pedido online y pásate a recogerlo por la farmacia, en el Polígono.</p></div></li>'+
        '<li><span class="pasos__ico pasos__ico--vd"><svg><use href="#i-chat"/></svg></span><div><h3>Con alguien al otro lado</h3><p>¿No sabes qué elegir o tienes una duda con tu pedido? Escríbenos por WhatsApp al 659 429 977.</p></div></li>'+
      '</ol></div>'+ reciboTarifas(true) +
  '</div></section>'+

  '<section class="seccion familia revela" aria-labelledby="h-fam"><div class="envoltura familia__grid">'+
    '<div><h2 id="h-fam">Una farmacia de barrio, de las de toda la vida</h2><p>Somos una familia de farmacéuticas al frente de una farmacia en el Polígono de Toledo, en Santa María de Benquerencia. Lo que nos define no cabe en un catálogo: el consejo farmacéutico de confianza.</p><p class="lema">Cuidamos de ti.</p><a class="boton boton--claro" href="#/conocenos">Conócenos <svg aria-hidden="true"><use href="#i-flecha"/></svg></a></div>'+
    '<div class="collage">'+
      '<img class="c1" src="'+M+'foto-farmacia-fachada-exterior.webp" alt="Fachada de Farmacia Moraleda" loading="lazy" width="600" height="400">'+
      '<img class="c2" src="'+M+'foto-farmacia-lineal-dermocosmetica.webp" alt="Lineal de dermocosmética" loading="lazy" width="600" height="400">'+
      '<img class="c3" src="'+M+'foto-farmacia-lineal-bebe-e-higiene.webp" alt="Lineal de bebé e higiene" loading="lazy" width="600" height="400">'+
      '<img class="c4" src="'+M+'foto-farmacia-lineal-complementos.webp" alt="Lineal de complementos" loading="lazy" width="600" height="400">'+
      '<img class="c5" src="'+M+'foto-farmacia-estanterias-dietetica.webp" alt="Estanterías de dietética" loading="lazy" width="600" height="400">'+
    '</div>'+
  '</div></section>'+

  '<section class="seccion envoltura revela" aria-labelledby="h-ig">'+
    '<div class="seccion__cabeza"><div class="insta-cabeza"><img src="'+M+'instagram-foto-de-perfil.webp" alt="" width="56" height="56"><div><h2 id="h-ig" class="titulo-insta">@farmaciamoraleda.es</h2><p style="margin:4px 0 0">Lo que contamos en Instagram.</p></div></div><a class="enlace-flecha" href="https://www.instagram.com/farmaciamoraleda.es/" target="_blank" rel="noopener">Seguir en Instagram <svg><use href="#i-flecha"/></svg></a></div>'+
    '<div class="insta">'+insta.map(function(f){ return '<a href="https://www.instagram.com/farmaciamoraleda.es/" target="_blank" rel="noopener" aria-label="Publicación de Instagram del '+f[0].split("-").reverse().join("/")+'"><img src="'+M+f[1]+'.webp" alt="" loading="lazy" width="320" height="320"></a>'; }).join("")+'</div>'+
  '</section>'+

  '<section class="envoltura revela" style="padding-bottom:clamp(56px,8vw,96px)"><a class="experto" href="#/contacto"><img src="'+M+'banner-inferior-consulta-a-tu-experto-enlace-a-contacto.webp" alt="Consulta a tu experto: contacta con la farmacia" width="1170" height="200" loading="lazy"></a></section>';
}
function reciboTarifas(conEnlace){
  return '<div class="recibo" aria-label="Tarifas de envío"><h3>TARIFAS DE ENVÍO</h3>'+
    '<div class="recibo__linea"><span>Península 48 h</span><span>2,99 €</span></div><div class="recibo__linea"><span>Península 24 h</span><span>5,95 €</span></div><div class="recibo__linea"><span>Baleares</span><span>7,95 €</span></div><div class="recibo__linea"><span>Canarias, Ceuta, Melilla</span><span>12,95 €</span></div><div class="recibo__linea"><span>Portugal</span><span>6,50–7,50 €</span></div><div class="recibo__linea"><span>Recogida en farmacia</span><span>0,00 €</span></div>'+
    '<hr class="recibo__corte"><div class="recibo__linea recibo__linea--fuerte"><span>PEDIDOS DESDE 50 €</span><span>GRATIS</span></div><hr class="recibo__corte">'+
    '<p class="recibo__nota">Tarjeta · PayPal · Transferencia<br>Contrarreembolso (+3 %, solo península)</p>'+(conEnlace?'<p class="recibo__nota"><a href="#/envios">Ver condiciones completas</a></p>':'')+'<div class="ticket__codigo" aria-hidden="true"></div></div>';
}

/* ---------- tienda ---------- */
var PAG=48, mostrados=PAG;
function filtrar(o){
  var l=o.q?buscar(o.q):P.slice();
  if(o.c) l=l.filter(function(p){ return p.c===o.c; });
  if(o.s) l=l.filter(function(p){ return p.s===o.s; });
  if(o.b) l=l.filter(function(p){ return p.b===o.b; });
  if(o.r){ var r=o.r.split("-"), a=+r[0], b=r[1]===""?Infinity:+r[1]; l=l.filter(function(p){ return p.p>=a && p.p<b && p.p>0; }); }
  if(o.o==="pa") l.sort(function(a,b){ return (a.p||1e9)-(b.p||1e9); });
  else if(o.o==="pd") l.sort(function(a,b){ return b.p-a.p; });
  else if(o.o==="az") l.sort(function(a,b){ return a.n.localeCompare(b.n,"es"); });
  return l;
}
var RANGOS=[["0-10","Menos de 10 €"],["10-25","De 10 a 25 €"],["25-50","De 25 a 50 €"],["50-","Más de 50 €"]];
function vTienda(o){
  var l=filtrar(o), base=o.q?buscar(o.q):P;
  var enCat=o.c?base.filter(function(p){return p.c===o.c;}):base;
  var marcas={}; enCat.forEach(function(p){ if(p.b) marcas[p.b]=(marcas[p.b]||0)+1; });
  var listaMarcas=Object.keys(marcas).sort(function(a,b){ return marcas[b]-marcas[a]; }).slice(0,18).sort(function(a,b){return a.localeCompare(b,"es");});
  if(o.b&&listaMarcas.indexOf(o.b)<0&&marcas[o.b]) listaMarcas.unshift(o.b);
  var catsCuenta={}; base.forEach(function(p){ catsCuenta[p.c]=(catsCuenta[p.c]||0)+1; });
  var subsCuenta={}; enCat.forEach(function(p){ subsCuenta[p.s]=(subsCuenta[p.s]||0)+1; });
  var con=function(c){ return urlTienda(Object.assign({},o,c)); };
  var filtros='<aside class="filtros" id="filtros" aria-label="Filtros">'+
    '<div class="filtros__cabeza"><h2>Secciones</h2><button class="boton-icono filtros__cerrar" data-cerrar-filtros aria-label="Cerrar filtros"><svg><use href="#i-cerrar"/></svg></button></div>'+
    '<ul class="filtro-lista"><li><a href="'+con({c:"",s:"",b:""})+'"'+(!o.c?' aria-current="true"':'')+'>Todo <small>'+base.length+'</small></a></li>'+
    LISTA_CATS.filter(function(c){ return catsCuenta[c.n]; }).map(function(c){
      var h='<li><a href="'+con({c:c.n,s:"",b:""})+'"'+(o.c===c.n&&!o.s?' aria-current="true"':'')+'>'+esc(c.n)+' <small>'+catsCuenta[c.n]+'</small></a></li>';
      if(o.c===c.n) h+=Object.keys(subsCuenta).sort(function(a,b){return a.localeCompare(b,"es");}).map(function(s){ return '<li><a class="sub" href="'+con({s:s,b:""})+'"'+(o.s===s?' aria-current="true"':'')+'>'+esc(s)+' <small>'+subsCuenta[s]+'</small></a></li>'; }).join("");
      return h; }).join("")+'</ul>'+
    '<h2>Precio</h2><ul class="filtro-lista">'+RANGOS.map(function(r){ return '<li><a href="'+con({r:o.r===r[0]?"":r[0]})+'"'+(o.r===r[0]?' aria-current="true"':'')+'>'+r[1]+'</a></li>'; }).join("")+'</ul>'+
    (listaMarcas.length?'<h2>Marcas</h2><ul class="filtro-lista">'+listaMarcas.map(function(b){ return '<li><a href="'+con({b:o.b===b?"":b})+'"'+(o.b===b?' aria-current="true"':'')+'>'+esc(b)+' <small>'+marcas[b]+'</small></a></li>'; }).join("")+'</ul>':'')+
  '</aside>';
  var ico=o.c&&ICONO_CAT[o.c];
  var cabeza = o.c ? '<div class="cat-cabeza'+(ico?'':' cat-cabeza--sin')+'">'+(ico?'<img src="'+M+'icono-categoria-'+ico+'.webp" alt="" width="1003" height="200">':'')+'<div class="cat-cabeza__texto"><h1>'+esc(o.s||o.c)+'</h1><p>'+(o.s?esc(o.c)+' · ':'')+nf.format(l.length)+' productos</p></div></div>'
    : '<h1 class="titulo-tienda">'+(o.q?'Resultados para «'+esc(o.q)+'»':(o.s?esc(o.s):'Tienda online'))+'</h1>';
  var activos=[];
  if(o.q) activos.push(["q","«"+o.q+"»"]); if(o.s&&o.c) activos.push(["s",o.s]); if(o.s&&!o.c) activos.push(["s",o.s]); if(o.b) activos.push(["b",o.b]); if(o.r) activos.push(["r",(RANGOS.find(function(x){return x[0]===o.r;})||[0,o.r])[1]]);
  var vis=l.slice(0,mostrados);
  return '<div class="envoltura"><nav class="migas" aria-label="Estás en"><a href="#/">Inicio</a> / <a href="#/tienda">Tienda</a>'+(o.c?' / <a href="'+urlTienda({c:o.c})+'">'+esc(o.c)+'</a>':'')+(o.s?' / '+esc(o.s):'')+'</nav>'+
    '<div class="tienda">'+filtros+'<div class="tienda__principal">'+cabeza+
      '<div class="tienda__busca">'+buscadorHTML("qTienda")+'</div>'+
      '<div class="barra-tienda"><div class="chips"><button type="button" class="chip abrir-filtros" data-abrir-filtros><svg><use href="#i-filtro"/></svg>Filtrar</button>'+activos.map(function(a){ var x={}; x[a[0]]=""; return '<a class="chip" href="'+con(x)+'" aria-label="Quitar filtro '+esc(a[1])+'">'+esc(a[1])+'<svg><use href="#i-cerrar"/></svg></a>'; }).join("")+'</div>'+
      '<div class="barra-tienda__orden"><span class="cuenta">'+nf.format(l.length)+' productos</span><label class="oculto" for="orden">Ordenar</label><select id="orden" class="selector"><option value="">'+(o.q?'Más relevantes':'Orden de la farmacia')+'</option><option value="pa"'+(o.o==="pa"?" selected":"")+'>Precio: de menor a mayor</option><option value="pd"'+(o.o==="pd"?" selected":"")+'>Precio: de mayor a menor</option><option value="az"'+(o.o==="az"?" selected":"")+'>Nombre A–Z</option></select></div></div>'+
      (l.length? '<div class="rejilla" id="rejilla">'+vis.map(tarjeta).join("")+'</div>'+
        (l.length>vis.length?'<div class="mas"><span>Ves '+vis.length+' de '+nf.format(l.length)+'</span><button type="button" class="boton boton--claro" data-ver-mas>Ver '+Math.min(PAG,l.length-vis.length)+' más</button></div>':'')
      : '<div class="vacio"><h2>No lo encontramos en la tienda</h2><p>Puede que lo tengamos en la farmacia o que podamos conseguirlo. Pregúntanos y te decimos.</p><a class="boton boton--wa" href="'+linkWA("Hola, estoy buscando: "+(o.q||""))+'" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-chat"/></svg>Preguntar por WhatsApp</a></div>')+
    '</div></div></div>';
}

/* ---------- ficha ---------- */
function vFicha(id){
  var p=POR_ID[id]; if(!p) return vNoEncontrado();
  var rel=P.filter(function(x){ return x.s===p.s && x.c===p.c && x.id!==p.id; }).slice(0,8);
  var e=estado(p);
  var compra = !(p.p>0) ? '<a class="boton boton--wa" href="'+linkWA("Hola, ¿me podéis dar el precio de: "+p.n+"?")+'" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-chat"/></svg>Consultar precio por WhatsApp</a>'
    : e==="agotado" ? '<button class="boton" type="button" disabled>Agotado ahora mismo</button><a class="boton boton--wa" href="'+linkWA("Hola, ¿cuándo volveréis a tener: "+p.n+"?")+'" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-chat"/></svg>Avísame cuando vuelva</a>'
    : '<div class="cantidad"><button type="button" data-paso="-1" aria-label="Una unidad menos"><svg><use href="#i-menos"/></svg></button><output id="cant" aria-live="polite" aria-label="Cantidad">1</output><button type="button" data-paso="1" aria-label="Una unidad más"><svg><use href="#i-mas"/></svg></button></div><button class="boton" type="button" data-anadir-ficha="'+p.id+'"><svg aria-hidden="true"><use href="#i-ticket"/></svg>Añadir al ticket</button>';
  return '<div class="envoltura"><nav class="migas" aria-label="Estás en"><a href="#/">Inicio</a> / <a href="'+urlTienda({c:p.c})+'">'+esc(p.c)+'</a> / <a href="'+urlTienda({c:p.c,s:p.s})+'">'+esc(p.s)+'</a></nav>'+
    '<div class="ficha"><div class="ficha__foto">'+sello(p)+'<img src="'+IMG(p)+'" alt="'+esc(p.n)+'" width="600" height="600"></div>'+
    '<div>'+(p.b?'<a class="ficha__marca" href="'+urlTienda({b:p.b})+'">'+esc(p.b)+'</a>':'')+'<h1>'+esc(p.n)+'</h1>'+
      '<div class="ficha__precio">'+precioHTML(p)+'</div>'+
      (e==="ultimas"?'<p class="ficha__ultimas">Quedan las últimas unidades.</p>':'')+
      '<div class="comprar">'+compra+'</div>'+
      '<a class="enlace-flecha enlace-flecha--vd" href="'+linkWA("Hola, tengo una duda sobre: "+p.n)+'" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-chat"/></svg>¿Es lo que necesitas? Pregunta a tu farmacéutica</a>'+
      '<div class="ficha__notas">'+
        '<div class="nota nota--verde" style="--giro:-1.2deg"><p class="nota__mano">Envío</p><p>Desde 2,99 € en península (48 h). <strong>Gratis desde 50 €.</strong></p></div>'+
        '<div class="nota nota--rosa" style="--giro:1deg"><p class="nota__mano">Antes de las 14:00</p><p>Los pedidos salen de la farmacia el mismo día.</p></div>'+
        '<div class="nota" style="--giro:.8deg"><p class="nota__mano">Recogida</p><p>También puedes recogerlo en la farmacia, C. Río Valdeyernos, 4.</p></div>'+
        '<div class="nota nota--verde" style="--giro:-.6deg"><p class="nota__mano">Pago</p><p>Tarjeta, PayPal, transferencia o contrarreembolso (+3 %).</p></div>'+
      '</div>'+
      '<p class="ficha__aviso">Sección: '+esc(p.c)+' · '+esc(p.s)+'. Precio de la tienda online de la farmacia a 21/10/2026.</p>'+
    '</div></div>'+
    (rel.length?'<section class="seccion" style="padding-top:0" aria-labelledby="h-rel"><div class="seccion__cabeza"><h2 id="h-rel">En el mismo estante</h2><a class="enlace-flecha" href="'+urlTienda({c:p.c,s:p.s})+'">Ver '+esc(p.s)+' <svg><use href="#i-flecha"/></svg></a></div><div class="rejilla">'+rel.map(tarjeta).join("")+'</div></section>':'')+
  '</div>';
}

/* ---------- checkout ---------- */
var ZONAS=[
  {id:"p48",n:"Península 48 h",d:"Envío estándar",precio:2.99,pen:true},
  {id:"p24",n:"Península 24 h",d:"Urgente con Nacex",precio:5.95,pen:true},
  {id:"bal",n:"Baleares",d:"",precio:7.95},
  {id:"can",n:"Canarias, Ceuta o Melilla",d:"Con Correos",precio:12.95},
  {id:"por",n:"Portugal",d:"Entre 6,50 y 7,50 € según destino; te confirmamos el importe",precio:null},
  {id:"rec",n:"Recoger en la farmacia",d:"C. Río Valdeyernos, 4 · Toledo",precio:0,pen:true}
];
var co={zona:"p48",pago:"tarjeta"}, borrador={};
function costes(){
  var st=subtotal(), z=ZONAS.find(function(x){return x.id===co.zona;});
  var envio = st>=ENVIO_GRATIS ? 0 : z.precio;           /* null = a confirmar (Portugal) */
  var base = st+(envio||0);
  var rec = co.pago==="reembolso" ? Math.round(base*3)/100 : 0;
  return {st:st,z:z,envio:envio,rec:rec,total:base+rec,confirmar:envio===null};
}
function resumenHTML(){
  var c=costes();
  return '<div class="recibo"><h3>TU TICKET</h3>'+
    lineas().map(function(l){ return '<div class="recibo__linea"><span>'+l.q+' × '+esc(l.p.n)+'</span><span>'+fmt(l.p.p*l.q)+'</span></div>'; }).join("")+
    '<hr class="recibo__corte"><div class="recibo__linea"><span>Subtotal</span><span>'+fmt(c.st)+'</span></div>'+
    '<div class="recibo__linea"><span>Envío · '+esc(c.z.n)+'</span><span>'+(c.confirmar?'a confirmar':fmt(c.envio))+'</span></div>'+
    (c.rec?'<div class="recibo__linea"><span>Contrarreembolso +3 %</span><span>'+fmt(c.rec)+'</span></div>':'')+
    '<div class="recibo__linea ticket__total"><span>TOTAL</span><span>'+fmt(c.total)+(c.confirmar?' + envío':'')+'</span></div>'+
    barraEnvio(c.st)+'</div>';
}
function despachoTexto(){
  var d=new Date(), dia=d.getDay(), m=d.getHours()*60+d.getMinutes();
  if(dia>=1&&dia<=5&&m<14*60) return "Si lo confirmas antes de las 14:00, sale hoy.";
  return "Los pedidos hechos antes de las 14:00 salen el mismo día.";
}
function campo(id,label,tipo,auto,extra){
  return '<div class="campo"><label for="'+id+'">'+label+'</label><input id="'+id+'" name="'+id+'" type="'+tipo+'" autocomplete="'+auto+'" required '+(extra||'')+' aria-describedby="'+id+'-e"><p class="campo__error" id="'+id+'-e" hidden></p></div>';
}
function vCheckout(){
  if(!lineas().length) return '<div class="envoltura hecho-pagina"><h1>Tu ticket está en blanco</h1><p>Añade algún producto y vuelve aquí para terminar.</p><a class="boton" href="#/tienda">Ir a la tienda</a></div>';
  var c=costes();
  return '<div class="envoltura"><nav class="migas" aria-label="Estás en"><a href="#/">Inicio</a> / Finalizar compra</nav>'+
  '<div class="pagina-cabeza pagina-cabeza--corta"><h1>Finalizar compra</h1><p><span class="demo-sello"><svg aria-hidden="true"><use href="#i-check"/></svg>Demo: no se realiza ningún cobro</span> '+despachoTexto()+'</p></div>'+
  '<form class="checkout" id="formPedido" novalidate><div>'+
    '<h2>Tus datos</h2><div class="formulario">'+campo("nombre","Nombre y apellidos","text","name")+
      '<div class="fila2">'+campo("email","Correo electrónico","email","email")+campo("tel","Teléfono","tel","tel")+'</div></div>'+
    '<h2>Entrega</h2><fieldset><legend class="oculto">Tipo de entrega</legend><div class="opciones">'+ZONAS.map(function(z){
      var precio = z.precio===null ? (c.st>=ENVIO_GRATIS?'0,00 €':'6,50–7,50 €') : (c.st>=ENVIO_GRATIS&&z.precio>0?'<s>'+fmt(z.precio)+'</s> 0,00 €':fmt(z.precio));
      return '<label class="opcion"><input type="radio" name="zona" value="'+z.id+'"'+(co.zona===z.id?' checked':'')+'><span>'+esc(z.n)+(z.d?'<small>'+esc(z.d)+'</small>':'')+'</span><span class="num">'+precio+'</span></label>'; }).join("")+'</div></fieldset>'+
    '<div class="formulario" id="direccion" style="margin-top:16px"'+(co.zona==="rec"?' hidden':'')+'>'+campo("dir","Dirección","text","street-address")+
      '<div class="fila2">'+campo("cp","Código postal","text","postal-code",'inputmode="numeric"')+campo("ciudad","Población","text","address-level2")+'</div></div>'+
    '<h2>Pago</h2><fieldset><legend class="oculto">Forma de pago</legend><div class="opciones">'+
      [["tarjeta","Tarjeta","Visa, Maestro, Euro 6000, American Express"],["paypal","PayPal",""],["transferencia","Transferencia bancaria",""],["reembolso","Contrarreembolso",c.z.pen?"+3 % · solo península":"Solo disponible en península"]].map(function(x){
        var dis = x[0]==="reembolso" && !c.z.pen;
        return '<label class="opcion"><input type="radio" name="pago" value="'+x[0]+'"'+(co.pago===x[0]&&!dis?' checked':'')+(dis?' disabled':'')+'><span>'+x[1]+(x[2]?'<small>'+x[2]+'</small>':'')+'</span><span></span></label>'; }).join("")+'</div></fieldset>'+
    '<div class="campo" style="margin-top:20px"><label for="notas">Notas para la farmacia (opcional)</label><textarea id="notas" name="notas" placeholder="Por ejemplo: dejar en conserjería"></textarea></div>'+
  '</div>'+
  '<div class="checkout__resumen"><div id="resumen" aria-live="polite">'+resumenHTML()+'</div><div class="ticket__acciones"><button class="boton boton--ancho" type="submit">Confirmar pedido de prueba</button><a class="boton boton--wa boton--ancho" href="'+mensajeWA()+'" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-chat"/></svg>Prefiero pedir por WhatsApp</a></div><p class="campo__ayuda" style="margin-top:12px;text-align:center">Al ser una demo, tus datos no se envían a ningún sitio.</p></div>'+
  '</form></div>';
}
var ultimoPedido=null;
function vPedido(){
  if(!ultimoPedido) return '<div class="envoltura hecho-pagina"><h1>Sin pedido reciente</h1><a class="boton" href="#/tienda">Ir a la tienda</a></div>';
  var u=ultimoPedido;
  return '<div class="envoltura hecho-pagina"><svg class="cruz cruz--grande" aria-hidden="true"><use href="#i-cruz"/></svg><h1>¡Pedido recibido, '+esc(u.nombre.split(" ")[0])+'!</h1><p>Es un pedido de demostración: no se ha cobrado nada. En la web real, aquí se confirmaría el pago y te llegaría un correo a <strong>'+esc(u.email)+'</strong>.</p>'+
  '<div class="recibo"><h3>PEDIDO '+u.num+'</h3>'+u.lineas.map(function(l){ return '<div class="recibo__linea"><span>'+l.q+' × '+esc(l.n)+'</span><span>'+fmt(l.t)+'</span></div>'; }).join("")+'<hr class="recibo__corte"><div class="recibo__linea"><span>'+esc(u.zona)+'</span><span>'+u.envio+'</span></div>'+(u.rec?'<div class="recibo__linea"><span>Contrarreembolso</span><span>'+u.rec+'</span></div>':'')+'<div class="recibo__linea ticket__total"><span>TOTAL</span><span>'+u.total+'</span></div><p class="recibo__nota">'+u.despacho+'</p><div class="ticket__codigo" aria-hidden="true"></div></div>'+
  '<p style="margin-top:28px"><a class="boton" href="#/tienda">Seguir comprando</a></p></div>';
}

/* ---------- páginas de información ---------- */
function vConocenos(){
  var enc=[["alimentacion-infantil","Alimentación infantil"],["leches-infantiles","Leches infantiles"],["alimentacion","Alimentación"],["complementos-dieteticos","Complementos dietéticos"],["complejos-vitaminicos","Complejos vitamínicos"],["cuidado-de-manos","Cuidado de manos"],["solares","Solares"],["cestas-regalo","Cestas regalo"]];
  var fotos=[["foto-farmacia-fachada-exterior","La fachada, en C. Río Valdeyernos, 4"],["foto-farmacia-interior-y-mostrador","El mostrador"],["foto-farmacia-lineal-dermocosmetica","Dermocosmética"],["foto-farmacia-lineal-bebe-e-higiene","Bebé e higiene"],["foto-farmacia-lineal-complementos","Complementos"],["foto-farmacia-estanterias-dietetica","Dietética"]];
  return '<div class="envoltura"><div class="pagina-cabeza"><h1>Conócenos</h1><p>Una farmacia de barrio en el Polígono de Toledo, con una parafarmacia online abierta las 24 horas.</p></div>'+
    '<div class="cabecera-ilustrada"><img src="'+M+'cabecera-conocenos-ilustracion-equipo.webp" alt="Ilustración del equipo de Farmacia Moraleda" width="1200" height="300"></div>'+
    '<div class="dos-col"><div class="texto-largo"><p>Farmacia Moraleda es una farmacia de las de toda la vida en el barrio de Santa María de Benquerencia, el Polígono de Toledo. Al frente hay una familia de farmacéuticas; la titular es María Eugenia del Vigo Moraleda.</p><p>Lo que nos importa se repite en todo lo que hacemos: el consejo farmacéutico de confianza. Por eso, aunque compres online, al otro lado hay alguien de la farmacia: puedes escribirnos por WhatsApp, llamarnos o pasar a recoger tu pedido.</p><p class="lema">Cuidamos de ti.</p></div>'+
    '<div class="contacto-vias"><a class="via" href="'+MAPS+'" target="_blank" rel="noopener"><span class="via__ico"><svg><use href="#i-pin"/></svg></span><div><strong>C. Río Valdeyernos, 4</strong><span>45007 Toledo · Cómo llegar</span></div></a><div class="via"><span class="via__ico"><svg><use href="#i-reloj"/></svg></span><div><strong>L–V 9:30–21:30</strong><span>Sábados 9:30–14:00 · Domingos cerrado</span></div></div><a class="via via--wa" href="https://wa.me/'+WA+'" target="_blank" rel="noopener"><span class="via__ico"><svg><use href="#i-chat"/></svg></span><div><strong>WhatsApp 659 429 977</strong><span>Escríbenos tu duda</span></div></a></div></div>'+
    '<section class="seccion" aria-labelledby="h-enc" style="padding-bottom:0"><div class="seccion__cabeza"><h2 id="h-enc">En la farmacia encontrarás</h2></div><ul class="encontraras">'+enc.map(function(e){ return '<li><img src="'+M+'icono-conocenos-'+e[0]+'.webp" alt="" width="150" height="150" loading="lazy">'+e[1]+'</li>'; }).join("")+'</ul></section>'+
    '<section class="seccion" aria-labelledby="h-fot"><div class="seccion__cabeza"><h2 id="h-fot">Pasa a vernos</h2></div><div class="galeria">'+fotos.map(function(f){ return '<figure><img src="'+M+f[0]+'.webp" alt="'+f[1]+'" width="600" height="400" loading="lazy"><figcaption>'+f[1]+'</figcaption></figure>'; }).join("")+'</div></section>'+
  '</div>';
}
function vConsejos(){
  var c=[
    ["blog-dermatitis-atopica","Dermatitis atópica",{c:"Cuidado corporal",s:"Piel Atópica"},"productos para piel atópica"],
    ["blog-limpieza-adecuada-de-nuestra-piel","Limpieza adecuada de nuestra piel",{c:"Cosmética facial",s:"Higiene Facial"},"higiene facial"],
    ["blog-la-piel-nuestra-envoltura","La piel, nuestra envoltura",{c:"Cuidado corporal",s:"Hidratación Corporal"},"hidratación corporal"],
    ["blog-productos-necesarios-para-el-recien-nacido","Productos necesarios para el recién nacido",{c:"Mamás y bebés"},"mamás y bebés"],
    ["blog-consejos-para-la-mujer-embarazada","Consejos para la mujer embarazada",{c:"Mamás y bebés",s:"Embarazo ovulación"},"embarazo"]
  ];
  return '<div class="envoltura"><div class="pagina-cabeza"><h1>Consejos de salud</h1><p>Los temas del blog de la farmacia, cada uno junto a su estante de la tienda. Y si tu caso es concreto, pregúntanos.</p></div>'+
  '<div class="consejos">'+c.map(function(x){ return '<article class="consejo"><img src="'+M+x[0]+'.webp" alt="" width="640" height="480" loading="lazy"><div class="consejo__cuerpo"><h2>'+x[1]+'</h2><p class="consejo__estado">Artículo del blog actual, pendiente de pasar a la web nueva.</p><div class="consejo__acciones"><a class="enlace-flecha" href="'+urlTienda(x[2])+'">Ver '+x[3]+' <svg><use href="#i-flecha"/></svg></a><a class="enlace-flecha enlace-flecha--vd" href="'+linkWA("Hola, tengo una consulta sobre: "+x[1])+'" target="_blank" rel="noopener">Pregúntanos</a></div></div></article>'; }).join("")+'</div></div>';
}
function vEnvios(){
  return '<div class="envoltura"><div class="pagina-cabeza"><h1>Envíos, plazos y pagos</h1><p>Lo que pasa desde que haces el pedido hasta que lo tienes en casa.</p></div>'+
  '<div class="dos-col dos-col--fin"><div class="texto-largo">'+
    '<img src="'+M+'icono-gastos-de-envio.webp" alt="" width="147" height="95" class="icono-envio">'+
    '<h2>Plazos</h2><p>Los pedidos realizados antes de las 14:00 salen de la farmacia el mismo día. Los urgentes viajan con Nacex y los envíos a las islas, con Correos.</p>'+
    '<h2>Formas de pago</h2><p>Tarjeta (Visa, Maestro, Euro 6000, American Express), PayPal, transferencia bancaria o contrarreembolso, con un recargo del 3 % y solo en península.</p>'+
    '<h2>Recogida en la farmacia</h2><p>Si lo prefieres, haz el pedido online y recógelo en C. Río Valdeyernos, 4, en el Polígono.</p>'+
    '<h2>Qué vendemos online</h2><p>Productos de parafarmacia. No vendemos medicamentos online.</p>'+
  '</div><div class="recibo-fijo">'+reciboTarifas(false)+'</div></div></div>';
}
function vContacto(){
  return '<div class="envoltura"><div class="pagina-cabeza"><h1>Contacto</h1><p>Llámanos, escríbenos o pasa por el mostrador.</p></div>'+
  '<div class="dos-col"><div class="contacto-vias">'+
    '<a class="via via--wa" href="https://wa.me/'+WA+'" target="_blank" rel="noopener"><span class="via__ico"><svg><use href="#i-chat"/></svg></span><div><strong>WhatsApp 659 429 977</strong><span>Dudas sobre productos y pedidos</span></div></a>'+
    '<a class="via" href="tel:+34925245603"><span class="via__ico"><svg><use href="#i-tel"/></svg></span><div><strong>925 245 603</strong><span>Teléfono de la farmacia</span></div></a>'+
    '<a class="via" href="mailto:info@farmaciamoraleda.es"><span class="via__ico"><svg><use href="#i-mail"/></svg></span><div><strong>info@farmaciamoraleda.es</strong><span>Correo electrónico</span></div></a>'+
    '<a class="via" href="'+MAPS+'" target="_blank" rel="noopener"><span class="via__ico"><svg><use href="#i-pin"/></svg></span><div><strong>C. Río Valdeyernos, 4</strong><span>45007 Toledo · L–V 9:30–21:30 · S 9:30–14:00</span></div></a>'+
  '</div>'+
  '<form class="formulario tarjeta-form" id="formContacto" novalidate><h2>Escríbenos</h2>'+campo("cnombre","Tu nombre","text","name")+campo("cemail","Tu correo","email","email")+'<div class="campo"><label for="cmsg">¿En qué podemos ayudarte?</label><textarea id="cmsg" name="cmsg" required aria-describedby="cmsg-e"></textarea><p class="campo__error" id="cmsg-e" hidden></p></div><button class="boton" type="submit">Preparar correo</button><p class="campo__ayuda">Se abrirá tu programa de correo con el mensaje listo para enviar a info@farmaciamoraleda.es.</p></form></div>'+
  '<section class="bloque-experto"><a class="experto" href="https://wa.me/'+WA+'" target="_blank" rel="noopener"><img src="'+M+'banner-inferior-consulta-a-tu-experto-enlace-a-contacto.webp" alt="Consulta a tu experto por WhatsApp" width="1170" height="200" loading="lazy"></a></section></div>';
}
function vNoEncontrado(){ return '<div class="envoltura hecho-pagina"><h1>Esta página no está en el estante</h1><p>Puede que el enlace sea antiguo. Prueba a buscar lo que necesitas.</p><div class="hecho-pagina__busca">'+buscadorHTML("q404")+'</div></div>'; }

/* ---------- router ---------- */
function ruta(){
  var h=location.hash.replace(/^#\/?/,""), partes=h.split("?"), qs=new URLSearchParams(partes[1]||"");
  return {camino:partes[0], o:{q:qs.get("q")||"",c:qs.get("c")||"",s:qs.get("s")||"",b:qs.get("b")||"",r:qs.get("r")||"",o:qs.get("o")||""}};
}
var TITULO=" · Farmacia Moraleda";
function render(){
  var r=ruta(), c=r.camino, html, sec="", t;
  if(c===""){ html=vInicio(); t="Farmacia Moraleda · Tu farmacia del Polígono, también online"; }
  else if(c==="tienda"){ mostrados=PAG; html=vTienda(r.o); sec="tienda"; t=(r.o.q?"«"+r.o.q+"»":(r.o.s||r.o.c||"Tienda online"))+TITULO; }
  else if(c.indexOf("p/")===0){ var p=POR_ID[c.slice(2)]; html=vFicha(c.slice(2)); sec="tienda"; t=(p?p.n:"Producto")+TITULO; }
  else if(c==="checkout"){ html=vCheckout(); t="Finalizar compra"+TITULO; }
  else if(c==="pedido"){ html=vPedido(); t="Pedido recibido"+TITULO; }
  else if(c==="conocenos"){ html=vConocenos(); sec=c; t="Conócenos"+TITULO; }
  else if(c==="consejos"){ html=vConsejos(); sec=c; t="Consejos de salud"+TITULO; }
  else if(c==="envios"){ html=vEnvios(); sec=c; t="Envíos y pagos"+TITULO; }
  else if(c==="contacto"){ html=vContacto(); sec=c; t="Contacto"+TITULO; }
  else { html=vNoEncontrado(); t="Página no encontrada"+TITULO; }
  document.title=t;
  app.innerHTML=html;
  document.querySelectorAll(".nav a").forEach(function(a){ if(a.dataset.nav===sec) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current"); });
  var q=document.getElementById("qTienda"); if(q&&r.o.q) q.value=r.o.q;
  var qc=document.getElementById("qCabecera"); if(qc) qc.value=(c==="tienda"?r.o.q:"");
  if(c==="checkout") restaurarFormulario();
  if(!render.mantenerScroll) window.scrollTo(0,0);
  render.mantenerScroll=false;
  if(render.yaHubo) app.focus({preventScroll:true});
  render.yaHubo=true;
  observarRevelado(); cerrarMenu();
}
window.addEventListener("hashchange",render);

/* ---------- interacción ---------- */
document.addEventListener("click",function(e){
  var t=e.target.closest("[data-anadir],[data-anadir-ficha],[data-q],[data-quitar],[data-abrir-ticket],[data-cerrar-ticket],[data-ver-mas],[data-abrir-filtros],[data-cerrar-filtros],[data-paso],[data-cerrar-menu]");
  if(!t) return;
  if(t.dataset.anadir){ anadir(t.dataset.anadir,1); t.classList.add("hecho"); t.innerHTML='<svg><use href="#i-check"/></svg>'; setTimeout(function(){ t.classList.remove("hecho"); t.innerHTML='<svg><use href="#i-mas"/></svg>'; },1400); }
  else if(t.dataset.anadirFicha){ anadir(t.dataset.anadirFicha, parseInt(document.getElementById("cant").textContent,10)||1); }
  else if(t.dataset.q){ var id=t.dataset.q; cambiar(id,(ticket[id]||0)+parseInt(t.dataset.d,10)); if(ruta().camino==="checkout"){ if(lineas().length) refrescarResumen(); else render(); } }
  else if(t.dataset.quitar){ cambiar(t.dataset.quitar,0); if(ruta().camino==="checkout"){ guardarFormulario(); render.mantenerScroll=true; render(); } }
  else if(t.hasAttribute("data-abrir-ticket")){ document.getElementById("aviso").classList.remove("ver"); abrirTicket(); }
  else if(t.hasAttribute("data-cerrar-ticket")){ cerrarTicket(); }
  else if(t.hasAttribute("data-ver-mas")){
    var l=filtrar(ruta().o), desde=mostrados; mostrados+=PAG;
    var rej=document.getElementById("rejilla"); rej.insertAdjacentHTML("beforeend", l.slice(desde,mostrados).map(tarjeta).join(""));
    var mas=t.closest(".mas");
    if(mostrados>=l.length) mas.remove(); else { mas.querySelector("span").textContent="Ves "+mostrados+" de "+nf.format(l.length); t.textContent="Ver "+Math.min(PAG,l.length-mostrados)+" más"; }
    var nuevo=rej.children[desde]; if(nuevo){ var a=nuevo.querySelector(".tarjeta__nombre"); if(a) a.focus({preventScroll:true}); }
  }
  else if(t.hasAttribute("data-abrir-filtros")){ document.getElementById("filtros").classList.add("abiertos"); capa.hidden=false; capa.dataset.filtros="1"; }
  else if(t.hasAttribute("data-cerrar-filtros")){ cerrarFiltros(); }
  else if(t.dataset.paso){ var o=document.getElementById("cant"); o.textContent=Math.max(1,Math.min(99,(parseInt(o.textContent,10)||1)+parseInt(t.dataset.paso,10))); }
  else if(t.hasAttribute("data-cerrar-menu")){ cerrarMenu(); }
});
function cerrarFiltros(){ var f=document.getElementById("filtros"); if(f) f.classList.remove("abiertos"); if(capa.dataset.filtros){ delete capa.dataset.filtros; if(!ticketEl.classList.contains("abierto")) capa.hidden=true; } }
document.getElementById("abrirTicket").addEventListener("click",function(){ ticketEl.classList.contains("abierto")?cerrarTicket():abrirTicket(); });
document.getElementById("cerrarTicket").addEventListener("click",cerrarTicket);
capa.addEventListener("click",function(){ cerrarFiltros(); cerrarTicket(); });
var menu=document.getElementById("menuMovil");
document.getElementById("abrirMenu").addEventListener("click",function(){ menu.hidden=false; this.setAttribute("aria-expanded","true"); menu.querySelector("nav a").focus(); });
function cerrarMenu(){ if(!menu.hidden){ menu.hidden=true; document.getElementById("abrirMenu").setAttribute("aria-expanded","false"); } }
menu.addEventListener("click",function(e){ if(e.target===menu||e.target.closest("nav a")) cerrarMenu(); });
document.addEventListener("keydown",function(e){ if(e.key==="Escape"){ cerrarTicket(); cerrarMenu(); cerrarFiltros(); } });
document.getElementById("buscaCabecera").addEventListener("submit",function(e){ e.preventDefault(); location.hash=urlTienda({q:document.getElementById("qCabecera").value.trim()}); });
document.addEventListener("change",function(e){
  if(e.target.id==="orden"){ var r=ruta(); r.o.o=e.target.value; location.hash=urlTienda(r.o); }
  else if(e.target.name==="zona"){ co.zona=e.target.value; var z=ZONAS.find(function(x){return x.id===co.zona;}); if(!z.pen&&co.pago==="reembolso") co.pago="tarjeta"; guardarFormulario(); render.mantenerScroll=true; render(); var el=document.querySelector('input[name="zona"][value="'+co.zona+'"]'); if(el) el.focus({preventScroll:true}); }
  else if(e.target.name==="pago"){ co.pago=e.target.value; refrescarResumen(); }
});
function guardarFormulario(){ var f=document.getElementById("formPedido"); if(!f) return; ["nombre","email","tel","dir","cp","ciudad","notas"].forEach(function(k){ if(f[k]) borrador[k]=f[k].value; }); }
function restaurarFormulario(){ var f=document.getElementById("formPedido"); if(!f) return; Object.keys(borrador).forEach(function(k){ if(f[k]) f[k].value=borrador[k]; }); }
function refrescarResumen(){ var r=document.getElementById("resumen"); if(r) r.innerHTML=resumenHTML(); }

/* búsqueda en vivo */
var activo=-1;
document.addEventListener("input",function(e){
  var inp=e.target; if(!inp.closest||!inp.closest("[data-buscador]")) return;
  var caja=document.getElementById(inp.id+"-res"), v=inp.value.trim(); activo=-1; inp.removeAttribute("aria-activedescendant");
  if(v.length<2){ caja.hidden=true; inp.setAttribute("aria-expanded","false"); return; }
  var r=buscar(v), top=r.slice(0,6);
  caja.innerHTML = top.length ? top.map(function(p,i){ return '<a class="resultado" role="option" id="'+inp.id+'-o'+i+'" href="#/p/'+p.id+'"><img src="'+IMG(p)+'" alt="" width="56" height="56"><span><span class="resultado__n">'+esc(p.n)+'</span><br><span class="resultado__c">'+esc(p.c)+' · '+esc(p.s)+'</span></span><span class="resultado__p">'+(p.p>0?fmt(p.p):'Consultar')+'</span></a>'; }).join("")+'<a class="resultados__todo" href="'+urlTienda({q:v})+'">Ver los '+nf.format(r.length)+' resultados</a>'
    : '<p class="resultados__nada">No encontramos «'+esc(v)+'» en la tienda online. <a href="'+linkWA("Hola, estoy buscando: "+v)+'" target="_blank" rel="noopener">Pregúntanos por WhatsApp</a>: quizá lo tengamos en la farmacia.</p>';
  caja.hidden=false; inp.setAttribute("aria-expanded","true");
});
document.addEventListener("keydown",function(e){
  var inp=e.target; if(inp.tagName!=="INPUT"||!inp.closest("[data-buscador]")) return;
  var caja=document.getElementById(inp.id+"-res"); if(caja.hidden) return;
  var ops=caja.querySelectorAll(".resultado"); if(!ops.length) return;
  if(e.key==="ArrowDown"||e.key==="ArrowUp"){ e.preventDefault(); activo=(activo+(e.key==="ArrowDown"?1:-1)+ops.length)%ops.length; ops.forEach(function(o,i){ o.setAttribute("aria-selected",i===activo?"true":"false"); }); inp.setAttribute("aria-activedescendant",ops[activo].id); ops[activo].scrollIntoView({block:"nearest"}); }
  else if(e.key==="Enter"&&activo>=0){ e.preventDefault(); location.hash=ops[activo].getAttribute("href"); }
  else if(e.key==="Escape"){ caja.hidden=true; inp.setAttribute("aria-expanded","false"); }
});
document.addEventListener("click",function(e){ document.querySelectorAll(".resultados").forEach(function(c){ if(!c.parentNode.contains(e.target)||e.target.closest(".resultado,.resultados__todo")){ c.hidden=true; } }); });
document.addEventListener("submit",function(e){
  var f=e.target;
  if(f.hasAttribute("data-buscador")){ e.preventDefault(); var v=f.querySelector("input").value.trim(), r=ruta(); location.hash=urlTienda(r.camino==="tienda"?Object.assign({},r.o,{q:v,s:"",b:""}):{q:v}); }
  else if(f.id==="formPedido"){ e.preventDefault(); enviarPedido(f); }
  else if(f.id==="formContacto"){ e.preventDefault(); if(!validar(f,["cnombre","cemail","cmsg"])) return; location.href="mailto:info@farmaciamoraleda.es?subject="+encodeURIComponent("Consulta de "+f.cnombre.value.trim())+"&body="+encodeURIComponent(f.cmsg.value+"\n\n"+f.cnombre.value.trim()+" · "+f.cemail.value.trim()); }
});
function marcarError(el,msg){ var p=document.getElementById(el.id+"-e"); el.setAttribute("aria-invalid",msg?"true":"false"); if(p){ p.textContent=msg||""; p.hidden=!msg; } }
function validar(f,ids){
  var primero=null;
  ids.forEach(function(id){
    var el=f[id]; if(!el) return; var v=el.value.trim(), m="";
    if(!v) m="Falta este dato.";
    else if(el.type==="email"&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) m="Revisa el correo: parece que falta la @ o el dominio.";
    else if(id==="tel"&&v.replace(/\D/g,"").length<9) m="Escribe un teléfono de al menos 9 cifras.";
    else if(id==="cp"&&co.zona!=="por"&&!/^\d{5}$/.test(v)) m="El código postal tiene 5 cifras.";
    marcarError(el,m); if(m&&!primero) primero=el;
  });
  if(primero) primero.focus();
  return !primero;
}
document.addEventListener("focusout",function(e){ var el=e.target; if(el.getAttribute&&el.getAttribute("aria-invalid")==="true"&&el.value.trim()) marcarError(el,""); });
function enviarPedido(f){
  var ids=["nombre","email","tel"]; if(co.zona!=="rec") ids=ids.concat(["dir","cp","ciudad"]);
  if(!validar(f,ids)) return;
  var c=costes();
  ultimoPedido={num:"DEMO-"+String(Date.now()).slice(-6),nombre:f.nombre.value.trim(),email:f.email.value.trim(),zona:c.z.n,
    envio:c.confirmar?"a confirmar":fmt(c.envio), rec:c.rec?fmt(c.rec):"",
    total:fmt(c.total)+(c.confirmar?" + envío":""), despacho:despachoTexto(),
    lineas:lineas().map(function(l){ return {q:l.q,n:l.p.n,t:l.p.p*l.q}; })};
  borrador={}; vaciar(); location.hash="#/pedido";
}

/* revelado al hacer scroll (contenido visible por defecto si no hay soporte) */
var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add("visto"); io.unobserve(en.target); } }); },{rootMargin:"0px 0px -6% 0px"}) : null;
function observarRevelado(){ document.querySelectorAll(".revela").forEach(function(el){ if(io) io.observe(el); else el.classList.add("visto"); }); }

pintarTicket();
render();
})();
