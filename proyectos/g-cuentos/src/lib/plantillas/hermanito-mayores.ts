import type { Plantilla } from "./tipos";

// Colección HERMANITO NUEVO · 5–8 años · «{nombre}, hermano/a mayor en prácticas»
// Arco: la noticia → espera y preguntas → llega el bebé → «ahora no» → visitas → problema (tema) →
// nadie lo oye → plan: el Gran Espectáculo → el bebé llora y el espectáculo se hunde → cabaña de mantas →
// la familia entra (tema.ayuda) → el bebé no se calma con nadie → decisión propia: «dejadme a mí» →
// espectáculo en pequeño, primera sonrisa → Guía Oficial del Mundo → paseo y orgullo → lección →
// el espectáculo por fin tiene final → buenas noches y frase final.
// La familia se nombra con {arropa} solo tras preposición; los adultos, en neutro («los mayores»).
export const hermanitoMayores: Plantilla = {
  coleccion: "hermanito",
  banda: "mayores",
  titulo: {
    es: "{nombre}, {hermano mayor|hermana mayor} en prácticas",
    ca: "{Elnom}, {germà gran|germana gran} en pràctiques",
  },
  portada:
    "wide landscape cover, {NINO} proudly taking a bow on a homemade living room stage with a bedsheet curtain, {BEBE} smiling in a baby seat in the front row, {COMPA} wearing a tiny paper bow tie, warm cozy light, a window with the evening sky, {LUNILLA} smiling in the upper right corner of the sky",
  contraportada: {
    es: "Un cuento para recibir a un bebé en casa y descubrir que el cariño, cuando llega alguien nuevo, no se reparte: crece.",
    ca: "Un conte per rebre un nadó a casa i descobrir que l'estima, quan arriba algú de nou, no es reparteix: creix.",
  },
  paginas: [
    {
      texto: {
        es: "En una casa de {ciudad} vivía {nombre}, que tenía {edad} años, {compa} y una pasión: {aficion}. Una noche, durante la cena con {arropa}, llegó la gran noticia: —Dentro de unos meses vas a tener {b:un hermanito|una hermanita}. A {nombre} se le quedó el tenedor en el aire.",
        ca: "En una casa {deciudad} hi vivia {elnom}, que tenia {edad} anys, {compa} i una passió: {aficion}. Una nit, sopant amb {arropa}, va arribar la gran notícia: —D'aquí a uns mesos tindràs {b:un germanet|una germaneta}. A {elnom} se li va quedar la forquilla enlaire.",
      },
      escena:
        "family dinner table at home in {CIUDAD}, {NINO} with wide surprised eyes and a fork frozen in mid-air hearing big news, smiling adults softly in the background, {COMPA} under the table looking up, {AFICION} on the chair beside the child, warm lamp light, wide composition",
      ropa: "dia",
    },
    {
      texto: {
        es: "Durante meses, {nombre} hizo muchísimas preguntas. —¿Sabrá jugar? ¿Hablará? ¿Dormirá en mi cuarto? —Al principio no hará casi nada —le explicaron—. Solo comer, dormir y llorar. A {nombre} aquello le pareció bastante aburrido, pero aun así pintó un cartel de color {color} que decía {b:BIENVENIDO|BIENVENIDA}.",
        ca: "Durant mesos, {elnom} va fer moltíssimes preguntes. —Sabrà jugar? Parlarà? Dormirà a la meva habitació? —Al principi gairebé no farà res —li van explicar—. Només menjar, dormir i plorar. A {elnom} allò li va semblar força avorrit, però tot i així va pintar un cartell de color {color} que deia {b:BENVINGUT|BENVINGUDA}.",
      },
      escena:
        "{NINO} kneeling on the floor of a cozy room painting a big {COLOR} welcome banner with a brush, paint pots around, a little wooden crib waiting in the background, {COMPA} with a paint smudge on its nose, soft afternoon light",
      ropa: "dia",
    },
    {
      texto: {
        es: "Y un día llegó {bebe}. {nombre} se puso de puntillas junto a la cuna y miró dentro. Allí había una cosa diminuta, rosada, con los puños apretados y olor a leche tibia. —¿Y cabe alguien entero ahí dentro? —susurró {nombre}.",
        ca: "I un dia va arribar {bebe}. {Elnom} es va posar de puntetes al costat del bressol i va mirar a dins. Hi havia una cosa diminuta, rosada, amb els punys tancats i olor de llet tèbia. —I hi cap algú sencer, aquí dins? —va xiuxiuejar {elnom}.",
      },
      escena:
        "{BEBE} sleeping in a wooden crib with tiny fists closed, {NINO} on tiptoes peeking over the edge with curious wide eyes, {COMPA} peeking too, the {COLOR} welcome banner on the wall, soft morning light",
      ropa: "dia",
    },
    {
      texto: {
        es: "Con {bebe} en casa, todo cambió. Había pañales en el sofá, biberones en la cocina y alguien bostezando en cada habitación. Y había una frase nueva que {nombre} oía todo el rato: «Ahora no, cariño». Ahora no, que {bebe} duerme. Ahora no, que {bebe} come. Ahora no, que {bebe} llora.",
        ca: "Amb {bebe} a casa, tot va canviar. Hi havia bolquers al sofà, biberons a la cuina i algú badallant a cada habitació. I hi havia una frase nova que {elnom} sentia tota l'estona: «Ara no, {rei|reina}». Ara no, que {bebe} dorm. Ara no, que {bebe} menja. Ara no, que {bebe} plora.",
      },
      escena:
        "a slightly chaotic but cozy living room with diapers on the sofa and baby bottles on the table, a tired adult rocking {BEBE}, {NINO} holding up {AFICION} hopefully and being gently waved away, {COMPA} looking at the child, wide composition",
      ropa: "dia",
    },
    {
      texto: {
        es: "Los fines de semana venían visitas. Sonaba el timbre, llegaban regalos envueltos en papel brillante y todos se inclinaban sobre la cuna: «¡Qué cosita!», «¡Qué manitas!», «¡Tiene la nariz del abuelo!». {nombre}, mientras, esperaba al lado con {objeto} en las manos, por si alguien le preguntaba algo.",
        ca: "Els caps de setmana venien visites. Sonava el timbre, arribaven regals embolicats amb paper brillant i tothom s'inclinava sobre el bressol: «Quina cosa més petita!», «Quines manetes!», «Té el nas de l'avi!». {Elnom}, mentrestant, esperava al costat amb {objeto} a les mans, per si algú li preguntava alguna cosa.",
      },
      escena:
        "living room crowded with smiling visitors leaning over a baby bassinet and holding gift bags with shiny paper, {NINO} standing alone at the edge of the scene holding {AFICION} and waiting to be noticed, {COMPA} beside, muted colors around the child, wide composition",
      ropa: "dia",
    },
    {
      texto: {
        es: "Y así pasaban los días, uno detrás de otro. {tema.problema}",
        ca: "I així anaven passant els dies, l'un darrere l'altre. {tema.problema}",
      },
      escena:
        "evening, quiet living room, a crib in the corner, wrapping paper on the floor, {NINO} sitting on the stairs hugging the knees and looking toward the crib with a thoughtful sad face, {COMPA} leaning against the child, soft dim light",
      ropa: "dia",
    },
    {
      texto: {
        es: "Pero nadie se dio cuenta, porque justo entonces {bebe} se puso a llorar y todos corrieron hacia la cuna. {nombre} se quedó {solo|sola} en la escalera con {compa}. —Pues mañana se van a enterar —susurró—. Mañana haré algo tan grande que todo el mundo me mirará a mí.",
        ca: "Però ningú no se'n va adonar, perquè just llavors {bebe} es va posar a plorar i tothom va córrer cap al bressol. {Elnom} es va quedar {sol|sola} a l'escala amb {compa}. —Doncs demà se n'assabentaran —va xiuxiuejar—. Demà faré una cosa tan grossa que tothom em mirarà a mi.",
      },
      escena:
        "{NINO} sitting alone on the stairs with {COMPA} and whispering a secret plan, while in the background adults hurry toward the crib where {BEBE} is crying, the child lit by a warm lamp, a determined little frown",
      ropa: "dia",
    },
    {
      texto: {
        es: "Al día siguiente, {nombre} lo preparó todo para su Gran Espectáculo: un escenario con las sillas del comedor, un telón hecho con una sábana, un decorado de cartón con forma de {forma}, entradas pintadas a mano y {objeto} en el centro de todo. {Compa} haría de ayudante. —Señoras y señores —ensayó delante del espejo—, ¡prepárense para algo nunca visto!",
        ca: "L'endemà, {elnom} ho va preparar tot per al seu Gran Espectacle: un escenari amb les cadires del menjador, un teló fet amb un llençol, un decorat de cartró en forma d'{forma}, entrades pintades a mà i {objeto} al bell mig de tot. {Compa} faria d'ajudant. —Senyores i senyors —va assajar davant del mirall—, prepareu-vos per a una cosa mai vista!",
      },
      escena:
        "a living room turned into a little homemade theater with dining chairs in a row, a bedsheet curtain, a big cardboard backdrop and hand-painted tickets, {NINO} rehearsing a grand bow in front of a mirror with {AFICION}, {COMPA} wearing a tiny paper bow tie as an assistant, playful wide composition",
      ropa: "dia",
    },
    {
      texto: {
        es: "Por la tarde, {nombre} dio las entradas de primera fila a {arropa} y se subió al escenario. —¡Bienvenidos al Gran Espectáculo! Hizo una reverencia, {compa} dio una vuelta completa y, justo cuando iba a llegar lo mejor, desde la cuna se oyó un llanto altísimo: ¡BUAAAA!",
        ca: "Per la tarda, {elnom} va donar les entrades de primera fila a {arropa} i va pujar a l'escenari. —Benvinguts al Gran Espectacle! Va fer una reverència, {compa} va fer una volta sencera i, just quan arribava el millor, des del bressol es va sentir un plor altíssim: BUAAAA!",
      },
      escena:
        "the homemade living room theater, family adults sitting in the front row clapping, {NINO} on the little stage taking a bow with {AFICION}, {COMPA} spinning, a crib in the background with {BEBE} starting to cry loudly, wide composition",
      ropa: "dia",
    },
    {
      texto: {
        es: "En un segundo, las sillas se quedaron vacías. Todos corrieron hacia {bebe}. El telón se cayó, {compa} se enredó en la sábana y el Gran Espectáculo se acabó antes de empezar. —¡Siempre es {bebe}! —gritó {nombre}—. ¡A mí no me mira nadie!",
        ca: "En un segon, les cadires es van quedar buides. Tothom va córrer cap a {bebe}. El teló va caure, {compa} es va embolicar amb el llençol i el Gran Espectacle es va acabar abans de començar. —Sempre és {bebe}! —va cridar {elnom}—. A mi no em mira ningú!",
      },
      escena:
        "the homemade theater in disarray, empty chairs, the bedsheet curtain fallen with {COMPA} tangled in it, {NINO} standing alone on the little stage with clenched fists and an upset face, adults gathered around the crib in the background, muted colors",
      ropa: "dia",
    },
    {
      texto: {
        es: "{nombre} se metió en su cabaña de mantas, al fondo del pasillo, y no quiso salir. Dentro olía a galleta y a almohada. {Compa} se le acurrucó al lado sin hacer ruido, que es lo que mejor saben hacer los amigos de verdad cuando alguien está triste.",
        ca: "{Elnom} es va ficar a la seva cabana de mantes, al fons del passadís, i no en va voler sortir. A dins feia olor de galeta i de coixí. {Compa} se li va arraulir al costat sense fer soroll, que és el que millor saben fer els amics de debò quan algú està trist.",
      },
      escena:
        "a blanket fort made of chairs and quilts at the end of a hallway, fairy lights inside, {NINO} sitting with a sad face hugging {AFICION}, {COMPA} snuggled close, cozy dim light",
      ropa: "dia",
    },
    {
      texto: {
        es: "Al rato, alguien levantó la manta de la puerta. {nombre} reconoció enseguida la voz de {arropa}: —¿Hay sitio para alguien más? Hubo que apretarse mucho, pero al final cupieron todos. —Te estábamos buscando. Te echábamos de menos.",
        ca: "Al cap d'una estona, algú va aixecar la manta de la porta. {Elnom} va reconèixer de seguida la veu de {arropa}: —Hi ha lloc per a algú més? Va caldre estrènyer-se molt, però al final hi van cabre tots. —Et buscàvem. Et trobàvem a faltar.",
      },
      escena:
        "inside the blanket fort, a smiling adult squeezing in on hands and knees and lifting the quilt flap, {NINO} looking up surprised and relieved, {COMPA} making room, fairy lights glowing, warm close composition",
      ropa: "dia",
    },
    {
      texto: {
        es: "Allí dentro, muy cerquita, {nombre} escuchó una cosa importante: —{tema.ayuda} {nombre} no dijo nada, pero apoyó la cabeza en un hombro conocido. Por dentro, algo empezaba a desenredarse, como un nudo de los cordones.",
        ca: "Allà dins, molt a prop, {elnom} va sentir una cosa important: —{tema.ayuda} {Elnom} no va dir res, però va recolzar el cap en una espatlla coneguda. Per dins, alguna cosa començava a desfer-se, com el nus d'una sabata.",
      },
      escena:
        "tender hug inside the blanket fort between {NINO} and a loving adult, a small warm candle-like glow between them, {COMPA} resting its head on the child's lap, fairy lights",
      ropa: "dia",
    },
    {
      texto: {
        es: "Entonces, desde la cuna, {bebe} volvió a llorar. Los mayores lo intentaron todo: el chupete, el biberón, la nana de siempre, pasear arriba y abajo por el pasillo. Nada. {Bebe} lloraba cada vez más fuerte, y ya nadie sabía qué hacer.",
        ca: "Llavors, des del bressol, {bebe} va tornar a plorar. Els grans ho van provar tot: el xumet, el biberó, la cançó de sempre, passejar amunt i avall pel passadís. Res. {Bebe} plorava cada vegada més fort, i ja ningú no sabia què fer.",
      },
      escena:
        "evening hallway, tired adults trying everything to calm {BEBE} crying in their arms, a pacifier and a bottle, pacing up and down, {NINO} peeking out of the blanket fort and watching carefully, {COMPA} with ears perked, wide composition",
      ropa: "dia",
    },
    {
      texto: {
        es: "{nombre} salió de la cabaña. Nadie se lo había pedido. Miró aquella carita roja y arrugada y, de pronto, tuvo una idea. —Esperad —dijo—. Dejadme probar a mí. Los mayores se miraron, sorprendidos, y le hicieron sitio junto a la cuna.",
        ca: "{Elnom} va sortir de la cabana. Ningú no li ho havia demanat. Va mirar aquella careta vermella i arrugada i, de sobte, va tenir una idea. —Espereu —va dir—. Deixeu-m'ho provar a mi. Els grans es van mirar, sorpresos, i li van fer lloc al costat del bressol.",
      },
      escena:
        "{NINO} stepping out of the blanket fort with a brave, determined face and raising a hand to say let me try, tired adults holding {BEBE} and making room beside the crib in surprise, {COMPA} following, warm lamp light",
      ropa: "dia",
    },
    {
      texto: {
        es: "{nombre} se arrodilló junto a la cuna y empezó otra vez el Gran Espectáculo, pero en pequeño: una reverencia, {objeto} bailando por el aire y una canción inventada, muy bajito. {Bebe} dejó de llorar. Abrió unos ojos muy redondos y se quedó mirando a {nombre} como si fuera lo más interesante del mundo.",
        ca: "{Elnom} es va agenollar al costat del bressol i va tornar a començar el Gran Espectacle, però en petit: una reverència, {objeto} ballant per l'aire i una cançó inventada, molt baixet. {Bebe} va deixar de plorar. Va obrir uns ulls ben rodons i es va quedar mirant {elnom} com si fos la cosa més interessant del món.",
      },
      escena:
        "close and tender, {NINO} kneeling beside the crib performing a tiny quiet show with {AFICION} floating gently in the air, {BEBE} in the crib has stopped crying and stares with big round eyes, {COMPA} watching, adults smiling in soft focus behind",
      ropa: "dia",
    },
    {
      texto: {
        es: "Y entonces pasó: {bebe} sonrió. Era la primera sonrisa de su vida, y era para {nombre}. —¡Me ha sonreído a mí! —susurró, con el corazón dando saltos—. ¡Le ha gustado mi espectáculo! Detrás, alguien se secó una lágrima y dijo bajito: —El público más difícil de la casa.",
        ca: "I llavors va passar: {bebe} va somriure. Era el primer somriure de la seva vida, i era per a {elnom}. —M'ha somrigut a mi! —va xiuxiuejar, amb el cor fent salts—. Li ha agradat el meu espectacle! Darrere, algú es va eixugar una llàgrima i va dir baixet: —El públic més difícil de la casa.",
      },
      escena:
        "{BEBE} giving a first big gummy smile at {NINO}, the child glowing with pure joy and pride, hands over the mouth in amazement, {COMPA} jumping happily, an adult in the background wiping away a happy tear, warm golden light",
      ropa: "dia",
    },
    {
      texto: {
        es: "Desde ese día, {nombre} se nombró Guía Oficial del Mundo. Cada mañana le enseñaba algo nuevo a {bebe}: —Esto es una cuchara. Esto es un calcetín, y va en el pie, no en la boca. {mascota} también es de la familia, como tú. Y eso de ahí fuera es {ciudad}. Es enorme, pero ya te la enseñaré entera.",
        ca: "Des d'aquell dia, {elnom} es va nomenar Guia Oficial del Món. Cada matí ensenyava alguna cosa nova a {bebe}: —Això és una cullera. Això és un mitjó, i va al peu, no a la boca. {mascota} també és de la família, com tu. I allò d'allà fora és {ciudad}. És enorme, però ja te l'ensenyaré tota sencera.",
      },
      escena:
        "sunny morning by a big window overlooking {CIUDAD}, {NINO} sitting next to {BEBE} lying on a soft cushion with an adult close by, pointing out of the window like a tour guide, a spoon and a tiny sock on the windowsill, {COMPA} posing proudly, {LUGAR} in the distance",
      ropa: "dia",
    },
    {
      texto: {
        es: "El domingo salieron a pasear por {lugarParque}. {nombre} ayudaba a empujar el carrito, {muy derecho y muy serio|muy derecha y muy seria}, como quien lleva un tesoro. Cuando se encontraron con {amigo}, {nombre} no esperó a que nadie preguntara: —Aquí dentro va {bebe} —dijo, hinchando el pecho—. Y yo soy su {hermano mayor|hermana mayor}.",
        ca: "Diumenge van sortir a passejar per {lugarParque}. {Elnom} ajudava a empènyer el cotxet, {molt dret i molt seriós|molt dreta i molt seriosa}, com qui porta un tresor. Quan es van trobar amb {amigo}, {elnom} no va esperar que ningú preguntés res: —Aquí dins hi va {bebe} —va dir, inflant el pit—. I jo soc {el seu germà gran|la seva germana gran}.",
      },
      escena:
        "sunny Sunday walk in a leafy park in {CIUDAD}, {NINO} proudly helping push a pram with {BEBE} inside, a family adult walking beside, a school friend peeking into the pram, {COMPA} trotting ahead, {LUGAR} in the background, wide landscape",
      ropa: "dia",
    },
    {
      texto: {
        es: "Al volver, el cielo se puso de color naranja sobre {lugarAlto}. En el carrito, {bebe} se había dormido sin soltarle el dedo. {tema.leccion}",
        ca: "De tornada, el cel es va tornar de color taronja sobre {lugarAlto}. Al cotxet, {bebe} s'havia adormit sense deixar-li anar el dit. {tema.leccion}",
      },
      escena:
        "walking home at sunset, the sky orange and pink over {LUGAR}, {NINO} walking beside the pram holding the finger of {BEBE} asleep inside, looking thoughtful and happy, {COMPA} beside, warm family silhouettes, wide landscape composition",
      ropa: "dia",
    },
    {
      texto: {
        es: "Después de cenar, el Gran Espectáculo tuvo por fin su final. Esta vez nadie se levantó de las sillas: estaban {compa}, toda la familia y, en el centro de la primera fila, {bebe}, que no dejó de mirar ni un segundo. Cuando {nombre} hizo la última reverencia, se oyó una risa pequeñita, como un cascabel. {Bebe} acababa de reír por primera vez.",
        ca: "Després de sopar, el Gran Espectacle per fi va tenir el seu final. Aquesta vegada ningú no es va aixecar de les cadires: hi havia {compa}, tota la família i, al mig de la primera fila, {bebe}, que no va deixar de mirar ni un segon. Quan {elnom} va fer l'última reverència, es va sentir una rialleta petita, com un picarol. {Bebe} acabava de riure per primera vegada.",
      },
      escena:
        "the homemade living room theater again, every chair full with smiling family, {BEBE} in a baby seat in the center of the front row giggling, {NINO} taking a long final bow on the little stage with {AFICION}, {COMPA} bowing too, warm festive lamp light",
      ropa: "dia",
    },
    {
      texto: {
        es: "Por la noche, después de las buenas noches de {arropa}, {nombre} se asomó a la cuna. —Buenas noches, {bebeVoc} —susurró—. Mañana te enseño más cosas del mundo. {Compa} se quedó de guardia entre los dos, y desde la ventana Lunilla sonreía muy bajito. Y ahora, todos juntos: «El cariño no se reparte: crece».",
        ca: "A la nit, després de la bona nit de {arropa}, {elnom} es va acostar al bressol. —Bona nit, {bebeVoc} —va xiuxiuejar—. Demà t'ensenyo més coses del món. {Compa} es va quedar de guàrdia entre tots dos, i des de la finestra la Lunilla somreia molt baixet. I ara, tots junts: «L'estima no es reparteix: creix».",
      },
      escena:
        "night, shared bedroom lit by a moon-shaped night light, {NINO} in pajamas leaning over the crib and whispering goodnight to {BEBE} asleep, {COMPA} keeping guard between bed and crib, peaceful blue tones, {LUNILLA} smiling softly at the window over {CIUDAD}",
      ropa: "pijama",
    },
  ],
};
