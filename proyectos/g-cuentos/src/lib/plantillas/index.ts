import type { ColeccionId } from "../catalogo";
import { ciudadMayores } from "./ciudad-mayores";
import { ciudadPeques } from "./ciudad-peques";
import { dormirMayores } from "./dormir-mayores";
import { dormirPeques } from "./dormir-peques";
import { hermanitoMayores } from "./hermanito-mayores";
import { hermanitoPeques } from "./hermanito-peques";
import { bandaDe, type Plantilla, type PlantillaId } from "./tipos";
import { valoresMayores } from "./valores-mayores";
import { valoresPeques } from "./valores-peques";

// 4 colecciones × 2 franjas de edad = 8 cuentos distintos (18 páginas de 2 a 4 años, 22 de 5 a 8).
export const PLANTILLAS: Record<PlantillaId, Plantilla> = {
  "dormir-peques": dormirPeques,
  "dormir-mayores": dormirMayores,
  "valores-peques": valoresPeques,
  "valores-mayores": valoresMayores,
  "hermanito-peques": hermanitoPeques,
  "hermanito-mayores": hermanitoMayores,
  "ciudad-peques": ciudadPeques,
  "ciudad-mayores": ciudadMayores,
};

export const idPlantilla = (c: ColeccionId, edad: number): PlantillaId => `${c}-${bandaDe(edad)}`;
export const plantilla = (c: ColeccionId, edad: number) => PLANTILLAS[idPlantilla(c, edad)];
export { BANDAS, bandaDe } from "./tipos";
export type { Banda, Plantilla, PaginaPlantilla, PlantillaId } from "./tipos";
