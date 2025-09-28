import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { AccountService } from "../../authentication/services/account.service";
import Notiflix from "notiflix";

declare var bootstrap: any; // 👈 necesario para controlar el modal de Bootstrap

@Component({
  selector: 'app-user-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-admin.component.html',
  styleUrls: ['./user-admin.component.scss']
})
export class UserAdminComponent implements OnInit {
  isConsumirOpen = false;
  users: any[] = [];
  filteredUsers: any[] = [];
  searchTerm: string = '';
  consumirForm!: FormGroup;
  selectedUser: any;
  pageSize = 6;
  currentPage = 1;
  newUser = {
    name: '',
    telefono: '',
    role: 'Cliente'
  };

  constructor(private accountService: AccountService,
              private fb: FormBuilder) {}

  ngOnInit(): void {
    this.loadUsers();

    // Inicializar formulario de consumo
    this.consumirForm = this.fb.group({
      venta: [0, [Validators.required, Validators.min(0)]],
      diferencia: [{ value: 0, disabled: true }],
      efectivo: [0, [Validators.min(0)]],
    });
  }
  private round2(n: number) { return Number((n ?? 0).toFixed(2)); }
  loadUsers(): void {
    this.accountService.getAllUsers().subscribe({
      next: (data: any[]) => {
        this.users = data;
        this.filteredUsers = [...this.users];
      },
      error: (err: any) => {
        console.error('❌ Error al cargar usuarios', err);
      }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredUsers = !term
      ? [...this.users]
      : this.users.filter(user =>
        (user.name?.toLowerCase() ?? '').includes(term)
      );
    this.currentPage = 1;
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

    Notiflix.Loading.hourglass('Creando usuario...');

    this.accountService.createUser(this.newUser.name, this.newUser.telefono, this.newUser.role)
      .subscribe({
        next: (response) => {
          Notiflix.Loading.remove();
          const username = response.username;
          const name = response.name;
          Notiflix.Report.success(
            'Usuario creado',
            `<br> USERNAME: <span style="color:#28a745; font-weight:bold;">${username}</span>`,
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

  // 🔹 Abrir modal consumir
  abrirConsumirModal(user: any): void {
    const balance = Number(user?.altec_Points ?? 0);
    if (!isFinite(balance) || balance <= 0) {
      Notiflix.Report.warning(
        'Sin balance',
        `<b>${user?.name ?? user?.name ?? 'Este usuario'}</b> no tiene balance disponible.`,
        'Cerrar'
      );
      return; // ⛔ no abrir modal
    }
    this.selectedUser = user;
    this.consumirForm.reset({ venta: 0, diferencia: 0 });
    const modal = new bootstrap.Modal(document.getElementById('consumirModal'));
    modal.show();
  }

  calcularDiferencia() {
    const venta = Number(this.consumirForm.get('venta')?.value || 0);
    const acumulados = Number(this.selectedUser?.altec_Points ?? 0);
    const dif = venta < acumulados ? 0 : this.round2(venta - acumulados);
    this.consumirForm.patchValue({ diferencia: dif }, { emitEvent: false });
  }

  confirmarCompra() {
    const venta = Number(this.consumirForm.get('venta')?.value || 0);
    const acumulados = Number(this.selectedUser?.altec_Points ?? 0);
    if (venta < acumulados) {
      Notiflix.Report.failure('Error','La venta no puede ser menor a los puntos acumulados.','Cerrar');
      return;
    }

    const diferencia = this.round2(venta - acumulados);
    const saldo = this.round2(diferencia / 15);
    this.accountService.resetAndAddBalance(this.selectedUser.username, saldo).subscribe({
      next: (res: { altec_Points: number }) => {
        Notiflix.Loading.remove();

        Notiflix.Report.success(
          'Compra realizada',
          `Se acreditaron $${saldo.toFixed(2)} a <b>${this.selectedUser.username}</b>.`,
          'Aceptar',
          () => {
            // 🧹 limpiar formulario del modal
            this.consumirForm.reset(); // limpia estados
            // asegurar valores en 0 (incluye el disabled)
            this.consumirForm.get('venta')?.setValue(0, { emitEvent: false });
            this.consumirForm.get('diferencia')?.setValue(0, { emitEvent: false });
            this.consumirForm.markAsPristine();
            this.consumirForm.markAsUntouched();

            // actualizar datos
            this.selectedUser.altec_Points = res.altec_Points ?? 0;
            this.loadUsers();
          }
        );
      },
      error: () => {
        Notiflix.Loading.remove();
        Notiflix.Report.failure('Error', 'No se pudo procesar la compra.', 'Cerrar');
      }
    });

  }

  onEfectivoInput() {
    const val = Number(this.consumirForm.get('efectivo')?.value || 0);
    this.consumirForm.get('efectivo')?.setValue(this.round2(val), { emitEvent: false });
  }
  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.pageSize);
  }
}
