/**
 * Data Service
 * Service for handling data operations
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

// Missing interface definitions
@Injectable({
  providedIn: 'root'
})
export class DataService {
  // Missing type annotation
  private apiUrl = 'https://api.example.com';
  
  // Any type
  private config: any = {};
  
  constructor(private http: HttpClient) {
    this.loadConfig();
  }
  
  // Missing return type
  private loadConfig() {
    this.http.get(`${this.apiUrl}/config`)
      .subscribe(data => {
        this.config = data;
      });
  }
  
  // Any parameter and return type
  getData(params: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/data`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }
  
  // Any parameter and return type
  saveData(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/data`, data)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  // Any parameter and return type
  updateData(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/data/${id}`, data)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  // Any parameter and return type
  deleteData(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/data/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  // Any parameter and return type
  private handleError(error: any): Observable<any> {
    console.error('API error', error);
    return throwError('An error occurred. Please try again later.');
  }
  
  // Large nested loops
  processNestedData(categories) {
    const results = [];
    
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      
      for (let j = 0; j < category.items.length; j++) {
        const item = category.items[j];
        
        for (let k = 0; k < item.subItems.length; k++) {
          const subItem = item.subItems[k];
          results.push(this.processItem(subItem));
        }
      }
    }
    
    return results;
  }
  
  // Any parameter and return type
  private processItem(item: any): any {
    return {
      id: item.id,
      name: item.name,
      processed: true,
      timestamp: new Date()
    };
  }
}
