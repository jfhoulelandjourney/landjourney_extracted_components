import type { AnnotationsUnion, Instance } from '@nutrient-sdk/viewer';
import { UnreachableCaseError } from '../../../utils/errorUtil';
import { capitalize, formatEnumValue } from '../../../utils/stringUtil';
import type { AnnotationData } from '../annotation.types';

interface AnnotationOverrides {
  readonly: boolean;
  imageUrl?: string;
}

export const ICON_SIZE = 18;
export const ICON_COLOR = '#A0A0A0';
export const FONT_SIZE = 10;

// <svg xmlns="http://www.w3.org/2000/svg" fill="#e3e3e3" viewBox="0 -960 960 960">
//   <path d="M563-491q73-54 114-118.5T718-738q0-32-10.5-47T679-800q-47 0-83 79.5T560-541q0 14 .5 26.5T563-491ZM120-120v-80h80v80h-80Zm160 0v-80h80v80h-80Zm160 0v-80h80v80h-80Zm160 0v-80h80v80h-80Zm160 0v-80h80v80h-80ZM136-280l-56-56 64-64-64-64 56-56 64 64 64-64 56 56-64 64 64 64-56 56-64-64-64 64Zm482-40q-30 0-55-11.5T520-369q-25 14-51.5 25T414-322l-28-75q28-10 53.5-21.5T489-443q-5-22-7.5-48t-2.5-56q0-144 57-238.5T679-880q52 0 85 38.5T797-734q0 86-54.5 170T591-413q7 7 14.5 10.5T621-399q26 0 60.5-33t62.5-87l73 34q-7 17-11 41t1 42q10-5 23.5-17t27.5-30l63 49q-26 36-60 58t-63 22q-21 0-37.5-12.5T733-371q-28 25-57 38t-58 13Z"/>
// </svg>
function createSignatureIcon(scale: number): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 -960 960 960');
  svg.setAttribute('fill', ICON_COLOR);
  svg.style.width = `${ICON_SIZE * scale}px`;
  svg.style.height = `${ICON_SIZE * scale}px`;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute(
    'd',
    'M563-491q73-54 114-118.5T718-738q0-32-10.5-47T679-800q-47 0-83 79.5T560-541q0 14 .5 26.5T563-491ZM120-120v-80h80v80h-80Zm160 0v-80h80v80h-80Zm160 0v-80h80v80h-80Zm160 0v-80h80v80h-80Zm160 0v-80h80v80h-80ZM136-280l-56-56 64-64-64-64 56-56 64 64 64-64 56 56-64 64 64 64-56 56-64-64-64 64Zm482-40q-30 0-55-11.5T520-369q-25 14-51.5 25T414-322l-28-75q28-10 53.5-21.5T489-443q-5-22-7.5-48t-2.5-56q0-144 57-238.5T679-880q52 0 85 38.5T797-734q0 86-54.5 170T591-413q7 7 14.5 10.5T621-399q26 0 60.5-33t62.5-87l73 34q-7 17-11 41t1 42q10-5 23.5-17t27.5-30l63 49q-26 36-60 58t-63 22q-21 0-37.5-12.5T733-371q-28 25-57 38t-58 13Z'
  );
  svg.appendChild(path);

  return svg;
}

// <svg xmlns="http://www.w3.org/2000/svg" fill="#e3e3e3" viewBox="0 -960 960 960">
//   <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z"/>
// </svg>
function createDateIcon(scale: number): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 -960 960 960');
  svg.setAttribute('fill', ICON_COLOR);
  svg.style.width = `${ICON_SIZE * scale}px`;
  svg.style.height = `${ICON_SIZE * scale}px`;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute(
    'd',
    'M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z'
  );
  svg.appendChild(path);

  return svg;
}

// <svg xmlns="http://www.w3.org/2000/svg" fill="#e3e3e3" viewBox="0 -960 960 960">
//   <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z"/>
// </svg>
function createNameIcon(scale: number): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 -960 960 960');
  svg.setAttribute('fill', ICON_COLOR);
  svg.style.width = `${ICON_SIZE * scale}px`;
  svg.style.height = `${ICON_SIZE * scale}px`;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute(
    'd',
    'M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z'
  );
  svg.appendChild(path);

  return svg;
}

// <svg xmlns="http://www.w3.org/2000/svg" fill="#e3e3e3" viewBox="0 -960 960 960">
//   <path d="M80-120v-80h800v80H80Zm680-160v-560h60v560h-60Zm-600 0 210-560h100l210 560h-96l-50-144H308l-52 144h-96Zm176-224h168l-82-232h-4l-82 232Z"/>
// </svg>
function createInitialsIcon(scale: number): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 -960 960 960');
  svg.setAttribute('fill', ICON_COLOR);
  svg.style.width = `${ICON_SIZE * scale}px`;
  svg.style.height = `${ICON_SIZE * scale}px`;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute(
    'd',
    'M80-120v-80h800v80H80Zm680-160v-560h60v560h-60Zm-600 0 210-560h100l210 560h-96l-50-144H308l-52 144h-96Zm176-224h168l-82-232h-4l-82 232Z'
  );
  svg.appendChild(path);

  return svg;
}

function createBuildCircleIcon(scale: number): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.style.width = `${ICON_SIZE * scale}px`;
  svg.style.height = `${ICON_SIZE * scale}px`;

  // Circle outline (no fill)
  const circle = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'circle'
  );
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '12');
  circle.setAttribute('r', '10.5');
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke', ICON_COLOR);
  circle.setAttribute('stroke-width', '1.5');
  svg.appendChild(circle);

  // Wrench icon
  const wrenchPath = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'path'
  );
  wrenchPath.setAttribute(
    'd',
    'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'
  );
  wrenchPath.setAttribute('fill', ICON_COLOR);
  svg.appendChild(wrenchPath);

  return svg;
}

function createAnnotationIcon(
  annotation: AnnotationsUnion,
  scale: number
): SVGElement {
  const { type } = getAnnotationData(annotation);
  if (!type) {
    throw new Error('Annotation type is not defined');
  }
  switch (type) {
    case 'signature':
      return createSignatureIcon(scale);
    case 'date':
      return createDateIcon(scale);
    case 'name':
      return createNameIcon(scale);
    case 'initials':
      return createInitialsIcon(scale);
    case 'custom':
      return createBuildCircleIcon(scale);
    default:
      throw new UnreachableCaseError(type);
  }
}

function createHtmlAvatar(
  name: string,
  imageUrl?: string,
  size = 30,
  scale = 1
): HTMLElement {
  const avatarContainer = document.createElement('div');
  avatarContainer.style.width = `${size * scale}px`;
  avatarContainer.style.height = `${size * scale}px`;
  avatarContainer.style.borderRadius = '50%';
  avatarContainer.style.display = 'flex';
  avatarContainer.style.alignItems = 'center';
  avatarContainer.style.justifyContent = 'center';
  avatarContainer.style.overflow = 'hidden';
  avatarContainer.style.backgroundColor = '#BDBDBD';
  avatarContainer.style.color = 'white';
  avatarContainer.style.fontWeight = 'regular';
  avatarContainer.style.fontSize = `${Math.max(10, size * 0.45) * scale}px`;
  avatarContainer.style.marginLeft = 'auto';
  avatarContainer.style.flexShrink = '0';

  const allInitials = name
    .split(' ')
    .map(part => part.charAt(0).toLocaleUpperCase());
  const initials =
    allInitials.length >= 2
      ? [allInitials.at(0), allInitials.at(-1)].join('')
      : allInitials.join('');

  if (imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = name;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.onerror = () => {
      // Fallback to initials
      avatarContainer.innerHTML = '';
      avatarContainer.textContent = initials;
    };
    avatarContainer.appendChild(img);
  } else {
    avatarContainer.textContent = initials;
  }
  return avatarContainer;
}

function createTextNode(text: string, scale: number): HTMLElement {
  const textNode = document.createElement('span');
  textNode.textContent = text;
  textNode.style.fontSize = `${10 * scale}px`;
  textNode.style.fontWeight = 'regular';
  textNode.style.flexGrow = '1';
  textNode.style.whiteSpace = 'nowrap';
  textNode.style.overflow = 'hidden';
  textNode.style.textOverflow = 'ellipsis';
  textNode.style.lineHeight = '1';
  return textNode;
}

function createAnnotationTypeNode(
  annotation: AnnotationsUnion,
  scale: number
): HTMLElement {
  const div = document.createElement('div');
  div.style.display = 'flex';
  div.style.flexFlow = 'column nowrap';
  div.style.alignItems = 'center';
  div.style.justifyContent = 'center';
  div.style.gap = '2px';
  div.style.color = '#606060';
  const icon = createAnnotationIcon(annotation, scale);
  if (icon) {
    div.appendChild(icon);
  }

  const customData = annotation.customData as AnnotationData | null;
  const annotationType = customData?.type;
  if (annotationType) {
    if (annotationType === 'custom' && customData?.name) {
      div.appendChild(createTextNode(customData.name, scale));
    } else {
      div.appendChild(createTextNode(capitalize(annotationType), scale));
    }
  }

  return div;
}

function createBadgeNode(text: string, scale: number): HTMLElement {
  const badge = document.createElement('span');
  badge.textContent = text;
  badge.style.backgroundColor = '#E0E0E0';
  badge.style.color = '#000';
  badge.style.padding = '2px 6px';
  badge.style.borderRadius = '5px';
  badge.style.fontSize = `${8 * scale}px`;
  return badge;
}

function createSigneeNode(
  signee: string,
  signeeRoles: string[],
  scale: number
): HTMLElement {
  const signeeNode = document.createElement('div');
  signeeNode.style.display = 'flex';
  signeeNode.style.alignItems = 'center';
  signeeNode.style.gap = '6px';
  signeeNode.style.flexShrink = '0';
  signeeNode.style.flexGrow = '0';
  signeeNode.style.flexBasis = 'auto';
  signeeNode.appendChild(createTextNode(signee, scale));
  signeeRoles.forEach(role => {
    signeeNode.appendChild(createBadgeNode(role, scale));
  });
  return signeeNode;
}

function createHostNode(annotation: AnnotationsUnion): HTMLElement {
  const hostNode = document.createElement('div');
  hostNode.setAttribute('data-annotation-id', annotation.id);
  hostNode.classList.add('lj-custom-annotation');
  if (annotation.customData?.filled) {
    hostNode.classList.add('lj-custom-annotation--filled');
  }
  hostNode.style.boxSizing = 'border-box';
  hostNode.style.width = '100%';
  hostNode.style.height = '100%';
  hostNode.style.display = 'flex';
  hostNode.style.padding = '4px';
  hostNode.style.flexFlow = 'row nowrap';
  hostNode.style.flexShrink = '0';
  hostNode.style.alignItems = 'center';
  hostNode.style.justifyContent = 'center';
  hostNode.style.border = '1px solid #7D7D7D';
  hostNode.style.borderRadius = '4px';
  hostNode.style.backgroundColor = 'rgba(210, 240, 208, 0.50)';
  hostNode.style.cursor = 'pointer';
  hostNode.style.overflow = 'hidden';

  return hostNode;
}

function createContainerNode(): HTMLElement {
  const containerNode = document.createElement('div');
  containerNode.style.boxSizing = 'border-box';
  containerNode.style.width = '100%';
  containerNode.style.height = '100%';
  containerNode.style.display = 'flex';
  containerNode.style.padding = '0 2px';
  containerNode.style.flexFlow = 'row nowrap';
  containerNode.style.flexShrink = '0';
  containerNode.style.alignItems = 'center';
  containerNode.style.borderRadius = '4px';
  containerNode.style.justifyContent = 'space-between';
  containerNode.style.backgroundColor = 'rgba(210, 240, 208, 0.50)';
  containerNode.style.overflow = 'hidden';
  return containerNode;
}

function getAnnotationData(
  annotation: AnnotationsUnion
): Partial<AnnotationData> {
  return (annotation.customData || {}) as unknown as Partial<AnnotationData>;
}

export function createTemplatePlaceholderNode(
  annotation: AnnotationsUnion,
  instance?: Instance
): HTMLElement {
  const { signee } = getAnnotationData(annotation);
  const { name, roles } = signee || {};
  const { zoom } = instance?.viewState || {};
  const scale = typeof zoom === 'number' ? zoom : 1;
  const hostNode = createHostNode(annotation);
  const containerNode = createContainerNode();
  hostNode.appendChild(containerNode);
  containerNode.appendChild(createAnnotationTypeNode(annotation, scale));
  if (roles && roles.length > 0) {
    containerNode.appendChild(
      createSigneeNode(
        name || 'Signer',
        roles.map(r => formatEnumValue(r)),
        scale
      )
    );
  }
  return hostNode;
}

export function createPlaceholderNode(
  annotation: AnnotationsUnion,
  instance?: Instance,
  overrides?: AnnotationOverrides
): HTMLElement | null {
  const { signer } = getAnnotationData(annotation);

  if (!signer) {
    return null;
  }

  const { zoom } = instance?.viewState || {};
  const scale = typeof zoom === 'number' ? zoom : 1;
  const hostNode = createHostNode(annotation);
  const containerNode = createContainerNode();
  hostNode.appendChild(containerNode);
  containerNode.appendChild(createAnnotationTypeNode(annotation, scale));
  containerNode.appendChild(
    createHtmlAvatar(
      signer?.name || 'Signer',
      overrides?.imageUrl ?? signer?.imageUrl ?? undefined
    )
  );
  return hostNode;
}

export function createCustomRenderer(
  annotation: AnnotationsUnion,
  instance?: Instance,
  overrides?: AnnotationOverrides
): HTMLElement | null {
  const { isTemplate } = annotation.customData || {};
  const customNode =
    isTemplate && !annotation.customData?.signer
      ? createTemplatePlaceholderNode(annotation, instance)
      : createPlaceholderNode(annotation, instance, overrides);
  return customNode;
}
