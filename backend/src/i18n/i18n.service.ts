import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class I18nService {
  private translations: Record<string, Record<string, string>> = {
    en: {
      welcome: 'Welcome to AliveHuman',
      emailVerification: 'Please verify your email',
      // Add more translations as needed
    },
    es: {
      welcome: 'Bienvenido a AliveHuman',
      emailVerification: 'Por favor verifica tu correo electrónico',
    },
    // Add more languages as needed
  };

  constructor(private configService: ConfigService) {}

  translate(key: string, lang = 'en'): string {
    const defaultLang = this.configService.get<string>('DEFAULT_LANGUAGE', 'en');
    const language = this.translations[lang] ? lang : defaultLang;

    return this.translations[language]?.[key] || key;
  }
}
