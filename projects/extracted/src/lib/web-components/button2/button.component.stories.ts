// button.stories.ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { provideRouter, withHashLocation } from '@angular/router';
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { LjButton2Component } from './button.component';

// Mock route component for router testing
@Component({
  standalone: true,
  template: '<h1>Mock Route Page</h1>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockRouteComponent {}

const meta: Meta<LjButton2Component> = {
  title: 'Design System/Molecules/Button',
  component: LjButton2Component,
  decorators: [
    applicationConfig({
      providers: [
        provideRouter(
          [{ path: 'mock-route', component: MockRouteComponent }],
          withHashLocation()
        ),
      ],
    }),
    moduleMetadata({
      imports: [MatIconModule],
    }),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Button Component

A versatile button component that supports standard buttons, external links, and Angular Router navigation.

## Features
- **Multiple variants**: Primary, Secondary, Tertiary, Ghost, Icon
- **Intent colors**: Brand, Success, Warning, Error, Neutral  
- **Sizes**: XXS, XS, SM, MD, LG, XL
- **States**: Loading, Disabled
- **Navigation**: Router links, external links
- **Icons**: Before/after content slots and icon inputs
- **Accessibility**: Full ARIA support and keyboard navigation
        `,
      },
    },
  },
  argTypes: {
    // Basic Properties
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'tertiary', 'ghost', 'icon'],
      description: 'Visual style variant',
    },
    intent: {
      control: { type: 'select' },
      options: ['brand', 'success', 'warning', 'error', 'neutral'],
      description: 'Color intent/theme',
    },
    size: {
      control: { type: 'select' },
      options: ['xxs', 'xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Button size',
    },
    type: {
      control: { type: 'select' },
      options: ['button', 'submit', 'reset'],
      description: 'HTML button type',
    },
    align: {
      control: { type: 'select' },
      options: ['start', 'center', 'end'],
      description: 'Text alignment',
    },

    // Layout
    compact: {
      control: { type: 'boolean' },
      description: 'Remove padding for compact layout',
    },
    fluid: {
      control: { type: 'select' },
      options: [false, 'width', 'height', 'both'],
      description: 'Make button fill available space',
    },

    // States
    disabled: {
      control: { type: 'boolean' },
      description: 'Disable the button',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Show loading spinner',
    },

    // Icons
    beforeIcon: {
      control: { type: 'text' },
      description: 'Material icon name to show before text',
    },
    afterIcon: {
      control: { type: 'text' },
      description: 'Material icon name to show after text',
    },

    // External Links
    href: {
      control: { type: 'text' },
      description: 'External URL for anchor tag',
    },
    target: {
      control: { type: 'select' },
      options: ['_self', '_blank', '_parent', '_top'],
      description: 'Link target',
    },

    // Router Links
    routerLink: {
      control: { type: 'text' },
      description: 'Angular router link path',
    },
    queryParams: {
      control: { type: 'object' },
      description: 'Router query parameters',
    },
    fragment: {
      control: { type: 'text' },
      description: 'Router fragment',
    },

    // Accessibility
    ariaLabel: {
      control: { type: 'text' },
      description: 'ARIA label for accessibility',
    },
    ariaDescribedBy: {
      control: { type: 'text' },
      description: 'ARIA described-by reference',
    },

    // Events (for docs)
    click: { action: 'clicked' },
    focus: { action: 'focused' },
    blur: { action: 'blurred' },
  },
  args: {
    // Default values
    variant: 'primary',
    intent: 'brand',
    size: 'md',
    type: 'button',
    align: 'center',
    compact: false,
    fluid: false,
    disabled: false,
    loading: false,
    beforeIcon: '',
    afterIcon: '',
    href: '',
    target: '_self',
    routerLink: null,
    queryParams: null,
    fragment: null,
    ariaLabel: '',
    ariaDescribedBy: '',
  },
};

export default meta;
type Story = StoryObj<LjButton2Component>;

// =============================================================================
// BASIC EXAMPLES
// =============================================================================

export const Default: Story = {
  render: args => ({
    props: args,
    template: `<lj-button [variant]="variant" [intent]="intent" [size]="size">Default Button</lj-button>`,
  }),
};

export const WithClick: Story = {
  render: args => ({
    props: {
      ...args,
      handleClick: () => {
        alert('Button clicked!');
      },
    },
    template: `
      <lj-button 
        [variant]="variant" 
        [intent]="intent" 
        [size]="size"
        (click)="handleClick($event)">
        Click Me
      </lj-button>
    `,
  }),
};

// =============================================================================
// VARIANTS SHOWCASE
// =============================================================================

export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center;">
        <lj-button variant="primary">Primary</lj-button>
        <lj-button variant="secondary">Secondary</lj-button>
        <lj-button variant="tertiary">Tertiary</lj-button>
        <lj-button variant="ghost">Ghost</lj-button>
        <lj-button variant="icon" ariaLabel="Like">
            <mat-icon>favorite</mat-icon>
        </lj-button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'All available button variants displayed side by side.',
      },
    },
  },
};

// =============================================================================
// INTENT COLORS
// =============================================================================

export const AllIntents: Story = {
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px;">
        <h4 style="grid-column: 1/-1; margin: 0;">Primary Variant</h4>
        <lj-button variant="primary" intent="brand">Brand</lj-button>
        <lj-button variant="primary" intent="success">Success</lj-button>
        <lj-button variant="primary" intent="warning">Warning</lj-button>
        <lj-button variant="primary" intent="error">Error</lj-button>
        <lj-button variant="primary" intent="neutral">Neutral</lj-button>
        
        <h4 style="grid-column: 1/-1; margin: 16px 0 0 0;">Secondary Variant</h4>
        <lj-button variant="secondary" intent="brand">Brand</lj-button>
        <lj-button variant="secondary" intent="success">Success</lj-button>
        <lj-button variant="secondary" intent="warning">Warning</lj-button>
        <lj-button variant="secondary" intent="error">Error</lj-button>
        <lj-button variant="secondary" intent="neutral">Neutral</lj-button>
        
        <h4 style="grid-column: 1/-1; margin: 16px 0 0 0;">Tertiary Variant</h4>
        <lj-button variant="tertiary" intent="brand">Brand</lj-button>
        <lj-button variant="tertiary" intent="success">Success</lj-button>
        <lj-button variant="tertiary" intent="warning">Warning</lj-button>
        <lj-button variant="tertiary" intent="error">Error</lj-button>
        <lj-button variant="tertiary" intent="neutral">Neutral</lj-button>
        
        <h4 style="grid-column: 1/-1; margin: 16px 0 0 0;">Ghost Variant</h4>
        <lj-button variant="ghost" intent="brand">Brand</lj-button>
        <lj-button variant="ghost" intent="success">Success</lj-button>
        <lj-button variant="ghost" intent="warning">Warning</lj-button>
        <lj-button variant="ghost" intent="error">Error</lj-button>
        <lj-button variant="ghost" intent="neutral">Neutral</lj-button>
        
        <h4 style="grid-column: 1/-1; margin: 16px 0 0 0;">Icon Variant</h4>
        <lj-button variant="icon" intent="brand">Brand</lj-button>
        <lj-button variant="icon" intent="success">Success</lj-button>
        <lj-button variant="icon" intent="warning">Warning</lj-button>
        <lj-button variant="icon" intent="error">Error</lj-button>
        <lj-button variant="icon" intent="neutral">Neutral</lj-button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'All intent colors across different variants.',
      },
    },
  },
};

// =============================================================================
// SIZES
// =============================================================================

export const AllSizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
        <lj-button size="xxs">XXS</lj-button>
        <lj-button size="xs">XS</lj-button>
        <lj-button size="sm">SM</lj-button>
        <lj-button size="md">MD</lj-button>
        <lj-button size="lg">LG</lj-button>
        <lj-button size="xl">XL</lj-button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'All available button sizes from XXS to XL.',
      },
    },
  },
};

// =============================================================================
// ICONS
// =============================================================================

export const WithIcons: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center;">
        <lj-button beforeIcon="save">Save</lj-button>
        <lj-button afterIcon="arrow_forward">Continue</lj-button>
        <lj-button beforeIcon="download" afterIcon="launch">Download & Open</lj-button>
        <lj-button variant="icon" ariaLabel="Like">
            <mat-icon>favorite</mat-icon>
        </lj-button>
        <lj-button variant="icon" ariaLabel="Share" size="sm">
            <mat-icon>share</mat-icon>
        </lj-button>
        <lj-button variant="icon" ariaLabel="Delete" intent="error">
            <mat-icon>delete</mat-icon>
        </lj-button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Buttons with icons in various positions and icon-only variants.',
      },
    },
  },
};

export const IconSizes: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; align-items: center;">
        <lj-button variant="icon" size="xxs" ariaLabel="Star XXS">
            <mat-icon>star</mat-icon>
        </lj-button>
        <lj-button variant="icon" size="xs" ariaLabel="Star XS">
            <mat-icon>star</mat-icon>
        </lj-button>
        <lj-button variant="icon" size="sm" ariaLabel="Star SM">
            <mat-icon>star</mat-icon>
        </lj-button>
        <lj-button variant="icon" size="md" ariaLabel="Star MD">
            <mat-icon>star</mat-icon>
        </lj-button>
        <lj-button variant="icon" size="lg" ariaLabel="Star LG">
            <mat-icon>star</mat-icon>
        </lj-button>
        <lj-button variant="icon" size="xl" ariaLabel="Star XL">
            <mat-icon>star</mat-icon>
        </lj-button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Icon buttons in all available sizes.',
      },
    },
  },
};

// =============================================================================
// STATES
// =============================================================================

export const ButtonStates: Story = {
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
        <h4 style="grid-column: 1/-1; margin: 0;">Normal States</h4>
        <lj-button>Normal</lj-button>
        <lj-button [loading]="true">Loading</lj-button>
        <lj-button [disabled]="true">Disabled</lj-button>
        
        <h4 style="grid-column: 1/-1; margin: 16px 0 0 0;">With Icons</h4>
        <lj-button beforeIcon="save">Normal</lj-button>
        <lj-button beforeIcon="save" [loading]="true">Loading</lj-button>
        <lj-button beforeIcon="save" [disabled]="true">Disabled</lj-button>
        
        <h4 style="grid-column: 1/-1; margin: 16px 0 0 0;">Icon Only</h4>
        <lj-button variant="icon" ariaLabel="Like">
            <mat-icon>thumb_up</mat-icon>
        </lj-button>
        <lj-button variant="icon" [loading]="true" ariaLabel="Loading Like">
            <mat-icon>thumb_up</mat-icon>
        </lj-button>
        <lj-button variant="icon" [disabled]="true" ariaLabel="Disabled Like">
            <mat-icon>thumb_up</mat-icon>
        </lj-button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Button states: normal, loading, and disabled across different configurations.',
      },
    },
  },
};

// =============================================================================
// NAVIGATION
// =============================================================================

export const RouterLinks: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; flex-direction: column; align-items: flex-start;">
        <lj-button routerLink="/mock-route">Basic Router Link</lj-button>
        <lj-button 
          routerLink="/mock-route" 
          [queryParams]="{page: 1, sort: 'name'}"
          variant="secondary">
          With Query Params
        </lj-button>
        <lj-button 
          routerLink="/mock-route" 
          fragment="section1"
          variant="tertiary">
          With Fragment
        </lj-button>
        <lj-button 
          routerLink="/mock-route" 
          beforeIcon="arrow_forward"
          [queryParams]="{redirect: true}">
          With Icon & Params
        </lj-button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Router navigation examples with various configurations.',
      },
    },
  },
};

export const ExternalLinks: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; flex-direction: column; align-items: flex-start;">
        <lj-button href="https://angular.io" target="_blank">
          Angular Docs
        </lj-button>
        <lj-button 
          href="https://material.angular.io" 
          target="_blank"
          beforeIcon="open_in_new"
          variant="secondary">
          Material Docs
        </lj-button>
        <lj-button 
          href="mailto:example@example.com"
          beforeIcon="email"
          variant="ghost">
          Send Email
        </lj-button>
        <lj-button 
          href="tel:+1234567890"
          beforeIcon="phone"
          variant="ghost">
          Call Us
        </lj-button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'External link examples including web links, email, and phone.',
      },
    },
  },
};

// =============================================================================
// LAYOUT & ALIGNMENT
// =============================================================================

export const LayoutOptions: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <div>
          <h4>Fluid Width</h4>
          <div style="width: 300px; border: 1px dashed #ccc; padding: 16px;">
            <lj-button [fluid]="'width'">Full Width Button</lj-button>
          </div>
        </div>
        
        <div>
          <h4>Compact Padding</h4>
          <div style="display: flex; gap: 16px;">
            <lj-button>Normal Padding</lj-button>
            <lj-button [compact]="true">Compact Padding</lj-button>
          </div>
        </div>
        
        <div>
          <h4>Text Alignment</h4>
          <div style="width: 200px; border: 1px dashed #ccc; padding: 16px; display: flex; flex-direction: column; gap: 8px;">
            <lj-button [fluid]="'width'" align="start">Start Aligned</lj-button>
            <lj-button [fluid]="'width'" align="center">Center Aligned</lj-button>
            <lj-button [fluid]="'width'" align="end">End Aligned</lj-button>
          </div>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Layout options: fluid width, compact padding, and text alignment.',
      },
    },
  },
};

// =============================================================================
// CONTENT PROJECTION
// =============================================================================

export const ContentProjection: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; flex-direction: column; align-items: flex-start;">
        <h4>Projection order</h4>
        <ol>
            <li>before icon</li>
            <li>before content</li>
            <li>content</li>
            <li>after content Icon</li>
            <li>after icon</li>
        </ol>

        <lj-button beforeIcon="chevron_left" afterIcon="chevron_right" variant="primary">
        <div before-content>
          Before
        </div>
          Main content
          <div after-content>
            After
          </div>
        </lj-button>
        <lj-button beforeIcon="chevron_left" afterIcon="chevron_right" variant="secondary">
        <div before-content>
          Before
        </div>
          Main content
          <div after-content>
            After
          </div>
        </lj-button>
        <lj-button beforeIcon="chevron_left" afterIcon="chevron_right" variant="tertiary">
        <div before-content>
          Before
        </div>
          Main content
          <div after-content>
            After
          </div>
        </lj-button>
        <lj-button beforeIcon="chevron_left" afterIcon="chevron_right" variant="ghost">
            <div before-content>Before</div>
            Main content
            <div after-content>After</div>
        </lj-button>
        <lj-button beforeIcon="chevron_left" afterIcon="chevron_right" variant="icon">
            <div before-content>Before</div>
            Main content
            <div after-content>After</div>
        </lj-button>

        <h4>Examples</h4>
        <lj-button beforeIcon="home" afterIcon="arrow_forward" variant="primary">
          Dashboard
        </lj-button>

        <lj-button variant="primary">
          <span before-content>🏠</span>
          Dashboard
          <span after-content>→</span>
        </lj-button>
        
        <lj-button variant="secondary">
          <div before-content style="width: 12px; height: 12px; background: green; border-radius: 50%;"></div>
          Online Status
        </lj-button>
        
        <lj-button variant="ghost">
          Profile
          <div after-content style="display: flex; align-items: center; gap: 4px;">
            <span style="font-size: var(--font-size-xxs);">|</span>
            <span style="font-size: var(--font-size-xxs);">⭐</span>
            <span style="font-size: var(--font-size-xxs);">Pro</span>
          </div>
        </lj-button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Custom content projection using before-content and after-content slots.',
      },
    },
  },
};

// =============================================================================
// ACCESSIBILITY
// =============================================================================

export const Accessibility: Story = {
  render: () => ({
    template: `
      <div style="display: flex; gap: 16px; flex-direction: column; align-items: flex-start;">
        <lj-button ariaLabel="Save document to drive">
          💾 Save
        </lj-button>
        
        <lj-button 
          variant="icon" 
          ariaLabel="Delete this item permanently"
          intent="error">
            <mat-icon>delete</mat-icon>
        </lj-button>
        
        <div>
          <p id="help-text" style="font-size: var(--font-size-xxs); color: #666; margin-bottom: 8px;">
            This button will process your payment
          </p>
          <lj-button 
            ariaDescribedBy="help-text"
            intent="success">
            Pay Now
          </lj-button>
        </div>
        
        <lj-button 
          [loading]="true"
          ariaLabel="Processing payment, please wait">
          Processing...
        </lj-button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Accessibility features: ARIA labels, descriptions, and proper loading states.',
      },
    },
  },
};

// =============================================================================
// COMPREHENSIVE GRID
// =============================================================================

export const ComprehensiveGrid: Story = {
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; place-items: center;">
        <!-- Headers -->
        <div></div>
        <strong>Primary</strong>
        <strong>Secondary</strong>
        <strong>Tertiary</strong>
        <strong>Ghost</strong>
        <strong>Icon</strong>
        
        <!-- Success Intent -->
        <strong>Success</strong>
        <lj-button variant="primary" intent="success" size="sm">Success</lj-button>
        <lj-button variant="secondary" intent="success" size="sm">Success</lj-button>
        <lj-button variant="tertiary" intent="success" size="sm">Success</lj-button>
        <lj-button variant="ghost" intent="success" size="sm">Success</lj-button>
        <lj-button variant="icon" intent="success" size="sm" ariaLabel="Success">
            <mat-icon>check</mat-icon>
        </lj-button>
        
        <!-- Warning Intent -->
        <strong>Warning</strong>
        <lj-button variant="primary" intent="warning" size="sm">Warning</lj-button>
        <lj-button variant="secondary" intent="warning" size="sm">Warning</lj-button>
        <lj-button variant="tertiary" intent="warning" size="sm">Warning</lj-button>
        <lj-button variant="ghost" intent="warning" size="sm">Warning</lj-button>
        <lj-button variant="icon" intent="warning" size="sm" ariaLabel="Warning">
            <mat-icon>warning</mat-icon>
        </lj-button>
        
        <!-- Error Intent -->
        <strong>Error</strong>
        <lj-button variant="primary" intent="error" size="sm">Error</lj-button>
        <lj-button variant="secondary" intent="error" size="sm">Error</lj-button>
        <lj-button variant="tertiary" intent="error" size="sm">Error</lj-button>
        <lj-button variant="ghost" intent="error" size="sm">Error</lj-button>
        <lj-button variant="icon" intent="error" size="sm" ariaLabel="Error">
            <mat-icon>error</mat-icon>
        </lj-button>
        
        <!-- Neutral Intent -->
        <strong>Neutral</strong>
        <lj-button variant="primary" intent="neutral" size="sm">Neutral</lj-button>
        <lj-button variant="secondary" intent="neutral" size="sm">Neutral</lj-button>
        <lj-button variant="tertiary" intent="neutral" size="sm">Neutral</lj-button>
        <lj-button variant="ghost" intent="neutral" size="sm">Neutral</lj-button>
        <lj-button variant="icon" intent="neutral" size="sm" ariaLabel="Neutral">
            <mat-icon>circle</mat-icon>
        </lj-button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive grid showing all variant and intent combinations.',
      },
    },
  },
};

// =============================================================================
// PLAYGROUND
// =============================================================================

export const Playground: Story = {
  args: {
    variant: 'primary',
    intent: 'brand',
    size: 'md',
    disabled: false,
    loading: false,
    beforeIcon: '',
    afterIcon: '',
    compact: false,
    fluid: false,
    routerLink: null,
    href: '',
  },
  render: args => ({
    props: args,
    template: `
      <lj-button
        [variant]="variant"
        [intent]="intent"
        [size]="size"
        [type]="type"
        [align]="align"
        [disabled]="disabled"
        [loading]="loading"
        [compact]="compact"
        [fluid]="fluid"
        [beforeIcon]="beforeIcon"
        [afterIcon]="afterIcon"
        [href]="href"
        [target]="target"
        [routerLink]="routerLink"
        [queryParams]="queryParams"
        [fragment]="fragment"
        [ariaLabel]="ariaLabel"
        [ariaDescribedBy]="ariaDescribedBy"
        (click)="handleClick($event)">
        {{ loading ? 'Loading...' : 'Button Text' }}
      </lj-button>
    `,
    methods: {
      handleClick: (event: MouseEvent) => {
        // eslint-disable-next-line no-console
        console.log('Button clicked in playground!', event);
      },
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground to test all button properties and combinations.',
      },
    },
  },
};

// =============================================================================
// REAL WORLD EXAMPLES
// =============================================================================

export const RealWorldExamples: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 32px;">
        <!-- Form Actions -->
        <div>
          <h3>Form Actions</h3>
          <div style="display: flex; gap: 12px; justify-content: flex-end; padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <lj-button variant="ghost" type="button">Cancel</lj-button>
            <lj-button variant="secondary" type="button">Save Draft</lj-button>
            <lj-button variant="primary" type="submit" beforeIcon="send">Submit</lj-button>
          </div>
        </div>
        
        <!-- Navigation Bar -->
        <div>
          <h3>Navigation Bar</h3>
          <div style="display: flex; gap: 8px; align-items: center; padding: 12px 16px; background: #f5f5f5; border-radius: 8px;">
            <lj-button variant="ghost" routerLink="/dashboard" beforeIcon="home">Dashboard</lj-button>
            <lj-button variant="ghost" routerLink="/users">Users</lj-button>
            <lj-button variant="ghost" routerLink="/settings">Settings</lj-button>
            <div style="margin-left: auto; display: flex; gap: 8px;">
              <lj-button variant="icon" ariaLabel="Notifications">
                <mat-icon>notifications</mat-icon>
              </lj-button>
              <lj-button variant="icon" ariaLabel="Profile Menu">
                <mat-icon>account_circle</mat-icon>
              </lj-button>
            </div>
          </div>
        </div>
        
        <!-- Data Table Actions -->
        <div>
          <h3>Data Table Actions</h3>
          <div style="display: flex; gap: 8px; align-items: center; padding: 12px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <lj-button variant="primary" size="sm" beforeIcon="add">Add New</lj-button>
            <lj-button variant="secondary" size="sm" beforeIcon="upload">Import</lj-button>
            <lj-button variant="ghost" size="sm" beforeIcon="download">Export</lj-button>
            <div style="margin-left: auto; display: flex; gap: 4px;">
              <lj-button variant="icon" size="sm" ariaLabel="Edit Selected">
                <mat-icon>edit</mat-icon>
              </lj-button>
              <lj-button variant="icon" size="sm" intent="error" ariaLabel="Delete Selected">
                <mat-icon>delete</mat-icon>
              </lj-button>
            </div>
          </div>
        </div>
        
        <!-- Loading States -->
        <div>
          <h3>Loading States</h3>
          <div style="display: flex; gap: 12px; align-items: center; padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <lj-button [loading]="true" variant="primary">Saving...</lj-button>
            <lj-button [loading]="true" variant="secondary" beforeIcon="sync">Syncing</lj-button>
            <lj-button [loading]="true" variant="icon" ariaLabel="Refreshing">
                <mat-icon>refresh</mat-icon>
            </lj-button>
          </div>
        </div>
        
        <!-- Social Actions -->
        <div>
          <h3>Social Actions</h3>
          <div style="display: flex; gap: 8px; align-items: center; padding: 16px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <lj-button variant="icon" ariaLabel="Like" size="sm">
                <mat-icon>thumb_up</mat-icon>
            </lj-button>
            <lj-button variant="icon" ariaLabel="Share" size="sm">
                <mat-icon>share</mat-icon>
            </lj-button>
            <lj-button variant="icon" ariaLabel="Bookmark" size="sm">
                <mat-icon>bookmark</mat-icon>
            </lj-button>
            <lj-button variant="ghost" size="sm">Comment</lj-button>
            <lj-button variant="secondary" size="sm" beforeIcon="send">Share</lj-button>
          </div>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Real-world usage examples showing common button patterns and layouts.',
      },
    },
  },
};
