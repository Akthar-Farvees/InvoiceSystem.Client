import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { App } from '../app';
import { InvoiceFormComponent } from '../components/invoice-form/invoice-form.component/invoice-form.component';
import { CommonModule } from '@angular/common';


@NgModule({
  // declarations: [
  //   App,
  //   InvoiceFormComponent
  // ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    CommonModule,

    // ✅ Import standalone components here
    App,
    InvoiceFormComponent
  ],
  providers: [],
  bootstrap: [App]
})
export class AppModule { }
