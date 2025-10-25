import { DragDropModule } from "@angular/cdk/drag-drop";
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import * as app from "@app";
import { OAuthModule, OAuthStorage } from "angular-oauth2-oidc";
import { AppRoutingModule } from "src/app//app-routing.module";
import { AppComponent } from "src/app//app.component";
import { LocalStorageService } from "./services/local-storage.service";

@NgModule({
    declarations: [
        AppComponent,
        // Components
        app.AuthComponent,
        app.CardGroupComponent,
        app.CardColumnsComponent,
        app.DeckComponent,
        app.DeckInfoComponent,
        app.DecksComponent,
        app.EditCardGroupsComponent,
        app.LargeSpinner,
        app.NotfoundComponent,
        app.SpinnerComponent,
        app.StatsComponent,
        // Directives
        app.AllowTabsDirective,
        app.AutocompleteCardNameDirective,
        app.AutosizeDirective,
        app.CardPreviewDirective,
        app.DebounceDirective,
        app.LightboxDirective,
    ],
    bootstrap: [AppComponent],
    imports: [
        AppRoutingModule,
        BrowserModule,
        DragDropModule,
        FormsModule,
        OAuthModule.forRoot()
    ],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: app.AuthInterceptor,
            multi: true
        },
        provideHttpClient(withInterceptorsFromDi()),
        {
            provide: OAuthStorage,
            useExisting: LocalStorageService
        }
    ]
})
export class AppModule { }
