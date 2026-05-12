import { NgForm } from '@angular/forms';
import { isNil } from 'es-toolkit';

export function listFormErrors(
  form: NgForm
): Record<string, Record<string, string>> {
  const response = Object.create(null);

  Object.keys(form.controls).forEach(key => {
    const errors = {};
    const controlErrors = form.form?.get(key)?.errors;

    if (!isNil(controlErrors)) {
      Object.entries(controlErrors).forEach(([key, errorMessage]) => {
        Object.assign(errors, { [key]: errorMessage });
      });
    }

    if (Object.keys(errors).length > 0) {
      Object.assign(response, { [key]: errors });
    }
  });

  return response;
}
