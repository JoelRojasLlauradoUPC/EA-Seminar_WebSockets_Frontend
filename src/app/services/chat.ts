import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

export interface Mensaje {
  usuario: any; // Can be ID string or populated object { _id: string, name: string }
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

  constructor(private http: HttpClient) {
    this.socket = io(this.SERVER_URL);
  }

  /**
   * Obtener historial completo de mensajes (REST)
   */
  getHistory(): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.SERVER_URL}/mensajes`);
  }

  /**
   * Unirse a una organización (sala de chat)
   */
  joinOrganization(organizacionId: string): void {
    this.socket.emit('join-organization', organizacionId);
  }

  /**
   * Enviar un mensaje
   */
  sendMessage(mensaje: Mensaje): void {
    this.socket.emit('message', mensaje);
  }

  /**
   * Escuchar nuevos mensajes entrantes
   */
  getMessages(): Observable<Mensaje> {
    return new Observable((observer) => {
      this.socket.on('message', (data: Mensaje) => {
        observer.next(data);
      });
    });
  }

  /**
   * Desconectarse del socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
