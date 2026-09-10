import type { DisciplineTemplateConfig } from "@/types";
import kungfuWushu from "./kungfu-wushu.json";
import kungfuChoyleefut from "./kungfu-choyleefut.json";
import taekwondo from "./taekwondo.json";
import karate from "./karate.json";
import jujitsu from "./jujitsu.json";

export const DISCIPLINE_TEMPLATES: Record<string, DisciplineTemplateConfig> = {
  KUNGFU_WUSHU: kungfuWushu as DisciplineTemplateConfig,
  KUNGFU_CHOYLEEFUT: kungfuChoyleefut as DisciplineTemplateConfig,
  TAEKWONDO: taekwondo as DisciplineTemplateConfig,
  KARATE: karate as DisciplineTemplateConfig,
  JUJITSU: jujitsu as DisciplineTemplateConfig,
};

export const DISCIPLINE_TEMPLATE_LIST: DisciplineTemplateConfig[] = [
  kungfuWushu as DisciplineTemplateConfig,
  kungfuChoyleefut as DisciplineTemplateConfig,
  taekwondo as DisciplineTemplateConfig,
  karate as DisciplineTemplateConfig,
  jujitsu as DisciplineTemplateConfig,
];

export function getDisciplineTemplateById(id: string): DisciplineTemplateConfig | null {
  return DISCIPLINE_TEMPLATES[id] || null;
}
