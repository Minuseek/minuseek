import { InMemoryServiceSettingsReader } from '../../../infrastructure/persistence/in-memory-service-settings.reader';
import { GetServiceSettingsHandler } from './get-service-settings.handler';
import { ServiceSettingsReadModel } from './service-settings-read-model';

const LABO_DEMO: ServiceSettingsReadModel = {
  administration:
    "MINISTÈRE DE L'INTÉRIEUR — DIRECTION GÉNÉRALE DE LA POLICE NATIONALE",
  serviceName: 'SERVICE RÉGIONAL DE POLICE TECHNIQUE ET SCIENTIFIQUE',
  postalAddress: '12 rue des Exemples — 75017 PARIS',
  phoneNumber: '01 00 00 60 00',
  email: 'contact@labo-demo.example',
  signatureCity: 'Paris',
};

describe('GetServiceSettingsHandler', () => {
  it("rend l'en-tête enregistré par le service", async () => {
    const handler = new GetServiceSettingsHandler(
      new InMemoryServiceSettingsReader(LABO_DEMO),
    );

    expect(await handler.execute()).toEqual(LABO_DEMO);
  });

  it("rend six champs vides au service qui n'a rien saisi, sans lever d'erreur", async () => {
    const handler = new GetServiceSettingsHandler(
      new InMemoryServiceSettingsReader(),
    );

    expect(await handler.execute()).toEqual({
      administration: '',
      serviceName: '',
      postalAddress: '',
      phoneNumber: '',
      email: '',
      signatureCity: '',
    });
  });

  it("ne rend pas deux fois le même en-tête vide, qu'un appelant pourrait altérer", async () => {
    const handler = new GetServiceSettingsHandler(
      new InMemoryServiceSettingsReader(),
    );

    (await handler.execute()).serviceName = 'Labo démo';

    expect((await handler.execute()).serviceName).toBe('');
  });
});
