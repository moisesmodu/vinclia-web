import type { Plantilla } from "./tipos";

// Colección DORMIR · 5–8 años · «{nombre} y las estrellas perdidas» (22 páginas)
// Arco: noche → miedo (tema) → dos intentos que fallan → Lunilla pide ayuda: un viento ha tirado
// las estrellas sobre la ciudad → paseo y rescates → consejo (tema.ayuda) → giro: la última estrella
// tiene miedo y no quiere subir → Lunilla no puede → {nombre} decide ayudarla y le hace una promesa →
// la estrella sube → vuelta a casa (tema.leccion) → frase final para decir juntos.
export const dormirMayores: Plantilla = {
  coleccion: "dormir",
  banda: "mayores",
  titulo: { es: "{nombre} y las estrellas perdidas", ca: "{Elnom} i les estrelles perdudes" },
  portada:
    "{NINO} sitting on a high rooftop of {CIUDAD} at night next to a tiny glowing {COLOR} star, {COMPA} beside, many little stars floating back up into a wide deep blue sky, {LUNILLA} smiling in the upper right corner",
  contraportada: {
    es: "Una aventura de buenas noches para ayudar a una estrella y perder el miedo por el camino.",
    ca: "Una aventura de bona nit per ajudar una estrella i perdre la por pel camí.",
  },
  escenasTema: {
    oscuridad: {
      problema:
        "pitch dark bedroom where only the outlines of the furniture can be seen, the child peeking anxiously over the blanket pulled up to the nose, {COMPA} close by, a thin line of moonlight under the curtain",
    },
    monstruos: {
      problema:
        "dark bedroom at night, the child peeking anxiously over the edge of the bed toward the dark space under it, two cute imagined glowing eyes in the shadows, {COMPA} close by",
    },
    "dormir-solo": {
      problema:
        "wide view of a big bed in a dark bedroom like an ocean of blankets, the child small in the middle of it hugging the pillow, {COMPA} at the edge, the door ajar with a faint hallway glow",
    },
    pesadillas: {
      problema:
        "dark bedroom, the child sitting up in bed with wide eyes refusing to close them, a faint swirl of grey dream clouds fading above the pillow, {COMPA} close by",
    },
  },
  paginas: [
    {
      texto: {
        es: "Aquella tarde, {nombre} había jugado con {amigo} hasta que el cielo de {ciudad} se puso naranja. Ahora ya llevaba el pijama, {compa} se había hecho una bola a los pies de la cama y, por la ventana, las primeras estrellas se encendían una a una, como si alguien fuera pulsando interruptores allá arriba.",
        ca: "Aquella tarda, {elnom} havia jugat amb {amigo} fins que el cel {deciudad} es va tornar taronja. Ara ja duia el pijama, {compa} s'havia fet una bola als peus del llit i, per la finestra, les primeres estrelles s'encenien una a una, com si algú anés prement interruptors allà dalt.",
      },
      escena:
        "wide cozy bedroom at dusk, {NINO} in pajamas kneeling on the bed and looking out of a big window, {COMPA} curled in a ball at the foot of the bed, {AFICION} on the shelf, the rooftops of {CIUDAD} under an orange and violet sky with the first stars appearing",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Después del cuento, del vaso de agua y del beso de buenas noches de {arropa}, la puerta se quedó entornada y la luz del pasillo se apagó. Clic. La casa entera se quedó en silencio. {tema.problema}",
        ca: "Després del conte, del got d'aigua i del petó de bona nit de {arropa}, la porta es va quedar ajustada i el llum del passadís es va apagar. Clic. Tota la casa es va quedar en silenci. {tema.problema}",
      },
      escena: "{NINO} in bed right after the light goes out, {TEMA.problema}",
      ropa: "pijama",
    },
    {
      texto: {
        es: "—Ya sé lo que haré —susurró {nombre}—. Me taparé hasta las orejas y contaré ovejas hasta dormirme. Se metió bajo la manta y empezó: una oveja, dos ovejas, tres ovejas… A la oveja número catorce, el corazón le seguía haciendo pum, pum, pum, y allí debajo hacía tanto calor que tuvo que sacar la nariz.",
        ca: "—Ja sé què faré —va xiuxiuejar {elnom}—. Em taparé fins a les orelles i comptaré ovelles fins que m'adormi. Es va ficar sota la manta i va començar: una ovella, dues ovelles, tres ovelles… A l'ovella número catorze, el cor li continuava fent bum, bum, bum, i allà sota feia tanta calor que va haver de treure el nas.",
      },
      escena:
        "dark bedroom in blue moonlight, {NINO} hidden under a big lumpy blanket with only the nose and eyes peeking out, a row of little dreamy sheep with numbers floating above the bed, {COMPA} looking at the lump with curiosity",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Probó otra cosa: encender la lámpara de la mesilla. Pero con la lámpara encendida las sombras se estiraban por la pared, y además así no había manera de cerrar los ojos. La apagó. La encendió. La volvió a apagar. —No funciona nada —le dijo a {mascota}, que {lo|la} miraba con cara de sueño.",
        ca: "Va provar una altra cosa: encendre el llum de la tauleta. Però amb el llum encès les ombres s'estiraven per la paret, i a més així no hi havia manera de tancar els ulls. El va apagar. El va encendre. El va tornar a apagar. —No funciona res —li va dir a {mascota}, que {el|la} mirava amb cara de son.",
      },
      escena:
        "wide view of the bedroom at night, {NINO} sitting up in bed switching a small bedside lamp on and off, long stretched shadows of toys on the wall, {COMPA} blinking sleepily on the blanket",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Entonces se oyó un toc, toc muy suave en el cristal. Al otro lado flotaba una lucecita con forma de media luna, mejillas rosadas y bufanda amarilla. —Hola, {nombre} —dijo con una voz tan bajita como un susurro—. Soy Lunilla. Perdona que venga tan tarde, pero esta noche tengo un problema.",
        ca: "Llavors es va sentir un toc, toc molt suau al vidre. A l'altra banda surava una llumeta amb forma de mitja lluna, galtes rosades i bufanda groga. —Hola, {nombrePelado} —va dir amb una veu tan baixeta com un xiuxiueig—. Soc la Lunilla. Perdona que vingui tan tard, però aquesta nit tinc un problema.",
      },
      escena:
        "{LUNILLA} floating outside the bedroom window and knocking softly on the glass, {NINO} sitting up in bed in surprise, {COMPA} with ears perked up, soft golden glow spilling into the dark room",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Lunilla señaló el cielo. Donde antes brillaban las estrellas, ahora había huecos oscuros. —Un viento travieso las ha soplado y han caído por las calles de {ciudad}. Si no vuelven a su sitio antes del amanecer, mañana nadie tendrá estrellas para pedir deseos. Yo soy muy pequeña y no llego a todas. ¿Me ayudas?",
        ca: "La Lunilla va assenyalar el cel. On abans brillaven les estrelles, ara hi havia forats foscos. —Un vent entremaliat les ha bufat i han caigut pels carrers {deciudad}. Si no tornen al seu lloc abans que surti el sol, demà ningú no tindrà estrelles per demanar desitjos. Jo soc molt petita i no hi arribo. M'ajudes?",
      },
      escena:
        "wide view through the open window of the night sky above {CIUDAD} with dark empty gaps where stars are missing, tiny fallen stars glowing faintly in the streets below, {LUNILLA} pointing at the sky, {NINO} leaning on the windowsill looking out, {COMPA} beside",
      ropa: "pijama",
    },
    {
      texto: {
        es: "—¿Yo? —{nombre} tragó saliva—. Pero si tengo un poco de miedo. —Ya lo sé —sonrió Lunilla—. Por eso te lo pido a ti. Quien conoce el miedo sabe tratar con cuidado a las cosas pequeñas. {nombre} miró a {compa}. Y {mascota} ya estaba en el alféizar de la ventana, esperando.",
        ca: "—Jo? —{Elnom} va empassar saliva—. Però si tinc una mica de por. —Ja ho sé —va somriure la Lunilla—. Per això t'ho demano a tu. Qui coneix la por sap tractar amb cura les coses petites. {Elnom} va mirar {compa}. I {mascota} ja era a l'ampit de la finestra, esperant.",
      },
      escena:
        "{NINO} at the open window hesitating with a hand on the chest, {LUNILLA} offering a tiny glowing hand from outside, {COMPA} already sitting on the windowsill ready to go, starry sky with dark gaps",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Lunilla sopló polvo de luna sobre {nombre} y {compa}, y salieron flotando, ligeros como pompas de jabón. Desde arriba, {ciudad} parecía otra: los tejados eran una colcha de retales y las ventanas encendidas, botones de luz. Abajo, aquí y allá, brillaban las estrellas caídas, como migas de pan dorado.",
        ca: "La Lunilla va bufar pols de lluna damunt {delnom} i de {compa}, i van sortir surant, lleugers com bombolles de sabó. Des de dalt, {ciudad} semblava una altra: les teulades eren un edredó de retalls i les finestres enceses, botons de llum. A baix, aquí i allà, brillaven les estrelles caigudes, com engrunes de pa daurat.",
      },
      escena:
        "wide panoramic view, {NINO} and {COMPA} floating through the night sky above the rooftops of {CIUDAD} holding hands with {LUNILLA}, patchwork of roofs and warm lit windows below, tiny fallen stars glowing here and there in the streets",
      ropa: "pijama",
    },
    {
      texto: {
        es: "La primera estrella estaba en {lugarPlaza}, enredada en una cuerda de banderines. {nombre} tiró con fuerza, pero cuanto más tiraba, más se enredaba. Entonces se acordó de cómo se deshacen los nudos de los cordones: despacio, de uno en uno. Así, con paciencia, la estrella quedó libre y subió al cielo. ¡Tilín!",
        ca: "La primera estrella era a {lugarPlaza}, embolicada en una corda de banderoles. {Elnom} va estirar fort, però com més estirava, més s'embolicava. Llavors es va recordar de com es desfan els nusos dels cordons: a poc a poc, d'un en un. Així, amb paciència, l'estrella va quedar lliure i va pujar al cel. Dring!",
      },
      escena:
        "{LUGAR} at night, a little star tangled in a string of colorful bunting above the square, {NINO} floating up and carefully untangling it with patient fingers, {COMPA} watching, {LUNILLA} glowing softly nearby",
      ropa: "pijama",
    },
    {
      texto: {
        es: "La segunda brillaba en {lugarAgua}. {nombre} metió la mano para cogerla y… ¡chof! Solo pescó agua fría. —Es su reflejo —rio Lunilla—. Mira hacia arriba. La estrella de verdad estaba colgada de una farola, columpiándose. {Compa} le dio un empujoncito con la nariz… ¡y tilín!, de vuelta al cielo.",
        ca: "La segona brillava a {lugarAgua}. {Elnom} hi va ficar la mà per agafar-la i… xof! Només va pescar aigua freda. —És el seu reflex —va riure la Lunilla—. Mira amunt. L'estrella de debò penjava d'un fanal, gronxant-se. {Compa} li va fer una empenteta amb el nas… i dring!, cap al cel.",
      },
      escena:
        "{LUGAR} at night, the reflection of a star shimmering in the water, {NINO} splashing a hand into the water in surprise, the real little star swinging from a street lamp above, {COMPA} stretching up toward it, {LUNILLA} laughing softly",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Mientras volaban hacia {lugarParque}, {nombre} le contó a Lunilla lo que le pasaba cada noche cuando se apagaba la luz. Lunilla escuchó sin interrumpir, como escuchan las lunas: con toda la cara. Luego le dijo: —{tema.ayuda}",
        ca: "Mentre volaven cap a {lugarParque}, {elnom} va explicar a la Lunilla què li passava cada nit quan s'apagava el llum. La Lunilla {el|la} va escoltar sense interrompre, com escolten les llunes: amb tota la cara. Després li va dir: —{tema.ayuda}",
      },
      escena:
        "{NINO} and {LUNILLA} floating side by side over the treetops having a quiet heart to heart talk, {COMPA} riding on a little cloud nearby, deep blue sky with gaps of missing stars, the lights of {CIUDAD} far below",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Allí abajo había tantas sombras que {nombre} se paró en seco. Una parecía tener garras; otra, una boca enorme. Respiró hondo, una vez, dos veces, y las miró despacio, sin prisa. Las garras eran ramas. La boca, un banco. Y detrás del banco, escondida, parpadeaba la tercera estrella.",
        ca: "Allà baix hi havia tantes ombres que {elnom} es va aturar en sec. Una semblava tenir urpes; una altra, una boca enorme. Va respirar fondo, una vegada, dues vegades, i les va mirar a poc a poc, sense pressa. Les urpes eren branques. La boca, un banc. I darrere del banc, amagada, parpellejava la tercera estrella.",
      },
      escena:
        "{LUGAR}, a park at night where the shadows of branches and a bench look a little like claws and a big mouth, {NINO} standing still and breathing deeply, a little star blinking behind the bench, {COMPA} close to the child, {LUNILLA} glowing gently",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Después vinieron muchas más: la del tejado de la escuela, la del columpio, la que se había colado en un buzón. {nombre} las iba contando con los dedos, cada vez más {contento|contenta}. Pero Lunilla miraba hacia arriba, preocupada. —Falta una —dijo—. La más pequeña. Y sin ella, la noche no está completa.",
        ca: "Després en van venir moltes més: la de la teulada de l'escola, la del gronxador, la que s'havia ficat dins d'una bústia. {Elnom} les anava comptant amb els dits, cada cop més {content|contenta}. Però la Lunilla mirava amunt, preocupada. —En falta una —va dir—. La més petita. I sense ella, la nit no és completa.",
      },
      escena:
        "wide night sky over {CIUDAD}, many little stars floating back up into place, {NINO} counting on the fingers happily, {COMPA} watching them rise, {LUNILLA} looking up with a worried face at one last dark gap",
      ropa: "pijama",
    },
    {
      texto: {
        es: "La encontraron en el tejado más alto de {ciudad}, metida en un rincón, temblando. Era una estrella diminuta de color {color}, y su luz era tan débil que casi no se veía. —No quiero subir —dijo con un hilo de voz—. Allá arriba está muy oscuro y todo queda muy lejos. Me da miedo.",
        ca: "La van trobar a la teulada més alta {deciudad}, ficada en un racó, tremolant. Era una estrella petitíssima de color {color}, i la seva llum era tan feble que gairebé no es veia. —No vull pujar —va dir amb un fil de veu—. Allà dalt és molt fosc i tot queda molt lluny. Em fa por.",
      },
      escena:
        "on the highest rooftop of {CIUDAD} at night, a tiny trembling {COLOR} star hiding in a corner by a chimney with a very faint glow, {NINO} crouching to look at it in surprise, {COMPA} beside, {LUNILLA} floating close",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Lunilla lo intentó todo: le cantó una nana, le prometió un sitio junto a la Osa Mayor, le hizo cosquillas con la bufanda. Pero la estrellita no se movía. Y Lunilla, que llevaba toda la noche volando, empezaba a apagarse de cansancio. —Se está haciendo muy tarde —suspiró—. Quizá deberíamos volver a casa.",
        ca: "La Lunilla ho va provar tot: li va cantar una cançó de bressol, li va prometre un lloc al costat de l'Óssa Major, li va fer pessigolles amb la bufanda. Però l'estrelleta no es movia. I la Lunilla, que portava tota la nit volant, començava a apagar-se de cansament. —Es fa molt tard —va sospirar—. Potser hauríem de tornar a casa.",
      },
      escena:
        "high rooftop of {CIUDAD} at night, {LUNILLA} looking tired and a little dim, gently tickling a tiny trembling {COLOR} star with her yellow scarf, the star still hiding in its corner, {NINO} watching thoughtfully, {COMPA} beside",
      ropa: "pijama",
    },
    {
      texto: {
        es: "{nombre} miró a la estrellita. Conocía muy bien ese temblor: era el mismo que sentía cada noche al apagarse la luz. —Espera, Lunilla —dijo—. Déjame a mí. Y sin que nadie se lo pidiera, se sentó a su lado, muy cerca, y le habló bajito, como le hablaban a {él|ella} cuando tenía miedo.",
        ca: "{Elnom} va mirar l'estrelleta. Coneixia molt bé aquell tremolor: era el mateix que sentia cada nit quan s'apagava el llum. —Espera, Lunilla —va dir—. Deixa-m'ho a mi. I sense que ningú li ho demanés, es va asseure al seu costat, molt a prop, i li va parlar baixet, com li parlaven a {ell|ella} quan tenia por.",
      },
      escena:
        "{NINO} sitting very close to the tiny {COLOR} star on the rooftop and speaking softly to it, {LUNILLA} resting on the chimney and watching with a proud smile, {COMPA} curled next to them, wide night sky over {CIUDAD}",
      ropa: "pijama",
    },
    {
      texto: {
        es: "—Yo también tengo miedo a veces —le contó {nombre}—. Entonces cierro los ojos, pienso en {aficion} y el miedo se hace pequeñito. La estrellita dejó de temblar. —Pero allá arriba estaré sola —susurró. —No —dijo {nombre}—. Desde mi ventana te veré cada noche. Tú me cuidarás a mí, y yo te cuidaré a ti.",
        ca: "—Jo també tinc por, a vegades —li va explicar {elnom}—. Llavors tanco els ulls, penso en {aficion} i la por es fa petitona. L'estrelleta va deixar de tremolar. —Però allà dalt estaré sola —va xiuxiuejar. —No —va dir {elnom}—. Des de la meva finestra et veuré cada nit. Tu em cuidaràs a mi, i jo et cuidaré a tu.",
      },
      escena:
        "{NINO} on the rooftop pointing toward a lit bedroom window far below among the houses of {CIUDAD} while talking to the tiny {COLOR} star, the star glowing a little brighter, {LUNILLA} smiling, {COMPA} listening",
      ropa: "pijama",
    },
    {
      texto: {
        es: "La estrellita brilló, primero un poco y luego mucho, y subió despacio hasta el último hueco del cielo. Entonces pasó algo precioso: todas las estrellas se movieron a la vez y dibujaron {forma}, solo para {nombre}. —Te están dando las gracias —dijo Lunilla, que había vuelto a brillar.",
        ca: "L'estrelleta va brillar, primer una mica i després molt, i va pujar a poc a poc fins a l'últim forat del cel. Llavors va passar una cosa preciosa: totes les estrelles es van moure alhora i van dibuixar {forma}, només per a {elnom}. —T'estan donant les gràcies —va dir la Lunilla, que tornava a brillar.",
      },
      escena:
        "magical wide night sky over {CIUDAD} where all the stars connect into a big glowing constellation shaped like {AFICION}, a tiny {COLOR} star shining in the middle of it, {NINO} on the rooftop laughing and pointing up, {COMPA} looking up amazed, {LUNILLA} glowing brightly again",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Volvieron a casa flotando, sin prisa. {nombre} entró por la ventana y se metió en la cama, {calentito|calentita}. Miró alrededor: la silla era la silla, el armario era el armario, y la puerta seguía entornada, igual que después del beso de {arropa}. Todo estaba en su sitio, también el cielo.",
        ca: "Van tornar a casa surant, sense pressa. {Elnom} va entrar per la finestra i es va ficar al llit, ben {calentó|calentona}. Va mirar al voltant: la cadira era la cadira, l'armari era l'armari, i la porta continuava ajustada, igual que després del petó de {arropa}. Tot era al seu lloc, també el cel.",
      },
      escena:
        "the cozy bedroom in soft moonlight, {NINO} climbing back through the window into bed, {COMPA} hopping onto the blanket, everything calm and friendly, {LUNILLA} waiting at the window",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Por la ventana, entre todas las estrellas, se distinguía una muy pequeña, la más pequeña de todas, que le guiñaba un ojo. {nombre} le devolvió el guiño. El corazón ya no le hacía pum, pum, pum. {tema.leccion}",
        ca: "Per la finestra, entre totes les estrelles, se'n distingia una de molt petita, la més petita de totes, que li feia l'ullet. {Elnom} li va tornar l'ullet. El cor ja no li feia bum, bum, bum. {tema.leccion}",
      },
      escena:
        "{NINO} lying in bed and winking at a tiny {COLOR} star shining through the window, {COMPA} snuggled beside, a faint glow on the child's face, calm starry sky over {CIUDAD}",
      ropa: "pijama",
    },
    {
      texto: {
        es: "—Gracias, {nombre} —susurró Lunilla desde la ventana—. Esta noche has ayudado a una estrella a perder el miedo. ¿Y sabes quién más lo ha perdido? {nombre} sonrió con los ojos medio cerrados. Mañana se lo contaría todo a {amigo}, y algún día subiría con {arropa} a {lugarAlto} para buscar su estrella.",
        ca: "—Gràcies, {nombrePelado} —va xiuxiuejar la Lunilla des de la finestra—. Aquesta nit has ajudat una estrella a perdre la por. I saps qui més l'ha perduda? {Elnom} va somriure amb els ulls mig tancats. Demà ho explicaria tot a {amigo}, i algun dia pujaria amb {arropa} a {lugarAlto} per buscar la seva estrella.",
      },
      escena:
        "{LUNILLA} at the bedroom window whispering thank you, {NINO} smiling sleepily in bed with half closed eyes, {COMPA} yawning, the quiet moonlit rooftops of {CIUDAD} outside",
      ropa: "pijama",
    },
    {
      texto: {
        es: "Y así, abrazando a {mascota}, {nombre} cerró los ojos. Allá arriba, la estrellita y Lunilla brillaban un poquito más que de costumbre. —Buenas noches, {nombre} —susurró Lunilla—. Hasta la noche que viene. Y ahora, todos juntos y muy bajito: «Buenas noches, luna; buenas noches, Lunilla».",
        ca: "I així, abraçant {compa}, {elnom} va tancar els ulls. Allà dalt, l'estrelleta i la Lunilla brillaven una mica més que de costum. —Bona nit, {nombrePelado} —va xiuxiuejar la Lunilla—. Fins a la nit que ve. I ara, tots junts i molt baixet: «Bona nit, lluna; bona nit, Lunilla».",
      },
      escena:
        "{NINO} fast asleep hugging {COMPA} in bed, wide view through the window of the sleeping rooftops of {CIUDAD} under a full starry sky, a tiny {COLOR} star twinkling next to {LUNILLA} who smiles from the sky, peaceful deep blue night",
      ropa: "pijama",
    },
  ],
};
