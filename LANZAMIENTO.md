# Lanzamiento de Mascotadas

## Antes de abrir las cuentas

- [ ] Buscar «Mascotadas» en la OEPM y la EUIPO, por si la marca ya existe.
- [ ] Comprar `mascotadas.com`.
- [ ] Preguntar a tu gestoría cómo declarar el IVA de ventas digitales a particulares (y el OSS si vendes fuera de España).
- [ ] Confirmar que tu plan de ElevenLabs es de pago (licencia comercial) y leer su política de usos prohibidos.

## Cuentas y claves

Cada valor va como variable en Railway, nunca en el repositorio ni en el chat. La lista está en `.env.example`.

### Anthropic

- [ ] Crear una clave de API y recargar saldo: `ANTHROPIC_API_KEY`.

### Supabase

- [ ] Crear un proyecto en una región de la UE.
- [ ] Ejecutar `schema.sql` en el editor SQL.
- [ ] En Authentication, poner `https://mascotadas.com` como Site URL y como Redirect URL.
- [ ] Conectar un proveedor de correo propio (SMTP): el de Supabase no es para producción.
- [ ] Copiar `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_KEY`.

### Stripe

- [ ] Activar la cuenta con tus datos de autónomo.
- [ ] Crear los tres precios, con impuestos incluidos:
  - `STRIPE_PRECIO_BASICO`: 4,99 € al mes.
  - `STRIPE_PRECIO_PREMIUM`: 19,99 € al mes.
- [ ] Activar Stripe Tax y añadir el registro de IVA de España (sin él, Stripe no calcula el IVA: sale 0,00 €).
- [ ] Tras activar la cuenta, poner `https://mascotadas.com/condiciones` en Configuración → Empresa → Datos de la empresa, y `STRIPE_PEDIR_CONDICIONES=si` en Railway.
- [ ] Activar el portal de clientes: cancelar, cambiar tarjeta y ver facturas.
- [ ] Crear el webhook a `https://mascotadas.com/api/stripe` con `customer.subscription.created`, `.updated` y `.deleted`: `STRIPE_WEBHOOK_SECRET`.
- [ ] Copiar `STRIPE_SECRET_KEY`. Empezar con las claves de prueba.

## Despliegue

- [ ] Subir el repositorio a GitHub, privado.
- [ ] Crear un servicio en Railway desde ese repositorio. Arranca solo con `npm start`.
- [ ] Añadir las variables de `.env.example`.
- [ ] Conectar `mascotadas.com` y `www` en Railway y en el DNS.

## Textos legales

- [ ] Sustituir `[NOMBRE Y APELLIDOS]`, `[NIF]`, `[DOMICILIO FISCAL]` y `[EMAIL DE CONTACTO]` en `public/aviso-legal.html`, `public/condiciones.html` y `public/privacidad.html`.
- [ ] Revisarlos con un profesional: son un borrador.

## Prueba final, con claves de prueba de Stripe

- [ ] Entrar con el enlace del email.
- [ ] Empezar la prueba gratis con tarjeta de prueba y comprobar que Stripe no cobra nada hoy y programa 4,99 € a los 3 días.
- [ ] Activar en Stripe el aviso por email antes de que acabe la prueba (Configuración → Billing → Suscripciones y emails).
- [ ] Crear 3 historias con Opus y comprobar que el cuarto pide Premium.
- [ ] Revisar varios historias a mano: calidad, humor y datos raros en la manía.
- [ ] Escuchar una historia entero y guardarlo en PDF.
- [ ] Medir el coste real por historia y compararlo con los 0,19 € estimados.
- [ ] Pasar a Premium, cancelar desde el portal y borrar la cuenta.
- [ ] Cambiar a las claves reales y hacer un pago real propio.
