import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { Invoice } from '../../models/invoice.model';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-invoice-preview',
  templateUrl: './invoice.preview.component.html',
  styleUrl: './invoice.preview.component.css'
})

export class InvoicePreviewComponent implements OnInit {
  invoice?: Invoice;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private invoiceService: InvoiceService,
    private router: Router
  ) {}

ngOnInit(): void {
  const id = Number(this.route.snapshot.paramMap.get('id'));
  this.invoiceService.getInvoiceById(id).subscribe({
    next: (data) => {
      console.log('Invoice data:', data); // Check what is received
      this.invoice = data;
      this.loading = false;
    },
    error: (err) => {
      console.error('Error loading invoice:', err);
      this.loading = false;
    }
  });
}


  printInvoice(): void {
  window.print();
}

goBack(): void {
  this.router.navigate(['']);  // Navigates to home page ('' route)
}
}
