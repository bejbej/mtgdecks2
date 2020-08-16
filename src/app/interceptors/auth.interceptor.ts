import * as app from "@app";
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (request.url === app.config.authClients.google.authUrl) {
            request = request.clone({
                body: {
                    code: request.body.oauthData.code,
                    clientId: request.body.authorizationData.client_id,
                    redirectUri: request.body.authorizationData.redirect_uri
                }
            });
        }

        return next.handle(request);
    }
}