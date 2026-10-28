import type { Plantilla } from "./tipos";

// Colección MI CIUDAD · «{nombre} y los secretos {deciudad}»
// Usa lugares reales cuando la ciudad está en el catálogo (catalogo.ts → CIUDADES);
// si no, lugares genéricos. La IA puede sustituirlos por lugares reales y conocidos.
export const ciudad: Plantilla = {
  coleccion: "ciudad",
  titulo: { es: "{nombre} y los secretos {deciudad}", ca: "{Elnom} i els secrets {deciudad}" },
  portada:
    "{NINO} holding an old hand-drawn treasure map and pointing excitedly at the skyline of {CIUDAD} ({LUGAR}), {COMPA} beside, golden morning light",
  contraportada: {
    es: "Una búsqueda del tesoro por los rincones de tu ciudad.",
    ca: "Una cerca del tresor pels racons de la teva ciutat.",
  },
  paginas: [
    {
      texto: {
        es: "Cada mañana, {nombre} se asomaba a la ventana para ver despertar a {ciudad}. Pero aquel sábado, debajo de la puerta, apareció un sobre amarillo con una letra muy antigua: «Para {nombrePelado}, que tiene ojos de {explorador|exploradora}».",
        ca: "Cada matí, {elnom} treia el cap per la finestra per veure com es despertava {ciudad}. Però aquell dissabte, sota la porta, va aparèixer un sobre groc amb una lletra molt antiga: «Per a {elnom}, que té ulls {d'explorador|d'exploradora}».",
      },
      escena:
        "early morning, {NINO} in the doorway of home picking up a yellow envelope from the floor, {COMPA} sniffing it, window behind showing the rooftops of {CIUDAD}",
      ropa: "dia",
    },
    {
      texto: {
        es: "Dentro había un mapa dibujado a mano: «Los cinco secretos {deciudad}». Debajo, una pista: «El primer secreto huele a fruta y a pan recién hecho». {nombre} y {compa} se miraron. ¡Había que salir a explorar!",
        ca: "A dins hi havia un mapa dibuixat a mà: «Els cinc secrets {deciudad}». A sota, una pista: «El primer secret fa olor de fruita i de pa acabat de fer». {Elnom} i {compa} es van mirar. Calia sortir a explorar!",
      },
      escena:
        "{NINO} unfolding an old hand-drawn treasure map of {CIUDAD} with five little drawn stars on it, {COMPA} looking at the map with tilted head, a small backpack ready",
      ropa: "dia",
    },
    {
      texto: {
        es: "Con su familia de la mano, llegaron a {lugarPlaza}. Había naranjas como soles y panes como piedras doradas. La frutera le guiñó un ojo y le regaló una mandarina: —Primer secreto: aquí la ciudad se despierta antes que nadie.",
        ca: "De la mà de la seva família, van arribar a {lugarPlaza}. Hi havia taronges com sols i pans com pedres daurades. La fruitera li va picar l'ullet i li va regalar una mandarina: —Primer secret: aquí la ciutat es desperta abans que ningú.",
      },
      escena:
        "a lively traditional market in {CIUDAD}, colorful fruit stalls with oranges and bread, a smiling fruit seller handing a tangerine to {NINO}, {COMPA} beside, an adult's hand holding the child's hand at the edge of the frame",
      ropa: "dia",
    },
    {
      texto: {
        es: "La segunda pista decía: «Busca el agua que cuenta historias». Y allí estaba {lugarAgua}. {nombre} se asomó y vio a una familia de patos que nadaba en fila, como un tren con plumas.",
        ca: "La segona pista deia: «Busca l'aigua que explica històries». I allà hi havia {lugarAgua}. {Elnom} s'hi va acostar i va veure una família d'ànecs que nedava en fila, com un tren amb plomes.",
      },
      escena:
        "{NINO} and {COMPA} leaning over a railing by the water in {CIUDAD} ({LUGAR}), a family of ducks swimming in a row below, reflections shimmering, gentle morning light",
      ropa: "dia",
    },
    {
      texto: {
        es: "Camino del tercer secreto pasó algo. {tema.situacion}",
        ca: "De camí cap al tercer secret va passar una cosa. {tema.situacion}",
      },
      escena: "{TEMA.situacion}",
      ropa: "dia",
    },
    {
      texto: {
        es: "{tema.gesto}",
        ca: "{tema.gesto}",
      },
      escena: "{TEMA.gesto}",
      ropa: "dia",
    },
    {
      texto: {
        es: "El tercer secreto estaba en {lugarParque}: árboles tan viejos que habían visto jugar a los abuelos de los abuelos. {nombre} abrazó uno. Era tan grande que no le llegaban los brazos.",
        ca: "El tercer secret era a {lugarParque}: arbres tan vells que havien vist jugar els avis dels avis. {Elnom} en va abraçar un. Era tan gros que no li arribaven els braços.",
      },
      escena:
        "a big leafy park in {CIUDAD}, {NINO} hugging the enormous trunk of a very old tree with arms that do not reach around it, {COMPA} sitting proudly at the roots, sunlight through the leaves",
      ropa: "dia",
    },
    {
      texto: {
        es: "El cuarto secreto era un rincón escondido donde la gente de {ciudad} compartía una pasión: {aficion}. ¡La misma que {nombre}! —Ves —le dijeron—, en tu ciudad hay sitio para lo que te gusta.",
        ca: "El quart secret era un racó amagat on la gent de {ciudad} compartia una passió: {aficion}. La mateixa que {elnom}! —Ho veus? —li van dir—, a la teva ciutat hi ha lloc per a allò que t'agrada.",
      },
      escena:
        "a hidden charming little square in {CIUDAD} where people of all ages enjoy activities related to {AFICION}, {NINO} joining in delighted, {COMPA} in the middle of the fun",
      ropa: "dia",
    },
    {
      texto: {
        es: "Para el último secreto había que subir muy alto, hasta {lugarAlto}. Escalón a escalón, {nombre} llegó arriba con las mejillas rojas. Y desde allí vio toda la ciudad, pequeña como un juguete.",
        ca: "Per a l'últim secret calia pujar molt amunt, fins a {lugarAlto}. Esglaó a esglaó, {elnom} va arribar a dalt amb les galtes vermelles. I des d'allà va veure tota la ciutat, petita com una joguina.",
      },
      escena:
        "panoramic view from the highest point of {CIUDAD} ({LUGAR}), {NINO} with rosy cheeks standing at the top with arms wide open looking at the whole city below like a toy model, {COMPA} beside, wind in the hair",
      ropa: "dia",
    },
    {
      texto: {
        es: "En la última página del mapa solo ponía: «El secreto más grande {deciudad} eres tú». {nombre} lo entendió: una ciudad no son solo calles. Son las personas que la quieren. {tema.leccion}",
        ca: "A l'última pàgina del mapa només hi deia: «El secret més gran {deciudad} ets tu». {Elnom} ho va entendre: una ciutat no són només carrers. Són les persones que l'estimen. {tema.leccion}",
      },
      escena:
        "close-up of {NINO} reading the last page of the treasure map at the viewpoint, on the map a small drawing of the child in the center of the city, the child smiling with realization, {COMPA} leaning in",
      ropa: "dia",
    },
    {
      texto: {
        es: "Al volver a casa, {nombre} sacó papel y colores y dibujó su propio mapa, con todos los secretos y uno nuevo: la casa donde vivían {nombrePelado} y {compa}.",
        ca: "En tornar a casa, {elnom} va treure paper i colors i va dibuixar el seu propi mapa, amb tots els secrets i un de nou: la casa on vivien {elnom} i {compa}.",
      },
      escena:
        "sunset at home, {NINO} lying on the floor drawing a colorful map of {CIUDAD} with markers, little drawings of the market, the water, the old tree and the viewpoint, {COMPA} lying on a corner of the paper",
      ropa: "dia",
    },
    {
      texto: {
        es: "Esa noche, las luces {deciudad} brillaban como estrellas caídas. {nombre} pegó su mapa junto a la cama y se durmió pensando en su próxima aventura. Porque {ciudad} todavía guardaba muchos secretos.",
        ca: "Aquella nit, els llums {deciudad} brillaven com estrelles caigudes. {Elnom} va enganxar el seu mapa al costat del llit i es va adormir pensant en la seva propera aventura. Perquè {ciudad} encara guardava molts secrets.",
      },
      escena:
        "night bedroom, the hand-drawn map pinned on the wall next to the bed, {NINO} falling asleep smiling, {COMPA} curled up, window showing the twinkling lights of {CIUDAD} and its landmark ({LUGAR})",
      ropa: "pijama",
    },
  ],
  escenasTema: {
    curiosidad: {
      situacion:
        "old narrow street in {CIUDAD} with flower pots on balconies, {NINO} pointing at an old stone doorway full of questions, {COMPA} looking up too",
      gesto:
        "a kind elderly lady watering red geraniums on a ground-floor balcony telling a story to {NINO}, who listens with sparkling eyes, {COMPA} sitting politely",
    },
    cuidar: {
      situacion:
        "a park bench in {CIUDAD} with a crumpled paper and an empty can on the ground next to it, {NINO} noticing them with a frown, {COMPA} sniffing the can",
      gesto:
        "{NINO} dropping the paper and can into a green litter bin, a little bird on a branch whistling happily, {COMPA} wagging, clean bright park",
    },
    "lo-nuevo": {
      situacion:
        "the entrance of an unknown narrow shadowy street in {CIUDAD}, {NINO} hesitating at the corner, holding an adult's hand, {COMPA} close to the child's legs",
      gesto:
        "a surprising sunny little square at the end of the street with pigeons and a singing fountain, {NINO} running in delighted, {COMPA} chasing pigeons playfully",
    },
    vecinos: {
      situacion:
        "the doorway of an apartment building in {CIUDAD}, an elderly neighbor with heavy shopping bags, an orange rolling down the steps, {NINO} noticing, {COMPA} watching the orange",
      gesto:
        "{NINO} handing back the orange and carrying the smallest shopping bag up the stairs next to the smiling elderly neighbor, {COMPA} following",
    },
  },
};
