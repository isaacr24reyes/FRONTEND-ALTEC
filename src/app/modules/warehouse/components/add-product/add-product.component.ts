import { Component } from '@angular/core';
import {UntypedFormGroup} from "@angular/forms";
import Notiflix from 'notiflix';
@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.scss'
})
export class AddProductComponent {
  public formGroup!: UntypedFormGroup;
  imagePreview: string | null = null;

  onSubmit() {

  }
  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput?.files?.[0]) {
      const file = fileInput.files[0];
      const allowedTypes = ['image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        // Mostrar el alert con Notiflix
        Notiflix.Notify.failure('Solo se permiten archivos JPG y PNG');
        fileInput.value = '';
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };

      reader.readAsDataURL(file);
    }
  }
}
