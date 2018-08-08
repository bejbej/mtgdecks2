import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { RouterModule } from "@angular/router";
import * as app from "@app";

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
    RouterModule.forRoot(routes, { useHash: true })
  ],
  exports: [
    RouterModule
  ],
  declarations: []
})
export class AppRoutingModule { }
