import {
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { SaveServiceSettingsDto } from './save-service-settings.dto';

const LABO_DEMO = {
  administration:
    "MINISTÈRE DE L'INTÉRIEUR — DIRECTION GÉNÉRALE DE LA POLICE NATIONALE",
  serviceName: 'SERVICE RÉGIONAL DE POLICE TECHNIQUE ET SCIENTIFIQUE',
  postalAddress: '12 rue des Exemples — 75017 PARIS',
  phoneNumber: '01 00 00 60 00',
  email: 'contact@labo-demo.example',
  signatureCity: 'Paris',
};

const BODY: ArgumentMetadata = {
  type: 'body',
  metatype: SaveServiceSettingsDto,
};

const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
});

const transform = (body: unknown): Promise<SaveServiceSettingsDto> =>
  pipe.transform(body, BODY) as Promise<SaveServiceSettingsDto>;

const expectRejection = async (
  body: unknown,
  property: string,
): Promise<void> => {
  await expect(transform(body)).rejects.toBeInstanceOf(BadRequestException);
  const messages = await transform(body).then(
    () => [] as string[],
    (error: BadRequestException) =>
      (error.getResponse() as { message: string[] }).message,
  );
  expect(messages).toEqual(
    expect.arrayContaining([expect.stringContaining(property)]),
  );
};

describe('SaveServiceSettingsDto', () => {
  it("accepte les six champs de l'en-tête", async () => {
    await expect(transform(LABO_DEMO)).resolves.toEqual(LABO_DEMO);
  });

  it("accepte un champ vide, qui retire sa ligne de l'en-tête", async () => {
    await expect(transform({ ...LABO_DEMO, phoneNumber: '' })).resolves.toEqual(
      {
        ...LABO_DEMO,
        phoneNumber: '',
      },
    );
  });

  it.each(Object.keys(LABO_DEMO) as (keyof typeof LABO_DEMO)[])(
    "refuse un corps auquel il manque le champ %s : l'en-tête s'enregistre en entier",
    async (field) => {
      const incomplet: Partial<typeof LABO_DEMO> = { ...LABO_DEMO };
      delete incomplet[field];

      await expectRejection(incomplet, field);
    },
  );

  it.each([
    [
      'un nom de service qui n’est pas du texte',
      { serviceName: 42 },
      'serviceName',
    ],
    ['une adresse à null', { postalAddress: null }, 'postalAddress'],
    ['un courriel envoyé comme objet', { email: {} }, 'email'],
    [
      'une ville de signature au-delà de la borne',
      { signatureCity: 'x'.repeat(256) },
      'signatureCity',
    ],
    [
      'un champ que la route ne connaît pas',
      { logoUrl: 'https://…' },
      'logoUrl',
    ],
  ])('refuse %s', async (_refus, override, property) => {
    await expectRejection({ ...LABO_DEMO, ...override }, property);
  });
});
