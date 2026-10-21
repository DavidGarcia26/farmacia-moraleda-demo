# DESIGN · Farmacia Moraleda (demo BiselLab)

Mundo visual: **El Mostrador**. La web es el mostrador de la farmacia: te atienden, no te autosirves.

## Color (del logo)
| Token | Valor | Uso |
|---|---|---|
| --mg | #EC008E | Magenta del logo: encimera, campos grandes, titulares acentuados |
| --mg-boton | #D4007F | Botones y frente del mostrador con texto blanco (AA 5,1:1) |
| --mg-tinta | #B5006E | Texto magenta sobre claro (6,6:1) |
| --mg-hondo | #7E004C | Pie de página |
| --vd | #A5CC5F | Verde del logo: cruz «abierto», botón WhatsApp (texto oscuro) |
| --vd-tinta | #4D6B1A | Texto verde sobre claro |
| --tinta / --tinta-2 | #2A1020 / #6E5563 | Texto principal / secundario |
| --fondo / --papel | #FBF8FA / #FFFFFF | Suelo / papel de notas, tickets y tarjetas |

## Tipografía (autoalojada en assets/fonts)
- Bricolage Grotesque (variable): titulares y precios.
- Figtree 400–700: texto.
- Azeret Mono: solo ticket de caja y tarifas (lenguaje de recibo).
- Kalam: solo notas manuscritas cortas.

## Piezas del mundo
- **Notas de papel** (.nota): datos reales (envío, 14:00, WhatsApp), giro leve y cinta verde.
- **Frente del mostrador** (.mostrador): encimera + frente magenta con estado abierto/cerrado calculado del horario; productos destacados de pie sobre la encimera.
- **Ticket de caja** (.ticket, .recibo): carrito y tarifas en papel térmico con borde dentado; cada línea nueva «se imprime».
- **Pasillos**: categorías como lista de pasillos con la cruz verde.

## Reglas
- Solo datos del dossier y del índice CSV; nada inventado (sin reseñas, servicios ni cifras propias).
- Sin banners de promociones caducadas.
- Contraste AA, objetivos táctiles ≥44 px, foco visible magenta, prefers-reduced-motion respetado.
