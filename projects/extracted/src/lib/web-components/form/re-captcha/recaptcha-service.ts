import { Injectable, inject } from '@angular/core';
import { ReCaptchaV3Service } from 'ng-recaptcha-2';
import { Observable } from 'rxjs';

@Injectable()
export class RecaptchaService {
  private recaptchaV3Service = inject(ReCaptchaV3Service);


  executeRecaptcha(action: string): Observable<string> {
    return this.recaptchaV3Service.execute(action);
  }
}
