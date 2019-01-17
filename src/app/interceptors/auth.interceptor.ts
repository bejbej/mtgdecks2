import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as app from "@app";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    private tokenKey = app.config.localStorage.token;

    constructor(private authService: app.AuthService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let token = localStorage.getItem(this.tokenKey);

        if (token != null) {
            request = request.clone({
                setHeaders: {
                    "Authorization": "Bearer " + token
                }
            });
        }

        return next.handle(request).pipe(catchError(event => {
            if (event instanceof HttpErrorResponse && event.status === 401) {
                this.authService.signOut();
            }
            throw event;
        }));
    }
}