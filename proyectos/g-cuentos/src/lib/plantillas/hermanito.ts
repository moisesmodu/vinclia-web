import type { Plantilla } from "./tipos";

// Colección HERMANITO NUEVO · «{nombre} y el bebé más pequeño del mundo»
// Familia en neutro ("la familia", "en casa") para que sirva a cualquier familia.
export const hermanito: Plantilla = {
  coleccion: "hermanito",
  titulo: {
    es: "{nombre} y el bebé más pequeño del mundo",
    ca: "{Elnom} i el nadó més petit del món",
  },
  portada:
    "{NINO} proudly and gently holding a tiny sleeping baby wrapped in a cream knitted blanket, {COMPA} looking up lovingly, cozy living room with soft warm light, {LUNILLA} smiling in the upper right corner of the sky",
  contraportada: {
    es: "Un cuento para dar la bienvenida a un hermanito y descubrir que el cariño se multiplica.",
    ca: "Un conte per donar la benvinguda a un germanet i descobrir que l'estima es multiplica.",
  },
  paginas: [
    {
      texto: {
        es: "En una casa de {ciudad} vivían {nombre}, su familia y {compa}. Un día, en la cena, le contaron un secreto enorme: —Pronto llegará alguien nuevo a casa. Un bebé.",
        ca: "En una casa de {ciudad} hi vivien {elnom}, la seva família i {compa}. Un dia, al sopar, li van explicar un secret enorme: —Aviat arribarà algú nou a casa. Un nadó.",
      },
      escena:
        "family dinner table at home in {CIUDAD}, {NINO} with wide surprised eyes and open mouth hearing big news, adults' hands and smiling faces softly in the background, {COMPA} under the table looking up",
      ropa: "dia",
    },
    {
      texto: {
        es: "En casa todo empezó a cambiar: apareció una cuna, una bañera diminuta y unos calcetines tan pequeños que a {nombre} solo le cabían dos dedos dentro. —¿De verdad hay alguien tan pequeño? —preguntó.",
        ca: "A casa tot va començar a canviar: va aparèixer un bressol, una banyera diminuta i uns mitjons tan petits que a {elnom} només li hi cabien dos dits. —De debò que hi ha algú tan petit? —va preguntar.",
      },
      escena:
        "{NINO} sitting on the floor of a nursery holding up a pair of tiny baby socks on two fingers in amazement, a wooden crib and a tiny bathtub nearby, {COMPA} sniffing a soft baby blanket",
      ropa: "dia",
    },
    {
      texto: {
        es: "Y un día llegó {bebe}. Era {b:rosado|rosada}, {b:arrugadito|arrugadita} y olía a leche tibia. Dormía, comía, lloraba… y volvía a dormir.",
        ca: "I un dia va arribar {bebe}. Era {b:rosadet|rosadeta}, {b:arrugadet|arrugadeta} i feia olor de llet tèbia. Dormia, menjava, plorava… i tornava a dormir.",
      },
      escena:
        "a tiny newborn baby in a cream knitted onesie sleeping in a wooden crib, {NINO} on tiptoes peeking curiously over the edge, {COMPA} on its hind legs peeking too, soft morning light",
      ropa: "dia",
    },
    {
      texto: {
        es: "Venían visitas, sonaba el timbre, llegaban regalos… y todos decían «¡qué bonito!» mirando a {bebe}. {tema.problema}",
        ca: "Venien visites, sonava el timbre, arribaven regals… i tothom deia «que bonic!» mirant {bebe}. {tema.problema}",
      },
      escena:
        "living room crowded with smiling visitors leaning over a baby bassinet with gift bags, {NINO} standing alone at the edge of the scene holding {AFICION}, looking left out, {COMPA} beside, muted colors around the child",
      ropa: "dia",
    },
    {
      texto: {
        es: "{nombre} se metió en su cabaña de mantas con {compa} y {objeto}. Desde allí dentro, el mundo parecía más pequeño y más tranquilo.",
        ca: "{Elnom} es va ficar a la seva cabana de mantes amb {compa} i {objeto}. Des d'allà dins, el món semblava més petit i més tranquil.",
      },
      escena:
        "a blanket fort made of chairs and quilts with fairy lights, {NINO} sitting inside with a sad thoughtful face hugging {AFICION}, {COMPA} snuggled close, cozy dim light",
      ropa: "dia",
    },
    {
      texto: {
        es: "Al rato, alguien levantó la manta de la puerta. Era su familia, que se metió en la cabaña aunque casi no cabía. —Te estábamos buscando. Te echábamos de menos.",
        ca: "Al cap d'una estona, algú va aixecar la manta de la porta. Era la seva família, que es va ficar a la cabana tot i que gairebé no hi cabia. —Et buscàvem. Et trobàvem a faltar.",
      },
      escena:
        "inside the blanket fort, a smiling adult squeezing in on hands and knees and lifting the quilt flap, {NINO} looking up surprised and relieved, {COMPA} wagging, fairy lights glowing",
      ropa: "dia",
    },
    {
      texto: {
        es: "Y le dijeron, muy cerquita, una cosa importante: —{tema.ayuda}",
        ca: "I li van dir, molt a prop, una cosa important: —{tema.ayuda}",
      },
      escena:
        "tender hug inside the blanket fort between {NINO} and a loving adult, a small candle-like warm glow between them, {COMPA} resting its head on the child's lap",
      ropa: "dia",
    },
    {
      texto: {
        es: "Entonces {nombre} tuvo una idea. Se acercó a {bebe} con {objeto} y se lo enseñó despacito. El bebé abrió mucho los ojos y le agarró un dedo con su manita, fuerte, fuerte.",
        ca: "Llavors {elnom} va tenir una idea. Es va acostar a {bebe} amb {objeto} i l'hi va ensenyar a poc a poc. El nadó va obrir molt els ulls i li va agafar un dit amb la maneta, fort, fort.",
      },
      escena:
        "close-up, {NINO} kneeling beside the baby on a soft play mat showing {AFICION}, the tiny baby in a cream knitted onesie grabbing the child's finger with a tiny hand, {COMPA} watching gently",
      ropa: "dia",
    },
    {
      texto: {
        es: "Y pasó algo increíble: {bebe} sonrió por primera vez. ¡Y le sonrió a {nombre}! —¡Me ha sonreído a mí! —gritó, con el corazón dando saltos.",
        ca: "I va passar una cosa increïble: {bebe} va somriure per primera vegada. I va somriure a {elnom}! —M'ha somrigut a mi! —va cridar, amb el cor fent salts.",
      },
      escena:
        "the baby in a cream knitted onesie giving a first big gummy smile at {NINO}, the child glowing with pure joy and pride, arms up in celebration, {COMPA} jumping happily",
      ropa: "dia",
    },
    {
      texto: {
        es: "Poco a poco, {nombre} descubrió que había cosas que solo sabía hacer un {hermano mayor|hermana mayor}: poner caras graciosas, cantar canciones de cuna y enseñarle a {bebe} cómo era el mundo.",
        ca: "A poc a poc, {elnom} va descobrir que hi havia coses que només sabia fer {un germà gran|una germana gran}: fer cares divertides, cantar cançons de bressol i ensenyar a {bebe} com era el món.",
      },
      escena:
        "{NINO} making a funny face and singing to the giggling baby lying on a play mat, musical notes floating, {COMPA} tilting its head, sunny cheerful room",
      ropa: "dia",
    },
    {
      texto: {
        es: "Los domingos salían todos juntos a pasear por {ciudad}, y {nombre} ayudaba a empujar el carrito. {tema.leccion}",
        ca: "Els diumenges sortien tots junts a passejar per {ciudad}, i {elnom} ajudava a empènyer el cotxet. {tema.leccion}",
      },
      escena:
        "sunny Sunday walk along a tree-lined street in {CIUDAD}, {NINO} proudly helping push a pram with the baby inside, adults walking beside, {COMPA} trotting ahead, autumn leaves",
      ropa: "dia",
    },
    {
      texto: {
        es: "Por la noche, los dos dormían en la misma habitación. {nombre} miró la cuna y susurró: —Buenas noches, {bebeVoc}. Yo te enseñaré todo lo que sé. Y {mascota} se quedó de guardia, vigilando a los dos. Y ahora, todos juntos, como susurra Lunilla: «El cariño no se reparte: crece».",
        ca: "A la nit, tots dos dormien a la mateixa habitació. {Elnom} va mirar el bressol i va xiuxiuejar: —Bona nit, {bebeVoc}. Jo t'ensenyaré tot el que sé. I {compa} es va quedar de guàrdia, vigilant tots dos. I ara, tots junts, com xiuxiueja la Lunilla: «L'estima no es reparteix: creix».",
      },
      escena:
        "night, shared bedroom lit by a moon-shaped night light, {NINO} in pajamas in bed smiling toward the baby sleeping in the crib, {COMPA} keeping guard between them, peaceful blue tones, {LUNILLA} watching tenderly from the sky",
      ropa: "pijama",
    },
  ],
};
