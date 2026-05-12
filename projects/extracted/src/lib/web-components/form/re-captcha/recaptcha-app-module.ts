import { NgModule } from '@angular/core';
import {
  RECAPTCHA_V3_SITE_KEY,
  RecaptchaFormsModule,
  RecaptchaModule,
  ReCaptchaV3Service,
} from 'ng-recaptcha-2';
import { RecaptchaService } from './recaptcha-service';
import { RECAPTCHA_SITE_KEY } from './recaptcha-token';

@NgModule({
  imports: [RecaptchaModule, RecaptchaFormsModule],
  exports: [RecaptchaModule, RecaptchaFormsModule],
  providers: [
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useExisting: RECAPTCHA_SITE_KEY,
    },
    ReCaptchaV3Service,
    RecaptchaService,
  ],
})
export class RecaptchaAppModule {}
