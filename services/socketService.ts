// Socket.IO service stub — swap TODO comments for real io() calls when backend is ready
// TODO: import { io, Socket } from 'socket.io-client';
// TODO: const SERVER_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? '';

type EventHandler = (data: any) => void;

const handlers = new Map<string, EventHandler[]>();
let connected = false;

export function connect(): void {
  // TODO: socket = io(SERVER_URL, { transports: ['websocket'], autoConnect: true });
  // TODO: socket.on('connect', () => { connected = true; notifyHandlers('$connect', null); });
  // TODO: socket.on('disconnect', () => { connected = false; notifyHandlers('$disconnect', null); });
  connected = true;
}

export function disconnect(): void {
  // TODO: socket?.disconnect();
  connected = false;
}

export function isConnected(): boolean {
  return connected;
}

export function emit(event: string, data?: any): void {
  // TODO: socket?.emit(event, data);
}

export function on(event: string, handler: EventHandler): () => void {
  if (!handlers.has(event)) handlers.set(event, []);
  handlers.get(event)!.push(handler);

  return () => {
    const arr = handlers.get(event) ?? [];
    const idx = arr.indexOf(handler);
    if (idx > -1) arr.splice(idx, 1);
  };
}