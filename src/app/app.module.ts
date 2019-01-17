import { AppComponent } from "src/app//app.component";
import { AppRoutingModule } from "src/app//app-routing.module";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from '@angular/forms';
import * as app from "@app";
import { GoogleLoginProvider, AuthServiceConfig, SocialLoginModule } from "angularx-social-login";

let authConfig = new AuthServiceConfig([
    {
      id: "google",
      provider: new GoogleLoginProvider(app.config.authClients.google.clientId)
    }
]);

@NgModule({
    declarations: [
        AppComponent,
        // Components
        app.AuthComponent,
        app.CardGroupComponent,
        app.CardViewComponent,
        app.DeckComponent,
        app.DecksComponent,
        app.LargeSpinner,
        app.NotfoundComponent,
        app.SpinnerComponent,
        app.StatsComponent,
        // Directives
        app.AllowTabsDirective,
        app.AutosizeDirective,
        app.CardPreviewDirective,
        app.DebounceDirective,
        app.LightboxDirective,
    ],
    imports: [
        AppRoutingModule,
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        SocialLoginModule,
        HttpClientModule
    ],
    providers: [{
        provide: HTTP_INTERCEPTORS,
        useClass: app.AuthInterceptor,
        multi: true
      },
      {
        provide: AuthServiceConfig,
        useFactory: () => {
            return authConfig;
        }
      }],
    bootstrap: [AppComponent]
})
export class AppModule { }
