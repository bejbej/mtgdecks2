import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { DeckComponent } from "./pages/deck/deck.component";
import { DecksComponent } from "./pages/decks/decks.component";
import { NotfoundComponent } from "./pages/not-found/not-found.component";

const routes: Routes = [
  {
    path: "",
    redirectTo: "decks",
    pathMatch: "full"
  },
  {
    path: "decks",
    component: DecksComponent
  },
  {
    path: "decks/:id",
    component: DeckComponent
  },
  {
    path: "**",
    component: NotfoundComponent,
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
