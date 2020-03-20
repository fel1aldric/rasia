import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap, map } from 'rxjs/operators';

const httpOptions = {
  headers: new HttpHeaders({'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'})
};

@Injectable({
  providedIn: 'root'
})
export class MessageService {
	constructor(private http: HttpClient) {
	}
	private handleError(error: HttpErrorResponse) {
	    if (error.error instanceof ErrorEvent) { 
	      console.error('An error occurred:', error.error.message);
	    } else {
	      console.error(
	        `Backend returned code ${error.status}, ` +
	        `body was: ${error.error}`);
	    }
	    return throwError('Something bad happened; please try again later.');
	}
	private extractData(res: Response) {
	    let body = res;
	    return body || { };
	}
	postMessage(data, urlserv): Observable<any> {
	    const url =  `${urlserv}`;
	    return this.http.post(url, data, httpOptions)
	      .pipe(
	      	map(this.extractData),
	        catchError(this.handleError)
	      );
	}
}
