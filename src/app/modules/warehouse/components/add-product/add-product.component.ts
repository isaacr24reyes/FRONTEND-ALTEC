import { Component } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import Notiflix, {Loading} from 'notiflix';
import { ProductService } from '../../services/warehouse.service';
import {UserSessionService} from "../../../authentication/services/user-session.service";

// Asegúrate de importar el servicio

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.scss']
})

export class AddProductComponent {
  public formGroup!: UntypedFormGroup;
  selectedFile!: File | null;
  imagePreview: string | ArrayBuffer | null = null;
  userName: string = '';

  constructor(private fb: FormBuilder, private productService: ProductService, private userSessionService: UserSessionService) {
    this.formGroup = this.fb.group({
      productCategory: ['', Validators.required],
      productCode: ['', Validators.required],
      productStock: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      productPvp: ['', [Validators.required, Validators.pattern('^[0-9]+([.,][0-9]{1,2})?$')]],
      productMp: ['', [Validators.required, Validators.pattern('^[0-9]+([.,][0-9]{1,2})?$')]],
      productPi: ['', [Validators.required, Validators.pattern('^[0-9]+([.,][0-9]{1,2})?$')]],
      productDescription: ['', Validators.required],
      productImage: [null]
    });

    this.userSessionService.getUserInfo().subscribe(userInfo => {
      if (userInfo) {
        this.userName = userInfo.name;
      }
    });
  }

  onSubmit() {
    if (this.formGroup.invalid) {
      Notiflix.Notify.failure('Por favor, completa todos los campos requeridos correctamente.');
      return;
    }

    Notiflix.Confirm.show(
      'Confirmación',
      '¿Estás seguro de que deseas subir este producto?',
      'Sí',
      'No',
      () => {
        Notiflix.Loading.arrows('Subiendo producto...');
        const formData = this.formGroup.value;

        // Comprobar si se seleccionó un archivo, si no, asignar "NOT-IMAGE"
        const fileToSend = this.selectedFile ?? null;  // Si no hay archivo, se asigna null
        const formDataToSend = new FormData();

        // Si hay archivo, se agrega a FormData
        if (fileToSend) {
          formDataToSend.append('Foto', fileToSend, fileToSend.name);
        } else {
          formDataToSend.append('Foto', 'NOT-IMAGE');
        }

        const normalizedPvp = formData.productPvp.replace('.', ',');
        const normalizedMp = formData.productMp.replace('.', ',');
        const normalizedPi = formData.productPi.replace('.', ',');

        formDataToSend.append('Pvp', normalizedPvp);
        formDataToSend.append('Descripcion', formData.productDescription);
        formDataToSend.append('Categoria', formData.productCategory);
        formDataToSend.append('Stock', formData.productStock);
        formDataToSend.append('PrecioMayorista', normalizedMp);
        formDataToSend.append('Codigo', formData.productCode);
        formDataToSend.append('PrecioImportacion', normalizedPi);
        formDataToSend.append('CreatedBy', this.userName);

        this.productService.createProduct(formDataToSend).subscribe(response => {
          console.log('Producto creado:', response);
          setTimeout(() => {
            Notiflix.Loading.remove();
            Notiflix.Notify.success('¡Producto subido exitosamente!');
            this.formGroup.reset();
            this.selectedFile = null;
            this.imagePreview = null;
          }, 2000);
        }, error => {
          Notiflix.Loading.remove();
          Notiflix.Notify.failure('Error al subir el producto.');
        });
      },
      () => {
        Notiflix.Notify.info('Carga cancelada.');
      }
    );
  }

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput?.files?.[0]) {
      const file = fileInput.files[0];
      const allowedTypes = ['image/jpeg', 'image/png'];

      if (!allowedTypes.includes(file.type)) {
        Notiflix.Notify.failure('Solo se permiten archivos JPG y PNG');
        fileInput.value = '';
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onloadend = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }
}
