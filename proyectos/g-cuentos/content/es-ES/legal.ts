import type { DocumentoLegal } from "../tipos";

// Borradores redactados por Claude para revisar con el gestor antes de abrir. Datos del titular en
// src/config/paises/es-ES.json (legal). {TITULAR}, {NIF}, {DOMICILIO}, {EMAIL} se sustituyen al mostrar.
export const LEGAL_ES: DocumentoLegal[] = [
  {
    slug: "aviso-legal",
    titulo: "Aviso legal",
    secciones: [
      { h2: "Titular", parrafos: ["En cumplimiento del artículo 10 de la Ley 34/2002 (LSSI-CE), este sitio web es titularidad de {TITULAR}, con NIF {NIF} y domicilio en {DOMICILIO}. Correo de contacto: {EMAIL}. Lunilla es el nombre comercial con el que opera."] },
      { h2: "Objeto", parrafos: ["La web permite crear y comprar cuentos infantiles personalizados en formato digital (PDF) e impreso (tapa dura)."] },
      { h2: "Propiedad intelectual", parrafos: ["Las plantillas narrativas, los personajes, el diseño y el código de la web pertenecen al titular. El cliente puede usar el cuento comprado para uso privado y familiar, imprimirlo y compartirlo con su familia; no puede revenderlo."] },
      { h2: "Contenido creado con inteligencia artificial", parrafos: ["Los textos y las ilustraciones de cada cuento se generan con ayuda de herramientas de inteligencia artificial a partir de plantillas escritas y revisadas por el titular. Así se indica también en el colofón de cada libro."] },
      { h2: "Responsabilidad", parrafos: ["El titular no se hace responsable del mal uso de la web ni de los contenidos que los usuarios escriban en los campos libres (por ejemplo, la dedicatoria)."] },
    ],
  },
  {
    slug: "privacidad",
    titulo: "Política de privacidad",
    secciones: [
      { h2: "Responsable", parrafos: ["{TITULAR}, NIF {NIF}, {DOMICILIO}. Contacto: {EMAIL}."] },
      { h2: "Qué datos tratamos y para qué", parrafos: ["Para escribir el cuento: el nombre de pila del niño o la niña, su edad, la ciudad, el nombre y tipo de su mascota, su afición, el tema elegido y la dedicatoria. No pedimos ni tratamos fotografías ni apellidos del menor. Si lo eliges, también: el aspecto del protagonista (tono de piel, pelo, peinado, gafas, pecas) y su color favorito, quién le da las buenas noches (por ejemplo «la abuela»), el nombre de pila de su mejor amigo o amiga y un detalle o una idea que escribes libremente. Te pedimos que no pongas apellidos, direcciones ni datos de salud.", "Para entregar el pedido: tu correo electrónico y, si compras el libro impreso, tu nombre, dirección postal y teléfono.", "Para el programa de afiliadas: nombre, correo, red social y datos de cobro de quien se apunta."] },
      { h2: "Base legal", parrafos: ["La ejecución del contrato de compraventa (artículo 6.1.b del RGPD) para crear y entregar el cuento; el cumplimiento de obligaciones legales (6.1.c) para la facturación; y tu consentimiento (6.1.a) para la cookie de afiliación. Si marcas «recuérdamelo una sola vez», tu consentimiento (6.1.a) para enviarte un único correo si no terminas la compra; puedes no marcarlo y nunca te escribiremos sin pedido."] },
      { h2: "Datos de menores", parrafos: ["Los datos del menor los facilita una persona adulta (madre, padre, familiar) con el único fin de personalizar el cuento. Se limitan al nombre de pila y a preferencias sin carácter sensible."] },
      { h2: "Conservación", parrafos: ["Los borradores no comprados se eliminan a los 30 días. Los pedidos se conservan el tiempo exigido por la normativa fiscal (6 años) y los archivos del cuento, 12 meses para que puedas volver a descargarlo, salvo que pidas antes su supresión."] },
      { h2: "Quién nos ayuda (encargados del tratamiento)", parrafos: ["Vercel (alojamiento), Neon (base de datos), Stripe (pagos), Resend (correo), Gelato (impresión y envío del libro), Anthropic (generación del texto) y Higgsfield (generación de ilustraciones). Algunos están fuera del Espacio Económico Europeo; las transferencias se amparan en el Marco de Privacidad de Datos UE-EE. UU. o en cláusulas contractuales tipo. A los servicios de IA solo se envían los datos necesarios para el cuento, nunca tu correo ni tu dirección."] },
      { h2: "Tus derechos", parrafos: ["Puedes pedir acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a {EMAIL}. Si no te atendemos bien, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es)."] },
    ],
  },
  {
    slug: "cookies",
    titulo: "Política de cookies",
    secciones: [
      { h2: "Qué cookies usamos", parrafos: ["Esta web no usa cookies de publicidad ni de analítica de terceros.", "Cookie «afiliado» (propia, 30 días): solo se instala si llegas desde el enlace de una persona colaboradora y aceptas el aviso; sirve para atribuirle la venta. Si no la aceptas, no se instala.", "Stripe, al pagar, puede instalar cookies técnicas necesarias para prevenir el fraude en su propia página de pago."] },
      { h2: "Cómo eliminarlas", parrafos: ["Puedes borrar las cookies desde la configuración de tu navegador en cualquier momento."] },
    ],
  },
  {
    slug: "condiciones",
    titulo: "Condiciones de venta",
    secciones: [
      { h2: "Producto", parrafos: ["Cuento infantil personalizado de 18 páginas ilustradas (de 2 a 4 años) o 22 (de 5 a 8), en dos formatos: PDF descargable y libro impreso de tapa dura de 20 × 20 cm y 30 páginas interiores (que incluye también el PDF). Antes de pagar puedes ver gratis una vista previa de las primeras páginas; las ilustraciones de la vista previa son de muestra."] },
      { h2: "Precios", parrafos: ["Los precios se muestran en euros con el IVA incluido (4 % para libros). El libro impreso incluye el envío a la península y las Islas Baleares. De momento no enviamos a Canarias, Ceuta ni Melilla."] },
      { h2: "Pago", parrafos: ["El pago se realiza con tarjeta u otros medios a través de Stripe. No guardamos los datos de tu tarjeta."] },
      { h2: "Entrega", parrafos: ["El PDF se envía al correo indicado, normalmente en menos de 2 horas. El libro impreso se fabrica bajo demanda y suele llegar en unos 5 a 7 días laborables; las fechas límite para Navidad y Reyes se publican en la portada de la web."] },
      { h2: "Derecho de desistimiento", parrafos: ["Al tratarse de un producto confeccionado conforme a las especificaciones del consumidor y claramente personalizado, no se aplica el derecho de desistimiento (artículo 103.c del Real Decreto Legislativo 1/2007). Para el PDF, al aceptar la compra das tu consentimiento a que la entrega empiece de inmediato y reconoces que pierdes el derecho de desistimiento (artículo 103.m)."] },
      { h2: "Nuestra garantía", parrafos: ["Si el cuento no te gusta, te lo rehacemos gratis una vez (texto, ilustraciones o ambos). Si el libro llega dañado o con un defecto de impresión, lo reimprimimos sin coste: escríbenos a {EMAIL} con una foto en los 14 días siguientes a la entrega."] },
      { h2: "Ley aplicable", parrafos: ["Estas condiciones se rigen por la ley española. Para cualquier controversia serán competentes los juzgados del domicilio del consumidor. También puedes usar la plataforma europea de resolución de litigios en línea."] },
    ],
  },
];
