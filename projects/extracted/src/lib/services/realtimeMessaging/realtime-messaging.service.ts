import { Injectable, inject } from '@angular/core';
import { ApiService, ServiceConfiguration } from '../api/api.service';
import { IAMService } from '../identity/iam.service';
import { generateRandomIntFromRange } from '../../utils/numberUtil';
import { Subject } from 'rxjs';
import { Queue } from '../../types/queues';

export enum RealtimeActions {
  REFRESH = 'REFRESH',
  WATCH = 'WATCH',
  UNWATCH = 'UNWATCH',
}

export enum WatchedEntities {
  TEMPLATE = 'TEMPLATE',
  REQUEST = 'REQUEST',
  DISCUSSION = 'DISCUSSION',
  USER = 'USER',
  GROUP = 'GROUP',
  DATA = 'DATA',
}

export interface RealtimeMessage {
  action: RealtimeActions;
  entity?: WatchedEntities;
  watched_resource_id: string;
}

export enum WebSocketExitCodes {
  OK = 1000,
  RECONNECT = 3000,
  DO_NOT_RECONNECT = 4000,
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeMessagingService {
  private apiService = inject(ApiService);
  private iamService = inject(IAMService);

  private serviceConfiguration: ServiceConfiguration;
  private offlineQueue: Queue<RealtimeMessage> = new Queue<RealtimeMessage>();
  private errorCount = 0;

  protected socket: WebSocket | undefined = undefined;
  readonly messages = new Subject<RealtimeMessage>();

  constructor() {
    this.serviceConfiguration =
      this.apiService.getEnvironmentConfiguration().APIs.Messaging;
    this.connect();
  }

  private onSocketOpen(_event: Event, context: RealtimeMessagingService) {
    // eslint-disable-next-line no-console
    console.info('Realtime messaging service connected.');

    context.processOfflineQueue();
  }

  private onSocketError(event: unknown, context: RealtimeMessagingService) {
    context.errorCount++;

    if (!context.socket) {
      return;
    }

    if (
      ![WebSocket.OPEN as number, WebSocket.CONNECTING as number].includes(
        context.socket.readyState
      ) &&
      context.errorCount <= 3
    ) {
      console.error(event);

      setTimeout(
        () => {
          context.connect();
        },
        generateRandomIntFromRange(1000, 5000)
      );
    }

    if (
      context.socket.readyState === WebSocket.OPEN &&
      context.errorCount > 3
    ) {
      context.socket.close(
        WebSocketExitCodes.DO_NOT_RECONNECT,
        'Closing the socket because too many errors happened.'
      );
    }
  }

  private onSocketClose(event: CloseEvent, _: RealtimeMessagingService) {
    // eslint-disable-next-line no-console
    console.info(
      `Realtime messaging service disconnected with code ${event.code}.`
    );
  }

  private onSocketMessage(
    event: MessageEvent,
    _context: RealtimeMessagingService
  ) {
    const message: RealtimeMessage = JSON.parse(event.data as string);
    this.messages.next(message);
  }

  private configureSocket() {
    if (!this.socket) {
      console.error('Unable to configure socket because socket is undefined.');
      return;
    }

    this.socket.onopen = (event: Event) => this.onSocketOpen(event, this);
    this.socket.onerror = (event: unknown) => this.onSocketError(event, this);
    this.socket.onmessage = (event: MessageEvent) =>
      this.onSocketMessage(event, this);
    this.socket.onclose = (event: CloseEvent) =>
      this.onSocketClose(event, this);
  }

  protected processOfflineQueue() {
    if (this.offlineQueue.getLength() > 0) {
      let message: RealtimeMessage | undefined = this.offlineQueue.shift();

      while (message) {
        this.sendMessage(message);
        message = this.offlineQueue.shift();
      }
    }
  }

  public connect() {
    if (
      this.socket &&
      [WebSocket.OPEN as number, WebSocket.CONNECTING as number].includes(
        this.socket.readyState
      )
    ) {
      return;
    }

    const connectionUrl = `${this.serviceConfiguration.getBaseServiceUrl(true)}?token=${this.iamService.getToken()}`;
    this.socket = new WebSocket(connectionUrl);
    this.configureSocket();
  }

  public sendMessage(message: RealtimeMessage) {
    if (
      !this.socket ||
      [
        WebSocket.CLOSED as number,
        WebSocket.CLOSING as number,
        WebSocket.CONNECTING as number,
      ].includes(this.socket.readyState)
    ) {
      this.offlineQueue.push(message);
    } else {
      this.socket.send(JSON.stringify(message));
    }
  }

  public disconnect() {
    this.errorCount = 0;

    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
      return;
    }

    this.socket.close(
      WebSocketExitCodes.OK,
      'The socket was closed by the realtime messaging service'
    );
  }
}
