import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { config } from "@config";
import { Observable } from "rxjs";
import { Identity } from "../services/auth.service";
import { LocalStorageService } from "../services/local-storage.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    private localStorageService = inject(LocalStorageService);

    public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!this.isAuthorizationRequired(request.url)) {
            return next.handle(request);
        }

        const identity = this.localStorageService.getObject<Identity>(config.localStorage.identity);

        if (identity === null) {
            return next.handle(request);
        }

        const header = "Bearer " + identity.accessToken;
        const headers = request.headers.set("Authorization", header);
        const updatedRequest = request.clone({ headers });

        return next.handle(updatedRequest);
    }

    private isAuthorizationRequired(url: string): boolean {
        return url.toLowerCase().startsWith(config.decksUrl.toLowerCase());
    }
}