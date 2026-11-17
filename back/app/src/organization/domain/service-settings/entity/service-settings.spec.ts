import { ServiceSettings } from './service-settings';

const LABO_DEMO = {
  administration:
    "MINISTÈRE DE L'INTÉRIEUR — DIRECTION GÉNÉRALE DE LA POLICE NATIONALE",
  serviceName: 'SERVICE RÉGIONAL DE POLICE TECHNIQUE ET SCIENTIFIQUE',
  postalAddress: '12 rue des Exemples — 75017 PARIS',
  phoneNumber: '01 00 00 60 00',
  email: 'contact@labo-demo.example',
  signatureCity: 'Paris',
};

const VIDE = {
  administration: '',
  serviceName: '',
  postalAddress: '',
  phoneNumber: '',
  email: '',
  signatureCity: '',
};

describe('ServiceSettings', () => {
  it("rend six champs vides tant que rien n'a été saisi", () => {
    expect(ServiceSettings.blank().toPrimitives()).toEqual(VIDE);
  });

  it("relit à l'identique l'en-tête enregistré", () => {
    expect(ServiceSettings.reconstitute(LABO_DEMO).toPrimitives()).toEqual(
      LABO_DEMO,
    );
  });

  it('remplace tous les champs par ceux du nouvel en-tête', () => {
    const settings = ServiceSettings.reconstitute(LABO_DEMO);

    settings.replaceWith({ ...LABO_DEMO, signatureCity: 'Lyon' });

    expect(settings.toPrimitives()).toEqual({
      ...LABO_DEMO,
      signatureCity: 'Lyon',
    });
  });

  it('vide un champ que le nouvel en-tête laisse en blanc', () => {
    const settings = ServiceSettings.reconstitute(LABO_DEMO);

    settings.replaceWith({ ...LABO_DEMO, phoneNumber: '' });

    expect(settings.toPrimitives().phoneNumber).toBe('');
  });

  it('retire les espaces de bord avant de retenir une valeur', () => {
    const settings = ServiceSettings.blank();

    settings.replaceWith({ ...VIDE, signatureCity: '  Paris  ' });

    expect(settings.toPrimitives().signatureCity).toBe('Paris');
  });

  it('réduit à rien un champ qui ne contient que des espaces', () => {
    const settings = ServiceSettings.reconstitute(LABO_DEMO);

    settings.replaceWith({ ...LABO_DEMO, phoneNumber: '   ' });

    expect(settings.toPrimitives().phoneNumber).toBe('');
  });

  it('retient tels quels les accents et la ponctuation du nom du service', () => {
    const settings = ServiceSettings.blank();

    settings.replaceWith({ ...VIDE, serviceName: 'SERVICE — PRÉFECTURE' });

    expect(settings.toPrimitives().serviceName).toBe('SERVICE — PRÉFECTURE');
  });

  it('ne rend que le champ qui change, avec sa nouvelle valeur', () => {
    const settings = ServiceSettings.reconstitute(LABO_DEMO);

    expect(settings.changesTo({ ...LABO_DEMO, signatureCity: 'Lyon' })).toEqual(
      {
        signatureCity: 'Lyon',
      },
    );
  });

  it("rend les six champs au premier enregistrement d'un service", () => {
    expect(ServiceSettings.blank().changesTo(LABO_DEMO)).toEqual(LABO_DEMO);
  });

  it('ne rend aucun changement quand le même en-tête est réenregistré', () => {
    expect(
      ServiceSettings.reconstitute(LABO_DEMO).changesTo(LABO_DEMO),
    ).toEqual({});
  });

  it('ne voit pas de changement quand seuls les espaces de bord diffèrent', () => {
    const settings = ServiceSettings.reconstitute(LABO_DEMO);

    expect(
      settings.changesTo({ ...LABO_DEMO, email: '  ' + LABO_DEMO.email + ' ' }),
    ).toEqual({});
  });

  it("voit un effacement dans un champ rempli d'espaces", () => {
    const settings = ServiceSettings.reconstitute(LABO_DEMO);

    expect(settings.changesTo({ ...LABO_DEMO, email: '  ' })).toEqual({
      email: '',
    });
  });

  it('rend la chaîne vide du champ que le nouvel en-tête efface', () => {
    const settings = ServiceSettings.reconstitute(LABO_DEMO);

    expect(settings.changesTo({ ...LABO_DEMO, phoneNumber: '' })).toEqual({
      phoneNumber: '',
    });
  });

  it("laisse l'en-tête en place : demander les changements n'en applique aucun", () => {
    const settings = ServiceSettings.reconstitute(LABO_DEMO);

    settings.changesTo(VIDE);

    expect(settings.toPrimitives()).toEqual(LABO_DEMO);
  });

  it('rend une copie que le lecteur ne peut pas altérer', () => {
    const settings = ServiceSettings.reconstitute(LABO_DEMO);

    settings.toPrimitives().serviceName = 'AUTRE SERVICE';

    expect(settings.toPrimitives().serviceName).toBe(LABO_DEMO.serviceName);
  });

  it('reconstitue à partir de ses propres primitives sans rien perdre', () => {
    const settings = ServiceSettings.reconstitute(LABO_DEMO);

    const relu = ServiceSettings.reconstitute(settings.toPrimitives());

    expect(relu.toPrimitives()).toEqual(settings.toPrimitives());
  });

  it('ne partage pas son en-tête vide entre deux services', () => {
    const premier = ServiceSettings.blank();

    premier.replaceWith({ ...VIDE, serviceName: 'Labo démo' });

    expect(ServiceSettings.blank().toPrimitives()).toEqual(VIDE);
  });
});
