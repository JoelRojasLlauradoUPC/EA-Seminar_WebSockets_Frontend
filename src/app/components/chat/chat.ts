import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chat, Mensaje } from '../../services/chat';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class ChatComponent implements OnInit, OnDestroy {
  public usuarioActivo: string = ''; 
  public usuarioActivoName: string = '';
  public organizacionActiva: string = '';
  public organizacionActivaName: string = '';
  
  public nuevoMensaje: string = '';
  public mensajes: Mensaje[] = [];
  
  private messageSub!: Subscription;

  constructor(private chatService: Chat, private router: Router) {}

  ngOnInit(): void {
    // Cargar datos de la sesión
    if (typeof window !== 'undefined' && window.sessionStorage) {
      this.usuarioActivo = sessionStorage.getItem('chat_user_id') || '';
      this.usuarioActivoName = sessionStorage.getItem('chat_user_name') || '';
      this.organizacionActiva = sessionStorage.getItem('chat_org_id') || '';
      this.organizacionActivaName = sessionStorage.getItem('chat_org_name') || '';
    }

    if (!this.usuarioActivo || !this.organizacionActiva) {
      // Si no está registrado, lo devolvemos al login
      this.router.navigate(['/login']);
      return;
    }

    // 0. Cargar historial de mensajes globales
    this.chatService.getHistory().subscribe((history: Mensaje[]) => {
      this.mensajes = history;
      this.scrollToBottom();
    });

    // 1. Unirse a la sala (opcional ahora que es global, pero lo dejamos por si acaso)
    this.chatService.joinOrganization(this.organizacionActiva);

    // 2. Escuchar mensajes entrantes
    this.messageSub = this.chatService.getMessages().subscribe((mensaje: Mensaje) => {
      this.mensajes.push(mensaje);
      this.scrollToBottom();
    });
  }

  ngOnDestroy(): void {
    if (this.messageSub) {
      this.messageSub.unsubscribe();
    }
    this.chatService.disconnect();
  }

  enviarMensaje(): void {
    if (!this.nuevoMensaje.trim()) return;

    const mensaje: Mensaje = {
      usuario: this.usuarioActivo,
      organizacion: this.organizacionActiva,
      contenido: this.nuevoMensaje
    };

    // Emitir al backend
    this.chatService.sendMessage(mensaje);
    
    // Limpiar input
    this.nuevoMensaje = '';
  }

  // Helper para obtener el nombre o ID del usuario de forma segura
  getUsuarioName(usuario: any): string {
    if (typeof usuario === 'object' && usuario !== null) {
      return usuario.name || usuario._id;
    }
    return usuario;
  }

  // Helper para comparar usuarios (por id)
  esMensajeMio(mensaje: Mensaje): boolean {
    const id = typeof mensaje.usuario === 'object' ? mensaje.usuario._id : mensaje.usuario;
    return id === this.usuarioActivo;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const chatContainer = document.getElementById('chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }
}
