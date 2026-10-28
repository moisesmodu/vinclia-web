import type { Plantilla } from "./tipos";

// Colección HERMANITO NUEVO · peques (2–4 años) · «{nombre} y el corazón que crece»
// Estribillo para tocarse el pecho: «Tum, tum, tum». Una idea por página, frases cortas.
// Familia en neutro; {arropa} solo tras preposición. Sin pronombres que concuerden con {objeto} o {compa}.
export const hermanitoPeques: Plantilla = {
  coleccion: "hermanito",
  banda: "peques",
  titulo: {
    es: "{nombre} y el corazón que crece",
    ca: "{Elnom} i el cor que creix",
  },
  portada:
    "{NINO} sitting on a soft rug gently holding {BEBE} on the lap, {COMPA} snuggled beside them, cozy living room with warm light and a big window, a few floating heart shapes, {LUNILLA} smiling in the upper right corner of the sky outside the window",
  contraportada: {
    es: "Un cuento para los más pequeños de la casa: llega un bebé y el corazón se hace más grande.",
    ca: "Un conte per als més petits de casa: arriba un nadó i el cor es fa més gran.",
  },
  paginas: [
    {
      texto: {
        es: "En una casa de {ciudad} vivían {nombre} y {compa}. Una noche, en la cena, le contaron un secreto muy grande: —Pronto llegará un bebé a casa. Tum, tum, tum, hizo el corazón de {nombre}.",
        ca: "En una casa de {ciudad} hi vivien {elnom} i {compa}. Una nit, al sopar, li van explicar un secret molt gran: —Aviat arribarà un nadó a casa. Tum, tum, tum, va fer el cor {delnom}.",
      },
      escena:
        "wide view of a warm family dinner table at home in {CIUDAD}, {NINO} with wide surprised eyes and both hands on the chest, adults smiling softly at the edges of the table, {COMPA} under the table looking up",
      ropa: "dia",
    },
    {
      texto: {
        es: "Poco a poco, la casa se llenó de cosas pequeñas: una cuna, un sonajero y unos calcetines diminutos. Y {nombre} eligió los más bonitos: unos de color {color}. ¿Los ves? ¡Qué pequeñitos!",
        ca: "A poc a poc, la casa es va omplir de coses petites: un bressol, un sonall i uns mitjons diminuts. I {elnom} va triar els més bonics: uns de color {color}. Els veus? Que petitets!",
      },
      escena:
        "a cozy nursery with a wooden crib and a rattle, {NINO} in the middle holding up a pair of tiny {COLOR} baby socks in amazement, {COMPA} sniffing a soft folded baby blanket",
      ropa: "dia",
    },
    {
      texto: {
        es: "Y un día, ¡ding, dong!, llegó {bebe}. Tenía una nariz chiquitita, unas manos chiquititas y olía a leche tibia. {nombre} se puso de puntillas para mirar.",
        ca: "I un dia, ding, dong!, va arribar {bebe}. Tenia un nas petitet, unes manetes petitones i feia olor de llet tèbia. {Elnom} es va posar de puntetes per mirar.",
      },
      escena:
        "{BEBE} sleeping in a wooden crib by a sunny window, {NINO} on tiptoes peeking over the edge with curious eyes, {COMPA} peeking too",
      ropa: "dia",
    },
    {
      texto: {
        es: "{Bebe} hacía muy pocas cosas. Comía: ñam, ñam. Lloraba: ¡buaaa! Y dormía: zzz, zzz. {nombre} lo miraba todo con los ojos muy abiertos.",
        ca: "{Bebe} feia molt poques coses. Menjava: nyam, nyam. Plorava: buaaa! I dormia: zzz, zzz. {Elnom} s'ho mirava tot amb els ulls ben oberts.",
      },
      escena:
        "three small playful vignettes side by side: the baby drinking a bottle, the baby crying with an open mouth, the baby sleeping with little zzz letters, {NINO} watching in the foreground with big eyes, {COMPA} beside",
      ropa: "dia",
    },
    {
      texto: {
        es: "Ding, dong, ¡el timbre otra vez! Venían visitas con regalos y globos, y todos se acercaban a la cuna de puntillas. ¿Cuántos regalos ves?",
        ca: "Ding, dong, el timbre una altra vegada! Venien visites amb regals i globus, i tothom s'acostava al bressol de puntetes. Quants regals veus?",
      },
      escena:
        "wide living room with smiling visitors carrying gift boxes and balloons, all tiptoeing toward a baby bassinet, {NINO} small at the edge of the scene watching, {COMPA} beside",
      ropa: "dia",
    },
    {
      texto: {
        es: "{tema.problema} Tum… tum… hacía su corazón, muy despacito.",
        ca: "{tema.problema} Tum… tum… feia el seu cor, molt a poc a poc.",
      },
      escena:
        "{NINO} sitting alone on the edge of a sofa hugging {AFICION} with a thoughtful sad face, {COMPA} resting at the child's feet, in the soft-focus background adults leaning over a baby bassinet, muted colors",
      ropa: "dia",
    },
    {
      texto: {
        es: "{nombre} se escondió detrás de la cortina con {compa} y {objeto}. Muy {quieto|quieta}. Chist. Pero… ¿qué se ve por debajo? ¡Sus pies!",
        ca: "{Elnom} es va amagar darrere la cortina amb {compa} i {objeto}. {Molt quiet|Molt quieta}. Xxt. Però… què es veu per sota? Els seus peus!",
      },
      escena:
        "a long living room curtain with a child-shaped bump behind it, only {NINO}'s feet and {COMPA} peeking out from underneath, a funny cozy scene, soft afternoon light",
      ropa: "dia",
    },
    {
      texto: {
        es: "Alguien levantó la cortina despacito y… ¡cucú! Aparecieron los brazos abiertos de {arropa}. —¡Aquí estás, {nombrePelado}!",
        ca: "Algú va aixecar la cortina a poc a poc i… cucut! Van aparèixer els braços oberts de {arropa}. —Ets aquí, {nombrePelado}!",
      },
      escena:
        "a loving adult gently lifting the curtain with a playful peekaboo smile, {NINO} looking up surprised and relieved, {COMPA} jumping happily, warm light",
      ropa: "dia",
    },
    {
      texto: {
        es: "Y llegó un abrazo grande, grande. Tum, tum, tum. Y al oído, muy bajito: —{tema.ayuda}",
        ca: "I va arribar una abraçada gran, gran. Tum, tum, tum. I a cau d'orella, molt baixet: —{tema.ayuda}",
      },
      escena:
        "a tender hug on the sofa between {NINO} and a loving adult, a soft warm glow around them like a candle, {COMPA} resting its head on the child's lap",
      ropa: "dia",
    },
    {
      texto: {
        es: "Entonces {nombre} tuvo una idea. Se acercó a {bebe} y le enseñó {objeto}, muy despacito: —Mira. Es mi tesoro.",
        ca: "Llavors {elnom} va tenir una idea. Es va acostar a {bebe} i li va ensenyar {objeto}, molt a poc a poc: —Mira. És el meu tresor.",
      },
      escena:
        "{NINO} kneeling beside {BEBE} lying on a colorful play mat, gently showing {AFICION} to the baby, {COMPA} watching curiously",
      ropa: "dia",
    },
    {
      texto: {
        es: "{Bebe} abrió mucho los ojos, estiró la manita y… ¡zas! Agarró el dedo de {nombre}. ¡Qué fuerte! Tum, tum, tum, hacía su corazón.",
        ca: "{Bebe} va obrir molt els ulls, va estirar la maneta i… zas! Va agafar el dit {delnom}. Que fort! Tum, tum, tum, feia el seu cor.",
      },
      escena:
        "close-up, the tiny hand of {BEBE} grabbing the finger of {NINO}, the child smiling in wonder, {COMPA} peeking in from the side, soft light",
      ropa: "dia",
    },
    {
      texto: {
        es: "Y entonces pasó algo nuevo: {bebe} sonrió. ¡Por primera vez! ¡Y le sonrió a {nombre}! —Me ha sonreído a mí —susurró, {muy contento|muy contenta}.",
        ca: "I llavors va passar una cosa nova: {bebe} va somriure. Per primera vegada! I va somriure a {elnom}! —M'ha somrigut a mi —va xiuxiuejar, {molt content|molt contenta}.",
      },
      escena:
        "the baby giving a first big gummy smile up at {NINO}, the child glowing with joy and pride, little sparkles in the air, {COMPA} wagging happily",
      ropa: "dia",
    },
    {
      texto: {
        es: "{nombre} descubrió cosas que solo sabía hacer {un hermano mayor|una hermana mayor}. Caras graciosas: ¡bu! Ruidos de pez: pop, pop. Y {bebe} se reía: ji, ji, ji. ¿Sabes tú hacer una cara graciosa?",
        ca: "{Elnom} va descobrir coses que només sabia fer {un germà gran|una germana gran}. Cares divertides: bu! Sorolls de peix: pop, pop. I {bebe} reia: ji, ji, ji. I tu, saps fer una cara divertida?",
      },
      escena:
        "{NINO} making a funny fish face with puffed cheeks next to the giggling baby on a play mat, little bubbles drawn in the air, {COMPA} tilting its head, sunny cheerful room",
      ropa: "dia",
    },
    {
      texto: {
        es: "Cada mañana, {nombre} le hablaba de {aficion}. {Bebe} no entendía nada, pero escuchaba con los ojos como platos. Tum, tum, tum, hacían los dos corazones.",
        ca: "Cada matí, {elnom} li parlava de {aficion}. {Bebe} no entenia res, però escoltava amb uns ulls com taronges. Tum, tum, tum, feien els dos cors.",
      },
      escena:
        "morning light, {NINO} sitting next to the baby in a bouncer, holding {AFICION} and explaining with big gestures, the baby listening with round eyes, {COMPA} lying nearby",
      ropa: "dia",
    },
    {
      texto: {
        es: "Un domingo fueron de paseo hasta {lugarParque}. {nombre} ayudaba a empujar el carrito, y por el camino saludó a {amigo}: —¡Hola! ¡Es mi {b:hermanito|hermanita}!",
        ca: "Un diumenge van anar a passejar fins a {lugarParque}. {Elnom} ajudava a empènyer el cotxet, i pel camí va saludar {amigo}: —Hola! És {b:el meu germanet|la meva germaneta}!",
      },
      escena:
        "a sunny Sunday walk in a park in {CIUDAD} ({LUGAR}), {NINO} proudly helping push a pram with the baby inside, waving hello to a smiling friend, {COMPA} trotting ahead, adults walking behind",
      ropa: "dia",
    },
    {
      texto: {
        es: "Por la tarde, todos se apretujaron en el sofá: {nombre}, {compa}, {bebe}… ¡y no faltaba nadie! {tema.leccion}",
        ca: "A la tarda, tots es van arraulir al sofà: {elnom}, {compa}, {bebe}… i no hi faltava ningú! {tema.leccion}",
      },
      escena:
        "the whole family squeezed together on a big cozy sofa at sunset, {NINO} in the middle holding the baby carefully with an adult's help, {COMPA} curled on top, everyone smiling",
      ropa: "dia",
    },
    {
      texto: {
        es: "Por la noche, {nombre} se acercó a la cuna y susurró: —Buenas noches, {bebeVoc}. Mañana te enseño más cosas. Y {compa} se quedó de guardia, al lado de los dos.",
        ca: "A la nit, {elnom} es va acostar al bressol i va xiuxiuejar: —Bona nit, {bebeVoc}. Demà t'ensenyo més coses. I {compa} es va quedar de guàrdia, al costat de tots dos.",
      },
      escena:
        "night, a shared bedroom lit by a soft moon-shaped night light, {NINO} leaning over the crib whispering goodnight to the sleeping baby, {COMPA} keeping guard on the rug, peaceful blue tones",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Desde la ventana, Lunilla los miraba con su bufanda amarilla. Tum, tum, tum: el corazón de {nombre} ahora era más grande. Y ahora, todos juntos, como susurra Lunilla: «El cariño no se reparte: crece».",
        ca: "Des de la finestra, la Lunilla els mirava amb la seva bufanda groga. Tum, tum, tum: el cor {delnom} ara era més gran. I ara, tots junts, com xiuxiueja la Lunilla: «L'estima no es reparteix: creix».",
      },
      escena:
        "night, wide view of the bedroom, {NINO} asleep in bed smiling, the baby asleep in the crib nearby, {COMPA} curled up between them, a big window showing the night sky, {LUNILLA} watching tenderly from the sky, peaceful blue and gold tones",
      ropa: "pijama",
    },
  ],
};
