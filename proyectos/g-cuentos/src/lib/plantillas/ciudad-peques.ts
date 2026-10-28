import type { Plantilla } from "./tipos";

// Colección MI CIUDAD · peques (2–4 años) · «{nombre} y el mapa de {ciudad}»
// Lunilla deja un mapa con cinco estrellas. Estribillo: «Mapa, mapita, ¿adónde vamos ahora?» → «¡Plin!».
// Los lugares ({lugarPlaza}…) pueden ser reales o genéricos: no se les atribuye nada que no tengan todos.
export const ciudadPeques: Plantilla = {
  coleccion: "ciudad",
  banda: "peques",
  titulo: { es: "{nombre} y el mapa de {ciudad}", ca: "{Elnom} i el mapa {deciudad}" },
  portada:
    "{NINO} holding up a big hand-drawn map with five shining yellow stars, {COMPA} beside looking at it, the rooftops and landmark of {CIUDAD} behind ({LUGAR}), golden morning light, {LUNILLA} smiling in the upper right corner of the sky",
  contraportada: {
    es: "Un primer paseo por tu ciudad, estrella a estrella, para los más pequeños.",
    ca: "Un primer passeig per la teva ciutat, estrella a estrella, per als més petits.",
  },
  paginas: [
    {
      texto: {
        es: "Por la mañana, {nombre} abrió la ventana y dijo: —¡Buenos días, {ciudad}! Y allí mismo había un papel enrollado con un lazo de color {color}. ¿Quién lo habrá dejado?",
        ca: "Al matí, {elnom} va obrir la finestra i va dir: —Bon dia, {ciudad}! A l'ampit hi havia un paper enrotllat amb un llaç de color {color}. Qui l'ha deixat aquí?",
      },
      escena:
        "early morning, {NINO} at an open window finding a rolled paper tied with a {COLOR} ribbon on the windowsill, {COMPA} on tiptoes beside, the rooftops of {CIUDAD} waking up outside",
      ropa: "dia",
    },
    {
      texto: {
        es: "¡Era un mapa! Un mapa de {ciudad} con cinco estrellas amarillas. Abajo ponía: «Con cariño, Lunilla». {nombre} y {compa} se miraron: ¡nos vamos de aventura!",
        ca: "Era un mapa! Un mapa {deciudad} amb cinc estrelles grogues. A sota hi deia: «Amb estima, la Lunilla». {Elnom} i {compa} es van mirar: ens n'anem d'aventura!",
      },
      escena:
        "{NINO} sitting on the floor unrolling a big simple hand-drawn map of {CIUDAD} with five yellow stars and a tiny crescent moon signature, {COMPA} looking at the map with a tilted head",
      ropa: "dia",
    },
    {
      texto: {
        es: "{nombre} salió de casa con {arropa}, con {compa} y con el mapa. Y preguntó: «Mapa, mapita, ¿adónde vamos ahora?». ¡Plin! La primera estrella brilló encima de {lugarPlaza}.",
        ca: "{Elnom} va sortir de casa amb {arropa}, amb {compa} i amb el mapa. I va preguntar: «Mapa, mapeta, on anem ara?». Plin! La primera estrella va brillar damunt de {lugarPlaza}.",
      },
      escena:
        "a street in {CIUDAD}, {NINO} walking out of the front door holding the map up high, one star on the map glowing, {COMPA} trotting beside, an adult's hand holding the child's hand at the edge of the frame",
      ropa: "dia",
    },
    {
      texto: {
        es: "En {lugarPlaza} había mucha gente. Pasos: tap, tap. Voces: bla, bla. Y palomas: ¡ru, ru! ¿Cuántas palomas ves? {nombre} las saludó con la mano. Primer secreto: aquí la ciudad dice buenos días.",
        ca: "Allà, a {lugarPlaza}, hi havia molta gent. Passos: tap, tap. Veus: bla, bla. I coloms: ru, ru! Quants coloms veus? {Elnom} els va saludar amb la mà. Primer secret: aquí la ciutat diu bon dia.",
      },
      escena:
        "a lively square in {CIUDAD} ({LUGAR}) full of people walking and a flock of pigeons, {NINO} in the middle waving at the pigeons, {COMPA} watching them, bright morning colors",
      ropa: "dia",
    },
    {
      texto: {
        es: "«Mapa, mapita, ¿adónde vamos ahora?». ¡Plin! La segunda estrella brillaba en {lugarAgua}. {nombre} se quedó muy {quieto|quieta} y escuchó: chap, chap, chap. Segundo secreto: el agua canta bajito.",
        ca: "«Mapa, mapeta, on anem ara?». Plin! La segona estrella brillava a {lugarAgua}. {Elnom} es va quedar {molt quiet|molt quieta} i va escoltar: xap, xap, xap. Segon secret: l'aigua canta baixet.",
      },
      escena:
        "{NINO} and {COMPA} by the water in {CIUDAD} ({LUGAR}), the child with eyes closed and a hand behind one ear listening, gentle ripples and sparkles on the water",
      ropa: "dia",
    },
    {
      texto: {
        es: "Por el camino pasó algo. {tema.situacion}",
        ca: "Pel camí va passar una cosa. {tema.situacion}",
      },
      escena: "{NINO} with the star map in one hand, {TEMA.situacion}",
      ropa: "dia",
    },
    {
      texto: {
        es: "{tema.gesto} Y el mapa hizo ¡plin!, como si sonriera.",
        ca: "{tema.gesto} I el mapa va fer plin!, com si somrigués.",
      },
      escena: "{NINO} with the star map tucked under one arm, {TEMA.gesto}",
      ropa: "dia",
    },
    {
      texto: {
        es: "«Mapa, mapita, ¿adónde vamos ahora?». ¡Plin! Hacia {lugarParque}. Allí {nombre} encontró a {amigo} y jugaron a pillar. ¡Hop, hop, hop! Tercer secreto: con amigos, todo es más divertido.",
        ca: "«Mapa, mapeta, on anem ara?». Plin! Cap a {lugarParque}. Allà {elnom} va trobar {amigo} i van jugar a fet. Hop, hop, hop! Tercer secret: amb amics, tot és més divertit.",
      },
      escena:
        "a sunny open green space in {CIUDAD} ({LUGAR}), {NINO} running and laughing in a game of tag with a friend, {COMPA} hopping along, wide simple composition",
      ropa: "dia",
    },
    {
      texto: {
        es: "¡Plin! La cuarta estrella: un rincón escondido donde todos compartían lo que más le gusta a {nombre}: ¡{aficion}! Cuarto secreto: en {ciudad} hay sitio para lo que te gusta.",
        ca: "Plin! La quarta estrella: un racó amagat on tothom compartia el que més li agrada a {elnom}: {aficion}! Quart secret: a {ciudad} hi ha lloc per al que t'agrada.",
      },
      escena:
        "a hidden cozy little corner of {CIUDAD} where children and grown-ups enjoy things related to {AFICION}, {NINO} joining in delighted, {COMPA} in the middle of the fun",
      ropa: "dia",
    },
    {
      texto: {
        es: "«Mapa, mapita, ¿adónde vamos ahora?». ¡Plin! ¡Arriba, hasta {lugarAlto}! Sube que sube, ¡uf, uf, uf! {nombre} llegó con las mejillas coloradas.",
        ca: "«Mapa, mapeta, on anem ara?». Plin! Amunt, fins a {lugarAlto}! Puja que puja, uf, uf, uf! {Elnom} va arribar amb les galtes vermelles.",
      },
      escena:
        "{NINO} climbing up a gentle path toward the highest point of {CIUDAD} ({LUGAR}), rosy cheeks and a big effort smile, {COMPA} climbing ahead, the last star on the map glowing",
      ropa: "dia",
    },
    {
      texto: {
        es: "Desde allí arriba, {ciudad} parecía de juguete: casitas, cochecitos, gente chiquitita. Fiuuu, soplaba el viento. ¿Encuentras la casa de {nombre}? Quinto secreto: desde arriba, la ciudad cabe en una mano.",
        ca: "Des d'allà dalt, {ciudad} semblava de joguina: casetes, cotxets, gent petitona. Fiuuu, bufava el vent. Trobes la casa {delnom}? Cinquè secret: des de dalt, la ciutat cap en una mà.",
      },
      escena:
        "panoramic view from the top of {CIUDAD} ({LUGAR}), {NINO} seen from behind with arms wide open, the whole town below small like a toy model, {COMPA} beside, wind in the hair",
      ropa: "dia",
    },
    {
      texto: {
        es: "Pero detrás del mapa había una estrella más. ¡Plin! Brillaba encima de la casa de {nombre}. Y ponía: «Aquí vive el secreto más bonito {deciudad}: ¡tú!».",
        ca: "Però darrere del mapa hi havia una estrella més. Plin! Brillava damunt de la casa {delnom}. I hi deia: «Aquí hi viu el secret més bonic {deciudad}: tu!».",
      },
      escena:
        "close-up of {NINO} turning the map over and smiling, on the back a small drawing of the child's own house with one big glowing yellow star above it, {COMPA} leaning in",
      ropa: "dia",
    },
    {
      texto: {
        es: "Volvieron a casa despacito, con los pies cansados y el corazón contento. {tema.leccion}",
        ca: "Van tornar a casa a poc a poc, amb els peus cansats i el cor content. {tema.leccion}",
      },
      escena:
        "golden late afternoon, {NINO} walking home along a quiet street of {CIUDAD} holding the rolled map, {COMPA} trotting slowly beside, long soft shadows",
      ropa: "dia",
    },
    {
      texto: {
        es: "En casa, {nombre} cogió sus colores y dibujó su propio mapa: la plaza, el agua, el parque, lo más alto… ¡y su casa, de color {color}!",
        ca: "A casa, {elnom} va agafar els colors i va dibuixar el seu propi mapa: la plaça, l'aigua, el parc, el lloc més alt… i casa seva, de color {color}!",
      },
      escena:
        "{NINO} lying on the floor drawing a simple colorful map with crayons, little drawings of a square, water, a park, a high place and a {COLOR} house, {COMPA} lying on a corner of the paper",
      ropa: "dia",
    },
    {
      texto: {
        es: "Cuando acabó, {compa} puso la patita en una esquina del papel. ¡Era su firma! {nombre} colgó el mapa al lado de la cama.",
        ca: "Quan va acabar, {compa} va posar la poteta en un racó del paper. Era la seva signatura! {Elnom} va penjar el mapa al costat del llit.",
      },
      escena:
        "{COMPA} pressing a tiny paw print on the corner of the drawn map, {NINO} laughing and then pinning the map on the bedroom wall next to the bed",
      ropa: "dia",
    },
    {
      texto: {
        es: "Llegó la noche. Chap, chap, el baño. Ñam, ñam, la cena. Y el pijama, ¡ya! {nombre} dejó {objeto} junto a la almohada.",
        ca: "Va arribar la nit. Xap, xap, el bany. Nyam, nyam, el sopar. I el pijama, ja! {Elnom} va deixar {objeto} al costat del coixí.",
      },
      escena:
        "evening in the bedroom, {NINO} freshly bathed in pajamas placing {AFICION} next to the pillow, {COMPA} jumping onto the bed, the drawn map on the wall, warm lamp light",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Por la ventana se veían las luces {deciudad}, que se encendían una a una: plin, plin, plin. Como las estrellas del mapa. {nombre} bostezó: aaah.",
        ca: "Per la finestra es veien els llums {deciudad}, que s'encenien un a un: plin, plin, plin. Com les estrelles del mapa. {Elnom} va badallar: aaah.",
      },
      escena:
        "{NINO} in bed yawning and looking out of the window, the lights of {CIUDAD} switching on one by one in the dusk like little stars, {COMPA} curled at the foot of the bed",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Y allí arriba, con su bufanda amarilla, apareció Lunilla. Le guiñó un ojo a {nombre}, como diciendo: «¿Te ha gustado mi mapa?». Y ahora, todos juntos, como Lunilla desde el cielo: «Buenas noches, {ciudad}; mañana, más secretos».",
        ca: "I allà dalt, amb la seva bufanda groga, va aparèixer la Lunilla. Va fer l'ullet a {elnom}, com si digués: «T'ha agradat el meu mapa?». I ara, tots junts, com la Lunilla des del cel: «Bona nit, {ciudad}; demà, més secrets».",
      },
      escena:
        "night, {NINO} falling asleep smiling in bed, {COMPA} curled up, the drawn map on the wall, a big window showing the twinkling lights of {CIUDAD} and its landmark ({LUGAR}), {LUNILLA} winking tenderly from the sky",
      ropa: "pijama",
    },
  ],
  escenasTema: {
    curiosidad: {
      situacion:
        "on an old narrow street in {CIUDAD} with flower pots on the balconies, the child pointing up at an old stone doorway with a curious face, {COMPA} looking up too",
      gesto:
        "listening with sparkling eyes to a kind elderly lady who waters red geraniums on a ground-floor balcony and tells a story, {COMPA} sitting politely",
    },
    cuidar: {
      situacion:
        "next to a park bench in {CIUDAD} with a crumpled paper and an empty can on the ground, the child noticing them with a frown, {COMPA} sniffing the can",
      gesto:
        "dropping the paper and the can into a green litter bin, a little bird on a branch whistling happily, {COMPA} beside, clean bright street",
    },
    "lo-nuevo": {
      situacion:
        "hesitating at the entrance of an unknown narrow shady street in {CIUDAD}, holding an adult's hand, {COMPA} close to the child's legs",
      gesto:
        "walking delighted into a surprising sunny little square with pigeons and a singing fountain, holding an adult's hand, {COMPA} chasing pigeons playfully",
    },
    vecinos: {
      situacion:
        "at the doorway of an apartment building in {CIUDAD}, an elderly neighbor with heavy shopping bags, an orange rolling down the steps, the child noticing it, {COMPA} watching the orange",
      gesto:
        "handing back the orange and carrying the smallest shopping bag next to the smiling elderly neighbor, {COMPA} following",
    },
  },
};
