import type { Plantilla } from "./tipos";

// Colección DORMIR · «{nombre} y la luz de la luna»
// Frase final para decir juntos (MARCAS.md, voz de Lunilla) en la página 12.
// Arco: noche → miedo (tema) → visita de Lunilla → paseo nocturno → la sombra → truco → regalo → dormir.
export const dormir: Plantilla = {
  coleccion: "dormir",
  titulo: { es: "{nombre} y la luz de la luna", ca: "{Elnom} i la llum de la lluna" },
  portada:
    "{NINO} floating gently above the night rooftops of {CIUDAD}, holding hands with {LUNILLA}, {COMPA} floating beside them, big round moon in the upper right corner, deep blue starry sky",
  contraportada: {
    es: "Un cuento de buenas noches para perder el miedo y dormir tranquilos.",
    ca: "Un conte de bona nit per perdre la por i dormir tranquils.",
  },
  paginas: [
    {
      texto: {
        es: "En {ciudad} se encendían las farolas una a una. {nombre} se había pasado el día pensando en {aficion}, y ahora, con el pijama puesto y {compa} a los pies de la cama, había llegado la hora de dormir.",
        ca: "A {ciudad} s'encenien els fanals un per un. {Elnom} s'havia passat el dia pensant en {aficion}, i ara, amb el pijama posat i {compa} als peus del llit, havia arribat l'hora de dormir.",
      },
      escena:
        "cozy children's bedroom at dusk, {NINO} sitting on the bed in pajamas yawning, {COMPA} curled at the foot of the bed, {AFICION} on the shelf, window showing the street lamps of {CIUDAD} lighting up",
      ropa: "pijama",
    },
    {
      texto: {
        es: "«Buenas noches», dijeron desde la puerta. Clic. {tema.problema}",
        ca: "«Bona nit», van dir des de la porta. Clic. {tema.problema}",
      },
      escena:
        "dark bedroom lit only by blue moonlight from the window, {NINO} peeking anxiously over the blanket pulled up to the nose, long shadows of furniture on the wall, {COMPA} close by",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Entonces sonó un toc, toc muy suave en el cristal. Al otro lado de la ventana flotaba una lucecita con forma de media luna. —Hola, {nombre}. Soy Lunilla, un trocito de luna. Te he oído suspirar desde allá arriba.",
        ca: "Llavors va sonar un toc, toc molt suau al vidre. A l'altra banda de la finestra surava una llumeta amb forma de mitja lluna. —Hola, {nombrePelado}. Soc la Lunilla, un trosset de lluna. T'he sentit sospirar des de dalt.",
      },
      escena:
        "{LUNILLA} knocking on the bedroom window from outside, {NINO} sitting up in bed in surprise, {COMPA} ears perked up, warm glow spilling into the dark room",
      ropa: "pijama",
    },
    {
      texto: {
        es: "—¿Quieres ver lo que pasa en {ciudad} cuando todo el mundo duerme? —preguntó Lunilla. {nombre} miró a {compa}. Y {mascota} ya estaba en la ventana, con ganas de aventura.",
        ca: "—Vols veure què passa a {ciudad} quan tothom dorm? —va preguntar la Lunilla. {Elnom} va mirar {compa}. I {compa} ja era a la finestra, amb ganes d'aventura.",
      },
      escena:
        "the bedroom window wide open, {LUNILLA} hovering outside offering her little hand, {NINO} climbing curiously toward the window, {COMPA} already on the windowsill, starry sky",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Y salieron flotando, ligeros como pompas de jabón. Desde arriba, los tejados de {ciudad} parecían una colcha de retales, y las ventanas encendidas, botones de luz.",
        ca: "I van sortir surant, lleugers com bombolles de sabó. Des de dalt, les teulades de {ciudad} semblaven un edredó de retalls, i les finestres enceses, botons de llum.",
      },
      escena:
        "{NINO} and {COMPA} floating through the night sky above the rooftops of {CIUDAD}, holding hands with {LUNILLA}, patchwork of roofs and warm lit windows below, deep blue sky full of stars",
      ropa: "pijama",
    },
    {
      texto: {
        es: "En lo alto de un árbol, una lechuza abrió sus grandes ojos amarillos. —Uuh, uuh. Para nosotras, la noche es el mejor momento del día —dijo—. Todo está tranquilo y se oye hasta a las estrellas.",
        ca: "Dalt d'un arbre, una òliba va obrir els seus grans ulls grocs. —Uuh, uuh. Per a nosaltres, la nit és el millor moment del dia —va dir—. Tot és tranquil i fins i tot se senten les estrelles.",
      },
      escena:
        "a friendly white barn owl with big yellow eyes sitting on a tree branch at night talking to {NINO} who floats beside the branch with {COMPA}, {LUNILLA} lighting the scene softly",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Lunilla sopló hacia el cielo y las estrellas se movieron hasta dibujar {forma}. —¡Es lo que más me gusta! —rio {nombre}. —Lo sé —dijo Lunilla—. La noche también sabe lo que te hace feliz.",
        ca: "La Lunilla va bufar cap al cel i les estrelles es van moure fins a dibuixar {forma}. —És el que més m'agrada! —va riure {elnom}. —Ho sé —va dir la Lunilla—. La nit també sap què et fa feliç.",
      },
      escena:
        "magical night sky where the stars connect into a big glowing constellation shaped like {AFICION}, {NINO} laughing and pointing up at it, {COMPA} looking up amazed, {LUNILLA} blowing stardust",
      ropa: "pijama",
    },
    {
      texto: {
        es: "De pronto, en el parque, apareció una sombra enorme, con orejas largas y garras afiladas. A {nombre} le temblaron las rodillas. Lunilla le susurró: —{tema.ayuda}",
        ca: "De sobte, al parc, va aparèixer una ombra enorme, amb orelles llargues i urpes esmolades. A {elnom} li van tremolar els genolls. La Lunilla li va xiuxiuejar: —{tema.ayuda}",
      },
      escena:
        "a night park, a huge dark spooky shadow with long ears and claw-like shapes stretched across the grass, {NINO} trembling a little but standing, {LUNILLA} whispering in the child's ear, the pet is not visible in this scene (it is hidden, making the shadow)",
      ropa: "pijama",
    },
    {
      texto: {
        es: "{nombre} respiró hondo, una vez, dos veces, y miró la sombra despacito. ¡Las orejas eran dos hojas, las garras eran ramitas… y la sombra entera era {mascota}, estirándose bajo una farola! {nombre} se rio tan fuerte que despertó a un grillo.",
        ca: "{Elnom} va respirar fondo, una vegada, dues vegades, i va mirar l'ombra a poc a poc. Les orelles eren dues fulles, les urpes eren branquetes… i l'ombra sencera era {compa}, estirant-se sota un fanal! {Elnom} va riure tan fort que va despertar un grill.",
      },
      escena:
        "the same night park, the big shadow revealed to be just {COMPA} stretching under a street lamp with two leaves and some twigs making the funny shape, {NINO} laughing out loud, a tiny cricket waking up on a leaf, {LUNILLA} smiling",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Antes de volver, Lunilla se arrancó un trocito de luz y se lo puso a {nombre} en el pecho, justo encima del corazón. —Para que lo guardes. Cuando tengas miedo, cierra los ojos y lo notarás brillar.",
        ca: "Abans de tornar, la Lunilla es va arrencar un trosset de llum i el va posar al pit {delnom}, just damunt del cor. —Perquè el guardis. Quan tinguis por, tanca els ulls i el notaràs brillar.",
      },
      escena:
        "close tender moment, {LUNILLA} placing a small glowing star of light on the chest of {NINO}, over the heart, warm golden glow on the child's face, {COMPA} watching, night sky background",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Entraron otra vez por la ventana y {nombre} se metió en la cama, {calentito|calentita}. Miró alrededor: la silla era la silla, el armario era el armario. {tema.leccion}",
        ca: "Van tornar a entrar per la finestra i {elnom} es va ficar al llit, ben {calentó|calentona}. Va mirar al voltant: la cadira era la cadira, l'armari era l'armari. {tema.leccion}",
      },
      escena:
        "the cozy bedroom again in soft moonlight, everything calm and friendly, {NINO} tucked into bed smiling peacefully, {COMPA} snuggled beside, a faint golden glow on the child's chest, {LUNILLA} waving goodbye at the window",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Y así, abrazando a {mascota}, {nombre} cerró los ojos. Allá arriba, la luna brillaba un poquito más que de costumbre. —Buenas noches, {nombre} —susurró Lunilla—. Mañana te espero. Y ahora, todos juntos y muy bajito: «Buenas noches, luna; buenas noches, Lunilla».",
        ca: "I així, abraçant {compa}, {elnom} va tancar els ulls. Allà dalt, la lluna brillava una mica més que de costum. —Bona nit, {nombrePelado} —va xiuxiuejar la Lunilla—. Demà t'espero. I ara, tots junts i molt baixet: «Bona nit, lluna; bona nit, Lunilla».",
      },
      escena:
        "{NINO} fast asleep hugging {COMPA} in bed, view through the window of a big bright moon over the sleeping rooftops of {CIUDAD}, {LUNILLA} smiling from the sky, peaceful deep blue night",
      ropa: "pijama",
    },
  ],
};
