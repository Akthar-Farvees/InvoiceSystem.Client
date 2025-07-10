import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RouterModule, Routes } from '@angular/router';
import { InvoiceFormComponent } from '../components/invoice-form/invoice-form.component/invoice-form.component';
import { InvoicePreviewComponent } from '../components/invoice-preview/invoice.preview.component';


const routes: Routes = [
  { path: '', component: InvoiceFormComponent },
  { path: 'invoice', component: InvoiceFormComponent },
  { path: 'invoice-preview/:id', component: InvoicePreviewComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
