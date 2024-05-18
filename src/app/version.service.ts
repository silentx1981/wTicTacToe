import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VersionService {

  private versionUrl = 'assets/version.txt';

  constructor(private http: HttpClient) { }

  getVersion(): Observable<string> {
    return this.http.get(this.versionUrl, { responseType: 'text' });
  }
}
