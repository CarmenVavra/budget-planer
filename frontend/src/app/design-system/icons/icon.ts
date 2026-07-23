import { Component, input } from '@angular/core';

export type IconName =
  | 'plus'
  | 'pencil'
  | 'trash'
  | 'mail'
  | 'wallet'
  | 'chevron-down'
  | 'arrow-left';

interface IconPath {
  d: string;
  opacity?: number;
}

/** Phosphor duotone paths, ported verbatim from the UI_MOCKUPS design handoff. */
const ICONS: Record<IconName, IconPath[]> = {
  plus: [
    { d: 'M216,128a88,88,0,1,1-88-88A88,88,0,0,1,216,128Z', opacity: 0.25 },
    {
      d: 'M176,120a8,8,0,0,1-8,8H136v32a8,8,0,0,1-16,0V128H88a8,8,0,0,1,0-16h32V80a8,8,0,0,1,16,0v32h32A8,8,0,0,1,176,120Z',
    },
  ],
  pencil: [
    { d: 'M224,86.34,169.66,32,64,137.66V192h54.34Z', opacity: 0.25 },
    {
      d: 'M229.66,74.34,181.66,26.34a8,8,0,0,0-11.32,0L36.69,159.99A8,8,0,0,0,34.34,165l-16,60a8,8,0,0,0,9.66,9.66l60-16a8,8,0,0,0,5.02-2.34L229.66,85.66A8,8,0,0,0,229.66,74.34Z',
    },
  ],
  trash: [
    { d: 'M200,56V208a8,8,0,0,1-8,8H64a8,8,0,0,1-8-8V56Z', opacity: 0.25 },
    {
      d: 'M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16Z',
    },
  ],
  mail: [
    { d: 'M224,64V192a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V64Z', opacity: 0.25 },
    {
      d: 'M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48Zm-19.72,16L128,133.15,51.72,64ZM216,192H40V74.71l82.59,74.16a8,8,0,0,0,10.82,0L216,74.71V192Z',
    },
  ],
  wallet: [
    { d: 'M224,88H32V64a8,8,0,0,1,8-8H208a8,8,0,0,1,8,8Z', opacity: 0.25 },
    {
      d: 'M216,48H40A24,24,0,0,0,16,72V184a24,24,0,0,0,24,24H216a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM40,64H216V80H40V72A8,8,0,0,1,40,64ZM216,192H40a8,8,0,0,1-8-8V95.4A23.9,23.9,0,0,0,40,96H216Zm-40-56a12,12,0,1,1,12,12A12,12,0,0,1,176,136Z',
    },
  ],
  'chevron-down': [
    {
      d: 'M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z',
    },
  ],
  'arrow-left': [
    {
      d: 'M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,1,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,1,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z',
    },
  ],
};

@Component({
  selector: 'app-icon',
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden="true"
    >
      @for (path of paths(); track path.d) {
        <path [attr.d]="path.d" [attr.opacity]="path.opacity ?? null" />
      }
    </svg>
  `,
})
export class IconComponent {
  name = input.required<IconName>();
  size = input(16);

  protected paths() {
    return ICONS[this.name()];
  }
}
