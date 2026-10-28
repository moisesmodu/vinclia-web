import type { ColeccionId } from "../catalogo";
import { ciudad } from "./ciudad";
import { dormir } from "./dormir";
import { hermanito } from "./hermanito";
import type { Plantilla } from "./tipos";
import { valores } from "./valores";

export const PLANTILLAS: Record<ColeccionId, Plantilla> = { dormir, valores, hermanito, ciudad };
export const plantilla = (c: ColeccionId) => PLANTILLAS[c];
export type { Plantilla, PaginaPlantilla } from "./tipos";
