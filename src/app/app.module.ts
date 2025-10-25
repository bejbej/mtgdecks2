import { DragDropModule } from "@angular/cdk/drag-drop";
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { OAuthModule, OAuthStorage } from "angular-oauth2-oidc";
import { AppRoutingModule } from "src/app//app-routing.module";
import { AppComponent } from "src/app//app.component";
import { AuthComponent } from "./components/auth/auth.component";
import { LargeSpinner } from "./components/large-spinner/large-spinner.component";
import { SpinnerComponent } from "./components/spinner/spinner.component";
import { AllowTabsDirective } from "./directives/allow-tabs.directive";
import { AutocompleteCardNameDirective } from "./directives/autocomplete-card-name.directive";
import { AutosizeDirective } from "./directives/autosize.directive";
import { CardPreviewDirective } from "./directives/card-preview.directive";
import { DebounceDirective } from "./directives/debounce.directive";
import { LightboxDirective } from "./directives/lightbox.directive";
import { AuthInterceptor } from "./interceptors/auth.interceptor";
import { CardColumnsComponent } from "./pages/deck/card-columns/card-columns.component";
import { CardGroupComponent } from "./pages/deck/card-group/card-group.component";
import { DeckInfoComponent } from "./pages/deck/deck-info/deck-info.component";
import { DeckComponent } from "./pages/deck/deck.component";
import { EditCardGroupsComponent } from "./pages/deck/edit-card-groups/edit-card-groups.component";
import { StatsComponent } from "./pages/deck/stats/stats.component";
import { DecksComponent } from "./pages/decks/decks.component";
import { NotfoundComponent } from "./pages/not-found/not-found.component";
import { LocalStorageService } from "./services/local-storage.service";

@NgModule({
    declarations: [
        AppComponent,
        // Components
        AuthComponent,
        CardGroupComponent,
        CardColumnsComponent,
        DeckComponent,
        DeckInfoComponent,
        DecksComponent,
        EditCardGroupsComponent,
        LargeSpinner,
        NotfoundComponent,
        SpinnerComponent,
        StatsComponent,
        // Directives
        AllowTabsDirective,
        AutocompleteCardNameDirective,
        AutosizeDirective,
        CardPreviewDirective,
        DebounceDirective,
        LightboxDirective,
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
            useClass: AuthInterceptor,
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
