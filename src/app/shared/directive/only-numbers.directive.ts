import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appOnlyNumbers]'
})
export class OnlyNumbersDirective {

  constructor(private el: ElementRef) { }

  // Permitir solo números y el punto decimal
  @HostListener('input', ['$event'])
  onInput(event: KeyboardEvent): void {
    // Reemplazar todo lo que no sea número o punto decimal
    const inputValue = this.el.nativeElement.value;

    // Expresión regular que solo permite números y un punto decimal
    const validValue = inputValue.replace(/[^0-9.]/g, '');

    // Asignamos el valor filtrado al input
    this.el.nativeElement.value = validValue;
  }

  // Manejar la tecla presionada para evitar valores no deseados
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Permite las teclas de retroceso y borrar, así como las teclas de dirección
    if (
      event.key === 'Backspace' ||
      event.key === 'Tab' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight'
    ) {
      return;
    }

    // Permite el punto decimal, pero solo una vez
    if (event.key === '.' && !this.el.nativeElement.value.includes('.')) {
      return;
    }

    // Previene cualquier otro carácter que no sea numérico o punto decimal
    if (/[^0-9.]/.test(event.key)) {
      event.preventDefault();
    }
  }
}
