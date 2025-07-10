import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { InvoiceService } from '../../../services/invoice.service';
import { InvoiceCreateRequest, InvoiceItemCreateRequest } from '../../../models/invoice.model';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';


@Component({
  standalone: true,
  selector: 'app-invoice-form.component',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './invoice-form.component.html',
  styleUrl: './invoice-form.component.css'
})
export class InvoiceFormComponent implements OnInit {
  invoiceForm: FormGroup;
  isSubmitting = false;
  submitMessage = '';
  submitError = '';

  constructor(
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private router: Router 
  ) {
    this.invoiceForm = this.createInvoiceForm();
  }

  ngOnInit(): void {
    this.addInvoiceItem(); // Add one item by default
  }

  private createInvoiceForm(): FormGroup {
    return this.fb.group({
      transactionDate: [new Date().toISOString().split('T')[0], Validators.required],
      customerName: ['', [Validators.required, Validators.maxLength(100)]],
      customerEmail: ['', [Validators.email, Validators.maxLength(200)]],
      customerPhone: ['', [Validators.maxLength(15)]],
      discount: [0, [Validators.min(0)]],
      items: this.fb.array([])
    });
  }

  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  private createInvoiceItemForm(): FormGroup {
    return this.fb.group({
      productName: ['', [Validators.required, Validators.maxLength(100)]],
      productDescription: ['', [Validators.maxLength(500)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0.01)]]
    });
  }

  addInvoiceItem(): void {
    this.items.push(this.createInvoiceItemForm());
  }

  removeInvoiceItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  calculateItemTotal(index: number): number {
    const item = this.items.at(index);
    const quantity = item.get('quantity')?.value || 0;
    const unitPrice = item.get('unitPrice')?.value || 0;
    return quantity * unitPrice;
  }

  calculateSubtotal(): number {
    let subtotal = 0;
    for (let i = 0; i < this.items.length; i++) {
      subtotal += this.calculateItemTotal(i);
    }
    return subtotal;
  }

  calculateTotal(): number {
    const subtotal = this.calculateSubtotal();
    const discount = this.invoiceForm.get('discount')?.value || 0;
    return Math.max(0, subtotal - discount);
  }

  onSubmit(): void {
    if (this.invoiceForm.valid) {
      this.isSubmitting = true;
      this.submitMessage = '';
      this.submitError = '';

      const formValue = this.invoiceForm.value;
      const invoiceRequest: InvoiceCreateRequest = {
        transactionDate: new Date(formValue.transactionDate),
        customerName: formValue.customerName,
        customerEmail: formValue.customerEmail || '',
        customerPhone: formValue.customerPhone || '',
        discount: formValue.discount || 0,
        items: formValue.items.map((item: any) => ({
          productName: item.productName,
          productDescription: item.productDescription || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice
        }))
      };

      this.invoiceService.createInvoice(invoiceRequest).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.submitMessage = `Invoice created successfully! Invoice ID: ${response.invoiceId}`;

          this.router.navigate(['/invoice-preview', response.invoiceId])
    .then(success => console.log('Navigation success?', success))
    .catch(err => console.error('Navigation error:', err));

          this.resetForm();
        },
        error: (error) => {
          this.isSubmitting = false;
          const backendMessage =
            error?.error?.message ||
            error?.message ||
            'An unexpected error occurred while creating the invoice.';
          this.submitError = backendMessage;
          console.error('Invoice Service Error:', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }


  private resetForm(): void {
    this.invoiceForm.reset();
    this.items.clear();
    this.addInvoiceItem();
    this.invoiceForm.patchValue({
      transactionDate: new Date().toISOString().split('T')[0],
      discount: 0
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.invoiceForm.controls).forEach(key => {
      const control = this.invoiceForm.get(key);
      control?.markAsTouched();
    });

    this.items.controls.forEach(itemControl => {
      Object.keys(itemControl.value).forEach(key => {
        const control = itemControl.get(key);
        control?.markAsTouched();
      });
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.invoiceForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isItemFieldInvalid(index: number, fieldName: string): boolean {
    const field = this.items.at(index).get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.invoiceForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['maxlength']) return `${fieldName} is too long`;
      if (field.errors['min']) return `${fieldName} must be greater than or equal to ${field.errors['min'].min}`;
    }
    return '';
  }

  getItemFieldError(index: number, fieldName: string): string {
    const field = this.items.at(index).get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['min']) return `${fieldName} must be greater than ${field.errors['min'].min}`;
      if (field.errors['maxlength']) return `${fieldName} is too long`;
    }
    return '';
  }
}
