import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Mensaje {
  usuario: any;
  organizacion: string; 
  contenido: string;
  _id?: string;
  leido?: boolean;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Chat {
  private socket: Socket;
  private readonly SERVER_URL = 'http://localhost:1337';
  private registeredUserName: string = '';
  private onlineUsersSubject = new BehaviorSubject<string[]>([]);
  public readonly onlineUsers$ = this.onlineUsersSubject.asObservable();

  constructor(private http: HttpClient) {
    this.socket = io(this.SERVER_URL);

    this.socket.on('connect', () => {
      console.log('✅ Socket conectado:', this.socket.id);
      if (this.registeredUserName) {
        this.socket.emit('register-user', this.registeredUserName);
      }
    });

    this.socket.on('disconnect', () => {
    });

    this.socket.on('user-typing', (data) => {
    });

    this.socket.on('online-users', (payload: unknown) => {
      console.log('[SOCKET] Evento online-users recibido:', payload);
      this.updateUsersFromPayload(payload);
    }); //imprimir en consola y trucar a funcio x actualitzar
  }

  registerUser(usuarioName: string): void {
    this.registeredUserName = usuarioName?.trim() || '';
    if (this.registeredUserName && this.socket.connected) {
      this.socket.emit('register-user', this.registeredUserName);
    } // validació: x evitar q es repeteixi el nom al obrir dues finestres
  }

  private updateUsersFromPayload(payload: unknown): void {
    if (Array.isArray(payload)) {
      this.onlineUsersSubject.next(this.toStringArray(payload));
      return;
    }

    if (payload && typeof payload === 'object') {
      const data = payload as Record<string, unknown>;
      const online = data['onlineUsers'] ?? data['online'] ?? data['usuariosOnline'];

      if (online !== undefined) {
        this.onlineUsersSubject.next(this.toStringArray(online));
      }
    }
  } //mostrar la llista

  private toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item: unknown) => (typeof item === 'string' ? item : String(item ?? '')))
      .filter((item: string) => item.trim().length > 0);
  }

  getHistory(): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.SERVER_URL}/mensajes`);
  }

  joinOrganization(organizacionId: string): void {
    this.socket.emit('join-organization', organizacionId);
  }

  sendMessage(mensaje: Mensaje): void {
    this.socket.emit('message', mensaje);
  }

  sendTyping(usuario: string, usuarioName: string): void {
  this.socket.emit('typing', { usuario: usuario, usuarioName: usuarioName });
  }

  stopTyping(usuario: string, usuarioName: string): void {
  this.socket.emit('stop-typing', { usuario: usuario, usuarioName: usuarioName });
  }
  onUserTyping(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('user-typing', (data) => {
        observer.next(data);
      });
    });
  }

  onUserStopTyping(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('user-stop-typing', (data) => {
        observer.next(data);
      });
    });
  }

  getMessages(): Observable<Mensaje> {
    return new Observable((observer) => {
      this.socket.on('message', (data: Mensaje) => {
        observer.next(data);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.onlineUsersSubject.next([]);
    }
  }
}
