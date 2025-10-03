/**
 * Sample TypeScript file with issues for testing
 */

// Missing type annotations
function processData(data) {
  return data.map(item => item.value);
}

// Any type usage
function handleRequest(req: any): any {
  return {
    status: 'success',
    data: req.data
  };
}

// Unused imports
import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, from, Subject } from 'rxjs';
import { map, filter, catchError, mergeMap } from 'rxjs/operators';

// Component with missing types
class DataProcessor implements OnInit {
  // Missing type annotation
  private apiUrl = 'https://api.example.com';
  
  // Any type
  private config: any = {};
  
  constructor(private http: HttpClient) {}
  
  ngOnInit() {
    this.loadConfig();
  }
  
  // Missing return type
  private loadConfig() {
    this.http.get(this.apiUrl + '/config')
      .subscribe(data => {
        this.config = data;
      });
  }
  
  // Any parameter and return type
  public processItem(item: any): any {
    return {
      id: item.id,
      name: item.name,
      processed: true
    };
  }
  
  // Large nested loops
  public processItems(categories) {
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
}
