import type { Plantilla } from "./tipos";

// Colección VALORES · 2–4 años · «La semillita de {nombre}» (18 páginas)
// Estribillo para repetir juntos: «Semillita, semillita, ¿cuándo vas a crecer?» — «Con un gesto bonito».
// Arco: Lunilla deja caer una semilla → se planta → no crece con agua ni con canciones → prueba del
// valor (tema) → error → la semilla se apaga → pensar → gesto bonito → brotan hojas y flores →
// lección → noche y frase final con Lunilla.
export const valoresPeques: Plantilla = {
  coleccion: "valores",
  banda: "peques",
  titulo: { es: "La semillita de {nombre}", ca: "La llavoreta {delnom}" },
  portada:
    "{NINO} kneeling happily next to a small glowing sprout in a {COLOR} flowerpot on a wide sunny windowsill, {COMPA} beside, the rooftops of {CIUDAD} outside, little floating golden light specks, {LUNILLA} smiling in the upper right corner of the sky",
  contraportada: {
    es: "Un cuento con estribillo para descubrir que cada gesto bonito hace crecer una flor.",
    ca: "Un conte amb tornada per descobrir que cada gest bonic fa créixer una flor.",
  },
  escenasTema: {
    compartir: {
      situacion:
        "wide playground in {CIUDAD}, a shy new girl looking longingly at {AFICION} held by the child, {COMPA} nearby, swings and trees in the background",
      tentacion:
        "playground, the child hiding {AFICION} behind the back with a stubborn face, the shy new girl looking sad, {COMPA} looking at the child with worried eyes, slightly muted colors",
      gesto:
        "bright playground in {CIUDAD}, the child and the new girl playing together with {AFICION} and laughing, {COMPA} jumping happily",
    },
    verdad: {
      situacion:
        "wide living room, a blue vase broken into three pieces on the floor, the child frozen in surprise next to {AFICION}, {COMPA} with ears down",
      tentacion:
        "living room, the child looking away guiltily with hands behind the back, a kind grandmother in the doorway asking, {COMPA} hiding under the sofa, muted colors",
      gesto:
        "warm kitchen, the child and a kind grandmother sitting at the table gluing the blue vase back together and smiling, {COMPA} watching",
    },
    paciencia: {
      situacion:
        "wide playground in {CIUDAD}, a long line of children waiting at a slide, the child bouncing impatiently in the line, {COMPA} nearby",
      tentacion:
        "playground, the child sneaking to the front of the slide line, other children frowning, {COMPA} looking worried, muted colors",
      gesto:
        "playground in {CIUDAD}, the child waiting calmly in the slide line and looking up to count the clouds, {COMPA} cheering, soft white clouds in a blue sky",
    },
    valentia: {
      situacion:
        "school party with a small stage and paper garlands, a kind teacher asking who wants to sing, the child wanting to raise a hand, {COMPA} peeking",
      tentacion:
        "school party, the child hiding behind a column with shaking knees, the empty little stage in the background, muted colors",
      gesto:
        "the child singing bravely on the small school stage with eyes closed, audience of children and families clapping, {COMPA} in the front row",
    },
    amabilidad: {
      situacion:
        "wide school yard, a boy who has fallen with toys from his backpack scattered on the ground, some children laughing, the child watching, {COMPA} nearby",
      tentacion:
        "school yard, the child about to laugh and turning away to keep playing, the fallen boy alone in the background, {COMPA} looking back at him, muted colors",
      gesto:
        "school yard, the child kneeling to help the fallen boy pick up his toys and asking if he is okay, the boy starting to smile, {COMPA} helping carry a toy",
    },
    perdon: {
      situacion:
        "playroom, a tall tower of wooden blocks being knocked over by the child in a fit of anger, the best friend who built it gasping, {COMPA} jumping back",
      tentacion:
        "playroom, the friend crying next to the fallen blocks, the child with crossed arms looking away, {COMPA} looking sad, muted colors",
      gesto:
        "playroom, the child and the friend rebuilding an even taller block tower together and smiling, {COMPA} placing the last block",
    },
  },
  paginas: [
    {
      texto: {
        es: "{Este es|Esta es} {nombre}. Tiene {edad} años y vive en {ciudad} con {compa}. No hay nada en el mundo que le guste más que {aficion}. ¡Hola, {nombre}!",
        ca: "{Aquest és|Aquesta és} {elnom}. Té {edad} anys i viu a {ciudad} amb {compa}. No hi ha res al món que li agradi més que {aficion}. Hola, {nombrePelado}!",
      },
      escena:
        "sunny morning on a wide street of {CIUDAD}, {NINO} smiling and waving at the reader, {COMPA} next to the child, {AFICION} in the child's hands",
      ropa: "dia",
    },
    {
      texto: {
        es: "Una mañana, en {lugarParque}, algo cayó del cielo justo delante de {nombre}. ¡Plof! Era una semillita que brillaba como una gota de sol. Allá arriba, Lunilla sonreía.",
        ca: "Un matí, a {lugarParque}, va caure una cosa del cel just davant {delnom}. Plof! Era una llavoreta que brillava com una gota de sol. Allà dalt, la Lunilla somreia.",
      },
      escena:
        "{LUGAR}, a leafy park in the morning, a tiny glowing seed falling like a drop of sunlight in front of {NINO}, {COMPA} looking up, {LUNILLA} smiling pale in the daytime sky",
      ropa: "dia",
    },
    {
      texto: {
        es: "{nombre} la plantó en una maceta de color {color}. Pam, pam, pam, con la tierra. Glu, glu, glu, con el agua. Y {compa} lo miraba todo con mucha atención.",
        ca: "{Elnom} la va plantar en un test de color {color}. Pam, pam, pam, amb la terra. Glu, glu, glu, amb l'aigua. I {compa} s'ho mirava tot amb molta atenció.",
      },
      escena:
        "sunny windowsill, {NINO} planting the glowing seed in a small {COLOR} flowerpot and watering it with a tiny watering can, {COMPA} watching very closely",
      ropa: "dia",
    },
    {
      texto: {
        es: "—Semillita, semillita, ¿cuándo vas a crecer? —preguntó {nombre}. Y la semilla contestó muy bajito: —Con agua, no. Con sol, tampoco. Yo crezco con un gesto bonito.",
        ca: "—Llavoreta, llavoreta, quan creixeràs? —va preguntar {elnom}. I la llavor va contestar molt baixet: —Amb aigua, no. Amb sol, tampoc. Jo creixo amb un gest bonic.",
      },
      escena:
        "wide view of the sunny windowsill, {NINO} leaning toward the {COLOR} flowerpot with a hand behind the ear to listen, the seed glowing softly in the soil, {COMPA} with head tilted",
      ropa: "dia",
    },
    {
      texto: {
        es: "{nombre} le cantó una canción: la, la, la. Le enseñó {objeto}. Le hizo cosquillas. Pero nada, ni una hojita. —Semillita, semillita, ¿cuándo vas a crecer?",
        ca: "{Elnom} li va cantar una cançó: la, la, la. Li va ensenyar {objeto}. Li va fer pessigolles. Però res, ni una fulleta. —Llavoreta, llavoreta, quan creixeràs?",
      },
      escena:
        "funny cheerful moment, {NINO} singing to the {COLOR} flowerpot and showing {AFICION} to it, {COMPA} dancing along, the pot with no sprout at all",
      ropa: "dia",
    },
    {
      texto: {
        es: "Esa tarde pasó algo. ¡Oh, oh! Mira, mira bien. {tema.situacion}",
        ca: "Aquella tarda va passar una cosa. Oh, oh! Mira, mira bé. {tema.situacion}",
      },
      escena: "main character {NINO} in this scene: {TEMA.situacion}",
      ropa: "dia",
    },
    {
      texto: {
        es: "{tema.tentacion} {Compa} no dijo nada. Solo miró a {nombre} con ojos tristes.",
        ca: "{tema.tentacion} {Compa} no va dir res. Només va mirar {elnom} amb ulls tristos.",
      },
      escena: "main character {NINO} in this scene: {TEMA.tentacion}",
      ropa: "dia",
    },
    {
      texto: {
        es: "Al volver a casa, {nombre} corrió a ver la maceta. Ay, ay, ay: la semilla ya no brillaba. —Semillita, semillita, ¿cuándo vas a crecer? Pero la semilla no contestó.",
        ca: "En tornar a casa, {elnom} va córrer a veure el test. Ai, ai, ai: la llavor ja no brillava. —Llavoreta, llavoreta, quan creixeràs? Però la llavor no va contestar.",
      },
      escena:
        "{NINO} at the window looking sadly at the {COLOR} flowerpot where the seed no longer glows, soft evening light, {COMPA} resting its head on the child's arm",
      ropa: "dia",
    },
    {
      texto: {
        es: "{Compa} se acurrucó a su lado, y {nombre} le dio un abrazo. Luego pensó, pensó, pensó. Mmm, mmm, mmm… ¿Qué haría ahora alguien con el corazón bonito?",
        ca: "{Compa} es va arraulir al seu costat, i {elnom} li va fer una abraçada. Després va pensar, pensar, pensar. Mmm, mmm, mmm… Què faria ara algú amb el cor bonic?",
      },
      escena:
        "quiet thoughtful moment, {NINO} sitting on the floor hugging {COMPA} with a thinking face, {AFICION} lying nearby, warm lamp light, the dim {COLOR} flowerpot on the windowsill",
      ropa: "dia",
    },
    {
      texto: {
        es: "{tema.gesto} ¡Tachán! Eso sí que era un gesto bonito.",
        ca: "{tema.gesto} Tatxan! Això sí que era un gest bonic.",
      },
      escena: "main character {NINO} in this scene: {TEMA.gesto}",
      ropa: "dia",
    },
    {
      texto: {
        es: "En la barriga de {nombre} se encendió un calorcito, como un chocolate caliente en invierno. Pum, pum, hacía el corazón. ¡Qué bien se estaba así!",
        ca: "A la panxa {delnom} s'hi va encendre una escalforeta, com una xocolata calenta a l'hivern. Bum, bum, feia el cor. Que bé que s'estava així!",
      },
      escena:
        "{NINO} smiling with eyes closed and hands on the tummy, a soft warm golden glow around the child, {COMPA} jumping with joy, bright happy colors",
      ropa: "dia",
    },
    {
      texto: {
        es: "{nombre} corrió a casa: tap, tap, tap. Y en la maceta… ¡chas! Habían salido dos hojitas verdes. —Semillita, semillita, ¿ya estás creciendo? —¡Sí! Gracias por tu gesto bonito.",
        ca: "{Elnom} va córrer cap a casa: tap, tap, tap. I al test… xas! Havien sortit dues fulletes verdes. —Llavoreta, llavoreta, ja estàs creixent? —Sí! Gràcies pel teu gest bonic.",
      },
      escena:
        "{NINO} running into the room and finding two bright green leaves sprouting from the glowing seed in the {COLOR} flowerpot, {COMPA} jumping up to see, golden sparkles",
      ropa: "dia",
    },
    {
      texto: {
        es: "Desde ese día, {nombre} buscaba gestos bonitos. Puso la mesa con {arropa}: clin, clin, hacían los platos. ¡Y en la maceta salió una flor!",
        ca: "Des d'aquell dia, {elnom} buscava gestos bonics. Va parar taula amb {arropa}: clinc, clinc, feien els plats. I al test va sortir una flor!",
      },
      escena:
        "warm wide kitchen, {NINO} carefully carrying plates to set the table with a loving family member, {COMPA} watching, in the background on the windowsill a first flower opening in the {COLOR} flowerpot",
      ropa: "dia",
    },
    {
      texto: {
        es: "Al día siguiente, {nombre} dio un abrazo de oso a {amigo}: ¡aprieta, aprieta! Regó las plantas del balcón: glu, glu. Y en la maceta salieron dos flores más.",
        ca: "L'endemà, {elnom} va fer una abraçada d'ós a {amigo}: estreny, estreny! Va regar les plantes del balcó: glu, glu. I al test van sortir dues flors més.",
      },
      escena:
        "sunny school gate in {CIUDAD}, {NINO} giving a big warm bear hug to a best friend, both laughing, {COMPA} nearby, other children and families in the background",
      ropa: "dia",
    },
    {
      texto: {
        es: "La plantita creció y creció hasta ser un arbolito. Y un día, ¡oooh!, en lo más alto se abrió una flor que parecía {forma}. {nombre} no se lo podía creer.",
        ca: "La planteta va créixer i créixer fins a ser un arbret. I un dia, ooooh!, a dalt de tot es va obrir una flor que semblava {forma}. {Elnom} no s'ho podia creure.",
      },
      escena:
        "{NINO} amazed at the window, the plant in the {COLOR} pot has grown into a small magical glowing tree with shining leaves and one big flower shaped like {AFICION}, {COMPA} standing up to look, golden sparkles",
      ropa: "dia",
    },
    {
      texto: {
        es: "{nombre} acarició el arbolito, muy despacito, y entendió algo muy importante. {tema.leccion}",
        ca: "{Elnom} va acariciar l'arbret, molt a poc a poc, i va entendre una cosa molt important. {tema.leccion}",
      },
      escena:
        "{NINO} gently touching a glowing leaf of the little magical tree full of colorful blossoms on the windowsill, {COMPA} beside, soft afternoon sun over the rooftops of {CIUDAD}",
      ropa: "dia",
    },
    {
      texto: {
        es: "Por la noche, con el pijama puesto, {nombre} miró el arbolito. Brillaba como una lamparita. —Semillita, semillita, ¡cuánto has crecido! —Y tú también —dijo el arbolito.",
        ca: "A la nit, amb el pijama posat, {elnom} va mirar l'arbret. Brillava com un llumet. —Llavoreta, llavoreta, quant has crescut! —I tu també —va dir l'arbret.",
      },
      escena:
        "night bedroom, the little magical tree glowing softly like a night light on the windowsill, {NINO} in bed looking at it with a happy face, {COMPA} at the foot of the bed",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Después del beso de {arropa}, toc, toc: en la ventana apareció Lunilla. —Hoy has crecido mucho, {nombre} —susurró—. Y ahora, todos juntos, muy bajito: «Un gesto bonito, una flor nueva».",
        ca: "Després del petó de {arropa}, toc, toc: a la finestra va aparèixer la Lunilla. —Avui has crescut molt, {nombrePelado} —va xiuxiuejar—. I ara, tots junts, molt baixet: «Un gest bonic, una flor nova».",
      },
      escena:
        "night, {LUNILLA} smiling at the bedroom window, {NINO} tucked into bed waving at her, the little magical tree glowing on the windowsill, {COMPA} asleep at the foot of the bed, stars over {CIUDAD}",
      ropa: "pijama",
    },
  ],
};
