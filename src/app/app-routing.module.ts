import * as app from "@app";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { Routes } from "@angular/router";

const routes: Routes = [
  {
    path: "",
    redirectTo: "decks",
    pathMatch: "full"
  },
  {
    path: "decks",
    component: app.DecksComponent
  },
  {
    path: "decks/:id",
    component: app.DeckComponent
  },
  {
    path: "**",
    component: app.NotfoundComponent,
    pathMatch: "full"
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { useHash: true, relativeLinkResolution: 'legacy' })
  ],
  exports: [
    RouterModule
  ],
  declarations: []
})
export class AppRoutingModule { }
