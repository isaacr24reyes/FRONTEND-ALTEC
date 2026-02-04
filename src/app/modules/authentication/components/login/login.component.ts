import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ApplicationBase } from '../../../utils/base/application.base';
import {R_DASHBOARD, R_STORE} from '../../../../constants/route.constants';
import Notiflix from 'notiflix';
import { AccountService } from '../../services/account.service';
import { UserSessionService } from '../../services/user-session.service';
import {LoaderService} from "../../../../shared/services/LoaderService";
import {CartService} from "../../../../shared/services/CartService"; // Importa el servicio

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent extends ApplicationBase implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('neuronCanvas') neuronCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('loginContainer') loginContainer!: ElementRef<HTMLDivElement>;

  disableGuestButton = false;
  public formGroup!: UntypedFormGroup;
  isLoading: boolean = false;

  private animationId: number | null = null;
  private neurons: Neuron[] = [];
  private mouse = { x: 0, y: 0 };

  constructor(
    private _fb: UntypedFormBuilder,
    private _router: Router,
    private _accountService: AccountService,
    private _userSessionService: UserSessionService,
    private loaderService:LoaderService,
    private cartService: CartService,

  ) {
    super();
  }

  ngOnInit() {

    this.formGroup = this._fb.group({
      username: [null, Validators.compose([Validators.required])],
      password: [null, Validators.compose([Validators.required])]
    });
    this.formGroup.valueChanges.subscribe(() => {
      const { username, password } = this.formGroup.value;
      this.disableGuestButton = !!(username || password);
    });
  }

  ngAfterViewInit() {
    this.initNeuronNetwork();
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private initNeuronNetwork() {
    const canvas = this.neuronCanvas.nativeElement;
    const container = this.loginContainer.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Configurar tamaño del canvas (toda la pantalla)
    const resizeCanvas = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Crear neuronas (más neuronas porque ahora es un área más grande)
    const neuronCount = 40;
    for (let i = 0; i < neuronCount; i++) {
      this.neurons.push(new Neuron(canvas.width, canvas.height));
    }

    // Evento de mouse en todo el contenedor
    container.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    // Animación
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Actualizar y dibujar neuronas
      this.neurons.forEach(neuron => {
        neuron.update(this.mouse);
        neuron.draw(ctx);
      });

      // Dibujar conexiones entre neuronas cercanas
      this.drawConnections(ctx);

      this.animationId = requestAnimationFrame(animate);
    };

    animate();
  }

  private drawConnections(ctx: CanvasRenderingContext2D) {
    const maxDistance = 120;

    for (let i = 0; i < this.neurons.length; i++) {
      for (let j = i + 1; j < this.neurons.length; j++) {
        const dx = this.neurons[i].x - this.neurons[j].x;
        const dy = this.neurons[i].y - this.neurons[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance) {
          const opacity = (1 - distance / maxDistance) * 0.3;
          ctx.strokeStyle = `rgba(10, 102, 194, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(this.neurons[i].x, this.neurons[i].y);
          ctx.lineTo(this.neurons[j].x, this.neurons[j].y);
          ctx.stroke();
        }
      }
    }
  }

  public login(): void {
    if (this.formGroup.invalid) {
      Notiflix.Notify.failure('Por favor, complete todos los campos.');
      return;
    }

    const { username, password } = this.formGroup.value;

    this.isLoading = true;
    Notiflix.Loading.circle('Autenticando...');

    this._accountService.login(username, password).subscribe({
      next: (response: { token: string }) => {
        sessionStorage.setItem('token', response.token);
        Notiflix.Notify.success('Inicio de sesión exitoso.');

        this._accountService.getUserInfo(username).subscribe({
          next: (userInfo) => {
            console.log('Información del usuario:', userInfo);
            this._userSessionService.setUserInfo(userInfo);

            const role = userInfo?.role;
            const isDistribuidor = role === 'Distribuidor';
            const isCliente = role === 'Cliente';

            sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
            sessionStorage.setItem('isDistribuidor', isDistribuidor ? 'true' : 'false');

            this.cartService.switchScope();

            // 🔁 Redirección según el rol
            if (role === 'Distribuidor' || role === 'Cliente') {
              this._router.navigate([R_STORE]);
            } else {
              this._router.navigate([R_DASHBOARD]);
            }
          },
          error: (err) => {
            console.error('Error obteniendo info del usuario:', err);
            this.isLoading = false;
          }
        });
      },
      error: (error: any) => {
        Notiflix.Notify.failure('Error de autenticación. Verifique sus credenciales.');
        console.error('Error en login:', error);
        this.isLoading = false;
        Notiflix.Loading.remove();
      },
      complete: () => {
        this.isLoading = false;
        Notiflix.Loading.remove();
      }
    });
  }


  goToStore() {
    sessionStorage.setItem('isExternal', 'true');
    this.loaderService.start();

    this._router.navigate([`/${R_STORE}`]);
  }
  goToLanding(): void {
    this._router.navigate(['/']);
  }
  return() {
    this.loaderService.start();
    this._router.navigate([`/${R_STORE}`]);
  }

  onSubmit() {
  }
}

// 🧠 Clase Neuron para el efecto de red neuronal
class Neuron {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseX: number;
  baseY: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.baseX = this.x;
    this.baseY = this.y;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.radius = Math.random() * 2 + 1;
  }

  update(mouse: { x: number; y: number }) {
    // Movimiento base
    this.x += this.vx;
    this.y += this.vy;

    // Atracción al mouse
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 150;

    if (distance < maxDistance) {
      const force = (1 - distance / maxDistance) * 2;
      this.x += dx * force * 0.02;
      this.y += dy * force * 0.02;
    }

    // Retorno suave a la posición base
    this.x += (this.baseX - this.x) * 0.02;
    this.y += (this.baseY - this.y) * 0.02;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'rgba(10, 102, 194, 0.6)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(10, 102, 194, 0.8)';
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

