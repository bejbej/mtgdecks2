import * as app from "@app";
import { AppComponent } from "src/app//app.component";
import { AppRoutingModule } from "src/app//app-routing.module";
import { BrowserModule } from "@angular/platform-browser";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { FormsModule } from "@angular/forms";
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { Ng2UiAuthModule } from "ng2-ui-auth";
import { NgModule } from "@angular/core";

@NgModule({
    declarations: [
        AppComponent,
        // Components
        app.AuthComponent,
        app.CardGroupComponent,
        app.CardViewComponent,
        app.DeckComponent,
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
    imports: [
        AppRoutingModule,
        BrowserModule,
        DragDropModule,
        FormsModule,
        HttpClientModule,
        Ng2UiAuthModule.forRoot({
            providers: {
                google: {
                    clientId: app.config.authClients.google.clientId,
                    url: app.config.authClients.google.authUrl
                }
            }
        })
    ],
    providers: [{
        provide: HTTP_INTERCEPTORS,
        useClass: app.AuthInterceptor,
        multi: true
      }],
    bootstrap: [AppComponent]
})
export class AppModule { }
