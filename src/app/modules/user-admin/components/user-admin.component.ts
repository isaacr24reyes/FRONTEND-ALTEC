import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";
import { AccountService } from "../../authentication/services/account.service";
import Notiflix from "notiflix";

@Component({
  selector: 'app-user-admin',
  standalone: true,
  imports: [CommonModule, FormsModule], // necesario para *ngFor, *ngIf y ngModel
  templateUrl: './user-admin.component.html',
  styleUrls: ['./user-admin.component.scss']
})
export class UserAdminComponent implements OnInit {

  users: any[] = [];
  filteredUsers: any[] = [];
  searchTerm: string = '';

  pageSize = 6;
  currentPage = 1;
  newUser = {
    name: '',
    telefono: '',
    role: 'Cliente'
  };
  constructor(private accountService: AccountService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.accountService.getAllUsers().subscribe({
      next: (data: any[]) => {
        this.users = data;
        this.filteredUsers = [...this.users]; // 🔹 copiar usuarios a la lista filtrada
      },
      error: (err: any) => {
        console.error('❌ Error al cargar usuarios', err);
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredUsers = [...this.users]; // mostrar todos si buscador vacío
    } else {
      this.filteredUsers = this.users.filter(user =>
        (user.name?.toLowerCase() ?? '').includes(term)
      );
    }

    this.currentPage = 1; // reinicia a la primera página
  }
  // 🔹 Crear usuario
  createUser(): void {
    if (!this.newUser.name || !this.newUser.telefono) {
      Notiflix.Report.warning(
        'Campos requeridos',
        'Por favor ingresa <b>nombre</b> y <b>celular</b>.',
        'Entendido'
      );
      return;
    }

    // ⏳ Mostrar loading mientras se crea el usuario
    Notiflix.Loading.hourglass('Creando usuario...');

    this.accountService.createUser(this.newUser.name, this.newUser.telefono, this.newUser.role)
      .subscribe({
        next: (response) => {
          Notiflix.Loading.remove();

          const username = response.username; // ✅ backend debe devolverlo
          const name = response.name;

          Notiflix.Report.success(
            'Usuario creado',
            `<br>
             USERNAME: <span style="color:#28a745; font-weight:bold;">${username}</span>`,
            'Aceptar'
          );


          this.loadUsers();
          this.newUser = { name: '', telefono: '', role: 'Cliente' };
        },
        error: (err) => {
          Notiflix.Loading.remove();
          console.error('❌ Error al crear usuario', err);
          Notiflix.Report.failure('Error', 'No se pudo crear el usuario.', 'Cerrar');
        }
      });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.pageSize); // 🔹 usar filteredUsers
  }
}
