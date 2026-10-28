import type { Plantilla } from "./tipos";

// Colección VALORES · «{nombre} y la semilla que crecía con los gestos bonitos»
// Arco: presentación → semilla mágica → prueba del valor (tema) → error → la planta se mustia →
// reflexión → gesto bonito → la planta florece → lección.
export const valores: Plantilla = {
  coleccion: "valores",
  titulo: {
    es: "{nombre} y la semilla de los gestos bonitos",
    ca: "{Elnom} i la llavor dels gestos bonics",
  },
  portada:
    "{NINO} kneeling happily next to a small magical glowing tree in a clay pot whose leaves sparkle, {COMPA} beside, warm sunny garden in {CIUDAD}, little floating golden light specks",
  escenasTema: {
    compartir: {
      situacion: "playground in {CIUDAD}, a shy new girl looking longingly at {AFICION} held by {NINO}, {COMPA} nearby",
      tentacion: "{NINO} hiding {AFICION} behind the back with a stubborn face, the shy new girl looking sad, {COMPA} looking at {NINO} with worried eyes, slightly muted colors",
      gesto: "{NINO} and the new girl playing together with {AFICION} and laughing, {COMPA} jumping happily, bright playground in {CIUDAD}",
    },
    verdad: {
      situacion: "living room, a blue vase broken into three pieces on the floor, {NINO} frozen in surprise next to {AFICION}, {COMPA} with ears down",
      tentacion: "{NINO} looking away guiltily with hands behind the back, a kind grandmother in the doorway asking, {COMPA} hiding under the sofa, muted colors",
      gesto: "{NINO} and a kind grandmother sitting at the kitchen table gluing the blue vase back together, smiling, {COMPA} watching, warm light",
    },
    paciencia: {
      situacion: "playground in {CIUDAD}, a long line of children waiting at a slide, {NINO} bouncing impatiently in the line, {COMPA} nearby",
      tentacion: "{NINO} sneaking to the front of the slide line, other children frowning, {COMPA} looking worried, muted colors",
      gesto: "{NINO} waiting calmly in the line looking up and counting clouds, then sliding down the slide with a huge smile, {COMPA} cheering",
    },
    valentia: {
      situacion: "school party with a small stage and paper garlands, a kind teacher asking who wants to sing, {NINO} wanting to raise a hand, {COMPA} peeking",
      tentacion: "{NINO} hiding behind a column at the school party with shaking knees, the empty little stage in the background, muted colors",
      gesto: "{NINO} singing bravely on the small school stage with eyes closed, audience of children and families clapping, {COMPA} in the front row",
    },
    amabilidad: {
      situacion: "school yard, a boy who has fallen with toys from his backpack scattered on the ground, some children laughing, {NINO} watching, {COMPA} nearby",
      tentacion: "{NINO} about to laugh and turning to keep playing, the fallen boy alone in the background, {COMPA} looking back at him, muted colors",
      gesto: "{NINO} kneeling to help the fallen boy pick up his toys and asking if he is okay, the boy starting to smile, {COMPA} helping carry a toy",
    },
    perdon: {
      situacion: "a tall tower of wooden blocks being knocked over by an angry {NINO}, the best friend who built it gasping, {COMPA} jumping back",
      tentacion: "the friend crying next to the fallen blocks, {NINO} with crossed arms looking away, {COMPA} looking sad, muted colors",
      gesto: "{NINO} and the friend rebuilding an even taller block tower together and smiling, {COMPA} placing the last block with its nose",
    },
  },
  contraportada: {
    es: "Un cuento para descubrir que cada gesto bonito hace crecer algo.",
    ca: "Un conte per descobrir que cada gest bonic fa créixer alguna cosa.",
  },
  paginas: [
    {
      texto: {
        es: "{Este es|Esta es} {nombre}. Tiene {edad} años, vive en {ciudad} con {compa} y no hay nada en el mundo que le guste más que {aficion}.",
        ca: "{Aquest és|Aquesta és} {elnom}. Té {edad} anys, viu a {ciudad} amb {compa} i no hi ha res al món que li agradi més que {aficion}.",
      },
      escena:
        "sunny morning, {NINO} smiling and waving at the reader in front of a home in {CIUDAD}, {COMPA} next to the child, {AFICION} in the child's hands, cheerful introduction portrait",
      ropa: "dia",
    },
    {
      texto: {
        es: "Una mañana, entre las raíces de un árbol, {nombre} encontró una semilla que brillaba como una gota de sol. —Soy una semilla muy especial —susurró—. No crezco con agua. Crezco con gestos bonitos.",
        ca: "Un matí, entre les arrels d'un arbre, {elnom} va trobar una llavor que brillava com una gota de sol. —Soc una llavor molt especial —va xiuxiuejar—. No creixo amb aigua. Creixo amb gestos bonics.",
      },
      escena:
        "{NINO} crouching among the big roots of an old tree in a park, discovering a small seed glowing like a drop of sunlight in the palm of the hand, {COMPA} sniffing curiously, dappled morning light",
      ropa: "dia",
    },
    {
      texto: {
        es: "{nombre} la plantó en una maceta junto a la ventana y le contó un secreto. {Compa} la vigilaba con mucha atención. Pero la semilla no se movía. Esperaba.",
        ca: "{Elnom} la va plantar en un test al costat de la finestra i li va explicar un secret. {Compa} la vigilava amb molta atenció. Però la llavor no es movia. Esperava.",
      },
      escena:
        "{NINO} at a sunny windowsill gently planting the glowing seed in a small terracotta pot, whispering to it, {COMPA} watching the pot very seriously, {AFICION} lying nearby",
      ropa: "dia",
    },
    {
      texto: {
        es: "Esa tarde pasó algo. {tema.situacion}",
        ca: "Aquella tarda va passar una cosa. {tema.situacion}",
      },
      escena:
        "{TEMA.situacion}",
      ropa: "dia",
    },
    {
      texto: {
        es: "{tema.tentacion}",
        ca: "{tema.tentacion}",
      },
      escena:
        "{TEMA.tentacion}",
      ropa: "dia",
    },
    {
      texto: {
        es: "Al volver a casa, {nombre} corrió a ver la maceta. La plantita, que por fin había asomado dos hojitas, estaba mustia, con la cabeza agachada. Y a {nombre} también se le agachó un poco el corazón.",
        ca: "En tornar a casa, {elnom} va córrer a veure el test. La planteta, que per fi havia tret dues fulletes, estava pansida, amb el cap cot. I a {elnom} també se li va acotar una mica el cor.",
      },
      escena:
        "{NINO} at the window looking sadly at a tiny sprout with two drooping leaves in the terracotta pot, its glow dim, evening light, {COMPA} resting its head on the child's arm",
      ropa: "dia",
    },
    {
      texto: {
        es: "{Compa} se acurrucó a su lado. {nombre} se quedó pensando un buen rato, abrazando {objeto}. ¿Cómo se habría sentido {él|ella} si le hubieran hecho lo mismo?",
        ca: "{Compa} es va arraulir al seu costat. {Elnom} es va quedar pensant una bona estona, abraçant {objeto}. Com s'hauria sentit {ell|ella} si li haguessin fet el mateix?",
      },
      escena:
        "quiet thoughtful moment, {NINO} sitting on the floor hugging {AFICION}, {COMPA} cuddled close, thought bubble-like soft shapes suggesting reflection, warm lamp light",
      ropa: "dia",
    },
    {
      texto: {
        es: "Al día siguiente, {nombre} hizo algo valiente. {tema.gesto}",
        ca: "L'endemà, {elnom} va fer una cosa valenta. {tema.gesto}",
      },
      escena:
        "{TEMA.gesto}",
      ropa: "dia",
    },
    {
      texto: {
        es: "Y en ese momento, {nombre} notó algo nuevo: un calorcito en la barriga, como cuando te tomas un chocolate en invierno. Era la sensación de haber hecho lo correcto.",
        ca: "I en aquell moment, {elnom} va notar una cosa nova: una escalforeta a la panxa, com quan et prens una xocolata a l'hivern. Era la sensació d'haver fet el que tocava.",
      },
      escena:
        "{NINO} smiling with eyes closed and hands on the tummy, a soft warm golden glow around the child, {COMPA} jumping with joy, bright happy colors",
      ropa: "dia",
    },
    {
      texto: {
        es: "Cuando volvió a casa, ¡sorpresa! La plantita había crecido tanto que ya era un arbolito, con hojas brillantes y una flor que tenía la forma de {forma}.",
        ca: "Quan va tornar a casa, sorpresa! La planteta havia crescut tant que ja era un arbret, amb fulles brillants i una flor que tenia la forma de {forma}.",
      },
      escena:
        "{NINO} amazed at the window, the plant in the pot has grown into a small magical glowing tree with shining leaves and one big flower shaped like {AFICION}, {COMPA} standing on hind legs to look, golden sparkles",
      ropa: "dia",
    },
    {
      texto: {
        es: "Desde entonces, cada gesto bonito de {nombre} hacía brotar una flor nueva. Y {nombre} entendió algo muy importante: {tema.leccion}",
        ca: "Des d'aleshores, cada gest bonic {delnom} feia brotar una flor nova. I {elnom} va entendre una cosa molt important: {tema.leccion}",
      },
      escena:
        "a joyful montage: the little magical tree now full of colorful glowing blossoms on the windowsill, {NINO} watering it with a tiny watering can full of light, {COMPA} beside, morning sun",
      ropa: "dia",
    },
    {
      texto: {
        es: "Por la noche, el arbolito brillaba en la ventana como una lamparita. —Buenas noches, semilla —dijo {nombre}. Y el arbolito, muy bajito, contestó: —Buenas noches. Hoy has crecido tú también.",
        ca: "A la nit, l'arbret brillava a la finestra com un llumet. —Bona nit, llavor —va dir {elnom}. I l'arbret, molt baixet, va contestar: —Bona nit. Avui també has crescut tu.",
      },
      escena:
        "night, the little magical tree glowing softly like a night light on the windowsill, {NINO} in pajamas in bed smiling at it, {COMPA} asleep at the foot of the bed, stars outside over {CIUDAD}",
      ropa: "pijama",
    },
  ],
};
