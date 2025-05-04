import { FormGroup, FormBuilder } from '@angular/forms';
import {UserSessionService} from "../../../authentication/services/user-session.service";
import {Component, OnInit} from "@angular/core"; // usa FormBuilder para más claridad

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'] // ✅ correcto
})
export class HomeComponent implements OnInit {
  public formGroup!: FormGroup;
  public username: string | null = null;
  public name: string | null = null;
  public role: string | null = null;

  constructor(
    private _userSessionService: UserSessionService,
    private fb: FormBuilder // 👈 nuevo
  ) {}

  onSubmit() {
    // Tu lógica aquí (aunque no necesitas formulario si no hay inputs)
  }

  ngOnInit(): void {
    // Inicializa el formGroup vacío
    this.formGroup = this.fb.group({});

    this._userSessionService.getUserInfo().subscribe(userInfo => {
      if (userInfo) {
        this.name = userInfo.name;
        this.username = userInfo.username;
        this.role = userInfo.role;
      }
    });
  }
}
