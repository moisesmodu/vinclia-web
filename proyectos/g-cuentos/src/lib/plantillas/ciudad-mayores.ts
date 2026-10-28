import type { Plantilla } from "./tipos";

// Colección MI CIUDAD · 5–8 años · «{nombre} y los secretos {deciudad}» (22 páginas)
// Amplía el cuento de 12 páginas: 12 escenas antiguas (campo `base`) reutilizan sus ilustraciones;
// 10 escenas nuevas añaden pistas, un contratiempo (el viento se lleva el mapa), la decisión
// del protagonista, un giro (la letra del sobre es de casa) y un mapa nuevo para su amigo.
// Arco: sobre → mapa → mochila → mercado → pista oculta → agua → historia del agua → tema (2)
// → parque → el viento se lleva el mapa → decide seguir y deduce la pista → su afición
// → recupera el mapa → mirador → repaso desde arriba → «eres tú» → Lunilla al atardecer
// → la letra de la nevera → su propio mapa → un mapa para su amigo → buenas noches.
export const ciudadMayores: Plantilla = {
  coleccion: "ciudad",
  banda: "mayores",
  titulo: { es: "{nombre} y los secretos {deciudad}", ca: "{Elnom} i els secrets {deciudad}" },
  portada:
    "{NINO} holding an old hand-drawn treasure map and pointing excitedly at the skyline of {CIUDAD} ({LUGAR}), {COMPA} beside, golden morning light, {LUNILLA} smiling in the upper right corner of the sky",
  contraportada: {
    es: "Cinco secretos, un mapa que sale volando y una sorpresa en casa: una búsqueda del tesoro por los rincones de tu ciudad.",
    ca: "Cinc secrets, un mapa que surt volant i una sorpresa a casa: una cerca del tresor pels racons de la teva ciutat.",
  },
  paginas: [
    // 1 · base 1
    {
      texto: {
        es: "Cada mañana, {nombre} se asomaba a la ventana para ver despertar a {ciudad}. Pero aquel sábado, debajo de la puerta, apareció un sobre amarillo con una letra muy antigua: «Para {nombrePelado}, que tiene ojos de {explorador|exploradora}». ¿Quién lo habría dejado allí? {Compa} lo olió por todas partes, pero no olía a nada conocido.",
        ca: "Cada matí, {elnom} treia el cap per la finestra per veure com es despertava {ciudad}. Però aquell dissabte, sota la porta, va aparèixer un sobre groc amb una lletra molt antiga: «Per a {elnom}, que té ulls {d'explorador|d'exploradora}». Qui l'havia deixat allà? {Compa} el va ensumar per tot arreu, però no feia olor de res conegut.",
      },
      escena:
        "early morning, {NINO} in the doorway of home picking up a yellow envelope from the floor, {COMPA} sniffing it, window behind showing the rooftops of {CIUDAD}",
      ropa: "dia",
      base: 1,
    },
    // 2 · base 2
    {
      texto: {
        es: "Dentro había un mapa dibujado a mano: «Los cinco secretos {deciudad}». Debajo, una pista: «El primer secreto huele a fruta y a pan recién hecho». {nombre} y {compa} se miraron. —¿Cinco secretos? ¿Aquí, en {ciudad}? —susurró {nombre}. ¡Había que salir a explorar!",
        ca: "A dins hi havia un mapa dibuixat a mà: «Els cinc secrets {deciudad}». A sota, una pista: «El primer secret fa olor de fruita i de pa acabat de fer». {Elnom} i {compa} es van mirar. —Cinc secrets? Aquí, a {ciudad}? —va xiuxiuejar {elnom}. Calia sortir a explorar!",
      },
      escena:
        "{NINO} unfolding an old hand-drawn treasure map of {CIUDAD} with five little drawn stars on it, {COMPA} looking at the map with tilted head, a small backpack ready",
      ropa: "dia",
      base: 2,
    },
    // 3 · nueva: la mochila
    {
      texto: {
        es: "{nombre} lo tuvo claro: la aventura empezaba ya. Metió en la mochila {objeto} y un lápiz de color {color} para marcar cada secreto en el mapa. {Compa} esperaba junto a la puerta, con prisa. —¡Vamos! —dijo {nombre}. Y salieron a la calle con {arropa}, sin saber todo lo que les esperaba.",
        ca: "{Elnom} ho va tenir clar: l'aventura començava ja. Va ficar a la motxilla {objeto} i un llapis de color {color} per marcar cada secret al mapa. {Compa} ja esperava al costat de la porta, amb pressa. —Som-hi! —va dir {elnom}. I van sortir al carrer amb {arropa}, sense saber tot el que els esperava.",
      },
      escena:
        "{NINO} kneeling in the hallway of home packing a small backpack with {AFICION} and a {COLOR} pencil, the folded treasure map sticking out of a pocket, {COMPA} waiting eagerly by the open front door, an adult's hand holding the door at the edge of the frame",
      ropa: "dia",
    },
    // 4 · base 3
    {
      texto: {
        es: "Con su familia de la mano, llegaron a {lugarPlaza}. Había naranjas como soles y panes como piedras doradas. La frutera le guiñó un ojo y le regaló una mandarina: —Primer secreto: aquí la ciudad se despierta antes que nadie.",
        ca: "De la mà de la seva família, van arribar a {lugarPlaza}. Hi havia taronges com sols i pans com pedres daurades. La fruitera li va picar l'ullet i li va regalar una mandarina: —Primer secret: aquí la ciutat es desperta abans que ningú.",
      },
      escena:
        "a lively traditional market in {CIUDAD}, colorful fruit stalls with oranges and bread, a smiling fruit seller handing a tangerine to {NINO}, {COMPA} beside, an adult's hand holding the child's hand at the edge of the frame",
      ropa: "dia",
      base: 3,
    },
    // 5 · nueva: la frutera conoce la letra
    {
      texto: {
        es: "La frutera miró el mapa de reojo y sonrió como quien guarda un secreto. —Esta letra me suena… —murmuró. Pero no dijo nada más. {nombre} marcó con su lápiz el primer secreto y le susurró a {compa}: —Uno. ¡Ya solo faltan cuatro! Entonces dio la vuelta al mapa. Por detrás había más letras.",
        ca: "La fruitera va mirar el mapa de reüll i va somriure com qui guarda un secret. —Aquesta lletra em sona… —va murmurar. Però no va dir res més. {Elnom} va marcar amb el llapis el primer secret i va xiuxiuejar a {compa}: —Un. Ja només en falten quatre! Llavors va girar el mapa. Per darrere hi havia més lletres.",
      },
      escena:
        "at a fruit stall in the market of {CIUDAD}, the fruit seller glancing at the treasure map with a knowing smile, {NINO} turning the map over to discover handwriting on the back, holding a {COLOR} pencil, {COMPA} peeking at the map",
      ropa: "dia",
    },
    // 6 · base 4
    {
      texto: {
        es: "La segunda pista decía: «Busca el agua que cuenta historias». Y allí estaba {lugarAgua}. {nombre} se asomó y vio a una familia de patos que nadaba en fila, como un tren con plumas. —Cua, cua —decían muy serios, como si contaran algo importante.",
        ca: "La segona pista deia: «Busca l'aigua que explica històries». I allà hi havia {lugarAgua}. {Elnom} s'hi va acostar i va veure una família d'ànecs que nedava en fila, com un tren amb plomes. —Quac, quac —feien molt seriosos, com si expliquessin una cosa important.",
      },
      escena:
        "{NINO} and {COMPA} leaning over a railing by the water in {CIUDAD} ({LUGAR}), a family of ducks swimming in a row below, reflections shimmering, gentle morning light",
      ropa: "dia",
      base: 4,
    },
    // 7 · nueva: el agua que cuenta historias
    {
      texto: {
        es: "En un banco, un señor mayor miraba a los patos. —¿Sabes por qué esta agua cuenta historias? —preguntó—. Porque estaba aquí antes que las casas, y ha visto crecer a {ciudad} poquito a poco. {nombre} lo escuchó con la boca abierta. ¡Segundo secreto! Y la tercera pista decía: «Busca lo que tiene raíces y no se mueve».",
        ca: "En un banc, un senyor gran mirava els ànecs. —Saps per què aquesta aigua explica històries? —va preguntar—. Perquè ja era aquí abans que les cases, i ha vist créixer {ciudad} a poc a poc. {Elnom} l'escoltava amb la boca oberta. Segon secret! I la tercera pista deia: «Busca allò que té arrels i no es mou».",
      },
      escena:
        "a kind elderly man sitting on a bench by the water in {CIUDAD} ({LUGAR}), gesturing gently toward the water as he tells a story, {NINO} listening with mouth open in wonder, {COMPA} sitting at the child's feet, ducks nearby",
      ropa: "dia",
    },
    // 8 · base 5 (tema)
    {
      texto: {
        es: "Camino del tercer secreto, el sol ya calentaba las aceras. Y entonces pasó algo. {tema.situacion}",
        ca: "De camí cap al tercer secret, el sol ja escalfava les voreres. I llavors va passar una cosa. {tema.situacion}",
      },
      escena: "{TEMA.situacion}{NINO}{TEMA.situacionfin}",
      ropa: "dia",
      base: 5,
    },
    // 9 · base 6 (tema)
    {
      texto: {
        es: "{tema.gesto} {nombre} sintió un calorcito en el pecho, como cuando sale el sol. Y siguió adelante, más {contento|contenta} que antes.",
        ca: "{tema.gesto} {Elnom} va sentir una escalforeta al pit, com quan surt el sol. I va continuar endavant, més {content|contenta} que abans.",
      },
      escena: "{TEMA.gesto}{NINO}{TEMA.gestofin}",
      ropa: "dia",
      base: 6,
    },
    // 10 · base 7
    {
      texto: {
        es: "El tercer secreto estaba en {lugarParque}: árboles tan viejos que habían visto jugar a los abuelos de los abuelos. {nombre} abrazó uno. Era tan grande que no le llegaban los brazos. Las hojas susurraban, shhh, shhh. {nombre} marcó el tercer secreto en el mapa: ¡ya solo faltaban dos!",
        ca: "El tercer secret era a {lugarParque}: arbres tan vells que havien vist jugar els avis dels avis. {Elnom} en va abraçar un. Era tan gros que no li arribaven els braços. Les fulles xiuxiuejaven, xxt, xxt. {Elnom} va marcar el tercer secret al mapa: ja només en faltaven dos!",
      },
      escena:
        "a big leafy park in {CIUDAD}, {NINO} hugging the enormous trunk of a very old tree with arms that do not reach around it, {COMPA} sitting proudly at the roots, sunlight through the leaves",
      ropa: "dia",
      base: 7,
    },
    // 11 · nueva: el contratiempo
    {
      texto: {
        es: "Pero justo entonces sopló un viento travieso, ¡fffuuu!, y le arrancó el mapa de las manos. El mapa voló por encima de los árboles como una cometa. {Compa} corrió detrás, {nombre} corrió detrás… pero el mapa desapareció entre los tejados. Solo quedó, enganchado en una rama, un trocito de papel.",
        ca: "Però just llavors va bufar un vent entremaliat, fffuuu!, i li va arrencar el mapa de les mans. El mapa va volar per sobre dels arbres com un estel. {Compa} va córrer darrere seu, {elnom} també… però el mapa va desaparèixer entre les teulades. Només va quedar, enganxat en una branca, un trosset de paper.",
      },
      escena:
        "a sudden gust of wind in the leafy park of {CIUDAD}, the treasure map flying away high over the trees like a kite, leaves swirling, {NINO} reaching up with surprised face, {COMPA} jumping after the map, a small torn corner of paper caught on a low branch",
      ropa: "dia",
    },
    // 12 · nueva: la decisión
    {
      texto: {
        es: "{nombre} se sentó en un banco con un nudo en la garganta. Le dijeron que podían volver a casa, que no pasaba nada. Pero {nombre} miró el trocito de papel. Tenía un dibujo pequeño: {forma}. —No, todavía no —dijo—. Esto lo sé yo. ¡El cuarto secreto tiene que ver con {aficion}! Y fue {él|ella} quien eligió el camino.",
        ca: "{Elnom} es va asseure en un banc amb un nus a la gola. Li van dir que podien tornar a casa, que no passava res. Però {elnom} va mirar el trosset de paper. Hi havia un dibuix petit: {forma}. —No, encara no —va dir—. Això ho sé jo. El quart secret té a veure amb {aficion}! I va ser {ell|ella} qui va triar el camí.",
      },
      escena:
        "{NINO} sitting on a park bench in {CIUDAD} holding a small torn corner of the map with a tiny drawing related to {AFICION}, a determined spark in the eyes, finger raised with an idea, {COMPA} looking up at the child hopefully",
      ropa: "dia",
    },
    // 13 · base 8
    {
      texto: {
        es: "El cuarto secreto era un rincón escondido donde la gente {deciudad} compartía una pasión: {aficion}. ¡La misma que {nombre}! Había gente mayor y gente pequeña, y nadie miraba el reloj. —¿Ves? —le dijeron—. En tu ciudad hay sitio para lo que te gusta.",
        ca: "El quart secret era un racó amagat on la gent {deciudad} compartia una passió: {aficion}. La mateixa que {elnom}! Hi havia gent gran i gent petita, i ningú no mirava el rellotge. —Ho veus? —li van dir—. A la teva ciutat hi ha lloc per a allò que t'agrada.",
      },
      escena:
        "a hidden charming little square in {CIUDAD} where people of all ages enjoy activities related to {AFICION}, {NINO} joining in delighted, {COMPA} in the middle of the fun",
      ropa: "dia",
      base: 8,
    },
    // 14 · nueva: el mapa vuelve
    {
      texto: {
        es: "Y entonces, ¡sorpresa! Un niño se acercó con un papel arrugado en la mano. —¿Es tuyo? Ha caído del cielo, justo aquí. ¡Era el mapa! El viento travieso lo había traído al cuarto secreto antes que a nadie. {nombre} se rio tanto que {compa} también pareció reírse. Por detrás quedaba la última pista: «Sube hasta donde se toca el cielo».",
        ca: "I llavors, sorpresa! Un nen se li va acostar amb un paper arrugat a la mà. —És teu? Ha caigut del cel, just aquí. Era el mapa! El vent entremaliat l'havia portat al quart secret abans que ningú. {Elnom} va riure tant que {compa} també semblava riure. Per darrere hi quedava l'última pista: «Puja fins on es toca el cel».",
      },
      escena:
        "in the hidden little square of {CIUDAD}, a smiling child of the same age handing a crumpled treasure map back to {NINO}, who laughs with joy, {COMPA} bouncing happily, people enjoying {AFICION} in the background",
      ropa: "dia",
    },
    // 15 · base 9
    {
      texto: {
        es: "Para el último secreto había que subir muy alto, hasta {lugarAlto}. —¡Uf, cuántos escalones! —resopló {nombre}. Pero no se paró: escalón a escalón, llegó arriba con las mejillas rojas. Y desde allí vio toda la ciudad, pequeña como un juguete.",
        ca: "Per a l'últim secret calia pujar molt amunt, fins a {lugarAlto}. —Uf, quants esglaons! —va bufar {elnom}. Però no es va aturar: esglaó a esglaó, va arribar a dalt amb les galtes vermelles. I des d'allà va veure tota la ciutat, petita com una joguina.",
      },
      escena:
        "panoramic view from the highest point of {CIUDAD} ({LUGAR}), {NINO} with rosy cheeks standing at the top with arms wide open looking at the whole city below like a toy model, {COMPA} beside, wind in the hair",
      ropa: "dia",
      base: 9,
    },
    // 16 · nueva: el repaso desde arriba
    {
      texto: {
        es: "Desde arriba, {nombre} fue buscando con el dedo todos los secretos del día: allí {lugarPlaza}, allá {lugarAgua}, más lejos {lugarParque}. Con el lápiz de color {color} los rodeó uno a uno en el mapa. —¡Los he encontrado todos! —dijo, sin aliento. Pero en el mapa quedaba una última página, doblada, que todavía no había abierto.",
        ca: "Des de dalt, {elnom} anava buscant amb el dit tots els secrets del dia: allà {lugarPlaza}, més enllà {lugarAgua}, més lluny {lugarParque}. Amb el llapis de color {color} els va encerclar un per un al mapa. —Els he trobat tots! —va dir, sense alè. Però al mapa encara hi quedava una última pàgina, doblegada, que no havia obert.",
      },
      escena:
        "at the viewpoint high above {CIUDAD} ({LUGAR}), {NINO} pointing with one finger at faraway places of the city, the treasure map in the other hand with little circles drawn in {COLOR} pencil, a folded last page sticking out, {COMPA} looking where the child points",
      ropa: "dia",
    },
    // 17 · base 10
    {
      texto: {
        es: "En la última página del mapa solo ponía: «El secreto más grande {deciudad} eres tú». {nombre} lo entendió: una ciudad no son solo calles. Son las personas que la quieren. {tema.leccion}",
        ca: "A l'última pàgina del mapa només hi deia: «El secret més gran {deciudad} ets tu». {Elnom} ho va entendre: una ciutat no són només carrers. Són les persones que l'estimen. {tema.leccion}",
      },
      escena:
        "close-up of {NINO} reading the last page of the treasure map at the viewpoint, on the map a small drawing of the child in the center of the city, the child smiling with realization, {COMPA} leaning in",
      ropa: "dia",
      base: 10,
    },
    // 18 · nueva: Lunilla al atardecer
    {
      texto: {
        es: "Al bajar, el cielo se volvió de color melocotón y, muy pronto, asomó una luna pequeñita con bufanda amarilla. ¡Era Lunilla! Habló bajito, como habla siempre: —Lo has hecho muy bien, {nombrePelado}. No por encontrar los secretos, sino por no rendirte cuando voló el mapa. {nombre} le dijo adiós con la mano, {orgulloso|orgullosa}.",
        ca: "En baixar, el cel es va tornar de color préssec i, molt aviat, va treure el cap una lluna petitona amb bufanda groga. Era la Lunilla! Va parlar fluixet, com parla sempre: —Ho has fet molt bé, {nombrePelado}. No per haver trobat els secrets, sinó per no rendir-te quan va volar el mapa. {Elnom} li va dir adéu amb la mà, {orgullós|orgullosa}.",
      },
      escena:
        "dusk, peach-colored sky over the rooftops of {CIUDAD}, {NINO} walking downhill along a quiet street holding the folded map and waving up at the sky, {COMPA} trotting beside, {LUNILLA} appearing early in the pale sky, smiling softly",
      ropa: "dia",
    },
    // 19 · nueva: el giro
    {
      texto: {
        es: "En casa, {nombre} fue a la cocina a por un vaso de agua y se quedó {quieto|quieta}. En la nevera había una nota: «Comprar pan y mandarinas». ¡Tenía la misma letra que el sobre amarillo! Se volvió despacio hacia {arropa}. Nadie dijo nada. Solo hubo un guiño y una sonrisa de oreja a oreja. —¡Así que el mapa era de casa! —se rio {nombre}.",
        ca: "A casa, {elnom} va anar a la cuina a buscar un got d'aigua i es va quedar {quiet|quieta}. A la nevera hi havia una nota: «Comprar pa i mandarines». Tenia la mateixa lletra que el sobre groc! Es va girar a poc a poc cap a {arropa}. Ningú no va dir res. Només hi va haver una picada d'ullet i un somriure d'orella a orella. —Així que el mapa era de casa! —va riure {elnom}.",
      },
      escena:
        "evening in a cozy home kitchen, {NINO} holding the yellow envelope next to a handwritten note stuck on the fridge, comparing the handwriting with wide amazed eyes, {COMPA} looking up, an adult family member winking with a big smile at the edge of the frame",
      ropa: "dia",
    },
    // 20 · base 11
    {
      texto: {
        es: "Después de cenar, {nombre} sacó papel y colores y dibujó su propio mapa, con todos los secretos y uno nuevo: la casa donde vivían {nombrePelado} y {compa}. Encima de la casa pintó un corazón pequeñito, porque aquel era el secreto más bonito de todos.",
        ca: "Després de sopar, {elnom} va treure paper i colors i va dibuixar el seu propi mapa, amb tots els secrets i un de nou: la casa on vivien {elnom} i {compa}. A sobre de la casa hi va pintar un cor petitó, perquè aquell era el secret més bonic de tots.",
      },
      escena:
        "sunset at home, {NINO} lying on the floor drawing a colorful map of {CIUDAD} with markers, little drawings of the market, the water, the old tree and the viewpoint, {COMPA} lying on a corner of the paper",
      ropa: "dia",
      base: 11,
    },
    // 21 · nueva: un mapa para su amigo
    {
      texto: {
        es: "Entonces a {nombre} se le ocurrió una idea, y la idea era solo suya. Cogió otro papel y dibujó un mapa nuevo, con pistas inventadas por {él|ella}. Lo metió en un sobre amarillo para {amigo}. —Mañana será una sorpresa: nadie sabrá quién lo ha hecho —le susurró a {compa}—. Ahora me toca a mí guardar secretos.",
        ca: "Llavors a {elnom} se li va acudir una idea, i la idea era només seva. Va agafar un altre paper i va dibuixar un mapa nou, amb pistes inventades per {ell|ella}. El va ficar en un sobre groc per a {amigo}. —Demà serà una sorpresa: ningú no sabrà qui l'ha fet —va xiuxiuejar a {compa}—. Ara em toca a mi guardar secrets.",
      },
      escena:
        "evening at a small desk at home under a warm lamp, {NINO} sliding a freshly drawn treasure map into a yellow envelope with a secret smile, colored pencils scattered around, {COMPA} watching closely",
      ropa: "dia",
    },
    // 22 · base 12
    {
      texto: {
        es: "Esa noche, las luces {deciudad} brillaban como estrellas caídas. {nombre} pegó su mapa junto a la cama y se durmió pensando en su próxima aventura. Porque {ciudad} todavía guardaba muchos secretos. Y ahora, todos juntos, como Lunilla desde el cielo: «Buenas noches, {ciudad}; mañana, más secretos».",
        ca: "Aquella nit, els llums {deciudad} brillaven com estrelles caigudes. {Elnom} va enganxar el seu mapa al costat del llit i es va adormir pensant en la seva propera aventura. Perquè {ciudad} encara guardava molts secrets. I ara, tots junts, com la Lunilla des del cel: «Bona nit, {ciudad}; demà, més secrets».",
      },
      escena:
        "night bedroom, the hand-drawn map pinned on the wall next to the bed, {NINO} falling asleep smiling, {COMPA} curled up, window showing the twinkling lights of {CIUDAD} and its landmark ({LUGAR}), {LUNILLA} watching tenderly from the sky",
      ropa: "pijama",
      base: 12,
    },
  ],
  // Las escenas de tema se parten alrededor de {NINO} para que la página lleve {NINO}
  // y, una vez sustituidas, den exactamente la misma frase que el cuento de 12 páginas.
  escenasTema: {
    curiosidad: {
      situacion: "old narrow street in {CIUDAD} with flower pots on balconies, ",
      situacionfin: " pointing at an old stone doorway full of questions, {COMPA} looking up too",
      gesto: "a kind elderly lady watering red geraniums on a ground-floor balcony telling a story to ",
      gestofin: ", who listens with sparkling eyes, {COMPA} sitting politely",
    },
    cuidar: {
      situacion: "a park bench in {CIUDAD} with a crumpled paper and an empty can on the ground next to it, ",
      situacionfin: " noticing them with a frown, {COMPA} sniffing the can",
      gesto: "",
      gestofin: " dropping the paper and can into a green litter bin, a little bird on a branch whistling happily, {COMPA} wagging, clean bright park",
    },
    "lo-nuevo": {
      situacion: "the entrance of an unknown narrow shadowy street in {CIUDAD}, ",
      situacionfin: " hesitating at the corner, holding an adult's hand, {COMPA} close to the child's legs",
      gesto: "a surprising sunny little square at the end of the street with pigeons and a singing fountain, ",
      gestofin: " running in delighted, {COMPA} chasing pigeons playfully",
    },
    vecinos: {
      situacion: "the doorway of an apartment building in {CIUDAD}, an elderly neighbor with heavy shopping bags, an orange rolling down the steps, ",
      situacionfin: " noticing, {COMPA} watching the orange",
      gesto: "",
      gestofin: " handing back the orange and carrying the smallest shopping bag up the stairs next to the smiling elderly neighbor, {COMPA} following",
    },
  },
};
