import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PositionsmappingService {

  private url = 'assets/positionsmapping.txt';

  constructor(private http: HttpClient) { }

  get(): Observable<string> {
    return this.http.get(this.url, { responseType: 'text' });
  }
}
