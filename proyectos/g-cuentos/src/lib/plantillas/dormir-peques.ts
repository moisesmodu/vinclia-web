import type { Plantilla } from "./tipos";

// Colección DORMIR · 2–4 años · «{nombre} y la luz de la luna» (18 páginas)
// Estribillo para repetir juntos: «Luz, lucita, luz de luna: aquí no hay miedo ninguno».
// Las páginas con `base` reutilizan las 12 ilustraciones del cuento de muestra de Leo.
export const dormirPeques: Plantilla = {
  coleccion: "dormir",
  banda: "peques",
  titulo: { es: "{nombre} y la luz de la luna", ca: "{Elnom} i la llum de la lluna" },
  portada:
    "{NINO} floating gently above the night rooftops of {CIUDAD}, holding hands with {LUNILLA}, {COMPA} floating beside them, big round moon in the upper right corner, deep blue starry sky",
  contraportada: {
    es: "Un cuento de buenas noches con estribillo para decir juntos y perder el miedo a la noche.",
    ca: "Un conte de bona nit amb una tornada per dir junts i perdre la por de la nit.",
  },
  paginas: [
    {
      base: 1,
      texto: {
        es: "En {ciudad} se encendían las farolas. Una, dos, tres… ¡clic, clic, clic! {nombre} ya llevaba el pijama puesto, y {compa} bostezaba a los pies de la cama: ¡aaaaah!",
        ca: "A {ciudad} s'encenien els fanals. Un, dos, tres… clic, clic, clic! {Elnom} ja portava el pijama posat, i {compa} badallava als peus del llit: aaaaah!",
      },
      escena:
        "cozy children's bedroom at dusk, {NINO} sitting on the bed in pajamas yawning, {COMPA} curled at the foot of the bed, {AFICION} on the shelf, window showing the street lamps of {CIUDAD} lighting up",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Un beso de {arropa}. Un abrazo de {arropa}. «Buenas noches, {nombre}. Que sueñes con {aficion}». Y la luz se apagó: ¡clic!",
        ca: "Un petó de {arropa}. Una abraçada de {arropa}. «Bona nit, {nombrePelado}. Que somiïs amb {aficion}». I el llum es va apagar: clic!",
      },
      escena:
        "wide view of the bedroom at night from the doorway, a loving family member seen from behind leaning over the bed to kiss {NINO} goodnight, warm light from the hallway, {COMPA} on the blanket, hand reaching for the light switch",
      ropa: "pijama",
    },
    {
      base: 2,
      texto: {
        es: "Todo estaba muy quieto. {tema.problema}",
        ca: "Tot estava molt quiet. {tema.problema}",
      },
      escena:
        "dark bedroom lit only by blue moonlight from the window, {NINO} peeking anxiously over the blanket pulled up to the nose, long shadows of furniture on the wall, {COMPA} close by",
      ropa: "pijama",
    },
    {
      base: 3,
      texto: {
        es: "Toc, toc. ¿Quién llamaba a la ventana? Era una lucecita pequeña con bufanda. —Hola, {nombre}. Soy Lunilla, un trocito de luna.",
        ca: "Toc, toc. Qui trucava a la finestra? Era una llumeta petita amb bufanda. —Hola, {nombrePelado}. Soc la Lunilla, un trosset de lluna.",
      },
      escena:
        "{LUNILLA} knocking on the bedroom window from outside, {NINO} sitting up in bed in surprise, {COMPA} ears perked up, warm glow spilling into the dark room",
      ropa: "pijama",
    },
    {
      texto: {
        es: "—Te traigo unas palabras mágicas —dijo Lunilla—. Repítelas conmigo: «Luz, lucita, luz de luna: aquí no hay miedo ninguno». {nombre} las dijo bajito. ¡Funcionaban!",
        ca: "—Et porto unes paraules màgiques —va dir la Lunilla—. Repeteix-les amb mi: «Llum, llumeta, llum de lluna: aquí no hi ha cap por». {Elnom} les va dir baixet. Funcionaven!",
      },
      escena:
        "{LUNILLA} floating inside the bedroom glowing softly like a night light, {NINO} sitting up in bed whispering with a small brave smile, {COMPA} listening with tilted head, the room now bathed in warm golden light",
      ropa: "pijama",
    },
    {
      base: 4,
      texto: {
        es: "—¿Vamos a ver la noche? —preguntó Lunilla. {nombre} miró a {compa}. ¡Y {mascota} ya estaba en la ventana, con ganas de aventura!",
        ca: "—Anem a veure la nit? —va preguntar la Lunilla. {Elnom} va mirar {compa}. I {compa} ja era a la finestra, amb ganes d'aventura!",
      },
      escena:
        "the bedroom window wide open, {LUNILLA} hovering outside offering her little hand, {NINO} climbing curiously toward the window, {COMPA} already on the windowsill, starry sky",
      ropa: "pijama",
    },
    {
      base: 5,
      texto: {
        es: "¡Arriba, arriba, arriba! Volaron sobre los tejados de {ciudad}. Las ventanas encendidas parecían botones de luz. ¿Cuántas cuentas tú?",
        ca: "Amunt, amunt, amunt! Van volar per sobre les teulades de {ciudad}. Les finestres enceses semblaven botons de llum. Quantes en comptes, tu?",
      },
      escena:
        "{NINO} and {COMPA} floating through the night sky above the rooftops of {CIUDAD}, holding hands with {LUNILLA}, patchwork of roofs and warm lit windows below, deep blue sky full of stars",
      ropa: "pijama",
    },
    {
      base: 6,
      texto: {
        es: "En lo alto de un árbol, una lechuza abrió sus ojos amarillos. ¡Uuh, uuh! —Hola, {nombre}. De noche yo juego, y tú descansas.",
        ca: "Dalt d'un arbre, una òliba va obrir els seus ulls grocs. Uuh, uuh! —Hola, {nombrePelado}. De nit jo jugo, i tu descanses.",
      },
      escena:
        "a friendly white barn owl with big yellow eyes sitting on a tree branch at night talking to {NINO} who floats beside the branch with {COMPA}, {LUNILLA} lighting the scene softly",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Abajo, en {lugarPlaza}, todo dormía: dormían los bancos, dormían las palomas, y hasta el agua de la fuente hacía chof… chof… muy bajito.",
        ca: "A baix, a {lugarPlaza}, tot dormia: dormien els bancs, dormien els coloms, i fins i tot l'aigua de la font feia xof… xof… molt baixet.",
      },
      escena:
        "wide view from above of a sleeping square in {LUGAR} at night, pigeons asleep on a bench, a quiet fountain, closed market stalls, {NINO} and {COMPA} floating above with {LUNILLA}, everything calm in shades of deep blue",
      ropa: "pijama",
    },
    {
      base: 7,
      texto: {
        es: "Lunilla sopló, ffffff, y las estrellas se movieron hasta dibujar {forma}. —¡Es lo que más me gusta! —rio {nombre}.",
        ca: "La Lunilla va bufar, ffffff, i les estrelles es van moure fins a dibuixar {forma}. —És el que més m'agrada! —va riure {elnom}.",
      },
      escena:
        "magical night sky where the stars connect into a big glowing constellation shaped like {AFICION}, {NINO} laughing and pointing up at it, {COMPA} looking up amazed, {LUNILLA} blowing stardust",
      ropa: "pijama",
    },
    {
      texto: {
        es: "—Y esta es para ti —dijo Lunilla. Era una estrella pequeña de color {color}, el color favorito de {nombre}. Brillaba, brillaba, brillaba en su mano.",
        ca: "—I aquesta és per a tu —va dir la Lunilla. Era una estrella petita de color {color}, el color preferit {delnom}. Brillava, brillava, brillava a la seva mà.",
      },
      escena:
        "{NINO} floating in the night sky holding a small glowing {COLOR} star in cupped hands, the {COLOR} light reflecting on the child's delighted face, {COMPA} sniffing it curiously, {LUNILLA} smiling beside them",
      ropa: "pijama",
    },
    {
      base: 8,
      texto: {
        es: "Pero en el parque… ¡una sombra enorme! Orejas largas. Garras largas. A {nombre} le temblaron las rodillas. Lunilla susurró: «Luz, lucita, luz de luna…».",
        ca: "Però al parc… una ombra enorme! Orelles llargues. Urpes llargues. A {elnom} li van tremolar els genolls. La Lunilla va xiuxiuejar: «Llum, llumeta, llum de lluna…».",
      },
      escena:
        "a night park, a huge dark spooky shadow with long ears and claw-like shapes stretched across the grass, {NINO} trembling a little but standing, {LUNILLA} whispering in the child's ear, the pet is not visible in this scene (it is hidden, making the shadow)",
      ropa: "pijama",
    },
    {
      texto: {
        es: "{nombre} respiró hondo, una vez, dos veces, y terminó {solito|solita}: «…aquí no hay miedo ninguno». Y miró la sombra despacito, despacito.",
        ca: "{Elnom} va respirar fondo, una vegada, dues vegades, i va acabar {tot sol|tota sola}: «…aquí no hi ha cap por». I va mirar l'ombra a poc a poc, a poc a poc.",
      },
      escena:
        "{NINO} standing bravely in the night park with eyes closed taking a deep breath, hands on the tummy, {LUNILLA} glowing brighter beside the child, the big shadow on the grass already looking a bit smaller and funnier, the pet still not visible",
      ropa: "pijama",
    },
    {
      base: 9,
      texto: {
        es: "¡Las orejas eran dos hojas! ¡Las garras eran ramitas! Y la sombra entera… ¡era {mascota}, estirándose bajo una farola! Ja, ja, ja. ¡Qué risa!",
        ca: "Les orelles eren dues fulles! Les urpes eren branquetes! I l'ombra sencera… era {compa}, estirant-se sota un fanal! Ha, ha, ha. Quin riure!",
      },
      escena:
        "the same night park, the big shadow revealed to be just {COMPA} stretching under a street lamp with two leaves and some twigs making the funny shape, {NINO} laughing out loud, a tiny cricket waking up on a leaf, {LUNILLA} smiling",
      ropa: "pijama",
    },
    {
      base: 10,
      texto: {
        es: "Lunilla se arrancó un trocito de luz y se lo puso a {nombre} aquí, en el pecho, junto al corazón. —Para que lo guardes. Cuando tengas miedo, notarás que brilla.",
        ca: "La Lunilla es va arrencar un trosset de llum i el va posar al pit {delnom}, aquí, al costat del cor. —Perquè el guardis. Quan tinguis por, notaràs que brilla.",
      },
      escena:
        "close tender moment, {LUNILLA} placing a small glowing star of light on the chest of {NINO}, over the heart, warm golden glow on the child's face, {COMPA} watching, night sky background",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Y de vuelta a casa. Adiós, lechuza. Adiós, tejados. Adiós, estrellas. Mañana {nombre} se lo contaría todo a {amigo}.",
        ca: "I cap a casa. Adéu, òliba. Adéu, teulades. Adéu, estrelles. L'endemà {elnom} ho explicaria tot a {amigo}.",
      },
      escena:
        "{NINO} and {COMPA} floating back toward the open bedroom window holding hands with {LUNILLA}, the barn owl waving a wing from a tree, rooftops of {CIUDAD} below, stars twinkling, sleepy happy mood",
      ropa: "pijama",
    },
    {
      base: 11,
      texto: {
        es: "Ya en la cama, {calentito|calentita}, {nombre} miró alrededor: la silla era la silla, el armario era el armario. {tema.leccion}",
        ca: "Ja al llit, ben {calentó|calentona}, {elnom} va mirar al voltant: la cadira era la cadira, l'armari era l'armari. {tema.leccion}",
      },
      escena:
        "the cozy bedroom again in soft moonlight, everything calm and friendly, {NINO} tucked into bed smiling peacefully, {COMPA} snuggled beside, a faint golden glow on the child's chest, {LUNILLA} waving goodbye at the window",
      ropa: "pijama",
    },
    {
      base: 12,
      texto: {
        es: "{nombre} abrazó a {compa} y cerró los ojos. —Buenas noches, {nombre} —susurró Lunilla—. Y ahora, todos juntos y muy bajito: «Buenas noches, luna; buenas noches, Lunilla».",
        ca: "{Elnom} va abraçar {compa} i va tancar els ulls. —Bona nit, {nombrePelado} —va xiuxiuejar la Lunilla—. I ara, tots junts i molt baixet: «Bona nit, lluna; bona nit, Lunilla».",
      },
      escena:
        "{NINO} fast asleep hugging {COMPA} in bed, view through the window of a big bright moon over the sleeping rooftops of {CIUDAD}, {LUNILLA} smiling from the sky, peaceful deep blue night",
      ropa: "pijama",
    },
  ],
};
