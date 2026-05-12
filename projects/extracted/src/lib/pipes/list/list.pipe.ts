import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

type ListStyle = 'long' | 'short' | 'narrow';
type ListType = 'conjunction' | 'disjunction' | 'unit';

@Pipe({
  name: 'list',
  standalone: true,
  pure: true,
})
export class ListPipe implements PipeTransform {
  locale = inject(LOCALE_ID);

  transform<T extends string>(
    value: T[],
    style?: ListStyle,
    type?: ListType
  ): unknown {
    const definedStyle = style || 'long';
    const definedType = type || 'conjunction';

    const formatter = new Intl.ListFormat(this.locale, {
      style: definedStyle,
      type: definedType,
    });

    return formatter.format(value);
  }
}
