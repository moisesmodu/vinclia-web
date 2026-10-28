// Catálogo cerrado: colecciones, temas (valor o miedo), compañeros y aficiones.
// Las listas son cerradas a propósito: así las plantillas siempre suenan bien,
// también cuando no hay IA disponible (relleno determinista).

export type Idioma = "es" | "ca";
export type Genero = "m" | "f";
export type ColeccionId = "dormir" | "valores" | "hermanito" | "ciudad";
export type Bi = { es: string; ca: string };

export interface Tema {
  id: string;
  etiqueta: Bi;
  // Fragmentos que usan las plantillas. Pueden llevar {a|b} (género) y {nombre}.
  campos: Record<string, Bi>;
}

export interface Coleccion {
  id: ColeccionId;
  nombre: Bi;
  descripcion: Bi;
  edades: string;
  temas: Tema[];
}

export const COLECCIONES: Coleccion[] = [
  {
    id: "dormir",
    nombre: { es: "Dormir", ca: "Dormir" },
    descripcion: {
      es: "Un cuento de buenas noches para perder el miedo y dormir tranquilos.",
      ca: "Un conte de bona nit per perdre la por i dormir tranquils.",
    },
    edades: "2-7",
    temas: [
      {
        id: "oscuridad",
        etiqueta: { es: "Miedo a la oscuridad", ca: "Por de la foscor" },
        campos: {
          problema: {
            es: "Cuando se apagó la luz, la habitación se volvió negra como un túnel y a {nombre} se le encogió la barriga.",
            ca: "Quan es va apagar el llum, l'habitació es va tornar negra com un túnel i a {elnom} se li va arronsar la panxa.",
          },
          ayuda: {
            es: "La oscuridad no es nada, es solo la manta de la noche. Mírala despacio y verás que dentro están las mismas cosas de siempre.",
            ca: "La foscor no és res, només és la manta de la nit. Mira-la a poc a poc i veuràs que a dins hi ha les coses de sempre.",
          },
          leccion: {
            es: "La oscuridad ya no era un túnel: era una manta suave que tapaba la ciudad para que descansara.",
            ca: "La foscor ja no era un túnel: era una manta suau que tapava la ciutat perquè descansés.",
          },
        },
      },
      {
        id: "monstruos",
        etiqueta: { es: "Miedo a los monstruos", ca: "Por dels monstres" },
        campos: {
          problema: {
            es: "En cuanto se apagó la luz, {nombre} pensó en los monstruos que, según decían, vivían debajo de las camas.",
            ca: "Així que es va apagar el llum, {elnom} va pensar en els monstres que, deien, vivien sota els llits.",
          },
          ayuda: {
            es: "Los monstruos solo viven en las sombras que no miramos. Cuando una sombra te asuste, ponle nombre y dale los buenos días.",
            ca: "Els monstres només viuen a les ombres que no mirem. Quan una ombra et faci por, posa-li nom i dóna-li el bon dia.",
          },
          leccion: {
            es: "Debajo de la cama solo había un calcetín perdido y un montón de sueños esperando su turno.",
            ca: "Sota el llit només hi havia un mitjó perdut i un munt de somnis esperant el seu torn.",
          },
        },
      },
      {
        id: "dormir-solo",
        etiqueta: { es: "Dormir solo en su cama", ca: "Dormir sol al seu llit" },
        campos: {
          problema: {
            es: "Era la primera noche que {nombre} dormía {solo|sola} en su cama grande, y la cama parecía un océano.",
            ca: "Era la primera nit que {elnom} dormia {sol|sola} al seu llit gran, i el llit semblava un oceà.",
          },
          ayuda: {
            es: "Nadie duerme del todo solo. La luna vigila, tu familia está al otro lado de la pared y el cariño no se apaga con la luz.",
            ca: "Ningú dorm ben sol. La lluna vigila, la teva família és a l'altra banda de la paret i l'estima no s'apaga amb el llum.",
          },
          leccion: {
            es: "La cama grande ya no era un océano: era un barco valiente, y {nombre} era su {capitán|capitana}.",
            ca: "El llit gran ja no era un oceà: era un vaixell valent, i {elnom} n'era {el capità|la capitana}.",
          },
        },
      },
      {
        id: "pesadillas",
        etiqueta: { es: "Pesadillas", ca: "Malsons" },
        campos: {
          problema: {
            es: "A veces {nombre} tenía sueños feos que se colaban por la noche, y por eso no quería cerrar los ojos.",
            ca: "A vegades {elnom} tenia somnis lletjos que s'escolaven de nit, i per això no volia tancar els ulls.",
          },
          ayuda: {
            es: "Los sueños se pueden cambiar. Antes de dormir, elige uno bonito y guárdalo debajo de la almohada.",
            ca: "Els somnis es poden canviar. Abans de dormir, tria'n un de bonic i guarda'l sota el coixí.",
          },
          leccion: {
            es: "Esa noche, {nombre} eligió su sueño antes de cerrar los ojos, y el sueño feo no encontró la puerta.",
            ca: "Aquella nit, {elnom} va triar el seu somni abans de tancar els ulls, i el somni lleig no va trobar la porta.",
          },
        },
      },
    ],
  },
  {
    id: "valores",
    nombre: { es: "Valores", ca: "Valors" },
    descripcion: {
      es: "Una semilla mágica que crece con cada gesto bonito.",
      ca: "Una llavor màgica que creix amb cada gest bonic.",
    },
    edades: "3-8",
    temas: [
      {
        id: "compartir",
        etiqueta: { es: "Compartir", ca: "Compartir" },
        campos: {
          titulo: { es: "compartir", ca: "compartir" },
          situacion: {
            es: "En el parque, una niña nueva miraba con ojos grandes el juguete favorito de {nombre}.",
            ca: "Al parc, una nena nova mirava amb ulls grossos la joguina preferida {delnom}.",
          },
          tentacion: {
            es: "—¡Es mío! —dijo {nombre}, y lo escondió detrás de la espalda.",
            ca: "—És meu! —va dir {elnom}, i el va amagar darrere l'esquena.",
          },
          gesto: {
            es: "{nombre} respiró hondo, se acercó a la niña nueva y le dijo: «¿Jugamos {juntos|juntas}?». Y jugaron a la vez, entre risas.",
            ca: "{Elnom} va respirar fondo, es va acostar a la nena nova i li va dir: «Hi juguem plegats?». I hi van jugar tots dos alhora.",
          },
          leccion: {
            es: "Un juguete compartido no se hace más pequeño: se hace el doble de divertido.",
            ca: "Una joguina compartida no es fa més petita: es fa el doble de divertida.",
          },
        },
      },
      {
        id: "verdad",
        etiqueta: { es: "Decir la verdad", ca: "Dir la veritat" },
        campos: {
          titulo: { es: "decir la verdad", ca: "dir la veritat" },
          situacion: {
            es: "Jugando en casa, {nombre} dio un golpe sin querer y el jarrón azul de la abuela se rompió en tres trozos.",
            ca: "Jugant a casa, {elnom} va donar un cop sense voler i el gerro blau de l'àvia es va trencar en tres trossos.",
          },
          tentacion: {
            es: "Cuando preguntaron quién había sido, {nombre} miró a otro lado y dijo: «Yo no he sido».",
            ca: "Quan van preguntar qui havia estat, {elnom} va mirar cap a una altra banda i va dir: «Jo no he estat».",
          },
          gesto: {
            es: "{nombre} fue a buscar a la abuela y, con la voz bajita, le contó la verdad. La abuela le dio un abrazo y pegaron el jarrón entre los dos.",
            ca: "{Elnom} va anar a buscar l'àvia i, amb la veu baixeta, li va explicar la veritat. L'àvia li va fer una abraçada i van enganxar el gerro entre tots dos.",
          },
          leccion: {
            es: "La verdad a veces cuesta decirla, pero después el corazón pesa mucho menos.",
            ca: "La veritat de vegades costa de dir, però després el cor pesa molt menys.",
          },
        },
      },
      {
        id: "paciencia",
        etiqueta: { es: "Paciencia", ca: "Paciència" },
        campos: {
          titulo: { es: "la paciencia", ca: "la paciència" },
          situacion: {
            es: "En la fila del tobogán había muchos niños, y {nombre} tenía unas ganas enormes de tirarse ya.",
            ca: "A la cua del tobogan hi havia molts nens, i {elnom} tenia unes ganes enormes de tirar-s'hi ja.",
          },
          tentacion: {
            es: "—¡Me toca a mí! —gritó {nombre}, y se coló delante de todos.",
            ca: "—Em toca a mi! —va cridar {elnom}, i es va colar davant de tothom.",
          },
          gesto: {
            es: "{nombre} volvió a su sitio en la fila y, mientras esperaba, contó las nubes. Cuando por fin le tocó, el tobogán le pareció el mejor del mundo.",
            ca: "{Elnom} va tornar al seu lloc de la cua i, mentre esperava, va comptar els núvols. Quan per fi li va tocar, el tobogan li va semblar el millor del món.",
          },
          leccion: {
            es: "Las cosas bonitas también saben esperar, como las semillas debajo de la tierra.",
            ca: "Les coses boniques també saben esperar, com les llavors sota la terra.",
          },
        },
      },
      {
        id: "valentia",
        etiqueta: { es: "Valentía", ca: "Valentia" },
        campos: {
          titulo: { es: "la valentía", ca: "la valentia" },
          situacion: {
            es: "En la fiesta del cole, la maestra preguntó quién quería salir a cantar delante de todos.",
            ca: "A la festa de l'escola, la mestra va preguntar qui volia sortir a cantar davant de tothom.",
          },
          tentacion: {
            es: "{nombre} quería salir, pero las piernas le temblaban, así que se escondió detrás de una columna.",
            ca: "{Elnom} volia sortir, però les cames li tremolaven, i es va amagar darrere d'una columna.",
          },
          gesto: {
            es: "{nombre} cerró los ojos, contó hasta tres y dio un paso adelante. Le temblaba la voz, pero cantó hasta el final.",
            ca: "{Elnom} va tancar els ulls, va comptar fins a tres i va fer un pas endavant. Li tremolava la veu, però va cantar fins al final.",
          },
          leccion: {
            es: "Ser valiente no es no tener miedo: es dar el paso aunque el miedo venga contigo.",
            ca: "Ser valent no és no tenir por: és fer el pas encara que la por vingui amb tu.",
          },
        },
      },
      {
        id: "amabilidad",
        etiqueta: { es: "Ser amable", ca: "Ser amable" },
        campos: {
          titulo: { es: "la amabilidad", ca: "l'amabilitat" },
          situacion: {
            es: "En el patio, un niño se cayó y todos los juguetes de su mochila rodaron por el suelo.",
            ca: "Al pati, un nen va caure i totes les joguines de la seva motxilla van rodolar per terra.",
          },
          tentacion: {
            es: "Algunos se rieron. {nombre} también estuvo a punto de reírse… y siguió jugando como si nada.",
            ca: "Alguns van riure. {Elnom} també va estar a punt de riure… i va continuar jugant com si res.",
          },
          gesto: {
            es: "Pero {nombre} se dio la vuelta, ayudó al niño a recoger sus cosas y le preguntó: «¿Te has hecho daño?».",
            ca: "Però {elnom} es va girar, va ajudar el nen a recollir les seves coses i li va preguntar: «T'has fet mal?».",
          },
          leccion: {
            es: "Un gesto amable es pequeño por fuera y gigante por dentro.",
            ca: "Un gest amable és petit per fora i gegant per dins.",
          },
        },
      },
      {
        id: "perdon",
        etiqueta: { es: "Pedir perdón", ca: "Demanar perdó" },
        campos: {
          titulo: { es: "pedir perdón", ca: "demanar perdó" },
          situacion: {
            es: "Jugando, {nombre} se enfadó tanto que tiró al suelo la torre que su mejor amigo había construido.",
            ca: "Jugant, {elnom} es va enfadar tant que va tirar a terra la torre que el seu millor amic havia construït.",
          },
          tentacion: {
            es: "Su amigo se puso a llorar, pero {nombre} cruzó los brazos y dijo: «Me da igual».",
            ca: "El seu amic es va posar a plorar, però {elnom} va creuar els braços i va dir: «M'és igual».",
          },
          gesto: {
            es: "Al rato, {nombre} se sentó a su lado y le dijo: «Perdón. ¿Me dejas ayudarte a hacerla otra vez?». Y la torre nueva quedó todavía más alta.",
            ca: "Al cap d'una estona, {elnom} es va asseure al seu costat i li va dir: «Perdona. Em deixes ajudar-te a fer-la una altra vegada?». I la torre nova va quedar encara més alta.",
          },
          leccion: {
            es: "«Perdón» es una palabra pequeña que arregla cosas muy grandes.",
            ca: "«Perdó» és una paraula petita que arregla coses molt grans.",
          },
        },
      },
    ],
  },
  {
    id: "hermanito",
    nombre: { es: "Hermanito nuevo", ca: "Germanet nou" },
    descripcion: {
      es: "Para preparar la llegada de un bebé a casa y convertir los celos en orgullo.",
      ca: "Per preparar l'arribada d'un nadó a casa i convertir la gelosia en orgull.",
    },
    edades: "2-7",
    temas: [
      {
        id: "celos",
        etiqueta: { es: "Celos del bebé", ca: "Gelosia del nadó" },
        campos: {
          problema: {
            es: "Todo el mundo miraba al bebé. Nadie miraba los dibujos de {nombre}, ni sus saltos, ni sus torres. Y a {nombre} le picaba algo por dentro.",
            ca: "Tothom mirava el nadó. Ningú no mirava els dibuixos {delnom}, ni els seus salts, ni les seves torres. I a {elnom} li picava una cosa per dins.",
          },
          ayuda: {
            es: "El cariño no es una tarta que se reparte. Es como una vela: enciende otra vela y la primera sigue brillando igual.",
            ca: "L'estima no és un pastís que es reparteix. És com una espelma: n'encén una altra i la primera continua brillant igual.",
          },
          leccion: {
            es: "En casa ahora había más cariño que nunca, porque había una persona más para quererse.",
            ca: "A casa ara hi havia més estima que mai, perquè hi havia una persona més per estimar-se.",
          },
        },
      },
      {
        id: "querer-igual",
        etiqueta: { es: "Miedo a que ya no le quieran igual", ca: "Por que ja no l'estimin igual" },
        campos: {
          problema: {
            es: "Esa noche, {nombre} preguntó muy bajito: «¿Ahora me vais a querer menos?».",
            ca: "Aquella nit, {elnom} va preguntar molt baixet: «Ara m'estimareu menys?».",
          },
          ayuda: {
            es: "Te queremos igual que el primer día. El corazón crece cuando llega alguien nuevo: nunca se queda sin sitio.",
            ca: "T'estimem igual que el primer dia. El cor creix quan arriba algú de nou: mai no es queda sense lloc.",
          },
          leccion: {
            es: "{nombre} lo supo de verdad: el cariño de su familia era tan grande que cabían dos, y tres, y todos.",
            ca: "{Elnom} ho va saber de debò: l'estima de la seva família era tan gran que hi cabien dos, i tres, i tothom.",
          },
        },
      },
      {
        id: "hermano-mayor",
        etiqueta: { es: "Aprender a ser hermano/a mayor", ca: "Aprendre a ser germà/germana gran" },
        campos: {
          problema: {
            es: "{nombre} no sabía muy bien qué hacía un {hermano mayor|hermana mayor}. El bebé no hablaba, no jugaba y solo dormía.",
            ca: "{Elnom} no sabia gaire bé què feia {un germà gran|una germana gran}. El nadó no parlava, no jugava i només dormia.",
          },
          ayuda: {
            es: "Los bebés aprenden mirando. Y a quien más miran es a su {hermano mayor|hermana mayor}.",
            ca: "Els nadons aprenen mirant. I a qui més miren és {al seu germà gran|a la seva germana gran}.",
          },
          leccion: {
            es: "Ser {hermano mayor|hermana mayor} no era un trabajo: era un superpoder.",
            ca: "Ser {germà gran|germana gran} no era una feina: era un superpoder.",
          },
        },
      },
    ],
  },
  {
    id: "ciudad",
    nombre: { es: "Mi ciudad", ca: "La meva ciutat" },
    descripcion: {
      es: "Una búsqueda del tesoro por los rincones de su ciudad o su pueblo.",
      ca: "Una cerca del tresor pels racons de la seva ciutat o el seu poble.",
    },
    edades: "3-8",
    temas: [
      {
        id: "curiosidad",
        etiqueta: { es: "Curiosidad", ca: "Curiositat" },
        campos: {
          situacion: {
            es: "En cada esquina, {nombre} preguntaba: «¿Y esto quién lo hizo? ¿Y por qué? ¿Y desde cuándo?».",
            ca: "A cada cantonada, {elnom} preguntava: «I això qui ho va fer? I per què? I des de quan?».",
          },
          gesto: {
            es: "Una señora mayor que regaba geranios le contó que esa calle era más vieja que su bisabuela. ¡Las preguntas abrían puertas!",
            ca: "Una senyora gran que regava geranis li va explicar que aquell carrer era més vell que la seva besàvia. Les preguntes obrien portes!",
          },
          leccion: {
            es: "Quien pregunta descubre: cada pregunta era una llave para un secreto nuevo.",
            ca: "Qui pregunta descobreix: cada pregunta era una clau per a un secret nou.",
          },
        },
      },
      {
        id: "cuidar",
        etiqueta: { es: "Cuidar la ciudad", ca: "Tenir cura de la ciutat" },
        campos: {
          situacion: {
            es: "Junto a un banco, {nombre} vio un papel arrugado y una lata tirados en el suelo.",
            ca: "Al costat d'un banc, {elnom} va veure un paper arrugat i una llauna llençats a terra.",
          },
          gesto: {
            es: "{nombre} los recogió y los llevó a la papelera. Un pajarito que miraba desde una rama silbó, como diciendo «gracias».",
            ca: "{Elnom} els va recollir i els va portar a la paperera. Un ocellet que mirava des d'una branca va xiular, com si digués «gràcies».",
          },
          leccion: {
            es: "Una ciudad bonita no se hace sola: la cuidan muchas manos pequeñas, como las de {nombre}.",
            ca: "Una ciutat bonica no es fa sola: la cuiden moltes mans petites, com les {delnom}.",
          },
        },
      },
      {
        id: "lo-nuevo",
        etiqueta: { es: "Perder el miedo a lo nuevo", ca: "Perdre la por al que és nou" },
        campos: {
          situacion: {
            es: "La pista llevaba a una calle donde {nombre} no había estado nunca, y le dio un poco de miedo entrar.",
            ca: "La pista portava a un carrer on {elnom} no havia estat mai, i li va fer una mica de por entrar-hi.",
          },
          gesto: {
            es: "{nombre} dio la mano a su familia, respiró hondo y entró. Al fondo había una plaza llena de palomas y una fuente que cantaba.",
            ca: "{Elnom} va donar la mà a la seva família, va respirar fondo i hi va entrar. Al fons hi havia una plaça plena de coloms i una font que cantava.",
          },
          leccion: {
            es: "Lo nuevo da un poco de miedo al principio, y después se convierte en un sitio favorito.",
            ca: "El que és nou fa una mica de por al principi, i després es converteix en un lloc preferit.",
          },
        },
      },
      {
        id: "vecinos",
        etiqueta: { es: "Ser amable con los vecinos", ca: "Ser amable amb els veïns" },
        campos: {
          situacion: {
            es: "En el portal, un vecino mayor intentaba subir las bolsas de la compra y se le escapó una naranja escaleras abajo.",
            ca: "A l'entrada, un veí gran intentava pujar les bosses de la compra i se li va escapar una taronja escales avall.",
          },
          gesto: {
            es: "{nombre} corrió detrás de la naranja, se la devolvió y le ayudó con la bolsa más pequeña. El vecino sonrió con toda la cara.",
            ca: "{Elnom} va córrer darrere la taronja, la hi va tornar i el va ajudar amb la bossa més petita. El veí va somriure amb tota la cara.",
          },
          leccion: {
            es: "Una ciudad es más que calles y edificios: es la gente que se saluda y se echa una mano.",
            ca: "Una ciutat és més que carrers i edificis: és la gent que se saluda i es dona un cop de mà.",
          },
        },
      },
    ],
  },
];

export interface Companero {
  id: string;
  etiqueta: Bi;
  posesivo: Bi; // "su gato" / "el seu gat"
  ingles: string; // para el prompt de ilustración
}

export const COMPANEROS: Companero[] = [
  { id: "perro", etiqueta: { es: "Perro", ca: "Gos" }, posesivo: { es: "su perro", ca: "el seu gos" }, ingles: "a small dog" },
  { id: "gato", etiqueta: { es: "Gato", ca: "Gat" }, posesivo: { es: "su gato", ca: "el seu gat" }, ingles: "a small cat" },
  { id: "conejo", etiqueta: { es: "Conejo", ca: "Conill" }, posesivo: { es: "su conejo", ca: "el seu conill" }, ingles: "a small rabbit" },
  { id: "tortuga", etiqueta: { es: "Tortuga", ca: "Tortuga" }, posesivo: { es: "su tortuga", ca: "la seva tortuga" }, ingles: "a small turtle" },
  { id: "pajaro", etiqueta: { es: "Pájaro", ca: "Ocell" }, posesivo: { es: "su pájaro", ca: "el seu ocell" }, ingles: "a small budgie bird" },
  { id: "hamster", etiqueta: { es: "Hámster", ca: "Hàmster" }, posesivo: { es: "su hámster", ca: "el seu hàmster" }, ingles: "a small hamster" },
  { id: "peluche", etiqueta: { es: "Peluche (sin mascota)", ca: "Peluix (sense mascota)" }, posesivo: { es: "su osito de peluche", ca: "el seu ós de peluix" }, ingles: "a soft teddy bear plush toy that comes to life in the story" },
];

export interface Aficion {
  id: string;
  etiqueta: Bi;
  frase: Bi; // "los dinosaurios", "dibujar"
  objeto: Bi; // objeto con el que juega
  forma: Bi; // forma que dibujan las estrellas
  ingles: string; // prop para las ilustraciones
}

export const AFICIONES: Aficion[] = [
  { id: "dinosaurios", etiqueta: { es: "Dinosaurios", ca: "Dinosaures" }, frase: { es: "los dinosaurios", ca: "els dinosaures" }, objeto: { es: "su dinosaurio de juguete", ca: "el seu dinosaure de joguina" }, forma: { es: "un dinosaurio enorme de cuello largo", ca: "un dinosaure enorme de coll llarg" }, ingles: "a toy dinosaur" },
  { id: "futbol", etiqueta: { es: "Fútbol", ca: "Futbol" }, frase: { es: "el fútbol", ca: "el futbol" }, objeto: { es: "su pelota", ca: "la seva pilota" }, forma: { es: "una pelota gigante a punto de entrar en la portería", ca: "una pilota gegant a punt d'entrar a la porteria" }, ingles: "a football (soccer ball)" },
  { id: "dibujar", etiqueta: { es: "Dibujar", ca: "Dibuixar" }, frase: { es: "dibujar", ca: "dibuixar" }, objeto: { es: "su caja de colores", ca: "la seva capsa de colors" }, forma: { es: "un lápiz gigante dibujando el cielo", ca: "un llapis gegant dibuixant el cel" }, ingles: "colored pencils and a sketchbook" },
  { id: "musica", etiqueta: { es: "Música", ca: "Música" }, frase: { es: "la música", ca: "la música" }, objeto: { es: "su pequeña guitarra", ca: "la seva guitarra petita" }, forma: { es: "una guitarra hecha de estrellas", ca: "una guitarra feta d'estels" }, ingles: "a small toy guitar" },
  { id: "espacio", etiqueta: { es: "El espacio", ca: "L'espai" }, frase: { es: "los cohetes y los planetas", ca: "els coets i els planetes" }, objeto: { es: "su cohete de cartón", ca: "el seu coet de cartró" }, forma: { es: "un cohete despegando hacia la luna", ca: "un coet enlairant-se cap a la lluna" }, ingles: "a cardboard toy rocket" },
  { id: "bailar", etiqueta: { es: "Bailar", ca: "Ballar" }, frase: { es: "bailar", ca: "ballar" }, objeto: { es: "su falda de vueltas", ca: "la seva faldilla de volants" }, forma: { es: "una bailarina dando vueltas", ca: "una ballarina fent voltes" }, ingles: "a twirling dance ribbon" },
  { id: "construir", etiqueta: { es: "Construir", ca: "Construir" }, frase: { es: "construir torres y castillos", ca: "construir torres i castells" }, objeto: { es: "sus bloques de madera", ca: "els seus blocs de fusta" }, forma: { es: "un castillo con torres altísimas", ca: "un castell amb torres altíssimes" }, ingles: "wooden building blocks" },
  { id: "animales", etiqueta: { es: "Animales", ca: "Animals" }, frase: { es: "los animales", ca: "els animals" }, objeto: { es: "su libro de animales", ca: "el seu llibre d'animals" }, forma: { es: "una ballena nadando entre las nubes", ca: "una balena nedant entre els núvols" }, ingles: "a picture book about animals" },
  { id: "cocinar", etiqueta: { es: "Cocinar", ca: "Cuinar" }, frase: { es: "cocinar", ca: "cuinar" }, objeto: { es: "su delantal de cocinero", ca: "el seu davantal de cuiner" }, forma: { es: "una tarta de cumpleaños con velas", ca: "un pastís d'aniversari amb espelmes" }, ingles: "a small chef apron and wooden spoon" },
  { id: "coches", etiqueta: { es: "Coches y trenes", ca: "Cotxes i trens" }, frase: { es: "los coches y los trenes", ca: "els cotxes i els trens" }, objeto: { es: "su tren de madera", ca: "el seu tren de fusta" }, forma: { es: "un tren que corre por la Vía Láctea", ca: "un tren que corre per la Via Làctia" }, ingles: "a wooden toy train" },
  { id: "leer", etiqueta: { es: "Cuentos y libros", ca: "Contes i llibres" }, frase: { es: "los cuentos", ca: "els contes" }, objeto: { es: "su libro favorito", ca: "el seu llibre preferit" }, forma: { es: "un libro abierto del que salen pájaros", ca: "un llibre obert del qual surten ocells" }, ingles: "a favorite picture book" },
];

// Lugares reales de algunas ciudades (solo datos comprobables y muy conocidos).
// Para el resto de ciudades se usan lugares genéricos (la plaza, el río, el parque, el mirador).
export interface LugaresCiudad {
  plaza: Bi;
  agua: Bi;
  parque: Bi;
  alto: Bi;
  ingles: string; // pista visual para las ilustraciones
}

export const LUGARES_GENERICOS: LugaresCiudad = {
  plaza: { es: "el mercado de la plaza", ca: "el mercat de la plaça" },
  agua: { es: "la fuente del paseo", ca: "la font del passeig" },
  parque: { es: "el parque grande", ca: "el parc gran" },
  alto: { es: "el mirador más alto", ca: "el mirador més alt" },
  ingles: "a charming Spanish town with a plaza, a fountain, a leafy park and a hilltop viewpoint",
};

export const CIUDADES: Record<string, LugaresCiudad> = {
  lleida: {
    plaza: { es: "el mercado del Pla", ca: "el mercat del Pla" },
    agua: { es: "el río Segre", ca: "el riu Segre" },
    parque: { es: "los Camps Elisis", ca: "els Camps Elisis" },
    alto: { es: "la Seu Vella", ca: "la Seu Vella" },
    ingles: "Lleida, Catalonia: the Seu Vella romanesque-gothic cathedral with its tall octagonal bell tower on top of a hill above the city, the Segre river with its bridges",
  },
  barcelona: {
    plaza: { es: "el mercado de la Boqueria", ca: "el mercat de la Boqueria" },
    agua: { es: "el mar de la Barceloneta", ca: "el mar de la Barceloneta" },
    parque: { es: "el parque de la Ciutadella", ca: "el parc de la Ciutadella" },
    alto: { es: "el Tibidabo", ca: "el Tibidabo" },
    ingles: "Barcelona: the Mediterranean sea, the Ciutadella park, the Tibidabo hill with its small Ferris wheel",
  },
  girona: {
    plaza: { es: "la Rambla de la Llibertat", ca: "la Rambla de la Llibertat" },
    agua: { es: "las casas de colores del Onyar", ca: "les cases de colors de l'Onyar" },
    parque: { es: "la Devesa", ca: "la Devesa" },
    alto: { es: "la muralla", ca: "la muralla" },
    ingles: "Girona: colorful houses hanging over the Onyar river, the old city walls",
  },
  tarragona: {
    plaza: { es: "la Plaça de la Font", ca: "la Plaça de la Font" },
    agua: { es: "el Balcón del Mediterráneo", ca: "el Balcó del Mediterrani" },
    parque: { es: "el anfiteatro romano junto al mar", ca: "l'amfiteatre romà vora el mar" },
    alto: { es: "la catedral", ca: "la catedral" },
    ingles: "Tarragona: the Roman amphitheatre next to the Mediterranean sea",
  },
  madrid: {
    plaza: { es: "la Plaza Mayor", ca: "la Plaza Mayor" },
    agua: { es: "el estanque del Retiro", ca: "l'estany del Retiro" },
    parque: { es: "el parque del Retiro", ca: "el parc del Retiro" },
    alto: { es: "el Templo de Debod al atardecer", ca: "el Temple de Debod a la posta de sol" },
    ingles: "Madrid: the Plaza Mayor with its arcades, rowing boats on the Retiro pond",
  },
  zaragoza: {
    plaza: { es: "la plaza del Pilar", ca: "la plaça del Pilar" },
    agua: { es: "el río Ebro y el Puente de Piedra", ca: "el riu Ebre i el Pont de Pedra" },
    parque: { es: "el parque Grande José Antonio Labordeta", ca: "el parc Grande José Antonio Labordeta" },
    alto: { es: "las torres del Pilar", ca: "les torres del Pilar" },
    ingles: "Zaragoza: the Basilica del Pilar with its tiled domes and towers beside the Ebro river and the stone bridge",
  },
  valencia: {
    plaza: { es: "el Mercado Central", ca: "el Mercat Central" },
    agua: { es: "el jardín del Turia", ca: "el jardí del Túria" },
    parque: { es: "el Gulliver gigante del Turia", ca: "el Gulliver gegant del Túria" },
    alto: { es: "el Micalet", ca: "el Micalet" },
    ingles: "Valencia: the green Turia riverbed gardens, the Micalet bell tower",
  },
  sevilla: {
    plaza: { es: "la Plaza de España", ca: "la Plaza de España" },
    agua: { es: "el río Guadalquivir", ca: "el riu Guadalquivir" },
    parque: { es: "el parque de María Luisa", ca: "el parc de María Luisa" },
    alto: { es: "la Giralda", ca: "la Giralda" },
    ingles: "Seville: the Giralda tower, orange trees, the Plaza de España with its tiles and canal",
  },
};

export function claveCiudad(ciudad: string): string {
  return ciudad
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "");
}

export function lugaresDe(ciudad: string): LugaresCiudad {
  return CIUDADES[claveCiudad(ciudad)] ?? LUGARES_GENERICOS;
}

export function coleccion(id: ColeccionId): Coleccion {
  const c = COLECCIONES.find((x) => x.id === id);
  if (!c) throw new Error(`Colección desconocida: ${id}`);
  return c;
}

export function tema(col: ColeccionId, id: string): Tema {
  const t = coleccion(col).temas.find((x) => x.id === id);
  if (!t) throw new Error(`Tema desconocido: ${col}/${id}`);
  return t;
}

export const companero = (id: string) => COMPANEROS.find((x) => x.id === id) ?? COMPANEROS[COMPANEROS.length - 1];
export const aficion = (id: string) => AFICIONES.find((x) => x.id === id) ?? AFICIONES[0];
