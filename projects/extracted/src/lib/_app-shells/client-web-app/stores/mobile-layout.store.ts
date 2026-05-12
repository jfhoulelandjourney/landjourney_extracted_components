import {
  updateState,
  withDevtools,
  withDevToolsStub,
  withGlitchTracking,
} from '@angular-architects/ngrx-toolkit';
import { computed, isDevMode } from '@angular/core';
import {
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { withMobileLayoutBase } from 'common';
import type { CollaboratorState } from '../components/mobile-top-bar/mobile-top-bar.model';

type ClientMobileLayoutState = {
  collaboratorState: CollaboratorState;
  collaboratorPanelEntitiesCount: number;
  actionButtonsInPanelCount: number;
};

const initialState: ClientMobileLayoutState = {
  collaboratorState: 'hidden',
  collaboratorPanelEntitiesCount: 0,
  actionButtonsInPanelCount: 0,
};

const devtools = isDevMode()
  ? withDevtools('mobileLayout', withGlitchTracking())
  : withDevToolsStub('mobileLayout');

export const MobileLayoutStore = signalStore(
  { providedIn: 'root' },
  devtools,
  withMobileLayoutBase(),
  withState(initialState),
  withComputed(store => ({
    collaboratorsOpen: computed(() => store.collaboratorState() === 'open'),
  })),
  withMethods(store => ({
    setCollaboratorState(collaboratorState: CollaboratorState): void {
      updateState(store, '[MobileLayout] Set Collaborator State', {
        collaboratorState,
      });
    },
    toggleCollaborators(): void {
      updateState(store, '[MobileLayout] Toggle Collaborators', {
        collaboratorState: (store.collaboratorState() === 'open'
          ? 'compact'
          : 'open') as CollaboratorState,
      });
    },
    setCollaboratorPanelEntitiesCount(
      collaboratorPanelEntitiesCount: number
    ): void {
      updateState(store, '[MobileLayout] Set Panel Entities Count', {
        collaboratorPanelEntitiesCount,
      });
    },
    setActionButtonsInPanelCount(actionButtonsInPanelCount: number): void {
      updateState(store, '[MobileLayout] Set Action Buttons In Panel Count', {
        actionButtonsInPanelCount,
      });
    },
  }))
);
