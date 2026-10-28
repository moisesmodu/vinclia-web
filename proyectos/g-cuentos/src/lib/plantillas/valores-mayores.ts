import type { Plantilla } from "./tipos";

// Colección VALORES · 5–8 años · «{nombre} y la semilla que viajaba en la mochila»
// Arco: semilla con adivinanza → intentos que fallan (agua, sol, canciones) → pista de Lunilla →
// primer brote con un gesto sin querer → prueba del valor (tema) → la hoja se pone gris →
// arreglo rápido que no funciona → decisión propia (tema.gesto) → fiesta de las flores: el capullo
// no abre → lo cuenta sin esconderse y florece → semilla nueva que regala → lección → frase final.
// La semilla viaja en una maceta diminuta en la mochila: así ve los gestos en cualquier escenario del tema.
export const valoresMayores: Plantilla = {
  coleccion: "valores",
  banda: "mayores",
  titulo: {
    es: "{nombre} y la semilla que viajaba en la mochila",
    ca: "{Elnom} i la llavor que viatjava a la motxilla",
  },
  portada:
    "wide landscape cover, {NINO} walking happily through a sunny park in {CIUDAD} wearing a small backpack, a tiny {COLOR} flowerpot peeking out of the front pocket with a glowing golden sprout, {COMPA} beside, floating golden light specks, calm empty sky on the left, {LUNILLA} smiling in the upper right corner of the sky",
  escenasTema: {
    compartir: {
      situacion:
        "wide playground in {CIUDAD}, a shy new girl looking longingly at {AFICION} held by {NINO}, the child's backpack on a bench with the tiny {COLOR} flowerpot peeking out, {COMPA} nearby",
      tentacion:
        "{NINO} hiding {AFICION} behind the back with a stubborn face, the shy new girl looking sad, {COMPA} looking at the child with worried eyes, the tiny {COLOR} flowerpot in the backpack pocket, slightly muted colors",
      gesto:
        "{NINO} and the new girl sitting on the playground ground playing together with {AFICION} and laughing, {COMPA} jumping happily, the backpack with the tiny {COLOR} flowerpot beside them, bright playground in {CIUDAD}",
    },
    verdad: {
      situacion:
        "cozy living room, a blue vase broken into three pieces on the floor, {NINO} frozen in surprise next to {AFICION}, the backpack with the tiny {COLOR} flowerpot hanging from a chair, {COMPA} with ears down",
      tentacion:
        "{NINO} looking away guiltily with hands behind the back, a kind grandmother in the doorway asking who did it, {COMPA} hiding under the sofa, the broken vase on the floor, muted colors",
      gesto:
        "{NINO} and a kind grandmother sitting at the kitchen table gluing the blue vase back together and smiling, {COMPA} watching, the tiny {COLOR} flowerpot on the table, warm light",
    },
    paciencia: {
      situacion:
        "wide playground in {CIUDAD}, a long line of children waiting at a tall slide, {NINO} bouncing impatiently in the line with the backpack on, the tiny {COLOR} flowerpot peeking out, {COMPA} nearby",
      tentacion:
        "{NINO} sneaking to the front of the slide line, other children frowning, {COMPA} looking worried, the backpack with the tiny {COLOR} flowerpot bouncing, muted colors",
      gesto:
        "{NINO} back in the line waiting calmly and counting clouds, then sliding down the slide with a huge smile, {COMPA} cheering, the backpack with the tiny {COLOR} flowerpot at the bottom of the slide",
    },
    valentia: {
      situacion:
        "school party with a small stage and paper garlands, a kind teacher asking who wants to sing, {NINO} wanting to raise a hand, the backpack with the tiny {COLOR} flowerpot on a chair, {COMPA} peeking",
      tentacion:
        "{NINO} hiding behind a column at the school party with shaking knees, the empty little stage in the background, the tiny {COLOR} flowerpot peeking from the backpack, muted colors",
      gesto:
        "{NINO} singing bravely on the small school stage with eyes closed, children and families clapping in a wide audience, {COMPA} in the front row next to the backpack with the tiny {COLOR} flowerpot",
    },
    amabilidad: {
      situacion:
        "wide school yard, a boy who has fallen with toys from his backpack scattered on the ground, some children laughing, {NINO} watching with the own backpack on, the tiny {COLOR} flowerpot peeking out, {COMPA} nearby",
      tentacion:
        "{NINO} about to laugh and turning to keep playing, the fallen boy alone in the background, {COMPA} looking back at him, muted colors",
      gesto:
        "{NINO} kneeling to help the fallen boy pick up his toys and asking if he is okay, the boy starting to smile, {COMPA} helping carry a toy, the tiny {COLOR} flowerpot peeking from the backpack",
    },
    perdon: {
      situacion:
        "a playroom, a tall tower of wooden blocks being knocked over by an angry {NINO}, the best friend who built it gasping, {COMPA} jumping back, the backpack with the tiny {COLOR} flowerpot in a corner",
      tentacion:
        "the friend crying next to the fallen blocks, {NINO} with crossed arms looking away, {COMPA} looking sad, muted colors",
      gesto:
        "{NINO} and the friend rebuilding an even taller block tower together and smiling, {COMPA} placing the last block, the tiny {COLOR} flowerpot watching from the backpack",
    },
  },
  contraportada: {
    es: "Un cuento para descubrir que cada gesto bonito, por pequeño que sea, hace crecer algo.",
    ca: "Un conte per descobrir que cada gest bonic, per petit que sigui, fa créixer alguna cosa.",
  },
  paginas: [
    {
      texto: {
        es: "{Este es|Esta es} {nombre}. Tiene {edad} años, vive en {ciudad} y va a todas partes con {compa}. Si le preguntas qué es lo mejor del mundo, te dirá sin dudar: {aficion}. Lo que {nombre} todavía no sabía es que esa semana iba a llevar un secreto muy especial en la mochila.",
        ca: "{Aquest és|Aquesta és} {elnom}. Té {edad} anys, viu a {ciudad} i va a tot arreu amb {compa}. Si li preguntes què és el millor del món, et dirà sense dubtar-ho: {aficion}. El que {elnom} encara no sabia és que aquella setmana duria un secret molt especial a la motxilla.",
      },
      escena:
        "wide sunny street scene in {CIUDAD}, {NINO} walking toward the reader with a small backpack and waving, {COMPA} following along, {AFICION} peeking out of the backpack, {LUGAR} in the soft background",
      ropa: "dia",
    },
    {
      texto: {
        es: "El lunes, jugando con {amigo} en {lugarParque}, {nombre} vio algo que brillaba entre las raíces de un árbol viejo. Era una semilla del tamaño de una lenteja, dorada como una gota de sol. —¿Hola? —dijo {nombre}, sintiéndose un poco {tonto|tonta}. Y la semilla, con una vocecita de cascabel, contestó: —Hola. Por fin alguien me ve.",
        ca: "Dilluns, jugant amb {amigo} a {lugarParque}, {elnom} va veure una cosa que brillava entre les arrels d'un arbre vell. Era una llavor de la mida d'una llentia, daurada com una gota de sol. —Hola? —va dir {elnom}, sentint-se una mica {ridícul|ridícula}. I la llavor, amb una veueta de picarol, va contestar: —Hola. Per fi algú em veu.",
      },
      escena:
        "a big old tree with huge roots in a leafy park in {CIUDAD}, {NINO} crouching among the roots and discovering a tiny seed glowing like a golden drop of sunlight, {COMPA} sniffing curiously, children playing ball in the background, dappled light",
      ropa: "dia",
    },
    {
      texto: {
        es: "—Soy una semilla muy rara —le explicó—. No crezco con agua, ni con sol, ni con abono. Crezco con una cosa que no se compra. Y para crecer tengo que ir contigo a todas partes. {nombre} la plantó en una maceta diminuta de color {color} y la guardó en el bolsillo de la mochila, con la cremallera un poco abierta para que pudiera mirar.",
        ca: "—Soc una llavor molt estranya —li va explicar—. No creixo amb aigua, ni amb sol, ni amb adob. Creixo amb una cosa que no es compra. I per créixer he d'anar amb tu a tot arreu. {Elnom} la va plantar en un test petitó de color {color} i el va desar a la butxaca de la motxilla, amb la cremallera una mica oberta perquè pogués mirar.",
      },
      escena:
        "{NINO} sitting on a park bench carefully planting the glowing seed in a tiny {COLOR} flowerpot, then tucking it into the front pocket of a backpack with the zipper half open, {COMPA} watching closely, wide park view of {CIUDAD}",
      ropa: "dia",
    },
    {
      texto: {
        es: "En casa, {nombre} enseñó la maceta a {arropa} y señaló el calendario de la cocina. El sábado era la fiesta de las flores en {lugarPlaza}, y cada niño llevaba la flor que había cuidado. —Solo faltan cinco días —dijo {nombre}—. Mi semilla tiene que florecer antes del sábado.",
        ca: "A casa, {elnom} va ensenyar el test a {arropa} i va assenyalar el calendari de la cuina. Dissabte era la festa de les flors a {lugarPlaza}, i cada nen hi portava la flor que havia cuidat. —Només falten cinc dies —va dir {elnom}—. La meva llavor ha de florir abans de dissabte.",
      },
      escena:
        "cozy kitchen at home, {NINO} proudly showing the tiny {COLOR} flowerpot to a smiling family adult and pointing at a wall calendar with Saturday circled and a flower drawn on it, {COMPA} sitting on a chair, warm afternoon light",
      ropa: "dia",
    },
    {
      texto: {
        es: "{nombre} probó de todo, por si acaso: unas gotas de agua con un cuentagotas, un rato de sol en la ventana, canciones, y hasta le enseñó {objeto}. —¡Crece, porfa! —le pedía. Pero pasaron el lunes, el martes y el miércoles, y en la maceta no asomaba ni una hojita. Solo tierra.",
        ca: "{Elnom} ho va provar tot, per si de cas: unes gotes d'aigua amb un comptagotes, una estona de sol a la finestra, cançons, i fins i tot li va ensenyar {objeto}. —Creix, si us plau! —li demanava. Però van passar dilluns, dimarts i dimecres, i al test no hi treia el cap ni una fulleta. Només terra.",
      },
      escena:
        "a sunny windowsill, {NINO} giving water drops to the tiny {COLOR} flowerpot, singing to it and showing it {AFICION}, the pot still showing only bare soil, {COMPA} tilting its head, a wall calendar with Monday, Tuesday and Wednesday crossed out",
      ropa: "dia",
    },
    {
      texto: {
        es: "El miércoles por la noche, {nombre} miraba la maceta desde la cama, con el ceño fruncido. —No lo entiendo. He hecho todo lo que sé. Por la ventana asomó Lunilla, la luna pequeña de la bufanda amarilla, y habló muy bajito, como habla ella: —A lo mejor no hay que hacerle cosas a la semilla. A lo mejor hay que dejar que te vea.",
        ca: "Dimecres a la nit, {elnom} mirava el test des del llit, amb les celles arrufades. —No ho entenc. He fet tot el que sé. Per la finestra va treure el cap la Lunilla, la lluna petita de la bufanda groga, i va parlar molt baixet, com parla ella: —Potser no s'han de fer coses a la llavor. Potser s'ha de deixar que et vegi.",
      },
      escena:
        "night bedroom, {NINO} sitting up in bed hugging the knees and frowning at the tiny {COLOR} flowerpot on the bedside table, {COMPA} curled at the foot of the bed, {LUNILLA} peeking gently through the window over the rooftops of {CIUDAD}",
      ropa: "pijama",
    },
    {
      texto: {
        es: "El jueves, {nombre} se levantó antes que nadie y, sin que nadie se lo pidiera, preparó el desayuno para {arropa}: tostadas un poco quemadas y una servilleta doblada en forma de barco. Entonces se oyó un «plip» en la mochila. En la maceta había asomado una hojita verde y brillante. —¡Era eso! —susurró {nombre}—. ¡Creces con gestos bonitos!",
        ca: "Dijous, {elnom} es va llevar abans que ningú i, sense que ningú li ho demanés, va preparar l'esmorzar per a {arropa}: torrades una mica cremades i un tovalló plegat en forma de vaixell. Llavors es va sentir un «plip» a la motxilla. Al test hi havia sortit una fulleta verda i brillant. —Era això! —va xiuxiuejar {elnom}—. Creixes amb gestos bonics!",
      },
      escena:
        "early morning kitchen in soft golden light, {NINO} carrying a tray with slightly burnt toast and a napkin folded like a paper boat to the table, the backpack on a chair with the tiny {COLOR} flowerpot peeking out and a first bright green leaf sprouting with a little sparkle, {COMPA} sniffing the toast",
      ropa: "dia",
    },
    {
      texto: {
        es: "Ese día, {nombre} fue a todas partes con la mochila bien puesta. Iba tan {contento|contenta} que casi daba saltos. «Si con un desayuno sale una hoja», pensaba, «con un gesto grande saldrá la flor entera». Pero esa misma tarde iba a pasar algo que no estaba en sus planes.",
        ca: "Aquell dia, {elnom} va anar a tot arreu amb la motxilla ben posada. Anava tan {content|contenta} que gairebé feia salts. «Si amb un esmorzar surt una fulla», pensava, «amb un gest gran sortirà la flor sencera». Però aquella mateixa tarda passaria una cosa que no entrava en els seus plans.",
      },
      escena:
        "{NINO} skipping happily along a sunny street in {CIUDAD} with the backpack on, the tiny {COLOR} flowerpot with its green leaf peeking out of the pocket, {COMPA} following along, {LUGAR} in the background, wide composition",
      ropa: "dia",
    },
    {
      texto: {
        es: "Y pasó esto. {tema.situacion} Desde su bolsillo, la hojita se estiró para verlo mejor.",
        ca: "I va passar això. {tema.situacion} Des de la butxaca, la fulleta es va estirar per veure-ho millor.",
      },
      escena: "wide shot with {NINO} at the center of the moment: {TEMA.situacion}",
      ropa: "dia",
    },
    {
      texto: {
        es: "{tema.tentacion} En ese momento, la mochila se volvió más fría, como cuando alguien abre una ventana en invierno.",
        ca: "{tema.tentacion} En aquell moment, la motxilla es va tornar més freda, com quan algú obre una finestra a l'hivern.",
      },
      escena: "wide shot with {NINO} at the center of the moment: {TEMA.tentacion}",
      ropa: "dia",
    },
    {
      texto: {
        es: "{nombre} abrió el bolsillo y se le encogió el corazón. La hojita estaba doblada, gris y arrugada, como un papel mojado. —¿Qué te pasa? —le preguntó, {asustado|asustada}. Pero la semilla no contestó. Ni un «plip». Nada.",
        ca: "{Elnom} va obrir la butxaca i se li va encongir el cor. La fulleta estava doblegada, grisa i arrugada, com un paper mullat. —Què et passa? —li va preguntar, {espantat|espantada}. Però la llavor no va contestar. Ni un «plip». Res.",
      },
      escena:
        "{NINO} opening the backpack pocket with a worried face, the tiny {COLOR} flowerpot inside with its single leaf drooping, folded and gray, {COMPA} looking in too, colors slightly muted, wide composition with the place of the story behind",
      ropa: "dia",
    },
    {
      texto: {
        es: "{nombre} intentó arreglarlo deprisa. Le sopló aire calentito. Le echó unas gotas de agua de su botella. Le acarició la hoja con un dedo, muy despacio. Nada funcionaba: la hojita seguía gris. Entonces se acordó de las palabras de Lunilla: «Hay que dejar que te vea». Y la semilla lo había visto todo.",
        ca: "{Elnom} ho va intentar arreglar de pressa. Li va bufar aire calentó. Li va tirar unes gotes d'aigua de la seva ampolla. Li va acariciar la fulla amb un dit, molt a poc a poc. No funcionava res: la fulleta continuava grisa. Llavors es va recordar de les paraules de la Lunilla: «S'ha de deixar que et vegi». I la llavor ho havia vist tot.",
      },
      escena:
        "{NINO} kneeling and trying to revive the drooping gray leaf in the tiny {COLOR} flowerpot, gently blowing on it and pouring a few drops from a water bottle, {COMPA} watching anxiously, muted colors",
      ropa: "dia",
    },
    {
      texto: {
        es: "{nombre} se quedó un momento muy {quieto|quieta}, mirando la hojita gris. Ya sabía qué la había puesto así, y también que eso no se arreglaba con agua. Lo más fácil era cerrar la mochila, hacer como si nada y esperar que el sábado la flor saliera de todos modos. Nadie le iba a decir nada.",
        ca: "{Elnom} es va quedar un moment molt {quiet|quieta}, mirant la fulleta grisa. Ja sabia què l'havia posat així, i també que allò no s'arreglava amb aigua. El més fàcil era tancar la motxilla, fer com si res i esperar que dissabte la flor sortís igualment. Ningú no li diria res.",
      },
      escena:
        "quiet thoughtful moment, {NINO} standing still holding the open backpack with the tiny {COLOR} flowerpot and its gray leaf, looking back over the shoulder, {COMPA} looking up at the child, soft late afternoon light, wide composition with calm empty space around",
      ropa: "dia",
    },
    {
      texto: {
        es: "{tema.gesto} Nadie se lo había pedido: lo había decidido {él solo|ella sola}.",
        ca: "{tema.gesto} Ningú no li ho havia demanat: ho havia decidit {ell sol|ella sola}.",
      },
      escena: "wide warm shot with {NINO} at the center of the moment: {TEMA.gesto}",
      ropa: "dia",
    },
    {
      texto: {
        es: "Entonces {nombre} notó un calorcito en la barriga, como cuando te tomas un chocolate en invierno. Y en la mochila sonó un «plip», y otro, y otro más. La hojita gris se había puesto verde otra vez, y a su lado habían salido tres hojas nuevas y un capullo pequeño y cerrado, como un puño.",
        ca: "Llavors {elnom} va notar una escalforeta a la panxa, com quan et prens una xocolata a l'hivern. I a la motxilla va sonar un «plip», i un altre, i un altre. La fulleta grisa s'havia tornat verda una altra vegada, i al seu costat hi havien sortit tres fulles noves i una poncella petita i tancada, com un puny.",
      },
      escena:
        "{NINO} smiling with eyes closed and hands on the tummy, a soft warm golden glow around, the tiny {COLOR} flowerpot peeking from the backpack now with bright green leaves and a small closed bud, little sparkles popping, {COMPA} jumping with joy, bright colors returning",
      ropa: "dia",
    },
    {
      texto: {
        es: "El viernes, {nombre} no buscó gestos grandes. Recogió sus juguetes sin protestar. Guardó un sitio en la fila para {amigo}. Le dejó a {compa} el mejor trozo de la manta. Y cada vez, la planta crecía un poquito, sin que nadie más que {nombre} se diera cuenta.",
        ca: "Divendres, {elnom} no va buscar gestos grans. Va recollir les joguines sense protestar. Va guardar un lloc a la fila per a {amigo}. Va deixar a {compa} el millor tros de la manta. I cada vegada la planta creixia una mica, sense que ningú més que {elnom} se n'adonés.",
      },
      escena:
        "a cheerful wide composition in three small moments: {NINO} tidying toys into a box, saving a spot in a school line for a friend, and sharing a blanket with {COMPA} on the sofa, the tiny {COLOR} flowerpot always nearby with a plant that grows a little more in each moment",
      ropa: "dia",
    },
    {
      texto: {
        es: "El sábado, en {lugarPlaza} había flores por todas partes: girasoles enormes, rosas con lazo, margaritas en macetas pintadas. La planta de {nombre} tenía muchas hojas, pero el capullo seguía cerrado. —¿Y esa? ¡Si no tiene flor! —dijo un niño. A {nombre} se le pusieron las orejas calientes, y estuvo a punto de volver a esconder la maceta en la mochila.",
        ca: "Dissabte, a {lugarPlaza} hi havia flors pertot arreu: gira-sols enormes, roses amb llaç, margarides en testos pintats. La planta {delnom} tenia moltes fulles, però la poncella continuava tancada. —I aquesta? Si no té flor! —va dir un nen. A {elnom} se li van escalfar les orelles, i va estar a punt de tornar a amagar el test a la motxilla.",
      },
      escena:
        "a lively flower fair in a plaza in {CIUDAD}, stalls and tables full of big colorful flowers in painted pots, {NINO} holding the tiny {COLOR} flowerpot with a leafy plant and one closed bud, a boy pointing at it, the child blushing, {COMPA} beside, {LUGAR} in the background",
      ropa: "dia",
    },
    {
      texto: {
        es: "Pero {nombre} no lo hizo. Levantó la maceta y dijo, con la voz un poco temblorosa: —Es pequeña, pero no ha crecido con agua. Ha crecido con un desayuno, con un sitio en la fila y con una cosa que me costó mucho hacer. Y entonces, delante de todos, el capullo se abrió despacio: era una flor con forma de {forma}.",
        ca: "Però {elnom} no ho va fer. Va aixecar el test i va dir, amb la veu una mica tremolosa: —És petita, però no ha crescut amb aigua. Ha crescut amb un esmorzar, amb un lloc a la fila i amb una cosa que em va costar molt de fer. I llavors, davant de tothom, la poncella es va obrir a poc a poc: era una flor en forma d'{forma}.",
      },
      escena:
        "magical moment at the flower fair, {NINO} holding up the tiny {COLOR} flowerpot as its bud opens into a big glowing flower shaped like {AFICION}, golden sparkles, surprised children and adults gathering around in a wide circle, {COMPA} on tiptoes",
      ropa: "dia",
    },
    {
      texto: {
        es: "Todos querían saber dónde se compraba una flor así. Pero antes de que {nombre} pudiera contestar, de la flor cayó algo pequeño y dorado, justo en su mano: una semilla nueva, del tamaño de una lenteja. —Las semillas de gestos no se guardan en un cajón —susurró la flor—. Se regalan.",
        ca: "Tothom volia saber on es comprava una flor així. Però abans que {elnom} pogués contestar, de la flor va caure una cosa petita i daurada, just a la seva mà: una llavor nova, de la mida d'una llentia. —Les llavors de gestos no es guarden en un calaix —va xiuxiuejar la flor—. Es regalen.",
      },
      escena:
        "a new tiny golden seed falling from the big glowing flower into the open palm of {NINO}, the child's face full of wonder, {COMPA} watching the seed, the busy flower fair softly blurred behind, wide composition",
      ropa: "dia",
    },
    {
      texto: {
        es: "{nombre} cerró la mano y lo pensó un momento. Podía quedársela y tener dos flores. Pero fue a buscar a {amigo} entre la gente y abrió la mano despacio. —Esta semilla es para regalar —dijo—. No crece con agua ni con sol. Crece con lo que hacemos cada día.",
        ca: "{Elnom} va tancar la mà i s'ho va pensar una estona. Se la podia quedar i tenir dues flors. Però va anar a buscar {amigo} entre la gent i va obrir la mà a poc a poc. —Aquesta llavor és per regalar —va dir—. No creix amb aigua ni amb sol. Creix amb el que fem cada dia.",
      },
      escena:
        "{NINO} at the flower fair placing the tiny golden seed into the hands of a best friend, both children smiling, {COMPA} beside them, the glowing flower in the {COLOR} flowerpot tucked under the child's arm, warm festive light, wide composition",
      ropa: "dia",
    },
    {
      texto: {
        es: "Volvieron a casa al atardecer, con {arropa}, pasando junto a {lugarAgua}. La flor brillaba en la maceta de color {color} como una lamparita. {nombre} iba {callado|callada}, pensando. Ahora entendía algo que el lunes todavía no entendía. {tema.leccion}",
        ca: "Van tornar a casa a la posta de sol, amb {arropa}, passant pel costat de {lugarAgua}. La flor brillava al test de color {color} com un llumet. {Elnom} anava {callat|callada}, pensant. Ara entenia una cosa que dilluns encara no entenia. {tema.leccion}",
      },
      escena:
        "sunset walk home in {CIUDAD}, {NINO} walking hand in hand with a family adult and carrying the glowing flower in the tiny {COLOR} flowerpot like a little lamp, {COMPA} trotting ahead, {LUGAR} glowing in warm orange light, wide landscape",
      ropa: "dia",
    },
    {
      texto: {
        es: "Por la noche, la flor brillaba en la mesilla. Después de las buenas noches de {arropa}, Lunilla se asomó a la ventana. —Esta semana tu semilla ha crecido mucho —dijo muy bajito—. Y tú también, {nombre}. Y ahora, todos juntos: «Un gesto bonito, una flor nueva».",
        ca: "A la nit, la flor brillava a la tauleta. Després de la bona nit de {arropa}, la Lunilla va treure el cap per la finestra. —Aquesta setmana la teva llavor ha crescut molt —va dir molt baixet—. I tu també, {nombrePelado}. I ara, tots junts: «Un gest bonic, una flor nova».",
      },
      escena:
        "night bedroom, {NINO} in pajamas tucked in bed and smiling, the glowing flower in the tiny {COLOR} flowerpot shining like a night light on the bedside table, {COMPA} asleep at the foot of the bed, rooftops of {CIUDAD} under the stars outside the window, {LUNILLA} smiling softly at the window",
      ropa: "pijama",
    },
  ],
};
