import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, timeout, retry } from 'rxjs/operators';
import { Invoice, InvoiceCreateRequest, ApiResponse } from '../models/invoice.model';
import { environment } from '../services/environment';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private readonly baseUrl = `${environment.apiUrl}/invoice`;
  private readonly defaultTimeout = 30000; // 30 seconds

  constructor(private http: HttpClient) { }

  /**
   * Create a new invoice
   * @param invoice Invoice creation request
   * @returns Observable of created invoice
   */
  createInvoice(invoice: InvoiceCreateRequest): Observable<Invoice> {
    const headers = this.getHeaders();

    return this.http.post<ApiResponse<Invoice>>(this.baseUrl, invoice, { headers })
      .pipe(
        timeout(this.defaultTimeout),
        retry(2), // Retry failed requests twice
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }

          // Throw a proper HttpErrorResponse to be handled downstream
          const errorResponse = new HttpErrorResponse({
            error: response,
            status: 400,
            statusText: 'Bad Request',
            url: this.baseUrl
          });

          throw errorResponse;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get invoice by ID
   * @param id Invoice ID
   * @returns Observable of invoice
   */
getInvoiceById(id: number): Observable<Invoice> {
  const headers = this.getHeaders();

  return this.http.get<Invoice>(`${this.baseUrl}/${id}`, { headers }).pipe(
    timeout(this.defaultTimeout),
    retry(1),
    catchError(this.handleError)
  );
}


  /**
   * Get all invoices
   * @returns Observable of invoice array
   */
  getAllInvoices(): Observable<Invoice[]> {
    const headers = this.getHeaders();

    return this.http.get<ApiResponse<Invoice[]>>(this.baseUrl, { headers })
      .pipe(
        timeout(this.defaultTimeout),
        retry(1),
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to fetch invoices');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Update an existing invoice
   * @param id Invoice ID
   * @param invoice Invoice update request
   * @returns Observable of updated invoice
   */
  updateInvoice(id: number, invoice: InvoiceCreateRequest): Observable<Invoice> {
    const headers = this.getHeaders();

    return this.http.put<ApiResponse<Invoice>>(`${this.baseUrl}/${id}`, invoice, { headers })
      .pipe(
        timeout(this.defaultTimeout),
        retry(2),
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to update invoice');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Delete an invoice
   * @param id Invoice ID
   * @returns Observable of void
   */
  deleteInvoice(id: number): Observable<void> {
    const headers = this.getHeaders();

    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`, { headers })
      .pipe(
        timeout(this.defaultTimeout),
        retry(1),
        map(response => {
          if (response.success) {
            return;
          }
          throw new Error(response.message || 'Failed to delete invoice');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get HTTP headers with content type
   * @returns HttpHeaders
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  /**
   * Handle HTTP errors
   * @param error HttpErrorResponse
   * @returns Observable error
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Network Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
          break;
        case 400:
          errorMessage = this.extractValidationErrors(error.error) || 'Bad Request - Please check your input data';
          break;
        case 401:
          errorMessage = 'Unauthorized - Please log in again';
          break;
        case 403:
          errorMessage = 'Forbidden - You do not have permission to perform this action';
          break;
        case 404:
          errorMessage = error.error?.message || 'Resource not found';
          break;
        case 409:
          errorMessage = 'Conflict - The resource already exists or has been modified';
          break;
        case 422:
          errorMessage = this.extractValidationErrors(error.error) || 'Validation failed - Please check your input data';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later or contact support.';
          break;
        case 502:
          errorMessage = 'Bad Gateway - The server is temporarily unavailable';
          break;
        case 503:
          errorMessage = 'Service Unavailable - The server is temporarily down for maintenance';
          break;
        case 504:
          errorMessage = 'Gateway Timeout - The request took too long to process';
          break;
        default:
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else {
            errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
          }
      }
    }

    console.error('Invoice Service Error:', {
      status: error.status,
      message: errorMessage,
      url: error.url,
      error: error.error
    });

    return throwError(() => new HttpErrorResponse({
      error: error.error,
      status: error.status,
      statusText: error.statusText,
      url: error.url ?? undefined
    }));
  }

  /**
   * Extract validation errors from API response
   * @param errorResponse API error response
   * @returns Formatted error message
   */
  private extractValidationErrors(errorResponse: any): string {
    if (typeof errorResponse === 'string') {
      return errorResponse;
    }

    if (errorResponse?.message) {
      return errorResponse.message;
    }

    if (errorResponse?.errors) {
      const errors: string[] = [];

      if (Array.isArray(errorResponse.errors)) {
        return errorResponse.errors.join(', ');
      }

      // Handle ModelState errors from .NET API
      for (const key in errorResponse.errors) {
        if (errorResponse.errors[key]) {
          if (Array.isArray(errorResponse.errors[key])) {
            errors.push(...errorResponse.errors[key]);
          } else {
            errors.push(errorResponse.errors[key]);
          }
        }
      }

      return errors.length > 0 ? errors.join(', ') : 'Validation failed';
    }

    if (errorResponse?.title) {
      return errorResponse.title;
    }

    return 'Validation failed';
  }

  /**
   * Check if the service is available
   * @returns Observable of boolean
   */
  checkServiceHealth(): Observable<boolean> {
    return this.http.get<any>(`${environment.apiUrl}/health`)
      .pipe(
        timeout(5000),
        map(() => true),
        catchError(() => throwError(() => new Error('Service is not available')))
      );
  }
}