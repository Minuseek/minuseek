export interface RevelationTechniqueText {
  title: string;
  paragraph: string;
}

// Textes rédigés pour Minuseek : ils décrivent chaque méthode en termes
// généraux. Un laboratoire qui dispose de ses propres formulations officielles
// les substitue à celles-ci.
export const REVELATION_TECHNIQUE_TEXTS: Record<
  string,
  RevelationTechniqueText
> = {
  OPTICAL_PROCESS: {
    title: 'Détection de traces papillaires latentes par procédé optique',
    paragraph:
      "Cette méthode n'emploie aucun réactif : la surface est observée sous un éclairage du domaine visible, dont l'orientation et la couleur font ressortir le dépôt papillaire par contraste avec son support. Chaque trace ainsi mise en évidence est photographiée avec sa localisation, et les clichés sont conservés au format numérique.",
  },
  FINGERPRINT_POWDER: {
    title: 'Révélation par poudre dactyloscopique',
    paragraph:
      "Une poudre fine, appliquée sur la surface, adhère aux résidus laissés par les crêtes papillaires et les rend visibles. La méthode convient aux supports lisses, non poreux, propres et secs. Les traces révélées sont photographiées avec leur localisation, les clichés sont conservés au format numérique, puis les traces sont relevées sur un support rigide. Sauf emploi de matériel stérile, l'application de poudre exclut toute analyse biologique ultérieure de la zone traitée.",
  },
  DFO: {
    title: 'Révélation au DFO',
    paragraph:
      "Destiné aux supports poreux comme le papier ou le carton, le DFO (1,8-diazafluorén-9-one) réagit avec les acides aminés du dépôt papillaire. Le produit de cette réaction devient fluorescent sous une source d'excitation adaptée et s'observe à travers un filtre. Lorsque les deux réactifs sont employés, le DFO passe avant la ninhydrine, sans nuire à son efficacité. Les traces révélées sont photographiées avec leur localisation et les clichés sont conservés au format numérique. Un support traité au DFO ne peut plus faire l'objet d'une analyse biologique.",
  },
  NINHYDRIN: {
    title: 'Révélation à la ninhydrine',
    paragraph:
      'Également destinée aux supports poreux, la ninhydrine réagit avec les acides aminés du dépôt papillaire et forme un composé de couleur pourpre, visible en lumière ordinaire. Si le support a déjà été traité au DFO, la ninhydrine intervient en second. Les traces révélées sont photographiées avec leur localisation et les clichés sont conservés au format numérique. Le traitement à la ninhydrine reste compatible avec une analyse biologique ultérieure.',
  },
};
